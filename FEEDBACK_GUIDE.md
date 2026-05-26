# 💬 MASTROAI FEEDBACK GUIDE

**How to provide valuable feedback during beta**

---

## 📝 FEEDBACK TYPES

### **1. BUG REPORTS** 🐛
**What:** Something isn't working as expected

**Include:**
- [ ] Browser + version
- [ ] Device + OS
- [ ] Steps to reproduce (1, 2, 3...)
- [ ] Expected behavior
- [ ] Actual behavior
- [ ] Screenshot (if visual)
- [ ] Console error (F12 → Console)

**Example:**
```
BUG: MastroAI Live retry button doesn't work

Browser: Chrome 126 on Windows 11
Steps:
1. Go to /session
2. Generate a session
3. Scroll down to MastroAI Live FAB
4. Click record button
5. Record audio for 5 seconds
6. Stop recording
7. Click "Réessayer" button
8. Open DevTools Network tab

Expected: See NEW POST request to /api/analyze-audio
Actual: No new request appears, old data shown

Severity: HIGH (feature doesn't work as intended)
```

---

### **2. FEATURE REQUESTS** 💡
**What:** Ideas for new features or improvements

**Include:**
- [ ] What feature you want
- [ ] Why you need it
- [ ] How you'd use it
- [ ] Priority (nice-to-have vs. critical)

**Example:**
```
FEATURE REQUEST: Dark/Light mode toggle

Why: Night training sessions are harder to read with bright white background
How I'd use: Toggle in settings to switch between dark/light themes
Priority: Nice-to-have (works fine as-is, but would improve experience)
```

---

### **3. USER EXPERIENCE** 🎯
**What:** How the app feels to use

**Include:**
- [ ] What felt confusing
- [ ] What felt great
- [ ] What could be clearer
- [ ] What was hard to find

**Example:**
```
UX FEEDBACK: MastroAI Live recording button is hard to find

What's confusing: The FAB appears after generating a session, but it's not obvious
What could be clearer: Add a tooltip or arrow pointing to the FAB first time
Overall: Great feature, just needs better discoverability
```

---

### **4. PERFORMANCE** ⚡
**What:** Speed and responsiveness

**Include:**
- [ ] Device + network condition
- [ ] What was slow
- [ ] Expected vs. actual time
- [ ] When it happens

**Example:**
```
PERFORMANCE: Image upload is very slow on mobile 4G

Device: iPhone 15 on 4G network
Issue: MastroAI Vision image upload takes 10+ seconds
Expected: Should complete in <3 seconds
When: Consistently happens on 4G, faster on WiFi
Suggestion: Add progress indicator so user knows it's loading
```

---

### **5. SUGGESTION / IMPROVEMENT** ⭐
**What:** Small tweaks that would make it better

**Include:**
- [ ] Current behavior
- [ ] Suggested change
- [ ] Why it would help

**Example:**
```
SUGGESTION: Show session duration estimate before generating

Currently: You generate the session and then see how long it is
Suggested: Show estimated duration (15min, 20min, 30min, 45min) BEFORE clicking generate
Why: Help users plan their training session time
```

---

## 📋 FEEDBACK TEMPLATE

Use this template for structured feedback:

```
FEEDBACK SUBMISSION
===================

Type: [Bug / Feature Request / UX / Performance / Suggestion]
Severity: [Critical / High / Medium / Low / Nice-to-have]

TITLE:
[One sentence summary]

DESCRIPTION:
[Detailed description of what you experienced]

DEVICE & BROWSER:
- Device: [e.g., MacBook Pro 16"]
- Browser: [e.g., Chrome 126]
- OS: [e.g., macOS 14.4]
- Network: [WiFi / 5G / 4G]

STEPS TO REPRODUCE: (if bug)
1. [First step]
2. [Second step]
3. [etc.]

EXPECTED BEHAVIOR:
[What should happen]

ACTUAL BEHAVIOR:
[What actually happened]

SCREENSHOT:
[If visual, attach image]

CONSOLE ERROR:
[If technical, paste from F12]

ADDITIONAL NOTES:
[Anything else helpful]

YOUR EMAIL:
[So we can follow up]
```

---

## 🎯 HOW TO SUBMIT FEEDBACK

### **Option 1: Feedback Form (FASTEST)** ⭐
👉 **https://forms.gle/MastroAIBeta2026**

Takes 2-3 minutes, gets directly to our team.

### **Option 2: Email**
📧 **beta@mastroai.fr**

For detailed feedback or bugs with attachments.

Subject line examples:
```
[BUG] MastroAI Live retry button doesn't work
[FEATURE] Add session time estimate
[UX] Confusing navigation on mobile
[PERFORMANCE] Image upload is slow on 4G
```

### **Option 3: Discord** (Coming Soon)
Join our beta tester Discord community for real-time chat and support.

---

## ⭐ FEEDBACK TIPS

### **Do:**
✅ Be specific ("Retry button doesn't work" vs. "App is broken")  
✅ Include steps to reproduce (helps us fix it faster)  
✅ Test on multiple devices/browsers  
✅ Include screenshots when helpful  
✅ Give context (when did you notice, how often)  

### **Don't:**
❌ Be vague ("It doesn't feel right")  
❌ Skip reproduction steps  
❌ Test only on one device/browser  
❌ Wait until all bugs accumulate (report as you find)  
❌ Assume we know what you mean  

---

## 🔄 FEEDBACK LOOP

**Here's what happens with your feedback:**

1. **You submit** → Goes to our feedback form
2. **We review** → Team reads all feedback daily
3. **We prioritize** → Bugs fixed first, features evaluated
4. **We update** → You see fixes in next deployment
5. **You test** → Confirm fix works
6. **We thank you** → Credit in release notes

---

## 🏆 VALUABLE FEEDBACK EXAMPLES

### ✅ GOOD BUG REPORT
```
TITLE: Microphone permission denied error missing error code

DEVICE: iPhone 15, Safari 17.4, iOS 17.4
STEPS:
1. Go to session page and generate a session
2. Scroll to MastroAI Live FAB
3. Click record button
4. Deny microphone permission
5. Check error message

EXPECTED: Error message shows "Impossible d'accéder au microphone (#144)"
ACTUAL: Error shows "Impossible d'accéder au microphone" (no #144)

This is important because:
- Beta testers need to understand error codes
- #144 is the microphone permission error code
- Without it, harder to diagnose issues
```

### ✅ GOOD FEATURE REQUEST
```
TITLE: Save favorite session configurations

USER STORY: As a coach, I often use the same settings (theme=Possession, load=High, school=Française). I have to re-select them every time.

REQUESTED: Save last used configuration or allow bookmarking favorites

WHY: Save 30 seconds per session × 100 sessions/month = 50 minutes saved per month

PRIORITY: Nice-to-have (not blocking)
```

### ✅ GOOD UX FEEDBACK
```
TITLE: Session playbook items hard to distinguish when selected

ISSUE: When you click a checkbox to select an exercise, it's not clear if it's selected or not. The checkbox is too small.

SUGGESTION: Make the selected item background change color (highlight) to make selection status obvious

DEVICE: All devices (seen on desktop, tablet, mobile)
```

---

## 📊 FEEDBACK METRICS

**We track:**
- How many bugs found
- How many features requested
- Which devices have issues
- Overall satisfaction

**Your feedback shapes:**
- What we fix first
- What features we build
- Which devices we prioritize
- How we improve UX

---

## 🙏 THANK YOU!

Every piece of feedback helps us make MastroAI better!

- 🐛 Bugs reported = Faster fixes
- 💡 Features requested = Better product
- 🎯 UX feedback = Better experience
- ⚡ Performance reports = Faster app

---

## ❓ FAQ ABOUT FEEDBACK

**Q: Will you respond to my feedback?**
A: We read everything! We respond to bugs within 24 hours. Features may take longer to evaluate.

**Q: Can I report the same bug multiple times?**
A: One report per bug is plenty! We track duplicates. Multiple reports don't speed up fixes.

**Q: How do I know if my feedback was acted on?**
A: Check release notes when we deploy updates. We credit beta testers who reported fixed bugs.

**Q: Should I report very small issues?**
A: Yes! Small UX issues add up. Report everything you notice.

**Q: What if I'm not sure if it's a bug?**
A: Report it anyway! We can categorize it correctly. Better to over-report than under-report.

---

## 🎯 QUICK CHECKLIST

Before submitting feedback:

- [ ] Is it specific and clear?
- [ ] Did I include steps to reproduce (if bug)?
- [ ] Did I include device/browser info?
- [ ] Did I attach screenshot (if visual)?
- [ ] Did I include console error (if technical)?
- [ ] Is the title a summary (not a question)?
- [ ] Am I being constructive (not negative)?

---

**Ready to share feedback?**

👉 **https://forms.gle/MastroAIBeta2026**

Or email: **beta@mastroai.fr**

---

**Version:** 1.0  
**Last Updated:** 2026-05-25  
**Status:** Beta feedback welcome!
