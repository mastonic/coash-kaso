# 🎯 MASTROAI BETA TESTING GUIDE

**Version:** 1.0 Beta  
**Release Date:** 2026-05-25  
**Status:** Open Beta

---

## 👋 WELCOME TO MASTROAI BETA!

Thank you for testing **MastroAI** - your tactical coaching AI assistant. This guide will help you get the most out of your beta experience.

---

## 🚀 GETTING STARTED (5 minutes)

### **Step 1: Access the App**
Visit: **https://pitchai-henna.vercel.app**

### **Step 2: Sign Up**
Click **"⚡ Accès Complet (7j Gratuit)"**
- Enter your email address
- You'll get access to all features for 7 days free
- No credit card required

### **Step 3: Explore the Main Features**
- **Landing Page** - See all features at a glance
- **Session Generator** (`/session`) - Create training sessions
- **MastroAI Live** - Record tactical instructions
- **MastroAI Vision** - Analyze team formations
- **Dashboard** - Track sessions and data

---

## 📚 FEATURE WALKTHROUGH

### **1. LANDING PAGE**
**What:** Product overview and pricing plans

**How to use:**
1. Scroll through features
2. Check pricing tiers (Essai, Coach, RT)
3. Click "Essayer Maintenant" to get started

**What to test:**
- [ ] Page loads quickly
- [ ] All sections visible
- [ ] Links work correctly
- [ ] Pricing is clear

---

### **2. SESSION GENERATOR** (`/session`)
**What:** Generate complete training sessions using AI

**How to use:**
1. Select theme (Possession, Pressing, Transitions, etc.)
2. Choose load level (Recovery, Moderate, High)
3. Pick tactical school (Française, Espagnole, etc.)
4. Enter number of players
5. Click "⚡ Générer Séance"
6. Wait for session to generate (~ 1.5 seconds)
7. View complete playbook with exercises, duration, objectives

**What to test:**
- [ ] All dropdown options work
- [ ] Form submission works
- [ ] Session generates correctly
- [ ] Duration calculations accurate
- [ ] Playbook displays all exercises
- [ ] Can select/deselect exercises
- [ ] Session data persists in browser

**Example:** 
- Theme: Possession
- Load: High
- School: Française
- Players: 11

---

### **3. MASTROAI LIVE** (Dictaphone Tactique) 🎙️
**What:** Record tactical instructions and get AI recommendations

**How to use:**
1. Go to `/session` and generate a session
2. Scroll down to green "🎙️" floating button
3. Click the button to expand
4. Click microphone icon to start recording
5. **Grant microphone permission** when asked
6. Speak your tactical instructions (30-60 seconds)
7. Click "⏹️ Arrêter l'écoute" to stop
8. Wait for AI analysis
9. Review recommendations
10. Click "Intégrer à la Séance" to add exercises to playbook

**What to test:**
- [ ] Microphone permission request appears
- [ ] Timer counts up during recording
- [ ] Waveform animation shows
- [ ] Recording stops when clicked
- [ ] Analysis progress bar displays
- [ ] Recommendations appear after analysis
- [ ] Each recommendation shows type (🛡️ 🔥 ⚡ ⚽ 🎯)
- [ ] Duration shown for each recommendation
- [ ] "Intégrer" button adds exercises to playbook
- [ ] Exercises appear in session playbook
- [ ] Badge "🎙️ MastroAI Live" visible on exercises

**CRITICAL BUG TESTS:**
1. **Retry Button:** If analysis fails or times out
   - Click "Réessayer" button
   - Open DevTools (F12) → Network tab
   - Look for NEW POST request to `/api/analyze-audio`
   - ✅ Bug fixed if: New request appears
   - ❌ Bug not fixed if: No new request

2. **Microphone Error Code:**
   - Refuse microphone permission
   - Check error message
   - ✅ Bug fixed if: Error contains "#144"
   - ❌ Bug not fixed if: Error has no code

**Tips:**
- Speak clearly in French for best results
- Keep instructions concise (30-60 seconds)
- Use tactical terminology (possession, pressing, transition)

---

### **4. MASTROAI VISION** (`/video`)
**What:** Upload images and analyze team formations

**How to use:**
1. Go to `/video`
2. Click image upload area
3. Select a photo of a football team or formation
4. Wait for preview to load
5. Click "🔍 Lancer le Scan"
6. Watch green scan animation (0-100%)
7. Review:
   - Formation detected (e.g., "4-3-3")
   - 11 players grid with positions
   - Tactical recommendations
8. Click "✓ Valider la Compo" to save

**What to test:**
- [ ] Image upload works
- [ ] Preview displays correctly
- [ ] Scan animation shows
- [ ] Formation detected correctly
- [ ] All 11 players shown
- [ ] Player positions accurate
- [ ] Tactical advice provided
- [ ] Save button works
- [ ] Data persists in browser

**Tips:**
- Use clear, well-lit images
- Ensure all 11 players visible
- Team jersey colors help detection
- Works best with standard formations

---

### **5. RT DASHBOARD** (`/dashboard`)
**What:** Real-time presence tracking and session management

**How to use:**
1. Go to `/dashboard`
2. See "Présences en Temps Réel" section
3. View categories (U11, U13, U15, U17, Senior)
4. See scheduled sessions
5. Check session sources (🎙️ Live, 📸 Vision badges)

**What to test:**
- [ ] Dashboard loads
- [ ] All categories visible
- [ ] Sessions from your activity show
- [ ] Source badges display correctly
- [ ] Session details clickable

**Note:** Dashboard is in active development. More features coming!

---

## 🛠️ TECHNICAL REQUIREMENTS

### **Supported Browsers**
- ✅ Chrome/Chromium (latest 2 versions)
- ✅ Firefox (latest 2 versions)
- ✅ Safari (latest 2 versions)
- ✅ Edge (latest 2 versions)

### **Supported Devices**
- ✅ Desktop (Windows, Mac, Linux)
- ✅ Tablet (iPad, Android tablets)
- ✅ Mobile (iPhone, Android phones)

### **Internet Requirements**
- Minimum: 2 Mbps for streaming
- Recommended: 5+ Mbps for audio recording
- WiFi or 4G/5G recommended

### **Permissions Required**
- Microphone (for MastroAI Live)
- Camera/Photo Library (for MastroAI Vision)

---

## 🐛 REPORTING BUGS

Found an issue? Help us improve!

### **Report a Bug:**
1. **Easy:** Fill out feedback form (link at bottom of app)
2. **Detailed:** Email with:
   - Browser + version
   - Device type
   - Steps to reproduce
   - Screenshot if possible
   - Error message from DevTools

### **What to Include:**
```
Browser: Chrome 126
Device: MacBook Pro (Intel)
Feature: MastroAI Live
Issue: Retry button doesn't work
Steps:
1. Go to /session
2. Generate a session
3. Click record button
4. Say something and stop
5. Click retry when analysis completes
Expected: New API call in Network tab
Actual: No new request, old data reused
```

---

## 💡 TIPS & TRICKS

### **Session Generator Tips**
- Try different theme + load combinations
- High load sessions more intensive
- Different schools have different philosophies
- Save favorite configurations

### **MastroAI Live Tips**
- Record in quiet environment for best results
- Speak naturally, like coaching on field
- Use tactical terminology
- 30-60 seconds is ideal
- Can retry if analysis takes too long

### **MastroAI Vision Tips**
- Use straight-on angles
- Ensure all 11 players visible
- Clear, well-lit images work best
- Team uniform colors help detection
- Works with any sport (football, rugby, etc.)

### **Performance Tips**
- App works offline except for AI features
- Sessions save locally in browser
- Clear browser cache if slow
- Use WiFi for AI features

---

## 📊 FEATURE COMPLETENESS

| Feature | Status | Notes |
|---------|--------|-------|
| Landing Page | ✅ Ready | Full experience |
| Lead Capture | ✅ Ready | Email storage |
| Session Generator | ✅ Ready | All themes work |
| MastroAI Live | ✅ Ready | Bugs fixed |
| MastroAI Vision | ✅ Ready | All formations |
| RT Dashboard | 🔄 In Dev | Basic version |
| Firebase Auth | ⏳ Coming | Login system |
| Firestore Sync | ⏳ Coming | Cloud backup |
| Mobile App | ⏳ Coming | Native apps |

---

## 📝 FEEDBACK FORM

**We want to hear from you!**

Fill out our quick feedback form:
👉 https://forms.gle/MastroAIBeta2026

**Or respond to this email with:**
- What you liked ❤️
- What you didn't like 👎
- Features you want 💡
- Bugs you found 🐛
- Overall impression ⭐

---

## 🎓 FAQ

### **Q: How long is the beta period?**
A: We're targeting 2-4 weeks of open beta testing.

### **Q: Will my data be saved?**
A: Yes, sessions save to your browser's local storage. Cloud sync coming soon.

### **Q: Can I invite friends?**
A: Yes! Share the link: https://pitchai-henna.vercel.app

### **Q: What if I find a security issue?**
A: Please email security@mastroai.fr (or report privately via feedback form).

### **Q: Is my data private?**
A: Yes. We don't store personal data on servers yet. All data is local to your browser.

### **Q: Why do I need to grant microphone permission?**
A: MastroAI Live needs to record your tactical instructions to analyze them with AI.

### **Q: Does it work offline?**
A: Landing page + session generator work offline. AI features (Live, Vision) need internet.

---

## 🎯 BETA TESTING CHECKLIST

Use this to track what you've tested:

### **Core Features**
- [ ] Landing page loads
- [ ] Lead capture works
- [ ] Session generator creates sessions
- [ ] MastroAI Live records audio
- [ ] MastroAI Vision analyzes images
- [ ] RT Dashboard displays data

### **Bug Fixes (CRITICAL)**
- [ ] Retry button makes NEW API call
- [ ] Microphone error shows "#144"

### **User Experience**
- [ ] App is responsive (mobile + desktop)
- [ ] Animations are smooth
- [ ] No console errors (F12)
- [ ] Text is readable
- [ ] Buttons are clickable

### **Performance**
- [ ] Pages load quickly (<3 seconds)
- [ ] No lag during interactions
- [ ] Audio recording is responsive
- [ ] Image analysis completes

### **Device Compatibility**
- [ ] Works on Chrome
- [ ] Works on Firefox
- [ ] Works on Safari
- [ ] Works on mobile browser
- [ ] Responsive design works

---

## 📞 SUPPORT

- **Feedback Form:** https://forms.gle/MastroAIBeta2026
- **Email:** beta@mastroai.fr
- **Discord:** [Link coming soon]
- **Twitter:** @MastroAI

---

## 🙏 THANK YOU!

Thank you for being part of the MastroAI beta! Your feedback helps us build the best tactical coaching AI assistant.

**Ready to test?** Visit: https://pitchai-henna.vercel.app

---

**Version:** 1.0 Beta  
**Last Updated:** 2026-05-25  
**Status:** Open Beta
