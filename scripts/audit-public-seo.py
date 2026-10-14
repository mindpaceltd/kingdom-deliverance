"""Read-only audit of every sitemap URL; not a Lighthouse or search ranking score."""
import urllib.request, urllib.parse, xml.etree.ElementTree as ET, json, concurrent.futures, sys
from html.parser import HTMLParser
from collections import Counter
base=sys.argv[1] if len(sys.argv)>1 else 'https://kdcuganda.org'
output=sys.argv[2] if len(sys.argv)>2 else '/tmp/kdc-seo-final.json'
class Page(HTMLParser):
 def __init__(self):
  super().__init__();self.meta={};self.title='';self.in_title=False;self.canonical='';self.h1=0;self.missing_alt=0;self.links=set();self.jsons=[];self.json_text=None;self.lang=''
 def handle_starttag(self,t,a):
  a=dict(a)
  if t=='meta':self.meta[a.get('name',a.get('property',''))]=a.get('content','')
  if t=='html':self.lang=a.get('lang','')
  if t=='link' and a.get('rel')=='canonical':self.canonical=a.get('href','')
  if t=='title':self.in_title=True
  if t=='h1':self.h1+=1
  if t=='img':self.missing_alt+=('alt' not in a)
  if t=='a' and a.get('href','').startswith('/'):self.links.add(a['href'].split('?')[0].split('#')[0])
  if t=='script' and a.get('type')=='application/ld+json':self.json_text=''
 def handle_endtag(self,t):
  if t=='title':self.in_title=False
  if t=='script' and self.json_text is not None:self.jsons.append(self.json_text);self.json_text=None
 def handle_data(self,d):
  if self.in_title:self.title+=d
  if self.json_text is not None:self.json_text+=d
xml=urllib.request.urlopen(base+'/sitemap.xml').read();urls=[e.text for e in ET.fromstring(xml).iter() if e.tag.endswith('}loc')]
def check(url):
 try:
  target=base+url.removeprefix('https://kdcuganda.org');r=urllib.request.urlopen(target,timeout=60);p=Page();p.feed(r.read().decode());valid=True
  for raw in p.jsons:
   try:json.loads(raw)
   except Exception:valid=False
  checks={'http_200':r.status==200,'title':bool(p.title.strip()),'description':bool(p.meta.get('description','').strip()),'canonical':p.canonical.rstrip('/')==url.rstrip('/'),'og_title':bool(p.meta.get('og:title')),'og_description':bool(p.meta.get('og:description')),'og_image':p.meta.get('og:image','').startswith('https://'),'og_url':p.meta.get('og:url','').rstrip('/')==url.rstrip('/'),'twitter_card':p.meta.get('twitter:card')=='summary_large_image','twitter_image':bool(p.meta.get('twitter:image')),'one_h1':p.h1==1,'image_alt_attributes':p.missing_alt==0,'language':bool(p.lang),'viewport':bool(p.meta.get('viewport')),'indexable':'noindex' not in p.meta.get('robots',''),'json_ld_valid':bool(p.jsons) and valid}
  return dict(url=url,status=r.status,title=p.title,description=p.meta.get('description'),image=p.meta.get('og:image'),checks=checks,links=sorted(p.links))
 except Exception as e:return dict(url=url,error=str(e),checks={'http_200':False})
rows=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
 for row in ex.map(check,urls):
  rows.append(row)
  if len(rows)%100==0:print(f'Checked {len(rows)}/{len(urls)} pages',flush=True)
summary={'urls':len(rows),'passed_pages':sum(all(r['checks'].values()) for r in rows),'failed_checks':dict(Counter(k for r in rows for k,v in r['checks'].items() if not v)),'duplicate_titles':{k:v for k,v in Counter(r.get('title') for r in rows).items() if v>1},'duplicate_descriptions':{k:v for k,v in Counter(r.get('description') for r in rows).items() if v>1}}
json.dump({'summary':summary,'pages':rows},open(output,'w'),indent=2)
print(json.dumps(summary,indent=2));print('Failed pages',[(r['url'],[k for k,v in r['checks'].items() if not v]) for r in rows if not all(r['checks'].values())])
