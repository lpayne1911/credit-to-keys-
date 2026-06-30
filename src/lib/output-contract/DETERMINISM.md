# Determinism — a program-wide guarantee

Every output the program produces must be **reproducible**: the same input
always yields the same result. A buyer who re-checks the same deal, or re-uploads
the same paperwork, must never see a different score, a different set of flags, or
a differently-worded report.

## The two rules

1. **Exactly one LLM call exists, and it only *reads*.** Document extraction
   (`src/lib/parse/extract.ts`) is the sole place a model is used, and it is
   pinned to **`temperature: 0`** so it reads the same figures off the same
   document every time. A guard test fails CI if that pin is ever dropped.

2. **All scoring, classification, and copy selection is pure deterministic
   code.** `scoreDeal`, `classifyFees`, `classifyAddOns`, `generateRiskFlags`,
   `buildNegotiationScript`, `buildTargetDealSheet`, and `buildPostSaleTriage`
   take data in and return data out with no hidden inputs — no model calls, no
   randomness, no ambient clock.

The classification of a vehicle service contract, a junk fee, or an add-on is a
**catalog/engine decision, never a model decision.** This is why the upload path
is reliable: the model is asked only to transcribe what's on the page; the
program decides what each line *means*.

## Injectable clock

The one unavoidable ambient input is the current time (for `createdAt` and for
vehicle-age math). Every builder accepts an injectable clock so time is a
parameter, not a side effect:

```ts
scoreDeal(input, { now })                 // ISO string
buildDealReview(deal, { now, marketValue })
buildTargetDealSheet(input, deps, { now })
buildPostSaleTriage(input, { now })
```

When `now` is omitted, the builder reads the wall clock; tests always inject it,
so results are byte-identical run to run.

## Enforcement

`src/lib/output-contract/determinism.test.ts`:
- builds every engine twice with an identical input + clock and asserts the
  outputs are deep-equal (any uninjected clock or randomness would diverge);
- exercises the year-dependent warranty path explicitly;
- statically asserts the extractor still sets `temperature: 0`.

## When adding a new output

- Route any new "what does this mean?" decision through deterministic engine
  code or a catalog — never ask the model to classify or score.
- If the new code needs the time, thread it through a `{ now }` option; do not
  call `new Date()` / `Date.now()` / `Math.random()` inside an engine.
- Add the new result to the determinism test's `buildAll` so it's covered.
