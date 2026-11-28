'use strict';
// Run: node --expose-internals tests/test_demo_full_locales_build.cjs [--write|--keys]
// Use Acorn bundled with Node. No packages, translation services or network calls.
const fs=require('fs'), path=require('path'), acorn=require('internal/deps/acorn/acorn/dist/acorn');
const root=path.resolve(__dirname,'..'), dir=path.join(root,'js'), locales=['pt-br','de','zh-tw','fr','id'];
const files=['onemouse-demos','onemouse-race'];
const tables={'guide-handoff.js':['languages'],'guide-handoff-workspace.js':['copy','transfer'],'preview-file-demo.js':['messages'],'preview-cursor-mode.js':['labels']};
function parse(s){return acorn.parse(s,{ecmaVersion:'latest'})}
function walk(n,f){if(!n||typeof n!=='object')return; if(n.type)f(n);Object.values(n).forEach(x=>{if(Array.isArray(x))x.forEach(v=>walk(v,f));else if(x&&typeof x==='object')walk(x,f)})}
function display(s,cb){return s.replace(/^(\s*)([\s\S]*?)(\s*)$/,(_,l,m,r)=>l+(m&&/[A-Za-z]/.test(m)?cb(m):m)+r)}
function template(raw,cb){
  if(!/[<>]/.test(raw))return display(raw,cb);
  const attributes=raw.replace(/\b(aria-label|title|placeholder)="([^"]*)"/g,(_,attr,v)=>attr+'="'+display(v,cb)+'"');
  return attributes.replace(/>([^<>]+)</g,(_,s)=>'>'+display(s,cb)+'<');
}
const read=file=>fs.readFileSync(path.join(dir,file),'utf8');
const keys=new Set;
const filePlans=[];
for(const base of files){
 const en=read(base+'-en.js'), peer=read(base+'-es.js'), ja=read(base+'-ja.js');
 function leaves(s){const out=[];walk(parse(s),n=>{if(n.type==='Literal'&&typeof n.value==='string'||n.type==='TemplateLiteral')out.push(n)});return out}
 const a=leaves(en), b=leaves(peer), c=leaves(ja);
 if(a.length!==b.length||a.length!==c.length)throw Error(base+' leaves '+[a.length,b.length,c.length]);
 const plan=[];
 for(let i=0;i<a.length;i++){
   const n=a[i],m=b[i],z=c[i];if(n.type!==m.type||n.type!==z.type)throw Error('mismatched AST '+i);
   let s, es, jp, expressions=[];
   if(n.type==='Literal'){
     [s,es,jp]=[n.value,m.value,z.value];if(s===es&&s===jp)continue;
   }else{
     const getNode=(node,src)=>{
       let value=node.quasis[0].value.raw;
       for(let j=0;j<node.expressions.length;j++)value+='{!'+j+'!}'+node.quasis[j+1].value.raw;
       return value;
     };
     [s,es,jp]=[getNode(n,en),getNode(m,peer),getNode(z,ja)];
     if(s===es&&s===jp)continue;
     expressions=n.expressions.map(x=>en.slice(x.start,x.end));
   }
   const collect=k=>{keys.add(k);return k};
   if(n.type==='Literal')display(s,collect);else template(s,collect);
   plan.push({start:n.start,end:n.end,type:n.type,s,expressions});
 }
 filePlans.push({base,en,plan});
}
const tablePlans=[];
function strings(v,fn){if(Array.isArray(v))return v.map(x=>strings(x,fn));if(typeof v==='string')return display(v,fn);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,strings(x,fn)]));return v}
for(const [name,tbs] of Object.entries(tables)){
 const src=read(name); const plan=[];
 walk(parse(src),n=>{if(n.type!=='VariableDeclarator'||!tbs.includes(n.id.name))return;
  const p=n.init.properties.find(x=>(x.key.name||x.key.value)==='en');if(!p)throw Error('no en table '+name);
  const obj=require('node:vm').runInNewContext('('+src.slice(p.value.start,p.value.end)+')',Object.create(null));
  strings(obj,k=>{keys.add(k);return k});plan.push({name:n.id.name,node:n.init,obj});
 });
 tablePlans.push({name,plan,src})
}
const sorted=[...keys];
if(process.argv.includes('--keys')){console.log(JSON.stringify(sorted));process.exit(0)}
const dict=JSON.parse(read('demo-locales.json'));
for(const k of sorted)for(const locale of locales){
 const translated=dict[k]?.[locales.indexOf(locale)];if(typeof translated!=='string'||!translated.trim())throw Error('missing '+locale+': '+k);
 const placeholders=s=>(s.match(/\{!?\w+!?\}/g)||[]).sort().join(' ');
 if(placeholders(k)!==placeholders(translated))throw Error(locale+': placeholder lost '+k);
}
const write=process.argv.includes('--write');
function output(name,value){if(write)fs.writeFileSync(path.join(dir,name),value,'utf8');else if(read(name)!==value)throw Error(name+' is stale')}
for(const [l,locale] of locales.entries()){
 const tr=k=>dict[k][l];
 for(const {base,en,plan} of filePlans){
  let src=en;
  for(const p of [...plan].sort((a,b)=>b.start-a.start)){
    const value=p.type==='Literal'?JSON.stringify(display(p.s,tr)):'\x60'+template(p.s,tr).replace(/\{!(\d+)!\}/g,(_,i)=>'\x24{'+p.expressions[i]+'}')+'\x60';
    src=src.slice(0,p.start)+value+src.slice(p.end);
  }
  parse(src);
  output(base+'-'+locale+'.js',src.replace('// Localized OneMouse demo strings; behavior from 664c912.','// Generated from the English demo and js/demo-locales.json; do not edit manually.'));
 }
}
for(const {name,src,plan} of tablePlans){
 let str=src;
 for(const item of [...plan].sort((a,b)=>b.node.start-a.node.start)){
  const n=item.node, tag='/* web-demo-locales */',endTag='/* end-web-demo-locales */';
  let area=str.slice(n.start,n.end),at=area.indexOf(tag);
  if(at>=0)area=area.slice(0,at)+area.slice(area.indexOf(endTag)+endTag.length);
  area=area.replace(/\s*}$/,m=>m);
  const props=locales.map((l,i)=>JSON.stringify(l)+':'+JSON.stringify(strings(item.obj,k=>dict[k][i]))+',').join('\n    ');
  area=area.slice(0,1)+tag+'\n    '+props+'\n  '+endTag+area.slice(1);
  str=str.slice(0,n.start)+area+str.slice(n.end);
 }
 str=str.replace("languages[document.documentElement.lang.split('-')[0]]", "languages[document.documentElement.lang.toLowerCase()] || languages[document.documentElement.lang.toLowerCase().split('-')[0]]");
 for(const t of ['transfer','copy'])str=str.replace(t+"[lang.split('-')[0]]",t+"[lang.toLowerCase()] || "+t+"[lang.toLowerCase().split('-')[0]]");
 str=str.replace("const language = document.documentElement.lang.toLowerCase().split('-')[0];","const language = document.documentElement.lang.toLowerCase();");
 for(const t of ['messages','labels'])str=str.replace(t+"[language] || "+t+".en",t+"[language] || "+t+"[language.split('-')[0]] || "+t+".en");
 parse(str);output(name,str);
}
console.log('Localized '+sorted.length+' distinct messages across '+locales.length+' website locales; demo scripts match the English source.');
