# Contract: `videoSearchUrl(name)` — pure search-URL builder

**Module**: `src/videoSearch.js` | **Feature**: `003-exercise-video-links`

The single public function this feature adds. Pure, synchronous, no DOM, no I/O, no storage — so it is unit-testable with `node --test`.

## Signature

```js
/**
 * Build a YouTube video-search URL for an exercise.
 * @param {string} name - The exercise name (verbatim, as shown on the card).
 * @returns {string} An absolute https URL to a YouTube search results page.
 */
export function videoSearchUrl(name)
```

## Behavior

- Returns `https://www.youtube.com/results?search_query=<encoded>` where `<encoded>` is the URL-encoding of the query string `` `${name} exercise how to` ``.
- The **decoded** `search_query` value MUST equal exactly `` `${name} exercise how to` `` (name preserved verbatim, single space separators, fixed suffix).
- The whole query MUST be URL-encoded such that the return value is a valid absolute URL for any input string (quotes, `/`, `&`, `#`, parentheses, commas, `!`, non-ASCII, etc.).
- Deterministic: same input ⇒ same output. No randomness, no time, no locale dependence.

## Input assumptions

- Callers pass a non-null, non-empty exercise name (the DOM layer never calls this for the empty state — see [ui-contract.md](./ui-contract.md), R5). Behavior for `null`/`""` is unspecified/not-required; the function need not guard against it.

## Encoding note

Either `encodeURIComponent` (spaces → `%20`) or `URLSearchParams`/`URL` (spaces → `+`) is acceptable. The contract constrains the *decoded* query, not the exact escape of spaces, since YouTube accepts both.

## Examples (illustrative — assert on decoded query, not exact space escaping)

| `name` | Decoded `search_query` | Notes |
|--------|------------------------|-------|
| `Hammer curl` | `Hammer curl exercise how to` | Ordinary name |
| `Superman` | `Superman exercise how to` | Ambiguous word disambiguated by context |
| `Bicycle` | `Bicycle exercise how to` | Ambiguous word |
| `12" sit to stand` | `12" sit to stand exercise how to` | `"` must be encoded (`%22`) in the URL |
| `1/2 kneeling chop/rotation` | `1/2 kneeling chop/rotation exercise how to` | `/` must be encoded (`%2F`) |
| `Squat jump - legs, not cardio!` | `Squat jump - legs, not cardio! exercise how to` | `,` and `!` encoded |
| `Bobber Goblet Squat (side to side under imaginary bar)` | `Bobber Goblet Squat (side to side under imaginary bar) exercise how to` | Parentheses encoded |

## Test obligations (`tests/videoSearch.test.js`, `node --test`)

1. **Prefix**: return value starts with `https://www.youtube.com/results?search_query=`.
2. **Context suffix**: decoding the `search_query` param yields a string ending with ` exercise how to` and starting with the input name.
3. **Encoding of special characters**: for a name containing `"` and `/`, the raw return string contains no literal `"` or `/` inside the query portion (i.e. they are percent-encoded), and round-trip decode reproduces the original name + suffix.
4. **Validity**: `new URL(videoSearchUrl(name))` does not throw for each representative name above.
5. **Determinism**: two calls with the same name return identical strings.
