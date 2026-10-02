import type { LinkStatus } from "../actions/link-status.ts";

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

// The destination is user input, so every value is escaped before it is
// placed in the page.
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

function expiryText(link: LinkStatus): string {
  if (!link.expiresAt) return "Never";
  return link.expired ? `${link.expiresAt} (expired)` : link.expiresAt;
}

export function previewPage(link: LinkStatus): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Preview ${escapeHtml(link.code)} - hop</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <main class="wrap">
    <header class="hero">
      <h1><span class="mark">hop</span></h1>
      <p class="tagline">Preview of ${escapeHtml(link.code)}</p>
    </header>
    <dl>
      <dt>Destination</dt><dd id="destination">${escapeHtml(link.url)}</dd>
      <dt>Created</dt><dd id="created">${escapeHtml(link.createdAt)}</dd>
      <dt>Clicks</dt><dd id="clicks">${link.clicks}</dd>
      <dt>Expires</dt><dd id="expires">${escapeHtml(expiryText(link))}</dd>
    </dl>
  </main>
</body>
</html>
`;
}
