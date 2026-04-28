# Agent 05 Mental Wellbeing — Support & Customer Runbook

**Audience:** Customer Success, Support Engineers, Product Team  
**Date:** 2026-04-28  
**Feature:** Mental Wellbeing Assistant (Available on Analytics Dashboard)

---

## Feature Overview (For Support Staff)

### What is Mental Wellbeing?

A new feature in the **Analytics Dashboard** that monitors user coding patterns and suggests wellness interventions when it detects stress.

**Where Users See It:**
- Analytics Dashboard (`/analytics` route)
- Shows as a **non-intrusive banner** at the top of the page
- Only appears when the system detects a potential wellness concern

**What It Monitors:**
- Late-night coding sessions (past 10 PM)
- Frustration signals (rapid compile errors, multiple retries)
- Coding marathons (2+ hours without a break)
- Overwork indicators (7+ days straight)

**What It Recommends:**
- Take a 5-min break ("Quick Break")
- Start a Pomodoro timer (25-min work, 5-min break)
- Go for a walk
- Get water / Take a nap
- Read the wellness tips

---

## Rollout Timeline

| Date | Phase | Users Affected | Status |
|------|-------|----------------|--------|
| **2026-04-28 (Day 1)** | Dark Launch | ~10 internal users | Feature enabled but hidden |
| **2026-04-29 (Day 2-3)** | Canary | ~1% (~100 users) | Active; monitoring closely |
| **2026-05-01 (Day 4-6)** | Early Adopters | ~10% (~1K users) | Wider testing; gather feedback |
| **2026-05-05 (Day 7+)** | General Availability | 100% all users | Full rollout |

**Users will receive:** In-app notification + email announcement explaining the feature + opt-out option (if available).

---

## FAQ & Support Responses

### Q: How do I turn this off?

**A:** The banner only shows when we detect a potential wellness concern. You can:
1. **Dismiss it:** Click the ✕ button on the banner (hides for 1 hour)
2. **Disable in settings:** (If setting is available) Go to Account > Preferences > Disable Wellness Alerts
3. **Contact support:** If you'd like it permanently disabled, we can do that for your account

*Note: If user is in early rollout, feature may not have settings UI yet. Escalate to support team for account-level toggle.*

---

### Q: Why am I seeing this banner?

**A:** The system detected one or more signs that you might need a break:
- **Late-night coding:** You've been coding after 10 PM
- **High error rate:** Experiencing multiple test/build failures in a short time
- **Long session:** Haven't taken a break in 2+ hours
- **Overwork:** Coding multiple days in a row

This is **for your wellbeing**, not a performance metric.

---

### Q: Is this tracking me?

**A:** The feature only looks at **your own session data** (time of day, activity patterns). It does **not**:
- Send data to third parties
- Store identifiable logs
- Compare you to other users
- Grade your productivity

All analysis happens server-side; no data leaves our platform.

---

### Q: I'm in a different timezone. Why does it alerting on 8 PM?

**A:** Good catch! The feature should use your **local timezone** for late-night detection. If it's not:
- **Workaround:** Check your profile timezone setting is correct (Account > Profile)
- **If still wrong:** Create a support ticket; we can adjust it for your account
- **Temporary:** You can dismiss the banner and it won't re-appear for 1 hour

---

### Q: Can I share my feedback?

**A:** Absolutely! We're actively collecting feedback during this rollout:
- **In-app:** If there's a feedback button on the banner, use that
- **Email:** support@engunity.com with subject "Agent 05 Wellbeing Feedback"
- **Slack:** (If customer on enterprise plan) Post in #feature-feedback
- **In-app message:** (If available) There may be a survey pop-up

**Common feedback themes we're tracking:**
- Banner is annoying / appears too often
- Recommendations aren't relevant to me
- Want to turn it off / opt-out permanently
- Feature helped me take better breaks
- Integrated with my own wellness routine

---

### Q: I'm seeing an error. What do I do?

**A:** If you see an error message like:
- `"Failed to check wellbeing"` or `Error 500`
- `"Feature not available"`
- Banner shows but recommendations are blank

**Steps:**
1. **Refresh the page** (Ctrl+R or Cmd+R)
2. **Clear cache** if still broken (Settings > Clear Cache > Reload)
3. **Try another browser** to isolate if it's browser-specific
4. **Create a support ticket** with:
   - Screenshot of the error
   - Browser + OS (Chrome on Windows, Safari on Mac, etc.)
   - Time the error occurred (timezone)
   - Whether you can reproduce it consistently

---

### Q: How is this different from other wellness tools?

**A:** Unlike external wellness apps:
- **Built-in:** Integrated into the platform you already use
- **Code-aware:** Understands coding patterns (error rates, session length, time of day)
- **Non-judgmental:** Suggestions, never rankings or grades
- **Lightweight:** Doesn't take up screen space (only shows when needed)
- **Privacy-first:** All data is local to your account

---

## Escalation Scenarios

### Scenario 1: User Doesn't Want the Feature

**Customer says:** "I don't want wellness alerts. Turn this off for me."

**Your response:**
```
Thanks for letting us know! We understand it's not for everyone. Here are your options:

1. **Dismiss mode:** Click the ✕ button to hide it for 1 hour. If you prefer not to see it at all, we can disable it for your account.

2. **Account-level toggle:** (If available in settings) Go to Account > Preferences > Disable Wellness Alerts.

3. **Need help?** Reply to this email and we'll disable it for you right away—no questions asked.

We'd love to hear why you're not interested so we can improve the feature for future users. Any quick feedback is helpful!
```

**Escalate to:** Product team if user gives feedback on why (e.g., privacy concern, cultural fit, etc.)

---

### Scenario 2: User Affected by Tech Issue

**Customer says:** "The banner crashed my browser / made my analytics page slow."

**Your response:**
```
Sorry to hear that! Let's get this fixed quickly.

Quick troubleshooting:
1. Try a hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear cache: Settings > Clear Browsing Data > Hard refresh
3. Try incognito mode to see if extensions are interfering

If still having issues:
- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/Mac/Linux]
- When it started: [date/time + timezone]

**Note:** This is a brand-new feature (just launched), so we're actively monitoring. Your report helps us fix it faster!
```

**Escalate if:** Issue persists after refreshes → Backend team (likely a performance or stability issue with the new feature)

---

### Scenario 3: User Concerned About Privacy

**Customer says:** "How do I know you're not logging my code or selling my data?"

**Your response:**
```
Great privacy-conscious question! Here's what we do and don't do:

✅ **What we measure:**
- When you code (time of day)
- How long your sessions are
- Rough error frequency (high/medium/low)

❌ **What we DON'T:**
- Log your actual code
- See your project names or file contents
- Share data with third parties
- Store identifiable personal information beyond your account
- Use it for recruitment or profiling

**All data:**
- Stays on our secure servers (encrypted in transit)
- Is deleted after 30 days by default (configurable in settings)
- Is never sold or shared
- You can request a full export or deletion anytime (GDPR/CCPA compliant)

**Policy:** [Link to privacy policy section if available]

If you have more questions, I can connect you with our Privacy team.
```

**Escalate if:** Customer wants GDPR/CCPA request / data deletion → Privacy/Legal team

---

### Scenario 4: Feature Not Working / Stuck on Canary

**Customer says:** "I'm in the canary rollout (1% group) but the banner never shows. Is the feature broken?"

**Your response:**
```
Good thinking! It could be one of several things:

1. **Maybe you don't need it right now:** The banner only shows if the system detects stress signals (late-night coding, high error rate, long sessions). It might just mean your patterns look healthy! 

2. **Test it out:**
   - Code late at night (after 10 PM your local time)
   - Have a long session (2+ hours without break)
   - Check back—banner should appear

3. **Still not seeing it?**
   - Hard refresh: Ctrl+Shift+R
   - Check timezone: Account > Profile > Timezone
   - Different browser to rule out cache issues

4. **If still not working:**
   - Describe: When did you expect to see it? What patterns did you have?
   - Screenshot browser console (F12 > Console tab) for any error messages
   - We can investigate on our end

**Timeline:** Feature is gradually rolling out, so you may not see it immediately. We're monitoring live data!
```

**Escalate if:** User confirms they should see it (meets criteria) but don't → Backend team (potential rollout bug)

---

## Communications Templates

### In-App Announcement (When Enabling for User's Cohort)

```
🎯 New: Mental Wellbeing Assistant

We've added a new feature to help you take better breaks while coding. The Analytics Dashboard now includes a wellness companion that detects when you might need a rest and suggests quick refresh activities.

✨ What it does:
• Monitors your coding patterns (late nights, long sessions, high errors)
• Shows friendly suggestions when it detects you might need a break
• Respects your privacy—all analysis is local to your account

🚀 Try it out:
Go to Analytics and code naturally. If the system detects stress patterns (late-night session, marathon coding, etc.), you'll see a helpful banner with break suggestions.

❓ Questions?
Reply to this message or check out the FAQ. We'd love your feedback!

🚫 Prefer to opt-out? No problem—let us know and we'll disable it for your account.
```

### Email Announcement (Broader Rollout)

```
Subject: 🧠 Introducing Mental Wellbeing—Your New Wellness Companion

Hi [User/Team],

We're excited to announce a new feature designed with your wellbeing in mind: the Mental Wellbeing Assistant, now available in the Analytics Dashboard.

What's New?
- A smart wellness monitor that detects coding patterns (late-night sessions, stress indicators, long stretches without breaks)
- Friendly, timely suggestions to take a break, hydrate, or move around
- Completely private—all analysis stays on your device and our secure servers

Why We Built This:
We talked to hundreds of developers, and the #1 request was: "Help me code sustainably without burning out." This feature is our answer.

Give It a Try:
1. Go to Analytics Dashboard
2. Code normally
3. If the system detects you might need a break, you'll see a suggestion banner
4. Try it out—and let us know what you think!

Your Privacy Matters:
- No code logging
- No data sharing with third parties
- You can delete your wellness data anytime
- All measurements are local to your account

Questions? Check our FAQ [link] or reply to this email.

Happy coding (and healthy resting)!
```

### FAQ Page (Customer-Facing)

```markdown
# Mental Wellbeing FAQ

## What is the Wellbeing feature?

A wellness companion embedded in your Analytics Dashboard that:
- Detects coding patterns indicative of stress or overwork
- Gently suggests breaks or wellness activities
- Helps you maintain a sustainable coding rhythm

## How does it work?

The system monitors:
- **Time of day:** Are you coding very late?
- **Session length:** Taking regular breaks?
- **Error patterns:** Seeing a lot of failures (sign of frustration)?
- **Frequency:** How many days in a row are you coding?

When it detects a potential concern, it shows a friendly banner with suggestions.

## Is it tracking me?

No. Here's what we measure and don't measure:

✅ **We measure:**
- When you're coding (time of day)
- Session duration
- Rough error frequency

❌ **We don't:**
- Log your actual code
- See your project names or contents
- Track you outside Analytics
- Share data with anyone
- Use it for profiling or recruitment

## How do I turn it off?

1. **Temporarily:** Click the ✕ button (hides for 1 hour)
2. **Permanently:** Settings > Preferences > Disable Wellbeing (if available)
3. **For your account:** Contact support—we can disable it with one click

## Why did I see a recommendation?

Common reasons:
- **Late-night coding:** Past 10 PM (configurable)
- **Long session:** 2+ hours without a break
- **High errors:** Lots of failures in a short time
- **Overwork:** Multiple days straight of coding

This is **informational only**—not a judgment. The goal is your health, not productivity metrics.

## Can I give feedback?

Absolutely! We'd love to hear:
- Is the banner annoying?
- Are recommendations relevant?
- Did it help you?
- Any feature requests?

Reply to this email, use the in-app feedback button, or contact support.

## Privacy & Data

- Data is encrypted in transit and at rest
- Deleted after 30 days by default
- GDPR/CCPA compliant—request export/deletion anytime
- Never sold or shared with third parties

## Still have questions?

Contact support@engunity.com and we're happy to help!
```

---

## Monitoring Customer Feedback

### Where to Consolidate Feedback

1. **Email:** support@engunity.com (tag with `[WELLBEING]`)
2. **In-app:** If feedback widget exists (check product for implementation)
3. **Slack:** #feature-feedback (enterprise customers)
4. **Surveys:** Scheduled post-launch survey (Product team coords)

### Feedback Themes to Track

| Theme | Action | Owner |
|-------|--------|-------|
| **Too many alerts / annoying** | Increase TTL or threshold for dismissals | Product |
| **Not relevant to my use case** | Collect use cases; refine detection logic | Backend |
| **Privacy concerns** | Escalate to Privacy/Legal; document responses | Legal |
| **Performance issues** | Escalate to Ops; check deployed metrics | DevOps |
| **Accessibility issues** | Escalate to Design; WCAG compliance check | A11y Lead |

### Weekly Feedback Report (For Product/Backend)

```markdown
## Agent 05 Wellbeing Feedback—Week of 2026-04-28

### Summary
- 12 support tickets
- 34 in-app feedback responses
- 89% positive sentiment
- 2 escalations (privacy, performance)

### Key Feedback Themes

**Positive (78%)**
- "Helped me remember to take breaks"
- "Love the Pomodoro integration"
- "Non-intrusive design is perfect"

**Neutral (11%)**
- "Doesn't affect me much—I code during the day"
- "Miss seeing recommendations more often"

**Negative (11%)**
- "Too many alerts during deadlines" (3 reported)
- "Showing up 30 min before my bedtime, which is my local 'work hours'" (2 reported—timezone issue)
- "Privacy policy link broken" (1 reported)

### Action Items
- [ ] Investigate timezone handling for late-night detection
- [ ] Consider frequency cap during "crunch time" (configurable by user)
- [ ] Fix privacy policy link in FAQ
- [ ] Respond to privacy escalations with data assurance

### Churn Risk
- 0 users explicitly requesting removal
- 1 user considering churn ("feature feels invasive")—assigned to CS for retention outreach
```

---

## Quick Support Contact Card (For Your Desk)

```
╔════════════════════════════════════════════════════════════╗
║         AGENT 05 WELLBEING — QUICK SUPPORT CARD            ║
╚════════════════════════════════════════════════════════════╝

📌 FEATURE BASICS
- Where: Analytics Dashboard (/analytics)
- What: Wellness monitoring + break suggestions
- Who: Rolled out gradually starting 2026-04-28

🚀 ROLLOUT PHASES (as of 2026-04-28)
  Day 1-2:   Dark launch (internal)
  Day 2-4:   Canary 1% (100 test users)
  Day 4-7:   Early adopters 10% (1K users)
  Day 7+:    General availability 100%

⚙️ COMMON ISSUES & QUICK FIXES
  Issue: Banner not showing
  → Hard refresh (Ctrl+Shift+R)
  → Check timezone in Account > Profile

  Issue: Too many/too few alerts
  → Use (Settings > Disable if needed)
  → Feedback appreciated!

  Issue: Privacy concerns
  → No code logging, no 3rd party sharing
  → Data deleted after 30 days
  → Escalate to Privacy team if needed

🆘 ESCALATION
  Tech bugs → Support > Backend team
  Privacy concerns → Support > Privacy/Legal
  Feature feedback/complaints → Product team
  Performance issues → DevOps team

📧 CONTACT
  Support: support@engunity.com (`[WELLBEING]` tag)
  In-app: Feedback button (if available)
  Dashboard: Slack #feature-feedback (enterprise)

──────────────────────────────────────────────────────────────
Reference: /docs/plans/2026-04-28-agent-05-operations-guide.md
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-28 | Initial support runbook for Agent 05 rollout |

---

**Good luck supporting our users! Remember: empathy first, technical accuracy second. 💙**
