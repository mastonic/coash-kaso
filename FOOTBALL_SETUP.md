# Configuration Football API - ProSéance

## API-Football (Ligue 1/2/National)

### Setup

1. **Créer un compte** sur [api-football-v1.p.rapidapi.com](https://rapidapi.com/api-sports/api/api-football-v1)
2. **Copier la clé API** (gratuit: 100 requêtes/jour)
3. **Ajouter à `.env.local`**:

```env
API_FOOTBALL_KEY=votre_cle_api_ici
```

### Utilisation

```bash
# Ligue 1
GET /api/football/fixtures?league=FR&season=2024

# Ligue 2
GET /api/football/fixtures?league=1&season=2024

# National
GET /api/football/fixtures?league=National&season=2024

# Avec round spécifique
GET /api/football/fixtures?league=FR&season=2024&round=1
```

### Response Format

```json
{
  "success": true,
  "data": {
    "league": "FR",
    "season": 2024,
    "fixtures": [
      {
        "id": 1009634,
        "date": "2024-08-16T20:00:00+00:00",
        "homeTeam": {
          "id": 541,
          "name": "Paris Saint Germain",
          "logo": "https://..."
        },
        "awayTeam": {
          "id": 80,
          "name": "Montpellier HSC",
          "logo": "https://..."
        },
        "league": "Ligue 1",
        "status": "FT",
        "score": {
          "home": 4,
          "away": 2
        }
      }
    ],
    "count": 380
  }
}
```

## FFF Amateur (epreuves.fff.fr)

### Caractéristiques

- **Coverage**: Toutes les divisions amateurs (D1 à D4+)
- **Source**: epreuves.fff.fr (scraping)
- **No API key needed**: Fonctionne depuis Vercel
- **Avantages**: Données officielles FFF

### Utilisation

```bash
# Division 1
GET /api/football/amateur?division=D1

# Avec groupe spécifique
GET /api/football/amateur?division=D1&group=Ouest
```

## Integration dans ProSéance

### Pages Disponibles

- `/football/fixtures` - Dashboard calendrier pro + amateur

### Composants

- `<FootballFixturesBoard />` - Affiche calendrier avec filtres

### Utilisation Composant

```tsx
import { FootballFixturesBoard } from '@/components/FootballFixturesBoard';

export default function MyPage() {
  return <FootballFixturesBoard />;
}
```

## Limitations & Notes

### API-Football
- ✓ 100 requêtes/jour (gratuit)
- ✓ Temps réel
- ✓ Scores live
- ⚠️ Requiert clé API

### FFF Amateur
- ✓ Gratuit (pas de clé)
- ✓ Officiel FFF
- ✓ Fonctionne sur Vercel
- ⚠️ Peut avoir des délais (scraping)
- ⚠️ Structure HTML peut changer

## Prochaines Étapes

1. ✅ Routes API implémentées
2. ✅ Dashboard componant créé
3. ⏳ Configurer API-Football key
4. ⏳ Tester depuis Vercel
5. ⏳ Ajouter cache/performance
6. ⏳ Intégrer au dashboard coach

## Support

Pour des questions:
- API-Football: Documentation RapidAPI
- FFF: epreuves.fff.fr
