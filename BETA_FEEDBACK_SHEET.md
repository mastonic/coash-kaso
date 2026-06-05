# Suivi des retours bêta testeurs

| # | Date | Testeur | Fonctionnalité | Problème signalé | Sévérité | Statut | Correction apportée |
|---|------|---------|---------------|-----------------|----------|--------|---------------------|
| 1 | 2026-06-05 | Anonyme | Scan frigo | Faux positifs : détection d'aliments absents. Faux négatifs : aliments présents non détectés. Frigo mal rangé. | Haute | ✅ Corrigé | Prompt renforcé anti-hallucination + boucle few-shot : les corrections des utilisateurs s'injectent dans le prompt Gemini. Voir `scan-fridge/route.ts`. |
| 2 | 2026-06-05 | Anonyme | /scan — Bandeau bêta | Bandeau bêta invisible en production. | Moyenne | ✅ Corrigé | Ajouter `NEXT_PUBLIC_BETA_MODE=true` dans `.env.production` et redéployer. |
| 3 | 2026-06-05 | Anonyme | /scan — Après scan | Après résultat du scan, l'app repropose la galerie au lieu de rester sur l'écran succès. | Moyenne | 🔄 En cours | Cause probable : tap accidentel sur "Scanner Autre Chose" ou double-trigger du file input sur mobile. À investiguer. |
| 4 | 2026-06-05 | Anonyme | /scan — Widget correction | Widget "Corriger l'ingrédient" trop discret, peu visible. | Faible | 🔄 En cours | Rendre le bouton plus proéminent. |
| 5 | 2026-06-05 | Anonyme | /api/scan-feedback | Test curl sans token échoue. | Faible | ✅ Normal | Comportement attendu : API protégée par auth Firebase. 401 sans token = correct. |

---

## Comment utiliser ce fichier

À chaque nouveau retour bêta :
1. Ajouter une ligne dans le tableau avec la date, le testeur (anonyme si besoin), la fonctionnalité concernée et le problème.
2. Choisir la sévérité : **Critique** / **Haute** / **Moyenne** / **Faible**.
3. Changer le statut en ✅ Corrigé une fois le fix committé et pushé.
4. Décrire brièvement la correction dans la dernière colonne.
