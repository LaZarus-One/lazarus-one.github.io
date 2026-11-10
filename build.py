#!/usr/bin/env python3
"""
lazarus static site builder for GitHub Pages.
Generates:
  - learn/<id>.html and learn/<id>/index.html (pre-rendered for instant GitHub Pages load & SEO)
  - sitemap.xml
  - robots.txt
  - llms.txt
"""

import json
import os
import re
import html
from pathlib import Path

ROOT = Path(__file__).parent.resolve()
LESSONS_DIR = ROOT / "lessons"
LEARN_DIR = ROOT / "learn"

def main():
    print("[*] Building lazarus for GitHub Pages...")
    
    # Load chapters
    chapters_file = LESSONS_DIR / "chapters.json"
    if not chapters_file.exists():
        raise FileNotFoundError(f"Missing {chapters_file}")
    
    with open(chapters_file, "r", encoding="utf-8") as f:
        chapters = json.load(f)

    # Read base index.html
    with open(ROOT / "index.html", "r", encoding="utf-8") as f:
        shell = f.read()

    LEARN_DIR.mkdir(parents=True, exist_ok=True)

    all_topics = []
    for c in chapters:
        for t in c["topics"]:
            all_topics.append({**t, "chapter": c})

    urls = ["/"]

    for i, topic in enumerate(all_topics):
        topic_file = LESSONS_DIR / topic["file"]
        if not topic_file.exists():
            print(f"[!] Warning: missing lesson file {topic['file']}")
            continue

        with open(topic_file, "r", encoding="utf-8") as f:
            body = f.read()

        num = topic["id"].replace("-", ".")
        title = f"{num} {topic['title']} · Lazarus"
        desc = topic.get("summary", "")
        if not desc:
            # Fallback to first paragraph text
            p_match = re.search(r"<p>([\s\S]*?)</p>", body)
            desc = re.sub(r"<[^>]+>", "", p_match.group(1)) if p_match else ""
        desc = html.escape(desc[:160])

        prev_t = all_topics[i - 1] if i > 0 else None
        next_t = all_topics[i + 1] if i + 1 < len(all_topics) else None

        prev_link = f'''<a class="card lesson-nav prev" href="../learn/{prev_t["id"]}.html" data-link>
          <span class="meta">Previous Topic</span>
          <span class="title">{prev_t["id"].replace("-", ".")} {html.escape(prev_t["title"])}</span>
        </a>''' if prev_t else "<span></span>"

        next_link = f'''<a class="card lesson-nav next" href="../learn/{next_t["id"]}.html" data-link>
          <span class="meta">Next Topic</span>
          <span class="title">{next_t["id"].replace("-", ".")} {html.escape(next_t["title"])}</span>
        </a>''' if next_t else '''<a class="card lesson-nav next" href="../" data-link><span class="meta">Curriculum</span><span class="title">Review all topics</span></a>'''

        # Clean challenge slot
        clean_body = re.sub(r'<div class="challenge-slot"></div>', '', body)

        main_content = f'''<div class="page">
          <header class="page-header">
            <div class="chips">
              <a class="chip" href="../" data-link><span class="icon">arrow_back</span>Lazarus</a>
              <span class="chip">Chapter {topic["chapter"]["number"]}: {html.escape(topic["chapter"]["title"])}</span>
            </div>
            <h1><span class="topic-num">{num}</span> {html.escape(topic["title"])}</h1>
          </header>
          <article class="lesson">{clean_body}</article>
          <nav class="lesson-navs" aria-label="Topics">
            {prev_link}
            {next_link}
          </nav>
        </div>'''

        # Build prerendered page
        # Adjust asset paths from learn/ to root (../app.css, ../app.js)
        topic_url = f"https://lazarus-one.github.io/learn/{topic['id']}"
        page_html = shell
        page_html = re.sub(r'<title>.*?</title>', f'<title>{html.escape(title)}</title>', page_html)
        page_html = re.sub(r'<link rel="canonical" href="[^"]*"', f'<link rel="canonical" href="{topic_url}"', page_html)
        page_html = re.sub(r'<meta property="og:url" content="[^"]*"', f'<meta property="og:url" content="{topic_url}"', page_html)
        page_html = page_html.replace('href="app.css"', 'href="../app.css"')
        page_html = page_html.replace('src="app.js"', 'src="../app.js"')
        page_html = page_html.replace('<main id="app" class="wrap" tabindex="-1"></main>',
                                      f'<main id="app" class="wrap" tabindex="-1" data-prerendered>{main_content}</main>')

        # Write both learn/<id>.html and learn/<id>/index.html for maximum compatibility
        out_file = LEARN_DIR / f"{topic['id']}.html"
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(page_html)

        # Also write nested folder: learn/<id>/index.html
        nested_dir = LEARN_DIR / topic["id"]
        nested_dir.mkdir(parents=True, exist_ok=True)
        # In nested folder, assets are ../../app.css
        nested_page = page_html.replace('href="../app.css"', 'href="../../app.css"') \
                               .replace('src="../app.js"', 'src="../../app.js"') \
                               .replace('href="../', 'href="../../')
        with open(nested_dir / "index.html", "w", encoding="utf-8") as f:
            f.write(nested_page)

        urls.append(f"/learn/{topic['id']}")

    print(f"[+] Pre-rendered {len(all_topics)} topic pages in learn/")

    # Generate sitemap.xml
    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        sitemap.append(f'  <url><loc>https://lazarus-one.github.io{u}</loc></url>')
    sitemap.append('</urlset>\n')
    with open(ROOT / "sitemap.xml", "w", encoding="utf-8") as f:
        f.write("\n".join(sitemap))
    print("[+] Generated sitemap.xml")

    # Generate robots.txt
    robots = """User-agent: *
Allow: /
Sitemap: https://lazarus-one.github.io/sitemap.xml
"""
    with open(ROOT / "robots.txt", "w", encoding="utf-8") as f:
        f.write(robots)
    print("[+] Generated robots.txt")

    # Generate llms.txt
    llms = f"""# Lazarus: Machine Execution & Reverse Engineering
> Free, open-source educational platform for low-level machine execution, CPU internals, binary analysis, and cybersecurity exploitation.

## Chapters & Topics
"""
    for c in chapters:
        llms += f"\n### Chapter {c['number']}: {c['title']}\n"
        for t in c["topics"]:
            llms += f"- [{t['id']}] {t['title']}: {t.get('summary', '')}\n"

    with open(ROOT / "llms.txt", "w", encoding="utf-8") as f:
        f.write(llms)
    print("[+] Generated llms.txt")
    # Generate .nojekyll to prevent GitHub Pages from running Jekyll
    with open(ROOT / ".nojekyll", "w", encoding="utf-8") as f:
        f.write("")
    print("[+] Generated .nojekyll")
    print("[✓] Build completed successfully!")

if __name__ == "__main__":
    main()
