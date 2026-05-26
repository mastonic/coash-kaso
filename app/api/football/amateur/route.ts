import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface AmateurFixture {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  division: string;
  group: string;
  status: 'scheduled' | 'finished' | 'postponed';
  score?: {
    home: number;
    away: number;
  };
  referee?: string;
  venue?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const division = searchParams.get('division') || 'D1'; // D1, D2, D3, D4, etc.
    const group = searchParams.get('group'); // Optional group filter

    // Fetch epreuves.fff.fr data
    // Note: This is a simplified example - actual scraping may need adjustments
    // based on the current HTML structure of epreuves.fff.fr

    const epreuvesUrl = `https://epreuves.fff.fr/pages/${division}`;

    const response = await fetch(epreuvesUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      // Return empty fixtures if the page is not accessible
      // In production, you might want to cache this or use a fallback
      return NextResponse.json({
        success: true,
        data: {
          division,
          group: group || 'all',
          fixtures: [],
          count: 0,
          note: 'epreuves.fff.fr temporarily unavailable - try again later',
        },
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const fixtures: AmateurFixture[] = [];

    // Parse fixtures from the HTML
    // This selector may need to be adjusted based on actual HTML structure
    $('table tbody tr').each((index, row) => {
      try {
        const cells = $(row).find('td');
        if (cells.length < 5) return;

        const dateStr = $(cells[0]).text().trim();
        const homeTeam = $(cells[1]).text().trim();
        const awayTeam = $(cells[2]).text().trim();
        const scoreStr = $(cells[3]).text().trim();
        const groupText = $(cells[4]).text().trim();

        // Skip if no home/away team
        if (!homeTeam || !awayTeam) return;

        // Filter by group if specified
        if (group && !groupText.includes(group)) return;

        // Parse score
        let status: 'scheduled' | 'finished' | 'postponed' = 'scheduled';
        let score: { home: number; away: number } | undefined;

        if (scoreStr.includes('-')) {
          const [h, a] = scoreStr.split('-').map((s) => parseInt(s.trim()));
          if (!isNaN(h) && !isNaN(a)) {
            score = { home: h, away: a };
            status = 'finished';
          }
        } else if (scoreStr.toLowerCase().includes('reporté') || scoreStr.toLowerCase().includes('ajour')) {
          status = 'postponed';
        }

        fixtures.push({
          id: `${division}-${index}-${homeTeam}-${awayTeam}`,
          date: dateStr,
          homeTeam,
          awayTeam,
          division,
          group: groupText,
          status,
          score,
        });
      } catch (e) {
        // Skip rows with parsing errors
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        division,
        group: group || 'all',
        fixtures,
        count: fixtures.length,
        source: 'epreuves.fff.fr',
      },
    });
  } catch (error) {
    console.error('Amateur football error:', error);

    // Return empty fixtures on error instead of failing
    return NextResponse.json({
      success: true,
      data: {
        division: 'unknown',
        group: 'all',
        fixtures: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch amateur fixtures',
      },
    });
  }
}
