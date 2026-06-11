# IELTS Writing Coach — Product Requirements Document

**Version:** 0.2
**Last updated:** 2026-05-11
**Status:** Pre-build planning
**Owner:** Mallar B.
**Mode:** Side project, no fixed deadline

---

## 1. Executive Summary

A web-based IELTS Writing (Task 2) coaching product targeted at Nepali test-takers. **Guided Mode** (Socratic step-by-step build) is the core differentiator and will be built FIRST. Unguided Mode (full essay → full feedback) ships afterwards as a smaller add-on. Supports typed input and handwritten essay photo upload (OCR). Priced in NPR via Khalti/eSewa.

**Core thesis:** Free LLMs already grade essays adequately. Our defensible value is (a) a *pedagogically structured guided mode* that walks students through hook → thesis → topic sentences → support → conclusion with **specific, actionable feedback** (not "good hook" but "add a statistic about X to strengthen the hook"), (b) a frictionless handwritten-essay workflow, and (c) Nepal-specific localization, payment, and trust.

**Hard constraints:**
- No hallucination — every piece of feedback must cite a quote from the user's own text; validated programmatically
- Feedback must be **actionable and specific** — generic "improve your vocabulary" is a failure
- Model-agnostic backend — must support swapping between Claude, Gemini, OpenAI, open-source
- Web-only at launch
- Block submission below 250 words (cost protection + IELTS standard)

---

## 2. Build Priority (UPDATED)

**Priority 1: Guided Mode** — must work well before anything else ships.
- If guided mode doesn't feel like a tutor, the whole product is a generic AI wrapper.
- All prompt engineering effort goes here first.

**Priority 2: Unguided Mode** — straightforward addition once guided is solid.
- Reuses the same per-stage validators, just runs them all at once.

**Priority 3: OCR intake** — works alongside both modes.

**Out of scope for now:**
- B2B (coaching center) sales
- Multi-tier pricing (single free tier during beta; one paid tier after)
- Speaking module
- Mobile apps
- Anonymized data storage for fine-tuning (future, not now)

---

## 3. Target Audience

### Primary persona — "Sita, the serious test-taker"
- Age 19–28, booked IELTS exam in 1–3 months
- Targets band 6.5–7.5
- Comfortable with smartphone, less so with prompting AI
- Practices on paper
- Will pay NPR 500 if product clearly accelerates her score

### Out of scope
- Tech-enthusiasts using ChatGPT Plus
- Casual learners with no exam date

---

## 4. Value Proposition

> "Get IELTS Writing feedback that walks you through every paragraph — like a tutor, not a grader. Photo upload your handwritten essays. Pay in rupees."

**What we are NOT:**
- Not "AI essay grader" (commodity)
- Not a chat-with-AI product
- Not a generic writing improvement tool

---

## 5. Core Features

### 5.1 Guided Mode (PRIORITY 1 — build first)

User progresses through structured stages. Each stage gets instant AI feedback. Stages can be revised. Users can override and proceed past warnings.

**Stage flow:**
1. **Prompt setup** — user enters Task 2 prompt or selects from bank
2. **Hook** — 1–2 sentence hook → feedback on type, relevance, specificity
3. **Thesis** — clear position + structure preview → feedback
4. **Hook→Thesis bridge** — connecting sentences → flow + word count feedback
5. **Topic Sentence 1** — checked against thesis link
6. **Body Paragraph 1** — full paragraph → support, example, link-back feedback
7. **Topic Sentence 2** — same as TS1
8. **Body Paragraph 2** — same as BP1
9. *(Optional)* TS3 + Body 3
10. **Conclusion** — restatement + synthesis check (no new ideas)
11. **Final synthesis** — full essay assembled, holistic band score

**Feedback quality requirements (CRITICAL):**
- Must be **specific and actionable**: "add a statistic about X" not "make it stronger"
- Must reference what the user wrote (quote or paraphrase)
- Must explain WHY (link to IELTS rubric criterion)
- For weak sections: provide a rewritten example
- For strong sections: still show what would make it band 7+ (growth path)

**Override behavior:**
- User can proceed past any stage even if rated "needs improvement"
- Warning shown: *"This section needs improvement and may affect your final band score. Proceed anyway?"*
- Override is logged for analytics

**Revision:**
- User can return to any completed stage and rewrite
- Re-runs feedback (counts as 1 turn)
- Hard cap: 8 turns per stage to control cost

### 5.2 Guided Mode UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  TOPIC (FIXED — always visible at top)                       │
│  "Some people think X. Others think Y. Discuss both views."  │
├──────────────────────────────────────────┬──────────────────┤
│                                          │  STAGE TRACKER   │
│  CURRENT STAGE: HOOK                     │  ────────────    │
│                                          │  ✓ Topic         │
│  ┌────────────────────────────────────┐ │  ⏳ Hook         │
│  │  [free textbox for user input]     │ │  ⚪ Thesis       │
│  │                                    │ │  ⚪ Bridge       │
│  └────────────────────────────────────┘ │  ⚪ TS1          │
│                                          │  ⚪ BP1          │
│  [Get Feedback]                          │  ⚪ TS2          │
│                                          │  ⚪ BP2          │
│  ┌─ AI FEEDBACK ────────────────────┐   │  ⚪ Conclusion   │
│  │ Rating: Needs improvement         │   │                  │
│  │ • Hook is too general...          │   │  Each item:      │
│  │ • Suggested: Add stat like...     │   │   ✓ approved     │
│  │ • Example rewrite: "..."          │   │   ⚠ warned-pass  │
│  └────────────────────────────────────┘   │   ⏳ in progress │
│                                          │   ⚪ locked      │
│  [Revise] [Approve & Continue →]         │                  │
│                                          │                  │
└──────────────────────────────────────────┴──────────────────┘
```

**Stage tracker checklist (right sidebar):**
- ✓ green tick = approved
- ⚠ yellow = user proceeded despite warning
- ⏳ in progress
- ⚪ locked
- Click any approved stage to revise

### 5.3 Unguided Mode (Priority 2)

Build after guided mode works.
- Direct typing or photo upload
- Topic + essay → full structured feedback
- Reuses the same per-stage validators (hook validator + thesis validator + ...) run sequentially
- Output: band scores per criterion + paragraph-by-paragraph annotations

### 5.4 OCR Intake (Priority 3)

- Photo upload (JPG/PNG/HEIC, max 10MB, multi-page up to 3)
- Google Cloud Vision DOCUMENT_TEXT_DETECTION
- Confidence scores per word; low-confidence words highlighted in editor
- User edits text in confirmation step before submission
- Original image stored alongside transcribed text

### 5.5 Essay History

- All essays stored per user (typed input, OCR text, prompt, feedback, scores)
- Simple list view; click to revisit
- (Charts and trajectory analysis = post-MVP)

### 5.6 Topic Bank

- 30+ Task 2 prompts at launch
- Sourced from official IELTS publications (Cambridge IELTS books, IDP, British Council)
- Tagged: opinion / discussion / problem-solution / two-part / advantages-disadvantages
- User can also paste their own prompt

---

## 6. Anti-Hallucination Requirements

### 6.1 Structured output enforcement
Every AI response must conform to a JSON schema (defined per stage in the build spec). Free-text responses are rejected.

### 6.2 Quote validation (free, not an LLM call)
- Every `evidence_quote` field in the AI response must be a substring of the user's submitted text
- Implementation: simple string match in code (no LLM cost)
- If validation fails: retry the LLM call with stricter prompt
- Max 3 retries; if all fail, return generic feedback for that finding

### 6.3 Rubric grounding
- Official IELTS public band descriptors loaded as cached system prompt context
- Model must map every band claim to a specific descriptor clause

### 6.4 No fabricated statistics
- When AI suggests "add a statistic," it must mark it as `[VERIFY: insert real statistic about X]`
- Model is instructed never to invent specific numbers, dates, or studies
- These markers shown in UI as a warning to the user

### 6.5 Display requirements
- Every suggestion shown next to the cited quote
- "AI-generated — verify before applying" disclaimer

---

## 7. Pricing & Packaging (SIMPLIFIED FOR MVP)

| Tier | Price (NPR) | Essays | Guided | OCR | When |
|---|---|---|---|---|---|
| **Free Beta** | 0 | Unlimited (rate-limited) | Yes | Yes | During beta testing |
| **Standard** | 499 | 25 | 3 | 12 | Post-beta launch |

- During beta: free for everyone to gather feedback and find bugs
- Multi-tier pricing (Starter, Pro, Test Cram) deferred until product is validated
- 90-day expiry on Standard package

**Free trial (post-beta):** Just the **intro section** of guided mode (Hook + Thesis + Bridge). Shows the differentiator without burning much cost. ~$0.05 cost per trial.

---

## 8. Technical Architecture

### 8.1 Stack
- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API routes / Server Actions
- **Database:** Supabase (Postgres + Auth + Storage)
- **OCR:** Google Cloud Vision API
- **LLM:** Model-agnostic adapter (default: Claude Sonnet 4.6)
- **Payments:** Khalti (post-beta only)
- **Hosting:** Vercel
- **Email:** Resend
- **Monitoring:** Sentry (free tier)
- **Analytics:** PostHog

### 8.2 Model-agnostic LLM adapter
Single interface for all AI calls. See `MVP_BUILD_SPEC.md` for the exact interface.

Implementations to start:
- `ClaudeProvider` (Sonnet 4.6 — primary)
- `OpenAIProvider` (fallback, also useful for A/B testing prompt variations)

Add later as needed:
- `GeminiProvider`
- `OpenSourceProvider` (Kimi K2 / Llama via Together AI or Groq)

### 8.3 Cost controls
- Aggressive prompt caching of IELTS rubric (~4K tokens)
- Cap turns per stage at 8
- Block submissions <250 words (unguided)
- Rate-limit to prevent abuse
- Validation retry cap at 3

---

## 9. Sample Essay Sourcing

10 verified IELTS Task 2 essays with feedback to use as:
- Test cases for the AI pipeline
- Calibration data ("does our scoring agree with official scoring?")
- Examples in marketing

**Sources:**
- Cambridge IELTS official practice books (1–18) — sample answers with band scores
- IELTS.org official preparation materials
- British Council Take IELTS sample essays
- IDP IELTS sample essays
- ielts-simon.com (verified ex-examiner)

Save samples to `docs/samples/` as JSON: `{ prompt, essay, official_band, official_feedback }`.

---

## 10. MVP Scope (revised — guided-first)

### Phase 1: Guided mode core (no auth, no payment, local-only)
- [ ] Project setup, env vars, dev environment
- [ ] LLM adapter interface + Claude provider
- [ ] Stage prompts for Hook + Thesis + Bridge (3 stages)
- [ ] JSON schema validation per stage
- [ ] Quote validator (programmatic)
- [ ] Basic UI: topic input, stage textbox, feedback panel, sidebar tracker
- [ ] Test against 5 sample essays manually

### Phase 2: Complete guided mode
- [ ] Remaining stages (TS1, BP1, TS2, BP2, optional TS3/BP3, Conclusion, Synthesis)
- [ ] Override + revision flow
- [ ] Full essay assembly view
- [ ] Test against all 10 sample essays

### Phase 3: Persistence + auth
- [ ] Supabase setup
- [ ] Auth (email + Google)
- [ ] Save guided sessions to DB
- [ ] Essay history view

### Phase 4: Unguided mode
- [ ] Reuse stage validators in batch mode
- [ ] Full-essay UI
- [ ] Word count enforcement

### Phase 5: OCR
- [ ] Google Cloud Vision integration
- [ ] Photo upload UI
- [ ] Confidence-highlighted confirmation editor

### Phase 6: Beta launch
- [ ] Deploy to Vercel
- [ ] Invite 20 beta testers
- [ ] Collect feedback for 4 weeks
- [ ] Iterate

### Phase 7: Payments + paid tier
- [ ] Khalti integration
- [ ] Credit system
- [ ] NPR 499 Standard tier
- [ ] Public launch

---

## 11. Success Metrics

### Beta phase (no revenue, focus on quality)
- 20 beta testers complete ≥3 guided essays each
- IELTS instructor blind review: ≥80% of AI feedback rated "useful and accurate"
- Hallucination rate <2% (measured by validator failures)
- Guided mode completion rate >60%

### Post-launch (first 90 days)
- 500 free trial signups
- 10% trial → paid conversion (50 paying users)
- NPR 25,000 revenue (~$190)
- <5% refund rate

---

## 12. Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Free LLMs commoditize feedback | High | Compete on guided mode UX + actionable specificity, not "AI grading" |
| Guided feedback feels generic | High | Heavy prompt engineering; specific actionable suggestions enforced via schema |
| Hallucinations damage trust | High | Strict JSON + quote validation + retry logic |
| OCR fails on poor handwriting | Medium | Confidence scores + user edit step |
| Side project bandwidth | Medium | Phase-based scope; ship guided first, defer everything else |

---

## 13. Open Questions (still unresolved)

1. **Topic prompts:** scrape from official sources or write custom? (Recommend: use official prompts, credit source)
2. **Essay prompts copyright:** check Cambridge IELTS books usage rights before publishing
3. **Refund policy** (post-paid launch): unconditional 7-day or money-back if not satisfied?
4. **Brand name:** TBD. Avoid "AI" in name; lean into "coach" or "tutor"
5. **Privacy policy + terms of service:** need to draft before public launch
6. **Hosting region:** Vercel default is US — latency from Nepal is ~300ms. Acceptable for now; consider edge functions later

---

## 14. Definition of Done — Beta Launch

- [ ] All guided stages working end-to-end
- [ ] 5 IELTS instructors independently rate feedback ≥4/5 on blind sample
- [ ] Hallucination validator passes 98%+ on 50 test essays
- [ ] Mobile-responsive
- [ ] 10 sample essays in `docs/samples/`
- [ ] Privacy notice (even basic)
- [ ] Customer feedback channel set up (email + WhatsApp)

---

*This PRD is a living document. Update as decisions are made and assumptions are validated.*
