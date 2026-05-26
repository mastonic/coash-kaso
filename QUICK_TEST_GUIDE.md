# ⚡ QUICK LOCAL TEST GUIDE (15 min)

**URL:** http://localhost:3001  
**Status:** Dev server running ✅

---

## 📋 STEP-BY-STEP TEST CHECKLIST

### **1️⃣ LANDING PAGE (2 min)**
```
Go to: http://localhost:3001
☐ Page loads (no 404 errors)
☐ Logo "MASTRO AI" visible at top
☐ Hero text "Génère des séances en 3 sec" visible
☐ Green button "⚡ Accès Complet (7j Gratuit)" clickable
☐ 3 feature cards visible: ⚡ 🎬 📅
☐ Pricing section shows 3 tiers (Essai, Coach, RT)
☐ Footer with "© 2026 MastroAI" visible
```

### **2️⃣ LEAD MODAL (2 min)**
```
Click: "⚡ Accès Complet (7j Gratuit)" button
☐ Modal pops up with "Essaie MastroAI" title
☐ Email input field visible
☐ Type invalid email (test@) → warning appears
☐ Type valid email (test@example.com) → no warning
☐ Click "Débloquer" button
☐ Modal closes or shows success
☐ Check browser DevTools > Console > localStorage['lead_emails']
```

### **3️⃣ SESSION GENERATOR (4 min)**
```
Go to: http://localhost:3001/session
☐ Page loads
☐ Form visible with 4 dropdowns:
  ☐ Thème (Possession, Pressing, etc.)
  ☐ Load (Normal, Intensif, etc.)
  ☐ Ecole (Classique, etc.)
  ☐ Players (11, 10, 9, etc.)
☐ Click "⚡ Générer Séance Démo"
☐ SessionPlaybook appears with items (games, exercises)
☐ Items can be checked/unchecked
☐ Duration shows (e.g., "25m", "30m")
☐ Status shows "Validée" ✅
☐ Check DevTools > Console: localStorage['session_prefs'] exists
```

### **4️⃣ MASTROAI LIVE FAB (3 min)**
```
Still on: /session page
☐ Floating Action Button (🎙️ green circle) visible bottom-right
☐ Click FAB → expands to card
☐ Card shows "MastroAI Live" + "Dictaphone Tactique IA"
☐ Click "🎤 start" or similar button
☐ Browser asks for microphone permission
☐ Grant permission
☐ Timer starts (00:00)
☐ 12 waveform bars animate
☐ After 3-5 seconds, click "⏹️ Arrêter l'écoute"
☐ Card shows "Analyse sémantique des consignes"
☐ Progress bar shows 0-100%
☐ Wait for response or see error
☐ **IF ERROR:** Check that "Réessayer" button appears
  ☐ Click "Réessayer" → should call API again (NOT just show cached data)
  ☐ Verify in DevTools > Network tab: new POST to /api/analyze-audio
```

### **5️⃣ MASTROAI VISION (2 min)**
```
Go to: http://localhost:3001/video
☐ Page loads
☐ "Image upload" input visible
☐ Click to select an image from your device
☐ Image preview shows
☐ Click "🔍 Lancer le Scan" (or similar)
☐ Green scan animation line sweeps down (0-100%)
☐ After scanning:
  ☐ Formation detected (e.g., "4-3-3")
  ☐ 11 players grid shows
  ☐ Each player: emoji + position + name
  ☐ Tactical consignes listed below
  ☐ "✓ Valider la Compo" button visible
```

### **6️⃣ RT DASHBOARD (1 min)**
```
Go to: http://localhost:3001/dashboard
☐ Page loads
☐ "Présences en Temps Réel" section visible
☐ Categories shown: U11, U13, U15, U17, Senior
☐ "Séances Programmées" section shows sessions
☐ Each session shows:
  ☐ Category (U15, etc.)
  ☐ Theme
  ☐ Date
  ☐ Status "Validée"
  ☐ Source badge (e.g., "🎙️ MastroAI Live")
```

---

## 🎯 KEY BUG FIXES TO VERIFY

### **Bug #1: Retry API Must Call Real API**
```
In MastroAI Live:
1. Record audio
2. Analyze → wait for response
3. If error OR complete → Click "Réessayer"
4. Open DevTools > Network tab
5. Look for NEW POST request to /api/analyze-audio
6. ❌ BAD: No new request (bug not fixed)
7. ✅ GOOD: New request appears (bug fixed!)
```

### **Bug #2: Error Code #144**
```
In MastroAI Live:
1. Click record button
2. Refuse microphone permission (click "Block")
3. Error message should say: "❌ Impossible d'accéder au microphone (#144)"
4. ✅ Should include "#144"
```

---

## 📱 MOBILE TEST (Optional)

If you want to test mobile responsiveness:
```
1. Right-click → Inspect (DevTools)
2. Click mobile icon (top-left)
3. Select "iPhone 15" or similar
4. Reload page
5. Check:
   ☐ Layout adapts properly
   ☐ FAB still visible and clickable
   ☐ Modal responsive
   ☐ Text readable
```

---

## ✅ EXPECTED RESULTS

All items should be ✅  
If any are ❌, note them in: `SPRINT_2_BLOCKERS.md`

Example blocker format:
```
### Blocker #1: MastroAI Live - Retry doesn't work
- **Where:** /session page, MastroAI Live FAB
- **What:** Click "Réessayer" after API error
- **Expected:** New API call in Network tab
- **Actual:** No new request, just shows old data
- **Severity:** HIGH
- **Status:** OPEN
```

---

## 🚀 NEXT: Deploy to Production

Once local testing is complete, we:
1. Deploy to Vercel (2 min)
2. Test in production (20 min)
3. Document any differences

---

**Estimated Time:** 15 minutes  
**Owner:** You 👤  
**Deadline:** ASAP for beta launch
