# IELTS Writing Coach

**An AI writing tutor for IELTS Task 2 that teaches you to build an essay, not just grades the one you wrote.**

Live: [ieltscoach-pi.vercel.app](https://ieltscoach-pi.vercel.app)

---

## Why this exists

Every year, thousands of students in Nepal sit the IELTS exam to study or work abroad. Writing is the section where many get stuck. Band 6.5 or 7 is often the difference between an offer and a rejection, and Writing Task 2 is the hardest part to improve on your own.

The usual options are not great:

- **Coaching centres** are expensive, and one instructor marking thirty essays cannot give each student line-by-line feedback.
- **ChatGPT and other free AI tools** will grade an essay, but they tend to give vague advice ("improve your vocabulary", "strengthen your hook"). Sometimes they praise or criticise sentences the student never wrote.
- **Grading alone does not teach structure.** A student who gets "Band 5.5" back on a finished essay still does not know how to write a better introduction next time.

I built this for the student who has booked the exam in the next few months, is aiming for band 6.5 to 7.5, practises seriously, and does not have a tutor sitting next to them.

## What it does

### Guided mode (the core of the product)

The student writes the essay one piece at a time, and a tutor checks each part before they move on:

1. Hook
2. Bridge
3. Thesis statement
4. Topic sentence and body paragraph 1
5. Topic sentence and body paragraph 2
6. Optional third body paragraph
7. Conclusion
8. Final synthesis: the student expands the approved outline into a full essay and gets band estimates for the four IELTS criteria (Task Response, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy)

Each stage's feedback knows what the student has already written. For example, a topic sentence is checked against the thesis it is supposed to support. Students can revise, go back to earlier stages, or continue past a warning if they disagree.

### Unguided mode

The student pastes a full essay (at least 250 words, the IELTS minimum) and gets a complete analysis with band estimates and prioritised fixes.

### Reports

Feedback can be exported as a PDF. Signed-in users also get saved reports and a dashboard that tracks their band scores over time.

## The hard problem: feedback you can trust

The main design goal was that the coach never makes things up about the student's writing.

Every piece of feedback the model returns must include an `evidenceQuote`: the exact words from the student's text that the comment is about. The model's answer is not just trusted. The server checks every quote against what the student actually wrote:

- The quote must appear in the student's text word for word. The check ignores differences in capitalisation and spacing, and nothing else.
- If any quote cannot be found, the response is rejected and the model is asked again, with a note about what went wrong.
- Model responses are also checked against a strict schema (Zod), so a malformed answer never reaches the UI.

The result is that every comment points at a real sentence, and a student can see exactly which words it is about. The code is in [`lib/validation/quote-validator.ts`](lib/validation/quote-validator.ts) and [`lib/validation/retry.ts`](lib/validation/retry.ts).

The prompts are also written to rule out generic advice. "Make your hook stronger" counts as a failure. The expected level of detail is "Replace the generic opener with a specific claim about university fees in Nepal".

## How accurate are the band scores?

I benchmarked the synthesis pipeline against 10 sample essays graded by IELTS instructors, covering bands 4.5 to 8.0 ([`docs/samples/`](docs/samples/)). Across three runs, the mean absolute error on the overall band was 0.44 to 0.67.

The known weakness is that it tends to score strong essays (band 7.5 to 8) about one band too low. It is most accurate in the 5.0 to 6.5 range, which is where most of the target students are. Improving the high end is on the roadmap.

To reproduce:

```bash
npx tsx --env-file=.env scripts/validate-bands.ts
```

## Tech stack

| Layer | Choice |
|---|---|
| Frontend and backend | Next.js (App Router), TypeScript, React |
| UI | Tailwind CSS, shadcn/ui |
| AI | Gemini by default, behind a provider-agnostic interface that also supports Claude and OpenAI |
| Validation | Zod schemas, plus the custom quote validator with retry |
| Auth and database | Supabase (Postgres with row-level security) |
| Hosting | Vercel |

The backend is Next.js API routes (`app/api/`) running as serverless functions, so there is no separate server. The browser never talks to the AI provider directly, which keeps API keys server-side. Both AI routes are rate-limited per IP and cap input size.

### Switching AI providers

All model calls go through one interface, [`lib/llm/adapter.ts`](lib/llm/adapter.ts). Changing provider is one environment variable:

```bash
DEFAULT_LLM_PROVIDER=gemini   # or claude, openai
```

## Running locally

Requirements: Node.js 20+, and an API key for at least one provider.

```bash
git clone https://github.com/Mallarb20000/Ieltscoach.git
cd Ieltscoach
npm install
cp .env.example .env    # then fill in your provider key and DEFAULT_LLM_PROVIDER
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Accounts and saved reports are optional. Without the Supabase variables, the app runs both writing modes and hides sign-in. To enable accounts locally, install Docker and run `npx supabase start`. Then copy the URL and anon key from `npx supabase status` into `.env`. The schema is in [`supabase/migrations/`](supabase/migrations/).

## Project structure

```
app/            Pages and API routes (guided, unguided, dashboard, reports)
components/     UI components
lib/llm/        Provider-agnostic AI layer (Gemini, Claude, OpenAI adapters)
lib/validation/ Zod schemas, quote validator, retry logic
prompts/        The IELTS rubric and the system prompt for each stage
docs/samples/   Graded essays used for the accuracy benchmark
scripts/        Band-accuracy benchmark and test scripts
supabase/       Database migration
```

## Roadmap

- Photo upload of handwritten essays with OCR, since most students practise on paper
- Better band calibration at the top end (7.5+)
- Payments in NPR through Khalti or eSewa

## Author

Built by Rohit Malla as a side project.
