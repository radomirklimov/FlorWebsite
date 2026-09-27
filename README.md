# [Artist Name] — personal musician website

Static, dependency-free site: 5 pages, 1 CSS file, 1 JS file, JSON content.

## Run

No build step. Serve locally:

```bash
python3 -m http.server 8000
# open http://localhost:8000/
```

## Edit content (no code changes needed)

| What | File |
|---|---|
| Songs | `content/songs.json` |
| Lessons & prices | `content/lessons.json` |
| Name, email, socials | `content/site.json` |

Rules the JS enforces automatically:
- Socials / listening links with `null` URL are **hidden** (no empty buttons).
- Lessons with `"active": false` are hidden.
- Replace every `REPLACE_ME`, `[bracket placeholder]`, and `€XX` with real info before launch.
- Replace `https://example.com` in meta/canonical/sitemap with the real domain.

## Structure

```
index.html music.html lessons.html about.html contact.html
css/style.css  js/site.js
content/site.json content/songs.json content/lessons.json
tests/check.py  sitemap.xml  robots.txt  favicon.svg
```

## Deploy to Railway (via GitHub)

Deployment is pre-configured (`railway.json` + `nixpacks.toml` — serves the
static files with Python's built-in HTTP server on Railway's `$PORT`).
No dependencies, no build step.

```bash
git init
git add -A
git commit -m "Musician website"
gh repo create FlorWebsite --public --source=. --push
```

Then:

1. Open [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → pick the repo.
2. Railway auto-detects the config and deploys. No settings to change.
3. **Settings → Networking → Generate Domain** to get a public URL.
4. After that, replace `https://example.com` with your real domain in:
   `index.html`, `music.html`, `lessons.html`, `about.html`, `contact.html`
   (canonical + OG tags), `sitemap.xml`, and `robots.txt`.

## Tests

```bash
python3 tests/check.py
```

Checks homepage identity + CTAs + nav, music songs + links, lessons + prices + audience + CTA, contact info + socials + form validation hooks, SEO meta, a11y basics, JSON validity, and that no fake testimonials/awards exist.
