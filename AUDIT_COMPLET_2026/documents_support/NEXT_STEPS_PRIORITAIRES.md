# 🚀 PROCHAINES ÉTAPES PRIORITAIRES - MASTROAI

**Document:** Action Plan | **Période:** 30 jours | **Propriétaire:** Founder/Team  
**Mise à jour:** 25 Mai 2026

---

## 🔴 PHASE 0: REVENUE UNBLOCKING (Semaine 1-2)

### TASK 0.1: Intégration Stripe
**Priorité:** CRITIQUE | **Effort:** 2-3 jours | **Owner:** Developer

```typescript
// Actions:
[ ] Install @stripe/stripe-js + stripe package
[ ] Create /api/stripe/create-checkout route
[ ] Create /api/stripe/webhook route (for events)
[ ] Add payment page at /checkout
[ ] Test end-to-end: Coach plan → Stripe → success email
[ ] Add billing portal link (manage subscriptions)

// Success Metrics:
✅ First test payment successful
✅ User receives confirmation email
✅ Payment shows in Stripe dashboard
✅ Webhook processes subscription created event

// Timeline: May 27-29
```

**Impact:** €0 → Revenue-generating platform

---

### TASK 0.2: Firebase Auth Complete Integration
**Priorité:** CRITIQUE | **Effort:** 2-3 jours | **Owner:** Developer

```typescript
// Current State: Auth setup exists but UI not integrated
// Target State: Full auth flow working with persistence

Actions:
[ ] Create /auth/login page with email/password form
[ ] Create /auth/signup page with validation
[ ] Create /auth/logout button in navbar
[ ] Implement auth context (useAuth hook)
[ ] Protect routes with PrivateRoute wrapper
[ ] Add "Sign in" CTA to landing page
[ ] Test: Login → Use app → Logout → Data persists

// Success Metrics:
✅ User can sign up with email
✅ Login persists across page refreshes
✅ Logout clears session
✅ Protected routes redirect to login

// Timeline: May 27-29
```

**Impact:** Users stay logged in = repeat usage possible

---

### TASK 0.3: Firestore User Data Persistence
**Priorité:** CRITIQUE | **Effort:** 1-2 jours | **Owner:** Developer

```typescript
// Current State: Sessions generated but not saved
// Target State: User sessions saved to Firestore

Actions:
[ ] Design Firestore schema:
    /users/{userId}/sessions/{sessionId} = SessionData
[ ] Create saveSessions() function
[ ] Create loadSessions() hook
[ ] Integrate with SessionPlaybook component
[ ] Show "Session saved" toast notification
[ ] Add "Load previous session" feature
[ ] Test: Generate → Save → Close → Reload → Data present

// Success Metrics:
✅ Sessions persist after user logout
✅ User can view history of past sessions
✅ Firestore shows user documents created
✅ Data survives app reload

// Timeline: May 28-29
```

**Impact:** No data loss = product becomes usable

---

### TASK 0.4: Dashboard MVP (for RT Plan €19)
**Priorité:** CRITIQUE | **Effort:** 1 semaine | **Owner:** Developer + Designer

```typescript
// Current State: Dashboard page shows "Feature in dev"
// Target State: Basic stats dashboard (MVP)

Features:
[ ] Total sessions created (lifetime)
[ ] Total analyses used (lifetime)
[ ] Current month statistics
[ ] Team members list (for RT users)
[ ] Session history table (sortable by date)
[ ] Export session as PDF button (stub for now)

Components:
[ ] <DashboardStats /> (cards with metrics)
[ ] <SessionHistoryTable /> (table with data)
[ ] <TeamMembersList /> (if RT plan)
[ ] <QuickActions /> (buttons for common tasks)

API:
[ ] GET /api/user/stats (total sessions, analyses)
[ ] GET /api/user/sessions (history list)

// Success Metrics:
✅ RT users can see their usage stats
✅ Dashboard loads in <2 seconds
✅ Can export session history
✅ Can upgrade from Coach to RT (UI wired)

// Timeline: June 1-7
```

**Impact:** Can charge €19/month RT plan

---

## 🟡 PHASE 1: PRODUCT POLISH (Semaine 2-3)

### TASK 1.1: Fix Critical UX Issues
**Priorité:** HAUTE | **Effort:** 2-3 jours | **Owner:** Designer

```
Issue #1: No Keyboard Navigation
[ ] Add :focus styles to all interactive elements
[ ] Implement keyboard tab order (tabIndex)
[ ] Test: Can navigate entire app with Tab key only
[ ] Add visual focus indicators (outline or border)

Issue #2: Missing Focus Indicators  
[ ] Add CSS focus states (buttons, inputs, links)
[ ] Use color (gold #C5A028) for focus feedback
[ ] Ensure 3:1 contrast ratio on focus states

Issue #3: Form Validation Missing
[ ] Add required field indicators (*)
[ ] Implement real-time validation
[ ] Show error messages below fields
[ ] Test: Invalid email rejected, valid accepted

Issue #4: Mobile Navigation Broken
[ ] Implement hamburger menu (mobile only)
[ ] Hide desktop nav on mobile (<768px)
[ ] Test on 375px width (iPhone)

Issue #5: Touch Targets Too Small
[ ] Ensure all buttons ≥48x48px minimum
[ ] Add padding to smaller buttons
[ ] Test with Chrome DevTools touch emulation

// Testing:
✅ Lighthouse Accessibility: 90+/100
✅ WAVE tool: 0 errors
✅ Keyboard-only navigation: 100% functional
✅ Mobile navigation: Tested on 5 devices
```

**Timeline:** June 1-3

---

### TASK 1.2: Form Validation & Error Handling
**Priorité:** HAUTE | **Effort:** 1-2 jours | **Owner:** Developer

```typescript
// Install React Hook Form
npm install react-hook-form zod

// Implement in session generator form:
[ ] Email field: Must be valid email
[ ] Player count: Must be 1-30
[ ] Team selection: Required field
[ ] Show errors: "Invalid email", "Min 1 player", etc.

// Success:
✅ Invalid form cannot be submitted
✅ Error messages clear and helpful
✅ User can correct and resubmit
```

---

### TASK 1.3: A/B Test Pricing
**Priorité:** HAUTE | **Effort:** 3-4 jours | **Owner:** Growth/Analytics

```
Hypothesis: Current €7 price may be too high or too low

Test 1: Price Point
- Variant A: €5/month (convert skeptics)
- Variant B: €7/month (control, current)
- Variant C: €10/month (capture high-value)
- Metric: Conversion rate trial → paid
- Duration: 7 days per variant
- Sample size: 300+ users per variant

Test 2: CTA Messaging
- Variant A: "Upgrade now"
- Variant B: "Save 2 hours per week"
- Variant C: "Get Coach AI"
- Metric: Click-through rate on CTA
- Duration: 3 days

// Tools:
- Firebase A/B Testing
- Vercel Analytics

// Success:
✅ Identify best price point (target 18%+ conversion)
✅ Optimize CTA messaging for clicks
✅ Document learnings for team
```

---

## 🟢 PHASE 2: MARKET VALIDATION (Semaine 3-6)

### TASK 2.1: Product Hunt Launch
**Priorité:** HAUTE | **Effort:** 1 semaine prep | **Owner:** Founder + Growth

```
Timeline: June 15, 2026

Preparation (June 8-14):
[ ] Write Product Hunt description (80 words max)
[ ] Create demo video (60 seconds)
  - Show: Form → 3s generation → Beautiful result
  - Narration: "AI coaching assistant for time-poor coaches"
  - Specs: 1080p, captions, music
[ ] Design Product Hunt thumbnail
[ ] Prepare 3-5 launch day talking points
[ ] Notify beta users to comment/upvote

Launch Day (June 15):
[ ] Post at 12:01 AM Pacific Time
[ ] Pin first comment with discussion question
[ ] Respond to every comment within 1 hour
[ ] Share on Twitter/LinkedIn
[ ] Live in Product Hunt chat (if available)

Post-Launch (June 15-22):
[ ] Track conversion: Trial signups → Paid users
[ ] Gather feedback comments (30+ valuable ones)
[ ] Update product based on feedback
[ ] Write thank-you emails to commenters

// Success Metrics:
✅ 500-1,000 trial signups from Product Hunt
✅ 50+ upvotes (top 10 in category)
✅ 15%+ conversion trial → paid (100-150 paying users)
✅ 10+ press mentions (from Product Hunt ranking)
✅ CAC: €3-5 (very efficient)
```

---

### TASK 2.2: Influencer Seeding Program
**Priorité:** HAUTE | **Effort:** 2 semaines outreach | **Owner:** Growth

```
Target Influencers (Tier 1: 100K-1M followers)

YOUTUBE:
[ ] @FootTrainingAcademy (300K subscribers)
    Offer: 3-month free access + 10% affiliate commission
    Email template: "Your coaching audience would love MastroAI..."
    
[ ] @CoachsPlaybook (200K)
    Offer: Sponsored video "How AI generates sessions"
    
[ ] @TacticalMaster (150K TikTok)
    Offer: Reels clip compilation + affiliate link

PODCAST:
[ ] Les Tribunes du Foot (50K listeners/week)
    Offer: Sponsorship segment (5 min mention)
    
[ ] Tactical Analysis (30K listeners/week)
    Offer: Guest appearance as "AI Coaching Expert"

INSTAGRAM:
[ ] @CoachStoryTelling (80K)
[ ] @FootballTactics (120K)
[ ] @TrainingDrill_Daily (50K)
    Offer: Story takeover + product demo

Outreach Process:
[ ] Create personalized outreach email (50 characters subject)
[ ] Include Product Hunt link + demo video
[ ] Offer affiliate commission structure (10-15%)
[ ] Track: Opens, responses, conversions

// Success Metrics:
✅ 5-10 influencers agree to promotion
✅ 500K-1M impressions across platforms
✅ 300-800 trial signups from influencers
✅ CAC: €2-5
✅ Affiliate revenue: €500-1,500
```

---

### TASK 2.3: Content Marketing & SEO
**Priorité:** HAUTE | **Effort:** 4 semaines | **Owner:** Growth

```
Content Calendar (June-August):

BLOG POSTS (target: organic Google search):
[ ] "How AI Generates Football Sessions in 3 Seconds" 
    - Target keyword: "AI session generator"
    - Length: 2,000 words
    - Includes: Screenshots, video demo
    - Due: June 20

[ ] "FFF Coaching Methodology: Adapting to Daily Load"
    - Target keyword: "coaching methodology", "charge du jour"
    - Length: 1,500 words
    - Includes: Expert quotes, framework graphic
    - Due: June 30

[ ] "MastroAI vs ChatGPT: Which AI Coaching Tool is Better?"
    - Target keyword: "AI coaching", "coaching AI"
    - Length: 2,500 words (comparison)
    - Includes: Benchmark table, user quotes
    - Due: July 15

[ ] "Coaches Save 5 Hours/Week with AI - Here's How"
    - Target keyword: "coaching software", "training generator"
    - Type: Case study
    - Due: August 15

VIDEOS:
[ ] Tutorial: "Generate a 90-minute session in 60 seconds"
    - Platform: YouTube + TikTok
    - Length: 90 seconds
    - Due: June 25

[ ] Demo: "MastroAI Live - Real-time coaching analysis"
    - Platform: YouTube
    - Length: 5 minutes
    - Due: July 10

// SEO Goals:
✅ Rank #1-5 for "AI session generator"
✅ Rank top 10 for "coaching AI"
✅ 200-400 organic trial signups/month by August
✅ 20+ backlinks from sports blogs
```

---

### TASK 2.4: FFF Partnership Outreach
**Priorité:** CRITIQUE | **Effort:** Ongoing | **Owner:** Founder

```
Timeline: June-September

Phase 1 (June 1-15): Research & Positioning
[ ] Identify FFF decision makers
    - Directeur de Ligue (grassroots)
    - Responsable innovation FFF
    - Coaching academy director
    
[ ] Prepare FFF pitch deck (15 slides)
    - Problem: "Coaches lack time for prep"
    - Solution: "MastroAI generates sessions in 3s"
    - Traction: Product Hunt rank, user count, testimonials
    - Partnership: "Official FFF Tool" positioning
    - Revenue: Revenue share terms (proposed: 30/70)
    - Timeline: 2-year commitment, exclusive France

[ ] Write case study: "FFF Coaching Standards + AI"
    - Title: "How MastroAI Brings AI to FFF Methodology"
    - Length: 3-page white paper
    - Include: Technical methodology, validation approach
    - Due: June 10

Phase 2 (June 15 - July 1): Initial Outreach
[ ] Schedule calls with 3-5 FFF decision makers
    - Use: LinkedIn, email intro from mutual contact
    - Goal: 15-30 min exploratory call
    - Success: Interest in deeper discussion
    
[ ] Present: Partnership opportunity deck
    - Timeline: 15 min presentation
    - Ask: "Would you like to explore pilot?"

Phase 3 (July 1 - Sept 1): Partnership Development
[ ] Negotiate terms:
    - Revenue share structure
    - Exclusive access period
    - Co-marketing agreement
    - Technical integration (FFF branding, data flow)
    
[ ] Develop: Pilot program
    - 10-20 FFF coaches/clubs test tool
    - Gather feedback & testimonials
    - Iterate based on feedback
    
[ ] Sign: LOI (Letter of Intent) by Sept 1
    - Commitment: €5K/month minimum by month 9
    - Exclusivity: France only (not EU)
    - Duration: 2-year agreement

// Success Metrics:
✅ 3+ FFF meetings completed
✅ Pilot program running with 10+ FFF coaches
✅ LOI signed by Sept 1
✅ Expected impact: 3,000-5,000 FFF referrals by Dec
✅ Revenue boost: €30-50K additional ARR Y1
```

---

## 📊 PHASE 3: METRICS & OPTIMIZATION (Semaine 4-6)

### TASK 3.1: Setup Analytics & Tracking
**Priorité:** HAUTE | **Effort:** 2-3 jours | **Owner:** Developer

```typescript
// Install analytics tools
npm install @vercel/analytics

// Track key metrics:
[ ] Trial signups (source, date)
[ ] Trial → Paid conversion (day of conversion)
[ ] Feature usage (which features are used)
[ ] Session generation count
[ ] Video uploads
[ ] MastroAI Live usage
[ ] Payment success/failures
[ ] Churn rate (paid users who cancel)

// Dashboard Goals:
- Daily active users (DAU)
- Monthly active users (MAU)
- Conversion rate (trial → paid)
- Churn rate
- Revenue run-rate (MRR)
- CAC by channel
- LTV by cohort

// Success:
✅ Data available in Vercel Analytics dashboard
✅ Daily tracking email setup
✅ Data informs decision-making
```

---

### TASK 3.2: Customer Interviews (10-15 coaches)
**Priorité:** HAUTE | **Effort:** 2 semaines | **Owner:** Founder

```
Goal: Validate product-market fit & pricing

Interview Script (30 minutes each):

1. "What made you try MastroAI?"
   → Understand messaging effectiveness
   
2. "What's your biggest coaching challenge?"
   → Confirm pain point (time, methodology, etc)
   
3. "How would MastroAI help?"
   → Validate solution understanding
   
4. "Would you upgrade to Coach plan (€7/month)?"
   → Measure willingness to pay
   
5. "What would make you upgrade?"
   → Identify pricing/feature gaps
   
6. "Would you recommend to a colleague?"
   → Measure NPS (promoter score)

Target:
[ ] 5 Essai users (why not upgrade?)
[ ] 5 Coach users (why did you upgrade?)
[ ] 5 RT users (why enterprise tier?)

Output:
- Quantify product-market fit (40%+ "would recommend" = good)
- Identify top 3 objections to upgrade
- Validate pricing sweet spot
- Gather quotes for case studies/landing page

Timeline: June 15 - June 30
```

---

### TASK 3.3: Churn Analysis & Retention
**Priorité:** HAUTE | **Effort:** 1 semaine | **Owner:** Growth

```
Goal: Achieve 85%+ month-to-month retention

Analysis:
[ ] Calculate churn rate
    Churn % = (Users lost) / (Starting users) × 100
    Target: 85%+ retention (≤15% churn)
    
[ ] Identify churn reasons
    - Did they use product? (yes/no)
    - How many sessions generated?
    - Feature feedback?
    - Pricing objection?
    
[ ] Survey churned users (5-10 interviews)
    "What would have made you stay?"
    "Was it price, features, or something else?"

Retention Levers:
[ ] Email onboarding sequence (5 emails over 14 days)
    - Day 1: Welcome + quick start
    - Day 3: "Here's your first session"
    - Day 7: "3 ways to save time with MastroAI"
    - Day 10: "Coaches are saving 5 hours/week"
    - Day 14: "Last chance - upgrade before trial ends"
    
[ ] In-app engagement
    - Celebrate milestones ("10 sessions generated!")
    - Show value: "You've saved ~3 hours this week"
    - Prompt upgrades at natural friction points
    
[ ] Win-back campaign (if churn > 20%)
    - "We've improved MastroAI - try again free"
    - Send to users who churned
    - Target: 10% win-back rate

Timeline: June 20 - July 15
```

---

## 📅 TIMELINE CONSOLIDÉ (30 JOURS)

```
WEEK 1 (May 27-31):
├─ [ ] Stripe integration (DONE)
├─ [ ] Firebase Auth full integration (DONE)
├─ [ ] Firestore persistence (DONE)
└─ Milestone: PAYMENT + PERSISTENCE = REVENUE POSSIBLE

WEEK 2 (June 1-7):
├─ [ ] Dashboard MVP (DONE)
├─ [ ] Fix 5 critical UX issues (DONE)
├─ [ ] Form validation (DONE)
├─ [ ] Pricing A/B test setup (DONE)
└─ Milestone: PRODUCT COMPLETE + TESTABLE

WEEK 3 (June 8-14):
├─ [ ] Product Hunt prep (content, video, thumbnail)
├─ [ ] Influencer outreach emails sent
├─ [ ] FFF partnership outreach started
├─ [ ] Content marketing calendar published
└─ Milestone: GO-TO-MARKET LAUNCHED

WEEK 4 (June 15-21):
├─ [ ] Product Hunt launch (June 15)
├─ [ ] Track launch metrics (signups, conversion)
├─ [ ] Customer interviews started (5 completed)
├─ [ ] Analytics dashboard live
└─ Milestone: MARKET VALIDATION STARTED

WEEK 5-6 (June 22 - July 5):
├─ [ ] Influencer campaigns live (5+ promotions)
├─ [ ] Content marketing (2 blog posts published)
├─ [ ] FFF pilot program proposals sent
├─ [ ] Pricing optimization (A/B test results)
└─ Milestone: GROWTH ACCELERATION

TARGET OUTCOMES (June 30):
✅ 2,000+ trial signups (all sources combined)
✅ 200-300 paying users (10-15% conversion)
✅ €1,500-2,500 MRR run-rate
✅ 15%+ Product Hunt conversion
✅ 5+ influencer collaborations live
✅ FFF meetings scheduled (3+)
✅ 10+ customer interviews completed
```

---

## 🎯 SUCCESS CRITERIA

### For Phase 0 (Revenue Unblocking)
- ✅ First payment processed successfully
- ✅ User data persists across sessions
- ✅ Dashboard MVP shows stats for RT users
- ✅ 0 critical bugs in payment flow

### For Phase 1 (Product Polish)
- ✅ Lighthouse Accessibility: 90+
- ✅ WAVE tool: 0 errors
- ✅ Keyboard navigation: 100% functional
- ✅ Mobile navigation: Tested on 3 devices

### For Phase 2 (Market Validation)
- ✅ 2,000+ trial signups by end June
- ✅ 15%+ trial → paid conversion rate
- ✅ Product Hunt: Top 5 rank (daily)
- ✅ 5+ influencer campaigns launched
- ✅ FFF LOI progress (meetings completed)

### For Phase 3 (Metrics & Insights)
- ✅ Analytics dashboard live (daily updates)
- ✅ 10+ customer interviews completed
- ✅ Churn rate: 85%+ retention target
- ✅ Pricing optimization: Best price identified
- ✅ 200-300 paying users by July 1

---

## 🚨 RISK MITIGATION

**If Stripe integration takes longer than expected:**
- Use LemonSqueezy as backup (faster integration)
- Set hard deadline: May 30 (no exceptions)
- Have backup person ready to help

**If conversion rate stays below 12%:**
- Immediately test new pricing (€5, €12)
- Add friction to trial (day 5 paywall)
- Analyze which features users aren't trying

**If influencers don't respond:**
- Email again (week 2) with success stories
- Offer higher commission (15% vs 10%)
- Try tier 2 influencers (10K-50K followers)

**If FFF partnership stalls:**
- Start conversations with other federations (Spain, Italy)
- Pursue Ligue 1 club partnerships as alternative
- Don't let one deal block entire growth

---

## 📞 QUESTIONS?

**For each task:**
1. Who is responsible? (Owner listed)
2. What's the success metric? (Listed)
3. When's the deadline? (Timeline provided)
4. What if something breaks? (Risk mitigation above)

**Report progress weekly** - This plan should be updated every 7 days with completed items.

---

**Document de:** Audit Strategic Complet  
**Dernière mise à jour:** 25 Mai 2026  
**Prochaine revue:** 30 jours (June 25)
