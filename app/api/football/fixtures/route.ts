import { NextRequest, NextResponse } from 'next/server';

interface Fixture {
  id: number;
  date: string;
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  league: string;
  season: number;
  round: string;
  status: string;
  score?: {
    home: number;
    away: number;
  };
}

interface APIFootballFixture {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    timezone: string;
    week: number | null;
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
    league: {
      id: number;
      name: string;
      country: string;
      logo: string;
      flag: string;
      season: number;
      round: string;
    };
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const league = searchParams.get('league') || 'FR'; // FR = Ligue 1
    const season = searchParams.get('season') || new Date().getFullYear().toString();
    const round = searchParams.get('round'); // Optional: filter by round

    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API-Football key not configured' },
        { status: 500 }
      );
    }

    // Build API-Football URL
    let url = `https://api-football-v1.p.rapidapi.com/v3/fixtures?league=${league}&season=${season}`;
    if (round) {
      url += `&round=${round}`;
    }

    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      throw new Error(`API-Football error: ${response.status}`);
    }

    const data = await response.json();

    // Transform API-Football response to our format
    const fixtures: Fixture[] = data.response.map((item: APIFootballFixture) => ({
      id: item.fixture.id,
      date: item.fixture.date,
      homeTeam: {
        id: item.teams.home.id,
        name: item.teams.home.name,
        logo: item.teams.home.logo,
      },
      awayTeam: {
        id: item.teams.away.id,
        name: item.teams.away.name,
        logo: item.teams.away.logo,
      },
      league: item.fixture.league.name,
      season: item.fixture.league.season,
      round: item.fixture.league.round,
      status: item.fixture.status.short,
      score:
        item.goals.home !== null && item.goals.away !== null
          ? {
              home: item.goals.home,
              away: item.goals.away,
            }
          : undefined,
    }));

    return NextResponse.json({
      success: true,
      data: {
        league,
        season,
        fixtures,
        count: fixtures.length,
      },
    });
  } catch (error) {
    console.error('Football fixtures error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch fixtures',
      },
      { status: 500 }
    );
  }
}
