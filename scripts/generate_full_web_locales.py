"""Render added OneMouse locales from the English HTML and reviewed catalog."""
from pathlib import Path
from html.parser import HTMLParser
from html import escape, unescape
from collections import Counter
import json,re,sys

ROOT=Path(__file__).resolve().parents[1]
HOST="https://onemouse.pages.dev"
EXISTING={"ko":("","한국어"),"en":("en","English"),"ja":("ja","日本語"),"zh":("zh","简体中文"),"es":("es","Español")}
NEW={"pt-BR":("pt-br","Português (Brasil)"),"de":("de","Deutsch"),"zh-TW":("zh-tw","繁體中文"),"fr":("fr","Français"),"id":("id","Bahasa Indonesia")}
LANGS=EXISTING|NEW
CORE=("index","features","guide","help","download","compatibility")
PUBLIC=CORE+("compare","technical","privacy","terms","licenses","pricing","remote")
REFERENCE=("guide-reference","help-reference")
ROUTES=PUBLIC+REFERENCE
VOID=set("area base br col embed hr img input link meta param source track wbr".split())
RAW={"style","script","code","kbd","samp"}
ATTRS=set("alt aria-label aria-description title placeholder data-ready-label data-empty-label data-note data-label data-status data-play-label data-pause-label data-video-title".split())
PICK=re.compile(r'<div class="one-language-select">.*?</noscript>\s*</div>',re.S)
ALT=re.compile(r'<link rel="alternate" hreflang="[^"]+" href="[^"]+"\s*/?>')
MARK=re.compile(r'<!-- additional-locales:(?:start|end) -->\n?')
BASIC=re.compile(r'((?i:Windows(?: [0-9]+)?|Android(?: [0-9.]+\+?)?|macOS|Mac|Apple Silicon|Bluetooth|Wi-Fi|LAN|OneMouse|One Mouse|Ctrl|Alt|Shift|Enter|Esc|Tab|A|D|W|S)|[A-Z0-9_-]{2,8})')
ATTR=re.compile(r"""([a-zA-Z_:][-\w:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))""")
LABELS={"ko":"언어 선택","en":"Language","ja":"言語","zh":"语言","es":"Idioma","pt-BR":"Idioma","de":"Sprache","zh-TW":"語言","fr":"Langue","id":"Bahasa"}
MISSING=Counter()

def norm(value): return re.sub(r'\s+', ' ', value).strip()
def useful(value):
    return bool(value and re.search(r'[A-Za-z]',value) and (value == "FAQ" or not BASIC.fullmatch(value)) and not re.fullmatch(r'[^ ]+\.(?:exe|dmg|zip|webp|md|png|pdf|dll|json|mp4)',value,re.I) and not value.startswith(("https://","http://","mailto:")) and not re.fullmatch(r'[\w.-]+@[\w.-]+\.\w+', value))

def pagefile(lang,p): return ROOT/LANGS[lang][0]/f'{p}.html'
def addr(lang,p):
    slug=LANGS[lang][0]
    return ("/"+slug if slug else "")+"/"+("" if p=="index" else p)
def source(lang,p): return pagefile(lang,p).read_text(encoding="utf-8")
def ids(s): return sorted(set(re.findall(r'\bid=["\']([a-zA-Z][\w-]*)["\']',s))-{"one-language-picker"})

class Scan(HTMLParser):
    def __init__(self,s):
        super().__init__(convert_charrefs=False)
        self.src=s
        self.starts=[0]+[m.end() for m in re.finditer('\n',s)]
        self.stack=[]
        self.todo=[]
        self.last=None
        self.feed(s)
        self.close()
    def off(self):
        l,c=self.getpos()
        return self.starts[l-1]+c
    def addtext(self,value):
        if any(x in RAW for x in self.stack): return
        a=self.off()
        if self.last is not None and self.todo[self.last][1]==a:
            old=self.todo[self.last]
            self.todo[self.last]=(old[0],a+len(value),"text")
        else:
            self.todo.append((a,a+len(value),"text"))
            self.last=len(self.todo)-1
    def handle_data(self,value): self.addtext(value)
    def handle_entityref(self,name): self.addtext('&'+name+(';' if self.src[self.off()+1+len(name):].startswith(';') else ''))
    def handle_charref(self,name): self.addtext('&#'+name+(';' if self.src[self.off()+2+len(name):].startswith(';') else ''))
    def handle_endtag(self,tag):
        self.last=None
        if tag in self.stack:
            self.stack=self.stack[:len(self.stack)-1-self.stack[::-1].index(tag)]
    def handle_startendtag(self,tag,atts):
        self.start(tag,atts,False)
    def handle_starttag(self,tag,atts):
        self.start(tag,atts,tag not in VOID)
    def start(self,tag,atts,push):
        self.last=None
        atts=dict(atts)
        raw=self.get_starttag_text()
        offset=self.off()
        for m in ATTR.finditer(raw):
            k=m[1].lower()
            if k not in ATTRS and not (k=="content" and tag=="meta" and atts.get("name",atts.get("property","")) in {"description","og:title","og:description","twitter:title","twitter:description","og:image:alt","twitter:image:alt"}): continue
            g=2 if m[2] is not None else 3 if m[3] is not None else 4
            if g==4: continue
            self.todo.append((offset+m.start(g),offset+m.end(g),"attribute"))
        if push: self.stack.append(tag)

def raw_base(page):
    s=source("en",page)
    s=PICK.sub("<!--WEB_PICKER-->",s)
    return s

def collect(page):
    s=raw_base(page)
    return {norm(unescape(s[a:b])) for a,b,_ in Scan(s).todo if useful(norm(unescape(s[a:b])))}

def language_picker(page,lang,allids):
    opts=[]; links=[]
    for l,(_,name) in LANGS.items():
        target=addr(l,page)
        tag=f'<option value="{l}" lang="{l}" data-language-route="{target}" data-fragments="{" ".join(allids[l])}"'
        opts.append(tag+(' selected' if l==lang else '')+'>'+escape(name)+'</option>')
        if l==lang: links.append(f'<span lang="{l}" aria-current="true">{escape(name)}</span>')
        else: links.append(f'<a href="{target}" lang="{l}" hreflang="{l}">{escape(name)}</a>')
    label=escape(LABELS[lang])
    return f'<div class="one-language-select"><label class="one-language-label" for="one-language-picker">{label}</label><select id="one-language-picker" data-language-picker data-current-language="{lang}" hidden>{"".join(opts)}</select><noscript><nav class="one-language-fallback" aria-label="{label}">{"".join(links)}</nav></noscript></div>'

def render(lang,page,catalog):
    s=raw_base(page)
    changes=[]
    for a,b,kind in Scan(s).todo:
        raw=s[a:b]
        key=norm(unescape(raw))
        if not useful(key): continue
        t=catalog.get(key,{}).get(lang)
        if t is None: MISSING[(lang,key)]+=1; continue
        margin1=re.match(r'\s*',raw)[0]; margin2=re.search(r'\s*$',raw)[0]
        changes.append((a,b,margin1+escape(t,quote=kind=="attribute")+margin2))
    for a,b,t in sorted(changes,reverse=True): s=s[:a]+t+s[b:]
    slug=LANGS[lang][0]
    s=re.sub(r'(<html\b[^>]*\blang=["\'])en(["\'])',rf'\g<1>{lang}\2',s,count=1)
    s=re.sub(r'(?<=href=["\'])/en/(?=(?:'+ '|'.join(ROUTES[1:])+r')(?=[#?."\'/]|$)|[#"\'])',f'/{slug}/',s)
    s=s.replace(f'{HOST}{addr("en",page)}"',f'{HOST}{addr(lang,page)}"')
    # Keep locale value and metadata consistent on social cards.
    s=re.sub(r'(<meta\b[^>]*property="og:locale"[^>]*content=")[^"]+',lambda m:m[1]+{"pt-BR":"pt_BR","de":"de_DE","zh-TW":"zh_TW","fr":"fr_FR","id":"id_ID"}[lang],s)
    return re.sub(r"[ \t]+$", "", s, flags=re.M)

def write(p,s):
    if not p.exists() or p.read_text(encoding='utf-8')!=s:
        p.parent.mkdir(parents=True,exist_ok=True)
        p.write_text(s,encoding='utf-8',newline='\n')

INLINE = {
 'index': ('Cursor on: ', 'Android phone','Android tablet'),
 'guide': ('Loading image…', 'Could not load the image.'),
}
JSONLD = re.compile(r'(<script\b[^>]*type="application/ld\+json"[^>]*>)(.*?)(</script>)',re.S)
JSON_TEXT = {"name","description","headline","text","alternateName","caption"}

def extract_extra(page):
    for lit in INLINE.get(page,()): yield lit.strip()
    def walk(x):
        if isinstance(x,dict):
            for k,v in x.items():
                if k in JSON_TEXT and isinstance(v,str) and useful(norm(v)): yield norm(v)
                elif isinstance(v,(list,dict)): yield from walk(v)
        elif isinstance(x,list):
            for v in x: yield from walk(v)
    for m in JSONLD.finditer(raw_base(page)):
        yield from walk(json.loads(m[2]))

def migrate_extra(s,page,lang,catalog):
    slug=NEW[lang][0]
    def get(t):
        found=catalog.get(norm(t),{}).get(lang)
        if found is None:
            MISSING[(lang,norm(t))]+=1
            return t
        return found
    def walk(x):
        if isinstance(x,dict):
            return {k: (lang if k == "inLanguage" and v in ("en","en-US","en-GB") else
                        get(v) if k in JSON_TEXT and isinstance(v,str) and useful(norm(v)) else
                        walk(v)) for k,v in x.items()}
        if isinstance(x,list): return [walk(v) for v in x]
        if isinstance(x,str) and x.startswith(HOST+'/en/'):
            return x.replace(HOST+'/en/',HOST+'/'+slug+'/',1)
        return x
    s=JSONLD.sub(lambda m:m[1]+'\n'+json.dumps(walk(json.loads(m[2])),ensure_ascii=False,indent=2).replace('<','\\u003c')+'\n'+m[3],s)
    for phrase in INLINE.get(page,()):
        new=get(phrase)+((' ' if phrase.endswith(' ') else ''))
        escaped=new.replace('\\','\\\\').replace("'",r"\'").replace('\r',r'\r').replace('\n',r'\n').replace('<',r'\u003c')
        s=s.replace("'"+phrase+"'","'"+escaped+"'")
    for stem in ('onemouse-demos','onemouse-race'):
        s=s.replace('/js/'+stem+'-en.js','/js/'+stem+'-'+slug+'.js')
    s=re.sub(r'(/js/(?:guide-handoff|guide-handoff-workspace|preview-file-demo|preview-cursor-mode)\.js)(?:\?[^"\']*)?',r'\1?v=tenlang1',s)
    return s

def normalize_markup(page,lang,src,allids):
    start=ALT.search(src)
    if start is None:
        # The original /remote landing pages lacked canonical and alternate metadata.
        if page != "remote": raise ValueError(f'Missing alternates: {lang}:{page}')
        links = f'<link rel="canonical" href="{HOST}{addr(lang,page)}">' + chr(10)
        links += f'<link rel="alternate" hreflang="en" href="{HOST}/en/remote">' + chr(10)
        src=src.replace('</head>', links+'</head>',1)
    s=MARK.sub("",src)
    canonical={l:addr(l,page) for l in LANGS}|{"x-default":addr("ko",page)}
    group='\n'.join(f'<link rel="alternate" hreflang="{l}" href="{HOST}{r}">' for l,r in canonical.items())
    first=ALT.search(s)
    line='<!--WEB_ALT-->'
    s=s[:first.start()]+line+s[first.end():]
    s=re.sub(r'^[ \t]*'+ALT.pattern+r'[ \t]*\n?', '',s,flags=re.M)
    s=ALT.sub("",s).replace(line,group)
    picker=language_picker(page,lang,allids)
    if lang in NEW: s=s.replace("<!--WEB_PICKER-->",picker)
    else: s,n=PICK.subn(lambda _:picker,s,count=1); assert n==1,(page,lang)
    return s

def refresh_sitemap():
    p=ROOT/'sitemap.xml'
    s=re.sub(r'  <!-- additional-locales:start -->.*?  <!-- additional-locales:end -->\n','',p.read_text(encoding='utf-8'),flags=re.S)
    entries=''.join(f'  <url><loc>{HOST}{addr(l,page)}</loc></url>\n' for l in NEW for page in PUBLIC)
    write(p,s.replace('</urlset>','  <!-- additional-locales:start -->\n'+entries+'  <!-- additional-locales:end -->\n</urlset>'))
    hp=ROOT/'_headers'
    h=re.sub(r'\n# Additional localized reference pages\..*?\n# End additional localized reference pages\.\n','\n',hp.read_text(encoding='utf-8'),flags=re.S).rstrip()
    write(hp,h+'\n\n# Additional localized reference pages.\n'+''.join(f'{addr(l,page)}\n  X-Robots-Tag: noindex, follow\n\n' for l in NEW for page in REFERENCE)+'# End additional localized reference pages.\n')

def collect_all():
    return sorted(set().union(*(collect(p)|set(extract_extra(p)) for p in ROUTES)))

def main():
    if '--extract' in sys.argv:
        output=Path(sys.argv[sys.argv.index('--extract')+1])
        output.write_text(json.dumps(collect_all(),ensure_ascii=False,indent=1),encoding='utf8')
        print(f'{len(collect_all())} phrases')
        return
    catalog={}
    for name in ('full-web-locales','full-web-overrides','full-web-legal-overrides'):
        p=ROOT/'content'/(name+'.json')
        if p.exists():
            for k,v in json.loads(p.read_text(encoding='utf8')).items(): catalog.setdefault(k,{}).update(v)
    required={(l,k) for k in collect_all() for l in NEW if l not in catalog.get(k,{})}
    if required:
        raise SystemExit(f'Missing {len(required)} entries: {sorted(required)[:8]}')
    outputs={}
    for page in ROUTES:
        current={l:source(l,page) for l in EXISTING}|{l:migrate_extra(render(l,page,catalog),page,l,catalog) for l in NEW}
        allids={l:ids(s) for l,s in current.items()}
        for l,s in current.items():
            outputs[pagefile(l,page)]=normalize_markup(page,l,s,allids)
    if MISSING: raise SystemExit(f'Missing render entries: {MISSING.most_common(5)}')
    for p,s in outputs.items(): write(p,s)
    refresh_sitemap()

if __name__=='__main__': main()
