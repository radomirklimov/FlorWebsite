"""Practical journey tests for the musician website. Run: python3 tests/check.py"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
fails = []
def check(name, cond, hint=""):
    print(("PASS " if cond else "FAIL ") + name + (f" — {hint}" if hint and not cond else ""))
    if not cond: fails.append(name)

def read(p): return (ROOT / p).read_text(encoding="utf-8")

pages = {p: read(p) for p in ["index.html", "music.html", "lessons.html", "about.html", "contact.html"]}

# Files exist
for f in ["css/style.css", "js/site.js", "content/songs.json", "content/lessons.json",
          "content/site.json", "sitemap.xml", "robots.txt", "favicon.svg"]:
    check(f"file exists: {f}", (ROOT / f).exists())

# Homepage journey
h = pages["index.html"]
check("home: artist identity visible", "[Artist Name]" in h and "<h1>" in h)
check("home: music CTA", 'href="music.html"' in h and "Listen" in h)
check("home: lessons CTA", 'href="lessons.html"' in h)
check("home: nav has Music/Lessons/About/Contact", all(x in h for x in ["music.html", "lessons.html", "about.html", "contact.html"]))

# Music journey
m = pages["music.html"]
songs = json.loads((ROOT / "content/songs.json").read_text())
check("music: songs data valid", len(songs) >= 1 and all("title" in s and "externalLinks" in s for s in songs))
check("music: songs visible", "data-songs" in m and "[Song Title" in m)
check("music: external links present", "spotify.com" in m.lower() or "youtube.com" in m.lower())
check("music: no empty buttons (null filtered in JS)", "externalLinks" in (ROOT / "js/site.js").read_text() and "if (url)" in (ROOT / "js/site.js").read_text())

# Lessons journey
les = pages["lessons.html"]
lessons = json.loads((ROOT / "content/lessons.json").read_text())
check("lessons: offers valid", len(lessons) >= 1 and all("price" in l and "duration" in l for l in lessons))
check("lessons: offers visible", "data-lessons" in les)
check("lessons: prices visible (no hidden pricing)", "€XX" in les or "€" in les)
check("lessons: audience understandable", "targetAudience" in (ROOT / "content/lessons.json").read_text() or "Who they're for" in les)
check("lessons: contact CTA", "contact.html?topic=lesson" in les)

# Contact journey
c = pages["contact.html"]
check("contact: email visible + mailto", "mailto:" in c and "hello@example.com" in c)
check("contact: socials work (target _blank)", 'target="_blank"' in c and "Instagram" in c)
check("contact: form validates", "data-contact-form" in c and "novalidate" in c and "data-error-for" in c)
check("contact: topic preselect from lessons CTA", 'URLSearchParams' in (ROOT / "js/site.js").read_text())

# Conversion flow links
check("flow: home→music→lessons→contact chain", all(x in h for x in ["music.html", "lessons.html", "contact.html"]))
check("flow: direct landing on lessons→contact", "contact.html" in les)

# Responsive
css = read("css/style.css")
check("responsive: mobile breakpoint", "@media" in css and "640px" in css)
check("responsive: hamburger nav", "data-menu-btn" in h and "menu-btn" in css)

# SEO
for p, html in pages.items():
    check(f"seo: {p} has title+description+canonical", "<title>" in html and 'name="description"' in html and "canonical" in html)
check("seo: og tags", 'property="og:' in h)
check("seo: sitemap lists all pages", all(x in read("sitemap.xml") for x in ["music.html", "lessons.html", "about.html", "contact.html"]))

# A11y
check("a11y: skip link + labels + focus", "Skip to content" in h and "<label" in c and ":focus-visible" in css)
check("a11y: alt/aria on artwork placeholders", 'aria-label="Artwork placeholder' in m)

# No fake content
all_html = " ".join(pages.values())
check("honesty: no fake testimonials", "testimonial" not in all_html.lower())
check("honesty: no invented awards", "award-winning" not in all_html.lower() and "award winning" not in all_html.lower())
check("honesty: placeholders explicit", "placeholder" in all_html.lower() or "[" in h)
check("honesty: prices are placeholders", "€XX" in json.dumps(lessons, ensure_ascii=False))

print(f"\n{len(fails)} failures." if fails else "\nAll checks passed.")
sys.exit(1 if fails else 0)
