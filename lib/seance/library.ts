/**
 * Bibliothèque d'exercices FFF intégrée.
 *
 * Construit une séance complète, cohérente et illustrée pour chaque thème,
 * sans appel réseau. Utilisée :
 *  - comme génération de secours quand l'IA est indisponible (pas de clé,
 *    quota, hors-ligne) ;
 *  - comme source de schémas de remplacement quand un schéma IA est invalide.
 */

import type {
  AlternativesPhase,
  Categorie,
  Charge,
  EcoleDeJeu,
  PhaseSeance,
  PhaseType,
  SchemaBallon,
  SchemaBut,
  SchemaExercice,
  SchemaFleche,
  SchemaJoueur,
  SchemaPlot,
  SchemaZone,
  Seance,
  SeanceDraft,
  SeanceParams,
  SousThemeId,
} from './schema';
import { themeLabel } from './schema';

/**
 * Mappe un sous-thème nouveau ou inconnu vers le thème "bibliothèque" le plus
 * proche, afin que le fallback hors-ligne puisse toujours construire une séance.
 */
const SOUS_THEME_TO_THEME: Partial<Record<string, SousThemeId>> = {
  // Technique individuelle
  passe: 'technique',
  controle: 'technique',
  conduite_balle: 'conduite',
  frappe: 'finition',
  dribble: 'conduite',
  jeu_de_tete: 'technique',
  centre: 'ailes',
  // Technico-tactique offensif
  demarquage: 'transitions',
  soutien: 'possession',
  permutation: 'possession',
  jeu_sans_ballon: 'possession',
  un_contre_un_offensif: 'duels',
  finition_tt: 'finition',
  transition_offensive: 'transitions',
  jeu_dos_au_but: 'possession',
  // Technico-tactique défensif
  un_contre_un_defensif: 'duels',
  marquage: 'defense',
  pressing_tt: 'pressing',
  couverture: 'defense',
  replacement: 'defense',
  transition_defensive: 'transitions',
  jeu_interieur_exterieur: 'defense',
  // Tactique collective
  animation_offensive: 'possession',
  animation_defensive: 'defense',
  corner: 'ailes',
  coup_franc: 'finition',
  touche: 'ailes',
  penalty: 'finition',
  // Physique
  vitesse_reaction: 'vitesse',
  endurance: 'vitesse',
  coordination_agilite: 'conduite',
  force: 'duels',
  ppg: 'vitesse',
  // Mental / cognitif
  prise_de_decision: 'transitions',
  communication: 'possession',
  concentration: 'defense',
  gestion_effort: 'vitesse',
  // Gardien de but
  relance_gk: 'defense',
  blocage_gk: 'defense',
  plongeon_gk: 'finition',
  sorties_gk: 'defense',
};

function themeEffectif(theme: string): SousThemeId {
  const direct: SousThemeId[] = [
    'possession', 'pressing', 'transitions', 'finition', 'ailes',
    'technique', 'conduite', 'duels', 'vitesse', 'defense',
  ];
  if (direct.includes(theme as SousThemeId)) return theme as SousThemeId;
  return (SOUS_THEME_TO_THEME[theme] ?? 'possession') as SousThemeId;
}

// ── Petits utilitaires géométriques ─────────────────────────────────────────

const J = (
  x: number,
  y: number,
  equipe: SchemaJoueur['equipe'],
  label?: string
): SchemaJoueur => ({ x, y, equipe, label });

const P = (x: number, y: number, couleur?: SchemaPlot['couleur']): SchemaPlot => ({
  x,
  y,
  couleur: couleur ?? 'jaune',
});

const B = (x: number, y: number): SchemaBallon => ({ x, y });

const F = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  type: SchemaFleche['type']
): SchemaFleche => ({ de: { x: x1, y: y1 }, vers: { x: x2, y: y2 }, type });

/** Plots aux 4 coins de l'espace de travail */
function coins(): SchemaPlot[] {
  return [P(2, 3), P(98, 3), P(2, 97), P(98, 97)];
}

/** Répartit n joueurs sur un cercle (cx, cy, r en %) */
function cercle(
  n: number,
  equipe: SchemaJoueur['equipe'],
  cx = 50,
  cy = 50,
  rx = 38,
  ry = 38
): SchemaJoueur[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return J(
      Math.round(cx + rx * Math.cos(a)),
      Math.round(cy + ry * Math.sin(a)),
      equipe
    );
  });
}

/** Répartit n joueurs en grille dans un rectangle (en %) */
function grille(
  n: number,
  equipe: SchemaJoueur['equipe'],
  x0: number,
  y0: number,
  x1: number,
  y1: number
): SchemaJoueur[] {
  if (n <= 0) return [];
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const out: SchemaJoueur[] = [];
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    out.push(
      J(
        Math.round(x0 + ((c + 0.5) / cols) * (x1 - x0)),
        Math.round(y0 + ((r + 0.5) / rows) * (y1 - y0)),
        equipe
      )
    );
  }
  return out;
}

// ── Schémas types ────────────────────────────────────────────────────────────

export function schemaRondo(nExt: number, nInt: number): SchemaExercice {
  const ext = cercle(nExt, 'A', 50, 50, 40, 40);
  const int = grille(nInt, 'B', 40, 40, 60, 60);
  const fleches: SchemaFleche[] = [];
  for (let i = 0; i < Math.min(3, ext.length - 1); i++) {
    fleches.push(F(ext[i].x, ext[i].y, ext[i + 1].x, ext[i + 1].y, 'passe'));
  }
  return {
    terrain: { longueur: 12, largeur: 12 },
    joueurs: [...ext, ...int],
    plots: coins(),
    ballons: ext.length ? [B(ext[0].x + 4, ext[0].y + 4)] : [],
    fleches,
  };
}

export function schemaConservation(
  nA: number,
  nB: number,
  jokers: number,
  terrain = { longueur: 30, largeur: 25 }
): SchemaExercice {
  const a = grille(nA, 'A', 8, 12, 48, 88);
  const b = grille(nB, 'B', 52, 12, 92, 88);
  const jk: SchemaJoueur[] = [];
  if (jokers >= 1) jk.push(J(50, 6, 'J', 'Joker'));
  if (jokers >= 2) jk.push(J(50, 94, 'J', 'Joker'));
  if (jokers >= 3) jk.push(J(4, 50, 'J', 'Joker'));
  if (jokers >= 4) jk.push(J(96, 50, 'J', 'Joker'));
  const fleches: SchemaFleche[] = [];
  if (a.length >= 2) fleches.push(F(a[0].x, a[0].y, a[1].x, a[1].y, 'passe'));
  if (a.length >= 1 && jk.length >= 1)
    fleches.push(F(a[a.length - 1].x, a[a.length - 1].y, jk[0].x, jk[0].y, 'passe'));
  if (b.length >= 1)
    fleches.push(F(b[0].x, b[0].y, b[0].x - 12, b[0].y + 8, 'deplacement'));
  return {
    terrain,
    joueurs: [...a, ...b, ...jk],
    plots: coins(),
    ballons: a.length ? [B(a[0].x + 3, a[0].y - 3)] : [],
    fleches,
  };
}

export function schemaJeuZones(nA: number, nB: number): SchemaExercice {
  const zones: SchemaZone[] = [
    { x: 0, y: 0, largeur: 25, hauteur: 100, label: 'Zone 1' },
    { x: 25, y: 0, largeur: 50, hauteur: 100, label: 'Zone médiane' },
    { x: 75, y: 0, largeur: 25, hauteur: 100, label: 'Zone 2' },
  ];
  const a = grille(nA, 'A', 8, 15, 48, 85);
  const b = grille(nB, 'B', 52, 15, 92, 85);
  return {
    terrain: { longueur: 40, largeur: 30 },
    joueurs: [...a, ...b],
    plots: coins(),
    zones,
    ballons: a.length ? [B(a[0].x + 3, a[0].y)] : [],
    fleches: a.length >= 2 ? [F(a[0].x, a[0].y, a[1].x, a[1].y, 'passe')] : [],
  };
}

export function schemaCarrePasses(): SchemaExercice {
  const pts = [
    { x: 15, y: 15 },
    { x: 85, y: 15 },
    { x: 85, y: 85 },
    { x: 15, y: 85 },
  ];
  const joueurs = pts.map((p, i) => J(p.x, p.y, 'A', `${i + 1}`));
  const fleches: SchemaFleche[] = [
    F(15, 15, 85, 15, 'passe'),
    F(85, 15, 85, 85, 'conduite'),
    F(85, 85, 15, 85, 'passe'),
    F(15, 85, 15, 15, 'deplacement'),
  ];
  return {
    terrain: { longueur: 15, largeur: 15 },
    joueurs,
    plots: pts.map((p) => P(p.x, p.y, 'orange')),
    ballons: [B(19, 12)],
    fleches,
  };
}

export function schemaFinition(): SchemaExercice {
  const buts: SchemaBut[] = [{ x: 99, y: 50, taille: 'grand', orientation: 'droite' }];
  const joueurs = [
    J(99, 50, 'G', 'GB'),
    J(20, 30, 'A', 'A1'),
    J(20, 70, 'A', 'A2'),
    J(45, 50, 'A', 'A3'),
    J(62, 38, 'B', 'D1'),
  ];
  const fleches: SchemaFleche[] = [
    F(20, 30, 45, 50, 'passe'),
    F(45, 50, 65, 60, 'conduite'),
    F(65, 60, 95, 52, 'tir'),
    F(20, 70, 55, 75, 'deplacement'),
  ];
  return {
    terrain: { longueur: 35, largeur: 30 },
    joueurs,
    plots: [P(2, 3), P(2, 97), P(40, 3, 'rouge'), P(40, 97, 'rouge')],
    buts,
    ballons: [B(23, 33)],
    fleches,
  };
}

export function schemaTransition(nAtt: number, nDef: number): SchemaExercice {
  const buts: SchemaBut[] = [
    { x: 1, y: 50, taille: 'mini', orientation: 'gauche' },
    { x: 99, y: 50, taille: 'grand', orientation: 'droite' },
  ];
  const att = grille(nAtt, 'A', 15, 25, 45, 75);
  const def = grille(nDef, 'B', 60, 30, 80, 70);
  const fleches: SchemaFleche[] = [
    F(30, 50, 60, 50, 'conduite'),
    F(60, 50, 95, 45, 'tir'),
  ];
  if (att.length >= 2) fleches.unshift(F(att[0].x, att[0].y, att[1].x, att[1].y, 'passe'));
  return {
    terrain: { longueur: 40, largeur: 30 },
    joueurs: [J(99, 50, 'G', 'GB'), ...att, ...def],
    plots: coins(),
    buts,
    ballons: att.length ? [B(att[0].x + 3, att[0].y)] : [],
    fleches,
  };
}

export function schemaDuel1c1(): SchemaExercice {
  const buts: SchemaBut[] = [
    { x: 99, y: 30, taille: 'mini', orientation: 'droite' },
    { x: 99, y: 70, taille: 'mini', orientation: 'droite' },
  ];
  const joueurs = [
    J(10, 50, 'A', 'ATT'),
    J(60, 50, 'B', 'DEF'),
    J(8, 20, 'A'),
    J(8, 80, 'A'),
    J(75, 15, 'B'),
    J(75, 85, 'B'),
  ];
  const fleches: SchemaFleche[] = [
    F(10, 50, 45, 42, 'conduite'),
    F(45, 42, 95, 32, 'tir'),
    F(60, 50, 45, 45, 'deplacement'),
  ];
  return {
    terrain: { longueur: 20, largeur: 15 },
    joueurs,
    plots: coins(),
    buts,
    ballons: [B(13, 47)],
    fleches,
  };
}

export function schemaConduite(): SchemaExercice {
  const plots: SchemaPlot[] = [
    P(15, 50, 'orange'),
    P(30, 35, 'orange'),
    P(45, 65, 'orange'),
    P(60, 35, 'orange'),
    P(75, 65, 'orange'),
    P(90, 50, 'rouge'),
    ...coins(),
  ];
  const joueurs = [J(6, 50, 'A', '1'), J(6, 30, 'A', '2'), J(6, 70, 'A', '3')];
  const fleches: SchemaFleche[] = [
    F(8, 50, 30, 37, 'conduite'),
    F(30, 37, 45, 62, 'conduite'),
    F(45, 62, 60, 37, 'conduite'),
    F(60, 37, 88, 50, 'conduite'),
  ];
  return {
    terrain: { longueur: 25, largeur: 15 },
    joueurs,
    plots,
    ballons: [B(9, 50)],
    fleches,
  };
}

export function schemaVitesseRelais(): SchemaExercice {
  const plots: SchemaPlot[] = [
    P(10, 25, 'bleu'),
    P(10, 75, 'bleu'),
    P(50, 25, 'orange'),
    P(50, 75, 'orange'),
    P(90, 25, 'rouge'),
    P(90, 75, 'rouge'),
  ];
  const joueurs = [
    J(5, 25, 'A', '1'),
    J(5, 75, 'B', '1'),
    J(1, 25, 'A', '2'),
    J(1, 75, 'B', '2'),
  ];
  const fleches: SchemaFleche[] = [
    F(10, 25, 50, 25, 'deplacement'),
    F(50, 25, 90, 25, 'conduite'),
    F(10, 75, 50, 75, 'deplacement'),
    F(50, 75, 90, 75, 'conduite'),
  ];
  return {
    terrain: { longueur: 25, largeur: 12 },
    joueurs,
    plots,
    ballons: [B(50, 22), B(50, 78)],
    fleches,
  };
}

export function schemaAilesCentres(): SchemaExercice {
  const zones: SchemaZone[] = [
    { x: 0, y: 0, largeur: 100, hauteur: 22, label: 'Couloir' },
    { x: 0, y: 78, largeur: 100, hauteur: 22, label: 'Couloir' },
  ];
  const joueurs = [
    J(99, 50, 'G', 'GB'),
    J(35, 10, 'A', 'Ailier'),
    J(35, 90, 'A', 'Ailier'),
    J(40, 50, 'A', 'Att'),
    J(55, 45, 'A', 'Att'),
    J(65, 40, 'B', 'Déf'),
    J(65, 60, 'B', 'Déf'),
  ];
  const fleches: SchemaFleche[] = [
    F(35, 10, 75, 12, 'conduite'),
    F(75, 12, 88, 45, 'passe'),
    F(55, 45, 85, 50, 'deplacement'),
    F(88, 48, 97, 50, 'tir'),
  ];
  return {
    terrain: { longueur: 45, largeur: 35 },
    joueurs,
    plots: coins(),
    buts: [{ x: 99, y: 50, taille: 'grand', orientation: 'droite' }],
    zones,
    ballons: [B(38, 12)],
    fleches,
  };
}

export function schemaPressing(nA: number, nB: number): SchemaExercice {
  const zones: SchemaZone[] = [
    { x: 0, y: 0, largeur: 33, hauteur: 100, label: 'Z. pressing' },
  ];
  const a = grille(nA, 'A', 8, 15, 45, 85);
  const b = grille(nB, 'B', 38, 15, 90, 85);
  const fleches: SchemaFleche[] = [];
  if (a.length >= 2) {
    fleches.push(F(a[0].x, a[0].y, a[0].x + 14, a[0].y - 5, 'deplacement'));
    fleches.push(F(a[1].x, a[1].y, a[1].x + 14, a[1].y + 5, 'deplacement'));
  }
  if (b.length >= 2) fleches.push(F(b[0].x, b[0].y, b[1].x, b[1].y, 'passe'));
  return {
    terrain: { longueur: 35, largeur: 25 },
    joueurs: [...a, ...b],
    plots: coins(),
    zones,
    ballons: b.length ? [B(b[0].x - 3, b[0].y)] : [],
    fleches,
  };
}

export function schemaBlocDefensif(): SchemaExercice {
  const joueurs = [
    J(8, 50, 'G', 'GB'),
    J(22, 20, 'A'),
    J(20, 40, 'A'),
    J(20, 60, 'A'),
    J(22, 80, 'A'),
    J(35, 35, 'A'),
    J(35, 65, 'A'),
    J(55, 25, 'B'),
    J(50, 50, 'B'),
    J(55, 75, 'B'),
    J(68, 50, 'B'),
  ];
  const fleches: SchemaFleche[] = [
    F(50, 50, 35, 50, 'conduite'),
    F(35, 35, 30, 45, 'deplacement'),
    F(35, 65, 30, 55, 'deplacement'),
  ];
  return {
    terrain: { longueur: 50, largeur: 40 },
    joueurs,
    plots: coins(),
    buts: [{ x: 1, y: 50, taille: 'grand', orientation: 'gauche' }],
    ballons: [B(48, 48)],
    fleches,
  };
}

export function schemaMatch(
  nA: number,
  nB: number,
  grandsButs: boolean,
  terrain = { longueur: 50, largeur: 35 }
): SchemaExercice {
  const withGK = grandsButs && nA >= 4 && nB >= 4;
  const a = grille(withGK ? nA - 1 : nA, 'A', 10, 15, 45, 85);
  const b = grille(withGK ? nB - 1 : nB, 'B', 55, 15, 90, 85);
  const gks: SchemaJoueur[] = withGK
    ? [J(3, 50, 'G', 'GB'), J(97, 50, 'G', 'GB')]
    : [];
  const buts: SchemaBut[] = grandsButs
    ? [
        { x: 1, y: 50, taille: 'grand', orientation: 'gauche' },
        { x: 99, y: 50, taille: 'grand', orientation: 'droite' },
      ]
    : [
        { x: 1, y: 30, taille: 'mini', orientation: 'gauche' },
        { x: 1, y: 70, taille: 'mini', orientation: 'gauche' },
        { x: 99, y: 30, taille: 'mini', orientation: 'droite' },
        { x: 99, y: 70, taille: 'mini', orientation: 'droite' },
      ];
  return {
    terrain,
    joueurs: [...gks, ...a, ...b],
    plots: coins(),
    buts,
    ballons: [B(50, 50)],
    fleches: a.length >= 2 ? [F(a[0].x, a[0].y, a[1].x, a[1].y, 'passe')] : [],
  };
}

/** Couloir de passes en zigzag — échauffement activation */
export function schemaEchauffementZigzag(): SchemaExercice {
  const plots: SchemaPlot[] = [
    P(20, 20, 'orange'), P(40, 80, 'orange'), P(60, 20, 'orange'), P(80, 80, 'orange'),
    ...coins(),
  ];
  const joueurs = [J(5, 20, 'A', '1'), J(5, 80, 'A', '2'), J(5, 50, 'A', '3')];
  const fleches: SchemaFleche[] = [
    F(8, 20, 20, 22, 'conduite'), F(20, 22, 40, 78, 'conduite'),
    F(40, 78, 60, 22, 'conduite'), F(60, 22, 80, 78, 'conduite'),
  ];
  return { terrain: { longueur: 20, largeur: 15 }, joueurs, plots, ballons: [B(9, 18)], fleches };
}

/** Triangle de passes — échauffement technique */
export function schemaTrianglePasses(): SchemaExercice {
  const pts = [{ x: 50, y: 10 }, { x: 15, y: 80 }, { x: 85, y: 80 }];
  const joueurs = [
    J(pts[0].x, pts[0].y, 'A', '1'), J(pts[1].x, pts[1].y, 'A', '2'), J(pts[2].x, pts[2].y, 'A', '3'),
    J(pts[0].x + 8, pts[0].y + 5, 'A'), J(pts[1].x + 8, pts[1].y - 5, 'A'),
  ];
  const fleches: SchemaFleche[] = [
    F(pts[0].x, pts[0].y, pts[1].x, pts[1].y, 'passe'),
    F(pts[1].x, pts[1].y, pts[2].x, pts[2].y, 'passe'),
    F(pts[2].x, pts[2].y, pts[0].x, pts[0].y, 'conduite'),
    F(pts[0].x, pts[0].y, pts[1].x + 10, pts[1].y - 10, 'deplacement'),
  ];
  return {
    terrain: { longueur: 15, largeur: 15 },
    joueurs,
    plots: pts.map((p) => P(p.x, p.y, 'jaune')),
    ballons: [B(pts[0].x + 3, pts[0].y + 3)],
    fleches,
  };
}

/** Jeu en largeur avec 3 zones verticales — corps offensif */
export function schemaJeuLargeur(nA: number, nB: number): SchemaExercice {
  const zones: SchemaZone[] = [
    { x: 0, y: 0, largeur: 100, hauteur: 28, label: 'Couloir G' },
    { x: 0, y: 28, largeur: 100, hauteur: 44, label: 'Zone centrale' },
    { x: 0, y: 72, largeur: 100, hauteur: 28, label: 'Couloir D' },
  ];
  const a = grille(nA, 'A', 8, 10, 45, 90);
  const b = grille(nB, 'B', 55, 10, 92, 90);
  const fleches: SchemaFleche[] = [];
  if (a.length >= 2) {
    fleches.push(F(a[0].x, a[0].y, a[1].x, a[1].y, 'passe'));
    fleches.push(F(a[1].x, a[1].y, a[1].x + 15, 10, 'passe'));
    fleches.push(F(a[1].x + 15, 10, a[1].x + 20, 35, 'deplacement'));
  }
  return {
    terrain: { longueur: 40, largeur: 35 },
    joueurs: [...a, ...b],
    plots: coins(),
    zones,
    ballons: a.length ? [B(a[0].x + 3, a[0].y)] : [],
    fleches,
  };
}

/** Attaque placée 3c2 sur demi-terrain */
export function schemaAttaquePlacee(): SchemaExercice {
  const buts: SchemaBut[] = [{ x: 99, y: 50, taille: 'grand', orientation: 'droite' }];
  const joueurs = [
    J(99, 50, 'G', 'GB'),
    J(30, 50, 'A', 'MEN'), J(45, 25, 'A', 'AG'), J(45, 75, 'A', 'AD'),
    J(65, 35, 'B', 'D1'), J(65, 65, 'B', 'D2'),
  ];
  const fleches: SchemaFleche[] = [
    F(30, 50, 45, 28, 'passe'),
    F(45, 28, 60, 32, 'conduite'),
    F(60, 32, 95, 50, 'tir'),
    F(45, 75, 58, 60, 'deplacement'),
  ];
  return {
    terrain: { longueur: 35, largeur: 30 },
    joueurs,
    plots: [P(2, 3), P(2, 97), P(30, 3, 'orange'), P(30, 97, 'orange')],
    buts,
    ballons: [B(33, 48)],
    fleches,
  };
}

/** Match avec zone centrale neutre */
export function schemaMatchZoneCentrale(nA: number, nB: number, grandsButs: boolean): SchemaExercice {
  const zones: SchemaZone[] = [
    { x: 37, y: 0, largeur: 26, hauteur: 100, label: 'Zone libre' },
  ];
  const withGK = grandsButs && nA >= 4 && nB >= 4;
  const a = grille(withGK ? nA - 1 : nA, 'A', 5, 10, 35, 90);
  const b = grille(withGK ? nB - 1 : nB, 'B', 63, 10, 95, 90);
  const gks: SchemaJoueur[] = withGK ? [J(2, 50, 'G', 'GB'), J(98, 50, 'G', 'GB')] : [];
  const buts: SchemaBut[] = grandsButs
    ? [{ x: 1, y: 50, taille: 'grand', orientation: 'gauche' }, { x: 99, y: 50, taille: 'grand', orientation: 'droite' }]
    : [{ x: 1, y: 35, taille: 'mini', orientation: 'gauche' }, { x: 1, y: 65, taille: 'mini', orientation: 'gauche' },
       { x: 99, y: 35, taille: 'mini', orientation: 'droite' }, { x: 99, y: 65, taille: 'mini', orientation: 'droite' }];
  return {
    terrain: { longueur: 50, largeur: 35 },
    joueurs: [...gks, ...a, ...b],
    plots: coins(),
    buts,
    zones,
    ballons: [B(50, 50)],
    fleches: a.length >= 1 ? [F(a[0].x, a[0].y, 50, 48, 'passe'), F(50, 48, b[0]?.x ?? 70, b[0]?.y ?? 50, 'deplacement')] : [],
  };
}

// ── Construction de la séance par thème ──────────────────────────────────────

interface Splits {
  /** nb joueurs par équipe et jokers pour les jeux de conservation */
  nA: number;
  nB: number;
  jokers: number;
  rondoExt: number;
  rondoInt: number;
}

function splits(effectif: number): Splits {
  const jokers = effectif >= 9 ? (effectif % 2 === 0 ? 2 : 1) : effectif % 2;
  const reste = effectif - jokers;
  const nA = Math.ceil(reste / 2);
  const nB = Math.floor(reste / 2);
  const rondoInt = effectif >= 10 ? 3 : effectif >= 6 ? 2 : 1;
  return { nA, nB, jokers, rondoExt: Math.max(effectif - rondoInt, 3), rondoInt };
}

/**
 * Répartition des durées sur les 4 phases (échauffement, 2 corps, match).
 * La somme vaut exactement `total - 5` (5 min de retour au calme).
 */
function durees(total: number): [number, number, number, number] {
  const budget = Math.max(20, total - 5);
  const fractions = [0.2, 0.27, 0.3, 0.23];
  const out = fractions.map((f) =>
    Math.max(5, Math.round((budget * f) / 5) * 5)
  );
  // Corrige la dérive d'arrondi sur la phase la plus longue
  let drift = out.reduce((s, d) => s + d, 0) - budget;
  while (drift !== 0) {
    const idx = drift > 0 ? out.indexOf(Math.max(...out)) : out.indexOf(Math.min(...out));
    const step = Math.sign(drift) * Math.min(5, Math.abs(drift));
    if (drift > 0 && out[idx] - step < 5) break;
    out[idx] -= step;
    drift -= step;
  }
  return [out[0], out[1], out[2], out[3]];
}

function dimensionsParCategorie(c: Categorie): number {
  // Facteur d'échelle des espaces (1 = U14-U15)
  switch (c) {
    case 'U6-U7':
      return 0.5;
    case 'U8-U9':
      return 0.6;
    case 'U10-U11':
      return 0.75;
    case 'U12-U13':
      return 0.85;
    default:
      return 1;
  }
}

function scaleTerrain(s: SchemaExercice, k: number): SchemaExercice {
  return {
    ...s,
    terrain: {
      longueur: Math.max(8, Math.round(s.terrain.longueur * k)),
      largeur: Math.max(8, Math.round(s.terrain.largeur * k)),
    },
  };
}

const CHASUBLES = 'Chasubles 2 couleurs (+1 pour jokers)';

function phaseEchauffement(p: SeanceParams, s: Splits, duree: number): PhaseSeance {
  const k = dimensionsParCategorie(p.categorie);
  return {
    procede: 'echauffement',
    titre: 'Mise en train — Toro / rondo',
    duree,
    objectif: 'Préparer le corps et activer les enchaînements passe-contrôle.',
    but: 'Conserver le ballon dans le cercle, le défenseur qui touche prend la place du passeur fautif.',
    effectif: `${s.rondoExt} joueurs en périphérie, ${s.rondoInt} au centre`,
    materiel: `8 coupelles, 2 ballons, ${CHASUBLES}`,
    consignes: [
      'Commencer en jeu libre 2 minutes (mobilité articulaire avant le rondo).',
      'Passes au sol uniquement, 2 touches de balle maximum.',
      'Le défenseur qui intercepte ou provoque une sortie de balle permute.',
      'Augmenter progressivement l’intensité (1 touche en fin de phase).',
    ],
    variantes: [
      'Plus facile : 3 touches autorisées, agrandir le cercle.',
      'Plus difficile : 1 touche, ajouter un 2e ballon.',
    ],
    criteresReussite: [
      '10 passes consécutives sans perte.',
      'Corps orienté avant la réception (prise d’info).',
    ],
    schema: scaleTerrain(schemaRondo(s.rondoExt, s.rondoInt), k),
  };
}

function phaseMatch(p: SeanceParams, s: Splits, duree: number, consigneTheme: string): PhaseSeance {
  const k = dimensionsParCategorie(p.categorie);
  const grandsButs = p.effectif >= 10 && p.categorie !== 'U6-U7' && p.categorie !== 'U8-U9';
  return {
    procede: 'match',
    titre: 'Jeu final — match à thème',
    duree,
    objectif: 'Réinvestir le travail du jour dans un contexte réel de match.',
    but: 'Marquer plus de buts que l’adversaire en appliquant le thème de la séance.',
    effectif: `${s.nA} contre ${s.nB}${s.jokers ? ` + ${s.jokers} joker(s)` : ''}`,
    materiel: `Buts (${grandsButs ? '2 grands' : '4 mini-buts'}), ${CHASUBLES}, ballons en réserve`,
    consignes: [
      'Jeu libre, règles du football.',
      consigneTheme,
      'Laisser jouer : intervenir uniquement aux arrêts de jeu (feedback flash).',
    ],
    variantes: [
      'But bonus (x2) si l’action respecte le thème du jour.',
      'Dernières 5 minutes : jeu totalement libre, sans consigne.',
    ],
    criteresReussite: [
      'Les intentions travaillées apparaissent spontanément dans le jeu.',
      'Engagement et plaisir des joueurs jusqu’à la fin.',
    ],
    schema: scaleTerrain(schemaMatch(s.nA + Math.ceil(s.jokers / 2), s.nB + Math.floor(s.jokers / 2), grandsButs), k),
  };
}

type Corps = [PhaseSeance, PhaseSeance];

function corpsParTheme(p: SeanceParams, s: Splits, d2: number, d3: number): {
  corps: Corps;
  objectifSeance: string;
  consigneMatch: string;
} {
  const k = dimensionsParCategorie(p.categorie);

  switch (themeEffectif(p.theme)) {
    case 'possession':
      return {
        objectifSeance:
          'Améliorer la conservation collective du ballon sous pression.',
        consigneMatch: 'Valoriser les séquences de 8 passes et plus avant de marquer.',
        corps: [
          {
            procede: 'jeu',
            titre: `Conservation ${s.nA}c${s.nB}${s.jokers ? `+${s.jokers}` : ''} avec jokers`,
            duree: d2,
            objectif: 'Conserver collectivement sous pression en utilisant le surnombre.',
            but: 'Réaliser 10 passes consécutives = 1 point.',
            effectif: `2 équipes de ${s.nB}${s.jokers ? ` + ${s.jokers} joker(s) offensif(s)` : ''}`,
            materiel: `8 coupelles, ballons, ${CHASUBLES}`,
            consignes: [
              'Les jokers jouent toujours avec l’équipe en possession.',
              'Toucher le ballon = récupération (changement de statut immédiat).',
              'Chercher l’alternance jeu court / renversement long.',
            ],
            variantes: [
              'Plus facile : ajouter un joker intérieur.',
              'Plus difficile : limiter à 2 touches, réduire l’espace de 5 m.',
            ],
            criteresReussite: [
              '3 séquences de 10 passes par équipe.',
              'Utilisation systématique du surnombre côté ballon.',
            ],
            schema: scaleTerrain(schemaConservation(s.nA, s.nB, s.jokers), k),
          },
          {
            procede: 'situation',
            titre: 'Jeu des 3 zones — sortir de la pression',
            duree: d3,
            objectif: 'Conserver pour progresser : changer de zone dès que la pression arrive.',
            but: 'Amener le ballon en zone opposée en 12 passes maximum = 1 point.',
            effectif: `${s.nA} contre ${s.nB} répartis sur 3 zones`,
            materiel: `12 coupelles (3 zones), ballons, ${CHASUBLES}`,
            consignes: [
              'Interdiction de traverser la zone médiane en conduite : passe obligatoire.',
              '3 passes minimum dans une zone avant de basculer.',
              'À la perte : pressing immédiat 5 secondes.',
            ],
            variantes: [
              'Plus facile : zone médiane libre.',
              'Plus difficile : appui obligatoire dans la zone médiane avant de basculer.',
            ],
            criteresReussite: [
              '5 renversements de zone réussis par équipe.',
              'Disponibilité permanente des appuis (angle de passe ouvert).',
            ],
            schema: scaleTerrain(schemaJeuZones(s.nA, s.nB), k),
          },
        ],
      };

    case 'pressing':
      return {
        objectifSeance: 'Organiser le pressing collectif et la récupération haute du ballon.',
        consigneMatch: 'Récupération dans le camp adverse suivie d’un but = 2 points.',
        corps: [
          {
            procede: 'jeu',
            titre: 'Conservation contre pressing — 5 secondes pour récupérer',
            duree: d2,
            objectif: 'Déclencher un pressing coordonné dès la perte du ballon.',
            but: 'Équipe en possession : 8 passes = 1 point. Équipe en pressing : récupérer en moins de 5 secondes = 1 point.',
            effectif: `${s.nA} contre ${s.nB}${s.jokers ? ` + ${s.jokers} joker(s)` : ''}`,
            materiel: `8 coupelles, chronomètre, ${CHASUBLES}`,
            consignes: [
              'Premier défenseur : cadrer le porteur en course courbe (couper une passe).',
              'Deuxième défenseur : doubler à 3-4 mètres.',
              'Les autres : réduire les espaces, coulisser ensemble.',
            ],
            variantes: [
              'Plus facile : pressing à 2 seulement, les autres protègent les zones.',
              'Plus difficile : récupération + 3 passes pour valider le point.',
            ],
            criteresReussite: [
              '50 % des pressings aboutissent à une récupération.',
              'Déclenchement collectif sur le signal (mauvais contrôle, passe arrière).',
            ],
            schema: scaleTerrain(schemaPressing(s.nA, s.nB), k),
          },
          {
            procede: 'situation',
            titre: 'Pressing en zone — bloquer la sortie de balle',
            duree: d3,
            objectif: 'Récupérer haut dans la zone de pressing définie.',
            but: 'Récupérer le ballon dans la zone de pressing puis marquer = 2 points.',
            effectif: `${s.nA} contre ${s.nB}`,
            materiel: `Coupelles pour matérialiser la zone, mini-buts, ${CHASUBLES}`,
            consignes: [
              'L’équipe rouge construit depuis sa zone basse.',
              'L’équipe bleue déclenche le pressing dès l’entrée du ballon dans la zone.',
              'Couper les lignes de passe intérieures, orienter vers la touche.',
            ],
            variantes: [
              'Plus facile : un défenseur de plus pour l’équipe qui presse.',
              'Plus difficile : limite de 8 secondes pour récupérer.',
            ],
            criteresReussite: [
              '6 récupérations hautes sur la séquence.',
              'Distances de couverture respectées (10 m max entre les lignes).',
            ],
            schema: scaleTerrain(schemaPressing(s.nA, s.nB), k),
          },
        ],
      };

    case 'transitions':
      return {
        objectifSeance: 'Accélérer les transitions offensives et sécuriser les transitions défensives.',
        consigneMatch: 'But marqué dans les 8 secondes après une récupération = 2 points.',
        corps: [
          {
            procede: 'situation',
            titre: `Transition ${Math.min(s.nA, 4)}c${Math.min(s.nB, 3)} — attaque rapide`,
            duree: d2,
            objectif: 'Exploiter le surnombre immédiatement après la récupération.',
            but: 'Marquer en moins de 10 secondes après le départ.',
            effectif: `Vagues de ${Math.min(s.nA, 4)} attaquants contre ${Math.min(s.nB, 3)} défenseurs + 1 gardien`,
            materiel: `1 grand but, 1 mini-but, ballons, ${CHASUBLES}`,
            consignes: [
              'Départ au signal : 1re passe vers l’avant obligatoire.',
              'Jouer dans la profondeur dès que possible, finir l’action.',
              'Si les défenseurs récupèrent : contre-attaque vers le mini-but.',
            ],
            variantes: [
              'Plus facile : ajouter un attaquant (surnombre +2).',
              'Plus difficile : un défenseur supplémentaire entre en retard (course de recul).',
            ],
            criteresReussite: [
              '60 % des vagues se terminent par une frappe.',
              'Moins de 10 secondes entre départ et frappe.',
            ],
            schema: scaleTerrain(schemaTransition(Math.min(s.nA, 4), Math.min(s.nB, 3)), k),
          },
          {
            procede: 'jeu',
            titre: 'Jeu de transition — changement de statut permanent',
            duree: d3,
            objectif: 'Réagir instantanément au changement de statut (perte/récupération).',
            but: 'Marquer dans un des buts adverses ; toute récupération doit être jouée vers l’avant en 3 secondes.',
            effectif: `${s.nA} contre ${s.nB}${s.jokers ? ` + ${s.jokers} joker(s)` : ''}`,
            materiel: `4 mini-buts, ballons, ${CHASUBLES}`,
            consignes: [
              'À la récupération : première intention vers l’avant.',
              'À la perte : 5 secondes de pressing puis repli en bloc.',
              'Le coach relance immédiatement un nouveau ballon après chaque but.',
            ],
            variantes: [
              'Plus facile : 5 secondes pour jouer vers l’avant.',
              'Plus difficile : but valable uniquement si toute l’équipe a franchi la médiane.',
            ],
            criteresReussite: [
              'Aucune récupération jouée en arrière sans pression.',
              'Replis défensifs effectués en moins de 6 secondes.',
            ],
            schema: scaleTerrain(schemaMatch(s.nA, s.nB, false, { longueur: 40, largeur: 30 }), k),
          },
        ],
      };

    case 'finition':
      return {
        objectifSeance: 'Améliorer l’efficacité devant le but : prise de décision et qualité de frappe.',
        consigneMatch: 'Tout but marqué en 1 touche = 2 points.',
        corps: [
          {
            procede: 'exercice',
            titre: 'Circuit de finition — passe, remise, frappe',
            duree: d2,
            objectif: 'Enchaîner course, remise et frappe en mouvement.',
            but: 'Marquer (cadrer à défaut) à chaque passage.',
            effectif: '2 colonnes de passeurs/frappeurs + 1 gardien + 1 défenseur passif',
            materiel: `1 grand but, 10 ballons, 6 coupelles, ${CHASUBLES}`,
            consignes: [
              'A1 transmet à A3 (appui), qui remise dans la course.',
              'Frappe en 2 touches maximum, ballon en dehors de la surface.',
              'Rotation : passeur → appui → frappeur → récupérateur.',
            ],
            variantes: [
              'Plus facile : sans défenseur, remise à suivre simple.',
              'Plus difficile : défenseur actif, frappe en 1 touche.',
            ],
            criteresReussite: [
              '70 % de frappes cadrées.',
              'Frappe déclenchée en moins de 2 secondes après la remise.',
            ],
            schema: scaleTerrain(schemaFinition(), k),
          },
          {
            procede: 'situation',
            titre: 'Surnombre offensif — finir l’action',
            duree: d3,
            objectif: 'Choisir la bonne solution de finition en supériorité numérique.',
            but: 'Marquer avant que le défenseur de recul ne revienne.',
            effectif: `Vagues de 3 attaquants contre 2 défenseurs + gardien`,
            materiel: `1 grand but, ballons, 4 coupelles, ${CHASUBLES}`,
            consignes: [
              'Fixer un défenseur avant de donner (créer le 2c1).',
              'Frapper dès que la fenêtre est ouverte : ne pas chercher la passe de trop.',
              'Le gardien relance sur la vague suivante.',
            ],
            variantes: [
              'Plus facile : 3c1 + gardien.',
              'Plus difficile : un 3e défenseur entre après 5 secondes.',
            ],
            criteresReussite: [
              '1 frappe par vague minimum.',
              '50 % d’actions converties en but.',
            ],
            schema: scaleTerrain(schemaTransition(3, 2), k),
          },
        ],
      };

    case 'ailes':
      return {
        objectifSeance: 'Utiliser la largeur : débordements, centres et finition dans la surface.',
        consigneMatch: 'But sur centre venu d’un couloir = 2 points.',
        corps: [
          {
            procede: 'exercice',
            titre: 'Débordement et centre — timing des appels',
            duree: d2,
            objectif: 'Synchroniser le débordement de l’ailier et les appels dans la surface.',
            but: 'Marquer sur un centre (1er poteau, 2e poteau ou retrait).',
            effectif: '2 ailiers, 2 attaquants, 2 défenseurs, 1 gardien (rotations)',
            materiel: `1 grand but, ballons, coupelles pour les couloirs, ${CHASUBLES}`,
            consignes: [
              'L’ailier déborde dans le couloir et lève la tête avant le centre.',
              'Appels croisés : un joueur au 1er poteau, un au point de penalty.',
              'Varier centres forts au sol et centres enroulés.',
            ],
            variantes: [
              'Plus facile : sans défenseur dans la surface.',
              'Plus difficile : 2 défenseurs actifs + centre en 1 touche.',
            ],
            criteresReussite: [
              '7 centres exploitables sur 10.',
              'Appels déclenchés au moment de la prise d’info de l’ailier.',
            ],
            schema: scaleTerrain(schemaAilesCentres(), k),
          },
          {
            procede: 'jeu',
            titre: 'Jeu avec couloirs — valoriser la largeur',
            duree: d3,
            objectif: 'Chercher systématiquement les couloirs libres pour déséquilibrer.',
            but: 'But précédé d’un passage par un couloir = 2 points, sinon 1 point.',
            effectif: `${s.nA} contre ${s.nB}, couloirs latéraux libres ou à 1c1`,
            materiel: `Coupelles (couloirs), 2 buts ou 4 mini-buts, ${CHASUBLES}`,
            consignes: [
              'Couloirs réservés : 1 attaquant maximum, pas de défenseur (au début).',
              'Renverser le jeu quand un côté est saturé.',
              'Centre obligatoire en moins de 3 touches dans le couloir.',
            ],
            variantes: [
              'Plus facile : aucun défenseur autorisé dans les couloirs.',
              'Plus difficile : 1c1 autorisé dans les couloirs.',
            ],
            criteresReussite: [
              '8 attaques par les couloirs par équipe.',
              'Renversements côté faible identifiés et joués.',
            ],
            schema: scaleTerrain(schemaAilesCentres(), k),
          },
        ],
      };

    case 'technique':
      return {
        objectifSeance: 'Perfectionner la qualité de passe et le premier contrôle orienté.',
        consigneMatch: 'Jeu en 2 touches maximum dans son camp.',
        corps: [
          {
            procede: 'exercice',
            titre: 'Carré technique — passe, contrôle orienté, conduite',
            duree: d2,
            objectif: 'Automatiser passe appuyée + contrôle orienté dans le sens du jeu.',
            but: 'Enchaîner les circuits sans perte de balle.',
            effectif: 'Groupes de 4 à 8 par carré (plusieurs carrés en parallèle)',
            materiel: `4 plots par carré, 2 ballons par carré, ${CHASUBLES}`,
            consignes: [
              'Passe appuyée au sol, dans le bon pied (pied éloigné du défenseur fictif).',
              'Contrôle orienté vers le plot suivant, jamais de contrôle bloqué.',
              'Suivre sa passe : rotation dans le sens du circuit.',
            ],
            variantes: [
              'Plus facile : un seul ballon, sens unique.',
              'Plus difficile : 2 ballons simultanés, changement de sens au signal.',
            ],
            criteresReussite: [
              '2 minutes de circuit sans perte de balle.',
              'Contrôles orientés systématiques (pas de 2e touche de rattrapage).',
            ],
            schema: scaleTerrain(schemaCarrePasses(), k),
          },
          {
            procede: 'jeu',
            titre: `Conservation ${s.nA}c${s.nB} — qualité sous pression`,
            duree: d3,
            objectif: 'Réinvestir la qualité technique face à une vraie opposition.',
            but: '10 passes consécutives = 1 point.',
            effectif: `2 équipes de ${s.nB}${s.jokers ? ` + ${s.jokers} joker(s)` : ''}`,
            materiel: `8 coupelles, ballons, ${CHASUBLES}`,
            consignes: [
              '2 touches maximum.',
              'Toute passe ratée techniquement (hors jeu, trop molle) = ballon à l’adversaire.',
              'Valoriser les passes qui cassent une ligne.',
            ],
            variantes: [
              'Plus facile : 3 touches, espace plus grand.',
              'Plus difficile : 1 touche pour les jokers.',
            ],
            criteresReussite: [
              'Moins de 1 perte de balle technique par minute.',
              '3 séquences de 10 passes par équipe.',
            ],
            schema: scaleTerrain(schemaConservation(s.nA, s.nB, s.jokers), k),
          },
        ],
      };

    case 'conduite':
      return {
        objectifSeance: 'Améliorer la conduite de balle, les changements de direction et le dribble.',
        consigneMatch: 'Dribble réussi avant un but = 2 points.',
        corps: [
          {
            procede: 'exercice',
            titre: 'Parcours de conduite — slalom et changements de rythme',
            duree: d2,
            objectif: 'Maîtriser le ballon en conduite à vitesse croissante.',
            but: 'Réaliser le parcours sans toucher de plot, le plus vite possible.',
            effectif: '3 colonnes en parallèle (départ toutes les 5 secondes)',
            materiel: `15 plots, 1 ballon par joueur`,
            consignes: [
              'Petites touches : le ballon reste à moins d’un mètre du pied.',
              'Utiliser les deux pieds, intérieur et extérieur.',
              'Accélérer après le dernier plot (changement de rythme).',
            ],
            variantes: [
              'Plus facile : parcours élargi, vitesse libre.',
              'Plus difficile : course-poursuite à deux, départ décalé d’une seconde.',
            ],
            criteresReussite: [
              'Parcours propre à haute intensité (0 plot touché).',
              'Tête levée sur les portions droites.',
            ],
            schema: scaleTerrain(schemaConduite(), k),
          },
          {
            procede: 'situation',
            titre: 'Duels 1c1 — éliminer pour marquer',
            duree: d3,
            objectif: 'Oser le dribble pour éliminer et créer le déséquilibre.',
            but: 'Franchir le défenseur et marquer dans un des 2 mini-buts.',
            effectif: 'Duos attaquant/défenseur, rotation toutes les 4 répétitions',
            materiel: `2 mini-buts par atelier, coupelles, ballons, ${CHASUBLES}`,
            consignes: [
              'Attaquant : attaquer le défenseur à vitesse, feinter puis accélérer.',
              'Défenseur : cadrer, orienter vers l’extérieur, ne pas se jeter.',
              'Duel terminé = retour en marchant (récupération).',
            ],
            variantes: [
              'Plus facile : défenseur en marche arrière uniquement.',
              'Plus difficile : 2e défenseur en couverture après 3 secondes.',
            ],
            criteresReussite: [
              '50 % de duels gagnés par l’attaquant.',
              'Changement de rythme net après la feinte.',
            ],
            schema: scaleTerrain(schemaDuel1c1(), k),
          },
        ],
      };

    case 'duels':
      return {
        objectifSeance: 'Gagner ses duels offensifs et défensifs (1 contre 1).',
        consigneMatch: 'Duel gagné menant à un but = 2 points.',
        corps: [
          {
            procede: 'exercice',
            titre: 'Ateliers 1c1 — face à face',
            duree: d2,
            objectif: 'Répéter les duels dans les deux sens (attaque et défense).',
            but: 'Attaquant : marquer dans un mini-but. Défenseur : récupérer et sortir en conduite.',
            effectif: 'Duos sur 2-3 ateliers en parallèle',
            materiel: `Mini-buts, coupelles, ballons, ${CHASUBLES}`,
            consignes: [
              'Attaquant : fixer un côté, basculer de l’autre, accélérer.',
              'Défenseur : flexion, appuis dynamiques, attaquer le ballon au bon moment.',
              'Alterner les rôles toutes les 4 répétitions.',
            ],
            variantes: [
              'Plus facile : départ avec 2 m d’avance pour l’attaquant.',
              'Plus difficile : duel lancé par une passe du défenseur (contrôle sous pression).',
            ],
            criteresReussite: [
              'Duels disputés à intensité maximale.',
              'Défenseur : ne jamais se faire éliminer côté intérieur.',
            ],
            schema: scaleTerrain(schemaDuel1c1(), k),
          },
          {
            procede: 'jeu',
            titre: 'Jeu de duels — tout le terrain en 1c1',
            duree: d3,
            objectif: 'Multiplier les duels dans un cadre de jeu réel.',
            but: 'Marquer dans le but adverse ; chaque joueur marque son adversaire direct.',
            effectif: `${s.nA} contre ${s.nB} en marquage individuel strict`,
            materiel: `4 mini-buts, ${CHASUBLES}, ballons`,
            consignes: [
              'Marquage individuel : chacun est responsable de son duel.',
              'Interdiction de prendre le ballon d’un autre duel.',
              'En attaque : provoquer en 1c1 dès que possible.',
            ],
            variantes: [
              'Plus facile : un joker offensif qui aide le porteur.',
              'Plus difficile : duel perdu = gage technique (5 jonglages).',
            ],
            criteresReussite: [
              'Chaque joueur tente au moins 5 dribbles.',
              'Aucun duel défensif abandonné.',
            ],
            schema: scaleTerrain(schemaMatch(s.nA, s.nB, false, { longueur: 35, largeur: 25 }), k),
          },
        ],
      };

    case 'vitesse':
      return {
        objectifSeance: 'Développer vitesse, vivacité et coordination avec et sans ballon.',
        consigneMatch: 'Jouer vite vers l’avant : but en moins de 10 secondes = 2 points.',
        corps: [
          {
            procede: 'exercice',
            titre: 'Relais vitesse — course et conduite',
            duree: d2,
            objectif: 'Travailler la vitesse de course puis la vitesse avec ballon.',
            but: 'Équipe relais la plus rapide (cumul des passages).',
            effectif: '2 équipes en colonnes face aux parcours',
            materiel: `12 plots, 1 ballon par équipe, chronomètre`,
            consignes: [
              'Premier tronçon : sprint sans ballon jusqu’au plot central.',
              'Deuxième tronçon : conduite rapide jusqu’au plot rouge, puis retour.',
              'Départ du suivant au passage de ligne (pas avant).',
            ],
            variantes: [
              'Plus facile : distances réduites.',
              'Plus difficile : départs variés (assis, dos à la course), slalom au retour.',
            ],
            criteresReussite: [
              'Intensité maximale sur chaque passage.',
              'Récupération complète entre les passages (qualité avant quantité).',
            ],
            schema: scaleTerrain(schemaVitesseRelais(), k),
          },
          {
            procede: 'situation',
            titre: 'Courses-duels — premier sur le ballon',
            duree: d3,
            objectif: 'Réagir vite au signal et gagner le ballon avant l’adversaire.',
            but: 'Toucher le ballon en premier puis marquer dans le mini-but.',
            effectif: '2 colonnes face à face, duels par vagues',
            materiel: `Mini-buts, ballons, coupelles, ${CHASUBLES}`,
            consignes: [
              'Au signal (visuel ou sonore), sprint vers le ballon central.',
              'Le premier sur le ballon attaque, l’autre défend immédiatement.',
              'Varier les positions de départ (assis, allongé, dos).',
            ],
            variantes: [
              'Plus facile : départs identiques, distance égale.',
              'Plus difficile : handicap de distance pour le plus rapide.',
            ],
            criteresReussite: [
              'Temps de réaction courts et constants.',
              'Duel disputé jusqu’au bout (pas d’abandon).',
            ],
            schema: scaleTerrain(schemaDuel1c1(), k),
          },
        ],
      };

    case 'defense':
      return {
        objectifSeance: 'Structurer le bloc défensif : cadrage, couverture et coulissement.',
        consigneMatch: 'Clean-sheet sur une période de 5 minutes = 2 points.',
        corps: [
          {
            procede: 'situation',
            titre: 'Bloc défensif — coulisser et protéger l’axe',
            duree: d2,
            objectif: 'Coulisser collectivement pour fermer le côté ballon.',
            but: 'Défense : récupérer et sortir en passe. Attaque : marquer dans le grand but.',
            effectif: `Bloc de ${Math.min(s.nA, 7)} défenseurs + gardien contre ${Math.min(s.nB, 4) + 1} attaquants`,
            materiel: `1 grand but, coupelles repères, ${CHASUBLES}`,
            consignes: [
              'Côté ballon : cadrage + couverture à 3-4 mètres.',
              'Côté opposé : resserrer dans l’axe (coulissement).',
              'Communication permanente du gardien et de l’axial.',
            ],
            variantes: [
              'Plus facile : attaque limitée à 2 touches.',
              'Plus difficile : ajouter un attaquant (égalité numérique).',
            ],
            criteresReussite: [
              'Aucune passe qui traverse le bloc dans l’axe.',
              'Distances entre lignes ≤ 10 mètres en permanence.',
            ],
            schema: scaleTerrain(schemaBlocDefensif(), k),
          },
          {
            procede: 'jeu',
            titre: 'Défendre en infériorité — résister puis sortir',
            duree: d3,
            objectif: 'Défendre en infériorité numérique sans se découvrir.',
            but: 'Défense : tenir 2 minutes ou sortir proprement = 1 point. Attaque : marquer = 1 point.',
            effectif: `${s.nB} défenseurs contre ${s.nA} attaquants`,
            materiel: `Buts, ${CHASUBLES}, ballons, chronomètre`,
            consignes: [
              'Temporiser : ne jamais se jeter, reculer en bloquant l’axe.',
              'Déclencher le duel uniquement sur un mauvais contrôle.',
              'Sortie de balle : passe vers une zone cible (pas de dégagement).',
            ],
            variantes: [
              'Plus facile : réduire le surnombre offensif.',
              'Plus difficile : défense sans tacle autorisé.',
            ],
            criteresReussite: [
              '50 % des séquences sans but encaissé.',
              'Sorties de balle propres (pas de ballon rendu).',
            ],
            schema: scaleTerrain(schemaBlocDefensif(), k),
          },
        ],
      };

    default:
      return corpsParTheme({ ...p, theme: 'possession' }, s, d2, d3);
  }
}

// ── Alternatives supplémentaires pour le draft ────────────────────────────────

function phaseEchauffementJeuPositionnel(p: SeanceParams, s: Splits, duree: number): PhaseSeance {
  const k = dimensionsParCategorie(p.categorie);
  return {
    procede: 'echauffement',
    titre: 'Mise en train — Jeu de positionnement',
    duree,
    objectif: "Activer la prise d'information et les déplacements avec ballon.",
    but: "Rejoindre la zone libre avant l'adversaire, conserver le ballon.",
    effectif: `${s.nA} contre ${s.nB}, 4 zones de couleur aux coins`,
    materiel: '8 coupelles colorées, 2 ballons, chasubles',
    consignes: [
      "Jeu en 2 équipes : l'équipe en possession cherche une zone libre et y amène le ballon.",
      "Défenseur qui touche le ballon ou pénètre la zone libre = changement de statut.",
      'Communication : appeler la zone cible avant de jouer.',
      'Progresser vers 1 touche maximum.',
    ],
    variantes: [
      'Plus facile : 3 touches autorisées, zones plus grandes.',
      '1 touche, zones réduites, 2 défenseurs actifs.',
    ],
    criteresReussite: [
      'Au moins 3 changements de zone réussis par équipe.',
      "Tête levée avant la réception (lecture de l'espace).",
    ],
    schema: scaleTerrain(schemaEchauffementZigzag(), k),
  };
}

function phaseEchauffementCarreDemarquage(p: SeanceParams, _s: Splits, duree: number): PhaseSeance {
  const k = dimensionsParCategorie(p.categorie);
  return {
    procede: 'echauffement',
    titre: 'Mise en train — Carré de passes et démarquage',
    duree,
    objectif: "Automatiser le démarquage après la passe et la prise d'info.",
    but: 'Enchaîner les séquences passe-démarquage sans rupture.',
    effectif: 'Groupes de 5 à 7 par carré',
    materiel: '4 plots orange par carré, 1 ballon par groupe',
    consignes: [
      'Passe vers le joueur suivant dans le sens horaire, puis démarquage dans la diagonale.',
      'Suivre immédiatement sa passe pour occuper une nouvelle position.',
      'Appel de balle en diagonale, jamais dans le dos du passeur.',
      'Augmenter la vitesse progressivement.',
    ],
    variantes: [
      'Plus facile : déplacement libre après la passe.',
      'Plus difficile : 2 ballons simultanés dans le circuit.',
    ],
    criteresReussite: [
      '2 minutes de circuit sans interruption.',
      'Démarquage systématique après chaque passe.',
    ],
    schema: scaleTerrain(schemaCarrePasses(), k),
  };
}

function phaseMatchMiniZones(p: SeanceParams, s: Splits, duree: number, consigneTheme: string): PhaseSeance {
  const k = dimensionsParCategorie(p.categorie);
  return {
    procede: 'match',
    titre: 'Jeu final — Match avec zones de marque',
    duree,
    objectif: 'Réinvestir le thème du jour dans un contexte de match à points.',
    but: "Marquer en zone d'en-but adverse (2 pts) ou en mini-but (1 pt).",
    effectif: `${s.nA} contre ${s.nB}${s.jokers ? ` + ${s.jokers} joker(s)` : ''}`,
    materiel: "4 mini-buts + 2 zones d'en-but, chasubles, ballons en réserve",
    consignes: [
      'Jeu libre, règles du football.',
      consigneTheme,
      "Zone d'en-but (5 m) : tout joueur qui y pénètre avec le ballon = 2 points.",
      'Mini-buts aux 4 coins pour tirs rapides = 1 point.',
    ],
    variantes: [
      "Bonus x2 si l'action vient d'un côté non dominant.",
      "Dernières 5 min : zone d'en-but supprimée, jeu libre.",
    ],
    criteresReussite: [
      'Les comportements du thème apparaissent spontanément.',
      "Les deux équipes tentent d'atteindre la zone d'en-but.",
    ],
    schema: scaleTerrain(schemaMatchZoneCentrale(s.nA + Math.ceil(s.jokers / 2), s.nB + Math.floor(s.jokers / 2), false), k),
  };
}

function phaseMatchPression(p: SeanceParams, s: Splits, duree: number, consigneTheme: string): PhaseSeance {
  const k = dimensionsParCategorie(p.categorie);
  const grandsButs = p.effectif >= 10 && p.categorie !== 'U6-U7' && p.categorie !== 'U8-U9';
  return {
    procede: 'match',
    titre: 'Jeu final — Match à pression temporelle',
    duree,
    objectif: 'Reproduire le thème sous pression de score et de temps.',
    but: 'Mener au score à la mi-temps garantit 1 ballon supplémentaire en 2e mi-temps.',
    effectif: `${s.nA} contre ${s.nB}${s.jokers ? ` + ${s.jokers} joker(s)` : ''}`,
    materiel: `Buts (${grandsButs ? '2 grands' : '4 mini-buts'}), chronomètre, chasubles, ballons`,
    consignes: [
      'Deux mi-temps de durée égale.',
      consigneTheme,
      "L'équipe qui mène à la mi-temps joue la 2e mi-temps avec 1 ballon en réserve (relance rapide).",
      'Signal du coach = arrêt immédiat, feedback de 30 secondes puis reprise.',
    ],
    variantes: [
      'But valable seulement si 4 joueurs dans la moitié adverse.',
      "Toute récupération haute doit être jouée vers l'avant en 5 secondes.",
    ],
    criteresReussite: [
      'Les intentions du thème sont maintenues en fin de match (fatigue).',
      'Aucune équipe ne subit une série de 3 buts sans réagir tactiquement.',
    ],
    schema: scaleTerrain(schemaMatch(s.nA + Math.ceil(s.jokers / 2), s.nB + Math.floor(s.jokers / 2), grandsButs), k),
  };
}

const MATERIEL_GLOBAL =
  'Ballons (1 pour 2 minimum), coupelles, plots, chasubles 3 couleurs, mini-buts, chronomètre';

const RETOUR_AU_CALME =
  'Retour au calme (5 min) : trottinement léger, étirements activo-dynamiques, hydratation. ' +
  'Bilan collectif : 2 questions ouvertes aux joueurs sur le thème du jour ' +
  "(« Qu’est-ce qui a bien fonctionné ? Que fera-t-on différemment en match ? »).";

function ajusterCharge(phases: PhaseSeance[], charge: Charge): PhaseSeance[] {
  if (charge === 'Récupération') {
    return phases.map((ph) => ({
      ...ph,
      consignes: [
        ...ph.consignes,
        'Charge "Récupération" : intensité sous-maximale, allonger les temps de repos entre séquences.',
      ],
    }));
  }
  if (charge === 'Élevée') {
    return phases.map((ph) => ({
      ...ph,
      consignes: [
        ...ph.consignes,
        'Charge "Élevée" : séquences courtes à intensité maximale, ratio effort/repos 1:1.',
      ],
    }));
  }
  return phases;
}

/** Construit une séance complète, hors-ligne, pour les paramètres donnés. */
export function buildSeance(params: SeanceParams): Seance {
  const s = splits(params.effectif);
  const [d1, d2, d3, d4] = durees(params.duree);
  const { corps, objectifSeance, consigneMatch } = corpsParTheme(params, s, d2, d3);

  const phases = ajusterCharge(
    [
      phaseEchauffement(params, s, d1),
      ...corps,
      phaseMatch(params, s, d4, consigneMatch),
    ],
    params.charge
  );

  return {
    version: 2,
    titre: `Séance ${themeLabel(params.theme)} — ${params.categorie}`,
    categorie: params.categorie,
    theme: params.theme,
    ecole: params.ecole,
    objectif: objectifSeance,
    dureeTotale: params.duree,
    effectif: params.effectif,
    charge: params.charge,
    materiel: MATERIEL_GLOBAL,
    phases,
    retourAuCalme: RETOUR_AU_CALME,
    conseilsCoach: [
      `Préparer le matériel et tracer les espaces avant l'arrivée des joueurs.`,
      `Donner les consignes en moins de 60 secondes, démontrer plutôt qu'expliquer.`,
      `Adapter les espaces : trop facile → réduire ; trop difficile → agrandir.`,
      `Garder un temps de jeu effectif élevé : limiter les files d'attente.`,
    ],
  };
}

/**
 * Construit un draft hors-ligne avec jusqu’à 3 alternatives par phase.
 * Utilisé comme repli quand l’IA est indisponible pour la génération de draft.
 */
export function buildDraftFallback(params: SeanceParams): SeanceDraft {
  const s = splits(params.effectif);
  const [d1, d2, d3, d4] = durees(params.duree);
  const { corps, objectifSeance, consigneMatch } = corpsParTheme(params, s, d2, d3);

  const echauffements: PhaseSeance[] = [
    phaseEchauffement(params, s, d1),
    phaseEchauffementJeuPositionnel(params, s, d1),
    phaseEchauffementCarreDemarquage(params, s, d1),
  ];

  const matchs: PhaseSeance[] = [
    phaseMatch(params, s, d4, consigneMatch),
    phaseMatchMiniZones(params, s, d4, consigneMatch),
    phaseMatchPression(params, s, d4, consigneMatch),
  ];

  const k = dimensionsParCategorie(params.categorie);

  // Corps 1 — 3 variantes avec schémas différents
  const corps1Var2: PhaseSeance = {
    ...corps[0],
    titre: `${corps[0].titre} — variante jeu en largeur`,
    schema: scaleTerrain(schemaJeuLargeur(s.nA, s.nB), k),
  };
  const corps1Var3: PhaseSeance = {
    ...corps[0],
    titre: `${corps[0].titre} — variante attaque placée`,
    schema: scaleTerrain(schemaAttaquePlacee(), k),
  };

  // Corps 2 — 3 variantes avec schémas différents
  const corps2Var2: PhaseSeance = {
    ...corps[1],
    titre: `${corps[1].titre} — variante triangle`,
    schema: scaleTerrain(schemaTrianglePasses(), k),
  };
  const corps2Var3: PhaseSeance = {
    ...corps[1],
    titre: `${corps[1].titre} — variante jeu de zones`,
    schema: scaleTerrain(schemaJeuZones(s.nA, s.nB), k),
  };

  const alternatives: AlternativesPhase[] = [
    { phase: `echauffement` as PhaseType, options: echauffements },
    { phase: `corps1` as PhaseType, options: [corps[0], corps1Var2, corps1Var3] },
    { phase: `corps2` as PhaseType, options: [corps[1], corps2Var2, corps2Var3] },
    { phase: `match` as PhaseType, options: matchs },
  ];

  return {
    params,
    titre: `Séance ${themeLabel(params.theme)} — ${params.categorie}`,
    objectif: objectifSeance,
    materiel: MATERIEL_GLOBAL,
    retourAuCalme: RETOUR_AU_CALME,
    conseilsCoach: [
      `Préparer le matériel et tracer les espaces avant l'arrivée des joueurs.`,
      `Donner les consignes en moins de 60 secondes, démontrer plutôt qu'expliquer.`,
      `Adapter les espaces : trop facile → réduire ; trop difficile → agrandir.`,
      `Garder un temps de jeu effectif élevé : limiter les files d'attente.`,
    ],
    alternatives,
    source: `bibliotheque`,
  };
}

/** Schéma de remplacement par procédé quand le schéma IA est invalide. */
export function fallbackSchemaFor(
  procede: PhaseSeance['procede'],
  effectif: number
): SchemaExercice {
  const s = splits(effectif);
  switch (procede) {
    case 'echauffement':
      return schemaRondo(s.rondoExt, s.rondoInt);
    case 'jeu':
      return schemaConservation(s.nA, s.nB, s.jokers);
    case 'exercice':
      return schemaCarrePasses();
    case 'situation':
      return schemaTransition(Math.min(s.nA, 4), Math.min(s.nB, 3));
    case 'match':
      return schemaMatch(s.nA, s.nB, effectif >= 10);
  }
}
