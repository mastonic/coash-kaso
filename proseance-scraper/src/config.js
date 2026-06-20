/**
 * Configuration centrale du scraper ProSeance.
 */

// ── Mapping mots-clés → catégorie Exercise ────────────────────────────────────

export const KEYWORD_TO_CATEGORY = {
  // passing
  passe: 'passing', passes: 'passing', passing: 'passing', 'passe courte': 'passing',
  'passe longue': 'passing', contrôle: 'passing', control: 'passing', reception: 'passing',
  // shooting
  tir: 'shooting', frappe: 'shooting', shooting: 'shooting', finition: 'shooting',
  finishing: 'shooting', 'tir au but': 'shooting', volée: 'shooting',
  // dribbling
  dribble: 'dribbling', conduite: 'dribbling', dribbling: 'dribbling', feinte: 'dribbling',
  regate: 'dribbling', 'prise de balle': 'dribbling',
  // defending
  défense: 'defending', défensif: 'defending', defending: 'defending', marquage: 'defending',
  tacle: 'defending', interception: 'defending', 'défense individuelle': 'defending',
  // fitness
  physique: 'fitness', endurance: 'fitness', vitesse: 'fitness', condition: 'fitness',
  fitness: 'fitness', sprint: 'fitness', agilité: 'fitness', coordination: 'fitness',
  // tactical
  tactique: 'tactical', tactique: 'tactical', tactical: 'tactical', organisation: 'tactical',
  formation: 'tactical', jeu collectif: 'tactical', animation: 'tactical',
  // set_piece
  coup: 'set_piece', corner: 'set_piece', 'coup franc': 'set_piece', penalty: 'set_piece',
  'phase arrêtée': 'set_piece', 'dead ball': 'set_piece', 'set piece': 'set_piece',
  // goalkeeping
  gardien: 'goalkeeping', goalkeeper: 'goalkeeping', plongeon: 'goalkeeping',
  arrêt: 'goalkeeping', relance: 'goalkeeping', sortie: 'goalkeeping',
  // possession
  possession: 'possession', rondo: 'possession', conservation: 'possession',
  'jeu de position': 'possession', 'jeu en triangle': 'possession',
  // pressing
  pressing: 'pressing', récupération: 'pressing', pressing: 'pressing',
  'haute pression': 'pressing', 'pressing haut': 'pressing', repli: 'pressing',
  // transition
  transition: 'transition', contre: 'transition', contre-attaque: 'transition',
  'jeu rapide': 'transition', 'sortie de balle': 'transition',
  // warm_up
  échauffement: 'warm_up', warmup: 'warm_up', 'mise en train': 'warm_up',
  activation: 'warm_up', jonglage: 'warm_up',
};

// ── Mapping mots-clés → phase Exercise ───────────────────────────────────────

export const KEYWORD_TO_PHASE = {
  échauffement: 'warm_up',
  'mise en train': 'warm_up',
  warmup: 'warm_up',
  activation: 'warm_up',
  'jeu final': 'cool_down',
  'match final': 'cool_down',
  'retour au calme': 'cool_down',
  cooldown: 'cool_down',
};

// ── Mapping texte âge → ageGroups ProSeance ───────────────────────────────────

export const AGE_TEXT_TO_GROUP = {
  u6: 'U6-U7', u7: 'U6-U7',
  u8: 'U8-U9', u9: 'U8-U9',
  u10: 'U10-U11', u11: 'U10-U11',
  u12: 'U12-U13', u13: 'U12-U13',
  u14: 'U14-U15', u15: 'U14-U15',
  u16: 'U16-U18', u17: 'U16-U18', u18: 'U16-U18',
  senior: 'Seniors', seniors: 'Seniors', adult: 'Seniors', adults: 'Seniors',
  all: ['U10-U11', 'U12-U13', 'U14-U15', 'U16-U18', 'Seniors'],
  tous: ['U10-U11', 'U12-U13', 'U14-U15', 'U16-U18', 'Seniors'],
  toutes: ['U10-U11', 'U12-U13', 'U14-U15', 'U16-U18', 'Seniors'],
};

// ── Délais scraping (ms) ──────────────────────────────────────────────────────

export const DELAYS = {
  betweenPages: parseInt(process.env.SCRAPER_DELAY_BETWEEN_PAGES ?? '2000'),
  betweenSites: parseInt(process.env.SCRAPER_DELAY_BETWEEN_SITES ?? '5000'),
  onError: 3000,
  retryBase: 2000,
};

// ── Headers HTTP communs ───────────────────────────────────────────────────────

export const HTTP_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (compatible; ProSeanceBot/1.0; +https://proseance.vercel.app/bot)',
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};
