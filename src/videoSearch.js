// Pure, DOM-free helper: turn an exercise name into a YouTube video-search URL.
// The name shown on a card doubles as the search subject; a fixed
// " exercise how to" context is appended so ambiguously named movements
// (e.g. "Superman", "Bicycle", "Bridge") return demonstration videos rather
// than unrelated results.
// Contract: specs/003-exercise-video-links/contracts/search-url-contract.md

/**
 * Build a YouTube video-search URL for an exercise.
 * @param {string} name - The exercise name (verbatim, as shown on the card).
 * @returns {string} An absolute https URL to a YouTube search results page.
 */
export function videoSearchUrl(name) {
  // Using URL/URLSearchParams encodes the whole query — quotes, slashes,
  // parentheses, commas, "!", "&", "#", non-ASCII — into a valid absolute URL,
  // while the decoded search_query round-trips back to `${name} exercise how to`.
  const url = new URL("https://www.youtube.com/results");
  url.searchParams.set("search_query", `${name} exercise how to`);
  return url.toString();
}
