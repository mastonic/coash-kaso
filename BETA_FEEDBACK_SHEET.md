# Suivi des retours bêta testeurs

| # | Date | Testeur | Fonctionnalité | Problème signalé | Sévérité | Statut | Correction apportée |
|---|------|---------|---------------|-----------------|----------|--------|---------------------|
| 1 | 2026-06-05 | Anonyme | MastroAI Vision | Faux positifs : détection d'éléments absents de l'image. Faux négatifs : éléments présents non détectés. Image testée : tableau peu lisible / mal arrangé. | Haute | ✅ Corrigé | Prompt Vision renforcé : instruction explicite de ne rapporter que ce qui est clairement visible, avertissement anti-hallucination, meilleure gestion des images de mauvaise qualité. Voir `services/prompts.ts` — `VISION_TACTIC_PROMPT`. |

---

## Comment utiliser ce fichier

À chaque nouveau retour bêta :
1. Ajouter une ligne dans le tableau avec la date, le testeur (anonyme si besoin), la fonctionnalité concernée et le problème.
2. Choisir la sévérité : **Critique** / **Haute** / **Moyenne** / **Faible**.
3. Changer le statut en ✅ Corrigé une fois le fix committé et pushé.
4. Décrire brièvement la correction dans la dernière colonne.
