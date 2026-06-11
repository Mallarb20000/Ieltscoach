# IELTS Writing Coach — MVP Build Specification

**Companion to:** `IELTS_Writing_Coach_PRD.md`
**Audience:** Claude Code (or any engineer) building the MVP
**Version:** 0.1
**Last updated:** 2026-05-11

> **Read order:** PRD first (what + why) → this doc (how to build it).

---

## 1. Project Setup

### 1.1 Recommended location

```
C:\Users\malla\projects\ielts-coach\
```

**Why not the current Downloads location:**
- Spaces in path break some build tools
- Downloads gets auto-cleaned
- OneDrive may sync `node_modules` → very slow + corrupts state

**To set up:**
```powershell
New-Item -ItemType Directory -Path "C:\Users\malla\projects\ielts-coach" -Force
# then move PRD + this spec into the new folder
```

### 1.2 Required accounts (set up before coding)

| Service | Purpose | Sign-up |
|---|---|---|
| Anthropic | Claude API (optional LLM provider) | console.anthropic.com |
| Google AI Studio | Gemini API (optional LLM provider) | aistudio.google.com |
| OpenAI | GPT API (optional LLM provider) | platform.openai.com |
| Supabase | Database + auth + storage | supabase.com |
| Google Cloud | Cloud Vision OCR | console.cloud.google.com |
| Vercel | Hosting | vercel.com |
| Khalti | Payment gateway (post-beta) | khalti.com/merchant |
| Resend | Transactional email | resend.com |

### 1.3 Tooling (verify before installing)

Check what's already installed:
```powershell
node --version    # need 20+
npm --version     # need 10+
git --version
```

If missing, install:
- Node.js 20 LTS — nodejs.org
- Git — git-scm.com

### 1.4 Initial project init

```powershell
cd C:\Users\malla\projects\ielts-coach
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
npm install @anthropic-ai/sdk openai @supabase/supabase-js @supabase/ssr
npm install zod
npm install -D @types/node
npx shadcn@latest init
```

---

## 2. Folder Structure

```
ieltscoach/
├── .claude/
│   ├── settings.json          # permissions, hooks
│   └── commands/              # custom slash commands (optional)
├── docs/
│   ├── PRD.md
│   ├── MVP_BUILD_SPEC.md      # this file
│   └── samples/               # 10 reference IELTS essays as JSON
│       ├── sample-01.json
│       └── ...
├── prompts/                   # AI system prompts (one per stage)
│   ├── _shared/
│   │   └── ielts-rubric.md   # cached system context
│   ├── guided/
│   │   ├── hook.md
│   │   ├── thesis.md
│   │   ├── bridge.md
│   │   ├── topic-sentence.md
│   │   ├── body-paragraph.md
│   │   ├── conclusion.md
│   │   └── synthesis.md
│   └── unguided/
│       └── full-essay.md
├── app/                       # Next.js App Router
│   ├── (marketing)/
│   │   └── page.tsx           # landing page
│   ├── guided/
│   │   ├── page.tsx           # guided session UI
│   │   └── [sessionId]/
│   ├── unguided/
│   │   └── page.tsx
│   ├── history/
│   │   └── page.tsx
│   └── api/
│       ├── guided/
│       │   └── feedback/route.ts
│       ├── unguided/
│       │   └── analyze/route.ts
│       └── ocr/
│           └── route.ts
├── components/
│   ├── ui/                    # shadcn components
│   ├── guided/
│   │   ├── StageEditor.tsx
│   │   ├── FeedbackPanel.tsx
│   │   ├── StageTracker.tsx   # right sidebar
│   │   └── TopicHeader.tsx
│   └── shared/
├── lib/
│   ├── llm/
│   │   ├── adapter.ts         # AnalysisProvider interface
│   │   ├── claude.ts          # ClaudeProvider
│   │   ├── openai.ts          # OpenAIProvider
│   │   └── select.ts          # provider selection logic
│   ├── validation/
│   │   ├── schemas.ts         # Zod schemas per stage
│   │   ├── quote-validator.ts # programmatic quote check
│   │   └── retry.ts           # retry logic on validation fail
│   ├── ocr/
│   │   └── google-vision.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   └── utils/
├── types/
│   └── stages.ts              # TypeScript types for all stages
├── CLAUDE.md                  # project instructions for Claude Code
├── README.md
├── package.json
├── .env.local                 # secrets (gitignored)
├── .env.example               # template for .env.local
└── tsconfig.json
```

---

## 3. Environment Variables

`.env.example` (commit this):
```bash
# Anthropic
ANTHROPIC_API_KEY=

# OpenAI (required if DEFAULT_LLM_PROVIDER=openai)
OPENAI_API_KEY=

# Google Gemini (required if DEFAULT_LLM_PROVIDER=gemini)
GOOGLE_GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.1-flash-lite

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Cloud Vision
GOOGLE_APPLICATION_CREDENTIALS=./credentials/google-vision.json

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature flags — supported values: claude | gemini | openai
DEFAULT_LLM_PROVIDER=gemini
```

---

## 4. The LLM Adapter (model-agnostic core)

`lib/llm/adapter.ts`:

```typescript
export type StageId =
  | 'hook'
  | 'thesis'
  | 'bridge'
  | 'topic-sentence'
  | 'body-paragraph'
  | 'conclusion'
  | 'synthesis';

export interface StageInput {
  stage: StageId;
  prompt: string;          // the IELTS task prompt
  userText: string;         // what the user wrote for this stage
  priorContext: {           // accumulated approved sections
    hook?: string;
    thesis?: string;
    bridge?: string;
    topicSentences?: string[];
    bodyParagraphs?: string[];
    conclusion?: string;
  };
}

export interface StageFeedback {
  rating: 'strong' | 'okay' | 'needs_improvement';
  summary: string;          // 1-2 sentence overall
  findings: Finding[];
  rewriteExample?: string;  // optional improved version
  meta: {
    wordCount: number;
    targetWordCount?: { min: number; max: number };
  };
}

export interface Finding {
  evidenceQuote: string;    // MUST be substring of userText
  issue: string;
  suggestion: string;       // specific & actionable, e.g., "Add a stat about X"
  severity: 'minor' | 'major';
  rubricCriterion: 'TR' | 'CC' | 'LR' | 'GRA';
}

export interface AnalysisProvider {
  name: string;
  guidedFeedback(input: StageInput): Promise<StageFeedback>;
  fullEssayFeedback(prompt: string, essay: string): Promise<FullEssayFeedback>;
}

export interface FullEssayFeedback {
  bands: { TR: number; CC: number; LR: number; GRA: number; overall: number };
  paragraphFeedback: Array<{ paragraph: string; findings: Finding[] }>;
  topImprovements: string[]; // 3 most impactful changes
}
```

`lib/llm/select.ts`:
```typescript
import { ClaudeProvider } from './claude';
import { GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';
import type { AnalysisProvider } from './adapter';

export function getProvider(): AnalysisProvider {
  const choice = process.env.DEFAULT_LLM_PROVIDER ?? 'claude';
  switch (choice) {
    case 'openai': return new OpenAIProvider();
    case 'gemini': return new GeminiProvider();
    case 'claude':
    default: return new ClaudeProvider();
  }
}
```

---

## 5. Stage Prompts (the heart of the product)

Each stage has its own prompt file. Here's the **Hook** stage as a template — others follow the same pattern.

### `prompts/_shared/ielts-rubric.md`
Load the **official IELTS Task 2 public band descriptors** (Bands 4–9, four criteria). Source: ielts.org. ~3500 tokens. This file is loaded as cached system context for every call.

### `prompts/guided/hook.md`

```markdown
# System Prompt: Hook Stage

You are an experienced IELTS Writing Task 2 coach reviewing a student's HOOK SENTENCE.

## Context
- Task 2 prompt: {{prompt}}
- Student's hook: {{userText}}

## Your job
Analyze the hook against IELTS Band 7+ standards and return STRICTLY VALID JSON matching the schema below. No prose, no markdown, no preamble.

## What makes a strong IELTS hook (Band 7+)
- Directly relevant to the prompt topic
- Specific (not vague generalities like "Nowadays, technology is everywhere")
- One of these types:
  - **Statistic/fact** (e.g., "Over 60% of urban Nepalis...")
  - **Counterintuitive claim** (e.g., "Despite rising incomes, happiness has declined")
  - **Question** (rare, must be rhetorical and pointed)
  - **Definition** of a key term
  - **Brief scenario/example**
- Avoid: clichés ("In today's modern world..."), copying the prompt verbatim, vague openers

## Required output schema (JSON only)
```json
{
  "rating": "strong" | "okay" | "needs_improvement",
  "summary": "<one sentence overall verdict>",
  "hook_type_detected": "statistic | claim | question | definition | scenario | generic | none",
  "findings": [
    {
      "evidenceQuote": "<exact substring from student's hook>",
      "issue": "<what's wrong or weak>",
      "suggestion": "<SPECIFIC actionable change — e.g., 'Replace with a statistic about urbanization in Nepal' not 'make it stronger'>",
      "severity": "minor" | "major",
      "rubricCriterion": "TR" | "CC" | "LR" | "GRA"
    }
  ],
  "rewriteExample": "<an improved hook the student could use, max 35 words>",
  "meta": {
    "wordCount": <int>,
    "targetWordCount": { "min": 15, "max": 35 }
  }
}
```

## Critical rules
1. Every `evidenceQuote` MUST be a verbatim substring of the student's hook.
2. If suggesting a statistic, mark unverifiable numbers as `[VERIFY: insert real statistic about X]` — NEVER fabricate specific numbers, dates, or studies.
3. Suggestions must be specific. Bad: "Make it more engaging." Good: "Open with a counterintuitive claim like 'Although Nepal has...'"
4. Tie at least one finding to a specific IELTS rubric criterion (TR/CC/LR/GRA).
5. Rating logic:
   - `strong` = relevant + specific + appropriate type, minor or no findings
   - `okay` = relevant but generic OR slightly off-topic
   - `needs_improvement` = vague, off-topic, copies prompt, or clichéd

Return JSON only.
```

### Other stage prompts (build similarly)

- **`thesis.md`** — Check: takes a clear position? Previews structure (e.g., "...because of X and Y")? Directly answers the prompt? Word count 25–40.
- **`bridge.md`** — 1–2 sentences linking hook to thesis. Check: smooth flow, no abrupt jump, intro paragraph total ~50 words.
- **`topic-sentence.md`** — Check: introduces ONE main idea, links back to thesis, signals what the paragraph will argue.
- **`body-paragraph.md`** — Check: support (reasoning), example (specific instance), link-back (how it proves thesis). Target 80–120 words.
- **`conclusion.md`** — Check: restates position, synthesizes main points, NO new ideas, no new examples.
- **`synthesis.md`** — Holistic full-essay review with band scores per criterion.

Each prompt file follows the hook template structure: System Prompt → Context → What makes a strong X → Required JSON schema → Critical rules.

---

## 6. JSON Schema Validation (Zod)

`lib/validation/schemas.ts`:

```typescript
import { z } from 'zod';

export const FindingSchema = z.object({
  evidenceQuote: z.string().min(1),
  issue: z.string().min(1),
  suggestion: z.string().min(1),
  severity: z.enum(['minor', 'major']),
  rubricCriterion: z.enum(['TR', 'CC', 'LR', 'GRA']),
});

export const StageFeedbackSchema = z.object({
  rating: z.enum(['strong', 'okay', 'needs_improvement']),
  summary: z.string(),
  findings: z.array(FindingSchema),
  rewriteExample: z.string().optional(),
  meta: z.object({
    wordCount: z.number().int().nonnegative(),
    targetWordCount: z.object({
      min: z.number().int(),
      max: z.number().int(),
    }).optional(),
  }),
});

// Hook-specific extension
export const HookFeedbackSchema = StageFeedbackSchema.extend({
  hook_type_detected: z.enum([
    'statistic', 'claim', 'question', 'definition', 'scenario', 'generic', 'none'
  ]),
});
```

---

## 7. Quote Validator (anti-hallucination)

`lib/validation/quote-validator.ts`:

```typescript
import type { Finding } from '@/lib/llm/adapter';

export interface QuoteValidationResult {
  valid: boolean;
  invalidQuotes: string[];
}

/**
 * Returns valid=true only if every Finding's evidenceQuote
 * is a substring of the user's text.
 * Whitespace-normalized comparison (collapses multiple spaces).
 */
export function validateQuotes(
  userText: string,
  findings: Finding[]
): QuoteValidationResult {
  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const haystack = normalize(userText);
  const invalid: string[] = [];

  for (const f of findings) {
    const needle = normalize(f.evidenceQuote);
    if (needle.length === 0) continue;
    if (!haystack.includes(needle)) {
      invalid.push(f.evidenceQuote);
    }
  }

  return { valid: invalid.length === 0, invalidQuotes: invalid };
}
```

---

## 8. Retry Logic

`lib/validation/retry.ts`:

```typescript
import type { StageInput, StageFeedback } from '@/lib/llm/adapter';
import { validateQuotes } from './quote-validator';

const MAX_RETRIES = 3;

export async function getValidatedFeedback(
  call: (input: StageInput, extraInstruction?: string) => Promise<StageFeedback>,
  input: StageInput
): Promise<{ feedback: StageFeedback; retries: number; validated: boolean }> {

  let lastFeedback: StageFeedback | null = null;
  let extraInstruction = '';

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const feedback = await call(input, extraInstruction);
    const { valid, invalidQuotes } = validateQuotes(input.userText, feedback.findings);

    if (valid) {
      return { feedback, retries: attempt, validated: true };
    }

    lastFeedback = feedback;
    extraInstruction = `Previous response had quotes not found in the user's text: ${
      JSON.stringify(invalidQuotes)
    }. Every evidenceQuote MUST be a verbatim substring of the user's text. Re-check each quote.`;
  }

  // Fallback: strip findings with invalid quotes, return what we can
  const filteredFindings = lastFeedback!.findings.filter(f =>
    validateQuotes(input.userText, [f]).valid
  );

  return {
    feedback: { ...lastFeedback!, findings: filteredFindings },
    retries: MAX_RETRIES,
    validated: false,
  };
}
```

---

## 9. State Machine for Guided Mode

```typescript
type StageState = 'locked' | 'in_progress' | 'approved' | 'warned_pass';

interface SessionState {
  topic: string;
  stages: Record<StageId, {
    state: StageState;
    userText: string;
    feedback: StageFeedback | null;
    turns: number;        // count of feedback calls (cap at 8)
  }>;
  currentStageId: StageId;
}
```

**Transitions:**
- `locked → in_progress`: when prior stage is `approved` or `warned_pass`
- `in_progress → approved`: user clicks "Approve & Continue" AND feedback rating is `strong` or `okay` (but allow approve on `okay`)
- `in_progress → warned_pass`: user clicks "Continue Anyway" on `needs_improvement`. Show modal: *"This section needs improvement and may affect your final band score. Proceed anyway?"*
- `approved → in_progress`: user clicks an earlier stage to revise
- All other transitions: forbidden

**Cost guards:**
- Max 8 feedback calls per stage (turns counter)
- After 8: button disabled, message: "You've used all feedback turns for this stage. Approve, override, or revise without feedback."

---

## 10. UI Component Breakdown

### `components/guided/TopicHeader.tsx`
- Sticky top bar
- Shows the Task 2 prompt
- Edit button (only enabled before any stage is approved)

### `components/guided/StageEditor.tsx`
- Title: e.g., "Stage 2 of 9: Thesis Statement"
- Hint text: "Write a 1-sentence thesis that takes a clear position..."
- Textarea (auto-resize)
- Word counter (live)
- Buttons: `Get Feedback` | `Approve & Continue →` (only enabled after at least 1 feedback)
- "Continue Anyway" button only if last feedback was `needs_improvement`

### `components/guided/FeedbackPanel.tsx`
- Renders `StageFeedback` JSON
- Color-coded by rating (green/yellow/red)
- Each Finding rendered as:
  - Quoted evidence (in italics, highlighted)
  - Issue + suggestion
  - Rubric tag (TR/CC/LR/GRA)
- Rewrite example in expandable section
- "Verify before applying" disclaimer

### `components/guided/StageTracker.tsx` (right sidebar)
- List of all 9 stages
- Status icons:
  - ⚪ locked (gray)
  - ⏳ in progress (blue, pulsing)
  - ✓ approved (green)
  - ⚠ warned-pass (yellow)
- Click handler on approved/warned stages → revisit
- Bottom of sidebar: "Final Synthesis" button (only enabled when all required stages are approved or warned-pass)

---

## 11. API Routes

### `app/api/guided/feedback/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/llm/select';
import { getValidatedFeedback } from '@/lib/validation/retry';
import type { StageInput } from '@/lib/llm/adapter';

export async function POST(req: NextRequest) {
  const input: StageInput = await req.json();

  // TODO: rate limiting
  // TODO: auth check (post-Phase 3)
  // TODO: turn count check (cap at 8)

  const provider = getProvider();
  const result = await getValidatedFeedback(
    (i, extra) => provider.guidedFeedback(i),
    input
  );

  return NextResponse.json(result);
}
```

---

## 12. Sample Essay Sourcing (10 reference essays)

**Sources to use (all publicly available, official):**
1. Cambridge IELTS Practice Tests Books 14–18 (sample answers section)
2. ielts.org — official preparation materials
3. takeielts.britishcouncil.org — sample answers
4. ielts-simon.com — verified ex-examiner band-7+ examples
5. ielts.idp.com — sample band 6 vs band 8 comparisons

**Format each as `docs/samples/sample-NN.json`:**
```json
{
  "id": "sample-01",
  "source": "Cambridge IELTS 17 Test 1",
  "sourceUrl": "...",
  "prompt": "Some people think...",
  "essay": "Full essay text here...",
  "officialBand": { "TR": 7, "CC": 7, "LR": 7, "GRA": 7, "overall": 7.0 },
  "officialFeedback": "Examiner notes here..."
}
```

**Use these to:**
- Run pipeline against each → compare AI's band score with official → measure accuracy
- Show in UI as "see what a Band 7 essay looks like"
- Smoke tests for CI

---

## 13. CLAUDE.md (project instructions for Claude Code)

Save at project root. Tells Claude Code your conventions so it stops asking the same questions repeatedly.

```markdown
# CLAUDE.md — Project Instructions

## What this project is
IELTS Writing Coach web app. Read `docs/PRD.md` and `docs/MVP_BUILD_SPEC.md` before making decisions.

## Hard rules
1. **Never invent statistics, dates, or studies** in AI prompts or sample data. Use [VERIFY: ...] markers.
2. **Anti-hallucination is non-negotiable.** Every AI feedback finding must cite a quote that exists in the user's text. Use the quote validator.
3. **Model-agnostic** — never hardcode "Claude" or "OpenAI" in business logic. Use the `AnalysisProvider` interface.
4. **No B2B features**, no multi-tier pricing, no mobile apps. Stay scoped.
5. **Guided mode is the priority.** Don't over-invest in unguided until guided is solid.

## Tech conventions
- TypeScript strict mode
- Server Components by default; Client Components only when needed
- Zod for runtime validation at all API boundaries
- shadcn/ui for components — don't reinvent
- Tailwind classes; no CSS modules
- API routes return JSON; errors return `{ error: string }` with proper HTTP status

## Before adding a dependency
- Check if it's already installed
- Add to `package.json` not just install
- Pin to a specific version range

## Style
- No emojis in code or comments
- Comments only when WHY is non-obvious
- File names: kebab-case for files, PascalCase for components

## What to ask me about (don't decide alone)
- Adding paid services (LLM provider, hosted DB, etc.)
- Changing the JSON schemas (breaks UI)
- Adding new stages to guided mode
- Anything that affects pricing or unit economics
```

---

## 14. .claude/settings.json (permissions)

Reduce permission prompts during dev:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(npm install *)",
      "Bash(npx *)",
      "Bash(git status)",
      "Bash(git diff)",
      "Bash(git log *)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(node *)"
    ]
  }
}
```

---

## 15. Build Order (concrete checklist)

Hand this to Claude Code, ticking off as you go:

### Day 1: Setup
- [ ] Move project to `C:\Users\malla\projects\ielts-coach\`
- [ ] Run init commands (section 1.4)
- [ ] Create folder structure (section 2)
- [ ] Create `.env.example` (section 3)
- [ ] Create `CLAUDE.md` (section 13)
- [ ] Create `.claude/settings.json` (section 14)
- [ ] Sign up for Anthropic, get API key, add to `.env.local`
- [ ] Verify `npm run dev` starts a blank Next.js page

### Day 2: LLM adapter + Hook stage
- [ ] Implement `lib/llm/adapter.ts` interface (section 4)
- [ ] Implement `lib/llm/claude.ts` provider
- [ ] Write `prompts/_shared/ielts-rubric.md` (paste official descriptors)
- [ ] Write `prompts/guided/hook.md` (section 5)
- [ ] Implement Zod schemas for hook (section 6)
- [ ] Implement quote validator (section 7)
- [ ] Implement retry logic (section 8)
- [ ] Build minimal API route `/api/guided/feedback`
- [ ] Test from a script: send a sample hook, verify JSON response, verify quote validation

### Day 3: Hook UI
- [ ] Build `TopicHeader`, `StageEditor`, `FeedbackPanel`, `StageTracker` (section 10)
- [ ] Wire up Hook-only flow on `/guided` page
- [ ] Test end-to-end: enter topic, write hook, get feedback, approve/override

### Day 4–6: Remaining stages
- [ ] Write prompts for Thesis, Bridge, TS, BP, Conclusion, Synthesis
- [ ] Extend Zod schemas
- [ ] Wire up state machine (section 9)
- [ ] Add stage navigation

### Day 7: Sample essays
- [ ] Source 10 sample essays (section 12)
- [ ] Save as JSON
- [ ] Run pipeline against each → log bands → compare with official

### Day 8+: Persistence, OCR, deploy (per Phase 3+ in PRD)

---

## 16. What "Done" looks like for Phase 1

- Open `/guided` page, enter a topic, type a hook
- Click "Get Feedback" → see structured response in <10 seconds
- Feedback is specific (mentions actual words from your hook), not generic
- Quote validator catches if AI invents quotes (test by feeding it a 1-word hook and seeing if it refuses to fabricate)
- Can override "needs improvement" with warning modal
- Can revise by clicking back on Hook stage
- Stage tracker on right shows correct status
- Costs <$0.05 per feedback call

If all of the above works, Phase 1 is done. Move to Phase 2.

---

*This spec is buildable. Treat it as the source of truth; if something isn't here, ask before adding it.*
