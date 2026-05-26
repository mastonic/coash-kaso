export const mockSessionData = {
  games: [
    {
      title: 'Possession Rondo 4v2',
      objective: 'Contrôler le ballon sous pression',
      content: '4 joueurs passent, 2 défenseurs cherchent à intercepter dans grille 15x15m. Chaque passe réussie = 1 point. Après perte, les défenseurs sortent et les défenseurs entrent.',
      illustration: `   O───O
  │     │
  O     O
  │  XX │
  └─────┘
O=attaquant, X=défenseur`,
      setup: 'Grille 15x15m, 4 cônes aux angles, 1 ballon',
      duration: 20,
    },
    {
      title: 'Pressing 5v5',
      objective: 'Regagner le ballon rapidement',
      content: '5v5 avec zone de pressing stricte (20m). Ballon perdu dans zone = 1 point pour équipe attaque. Ballon récupéré = changement possession.',
      illustration: `XXXXX (défense)
  ───
OOOOO (attaque)`,
      setup: 'Terrain réduit 40x30m, zone pressing 20m, 2 buts',
      duration: 20,
    },
    {
      title: 'Transition Rapide 8v8',
      objective: 'Accélération verticale en counter-attaque',
      content: '8v8 avec 3 zones (défense/milieu/attaque). Perte de ballon = transition immédiate. But en contre = 2 points.',
      illustration: `Zone défense
───────────
Zone milieu
───────────
Zone attaque`,
      setup: 'Terrain 60x40m, 3 zones marquées, 2 buts, cônes',
      duration: 20,
    },
  ],
  exercises: [
    {
      title: 'Contrôle Direction',
      objective: 'Améliorer maîtrise du ballon en mouvement',
      content: 'Slalom entre 6 cônes espacés 2m. 3 séries x 5 répétitions. Pied droit, gauche, alternance. Accélération progressive.',
      illustration: `O──O──O──O──O──O
 │ ballon slalom │`,
      technique: 'Touchers courts, première touche proche du pied, regard levé entre les cônes',
      duration: 15,
    },
    {
      title: 'Passe Précision en Triangle',
      objective: 'Atteindre 85% de réussite minimum',
      content: 'Triangle 10m entre 3 joueurs. Passe et déplacement. 3 séries x 2 min avec feedback collectif. Progression: 1 touche → 2 touches.',
      illustration: `   O (joueur 1)
  / \\
 /   \\
O─────O (joueurs 2-3)
Passe rapide 1 touche`,
      technique: 'Pied d\'appui stable, première touche côté opposé au défenseur, regard levé',
      duration: 15,
    },
    {
      title: 'Vitesse-Explosivité',
      objective: 'Développer accélération 0-5m',
      content: 'Sprints avec changement direction sur plots. 8 répétitions x 30m. Récupération marche retour.',
      illustration: `[O] début
 │ accélération
[|] plot
 │ virage
[→] sprint`,
      technique: 'Décollage puissant, petits pas en virage, tête stable, bras actifs',
      duration: 15,
    },
  ],
  situations: [
    {
      title: 'Match 7v7 Réduit',
      objective: 'Application tactique en conditions réelles',
      content: '2x15min sur terrain 50x40m. Arbitrage strict du thème tactique. Changement d\'équipes à chaque arrêt.',
      illustration: `●●●●●●●att
    │
goal─┼─goal
    │
●●●●●●●déf
50x40m avec 2 buts`,
      fieldSetup: '50x40m, 2 buts normaux, arbitrage strict, scoring normal',
      duration: 20,
    },
    {
      title: 'Phases Arrêtées Attaque',
      objective: 'Améliorer efficacité sur corners',
      content: '3 variantes de corners (court, long, déviation). 10 tirs par variante. Gardien en place, 3 défenseurs passifs.',
      illustration: `     │
     ├─→ O (tête)
  ┌──┼─→ O (pied)
  │  │
  ○  goal
corner`,
      fieldSetup: 'Surface penalty, 3 défenseurs, 1 gardien, ballon de corner',
      duration: 20,
    },
    {
      title: 'Récupération Active',
      objective: 'Descente progressive de l\'intensité',
      content: 'Possession tranquille 2x8min à 70% d\'effort. Circulation lente, passes courtes. Focus sur respiration et relâchement musculaire.',
      illustration: `O───O───O
│       │
O───O───O
Possession simple sans pressing`,
      fieldSetup: 'Terrain complet, pas de défense, circulation lente, accent sur la récupération',
      duration: 15,
    },
  ],
};

export const mockAnalysisData = {
  strengths: [
    'Organisation défensive très stable, pressing coordonné',
    'Transitions rapides, contre-attaques bien exécutées',
    'Technique collective excellente en phases de possession',
  ],
  weaknesses: [
    'Manque de vitesse en première ligne de presse',
    'Placement défensif fragile sur coté faible',
    'Ballons longs imprécis (38% réussite)',
  ],
  recommendations: [
    { theme: 'pressing', suggestion: 'Augmenter agressivité première ligne avec travail de pointe' },
    { theme: 'centre', suggestion: 'Renforcer latéralité défense par 1v1 positif' },
    { theme: 'controle', suggestion: 'Sessions passes longues précision 2x15min par semaine' },
  ],
};
