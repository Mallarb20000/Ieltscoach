/**
 * Smoke test: sends a sample hook to the guided feedback API and prints the result.
 * Run with: npx tsx scripts/test-hook.ts
 * Requires the configured provider's API key in .env and dev server running on localhost:3000.
 */

async function main() {
  const payload = {
    stage: 'hook',
    prompt:
      'Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?',
    userText:
      'In today\'s modern world, many students do not care about their community.',
    priorContext: {},
  };

  const res = await fetch('http://localhost:3000/api/guided/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}

main().catch(console.error);
