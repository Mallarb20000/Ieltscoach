# CLAUDE.md — IELTS Writing Coach Project Instructions

> **You are working on a side-project IELTS Writing coach web app for Nepali students. Read this file at the start of every session. Read `docs/PRD.md` and `docs/MVP_BUILD_SPEC.md` before making non-trivial decisions.**

---

## Project at a glance

- **What:** Web app that gives IELTS Writing Task 2 feedback. Two modes: Guided (step-by-step, the differentiator) and Unguided (full essay analysis).
- **Why:** Free LLMs grade essays adequately, so we compete on guided mode UX, handwritten OCR workflow, and Nepal localization — not on "AI grading."
- **Stack:** Next.js 14+ (App Router), TypeScript, Tailwind, shadcn/ui, Supabase, configurable LLM provider (Claude/Gemini/OpenAI via `DEFAULT_LLM_PROVIDER`), Google Cloud Vision OCR.
- **Stage:** Pre-MVP. Building Guided Mode first.

---

## Hard rules (non-negotiable)

1. **Anti-hallucination is the #1 product requirement.**
   Every AI feedback finding must include an `evidenceQuote` that is a verbatim substring of the user's text. Use the `validateQuotes` function in `lib/validation/quote-validator.ts`. If it fails, retry — do not silently ship invalid output.

2. **Never invent statistics, dates, or studies** in prompts, sample data, or feedback. Use `[VERIFY: insert real statistic about X]` markers instead.

3. **Model-agnostic always.** Never hardcode any provider name in business logic. Always go through `AnalysisProvider` interface (`lib/llm/adapter.ts`). Supported: `claude`, `gemini`, `openai` — set via `DEFAULT_LLM_PROVIDER`.

4. **Feedback must be specific and actionable.**
   - Bad: "Make your hook stronger"
   - Good: "Replace the generic opener with a counterintuitive claim like 'Although Nepal has...'"
   If you write generic feedback in a prompt, you have failed.

5. **Stay scoped.** No B2B features, no multi-tier pricing logic, no mobile apps, no speaking module, no Task 1 essays. If unsure, ask.

6. **No emojis** in code, comments, file names, UI text, or commit messages. (Exception: only if the user explicitly asks.)

---

## What to ALWAYS ask before doing

- Adding any paid service or new dependency that isn't in `package.json`
- Changing JSON schemas in `lib/validation/schemas.ts` (breaks UI + validators)
- Adding a new stage to guided mode
- Anything affecting pricing, Khalti integration, or unit economics
- Refactoring more than ~3 files for any single task
- Writing tests when none were requested
- Creating a new top-level folder

When in doubt: **ask, don't act**. The cost of asking is one message; the cost of unwinding bad decisions is hours.

---

## What to NEVER do

- Add features beyond the current task ("while I was here, I also...")
- Refactor working code that wasn't part of the task
- Run `git push`, `git reset --hard`, or any destructive git command
- Commit secrets — `.env.local` must stay in `.gitignore`
- Skip pre-commit hooks (`--no-verify`) unless explicitly told
- Create README.md or docs/*.md files unless requested
- Write multi-paragraph code comments
- Use `any` in TypeScript (use `unknown` and narrow)
- Disable strict mode or eslint rules to "get it working"
- Add backward-compat shims for code we never shipped
- Suggest "let me also add monitoring/tests/error handling" unprompted

---

## Tech conventions

### TypeScript
- Strict mode ON (already in tsconfig.json)
- Zod for runtime validation at all API boundaries (request body in, response body out)
- No `any`. Use `unknown` and narrow with type guards or Zod
- Server Components by default; `'use client'` only when needed (forms, state)

### File & code style
- File naming: `kebab-case.ts` for files, `PascalCase.tsx` for React components
- One component per file, named export matches filename
- Tailwind classes only; no CSS modules, no inline `style={}`
- shadcn/ui components — install via `npx shadcn@latest add <component>`, don't reinvent

### API routes
- Return JSON: `{ data: ... }` on success, `{ error: string }` on failure
- Set proper HTTP status codes (400 for validation, 401 for auth, 500 for server)
- Validate request bodies with Zod before doing anything
- Never leak provider errors directly to client (log them, return generic message)

### Comments
- Default: write none
- Add only when WHY is non-obvious (e.g., "we collapse whitespace because Anthropic sometimes returns smart quotes that don't match user's straight quotes")
- Never describe WHAT the code does — well-named identifiers do that
- Never reference past tasks ("added for guided mode v2")

---

## How to handle ambiguity

If the spec doesn't say, in this priority order:
1. **Ask the user.**
2. If you must guess, prefer **the simpler option** (less code, fewer abstractions, fewer files).
3. If you guess, **flag it**: "Assumed X — change if wrong."

Never silently invent a design decision.

---

## Common pitfalls to avoid (these will happen if you're not careful)

### "It runs, ship it"
Just because TypeScript compiles and dev server starts does NOT mean the AI pipeline works. Test with a real prompt + sample essay end-to-end before declaring anything done.

### Drifting from the spec
The build spec has a Day 1 → Day 8 checklist. Follow it in order. Do not skip ahead "because Day 5 is more interesting."

### Library API hallucination
Next.js, Supabase, and shadcn change frequently. If you're using a feature you're not 100% certain about, **fetch the latest docs** (Context7 MCP if available, otherwise WebFetch). Do not write code from memory and hope.

### Re-exploring the codebase every session
Use Serena MCP if available — symbol-level navigation. Otherwise, before exploring, check if the answer is in this CLAUDE.md, the PRD, or the build spec. They were written so you don't have to grep around.

### Adding "just one more abstraction"
If three things look similar, leave them as three things. Only abstract when there are 4+ instances AND a clear shared shape.

### Over-engineering error handling
Trust internal code. Validate at boundaries (API routes, OCR responses, LLM responses). Don't wrap every function in try/catch.

---

## Project-specific gotchas

- **IELTS rubric prompt is cached.** It's loaded as system context with `cache_control: { type: 'ephemeral' }`. Don't change it without thinking about cache invalidation cost.
- **Quote validation is case- and whitespace-insensitive** but otherwise strict. Don't loosen further — that lets hallucinations through.
- **Guided mode stages are NOT independent.** Each stage's prompt receives `priorContext` (approved sections so far). Maintain this when editing.
- **Word count limits are HARD blocks** for unguided mode submissions (<250 words). They are SOFT warnings for guided stages.
- **Nepal users may have flaky internet.** Server actions and API calls should handle timeout gracefully. Show retry UI, not crashes.
- **Currency is NPR** in all UI. Never show USD to end users. Internal logging can use USD for cost tracking.

---

## When the user is exploring vs. building

If the user says "what do you think about X?" or "how should we approach Y?" — **discuss, don't build.** Reply in 2–3 sentences with a recommendation. Wait for "okay let's do it" before writing code.

If the user says "build X" or "implement Y" — **build it.** No need to re-confirm scope.

---

## Definition of "done" for any task

A task is done when:
1. Code compiles with no TS errors
2. The specific behavior the user asked for works (manually tested, not just "looks right")
3. No new files exist that the task didn't require
4. Existing tests still pass (if tests exist)

A task is NOT done just because:
- "The dev server starts"
- "I think it should work"
- TypeScript compiles (compiles ≠ works)

If you can't manually test it (e.g., needs Khalti integration credentials), **say so explicitly** in the report. Don't claim success.

---

## Reporting back to the user

After completing a task, report in this format:

```
Done:
- <specific thing 1>
- <specific thing 2>

Not done / blocked:
- <thing> because <reason>

Open question:
- <thing user should decide>
```

Keep it under 8 lines. The user can read the diff for details.

---

## Reference files (read these when relevant)

- `docs/PRD.md` — product strategy, target users, pricing, success metrics
- `docs/MVP_BUILD_SPEC.md` — technical spec, folder structure, schemas, build checklist
- `docs/samples/` — 10 reference IELTS essays with official band scores
- `prompts/_shared/ielts-rubric.md` — official band descriptors (cached system context)
- `prompts/guided/*.md` — per-stage system prompts (the heart of the product)
- `lib/llm/adapter.ts` — `AnalysisProvider` interface (model-agnostic boundary)
- `lib/validation/` — Zod schemas + quote validator + retry logic

---

## End-of-session checklist

Before ending a session, ensure:
- [ ] No uncommitted changes left in a broken state
- [ ] If you added a dependency, it's in `package.json`
- [ ] If you changed env vars, update `.env.example`
- [ ] If you made a non-obvious decision, note it in your report so the next session knows

---

*This file is the contract for working on this project. If something here is wrong, tell the user and update the file — don't ignore it.*
