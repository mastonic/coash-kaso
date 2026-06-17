/**
 * Génération de séance — IA (Gemini) avec repli sur la bibliothèque intégrée.
 *
 * Deux modes :
 *  - generateSeance() : génère une séance complète d'un coup (mode classique).
 *  - generateDraft()  : génère 3 alternatives par phase, le coach choisit.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AlternativesPhase, PhaseSeance, Seance, SeanceDraft, SeanceParams } from './schema';
import { normalisePhase, themeLabel } from './schema';
import { buildDraftFallback, buildSeance } from './library';
import { ECOLES } from './schema';

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

function schemaInstructions(effectif: number): string {
  return `
RÈGLES DU SCHÉMA TACTIQUE (CRITIQUES — respecte-les à la lettre) :

1. JOUEURS : Exactement le bon nombre correspondant à l'effectif de la phase (≤ ${effectif}). Positions réalistes sur le terrain, pas tous empilés au centre.

2. DISPOSITION PAR PROCÉDÉ :
   - "echauffement" : joueurs dispersés sur tout le terrain, formes circulaires, géométriques ou en couloirs d'activation.
   - "jeu" : deux blocs distincts (équipe A vs équipe B), joueurs répartis en largeur et en profondeur, jokers aux périphéries.
   - "exercice" : colonnes ou ateliers, flèches montrant le circuit ballon/joueurs, plots délimitant les couloirs.
   - "situation" : attaquants d'un côté (30-45% du terrain), défenseurs de l'autre, gardien au but.
   - "match" : équipe A (x=5-45) vs équipe B (x=55-95), gardiens aux buts opposés, ballon au centre.

3. COHÉRENCE AVEC LE "BUT" : Le schéma doit illustrer exactement l'action principale décrite dans "but". Si "but" mentionne une passe + tir → les flèches montrent passe puis tir. Si "but" mentionne un pressing → les flèches montrent des déplacements défensifs vers le porteur.

4. FLÈCHES : Minimum 3 flèches formant une séquence réaliste et lisible (pas des flèches qui se croisent ou pointent hors terrain). Types : "passe" (ballon), "deplacement" (course sans ballon), "conduite" (dribble), "tir".

5. TERRAIN : Dimensions RÉELLES en mètres adaptées à la phase (échauffement petit = 12-20m, exercice technique = 15-25m, jeu/situation = 25-40m, match final = 40-60m).

6. ÉLÉMENTS OBLIGATOIRES selon le procédé :
   - Échauffement : plots aux coins minimum
   - Jeu/situation : plots délimitant l'espace + ballon(s)
   - Exercice : plots matérialisant le circuit + ballon
   - Match : buts (grand si ≥10 joueurs, mini sinon) + plots + ballon au centre

7. VARIÉTÉ (pour les alternatives) : Chaque option d'une même phase doit avoir une configuration DIFFÉRENTE — terrain différent (carré vs rectangle vs couloir), disposition différente, types de flèches différents.`;
}

function ecoleContext(p: SeanceParams): string {
  if (!p.ecole) return '';
  const ecole = ECOLES.find((e) => e.id === p.ecole);
  if (!ecole) return '';
  return `\n- École / style de jeu : ${ecole.label} — ${ecole.description}
  → Les exercices doivent refléter les principes de cette école (structures de jeu, valeurs, style d'exercices typiques).`;
}

function antiRepetitionContext(exercicesRecents?: string[]): string {
  if (!exercicesRecents?.length) return '';
  return `\nEXERCICES DÉJÀ UTILISÉS RÉCEMMENT (à éviter absolument, propose des variantes différentes) :\n${exercicesRecents.slice(0, 20).map((t) => `- ${t}`).join('\n')}`;
}

function buildPrompt(p: SeanceParams, exercicesRecents?: string[]): string {
  return `Tu es un éducateur de football diplômé (BMF/BEF) expert en la méthodologie FFF.
Conçois une séance complète, RICHE EN DÉTAILS et CRÉATIVE en FRANÇAIS pour :
- Catégorie : ${p.categorie}
- Thème / sous-thème : ${themeLabel(p.theme)}
- Effectif : ${p.effectif} joueurs
- Durée totale : ${p.duree} minutes
- Charge du jour : ${p.charge}${ecoleContext(p)}
${antiRepetitionContext(exercicesRecents)}

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
${schemaInstructions(p.effectif)}

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

function buildDraftPrompt(p: SeanceParams, exercicesRecents?: string[]): string {
  const [d1Approx, d2Approx, d3Approx, d4Approx] = [
    Math.round(p.duree * 0.2),
    Math.round(p.duree * 0.27),
    Math.round(p.duree * 0.3),
    Math.round(p.duree * 0.23),
  ];

  return `Tu es un éducateur de football diplômé (BMF/BEF) expert en la méthodologie FFF.
Génère 3 alternatives DISTINCTES et VARIÉES pour chacune des 4 phases d'une séance en FRANÇAIS.

Paramètres :
- Catégorie : ${p.categorie}
- Thème / sous-thème : ${themeLabel(p.theme)}
- Effectif : ${p.effectif} joueurs
- Durée totale : ${p.duree} minutes
- Charge du jour : ${p.charge}${ecoleContext(p)}
${antiRepetitionContext(exercicesRecents)}

DURÉES INDICATIVES PAR PHASE :
- Échauffement : ~${d1Approx} min
- Corps 1 : ~${d2Approx} min
- Corps 2 : ~${d3Approx} min
- Match final : ~${d4Approx} min

RÈGLE DES 3 ALTERNATIVES : chaque phase doit proposer 3 exercices VRAIMENT DIFFÉRENTS :
- Alternative A : exercice classique, bien maîtrisé
- Alternative B : approche moins courante, plus créative (influence école de jeu si indiquée)
- Alternative C : exercice intensif ou avec contrainte spéciale

Pour chaque phase, les 3 options doivent avoir des titres, structures et objectifs distincts.
JAMAIS la même structure avec juste un nom différent.

Structure de chaque exercice (fiche FFF complète) :
- procede: "echauffement" (phase 1) | "jeu"|"exercice" (phase 2) | "situation"|"exercice" (phase 3) | "match" (phase 4)
- titre: string — nom accrocheur et distinct
- duree: number (minutes)
- objectif: string — intention pédagogique du coach
- but: string — cible concrète pour les joueurs
- effectif: string — organisation détaillée
- materiel: string — liste complète
- consignes: string[] — 4 à 6 règles progressives
- variantes: string[] — 3 variantes (simple → intermédiaire → avancée)
- criteresReussite: string[] — 3-4 critères chiffrés
- conseilCoach: string
- schema: {...} — schéma tactique JSON (x,y en % 0-100, terrain en mètres réels)

Format schéma : ${exempleSchema()}
${schemaInstructions(p.effectif)}

Réponds UNIQUEMENT avec ce JSON valide :
{
  "titre": string,
  "objectif": string,
  "materiel": string,
  "retourAuCalme": string,
  "conseilsCoach": string[],
  "alternatives": [
    {
      "phase": "echauffement",
      "options": [exercice_A, exercice_B, exercice_C]
    },
    {
      "phase": "corps1",
      "options": [exercice_A, exercice_B, exercice_C]
    },
    {
      "phase": "corps2",
      "options": [exercice_A, exercice_B, exercice_C]
    },
    {
      "phase": "match",
      "options": [exercice_A, exercice_B, exercice_C]
    }
  ]
}`;
}

function cleanJson(text: string): string {
  let s = text.trim();
  if (s.includes('```')) {
    const m = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) s = m[1].trim();
  }
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

export interface DraftGenerationResult {
  draft: SeanceDraft;
  source: 'ia' | 'bibliotheque';
}

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

function normaliseDraft(raw: unknown, fallback: SeanceDraft): SeanceDraft {
  if (!raw || typeof raw !== 'object') return fallback;
  const d = raw as Record<string, unknown>;
  const strOr = (v: unknown, fb: string) =>
    typeof v === 'string' && v.trim() ? v.trim() : fb;

  const PHASE_TYPES = ['echauffement', 'corps1', 'corps2', 'match'] as const;
  const altRaw = Array.isArray(d.alternatives) ? d.alternatives : [];

  const alternatives: AlternativesPhase[] = PHASE_TYPES.map((phaseType, i) => {
    const rawAlt = altRaw[i] as Record<string, unknown> | undefined;
    const fbAlt = fallback.alternatives[i];
    const optionsRaw = Array.isArray(rawAlt?.options) ? rawAlt.options : [];
    const options: PhaseSeance[] = optionsRaw
      .slice(0, 3)
      .map((o: unknown, j: number) =>
        normalisePhase(o, fbAlt?.options[j] ?? fbAlt?.options[0])
      )
      .filter(Boolean);

    return {
      phase: phaseType,
      options: options.length > 0 ? options : fbAlt?.options ?? [],
    };
  });

  return {
    ...fallback,
    titre: strOr(d.titre, fallback.titre),
    objectif: strOr(d.objectif, fallback.objectif),
    materiel: strOr(d.materiel, fallback.materiel),
    retourAuCalme: strOr(d.retourAuCalme, fallback.retourAuCalme),
    conseilsCoach:
      Array.isArray(d.conseilsCoach) && d.conseilsCoach.length
        ? (d.conseilsCoach as string[]).filter((c) => typeof c === 'string')
        : fallback.conseilsCoach,
    alternatives,
  };
}

export async function generateSeance(
  params: SeanceParams,
  exercicesRecents?: string[]
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

    const result = await model.generateContent(buildPrompt(params, exercicesRecents));
    const parsed = JSON.parse(cleanJson(result.response.text()));
    return { seance: mergeWithFallback(parsed, fallback), source: 'ia' };
  } catch (error) {
    console.error('Génération IA échouée, repli bibliothèque :', error);
    return { seance: fallback, source: 'bibliotheque' };
  }
}

export async function generateDraft(
  params: SeanceParams,
  exercicesRecents?: string[]
): Promise<DraftGenerationResult> {
  const fallback = buildDraftFallback(params);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { draft: fallback, source: 'bibliotheque' };
  }

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.9,
        maxOutputTokens: 32768,
      },
    });

    const result = await model.generateContent(buildDraftPrompt(params, exercicesRecents));
    const parsed = JSON.parse(cleanJson(result.response.text()));
    const draft = normaliseDraft(parsed, fallback);
    return { draft: { ...draft, params, source: 'ia' }, source: 'ia' };
  } catch (error) {
    console.error('Génération draft IA échouée, repli bibliothèque :', error);
    return { draft: fallback, source: 'bibliotheque' };
  }
}
