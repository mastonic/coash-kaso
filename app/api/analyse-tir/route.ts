import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 120;

/**
 * Coach de Tir — analyse vidéo d'une frappe au but.
 *
 * Gemini Vision joue le rôle du pipeline de vision (détection ballon/but/
 * joueur + angles du corps) et rend une télémétrie structurée : résultat,
 * vitesse et distance estimées, notes biomécaniques par critère, corrections
 * et exercices. Nécessite GEMINI_API_KEY (pas de repli possible : on ne peut
 * pas inventer l'analyse d'une vidéo qu'on n'a pas vue).
 */

export interface CritereTir {
  nom: string;
  note: number;
  observation: string;
  correction: string;
}

export interface AnalyseTir {
  resultat: 'but' | 'rate' | 'arrete' | 'indetermine';
  vitesseEstimee: number | null;
  distanceEstimee: number | null;
  trajectoire: string;
  criteres: CritereTir[];
  noteGlobale: number;
  pointFort: string;
  prioriteTravail: string;
  exercices: string[];
}

const CRITERES_DEFAUT = [
  "Course d'élan",
  "Pied d'appui",
  'Surface de contact',
  'Posture & équilibre',
  'Accompagnement du geste',
  'Regard & prise d’info',
];

function clampNote(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(10, Math.max(0, Math.round(n * 10) / 10)) : 5;
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

function numOrNull(v: unknown, min: number, max: number): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : null;
}

function normalise(raw: unknown): AnalyseTir | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;

  const criteresRaw = Array.isArray(d.criteres) ? d.criteres : [];
  const criteres: CritereTir[] = CRITERES_DEFAUT.map((nom, i) => {
    const c = criteresRaw[i] as Record<string, unknown> | undefined;
    return {
      nom: str(c?.nom, nom),
      note: clampNote(c?.note),
      observation: str(c?.observation, 'Non observable sur cette vidéo.'),
      correction: str(c?.correction, '—'),
    };
  });

  const resultat = ['but', 'rate', 'arrete', 'indetermine'].includes(d.resultat as string)
    ? (d.resultat as AnalyseTir['resultat'])
    : 'indetermine';

  return {
    resultat,
    vitesseEstimee: numOrNull(d.vitesseEstimee, 10, 160),
    distanceEstimee: numOrNull(d.distanceEstimee, 1, 60),
    trajectoire: str(d.trajectoire, 'Trajectoire non déterminée.'),
    criteres,
    noteGlobale: clampNote(d.noteGlobale),
    pointFort: str(d.pointFort, 'Engagement dans la frappe.'),
    prioriteTravail: str(d.prioriteTravail, 'Répéter le geste à vitesse réduite pour stabiliser la technique.'),
    exercices: Array.isArray(d.exercices)
      ? d.exercices.filter((e): e is string => typeof e === 'string' && !!e.trim()).slice(0, 4)
      : [],
  };
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "L'analyse de tir nécessite l'IA vidéo (GEMINI_API_KEY non configurée sur ce déploiement).",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const videoBase64 = typeof body.videoBase64 === 'string' ? body.videoBase64 : '';
    const mimeType =
      typeof body.mimeType === 'string' && body.mimeType.startsWith('video/')
        ? body.mimeType
        : 'video/mp4';
    const contexte = typeof body.contexte === 'string' ? body.contexte.slice(0, 300) : '';

    if (!videoBase64 || videoBase64.length < 1000) {
      return NextResponse.json(
        { success: false, error: 'Vidéo manquante ou invalide.' },
        { status: 400 }
      );
    }

    const prompt = `Tu es un coach de football spécialiste de la biomécanique du tir, équipé d'un pipeline de vision par ordinateur (détection ballon/but/joueur, angles du corps, estimation de profondeur).
Analyse cette vidéo d'une frappe au but${contexte ? ` (contexte donné par le coach : ${contexte})` : ''}.

Ta mission :
1. RÉSULTAT : le ballon finit-il au fond ("but"), à côté/au-dessus ("rate"), arrêté par un gardien/obstacle ("arrete"), ou impossible à dire ("indetermine") ?
2. TÉLÉMÉTRIE : estime la vitesse du ballon en km/h (ordre de grandeur réaliste d'après le déplacement entre les frames) et la distance frappe → ligne de but en mètres. Mets null si la vidéo ne permet pas d'estimer.
3. TRAJECTOIRE : décris-la en une phrase (enroulée, tendue, flottante, hauteur, côté visé…).
4. BIOMÉCANIQUE : note de 0 à 10 chacun de ces 6 critères, dans CET ORDRE, avec une observation précise de CE QUE TU VOIS et une correction concrète :
   1. Course d'élan (angle d'approche, rythme, dernière foulée)
   2. Pied d'appui (placement par rapport au ballon, orientation vers la cible, flexion)
   3. Surface de contact (cou-de-pied/intérieur, zone du ballon frappée, cheville verrouillée)
   4. Posture & équilibre (inclinaison du tronc, épaules, bras équilibrateurs)
   5. Accompagnement du geste (jambe qui poursuit vers la cible, transfert du poids)
   6. Regard & prise d'info (regard ballon/cible, tête stable)
5. SYNTHÈSE : note globale /10, LE point fort à conserver, LA priorité de travail n°1.
6. EXERCICES : 3 exercices correctifs concrets et progressifs, faisables seul ou à deux.

Sois précis et honnête : si un élément n'est pas visible (cadrage, qualité), dis-le dans l'observation plutôt que d'inventer.
Tout en FRANÇAIS. Réponds UNIQUEMENT avec ce JSON :
{ "resultat": "but"|"rate"|"arrete"|"indetermine", "vitesseEstimee": number|null, "distanceEstimee": number|null, "trajectoire": string, "criteres": [{"nom": string, "note": number, "observation": string, "correction": string}, ...6 dans l'ordre...], "noteGlobale": number, "pointFort": string, "prioriteTravail": string, "exercices": [string, string, string] }`;

    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
        maxOutputTokens: 8192,
      },
    });

    const result = await model.generateContent([
      { inlineData: { mimeType, data: videoBase64 } },
      prompt,
    ]);

    let text = result.response.text().trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) text = text.slice(start, end + 1);

    const analyse = normalise(JSON.parse(text));
    if (!analyse) {
      return NextResponse.json(
        { success: false, error: "L'analyse n'a pas pu être structurée, réessayez." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, data: analyse });
  } catch (error) {
    console.error('Erreur analyse de tir :', error);
    return NextResponse.json(
      { success: false, error: "L'analyse a échoué. Vidéo trop longue ? Visez 5 à 15 secondes." },
      { status: 500 }
    );
  }
}
