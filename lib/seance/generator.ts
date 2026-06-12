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
  return `Tu es un éducateur de football diplômé (BMF/BEF) expert en la méthodologie FFF.
Conçois une séance complète, RICHE EN DÉTAILS et CRÉATIVE en FRANÇAIS pour :
- Catégorie : ${p.categorie}
- Thème : ${themeLabel(p.theme)}
- Effectif : ${p.effectif} joueurs
- Durée totale : ${p.duree} minutes
- Charge du jour : ${p.charge}

STRUCTURE OBLIGATOIRE (méthodologie FFF) — exactement 4 phases dans cet ordre :
1. "echauffement" — mise en train avec ballon, progression progressive
2. "jeu" ou "exercice" — premier procédé d'entraînement structuré sur le thème
3. "situation" ou "exercice" — deuxième procédé, plus proche du contexte match
4. "match" — jeu final libre à thème, sans consignes restrictives

TITRE GLOBAL : crée un titre accrocheur et thématique pour toute la séance (ex "Les Maestros de la Possession", "Tir Gagnant", pas juste "Séance de Possession").

Chaque phase = FICHE FFF DÉTAILLÉE ET PROFESSIONNELLE :
- titre : nom explicite et motivant
- duree : minutes (somme ≈ ${p.duree - 5}), entre 5 et 45 min par phase
- objectif : l'INTENTION PÉDAGOGIQUE (pour toi, coach) — détaillé, explicite sur ce qu'on cherche à développer
- but : la CIBLE CONCRÈTE pour les joueurs (ex "marquer dans un des 2 mini-buts", "faire 5 passes sans perdre le ballon")
- effectif : organisation COMPLÈTE (ex "2 équipes de 5 + 1 gardien + 2 jokers offensifs", détaille les rôles)
- materiel : liste DÉTAILLÉE des équipements (nombre de ballons, plots, cones, chasubles, mini-buts, etc.)
- consignes : 4-6 règles DE FONCTIONNEMENT CLAIRES ET PROGRESSIVES (pas juste des rappels, mais des actions concrètes)
- variantes : TROIS VARIANTES PROGRESSIVES
  * Variante 1 : SIMPLIFIÉE (pour les moins à l'aise, plus d'aide, moins de pression)
  * Variante 2 : INTERMÉDIAIRE (ajuste la complexité : augmente la pression, réduit l'espace, ajoute des contraintes)
  * Variante 3 : AVANCÉE (défi maximal : moins d'espace, tempo plus rapide, règles additionnelles, plus proches du match)
- criteresReussite : 3-4 CRITÈRES SPÉCIFIQUES ET CHIFFRÉS (ex "80% de réussite au tir", "5 passes min avant de tirer", "défense qui repique en moins de 3 sec")
- conseilCoach : CONSEIL PRATIQUE pour toi (observation clé, ajustement possible, piège à éviter, points forts à valoriser)
- schema : SCHÉMA TACTIQUE du plan : disposition, mouvement type, action clé
  Format JSON STRICT (coordonnées x,y en % : x=0 gauche, x=100 droite, y=0 haut, y=100 bas) :
${exempleSchema()}

Règles du schéma tactique :
- terrain.longueur / terrain.largeur = dimensions RÉELLES en mètres, adaptées à ${p.categorie} (ex : U8 = petit terrain 20×15, Seniors = grand 40×30).
- equipe : "A" (bleus), "B" (rouges), "J" (joker jaune), "G" (gardien).
- fleches.type : "passe" (ballon), "deplacement" (course sans ballon), "conduite" (dribble), "tir".
- Inclure TOUS les éléments : joueurs, plots délimitant l'espace, ballon(s), buts, zones si pertinent.
- Une ACTION TYPIQUE cohérente : 2-5 flèches qui racontent une séquence réaliste de l'exercice.
- Max ${p.effectif} joueurs par schéma (gardiens compris).

CONTENU & TONALITÉ :
- Sois CRÉATIF ET VARIÉ : change les approches entre phases (pas la même structure 4× fois).
- DÉTAILLE CHAQUE CHAMP : descriptions longues, exemples concrets, explications pédagogiques.
- Utilise un ton MOTIVANT ET PROFESSIONNEL (langage de coach, pas de clichés).
- PROGRESSIVITÉ : chaque phase prépare la suivante, les variantes dessinent une progression claire.
- Pour la catégorie ${p.categorie} : adapte les ESPACES (+ petits pour jeunes), les DUREES (- longues), le VOCABULAIRE (simple mais précis).

Réponds UNIQUEMENT avec ce JSON valide (aucun texte autour, aucune accolade mal fermée) :
{
  "titre": string,
  "objectif": string,
  "materiel": string,
  "phases": [
    {
      "procede": "echauffement"|"jeu"|"exercice"|"situation"|"match",
      "titre": string,
      "duree": number,
      "objectif": string,
      "but": string,
      "effectif": string,
      "materiel": string,
      "consignes": string[],
      "variantes": string[],
      "criteresReussite": string[],
      "conseilCoach": string,
      "schema": {...}
    },
    ... 4 phases ...
  ],
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
