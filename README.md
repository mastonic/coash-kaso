# ProSéance ⚽

**ProSéance** est une PWA (Progressive Web App) pour les éducateurs et entraîneurs de football. Elle génère des **séances d'entraînement complètes selon la méthodologie FFF**, chaque exercice étant livré avec sa **fiche détaillée et son plan illustré** (joueurs, plots, ballons, buts, zones, flèches de passe / déplacement / conduite / tir).

## Fonctionnalités

### 🏟 Générateur de séances (cœur du produit)
- Séance structurée **méthodologie FFF** : mise en train → jeu → situation/exercice → match final + retour au calme
- Chaque phase = **fiche d'exercice FFF complète** : objectif, but pour les joueurs, consignes, variantes (plus simple / plus difficile), critères de réussite, effectif, espace en mètres, matériel
- **Schéma tactique SVG** par exercice, avec légende type FFF (passe en pointillés, déplacement, conduite ondulée, tir double trait)
- Paramètres : thème (10 thèmes), catégorie (U6-U7 → Seniors), effectif, durée, charge du jour
- Génération **IA (Gemini)** avec **bibliothèque d'exercices intégrée en secours** : l'app produit toujours une séance complète, même sans clé API ou hors-ligne
- **Impression / export PDF** (mise en page blanche, une phase par page) et **partage par lien**

### 📱 PWA
- Installable sur mobile et bureau (manifest + icônes maskable)
- Service worker : app shell en cache, pages réseau-d'abord avec repli hors-ligne (`/offline`)
- Historique des séances disponible hors connexion (localStorage)

### 🧰 Outils club
- **Équipe** : gestion des joueurs (photos via Firebase Storage)
- **Présence** : appel par reconnaissance photo (Gemini Vision)
- **Programme** : matchs et entraînements
- **Vidéo** : analyse tactique de vidéos d'entraînement
- **Dashboards** Coach et Responsable Technique
- **Plans & facturation** : essai / Coach Pro / RT Manager (LemonSqueezy)

## Démarrage

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de production
npm start
```

> **Mode démo** : sans aucune variable d'environnement, l'app reste utilisable — connexion libre, génération via la bibliothèque intégrée, historique local. Les services externes (IA, persistance cloud, paiement) s'activent avec leur configuration.

## Variables d'environnement

| Variable | Rôle | Obligatoire |
|---|---|---|
| `GEMINI_API_KEY` | Génération IA des séances et analyses | Non (repli bibliothèque) |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase client (storage photos) | Non |
| `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` | Firestore admin (comptes, quotas, partage) | Non (mode démo sinon) |
| `LEMONSQUEEZY_*` | Paiement / abonnements | Non |
| `API_FOOTBALL_KEY` | Classements et calendriers pro | Non |
| `NEXT_PUBLIC_APP_URL` | URL publique (liens de partage) | En production |

## Architecture du générateur

```
lib/seance/
├── schema.ts      # Types Séance/Phase/Schéma + validation & normalisation
├── library.ts     # Bibliothèque d'exercices paramétrique (repli hors-ligne)
└── generator.ts   # Génération Gemini (JSON strict) fusionnée avec le repli

components/seance/
├── SchemaExercice.tsx   # Rendu SVG du plan d'exercice (légende FFF)
└── FicheSeance.tsx      # Fiche de séance écran + impression
```

Le schéma tactique est un JSON validé champ par champ : si l'IA renvoie un schéma inexploitable, il est remplacé par le schéma équivalent de la bibliothèque — jamais d'écran vide.

## Tests

```bash
npm run test:e2e         # Playwright
npm run test:e2e:mobile  # responsive mobile
```

## Déploiement

Optimisé pour [Vercel](https://vercel.com) (`vercel deploy`). Renseignez les variables d'environnement du tableau ci-dessus dans les réglages du projet.
