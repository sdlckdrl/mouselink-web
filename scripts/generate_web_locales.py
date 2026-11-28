"""Generate the five added OneMouse web locales and extend existing route alternates.

Run from anywhere: python scripts/generate_web_locales.py
Translate the text source in content/web-locales.json, not the generated HTML.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HOST = "https://onemouse.pages.dev"
LOCALES = {
    "ko": ("", "한국어"), "en": ("en", "English"), "ja": ("ja", "日本語"),
    "zh": ("zh", "简体中文"), "es": ("es", "Español"),
    "pt-BR": ("pt-br", "Português (Brasil)"), "de": ("de", "Deutsch"),
    "zh-TW": ("zh-tw", "繁體中文"), "fr": ("fr", "Français"), "id": ("id", "Bahasa Indonesia"),
}
NEW = ("pt-BR", "de", "zh-TW", "fr", "id")
ROUTES = ("index", "features", "guide", "help", "download", "compatibility")
COPY = json.loads((ROOT / "content/web-locales.json").read_text(encoding="utf-8"))
ICON = "/assets/preview/onemouse-android-icon.png"
SHARED_CSS = "/assets/preview/one-preview.css?v=light1"
CSS = "/css/web-locales.css?v=1"
PICKER_CSS = "/css/official-language-picker.css?v=1"
PICKER_JS = "/js/official-language-picker.js?v=1"

def esc(s):
    return html.escape(s, quote=True)

def path(lang, page):
    slug = LOCALES[lang][0]
    prefix = "/" + slug if slug else ""
    return prefix + "/" + ("" if page == "index" else page)

def file(lang, page):
    return ROOT / LOCALES[lang][0] / (page + ".html")

def a(url, label, attrs=""):
    return f'<a href="{esc(url)}"{attrs}>{esc(label)}</a>'

def alternates(page, langs):
    return "\n".join(
        f'<link rel="alternate" hreflang="{lang}" href="{HOST}{path(lang if lang != "x-default" else "ko", page)}">'
        for lang in langs
    )

def option(lang, page, current, ids):
    chosen = " selected" if lang == current else ""
    return (f'<option value="{lang}" lang="{lang}" data-language-route="{path(lang, page)}"'
            f' data-fragments="{esc(" ".join(ids))}"{chosen}>{esc(LOCALES[lang][1])}</option>')

def fall(lang, page, current):
    label = esc(LOCALES[lang][1])
    return (f'<span lang="{lang}" aria-current="true">{label}</span>' if lang == current else
            a(path(lang, page), LOCALES[lang][1], f' lang="{lang}" hreflang="{lang}"'))

def ids_of(s):
    return sorted(set(re.findall(r'\bid="([a-zA-Z0-9_-]+)"', s)) - {"one-language-picker"})

EN_DOWNLOAD = file("en", "download").read_text(encoding="utf-8")
WIN = re.search(r'href="([^"]+)" data-latest-windows-download', EN_DOWNLOAD)[1]
MAC = re.search(r'href="([^"]+)" data-latest-macos-download', EN_DOWNLOAD)[1]
DOWNLOAD_JS = re.search(r'src="(/js/downloads\.js[^"]*)"', EN_DOWNLOAD)[1]
STORE = re.search(r'href="(https://apps\.microsoft\.com/[^"]+)"', EN_DOWNLOAD)[1]
PLAY = re.search(r'href="(https://play\.google\.com/[^"]+)"', EN_DOWNLOAD)[1]
GALAXY = html.unescape(re.search(r'href="(https://apps\.samsung\.com/[^"]+)"', EN_DOWNLOAD)[1])

def card(heading, body, name="", extra=""):
    ident = f' id="{name}"' if name else ""
    return f'<article class="locale-card"{ident}><h2>{esc(heading)}</h2><p>{esc(body)}</p>{extra}</article>'

def recent(lang, page):
    rows = [line.split("|") for line in COPY[lang].splitlines()]
    assert tuple(map(len, rows)) == (11,3,3,3,3,3,3,7,2,2,2,2,2,2,2,2,6,3), lang
    labels = rows[0]
    route_copy = dict(zip(ROUTES, rows[1:7]))
    _, title, desc = route_copy[page]
    nav = "".join(a(path(lang,p), route_copy[p][0], ' aria-current="page"' if p == page else "") for p in ROUTES[:5])
    btn = lambda p, hash="", cls="": a(path(lang,p)+hash, route_copy[p][0], f' class="locale-btn {cls}"')
    content = []
    if page in ("index","features"):
        f = rows[7]
        for n, anchor in enumerate(("cursor-demo", "file-demo", "screen-tools")):
            content.append(card(f[2*n], f[2*n+1], anchor))
        if page == "index":
            content.append(card(route_copy["download"][0], route_copy["download"][2], "get",
                                btn("download",cls="primary")+btn("guide")))
        content.append(a("/en/features", f[6], ' class="locale-btn" hreflang="en"'))
    elif page == "guide":
        for row, anchor in zip(rows[8:12], ("connect-lan","connect-account","bluetooth","permissions")):
            content.append(card(*row, anchor))
        for device, body in zip(("android", "mac", "windows"), rows[17]):
            content.append(card({"android":"Android", "mac":"Mac", "windows":"Windows"}[device],
                                body, device + "-handoff",
                                a("/en/guide#" + device + "-handoff", labels[4], ' class="locale-btn" hreflang="en"')))
        content.append(btn("download",cls="primary")+btn("help"))
    elif page == "help":
        for row, anchor in zip(rows[12:16], ("discovery","faq-android-input","faq-cursor-return","faq-device-reset")):
            q, answer = map(esc,row)
            content.append(f'<details class="locale-card" id="{anchor}"><summary>{q}</summary><p>{answer}</p></details>')
        content.append(btn("guide"))
    elif page == "download":
        win, android, mac, setup, dmg, _ = rows[16]
        content.append(card("Windows", win, "windows",
                            a(STORE,"Microsoft Store",' class="locale-btn primary"')+
                            a(WIN,setup,' class="locale-btn" data-latest-windows-download download')))
        content.append(card("Android", android, "android",
                            a(PLAY,"Google Play",' class="locale-btn primary"')+
                            a(GALAXY,"Galaxy Store",' class="locale-btn"')))
        content.append(card("Mac", mac, "mac", a(MAC,dmg,
                            f' class="locale-btn primary" data-latest-macos-download data-ready-label="{esc(dmg)}" download')))
        content.append(btn("guide")+btn("compatibility"))
    else:
        win, android, mac, _, _, tip = rows[16]
        content.extend(card(name,body,name.lower()) for name,body in zip(("Windows","Android","Mac"),(win,android,mac)))
        content.append(card(route_copy["compatibility"][0], tip, "support", btn("guide")))
    extra = a(path("en",page),labels[4],' class="locale-btn" hreflang="en"') if page != "index" else ""
    footer = "".join(a("/en/"+p, label+" (English)", ' hreflang="en"')
                     for p,label in zip(("privacy","terms","licenses","compare","technical"),labels[6:]))
    hero_img = ('<img src="/assets/preview/home-cursor-desk.webp" width="1536" height="1024"'
                ' alt="" fetchpriority="high" decoding="async">') if page == "index" else ""
    hero_btn = ('<div class="locale-actions">'+(btn("download","#windows","primary")+btn("guide"))+'</div>') if page == "index" else ""
    download_js = f'<script src="{esc(DOWNLOAD_JS)}" defer></script>' if page == "download" else ""
    return f'''<!doctype html>
<!-- Generated by scripts/generate_web_locales.py -->
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="{esc(desc)}">
<title>{esc(title)} | OneMouse</title>
<link rel="canonical" href="{HOST}{path(lang,page)}">
{alternates(page, (*LOCALES, "x-default"))}
<link rel="icon" href="{ICON}" type="image/png">
<link rel="stylesheet" href="{SHARED_CSS}">
<link rel="stylesheet" href="{PICKER_CSS}">
<link rel="stylesheet" href="{CSS}">
<script src="{PICKER_JS}" defer></script>
{download_js}
</head>
<body>
<a href="#main" class="locale-skip">{esc(labels[1])}</a>
<header class="preview-header"><div class="preview-frame">
<a class="preview-brand" href="{path(lang,"index")}"><span class="preview-mark"><img src="{ICON}" width="33" height="33" alt=""></span>OneMouse</a>
<nav class="preview-nav" aria-label="{esc(labels[2])}">{nav}</nav>
<div class="one-language-select"><label class="one-language-label" for="one-language-picker">{esc(labels[0])}</label>{{{{PICKER}}}}</div>
</div></header>
<main class="locale-main" id="main"><div class="locale-hero{' with-image' if hero_img else ''}"><div><p class="locale-tag">OneMouse · Software KVM</p>
<h1>{esc(title)}</h1><p>{esc(desc)}</p>{hero_btn}</div>{hero_img}</div>
<div class="locale-content">{chr(10).join(content)}</div>
<div class="locale-note"><p>{esc(labels[5])}</p>{extra}</div>
</main>
<footer class="preview-footer"><div class="preview-frame"><span>© OneMouse</span>
<nav class="preview-refs" aria-label="{esc(labels[3])}">{footer}</nav></div></footer>
</body></html>
'''

def write(p, text):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8", newline="\n")

def build():
    for page in ROUTES:
        by_lang = {lang: recent(lang,page) if lang in NEW else file(lang,page).read_text(encoding="utf-8")
                   for lang in LOCALES}
        ids = {lang: ids_of(src) for lang, src in by_lang.items()}
        for lang, src in by_lang.items():
            picked = "".join(option(a,page,lang,ids[a]) for a in NEW)
            fallback = "".join(fall(a,page,lang) for a in NEW)
            if lang in NEW:
                picker = "".join(option(a,page,lang,ids[a]) for a in LOCALES)
                links = "".join(fall(a,page,lang) for a in LOCALES)
                src = src.replace("{{PICKER}}", f'<select id="one-language-picker" data-language-picker data-current-language="{lang}" hidden>{picker}</select><noscript><nav class="one-language-fallback">{links}</nav></noscript>')
            else:
                src = re.sub(r'<!-- additional-locales:start -->.*?<!-- additional-locales:end -->\n?', "", src, flags=re.S)
                marker = '<link rel="alternate" hreflang="x-default"'
                idx = src.index(marker)
                src = src[:idx] + "<!-- additional-locales:start -->\n" + alternates(page, NEW) + "\n<!-- additional-locales:end -->\n" + src[idx:]
                start = src.index('data-language-picker')
                end = src.index('</noscript>', start)
                control = src[start:end]
                control = (re.sub(r'<option value="(?:pt-BR|de|zh-TW|fr|id)".*?</option>', '', control)
                           .replace('>中文</option>', '>简体中文</option>'))
                control = re.sub(r'<a [^>]*hreflang="(?:pt-BR|de|zh-TW|fr|id)"[^>]*>[^<]*</a>', '', control)
                control = control.replace('>中文</a>', '>简体中文</a>').replace('>中文</span>', '>简体中文</span>')
                control = control.replace('</select>', picked+'</select>',1).replace('</nav>',fallback+'</nav>',1)
                src = src[:start]+control+src[end:]
            write(file(lang,page),src)
    sitemap = ROOT / "sitemap.xml"
    s = re.sub(r'  <!-- additional-locales:start -->.*?  <!-- additional-locales:end -->\n', "",
               sitemap.read_text(encoding="utf-8"), flags=re.S)
    entries = "".join("  <url><loc>"+HOST+path(lang,page)+"</loc></url>\n" for lang in NEW for page in ROUTES)
    write(sitemap,s.replace("</urlset>", "  <!-- additional-locales:start -->\n"+entries+"  <!-- additional-locales:end -->\n</urlset>"))

if __name__ == "__main__":
    build()
