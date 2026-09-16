# HymnNaija

A mobile-first Nigerian church hymn web app. Plain HTML, CSS and vanilla
JavaScript — no build step, no framework, no backend, no database.
Hymn data is static JSON. Personal data (favorites, recently viewed,
theme, text size) lives only in the browser's `localStorage`. It's a PWA:
installable, and readable offline once opened.

## Running it locally

Browsers block `fetch()` on `file://` pages and service workers require a
real origin, so you need a tiny local server — no install/build required:

```bash
cd hymnnaija
python3 -m http.server 8080
# then open http://localhost:8080 in your browser
```

Or, if you have Node installed:

```bash
npx serve .
```

Either way, just point a local static server at the project folder and
open `index.html` through it (not by double-clicking the file).

## Project structure

```
hymnnaija/
├── index.html            Home
├── browse.html           All denominations
├── denomination.html     One denomination's hymn list (?id=cac)
├── reader.html            The hymn reader (?den=cac&num=3)
├── search.html            Global search across every denomination
├── favorites.html         Saved hymns, grouped by denomination
├── settings.html          Theme, text size, install, data reset
├── about.html / privacy.html / terms.html
├── offline.html           Shown by the service worker when nothing is cached
├── manifest.json          PWA manifest
├── service-worker.js      Offline caching (see below)
├── favicon.ico
├── css/                   tokens → base → components → layout → reader → responsive
├── js/                    one small module per concern (see below)
├── data/                  denominations.json + one JSON file per denomination
└── assets/                icons (all PWA sizes) + the source SVG logo
```

### JS modules (loaded in this order on every page)

`utils.js` (storage/helpers) → `icons.js` (inline SVGs) → `theme.js`
(light/dark + font scale) → `data.js` (fetches/caches JSON) →
`favorites.js` → `recents.js` → `hymns.js` (shared render helpers) →
`app.js` (nav state, service worker registration, connectivity) → then
one page-specific file (`home.js`, `browse.js`, `denomination.js`,
`reader.js`, `search-page.js`, `favorites-page.js`, or `settings.js`).

There's no bundler, so every file is loaded as a separate `<script>` tag
in plain `<script>` order — that's why the order above matters if you add
a new module.

## The current hymn data is placeholder content

Every hymn in `/data/*.json` right now is clearly-marked **sample text**,
written from scratch for development — not real hymnal content. Each
hymn object has `"copyrightStatus": "placeholder-sample"` and
`"isSample": true` for exactly this reason: so nothing here is mistaken
for a real denomination's hymnal, and so it's easy to find and replace
later.

### How to add a real, licensed/public-domain hymn collection later

When you're ready to swap in real content, send me the hymn book/document
and I'll convert it into this same JSON shape — you don't need to touch
any code. For reference, this is the shape each denomination file uses
(`data/cac.json` etc.):

```json
{
  "denomination": "cac",
  "denominationName": "Christ Apostolic Church",
  "bookTitle": "CAC Hymnal",
  "hymnCount": 1,
  "hymns": [
    {
      "number": 1,
      "title": "Hymn title",
      "author": "Author name",
      "composer": "Composer name",
      "verses": ["Verse 1 text...", "Verse 2 text..."],
      "source": "Name of the source book/edition",
      "copyrightStatus": "public-domain",
      "isSample": false
    }
  ]
}
```

`copyrightStatus` is just a label the app itself uses to show/hide the
"this is placeholder text" note in the reader (see `js/reader.js`) — set
it to `"public-domain"` or `"licensed"` once real, verified content
replaces the sample text, and the placeholder note disappears
automatically.

To add a brand **new** denomination (not just replace an existing one):
1. Add a new JSON file to `/data/` following the shape above.
2. Add one entry to `/data/denominations.json`'s `"denominations"` array:
   `{ "id", "name", "fullName", "bookTitle", "file", "accent", "hymnCount" }`.
   That's the only place denominations are registered — the home page,
   browse grid, search filters and service worker precache list all read
   from it, except the service worker's `DATA_URLS` array, which also
   needs the new file path added so it's cached for offline use on first
   install.

No other code changes are needed to add hymns or denominations.

## Offline support

`service-worker.js` precaches the entire app shell (HTML/CSS/JS/icons)
and all current hymn JSON on first visit, so the app opens and every
hymn currently in `/data/` reads instantly with no connection — this
matters for slow or expensive mobile data. Hymn data is refreshed in the
background whenever the device is online (stale-while-revalidate), so
edits you make to the JSON show up next time the app is opened, without
ever blocking the first paint.

If you add a new file to the app shell (a new HTML page, a new CSS/JS
file), add its path to `SHELL_URLS` in `service-worker.js` and bump
`CACHE_VERSION` at the top of the file — that second step is what makes
existing installs pick up the change instead of serving a stale cache.

## Deployment (static hosting — Hostinger, Netlify, GitHub Pages, etc.)

There is nothing to build. Upload the contents of the `hymnnaija/` folder
as-is to your static host's public/`public_html` root, preserving the
folder structure (`css/`, `js/`, `data/`, `assets/` alongside the HTML
files).

**Hostinger / shared hosting (matches your current setup):**
1. Upload the whole `hymnnaija` folder's *contents* into `public_html`
   (or a subfolder, e.g. `public_html/hymnnaija`, if you want it at
   `yourdomain.com/hymnnaija`).
2. Make sure the site is served over **HTTPS** — service workers and the
   PWA install prompt both require it (this is standard on Hostinger).
3. No server configuration, PHP, or database is needed for this app.

**Netlify / Vercel / GitHub Pages:** same idea — point the deploy at this
folder as a static site with no build command.

### After deploying
- Open the live URL on a phone and confirm the browser offers an
  "Add to Home Screen" / install prompt (Settings → App → Install also
  triggers it manually once the browser has decided the site qualifies).
- Turn on airplane mode after opening a few hymns once, and confirm they
  still open — that's the offline path working.

## Browser support notes
- Built and tested against current mobile Safari (iOS) and Chrome
  (Android) rendering behavior. No bundler/transpiler is used, so the
  JavaScript is plain ES2017-ish syntax (`async`/`await`, arrow
  functions, template literals, classes) — safe on any phone browser
  from the last several years.
- Wake Lock (keep-screen-on while reading) and the native Share sheet
  both degrade gracefully where unsupported: the settings row hides
  itself, and Share falls back to Copy.
