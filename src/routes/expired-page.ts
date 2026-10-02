// The page a visitor sees for an expired link. It is plain on purpose: there
// is nothing to do here except go back.
export const EXPIRED_PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Link expired - hop</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <main class="wrap">
    <header class="hero">
      <h1><span class="mark">hop</span></h1>
      <p class="tagline">This link has expired.</p>
    </header>
    <p class="message">The short link you followed is no longer available. Ask whoever shared it for a new one.</p>
  </main>
</body>
</html>
`;
