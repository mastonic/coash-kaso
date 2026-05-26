import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export interface AmateurTeam {
  rank: number;
  name: string;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  points?: number;
}

function parseNumbers(cells: cheerio.Cheerio, $: cheerio.Root): number[] {
  const nums: number[] = [];
  cells.each((_, cell) => {
    const n = parseInt($(cell).text().trim(), 10);
    if (!isNaN(n)) nums.push(n);
  });
  return nums;
}

function extractTeams($: cheerio.CheerioAPI, selector: string): AmateurTeam[] {
  const teams: AmateurTeam[] = [];
  $(selector).each((idx, row) => {
    const cells = $(row).find('td');
    if (cells.length < 2) return;

    // Find team name: longest non-numeric, non-empty text cell
    let teamName = '';
    cells.each((_, cell) => {
      const text = $(cell).text().trim().replace(/\s+/g, ' ');
      if (
        text.length > teamName.length &&
        text.length > 2 &&
        isNaN(Number(text)) &&
        !/^\d{1,2}[/\-]\d{1,2}/.test(text) // skip date-like
      ) {
        teamName = text;
      }
    });

    if (!teamName) return;

    // Collect numbers in order (rank, Mj, V, N, D, Bp, Bc, Pts or similar)
    const nums = parseNumbers(cells, $);

    teams.push({
      rank: nums[0] ?? idx + 1,
      name: teamName,
      played: nums[1],
      won: nums[2],
      drawn: nums[3],
      lost: nums[4],
      goalsFor: nums[5],
      goalsAgainst: nums[6],
      points: nums[nums.length - 1] ?? nums[7],
    });
  });
  return teams;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return NextResponse.json({ success: false, error: 'Paramètre url manquant' }, { status: 400 });
  }

  // Basic SSRF guard: only allow fff.fr domains
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return NextResponse.json({ success: false, error: 'URL invalide' }, { status: 400 });
  }

  if (!parsed.hostname.endsWith('fff.fr')) {
    return NextResponse.json(
      { success: false, error: 'URL non autorisée — seules les pages fff.fr sont acceptées' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(rawUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Site non accessible (HTTP ${response.status})` },
        { status: 502 }
      );
    }

    const html = await response.text();

    // Detect JS-only page (no real content)
    if (html.length < 2000 || (html.match(/<td/gi) ?? []).length === 0) {
      return NextResponse.json({
        success: false,
        jsRendered: true,
        error: 'La page nécessite JavaScript — consultez directement epreuves.fff.fr',
      }, { status: 422 });
    }

    const $ = cheerio.load(html) as cheerio.CheerioAPI;

    // Try selectors from most specific to most generic
    const selectors = [
      'table.classement tbody tr',
      'table.ranking tbody tr',
      '.classement table tbody tr',
      '.poule-classement tbody tr',
      'table tbody tr',
    ];

    let teams: AmateurTeam[] = [];
    for (const sel of selectors) {
      teams = extractTeams($, sel);
      if (teams.length >= 2) break;
    }

    // Re-rank sequentially if ranks are missing/wrong
    teams = teams.map((t, i) => ({ ...t, rank: i + 1 }));

    return NextResponse.json({
      success: true,
      data: { teams, count: teams.length, source: rawUrl },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
