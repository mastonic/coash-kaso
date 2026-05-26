# 📱 DEVICE & BROWSER COMPATIBILITY MATRIX

**For MastroAI Beta Testers**

Test the app on as many devices/browsers as possible and report results!

---

## ✅ TESTED & WORKING

### **Desktop Browsers**

| Browser | Version | OS | Status | Notes |
|---------|---------|----|---------|----|
| Chrome | 126+ | Windows 11 | ✅ Working | Recommended |
| Chrome | 126+ | macOS 14+ | ✅ Working | Recommended |
| Chrome | 126+ | Linux | ✅ Working | Recommended |
| Firefox | 125+ | Windows 11 | ✅ Working | Good |
| Firefox | 125+ | macOS 14+ | ✅ Working | Good |
| Safari | 17+ | macOS 14+ | ✅ Working | Good |
| Edge | 126+ | Windows 11 | ✅ Working | Excellent |

### **Mobile Browsers**

| Device | Browser | Version | Status | Notes |
|--------|---------|---------|--------|-------|
| iPhone 15 | Safari | 17+ | ✅ Working | Recommended |
| iPhone 14 | Safari | 17+ | ✅ Working | Good |
| iPhone 13 | Safari | 16+ | ✅ Working | Good |
| Samsung S24 | Chrome | 126+ | ✅ Working | Recommended |
| Samsung S23 | Chrome | 125+ | ✅ Working | Good |
| iPad Pro | Safari | 17+ | ✅ Working | Excellent |
| iPad Air | Safari | 16+ | ✅ Working | Good |

---

## ⏳ NEEDS TESTING

Please test and report results! Use this matrix to track your testing.

### **Desktop**

| Browser | Version | OS | Status | Your Test? |
|---------|---------|----|---------|----|
| Chrome | 124 | Windows 10 | ⏳ Test | [ ] |
| Firefox | 123 | Windows 10 | ⏳ Test | [ ] |
| Safari | 16 | macOS 13 | ⏳ Test | [ ] |
| Edge | 125 | Windows 11 | ⏳ Test | [ ] |
| Opera | 111 | Windows 11 | ⏳ Test | [ ] |

### **Mobile**

| Device | Browser | Version | Status | Your Test? |
|--------|---------|---------|--------|-------|
| iPhone 12 | Safari | 15 | ⏳ Test | [ ] |
| iPhone 11 | Safari | 15 | ⏳ Test | [ ] |
| Pixel 8 | Chrome | 126+ | ⏳ Test | [ ] |
| Pixel 7 | Chrome | 125+ | ⏳ Test | [ ] |
| OnePlus 12 | Chrome | 126+ | ⏳ Test | [ ] |
| Google Pixel Tablet | Chrome | 126+ | ⏳ Test | [ ] |
| Samsung Tab S9 | Chrome | 126+ | ⏳ Test | [ ] |

### **Tablets**

| Device | Browser | Version | Status | Your Test? |
|--------|---------|---------|--------|-------|
| iPad 10th Gen | Safari | 17+ | ⏳ Test | [ ] |
| Samsung Tab S8 | Chrome | 126+ | ⏳ Test | [ ] |
| Amazon Fire HD 10 | Silk | Latest | ⏳ Test | [ ] |

---

## 🔌 CONNECTIVITY CONDITIONS

Test under different network conditions:

### **WiFi (Recommended)**
- [ ] 5G WiFi (high speed)
- [ ] 2.4G WiFi (standard)
- [ ] Public WiFi (coffee shop)

### **Mobile Data**
- [ ] 5G network
- [ ] 4G/LTE network
- [ ] 3G network (if available)

### **Low Bandwidth**
- [ ] Slow connection (< 1 Mbps)
- [ ] High latency (500ms+)
- [ ] Intermittent connection

**Report:** Which conditions work best?

---

## 🎯 FEATURES TO TEST BY DEVICE

### **Desktop (Chrome Recommended)**
- ✅ All features
- ✅ Use DevTools (F12) for debugging
- ✅ Test localStorage
- ✅ Record audio (MastroAI Live)
- ✅ Upload images (MastroAI Vision)

### **Mobile (iPhone/Android)**
- ✅ Responsive layout
- ✅ Touch interactions
- ✅ Microphone recording
- ✅ Camera/photo access
- ✅ Form input
- ⚠️ May have permission issues

### **Tablet**
- ✅ Landscape orientation
- ✅ Touch performance
- ✅ Audio recording
- ✅ Image upload
- ✅ Keyboard input (if available)

---

## 🐛 KNOWN ISSUES

### **By Device/Browser**

| Issue | Device | Browser | Status | Workaround |
|-------|--------|---------|--------|-----------|
| Microphone permission stuck | iPhone 15 | Safari | 🔍 Investigating | Refresh page |
| Image upload slow | 3G network | Any | 🔍 Known | Use WiFi |
| Waveform animation janky | iPhone 11 | Safari | ⚠️ Performance | Still usable |
| Session playbook scrolls slowly | Android (low RAM) | Chrome | ⚠️ Performance | Close other apps |

---

## 📊 TESTING REPORT TEMPLATE

When testing, use this template to report results:

```
DEVICE TEST REPORT
==================

Device: [e.g., iPhone 15 Pro, MacBook Pro, Samsung S24]
Browser: [e.g., Safari 17.4, Chrome 126]
OS: [e.g., iOS 17.4, macOS 14.4, Windows 11]
Network: [WiFi / 5G / 4G / Other]

FEATURES TESTED:
- Landing Page: ✅ / ⚠️ / ❌
- Session Generator: ✅ / ⚠️ / ❌
- MastroAI Live: ✅ / ⚠️ / ❌
- MastroAI Vision: ✅ / ⚠️ / ❌
- RT Dashboard: ✅ / ⚠️ / ❌

ISSUES FOUND:
1. [Description]
   - Severity: HIGH / MEDIUM / LOW
   - Reproducible: Yes / No / Sometimes
   - Steps: 1. ... 2. ... 3. ...

PERFORMANCE:
- Page load time: [X seconds]
- Audio recording latency: [X ms]
- Image analysis time: [X seconds]
- Microphone access time: [X seconds]

OVERALL IMPRESSION:
[Your feedback]

RECOMMEND TO OTHERS: Yes / No / With caveats
```

---

## 📝 HOW TO REPORT YOUR TESTING

1. **Fill out feedback form:** https://forms.gle/MastroAIBeta2026
2. **Or email:** beta@mastroai.fr
3. **Include:** Device + browser + any issues found
4. **Screenshot:** If visual issue, include screenshot
5. **Console errors:** If technical issue, include error from F12

---

## 🎯 PRIORITY TESTING

**Most valuable testing:**
1. ✅ iPhone/iPad (Apple users)
2. ✅ Android phones (Google Pixel, Samsung)
3. ✅ Tablets (iPad, Samsung Tab)
4. ✅ Firefox (less common, help us support it)
5. ✅ Low bandwidth conditions (mobile data)

**Thank you for testing these!**

---

## 🔍 DEBUGGING ON YOUR DEVICE

### **Desktop (Windows/Mac/Linux)**
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for red errors
4. Screenshot and report

### **Mobile (iPhone)**
1. Settings → Safari → Advanced
2. Check "Web Inspector"
3. Open Safari on Mac while connected
4. Device → [Your iPhone] → Open Inspectable Pages
5. View console errors

### **Mobile (Android)**
1. Chrome Settings → More tools → Developer tools
2. Type `chrome://inspect` in address bar
3. Connect your device via USB
4. View console logs

---

## 📊 TESTING STATISTICS

**Help us track:**
- Which devices/browsers tested
- What works best
- Which combinations have issues
- Performance across devices

**Your data helps us:**
- Prioritize support
- Fix common issues
- Optimize performance
- Improve compatibility

---

## ✨ THANK YOU!

Every device/browser test helps us make MastroAI better!

---

**Version:** 1.0  
**Last Updated:** 2026-05-25  
**Status:** Open for beta testing
