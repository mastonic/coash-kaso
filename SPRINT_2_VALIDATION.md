# 🎯 SPRINT 2: PRODUCTION VALIDATION CHECKLIST

## Status: IN PROGRESS

**Objectif:** Valider que tous les features fonctionnent en production avec les vraies APIs

**Timeline:** ~30-45 min

---

## ✅ LANDING PAGE & LEAD CAPTURE

- [ ] Page `/` se charge correctement
- [ ] Hero section visible et bien stylisée
- [ ] CTA "Accès Complet (7j Gratuit)" cliquable
- [ ] Mini demo generator visible avec dropdowns
- [ ] Features section (Générer, Analyser, Piloter) chargée
- [ ] Rôles section (Entraîneur, RT) visible
- [ ] Pricing section avec 3 plans affichés
- [ ] Footer avec copyright © 2026 MastroAI
- [ ] **LEAD MODAL TEST:**
  - [ ] Cliquer "Accès Complet" → Modal s'ouvre
  - [ ] Email validation: rejette emails invalides
  - [ ] Email validation: accepte emails valides
  - [ ] Soumettre email valide → success message
  - [ ] Vérifier localStorage['lead_emails'] sauvegardé
  - [ ] Mobile responsive: modal visible sur petit écran

---

## ⚡ SESSION GENERATOR (`/session`)

- [ ] Page `/session` se charge
- [ ] Formulaire visible: Thème × Load × Ecole × Players
- [ ] Tous les dropdowns ont les bonnes options
- [ ] "Générer Séance Démo" button clickable
- [ ] Clicking génère mock data (games, exercises, situations)
- [ ] SessionPlaybook s'affiche avec 5+ items
- [ ] Items peuvent être sélectionnés/désélectionnés
- [ ] Duration calculation correct
- [ ] localStorage['session_prefs'] sauvegardé avec timestamp
- [ ] Status = "Validée" affiché
- [ ] **MastroAI Live FAB visible** en bas à droite
- [ ] FAB: Click start → microphone permission demandée
- [ ] FAB: Recording UI montre timer + waveform
- [ ] FAB: Stop enregistrement
- [ ] FAB: Retry button fonctionnel (appelle vrai API)

---

## 🎙️ MASTROAI LIVE (FIXED BUGS)

- [ ] **Bug #1 - Retry API:** Retry button appelle vraiment `/api/analyze-audio`
  - [ ] Enregistrer audio
  - [ ] Analyser (attend Gemini response)
  - [ ] Si erreur API → click "Réessayer"
  - [ ] **Vérifie:** Réessaye fait un vrai nouvel appel API
- [ ] **Bug #2 - Error Code #144:**
  - [ ] Refuser microphone access
  - [ ] **Vérifie:** Message contient "#144"
- [ ] Waveform animation pendant enregistrement
- [ ] Progress bar pendant l'analyse
- [ ] Recommendations affichées avec icons (🛡️ 🔥 ⚡ ⚽ 🎯)
- [ ] "Intégrer à la Séance" button ajoute exercises à playbook
- [ ] Source badge "🎙️ MastroAI Live" visible sur items

---

## 📸 MASTROAI VISION (`/video`)

- [ ] Page `/video` se charge
- [ ] Image upload input visible
- [ ] Sélectionner une image → preview affichée
- [ ] Click "Scanner" → scan animation (0-100%)
- [ ] Formation détectée + affiché
- [ ] Player composition grid: 11 players affichés
- [ ] Chaque joueur: emoji + position + name
- [ ] Tactical consignes listées
- [ ] "Valider la Compo" button sauvegarde dans localStorage['mastro_attendance']
- [ ] localStorage['active_sessions'] inclut source 'vision'
- [ ] Source badge "📸 MastroAI Vision" visible en dashboard

---

## 📊 RT DASHBOARD (`/dashboard`)

- [ ] Page `/dashboard` se charge
- [ ] "Présences en Temps Réel" section visible
- [ ] Categories affichées: U11, U13, U15, U17, Senior
- [ ] "Séances Programmées" chargées depuis localStorage
- [ ] Chaque session montre:
  - [ ] Category
  - [ ] Thème
  - [ ] Date
  - [ ] Status ("Validée")
  - [ ] Source badges (📸 si vision, 🎙️ si live)
- [ ] Multi-source sessions affichent BOTH badges
- [ ] Session details cliquable (ouvre details si implémenté)

---

## ⚽ FOOTBALL PITCH SVG

- [ ] Page `/video` → Formation SVG chargée
- [ ] 11 joueurs positionnés correctement
- [ ] Terrain SVG responsive
- [ ] Formations testées:
  - [ ] 4-4-2
  - [ ] 4-3-3
  - [ ] 3-5-2
  - [ ] 5-3-2
- [ ] Glow neon color (#39FF14) visible
- [ ] Animations fluides

---

## 🔧 API ENDPOINTS

- [ ] `/api/analyze-audio` responds avec recommendations
  - [ ] Accept audio blob
  - [ ] Call Gemini API (env var GEMINI_API_KEY)
  - [ ] Return: { recommendations: [...] }
  - [ ] Error handling si API fail
  
- [ ] `/api/analyze-vision` responds avec formation
  - [ ] Accept image upload
  - [ ] Call Gemini Vision API
  - [ ] Return: { formation, players: [...], consignes: [...] }
  - [ ] Filters "Inconnu" players
  
- [ ] `/api/generate` responds avec session data
  - [ ] Accept params: theme, load, school, players
  - [ ] Return: { games, exercises, situations }
  
- [ ] `/api/analyze-video` responds avec analysis (si implémenté)

---

## 🌐 ENVIRONMENT & CONFIG

- [ ] .env.local existe avec:
  - [ ] NEXT_PUBLIC_FIREBASE_API_KEY ✅
  - [ ] GEMINI_API_KEY ✅
- [ ] All keys are valid (APIs respond correctly)
- [ ] No hardcoded secrets in source code ✅
- [ ] next.config.ts configured correctly ✅

---

## 📱 RESPONSIVENESS

- [ ] Desktop (1920x1080) - all features work
- [ ] Tablet (768x1024) - layout adapts
- [ ] Mobile (375x667) - touch-friendly, no layout issues
- [ ] Modal visibility on mobile ✅
- [ ] FAB positioning on mobile ✅
- [ ] Animations smooth on all devices

---

## 🎨 DESIGN & UX

- [ ] Color scheme correct:
  - [ ] #0A0F0D (Pitch Dark) - backgrounds ✅
  - [ ] #39FF14 (Glow Neon) - accent ✅
  - [ ] #10B981 (Jade Green) - secondary ✅
  - [ ] #F3F4F6 (White) - text ✅
- [ ] Animations smooth:
  - [ ] fade-in-up ✅
  - [ ] pulse ✅
  - [ ] scan ✅
  - [ ] pop ✅
- [ ] Loading states visible
- [ ] Error messages clear
- [ ] No broken images
- [ ] Font loading correct

---

## ✔️ TEST RESULTS SUMMARY

| Feature | Status | Notes |
|---------|--------|-------|
| Landing | 🔵 TO TEST | - |
| Lead Capture | 🔵 TO TEST | - |
| Session Generator | 🔵 TO TEST | - |
| MastroAI Live | 🔵 TO TEST | Bug fixes verified |
| MastroAI Vision | 🔵 TO TEST | - |
| RT Dashboard | 🔵 TO TEST | - |
| Football Pitch | 🔵 TO TEST | - |
| APIs | 🔵 TO TEST | - |
| Mobile | 🔵 TO TEST | - |

---

## 🚨 BLOCKERS & ISSUES

_To be filled during testing_

---

## 📝 NEXT STEPS

1. ✅ Clone/pull latest code
2. ⏳ Run `npm run build` (verify 0 errors)
3. ⏳ Deploy to Vercel (or test on vercel.app)
4. ⏳ Go through each checklist item
5. ⏳ Document any bugs found
6. ✅ Mark sprint complete when all items ✓

---

**Generated:** 2026-05-25  
**Owner:** MastroAI Beta Team
