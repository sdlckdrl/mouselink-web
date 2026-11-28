'use strict';
// Run with Node 22+ and Chrome. --fixture uses production English markup with the
// target lang/script tags, for development before the static pages are rebuilt.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'), catalog=require('../js/demo-locales.json'),langs=['pt-br','de','zh-tw','fr','id'],tags=['pt-BR','de','zh-TW','fr','id'];
const fixture=process.argv.includes('--fixture'),profile=fs.mkdtempSync(path.join(os.tmpdir(),'om-demo-qa-')),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{
 try{
  let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const m=pathname.match(/^\/(pt-br|de|zh-tw|fr|id)\/(features|guide)\.html$/);
  let file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep))throw Error('invalid path');
  if(fixture&&m){file=path.join(root,'en',m[2]+'.html');const html=fs.readFileSync(file,'utf8').replace(/<html lang="[^"]+"/i,'<html lang="'+tags[langs.indexOf(m[1])]+'"').replace(/\/js\/onemouse-(demos|race)-en\.js/g,'/js/onemouse-$1-'+m[1]+'.js');res.writeHead(200,{'content-type':types['.html']}).end(html);return;}
  const b=fs.readFileSync(file);res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'}).end(b);
 }catch{res.writeHead(404).end();}
});
let chrome,ws;
function pipe(ws){
 let serial=0;const outstanding=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&outstanding.has(m.id)){const [resolve,reject]=outstanding.get(m.id);outstanding.delete(m.id);m.error?reject(Error(m.error.message)):resolve(m.result);}};
 return (method,params={})=>new Promise((resolve,reject)=>{const id=++serial;outstanding.set(id,[resolve,reject]);ws.send(JSON.stringify({id,method,params}));});
}
async function run(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const executable=process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':'google-chrome');
 chrome=spawn(executable,['--headless=new','--disable-gpu','--no-first-run','--disable-background-networking','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true});chrome.on('error',e=>console.error(e.message));
 let port;for(let i=0;i<100&&!port;i++){await sleep(90);try{port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split(/\s/)[0]}catch{}}
 assert.ok(port,'Chrome failed to start');const tabs=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
 const c=pipe(ws);await c('Page.enable');await c('Network.enable');await c('Network.setBlockedURLs',{urls:['https://*']});
 const ev=async expression=>{const o=await c('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(o.exceptionDetails)throw Error(o.exceptionDetails.exception?.description||o.exceptionDetails.text);return o.result.value};
 const until=async(s)=>{for(let i=0;i<95;i++){if(await ev(s))return;await sleep(65)}throw Error('Timed out waiting for '+s+' at '+await ev('location.href'))};
 for(const [i,lang] of langs.entries())for(const [width,height] of [[390,844],[1280,800]]){
  const tr=k=>{assert.ok(catalog[k],k);return catalog[k][i]}, nav=async(page,selector)=>{const p='/'+lang+'/'+page+'.html';await c('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+p});await until("location.pathname==="+JSON.stringify(p)+" && document.readyState==='complete' && !!document.querySelector("+JSON.stringify(selector)+")");};
  await c('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});await c('Emulation.setTouchEmulationEnabled',{enabled:width<600});
  await nav('features','.om-file-stage');const q=s=>'document.querySelector('+JSON.stringify(s)+')';
  assert.equal(await ev('document.documentElement.lang.toLowerCase()'),lang);
  assert.equal(await ev(q('.om-file-file-grid')+'.getAttribute("aria-label")'),tr('Sample Windows files'));
  await ev(q('[data-om-file]')+'.click()');assert.equal(await ev(q('.om-file-action')+'.textContent'),tr('Move to Mac'));
  await ev(q('.om-file-action')+'.click()');assert.equal(await ev(q('.om-file-received [data-om-file]')+'!==null'),true);assert.ok((await ev(q('.om-file-status')+'.textContent')).includes(tr('{files} · Moved to {side}.').replace('{side}','Mac').replace('{files}','').trim()));
  await ev(q('.om-file-actions button:last-child')+'.click()');assert.equal(await ev(q('.om-file-status')+'.textContent'),tr('All files are back on Windows.'));
  assert.equal(await ev(q('[data-pick="race"]')+'.getAttribute("aria-label")'),tr('Racing'));
  await ev(q('[data-pick="race"]')+'.click()');await ev(q('[data-toggle]')+'.click()');assert.equal(await ev(q('.om-race-card [data-status]')+'.textContent'),tr('Game paused.'));
  await nav('guide','[data-handoff="mac"]');
  await ev("(()=>{const step=document.querySelector('[data-handoff=mac]');for(let p=step;p;p=p.parentElement){if(p.hidden)p.hidden=false;if(p.tagName==='DETAILS')p.open=true;}step.scrollIntoView({block:'center',behavior:'instant'});return true})()");
  await until("!!document.querySelector('[data-handoff=mac] .handoff-demo .handoff-desktop [data-note-launch]')");
  const g=s=>q('[data-handoff=mac] .handoff-demo '+s);
  assert.ok((await ev(g('.handoff-scene')+'.getAttribute("aria-label")')).includes(tr('Try moving the cursor')));
  await ev(g('[data-side=target]')+'.click()');assert.ok((await ev(g('.handoff-sr')+'.textContent')).includes(tr('Cursor on:')));
  await ev(g('[data-note-launch]')+'.click()');assert.equal(await ev(g('textarea')+'.placeholder'),tr('Write a note…'));
  console.log(lang+' '+width+'px: file select/move/reset, game/pause, guide handoff/note: PASS'+(fixture?' [English shell with localized scripts]':''));
 }
}
run().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{ws?.close();chrome?.kill();server.closeAllConnections();server.close();await sleep(300);if(profile.startsWith(path.join(os.tmpdir(),'om-demo-qa-')))try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:2})}catch{}});
