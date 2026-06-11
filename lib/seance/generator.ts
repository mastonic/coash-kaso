/**
 * Génération de séance — IA (Gemini) avec repli sur la bibliothèque intégrée.
 *
 * La séance IA est validée phase par phase : tout champ manquant ou schéma
 * invalide est remplacé par l'équivalent de la bibliothèque, de sorte que la
 * réponse est TOUJOURS une séance complète et affichable.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PhaseSeance, Seance, SeanceParams } from './schema';
import { normalisePhase, themeLabel } from './schema';
import { buildSeance } from './library';

const MODEL = 'gemini-2.5-flash';

function exempleSchema(): string {
  return JSON.stringify({
    terrain: { longueur: 30, largeur: 25 },
    joueurs: [
      { x: 20, y: 30, equipe: 'A', label: 'A1' },
      { x: 20, y: 70, equipe: 'A' },
      { x: 60, y: 50, equipe: 'B' },
      { x: 50, y: 5, equipe: 'J', label: 'Joker' },
      { x: 97, y: 50, equipe: 'G', label: 'GB' },
    ],
    plots: [
      { x: 2, y: 3, couleur: 'jaune' },
      { x: 98, y: 3, couleur: 'jaune' },
      { x: 2, y: 97, couleur: 'jaune' },
      { x: 98, y: 97, couleur: 'jaune' },
    ],
    ballons: [{ x: 23, y: 33 }],
    buts: [{ x: 99, y: 50, taille: 'grand', orientation: 'droite' }],
    zones: [{ x: 0, y: 0, largeur: 33, hauteur: 100, label: 'Zone pressing' }],
    fleches: [
      { de: { x: 20, y: 30 }, vers: { x: 20, y: 70 }, type: 'passe' },
      { de: { x: 20, y: 70 }, vers: { x: 45, y: 60 }, type: 'conduite' },
      { de: { x: 45, y: 60 }, vers: { x: 95, y: 50 }, type: 'tir' },
      { de: { x: 60, y: 50 }, vers: { x: 50, y: 55 }, type: 'deplacement' },
    ],
  });
}

function buildPrompt(p: SeanceParams): string {
  return `Tu es un éducateur de football diplômé (BMF/BEF) qui prépare ses séances selon la méthodologie FFF.
Conçois une séance complète en FRANÇAIS pour :
- Catégorie : ${p.categorie}
- Thème : ${themeLabel(p.theme)}
- Effectif : ${p.effectif} joueurs
- Durée totale : ${p.duree} minutes
- Charge du jour : ${p.charge}

STRUCTURE OBLIGATOIRE (méthodologie FFF) — exactement 4 phases dans cet ordre :
1. "echauffement" — mise en train avec ballon
2. "jeu" ou "exercice" — premier procédé d'entraînement sur le thème
3. "situation" ou "exercice" — deuxième procédé, plus proche du match
4. "match" — jeu final libre à thème

Chaque phase est une FICHE D'EXERCICE FFF complète :
- titre, duree (minutes, somme des 4 phases ≈ ${p.duree - 5}), objectif (pour l'éducateur),
  but (la cible concrète pour les joueurs), effectif (organisation humaine, ex "2 équipes de 4 + 2 jokers"),
  materiel, consignes (3-5 règles de fonctionnement), variantes (2 : une plus simple, une plus difficile),
  criteresReussite (2-3 critères observables et chiffrés),
- schema : le SCHÉMA TACTIQUE du plan de l'exercice, au format JSON STRICT suivant
  (coordonnées x,y en % de l'espace : x=0 gauche, x=100 droite, y=0 haut, y=100 bas) :
${exempleSchema()}

Règles du schéma :
- terrain.longueur / terrain.largeur = dimensions RÉELLES en mètres de l'espace de travail, adaptées à la catégorie ${p.categorie}.
- equipe : "A" (bleus), "B" (rouges), "J" (joker jaune), "G" (gardien).
- fleches.type : "passe" (trajectoire du ballon), "deplacement" (course sans ballon), "conduite" (dribble/conduite de balle), "tir".
- Place TOUS les éléments nécessaires : joueurs des deux équipes, plots délimitant l'espace, ballon(s), buts si l'exercice en utilise, zones si pertinent.
- Le schéma doit raconter UNE action type de l'exercice (2 à 5 flèches cohérentes).
- Maximum ${p.effectif} joueurs par schéma (gardiens compris).

Adapte contenus, espaces et vocabulaire à la catégorie ${p.categorie} (espaces réduits et consignes simples pour les plus jeunes).

Réponds UNIQUEMENT avec ce JSON (aucun texte autour) :
{
  "titre": string,
  "objectif": string,
  "materiel": string,
  "phases": [ { "procede": "echauffement"|"jeu"|"exercice"|"situation"|"match", "titre": string, "duree": number, "objectif": string, "but": string, "effectif": string, "materiel": string, "consignes": string[], "variantes": string[], "criteresReussite": string[], "schema": {...} }, ... 4 phases ... ],
  "retourAuCalme": string,
  "conseilsCoach": string[]
}`;
}

function cleanJson(text: string): string {
  let s = text.trim();
  if (s.includes('```')) {
    const m = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) s = m[1].trim();
  }
  // Coupe tout ce qui précède la première accolade / suit la dernière
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return s;
}

export interface GenerationResult {
  seance: Seance;
  /** 'ia' = générée par Gemini, 'bibliotheque' = repli hors-ligne */
  source: 'ia' | 'bibliotheque';
}

/**
 * Fusionne la réponse IA avec la séance bibliothèque : chaque phase IA est
 * normalisée, et la phase bibliothèque correspondante sert de filet de
 * sécurité champ par champ.
 */
function mergeWithFallback(raw: unknown, fallback: Seance): Seance {
  if (!raw || typeof raw !== 'object') return fallback;
  const d = raw as Record<string, unknown>;

  const phasesRaw = Array.isArray(d.phases) ? d.phases : [];
  const phases: PhaseSeance[] = fallback.phases.map((fb, i) =>
    normalisePhase(phasesRaw[i], fb)
  );

  const strOr = (v: unknown, fb: string) =>
    typeof v === 'string' && v.trim() ? v.trim() : fb;

  return {
    ...fallback,
    titre: strOr(d.titre, fallback.titre),
    objectif: strOr(d.objectif, fallback.objectif),
    materiel: strOr(d.materiel, fallback.materiel),
    phases,
    retourAuCalme: strOr(d.retourAuCalme, fallback.retourAuCalme),
    conseilsCoach:
      Array.isArray(d.conseilsCoach) && d.conseilsCoach.length
        ? d.conseilsCoach.filter((c): c is string => typeof c === 'string')
        : fallback.conseilsCoach,
  };
}

export async function generateSeance(
  params: SeanceParams
): Promise<GenerationResult> {
  const fallback = buildSeance(params);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { seance: fallback, source: 'bibliotheque' };
  }

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.8,
        maxOutputTokens: 16384,
      },
    });

    const result = await model.generateContent(buildPrompt(params));
    const parsed = JSON.parse(cleanJson(result.response.text()));
    return { seance: mergeWithFallback(parsed, fallback), source: 'ia' };
  } catch (error) {
    console.error('Génération IA échouée, repli bibliothèque :', error);
    return { seance: fallback, source: 'bibliotheque' };
  }
}
