import { NextRequest, NextResponse } from 'next/server';

interface StandingEntry {
  rank: number;
  team: { name: string; logo: string };
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  form?: string;
}

interface RawStandingItem {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  form: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
}

const PRO_LEAGUE_IDS: Record<string, number> = {
  ligue1: 61,
  ligue2: 62,
  national: 63,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const league = searchParams.get('league') || 'ligue1';
    const season = searchParams.get('season') || new Date().getFullYear().toString();

    // Amateur leagues — no RapidAPI coverage
    if (league === 'national2' || league === 'regional') {
      return NextResponse.json({
        success: true,
        data: {
          league,
          standings: [],
          amateur: true,
          note: 'Classements amateurs disponibles sur epreuves.fff.fr',
        },
      });
    }

    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API-Football key not configured' },
        { status: 500 }
      );
    }

    const leagueId = PRO_LEAGUE_IDS[league];
    if (!leagueId) {
      return NextResponse.json({ success: false, error: 'Unknown league' }, { status: 400 });
    }

    const response = await fetch(
      `https://api-football-v1.p.rapidapi.com/v3/standings?league=${leagueId}&season=${season}`,
      {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
        },
        next: { revalidate: 3600 }, // cache 1h
      }
    );

    if (!response.ok) {
      throw new Error(`API-Football error: ${response.status}`);
    }

    const data = await response.json();
    const standingsRaw: RawStandingItem[] =
      data.response?.[0]?.league?.standings?.[0] || [];

    const standings: StandingEntry[] = standingsRaw.map((item) => ({
      rank: item.rank,
      team: { name: item.team.name, logo: item.team.logo },
      points: item.points,
      played: item.all.played,
      won: item.all.win,
      drawn: item.all.draw,
      lost: item.all.lose,
      goalsFor: item.all.goals.for,
      goalsAgainst: item.all.goals.against,
      goalDiff: item.goalsDiff,
      form: item.form,
    }));

    return NextResponse.json({
      success: true,
      data: { league, season, standings, count: standings.length },
    });
  } catch (error) {
    console.error('Standings error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch standings',
      },
      { status: 500 }
    );
  }
}
