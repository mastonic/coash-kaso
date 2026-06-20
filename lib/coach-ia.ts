/**
 * Coach IA — le staff virtuel de ProSéance.
 *
 * Trois outils : causerie d’avant-match, plan de cycle (périodisation),
 * débrief post-match. Même philosophie que le générateur de séances :
 * Gemini quand il est disponible, repli déterministe sinon — la réponse
 * est TOUJOURS complète et exploitable.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { THEMES, themeLabel, type Charge, type ThemeId } from './seance/schema';

const MODEL = 'gemini-2.5-flash';

// ── Types ────────────────────────────────────────────────────────────────────

export interface CauserieParams {
  adversaire: string;
  enjeu: string;
  categorie: string;
  contexte: string;
  ton: 'motivant' | 'calme' | 'exigeant';
}

export interface Causerie {
  titre: string;
  accroche: string;
  messages: string[];
  tactique: { ligne: string; consigne: string }[];
  motivation: string;
  miTemps: string[];
}

export interface CycleParams {
  objectif: string;
  semaines: number;
  categorie: string;
  effectif: number;
}

export interface SemaineCycle {
  numero: number;
  theme: ThemeId;
  titre: string;
  objectif: string;
  pointsCles: string[];
  charge: Charge;
}

export interface Cycle {
  titre: string;
  objectif: string;
  semaines: SemaineCycle[];
  conseils: string[];
}

export interface DebriefParams {
  adversaire: string;
  scoreEquipe: number;
  scoreAdverse: number;
  observations: string;
  categorie: string;
}

export interface Debrief {
  resume: string;
  forces: string[];
  axes: string[];
  themeRecommande: ThemeId;
  justification: string;
  prochaineSeance: string;
}

export type CoachIaSource = 'ia' | 'bibliotheque';

// ── Utilitaires ──────────────────────────────────────────────────────────────

const THEME_IDS = THEMES.map((t) => t.id) as ThemeId[];

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

async function callGemini(prompt: string): Promise<unknown | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.85,
        maxOutputTokens: 8192,
      },
    });
    const result = await model.generateContent(prompt);
    return JSON.parse(cleanJson(result.response.text()));
  } catch (error) {
    console.error('Coach IA : génération échouée, repli bibliothèque :', error);
    return null;
  }
}

function str(v: unknown, fallback: string): string {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

function strArray(v: unknown, fallback: string[]): string[] {
  if (!Array.isArray(v)) return fallback;
  const out = v.filter((s): s is string => typeof s === 'string' && !!s.trim());
  return out.length ? out : fallback;
}

/** Devine le thème le plus pertinent à partir d’un texte libre. */
function themeDepuisTexte(texte: string): ThemeId {
  const t = texte.toLowerCase();
  const regles: [RegExp, ThemeId][] = [
    [/possession|conserv|relance|construction/, 'possession'],
    [/press|récup|harcel/, 'pressing'],
    [/transition|contre[- ]attaque|bascul/, 'transitions'],
    [/finition|tir|but|effica|march/, 'finition'],
    [/aile|couloir|centre|largeur|débord/, 'ailes'],
    [/passe|contrôle|technique/, 'technique'],
    [/conduite|dribble/, 'conduite'],
    [/duel|1c1|1v1|agress/, 'duels'],
    [/vitesse|vivacité|rapide|sprint/, 'vitesse'],
    [/défens|bloc|coulis|encaiss|solid/, 'defense'],
  ];
  for (const [re, id] of regles) if (re.test(t)) return id;
  return 'possession';
}

// ── 1. Causerie d’avant-match ────────────────────────────────────────────────

function fallbackCauserie(p: CauserieParams): Causerie {
  const adv = p.adversaire || 'cette équipe';
  const tons: Record<CauserieParams['ton'], { accroche: string; motivation: string }> = {
    motivant: {
      accroche: `Les gars, regardez autour de vous : tout le monde dans ce vestiaire a bossé toute la semaine pour ce moment. ${adv}, c’est notre match. Pas le leur.`,
      motivation: `On joue ensemble, on souffre ensemble, on gagne ensemble. Premier ballon, première seconde : on leur montre qui on est. Allez !`,
    },
    calme: {
      accroche: `Pas besoin de grands discours aujourd’hui. Vous savez ce que vous avez à faire, on l’a préparé toute la semaine. Restez dans votre match.`,
      motivation: `Concentration, application, plaisir. Faites ce que vous savez faire et le résultat suivra. Bon match à tous.`,
    },
    exigeant: {
      accroche: `Je vais être direct : ce qu’on a montré par moments dernièrement, ce n’est pas notre niveau. Aujourd’hui contre ${adv}, je veux voir la vraie version de cette équipe.`,
      motivation: `90 minutes d’exigence, zéro ballon abandonné, zéro duel évité. Vous me montrez ça, et je signe pour le résultat. Au boulot.`,
    },
  };
  const ton = tons[p.ton] ?? tons.motivant;

  return {
    titre: `Causerie — ${adv} (${p.enjeu || 'championnat'})`,
    accroche: ton.accroche,
    messages: [
      `Imposer NOTRE jeu d’entrée : les 10 premières minutes donnent le ton — on presse fort, on joue simple, on met de l’intensité dans chaque course.`,
      `Rester soudés sur toute la durée : un bloc compact en perte, des solutions courtes en possession. Personne ne défend seul, personne n’attaque seul.`,
      `Gagner les moments clés : coups de pied arrêtés des deux côtés, entames de mi-temps, 10 dernières minutes. C’est là que ce match se décide.`,
    ],
    tactique: [
      { ligne: 'Défense', consigne: 'Bloc compact, communication permanente. On défend en avançant, jamais en reculant face au porteur.' },
      { ligne: 'Milieu', consigne: 'Premier rideau du pressing et première rampe de lancement : jouer vers l’avant dès la récupération.' },
      { ligne: 'Attaque', consigne: 'Appels permanents dans la profondeur pour étirer leur défense. Premier défenseur de l’équipe à la perte.' },
    ],
    motivation: ton.motivation,
    miTemps: [
      'Commencer par 2 points positifs concrets de la première période.',
      'Donner 1 seul ajustement tactique prioritaire (pas 5).',
      'Finir sur l’état d’esprit : la 2e mi-temps se gagne dans les têtes.',
    ],
  };
}

export async function genererCauserie(
  p: CauserieParams
): Promise<{ causerie: Causerie; source: CoachIaSource }> {
  const fallback = fallbackCauserie(p);
  const prompt = `Tu es un entraîneur de football expérimenté et charismatique, expert en management d’équipe.
Écris une CAUSERIE D’AVANT-MATCH complète en FRANÇAIS, prête à être dite dans le vestiaire :
- Adversaire : ${p.adversaire || 'non précisé'}
- Enjeu du match : ${p.enjeu || 'match de championnat'}
- Catégorie : ${p.categorie || 'Seniors'}
- Contexte / état du groupe : ${p.contexte || 'non précisé'}
- Ton demandé : ${p.ton}

Exigences :
- Parle DIRECTEMENT aux joueurs (tutoiement collectif « les gars / vous »), phrases percutantes, langage de vestiaire authentique mais respectueux.
- accroche : 2-4 phrases d’ouverture qui captent immédiatement l’attention, liées au contexte donné.
- messages : exactement 3 messages clés du match, concrets et mémorisables.
- tactique : 3 consignes, une par ligne (Défense, Milieu, Attaque), adaptées à l’adversaire et l’enjeu.
- motivation : la phrase finale avant de sortir du vestiaire, qui donne des frissons.
- miTemps : 3 rappels pour structurer la causerie de mi-temps.

Réponds UNIQUEMENT avec ce JSON :
{ "titre": string, "accroche": string, "messages": [string, string, string], "tactique": [{"ligne": "Défense"|"Milieu"|"Attaque", "consigne": string}, ...3...], "motivation": string, "miTemps": [string, string, string] }`;

  const raw = await callGemini(prompt);
  if (!raw || typeof raw !== 'object') return { causerie: fallback, source: 'bibliotheque' };
  const d = raw as Record<string, unknown>;

  const tactiqueRaw = Array.isArray(d.tactique) ? d.tactique : [];
  const tactique = fallback.tactique.map((fb, i) => {
    const t = tactiqueRaw[i] as Record<string, unknown> | undefined;
    return {
      ligne: str(t?.ligne, fb.ligne),
      consigne: str(t?.consigne, fb.consigne),
    };
  });

  return {
    causerie: {
      titre: str(d.titre, fallback.titre),
      accroche: str(d.accroche, fallback.accroche),
      messages: strArray(d.messages, fallback.messages),
      tactique,
      motivation: str(d.motivation, fallback.motivation),
      miTemps: strArray(d.miTemps, fallback.miTemps),
    },
    source: 'ia',
  };
}

// ── 2. Plan de cycle (périodisation) ────────────────────────────────────────

function fallbackCycle(p: CycleParams): Cycle {
  const themePrincipal = themeDepuisTexte(p.objectif);
  // Progression : technique → thème principal → opposition → réinvestissement
  const progression: ThemeId[] = [
    'technique',
    themePrincipal,
    themePrincipal,
    'duels',
    'transitions',
    themePrincipal,
    'vitesse',
    'finition',
    themePrincipal,
    'defense',
    'possession',
    themePrincipal,
  ];
  const charges: Charge[] = ['Modérée', 'Élevée', 'Modérée', 'Élevée'];

  const semaines: SemaineCycle[] = Array.from({ length: p.semaines }, (_, i) => {
    const estDerniere = i === p.semaines - 1;
    // La dernière semaine réinvestit toujours le thème principal du cycle
    const theme = estDerniere ? themePrincipal : progression[i % progression.length];
    return {
      numero: i + 1,
      theme,
      titre: `Semaine ${i + 1} — ${themeLabel(theme)}`,
      objectif: estDerniere
        ? `Réinvestir tout le travail du cycle dans des situations de match : ${themeLabel(theme).toLowerCase()} sous opposition réelle.`
        : `Développer « ${themeLabel(theme).toLowerCase()} » au service de l’objectif du cycle : ${p.objectif || 'progression collective'}.`,
      pointsCles: [
        `Fil rouge de la semaine : ${themeLabel(theme).toLowerCase()} présent dans chaque procédé (jeu, situation, match).`,
        'Commencer la semaine par du volume technique, finir par de l’opposition réelle.',
        estDerniere
          ? 'Évaluer : reprendre les critères de réussite de la semaine 1 et mesurer la progression.'
          : 'Observer 2-3 joueurs cibles par séance et noter leur progression.',
      ],
      charge: charges[i % charges.length],
    };
  });

  return {
    titre: `Cycle ${p.semaines} semaines — ${themeLabel(themePrincipal)}`,
    objectif: p.objectif || `Développer ${themeLabel(themePrincipal).toLowerCase()} sur ${p.semaines} semaines.`,
    semaines,
    conseils: [
      'Annoncer l’objectif du cycle aux joueurs dès la première séance : ils progressent plus vite quand ils savent où ils vont.',
      'Garder 20 % de chaque séance pour le jeu libre : c’est là qu’on voit si le travail rentre.',
      'Alterner les charges : jamais deux semaines « Élevée » avant un match important.',
      'En fin de cycle, comparer avec le début : mêmes exercices tests, mêmes critères chiffrés.',
    ],
  };
}

export async function genererCycle(
  p: CycleParams
): Promise<{ cycle: Cycle; source: CoachIaSource }> {
  const fallback = fallbackCycle(p);
  const themesDispo = THEME_IDS.join(' | ');
  const prompt = `Tu es un responsable technique de club de football (BEF/BMF), expert en périodisation de l’entraînement.
Construis un PLAN DE CYCLE d’entraînement en FRANÇAIS :
- Objectif du cycle : ${p.objectif || 'progression collective'}
- Durée : ${p.semaines} semaines
- Catégorie : ${p.categorie || 'Seniors'}
- Effectif : ${p.effectif} joueurs

Exigences :
- Une progression LOGIQUE et PÉDAGOGIQUE : du simple vers le complexe, de l’analytique vers le match.
- Chaque semaine a UN thème dominant choisi STRICTEMENT parmi : ${themesDispo}
- pointsCles : 3 points concrets pour orienter les séances de la semaine.
- charge : "Récupération", "Modérée" ou "Élevée" — alterne intelligemment (pas deux semaines Élevée de suite).
- La dernière semaine réinvestit tout le cycle en situation de match.
- conseils : 4 conseils de pilotage du cycle pour l’éducateur.

Réponds UNIQUEMENT avec ce JSON :
{ "titre": string, "objectif": string, "semaines": [{"numero": number, "theme": string, "titre": string, "objectif": string, "pointsCles": [string, string, string], "charge": "Récupération"|"Modérée"|"Élevée"}, ... ${p.semaines} semaines ...], "conseils": [string, string, string, string] }`;

  const raw = await callGemini(prompt);
  if (!raw || typeof raw !== 'object') return { cycle: fallback, source: 'bibliotheque' };
  const d = raw as Record<string, unknown>;

  const semainesRaw = Array.isArray(d.semaines) ? d.semaines : [];
  const semaines = fallback.semaines.map((fb, i) => {
    const s = semainesRaw[i] as Record<string, unknown> | undefined;
    const themeRaw = str(s?.theme, fb.theme);
    const charge = ['Récupération', 'Modérée', 'Élevée'].includes(s?.charge as string)
      ? (s?.charge as Charge)
      : fb.charge;
    return {
      numero: i + 1,
      theme: THEME_IDS.includes(themeRaw as ThemeId) ? (themeRaw as ThemeId) : fb.theme,
      titre: str(s?.titre, fb.titre),
      objectif: str(s?.objectif, fb.objectif),
      pointsCles: strArray(s?.pointsCles, fb.pointsCles),
      charge,
    };
  });

  return {
    cycle: {
      titre: str(d.titre, fallback.titre),
      objectif: str(d.objectif, fallback.objectif),
      semaines,
      conseils: strArray(d.conseils, fallback.conseils),
    },
    source: 'ia',
  };
}

// ── 3. Débrief post-match ────────────────────────────────────────────────────

function fallbackDebrief(p: DebriefParams): Debrief {
  const diff = p.scoreEquipe - p.scoreAdverse;
  const resultat = diff > 0 ? 'victoire' : diff < 0 ? 'défaite' : 'match nul';
  const theme = p.observations
    ? themeDepuisTexte(p.observations)
    : diff < 0
      ? 'defense'
      : 'finition';

  const resumes: Record<string, string> = {
    victoire: `Victoire ${p.scoreEquipe}-${p.scoreAdverse} contre ${p.adversaire || 'l’adversaire'}. Le résultat valide le travail de la semaine, mais le contenu compte autant que le score : on capitalise sur ce qui a fonctionné et on corrige ce qui a été masqué par la victoire.`,
    défaite: `Défaite ${p.scoreEquipe}-${p.scoreAdverse} contre ${p.adversaire || 'l’adversaire'}. Un résultat ne définit pas une équipe : on analyse à froid, on identifie 2-3 causes concrètes (pas 10) et on transforme cette frustration en plan d’entraînement.`,
    'match nul': `Match nul ${p.scoreEquipe}-${p.scoreAdverse} contre ${p.adversaire || 'l’adversaire'}. Mi-figue mi-raisin : il y a des points à prendre dans ce match. L’analyse doit dire lesquels et comment aller les chercher la prochaine fois.`,
  };

  return {
    resume: resumes[resultat],
    forces: [
      'L’état d’esprit et l’engagement dans les duels sur la durée du match.',
      'Les intentions de jeu travaillées à l’entraînement sont apparues par séquences.',
      'La capacité à rester organisés dans les moments de pression adverse.',
    ],
    axes: [
      diff < 0
        ? 'La gestion des temps faibles : mieux reconnaître les moments où il faut simplifier le jeu.'
        : 'La constance sur 90 minutes : maintenir le niveau des meilleures séquences plus longtemps.',
      `Le thème « ${themeLabel(theme).toLowerCase()} » : c’est le levier de progression n°1 identifié sur ce match.`,
      'La communication sur le terrain : trop de situations résolues en retard faute d’information donnée à temps.',
    ],
    themeRecommande: theme,
    justification: `Au vu du score (${p.scoreEquipe}-${p.scoreAdverse})${p.observations ? ' et de tes observations' : ''}, c’est le domaine où une semaine de travail ciblé aura le plus d’impact sur le prochain match.`,
    prochaineSeance: `Construis ta prochaine séance sur le thème « ${themeLabel(theme)} » : reprends une situation vécue dans le match comme point de départ de la phase « situation », et termine par un match à thème qui récompense les comportements corrigés.`,
  };
}

export async function genererDebrief(
  p: DebriefParams
): Promise<{ debrief: Debrief; source: CoachIaSource }> {
  const fallback = fallbackDebrief(p);
  const themesDispo = THEME_IDS.join(' | ');
  const prompt = `Tu es un analyste football et éducateur diplômé (BEF), spécialiste du débrief post-match constructif.
Analyse ce match en FRANÇAIS :
- Adversaire : ${p.adversaire || 'non précisé'}
- Score : ${p.scoreEquipe} - ${p.scoreAdverse} (notre équipe d’abord)
- Catégorie : ${p.categorie || 'Seniors'}
- Observations du coach : ${p.observations || 'aucune observation fournie'}

Exigences :
- resume : 3-4 phrases d’analyse globale, lucides mais constructives — appuie-toi sur les observations fournies.
- forces : 3 points forts CONCRETS à valoriser auprès du groupe.
- axes : 3 axes de progression PRIORITAIRES, formulés positivement (ce qu’on veut voir, pas ce qu’on reproche).
- themeRecommande : le thème d’entraînement n°1 pour la semaine, choisi STRICTEMENT parmi : ${themesDispo}
- justification : pourquoi ce thème, en lien direct avec le match.
- prochaineSeance : comment construire la prochaine séance autour de ce thème (2-3 phrases concrètes).

Réponds UNIQUEMENT avec ce JSON :
{ "resume": string, "forces": [string, string, string], "axes": [string, string, string], "themeRecommande": string, "justification": string, "prochaineSeance": string }`;

  const raw = await callGemini(prompt);
  if (!raw || typeof raw !== 'object') return { debrief: fallback, source: 'bibliotheque' };
  const d = raw as Record<string, unknown>;

  const themeRaw = str(d.themeRecommande, fallback.themeRecommande);

  return {
    debrief: {
      resume: str(d.resume, fallback.resume),
      forces: strArray(d.forces, fallback.forces),
      axes: strArray(d.axes, fallback.axes),
      themeRecommande: THEME_IDS.includes(themeRaw as ThemeId)
        ? (themeRaw as ThemeId)
        : fallback.themeRecommande,
      justification: str(d.justification, fallback.justification),
      prochaineSeance: str(d.prochaineSeance, fallback.prochaineSeance),
    },
    source: 'ia',
  };
}
