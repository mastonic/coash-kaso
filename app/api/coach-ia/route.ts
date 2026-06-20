import { NextRequest, NextResponse } from 'next/server';
import {
  genererCauserie,
  genererCycle,
  genererDebrief,
  type CauserieParams,
  type CycleParams,
  type DebriefParams,
} from '@/lib/coach-ia';

export const maxDuration = 120;

const TONS = ['motivant', 'calme', 'exigeant'] as const;

function s(v: unknown, max = 600): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function n(v: unknown, fallback: number, min: number, max: number): number {
  const x = Number(v);
  return Number.isFinite(x) ? Math.min(max, Math.max(min, Math.round(x))) : fallback;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const tool = s(body.tool, 20);

    if (tool === 'causerie') {
      const params: CauserieParams = {
        adversaire: s(body.adversaire, 80),
        enjeu: s(body.enjeu, 120),
        categorie: s(body.categorie, 20),
        contexte: s(body.contexte, 600),
        ton: TONS.includes(body.ton as (typeof TONS)[number])
          ? (body.ton as CauserieParams['ton'])
          : 'motivant',
      };
      const { causerie, source } = await genererCauserie(params);
      return NextResponse.json({ success: true, data: causerie, source });
    }

    if (tool === 'cycle') {
      const params: CycleParams = {
        objectif: s(body.objectif, 200),
        semaines: n(body.semaines, 4, 2, 12),
        categorie: s(body.categorie, 20) || 'Seniors',
        effectif: n(body.effectif, 14, 4, 30),
      };
      const { cycle, source } = await genererCycle(params);
      return NextResponse.json({ success: true, data: cycle, source });
    }

    if (tool === 'debrief') {
      const params: DebriefParams = {
        adversaire: s(body.adversaire, 80),
        scoreEquipe: n(body.scoreEquipe, 0, 0, 99),
        scoreAdverse: n(body.scoreAdverse, 0, 0, 99),
        observations: s(body.observations, 1000),
        categorie: s(body.categorie, 20),
      };
      const { debrief, source } = await genererDebrief(params);
      return NextResponse.json({ success: true, data: debrief, source });
    }

    return NextResponse.json(
      { success: false, error: 'Outil inconnu (causerie, cycle ou debrief)' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erreur Coach IA :', error);
    return NextResponse.json(
      { success: false, error: 'La génération a échoué, réessayez.' },
      { status: 500 }
    );
  }
}
