// Generated from the English demo and js/demo-locales.json; do not edit manually.
(() => {
  'use strict';
  const PHOTO='/assets/preview/android-notification-desk.webp';
  const PC = { w:960,h:580,quad:[[155,115],[1122,54],[1097,697],[131,643]] };
  const PHONE = { w:210,h:480,quad:[[1249,400],[1458,399],[1406,888],[1190,870]] };
  const NOTE="會議下午 3 點在二樓會議室舉行。";
  const MAILS=[
    ["團隊郵件","今天下午的會議資料已寄出，開會前請先看最後一頁。"],
    ["團隊郵件","下週的行程有變，請查看新的地點和時間。"],
    ["團隊郵件","修訂後的投影片已寄出，請在今天提供意見。"],
  ];
  const instances=new WeakMap();
  function el(tag,kind,text=''){
    const e=document.createElement(tag);
    if(kind)e.className='om-android-'+kind;
    e.textContent=text;return e;
  }
  function button(kind,text){
    const e=el('button',kind,text);e.type='button';return e;
  }
  function shortcut(e,key){
    return (e.ctrlKey||e.metaKey)&&!e.altKey&&!e.shiftKey&&e.key?.toLowerCase()===key;
  }
  function screenProjection(screen,width,height){
    const [p0,p1,p2,p3]=screen.quad.map(([x,y])=>[x*width/1536,y*height/1024]);
    const dx1=p1[0]-p2[0],dx2=p3[0]-p2[0],dx3=p0[0]-p1[0]+p2[0]-p3[0];
    const dy1=p1[1]-p2[1],dy2=p3[1]-p2[1],dy3=p0[1]-p1[1]+p2[1]-p3[1];
    const det=dx1*dy2-dx2*dy1;
    const g=(dx3*dy2-dx2*dy3)/det,h=(dx1*dy3-dx3*dy1)/det;
    return `matrix3d(${[
      (p1[0]-p0[0]+g*p1[0])/screen.w,(p1[1]-p0[1]+g*p1[1])/screen.w,0,g/screen.w,
      (p3[0]-p0[0]+h*p3[0])/screen.h,(p3[1]-p0[1]+h*p3[1])/screen.h,0,h/screen.h,
      0,0,1,0,p0[0],p0[1],0,1
    ].join(',')})`;
  }
  function mount(panel){
    if(!panel||panel.nodeType!==1)throw new TypeError('Expected an Android demo panel.');
    if(instances.has(panel))return instances.get(panel);
    const root=el('div','demo');
    const stage=el('div','stage');
    const img=el('img','backdrop');
    img.alt='';img.src=PHOTO;img.width=1536;img.height=1024;img.draggable=false;
    img.addEventListener('error',()=>stage.classList.add('om-android-photo-missing'));
    if(img.complete&&!img.naturalWidth)stage.classList.add('om-android-photo-missing');

    function alertCard(kind,device){
      const shell=el('div',kind);
      shell.hidden=true;
      const header=el('div','alert-header');
      const icon=el('span','mail-icon','✉');icon.setAttribute('aria-hidden','true');
      header.append(icon,el('span','device-label',device));
      const sender=el('strong','mail-sender'), content=el('div','mail-content');
      shell.append(header,sender,content);
      return {shell,sender,content};
    }
    const android=alertCard('phone-alert',"Android · 郵件");
    const windows=alertCard('pc-alert','Windows · OneMouse');

    function clipBox(kind,title,isSource){
      const box=el('div',kind);
      const label=el('div','note-title',title);
      const field=el('textarea','note-field');
      field.readOnly=true;field.spellcheck=false;
      field.rows=2;field.setAttribute('aria-label',title);
      field.value=isSource?NOTE:'';
      if(!isSource)field.placeholder="貼在這裡";
      const action=button('note-action',isSource?"複製":"貼上");
      box.append(label,field,action);
      return {box,field,action};
    }
    const source=clipBox('phone-note',"Android · 範例筆記",true);
    const dest=clipBox('pc-note',"Windows · 記事本",false);
    const phoneScreen=el('div','screen-phone'), pcScreen=el('div','screen-pc');
    phoneScreen.append(source.box,android.shell);
    pcScreen.append(dest.box,windows.shell);
    stage.append(img,pcScreen,phoneScreen);

    const compactCopy=button('compact-action',"從手機複製");
    const compactPaste=button('compact-action',"貼到 PC");
    const compactControls=el('div','compact-controls');
    compactControls.append(compactCopy,compactPaste);

    const hint=el('p','hint',"通知會自動顯示。在手機上複製，再貼到 PC 的記事本。");
    const status=el('p','status');
    status.setAttribute('role','status');status.setAttribute('aria-atomic','true');
    root.append(stage,hint,compactControls,status);
    panel.append(root);

    let copied=null, pasted='', visible=false, mailIndex=0;
    let timers=[];
    const schedule=(fn,delay)=>{const id=window.setTimeout(fn,delay);timers.push(id);};
    const clearTimers=()=>{timers.forEach(id=>window.clearTimeout(id));timers=[];};
    const allAlerts=[android,windows];
    function hideAlerts(){for(const card of allAlerts)card.shell.hidden=true;}
    function stopTimers(){clearTimers();hideAlerts();}
    function allowed(){return visible&&!document.hidden;}
    function updateControlSize(){
      const {width,height}=stage.getBoundingClientRect();
      if(width&&height){
        phoneScreen.style.transform=screenProjection(PHONE,width,height);
        pcScreen.style.transform=screenProjection(PC,width,height);
        stage.classList.add('om-android-mapped');
      }
    }
    if(typeof ResizeObserver==='function')new ResizeObserver(updateControlSize).observe(root);
    else window.addEventListener('resize',updateControlSize,{passive:true});
    updateControlSize();
    function present(card,mail){card.sender.textContent=mail[0];card.content.textContent=mail[1];card.shell.hidden=false;}
    function fire(){
      clearTimers();hideAlerts();
      if(!allowed())return;
      const mail=MAILS[mailIndex++%MAILS.length];
      present(android,mail);
      schedule(()=>{if(allowed())present(windows,mail);},450);
      schedule(()=>{android.shell.hidden=true;},3950);
      schedule(()=>{windows.shell.hidden=true;},4700);
      schedule(fire,10000);
    }
    function syncAlerts(delay=550){
      stopTimers();
      if(allowed())schedule(fire,delay);
    }
    function updateClip(){
      dest.field.value=pasted;
      dest.box.classList.toggle('om-android-note-pasted',Boolean(pasted));
      dest.action.disabled=compactPaste.disabled=!copied;
    }
    function copy(){
      copied=NOTE;updateClip();
      status.textContent="已複製範例筆記，請貼到 PC 的記事本。";
    }
    function paste(){
      if(!copied){status.textContent="請先在手機上複製範例筆記。";return;}
      pasted=copied;updateClip();
      status.textContent="相同的文字已貼到 PC 的記事本。";
    }
    for(const action of [source.action,compactCopy])action.addEventListener('click',copy);
    for(const action of [dest.action,compactPaste])action.addEventListener('click',paste);
    source.field.addEventListener('keydown',event=>{if(shortcut(event,'c')){event.preventDefault();copy();}});
    source.field.addEventListener('copy',event=>{event.preventDefault();copy();});
    dest.field.addEventListener('keydown',event=>{if(shortcut(event,'v')){event.preventDefault();paste();}});
    dest.field.addEventListener('paste',event=>{event.preventDefault();paste();});
    dest.field.addEventListener('copy',event=>event.preventDefault());
    document.addEventListener('visibilitychange',()=>syncAlerts());
    if(typeof IntersectionObserver==='function'){
      const watch=new IntersectionObserver(entries=>{
        const active=entries.some(entry=>entry.target===stage&&entry.isIntersecting&&entry.intersectionRatio>=.1);
        if(active!==visible){visible=active;syncAlerts();}
      },{threshold:[0,.1]});
      watch.observe(stage);
    }
    // Older browsers can derive the visible area without an observer.
    else {
      const inspect=()=>{
        const r=stage.getBoundingClientRect();
        const width=Math.max(0,Math.min(r.right,window.innerWidth)-Math.max(0,r.left));
        const height=Math.max(0,Math.min(r.bottom,window.innerHeight)-Math.max(0,r.top));
        const area=(r.right-r.left)*(r.bottom-r.top);
        const active=area>0&&width*height>=area*.1;
        if(visible!==active){visible=active;syncAlerts();}
      };
      window.addEventListener('scroll',inspect,{passive:true});
      window.addEventListener('resize',inspect,{passive:true});
      inspect();
    }
    updateClip();syncAlerts();
    const instance={reset(){mailIndex=0;copied=null;pasted='';status.textContent='';updateClip();syncAlerts();}};
    instances.set(panel,instance);
    return instance;
  }
  window.OneMouseAndroidDemo={mount};
})();

(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const PHOTO_WIDTH = 1536, PHOTO_HEIGHT = 1024;
  const IMAGE = '/assets/feature-screenshot-share-photo.webp';
  const W = 640, H = 400;
  const MONITOR_QUAD = [[92,88],[1062,56],[1086,659],[113,717]];
  // Bounds of the received image inside the pictured phone, clockwise.
  const PHONE_QUAD = [[1177,470],[1366,480],[1348,703],[1158,693]];
  const PHONE_W = 192, PHONE_H = 224;
  const FULL = { x: 0, y: 0, w: W, h: H };
  const mounts = new WeakMap();

  // A local illustration in fixed coordinates. The source, preview and phone
  // render this same scene rather than reading any pixels or device data.
  const scene = [
    ['rect', { x: 0, y: 0, width: 640, height: 400, fill: '#d4eff1' }],
    ['path', { d: 'M0 0H640V143C503 163 368 152 236 129 129 113 58 114 0 141Z', fill: '#c3e4f0' }],
    ['circle', { cx: 475, cy: 87, r: 46, fill: '#ffdaa0' }],
    ['path', { d: 'M0 232 109 110 141 147 207 73 314 216 379 154 452 221 536 151 640 217V360H0Z', fill: '#7398a8' }],
    ['path', { d: 'm147 148 60-75 55 72-35-14-17 13-13-9-24 9Z', fill: '#f6f6e9' }],
    ['path', { d: 'M0 238c73-14 110-11 161 3 90 26 139-14 232-18 89-5 155 19 247 5v132H0Z', fill: '#417b91' }],
    ['path', { d: 'M0 258c70-13 139-19 198-10 89 14 151-9 225-10 85 0 137 26 217 20M0 278c61-7 161-1 218 6 113 12 185-28 281-20l141 12M223 304c106-5 157-22 235-16l88 5M338 317c71-9 118-8 177-7', fill: 'none', stroke: '#9ed3d6', 'stroke-width': 2.5, opacity: .8 }],
    ['path', { d: 'M0 261c42 2 52 26 89 43 42 19 120 20 157 56H0ZM640 288c-38-7-85 15-104 36l-38 36h142Z', fill: '#284e55' }],
    ['path', { d: 'M36 315v-46m-17 28 17-30 17 30m-21 6 24-40 24 40m-24 13v-49m533 78v-51m-22 34 22-39 22 39', fill: 'none', stroke: '#153e40', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }],
    ['path', { d: 'M425 98h100m-86 8h64m-54 6h46', fill: 'none', stroke: '#fff2d2', 'stroke-width': 1.7, opacity: .68 }],
    ['rect', { x: 0, y: 364, width: 640, height: 36, fill: '#eff6fe' }],
    ['path', { d: 'M290 373h7v7h-7zM299 373h7v7h-7zM290 382h7v7h-7zM299 382h7v7h-7z', fill: '#188cdf' }],
    ['path', { d: 'M315 376h7l3 3h12v10h-22Z', fill: '#ecb63e' }],
    ['circle', { cx: 352, cy: 382, r: 8, fill: '#00a0ac' }],
    ['path', { d: 'M350 389c-5-2-6-6-3-9 4-4 9-4 13-1-2-7-12-9-16-3-3 5 0 12 6 13Z', fill: '#0754a3' }],
    ['rect', { x: 18, y: 26, width: 22, height: 15, rx: 3, fill: '#116ca2', stroke: '#effaff' }],
    ['path', { d: 'M29 41v4m-5 0h10M19 68h19v19H19z', fill: 'none', stroke: '#effaff', 'stroke-width': 2 }],
    ['text', { x: 29, y: 56, fill: '#143249', 'text-anchor': 'middle', 'font-size': 8, 'font-family': 'system-ui' }, "我的電腦"],
    ['text', { x: 29, y: 99, fill: '#143249', 'text-anchor': 'middle', 'font-size': 8, 'font-family': 'system-ui' }, "資源回收筒"],
    ['text', { x: 621, y: 386, fill: '#254a64', 'text-anchor': 'end', 'font-size': 9, 'font-family': 'system-ui' }, '10:24']
  ];

  const el = (tag, name, text) => {
    const item = document.createElement(tag);
    if (name) item.className = `om-capture-${name}`;
    if (text) item.textContent = text;
    return item;
  };
  const button = (label, kind) => {
    const item = el('button', kind, label);
    item.type = 'button';
    return item;
  };
  function picture(bounds) {
    const svg = document.createElementNS(NS, 'svg');
    const box = `${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}`;
    svg.setAttribute('viewBox', box);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('width', bounds.w);
    svg.setAttribute('height', bounds.h);
    // The nested viewport prevents neighbouring pixels filling letterbox areas
    // when the crop shape differs from the photographed phone's rectangle.
    const clip = document.createElementNS(NS, 'svg');
    Object.entries({ x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h, viewBox: box, overflow: 'hidden' })
      .forEach(([name, value]) => clip.setAttribute(name, value));
    svg.append(clip);
    scene.forEach(([tag, attrs, value]) => {
      const shape = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([key, value]) => shape.setAttribute(key, value));
      if (value) shape.textContent = value;
      clip.append(shape);
    });
    return svg;
  }

  function pngBlob(bounds) {
    return new Promise((resolve, reject) => {
      const markup = new XMLSerializer().serializeToString(picture(bounds));
      const image = new Image();
      image.onerror = () => reject(new Error('PNG render failed'));
      image.onload = () => {
        try {
          const canvas = el('canvas');
          const scale = Math.min(2, 1200 / Math.max(bounds.w, bounds.h));
          canvas.width = Math.max(1, Math.round(bounds.w * scale));
          canvas.height = Math.max(1, Math.round(bounds.h * scale));
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG encoding failed')), 'image/png');
        } catch (error) { reject(error); }
      };
      image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
    });
  }

  // Map the local simulated device rectangle onto the photo's screen corners.
  function projection(quad, stageWidth, stageHeight, width, height) {
    const [p0,p1,p2,p3] = quad.map(([x,y]) => [x*stageWidth/PHOTO_WIDTH, y*stageHeight/PHOTO_HEIGHT]);
    const dx1=p1[0]-p2[0], dx2=p3[0]-p2[0], dx3=p0[0]-p1[0]+p2[0]-p3[0];
    const dy1=p1[1]-p2[1], dy2=p3[1]-p2[1], dy3=p0[1]-p1[1]+p2[1]-p3[1];
    const det=dx1*dy2-dx2*dy1;
    const g=(dx3*dy2-dx2*dy3)/det, h=(dx1*dy3-dx3*dy1)/det;
    const a=(p1[0]-p0[0]+g*p1[0])/width, b=(p3[0]-p0[0]+h*p3[0])/height, c=p0[0];
    const d=(p1[1]-p0[1]+g*p1[1])/width, e=(p3[1]-p0[1]+h*p3[1])/height, f=p0[1];
    const gx=g/width, hy=h/height;
    return {
      css: `matrix3d(${[a,d,0,gx,b,e,0,hy,0,0,1,0,c,f,0,1].join(',')})`,
      inverse(x,y) {
        const a1=a-x*gx, b1=b-x*hy, d1=d-y*gx, e1=e-y*hy;
        const determinant=a1*e1-b1*d1;
        return {x:((x-c)*e1-b1*(y-f))/determinant, y:(a1*(y-f)-(x-c)*d1)/determinant};
      }
    };
  }

  function mount(panel) {
    if (!panel || panel.nodeType !== 1) throw new TypeError('A capture demo panel element is required.');
    const existing = mounts.get(panel);
    if (existing) return existing;

    const root = el('div', 'demo');
    const figure = el('figure', 'photo');
    const stage = el('div', 'stage');
    const backdrop = el('img', 'backdrop');
    backdrop.src = IMAGE;
    backdrop.alt = '';
    backdrop.width = PHOTO_WIDTH;
    backdrop.height = PHOTO_HEIGHT;
    backdrop.decoding = 'async';
    backdrop.draggable = false;

    const source = el('div', 'source');
    source.tabIndex = 0;
    source.setAttribute('role', 'button');
    source.setAttribute('aria-label', "範例電腦螢幕。按 Enter 或空白鍵即可擷取全螢幕。");
    const desktop = el('div', 'desktop-art');
    desktop.append(picture(FULL));
    const selection = el('div', 'selection');
    selection.hidden = true;
    selection.setAttribute('aria-hidden', 'true');
    const cursor = el('div','virtual-cursor');
    cursor.hidden = true;
    cursor.setAttribute('aria-hidden','true');
    const savedFile = el('div', 'saved-file');
    savedFile.hidden = true;
    savedFile.setAttribute('aria-hidden', 'true');
    savedFile.append(el('span', 'saved-icon', '✓'), el('strong', 'saved-name', 'onemouse-demo-capture.png'),
      el('span', 'saved-label', "已儲存至模擬 PC"));
    source.append(desktop, selection, cursor, savedFile);

    const monitorLayer = el('div', 'monitor-layer');
    const monitor = el('div', 'monitor');
    const dialog = el('section', 'window');
    dialog.hidden = true;
    dialog.setAttribute('aria-label', "所選螢幕截圖預覽");
    const bar = el('div', 'window-bar');
    bar.append(el('span', 'window-brand', 'OneMouse'));
    const monitorPreview = el('div', 'monitor-preview');
    const monitorActions = el('div', 'monitor-actions');
    const mkActions = () => ({
      copy: button("複製", 'button'),
      save: button("儲存", 'button'),
      send: button("傳送", 'button om-capture-primary')
    });
    const inside = mkActions();
    monitorActions.append(inside.copy, inside.save, inside.send);
    dialog.append(bar, el('p', 'window-title', "螢幕截圖"), monitorPreview, monitorActions);
    monitor.append(source);
    monitorLayer.append(monitor);
    const popupPlane = el('div', 'popup-plane');
    popupPlane.append(dialog);

    const phone = el('div', 'phone');
    const phoneView = el('div', 'phone-view');
    const phoneHint = el('div', 'phone-hint', "收到的螢幕截圖會顯示在這裡。");
    phone.setAttribute('aria-label', "圖中的模擬 Android 手機");
    phoneView.append(phoneHint);
    phone.append(phoneView);
    stage.append(backdrop, monitorLayer, phone, popupPlane);
    const caption = el('figcaption', 'caption', "在桌面上用滑鼠或手指拖曳即可擷取。此範例使用 AI 生成的背景。");
    figure.append(stage, caption);
    const status = el('p', 'status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-atomic', 'true');
    root.append(figure, status);
    panel.append(root);

    let active = null, captured = null, photoFail = false, monitorMap = null;
    let pendingPng = null, png = null;

    function alignDevices() {
      if (photoFail) return;
      const {width, height} = stage.getBoundingClientRect();
      if (!width || !height) return;
      monitorMap = projection(MONITOR_QUAD, width, height, W, H);
      monitor.style.transform = popupPlane.style.transform = monitorMap.css;
      source.style.setProperty('--oc-cursor-size',Math.max(34,Math.min(104,Math.round(30000/width)))+'px');
      popupPlane.style.setProperty('--oc-projected-hit', Math.max(45, Math.ceil(44*PHOTO_WIDTH*H/(width*603*.91))) + 'px');
      phone.style.transform = projection(PHONE_QUAD, width, height, PHONE_W, PHONE_H).css;
      stage.classList.add('om-capture-mapped');
    }
    function showReceiver(crop) {
      phoneView.replaceChildren(picture(crop), el('span', 'delivered', "已收到螢幕截圖"));
      phoneView.classList.add('om-capture-received');
    }
    function missingPhoto() {
      photoFail = true;
      monitorMap = null;
      stage.classList.add('om-capture-photo-missing');
      caption.textContent = "仍可透過拖曳或輕觸擷取範例桌面。";
    }
    backdrop.addEventListener('load', alignDevices);
    backdrop.addEventListener('error', missingPhoto);
    if (backdrop.complete && !backdrop.naturalWidth) missingPhoto();
    alignDevices();
    if (typeof ResizeObserver === 'function') new ResizeObserver(alignDevices).observe(stage);
    else window.addEventListener('resize', alignDevices, { passive:true });

    function point(event) {
      const r = (monitorMap ? stage : source).getBoundingClientRect();
      // The touch cursor sits above the fingertip; this same coordinate is used
      // for both the cursor tip and the selection to avoid a hidden crop offset.
      const offset = event.pointerType === 'touch' ? 24 : 0;
      const x = event.clientX-r.left, y=event.clientY-r.top-offset;
      const local = monitorMap ? monitorMap.inverse(x,y) : {x:x/(r.width||1)*W,y:y/(r.height||1)*H};
      const clamp = (n, max) => Math.min(max, Math.max(0, Math.round(n)));
      return {x:clamp(local.x,W),y:clamp(local.y,H)};
    }
    function bounds(a, b) {
      return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x-b.x), h: Math.abs(a.y-b.y) };
    }
    function drawSelection(box) {
      selection.hidden = !box || box.w < 1 || box.h < 1;
      if (selection.hidden) return;
      selection.style.left = `${box.x/W*100}%`;
      selection.style.top = `${box.y/H*100}%`;
      selection.style.width = `${box.w/W*100}%`;
      selection.style.height = `${box.h/H*100}%`;
    }
    function showCursor(point) {
      cursor.hidden = false;
      cursor.style.left = `${point.x/W*100}%`;
      cursor.style.top = `${point.y/H*100}%`;
    }
    function dropActive() {
      cursor.hidden = true;
      if (!active) return;
      const id = active.id;
      active = null;
      if (source.hasPointerCapture?.(id)) source.releasePointerCapture(id);
    }
    function clearReceiver() {
      phoneView.replaceChildren(phoneHint);
      phoneView.classList.remove('om-capture-received');
    }
    function commit(box, note, focusActions = false) {
      dropActive();
      captured = box;
      drawSelection(null);
      clearReceiver();
      monitorPreview.replaceChildren(picture(box));
      dialog.hidden = false;
      png = null;
      const current = pendingPng = pngBlob(box);
      current.then(blob => {
        if (pendingPng !== current) return;
        png = blob;
      }, () => {
        if (pendingPng === current) status.textContent = "瀏覽器無法建立 PNG。仍可在模擬 PC 中顯示儲存結果，或將截圖傳到模擬手機。";
      });
      status.textContent = note;
      if (focusActions) inside.copy.focus({preventScroll:true});
    }
    function closeCapture() {
      captured = png = pendingPng = null;
      drawSelection(null);
      dialog.hidden = true;
      monitorPreview.replaceChildren();
    }
    function conclude(note) {
      closeCapture();
      source.focus({preventScroll:true});
      status.textContent = note;
    }
    function reset() {
      dropActive();
      closeCapture();
      clearReceiver();
      savedFile.hidden = true;
      status.textContent = '';
    }
    async function copyCapture() {
      if (!captured || !pendingPng) return;
      const selected = pendingPng;
      try {
        if (!navigator.clipboard?.write || typeof ClipboardItem !== 'function') throw new Error('Permission unavailable');
        await navigator.clipboard.write([new ClipboardItem({'image/png': png || selected})]);
        if (selected === pendingPng) conclude("已複製到剪貼簿，可以再次擷取桌面。");
      } catch {
        if (selected === pendingPng) status.textContent = "此瀏覽器不支援複製圖片。仍可將截圖傳到模擬手機。";
      }
    }
    function saveCapture() {
      if (!captured) return;
      savedFile.hidden = false;
      conclude("儲存的檔案會顯示在模擬 PC 桌面上，不會下載任何檔案。");
    }
    function sendCapture() {
      if (!captured) return;
      showReceiver(captured);
      conclude("模擬手機已收到截圖。");
    }
    inside.copy.addEventListener('click',copyCapture);
    inside.save.addEventListener('click',saveCapture);
    inside.send.addEventListener('click',sendCapture);
    function tapCapture(event) {
      const end = point(event), w = Math.round(W/2), h = Math.round(H/2);
      commit({ x: Math.max(0, Math.min(W-w,end.x-w/2)), y: Math.max(0,Math.min(H-h,end.y-h/2)), w, h }, "已擷取輕觸位置周圍的區域。");
    }
    source.addEventListener('pointerdown', event => {
      if (active || event.button !== 0 || event.isPrimary === false) return;
      event.preventDefault();
      closeCapture();
      const start = point(event);
      active = { id:event.pointerId,start,x:event.clientX,y:event.clientY,touch:event.pointerType==='touch' };
      if(active.touch)showCursor(start);
      if (event.isTrusted) source.setPointerCapture?.(event.pointerId);
      drawSelection(null);
    });
    source.addEventListener('pointermove', event => {
      if (!active || event.pointerId !== active.id) return;
      const current = point(event);
      if(active.touch)showCursor(current);
      drawSelection(bounds(active.start,current));
    });
    source.addEventListener('pointerup', event => {
      if (!active || event.pointerId !== active.id) return;
      const end = point(event), box = bounds(active.start, end);
      if (box.w < 1 || box.h < 1 || Math.abs(event.clientX-active.x)<7 || Math.abs(event.clientY-active.y)<7) {
        // Tap / very short movement: take a visible sample centred near the tap.
        tapCapture(event);
      } else commit(box, "已擷取所選區域。");
    });
    function interrupted(event) {
      if (!active || active.id !== event.pointerId) return;
      dropActive();
      drawSelection(null);
      status.textContent = "選取已中斷，請重新拖曳或輕觸。";
    }
    source.addEventListener('pointercancel', interrupted);
    source.addEventListener('lostpointercapture', interrupted);
    source.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      commit(FULL, "已擷取全螢幕。", true);
    });
    source.addEventListener('click', event => {
      // Assistive technology may activate a role=button with a click only.
      if (event.detail === 0) commit(FULL, "已擷取全螢幕。", true);
    });
    root.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      if (active) {
        event.preventDefault();
        dropActive();
        drawSelection(null);
        status.textContent = '';
      } else if (captured) {
        event.preventDefault();
        conclude('');
      }
    });

    const instance = { reset, start: alignDevices };
    mounts.set(panel, instance);
    return instance;
  }

  window.OneMouseCaptureDemo = { mount };
})();

(() => {
  'use strict';
  const files = [
    {id:'photo', name:"旅遊照片.jpg", type:'photo', mark:'JPG'},
    {id:'work', name:"工作文件.pdf", type:'pdf', mark:'PDF'},
    {id:'note', name:"筆記.txt", type:'text', mark:'TXT'},
  ];
  const photo = '/assets/preview/file-transfer-desk.webp';
  const mounts = new WeakMap();
  function node(tag, classes, text) {
    const element = document.createElement(tag);
    if (classes) element.className = classes.split(' ').map(s=>`om-file-${s}`).join(' ');
    if (text) element.textContent = text;
    return element;
  }
  function button(classes,text) {
    const element = node('button',classes,text);
    element.type='button';
    return element;
  }
  function fileIcon(file) {
    const icon=node('span',`icon icon-${file.type}`,file.mark);
    icon.setAttribute('aria-hidden','true');
    return icon;
  }
  function mount(panel) {
    if (!panel || panel.nodeType!==1) throw new TypeError('Expected a file demo panel.');
    if (mounts.has(panel)) return mounts.get(panel);
    const root=node('div','demo');
    const stage=node('div','stage');
    const backdrop=node('img','backdrop');
    backdrop.src=photo;backdrop.alt='';backdrop.width=1536;backdrop.height=1024;backdrop.draggable=false;
    const windows=node('div','windows-screen');
    const explorer=node('div','explorer');
    const title=node('div','explorer-title');
    const folder=node('span','folder-icon');
    folder.setAttribute('aria-hidden','true');
    title.append(folder,node('span','folder-title',"檔案總管 · 共用資料夾"));
    const grid=node('div','file-grid');
    grid.setAttribute('role','group');
    grid.setAttribute('aria-label',"Windows 範例檔案");
    explorer.append(title,grid);
    windows.append(explorer);
    const mac=node('div','mac-screen');
    const drop=button('drop');
    drop.setAttribute('aria-label',"將所選檔案傳到 Mac 桌面");
    drop.append(node('span','menu-bar',"Mac 桌面"));
    const receivedLayer=node('div','received');
    receivedLayer.setAttribute('aria-hidden','true');
    mac.append(drop,receivedLayer);
    const selection=node('div','marquee');selection.hidden=true;selection.setAttribute('aria-hidden','true');
    const ghost=node('div','ghost');ghost.hidden=true;ghost.setAttribute('aria-hidden','true');
    const cursor=node('span','cursor');cursor.hidden=true;cursor.setAttribute('aria-hidden','true');
    cursor.innerHTML='<svg viewBox="0 0 25 29" aria-hidden="true"><path d="M1 1 2 23l6-6 5 10 4-2-5-10h8z" fill="#fff" stroke="#102638" stroke-width="2" stroke-linejoin="round"/></svg>';
    stage.append(backdrop, windows, mac, selection, ghost, cursor);
    backdrop.addEventListener('error',()=>stage.classList.add('om-file-photo-missing'));
    if (backdrop.complete&&!backdrop.naturalWidth)stage.classList.add('om-file-photo-missing');

    const hint=node('p','hint',"將檔案拖曳到 Mac。若要選取多個檔案，請從資料夾的空白處拖曳。");
    const status=node('p','status');
    status.setAttribute('role','status');status.setAttribute('aria-atomic','true');
    root.append(stage,hint,status);
    panel.append(root);
    const selected=new Set();
    const placed=new Map();
    const items=new Map();
    let gesture=null, suppressClickUntil=0, cursorTimer;

    files.forEach(file=>{
      const item=button('source');
      item.dataset.omFile=file.id;
      item.append(fileIcon(file),node('span','filename',file.name));
      grid.append(item); items.set(file.id,item);
    });
    function update() {
      for (const file of files) {
        const active=selected.has(file.id);
        items.get(file.id).setAttribute('aria-pressed',String(active));
      }
      drop.classList.toggle('om-file-target-ready',selected.size>0);
      drop.setAttribute('aria-disabled',String(selected.size===0));
    }
    function flip(id) {
      if (selected.has(id))selected.delete(id);else selected.add(id);
      update();
      status.textContent=selected.size ? `已選取 ${selected.size} 個。` : '';
    }
    function rectOf(a,b) {
      return {left:Math.min(a.x,b.x),top:Math.min(a.y,b.y),right:Math.max(a.x,b.x),bottom:Math.max(a.y,b.y)};
    }
    function inside(rect,p) {
      return p.x>=rect.left&&p.x<=rect.right&&p.y>=rect.top&&p.y<=rect.bottom;
    }
    function intersects(a,b) {
      return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    }
    function relativePoint(event){return{x:event.clientX,y:event.clientY};}
    function nearestSlot(point) {
      const r=mac.getBoundingClientRect();
      const x=point&&r.width ? (point.x-r.left)/r.width : .72;
      const y=point&&r.height ? (point.y-r.top)/r.height : .28;
      const taken=new Set(placed.values());
      const slots=[];
      for(let row=0;row<3;row++)for(let col=0;col<4;col++){
        const index=row*4+col;
        if(taken.has(index))continue;
        const left=(col+.5)/4,top=.21+row*.255;
        slots.push({index,left,top,d:(left-x)**2+(top-y)**2});
      }
      return slots.sort((a,b)=>a.d-b.d)[0];
    }
    function send(point) {
      if(!selected.size)return;
      const additions=[];
      for(const file of files){
        if(!selected.has(file.id)||placed.has(file.id))continue;
        const slot=nearestSlot(point);
        if(!slot)break;
        const item=node('div','received-file');
        item.dataset.omReceived=file.id;
        item.style.left=`${slot.left*100}%`;item.style.top=`${slot.top*100}%`;
        item.append(fileIcon(file),node('span','filename',file.name));
        receivedLayer.append(item);
        placed.set(file.id,slot.index);additions.push(file.name);
      }
      selected.clear();update();
      status.textContent=additions.length ? `${additions.join(', ')} · 已送達 Mac。` : "所選檔案已在 Mac 上。";
    }
    function showCursor(point) {
      clearTimeout(cursorTimer);
      const scene=stage.getBoundingClientRect();
      cursor.hidden=!inside(scene,point);
      if(cursor.hidden)return;
      cursor.style.left=`${point.x-scene.left}px`;
      cursor.style.top=`${point.y-scene.top}px`;
    }
    function restCursor() {
      clearTimeout(cursorTimer);
      cursorTimer=setTimeout(()=>{cursor.hidden=true;},850);
    }
    function interruptGesture() {
      if(!gesture)return;
      suppressClickUntil=Date.now()+450;
      if(gesture.active){
        selected.clear();
        gesture.before.forEach(id=>selected.add(id));
        update();
      }
      hideGesture();
      clearTimeout(cursorTimer);cursor.hidden=true;
    }
    function hideGesture() {
      const old=gesture;gesture=null;
      selection.hidden=ghost.hidden=true;
      drop.classList.remove('om-file-target-over');
      if(old&&stage.hasPointerCapture?.(old.id))stage.releasePointerCapture(old.id);
    }
    function reset() {
      hideGesture();clearTimeout(cursorTimer);cursor.hidden=true;selected.clear();placed.clear();receivedLayer.replaceChildren();status.textContent='';update();
    }
    function markGhost(point) {
      const scene=stage.getBoundingClientRect();
      ghost.style.left=`${point.x-scene.left}px`;ghost.style.top=`${point.y-scene.top}px`;
      ghost.hidden=false;
      drop.classList.toggle('om-file-target-over',inside(mac.getBoundingClientRect(),point));
    }
    function markMarquee(point) {
      const folderBounds=grid.getBoundingClientRect(), scene=stage.getBoundingClientRect();
      const finite={x:Math.max(folderBounds.left,Math.min(folderBounds.right,point.x)),y:Math.max(folderBounds.top,Math.min(folderBounds.bottom,point.y))};
      const area=rectOf(gesture.start,finite);
      selection.hidden=false;
      selection.style.left=`${area.left-scene.left}px`;selection.style.top=`${area.top-scene.top}px`;
      selection.style.width=`${area.right-area.left}px`;selection.style.height=`${area.bottom-area.top}px`;
      selected.clear();
      if(gesture.additive)gesture.before.forEach(id=>selected.add(id));
      for(const [id,item] of items)if(intersects(area,item.getBoundingClientRect()))selected.add(id);
      update();
    }
    grid.addEventListener('click',event=>{
      if(Date.now()<suppressClickUntil&&event.detail!==0)return;
      const file=event.target.closest('[data-om-file]');
      if(file)flip(file.dataset.omFile);
    });
    drop.addEventListener('click',event=>{if(Date.now()>=suppressClickUntil||event.detail===0)send();});
    stage.addEventListener('pointerdown',()=>{if(!gesture)suppressClickUntil=0;},{capture:true});
    stage.addEventListener('lostpointercapture',event=>{if(gesture?.id===event.pointerId&&event.target===stage)interruptGesture();});
    window.addEventListener('blur',interruptGesture);
    grid.addEventListener('pointerdown',event=>{
      if(gesture||!['mouse','touch','pen'].includes(event.pointerType)||event.button!==0||event.isPrimary===false)return;
      const file=event.target.closest('[data-om-file]');
      const touch=event.pointerType!=='mouse';
      const start=relativePoint(event);
      gesture={id:event.pointerId,start,touch,file:file?.dataset.omFile,active:false,additive:event.ctrlKey||event.metaKey||event.shiftKey,before:new Set(selected)};
      if(touch){event.preventDefault();showCursor(start);}
    });
    window.addEventListener('pointermove',event=>{
      if(!gesture||gesture.id!==event.pointerId)return;
      const point=relativePoint(event);
      if(gesture.touch)showCursor(point);
      if(!gesture.active){
        if(Math.hypot(point.x-gesture.start.x,point.y-gesture.start.y)<6)return;
        gesture.active=true;
        if (event.isTrusted) stage.setPointerCapture?.(event.pointerId);
        if(gesture.file){
          if(!selected.has(gesture.file)){selected.clear();selected.add(gesture.file);update();}
          ghost.replaceChildren(fileIcon(files.find(f=>f.id===gesture.file)),node('span','ghost-label',`已選取 ${selected.size} 個`));
        }
      }
      if(gesture.file)markGhost(point);else markMarquee(point);
    });
    window.addEventListener('pointerup',event=>{
      if(!gesture||gesture.id!==event.pointerId)return;
      const current=gesture;const point=relativePoint(event);
      hideGesture();
      if(current.touch){
        showCursor(point);restCursor();
        suppressClickUntil=Date.now()+450;
        if(!current.active&&current.file&&inside(items.get(current.file).getBoundingClientRect(),point))flip(current.file);
      }
      if(!current.active)return;
      suppressClickUntil=Date.now()+450;
      if(current.file){
        if(inside(mac.getBoundingClientRect(),point))send(point);
        else status.textContent="請放到 Mac 螢幕範圍內以傳送檔案。";
      }else status.textContent=selected.size?`已選取 ${selected.size} 個。拖曳其中一個即可一起移動。`:"未選取檔案。";
    });
    window.addEventListener('pointercancel',event=>{if(gesture?.id===event.pointerId)interruptGesture();});
    root.addEventListener('keydown',event=>{
      if(event.key==='Escape'){
        if(gesture)interruptGesture();
        else {selected.clear();update();status.textContent='';}
      }
    });
    update();
    const instance={reset};mounts.set(panel,instance);return instance;
  }
  window.OneMouseFileDemo={mount};
})();

(() => {
  'use strict';

  const initial = { pc: [50, 47], mac: [18, 43], phone: [48, 83], tablet: [83, 47] };
  const defaultSides = { mac: 'left', phone: 'bottom', tablet: 'right' };
  const edges = { left: [0, -1], right: [0, 1], top: [1, -1], bottom: [1, 1] };
  const edgeKeys = Object.keys(edges);
  const names = { pc: 'Windows PC', mac: 'Mac', phone: "Android 手機", tablet: "Android 平板" };
  const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  for (const root of document.querySelectorAll('[data-layout-demo]')) {
    const board = root.querySelector('[data-layout-board]');
    const cursor = root.querySelector('[data-layout-cursor]');
    const svg = root.querySelector('[data-layout-lines]');
    const reset = root.querySelector('[data-layout-reset]');
    const status = root.querySelector('[data-layout-status]');
    if (!board || !cursor || !svg || !reset || !status) continue;
    const keys = Object.keys(initial);
    const devices = Object.fromEntries(keys.map(id => [id, board.querySelector(`[data-layout-device="${id}"]`)]));
    if (keys.some(id => !devices[id])) continue;
    const movable = keys.filter(id => id !== 'pc');
    const lines = Object.fromEntries(movable.map(id => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      svg.append(line);
      return [id, line];
    }));
    let positions = { pc: initial.pc };
    let docks, lastSize;
    let current = 'pc';
    let gesture = null;

    const writePosition = (element, [x, y]) => {
      element.style.left = `${x}%`;
      element.style.top = `${y}%`;
    };
    const draw = () => {
      for (const id of keys) writePosition(devices[id], positions[id]);
      for (const id of movable) {
        const [x1, y1] = positions.pc;
        const [x2, y2] = positions[id];
        Object.entries({ x1, y1, x2, y2 }).forEach(([key, value]) => lines[id].setAttribute(key, value));
      }
    };
    const showCursor = (position, id = current) => {
      writePosition(cursor, position);
      cursor.hidden = false;
      if (id !== current || !cursor.dataset.device) {
        current = id;
        cursor.dataset.device = id;
        cursor.dataset.shape = id === 'pc' || id === 'mac' ? 'arrow' : 'dot';
        board.dataset.layoutActive = id;
        for (const key of keys) devices[key].toggleAttribute('data-layout-active', key === id);
        status.textContent = `游標：${names[id]}`;
      }
    };

    function measure() {
      const box = board.getBoundingClientRect();
      const width = board.clientWidth;
      const height = board.clientHeight;
      if (!width || !height) return null;
      const halves = Object.fromEntries(keys.map(id => {
        const rect = devices[id].getBoundingClientRect();
        return [id, [rect.width / width * 50, rect.height / height * 50]];
      }));
      return { x: box.left + board.clientLeft, y: box.top + board.clientTop, width, height, halves };
    }

    function point(event, bounds, bounded = true) {
      const x = (event.clientX - bounds.x) / bounds.width * 100;
      const y = (event.clientY - bounds.y) / bounds.height * 100;
      return bounded ? [clamp(x, 0, 100), clamp(y, 0, 100)] : [x, y];
    }

    function track(position, { halves }) {
      const id = keys.find(key => {
        const [x, y] = positions[key];
        const [rx, ry] = halves[key];
        return Math.abs(position[0] - x) <= rx && Math.abs(position[1] - y) <= ry;
      });
      showCursor(position, id);
    }

    function nearestDock(id, target, bounds, occupied, sides = edgeKeys) {
      const { width, height, halves } = bounds;
      const dims = [width, height];
      const gap = dims.map(size => 100 / size); // one actual CSS pixel
      const margin = gap.map(n => n * 3);
      const own = halves[id], pc = halves.pc;
      const candidates = [];
      for (const side of sides) {
        const [normal, sign] = edges[side];
        const tangent = 1 - normal;
        const fixed = initial.pc[normal] + sign * (pc[normal] + own[normal] + gap[normal]);
        if (fixed < own[normal] + margin[normal] || fixed > 100 - own[normal] - margin[normal]) continue;
        const pcAlong = initial.pc[tangent];
        // Keep a visible length of edge contact, not merely corner-to-corner.
        const reach = pc[tangent] + own[tangent] - Math.min(gap[tangent] * 6, own[tangent], pc[tangent]);
        const low = Math.max(own[tangent] + margin[tangent], pcAlong - reach);
        const high = Math.min(100 - own[tangent] - margin[tangent], pcAlong + reach);
        if (low > high) continue;
        let intervals = [[low, high]];
        for (const [other, center] of Object.entries(occupied)) {
          if (other === id || other === 'pc') continue;
          const size = halves[other];
          if (Math.abs(fixed - center[normal]) >= own[normal] + size[normal] + gap[normal] - 1e-7) continue;
          const radius = own[tangent] + size[tangent] + gap[tangent];
          const left = center[tangent] - radius, right = center[tangent] + radius;
          intervals = intervals.flatMap(([a, b]) => {
            const next = [];
            if (a <= Math.min(b, left)) next.push([a, Math.min(b, left)]);
            if (Math.max(a, right) <= b) next.push([Math.max(a, right), b]);
            return next;
          });
        }
        for (const [a, b] of intervals) {
          const pos = [];
          pos[normal] = fixed;
          pos[tangent] = clamp(target[tangent], a, b);
          candidates.push({ side, pos, cost: distance(pos, target, width, height) });
        }
      }
      return candidates.sort((a, b) => a.cost - b.cost)[0];
    }

    function dragDevice(id, target, { width, height, halves }) {
      const [ox, oy] = positions[id];
      const [rx, ry] = halves[id];
      const gx = 3 / width * 100, gy = 3 / height * 100;
      const x = clamp(target[0], rx + gx, 100 - rx - gx);
      const y = clamp(target[1], ry + gy, 100 - ry - gy);
      const fitting = ([cx, cy]) => keys.every(key => {
        if (key === id) return true;
        const [px, py] = positions[key];
        return Math.abs(cx - px) + 1e-7 >= rx + halves[key][0] || Math.abs(cy - py) + 1e-7 >= ry + halves[key][1];
      });
      const best = [[x, y], [x, oy], [ox, y]].filter(fitting)
        .sort((a, b) => distance(a, target, width, height) - distance(b, target, width, height))[0];
      if (best) positions[id] = best;
      draw();
      showCursor(positions[id], id);
    }

    function applyDock(id, dock) {
      if (!dock) return false;
      docks[id] = dock;
      positions[id] = dock.pos;
      draw();
      showCursor(dock.pos, id);
      return true;
    }

    function reflow(bounds) {
      // Try every ordering: preserving all current sides takes priority over
      // sliding a neighbor by as little as possible.
      let best;
      for (const first of movable) {
        for (const second of movable.filter(id => id !== first)) {
          const third = movable.find(id => id !== first && id !== second);
          const occupied = { pc: initial.pc };
          let noFit = false, switched = 0, cost = 0;
          const fitted = {};
          for (const id of [first, second, third]) {
            const previous = docks[id];
            const choices = [previous.side, ...edgeKeys.filter(side => side !== previous.side)];
            const dock = nearestDock(id, previous.pos, bounds, occupied, choices.slice(0, 1))
              || nearestDock(id, previous.pos, bounds, occupied, choices.slice(1));
            if (!dock) { noFit = true; break; }
            switched += Number(dock.side !== previous.side);
            cost += dock.cost;
            fitted[id] = dock;
            occupied[id] = dock.pos;
          }
          if (!noFit && (!best || switched < best.switched || (switched === best.switched && cost < best.cost))) {
            best = { occupied, fitted, switched, cost };
          }
        }
      }
      if (!best) return;
      positions = best.occupied;
      docks = best.fitted;
      draw();
      showCursor(positions[current], current);
    }

    function distance(a, b, width, height) {
      return Math.hypot((a[0] - b[0]) * width, (a[1] - b[1]) * height);
    }

    function end(event, drop = false) {
      if (!gesture || gesture.pointer !== event.pointerId) return;
      const { drag, moved, target } = gesture;
      gesture = null;
      delete board.dataset.layoutDragging;
      if (board.hasPointerCapture(event.pointerId)) board.releasePointerCapture(event.pointerId);
      if (!drag || !moved) return;
      const bounds = drop && measure();
      applyDock(drag, (bounds && nearestDock(drag, target, bounds, positions)) || docks[drag]);
    }

    board.addEventListener('pointerdown', event => {
      if (gesture || event.button !== 0 || event.isPrimary === false) return;
      const bounds = measure();
      if (!bounds) return;
      const id = event.target.closest('[data-layout-device]')?.dataset.layoutDevice;
      const position = point(event, bounds, false);
      const drag = movable.includes(id) ? id : null;
      gesture = {
        pointer: event.pointerId, drag, moved: false,
        start: [event.clientX, event.clientY],
        offset: drag ? [position[0] - positions[id][0], position[1] - positions[id][1]] : [0, 0],
      };
      if (drag) showCursor(point(event, bounds), id);
      else track(point(event, bounds), bounds);
      if (event.isTrusted) board.setPointerCapture(event.pointerId);
    });

    function move(event) {
      if (gesture && gesture.pointer !== event.pointerId) return;
      if (!gesture && event.pointerType === 'touch') return;
      const bounds = measure();
      if (!bounds) return;
      if (!gesture?.drag) {
        track(point(event, bounds), bounds);
        return;
      }
      if (!gesture.moved && Math.hypot(event.clientX - gesture.start[0], event.clientY - gesture.start[1]) < 4) return;
      gesture.moved = true;
      board.dataset.layoutDragging = gesture.drag;
      const [x, y] = point(event, bounds, false);
      gesture.target = [x - gesture.offset[0], y - gesture.offset[1]];
      dragDevice(gesture.drag, gesture.target, bounds);
    }

    board.addEventListener('pointermove', move);
    board.addEventListener('pointerup', event => {
      if (!gesture || gesture.pointer !== event.pointerId) return;
      move(event);
      end(event, true);
    });
    board.addEventListener('pointercancel', event => end(event));
    board.addEventListener('lostpointercapture', event => end(event));

    board.addEventListener('keydown', event => {
      const direction = arrows[event.key];
      if (!direction || event.altKey || event.ctrlKey || event.metaKey || gesture) return;
      const [dx, dy] = direction;
      const bounds = measure();
      if (!bounds) return;
      const id = event.target.dataset.layoutDevice;
      if (movable.includes(id)) {
        event.preventDefault();
        const [x, y] = positions[id];
        const step = event.shiftKey ? 20 : 8;
        const prev = docks[id];
        const requested = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'top', ArrowDown: 'bottom' }[event.key];
        const tangent = edges[prev.side][0] === 0 ? dy : dx;
        const target = [x + dx * step / bounds.width * 100, y + dy * step / bounds.height * 100];
        // Slide along the current edge; if stopped at its limit, move around
        // the corner. An arrow towards the opposite edge docks there directly.
        let dock = tangent ? nearestDock(id, target, bounds, positions, [prev.side]) : null;
        if (!dock || distance(dock.pos, prev.pos, bounds.width, bounds.height) < .01) {
          if (prev.side !== requested) dock = nearestDock(id, target, bounds, positions, [requested]);
        }
        if (dock && distance(dock.pos, prev.pos, bounds.width, bounds.height) >= .01 && applyDock(id, dock)) {
          status.textContent = `已移動 ${names[id]}。`;
        }
        return;
      }
      if (event.target !== board) return;
      event.preventDefault();
      const [x, y] = positions[current];
      const ranked = keys.filter(key => key !== current).map(key => {
        const [tx, ty] = positions[key];
        const px = (tx - x) * bounds.width;
        const py = (ty - y) * bounds.height;
        const forward = px * dx + py * dy;
        const sideways = Math.abs(px * dy - py * dx);
        return { key, forward, sideways, score: Math.hypot(px, py) + sideways * 0.8 };
      }).filter(candidate => candidate.forward > 0);
      const aligned = ranked.filter(candidate => candidate.sideways <= candidate.forward);
      const next = (aligned.length ? aligned : ranked).sort((a, b) => a.score - b.score)[0];
      if (next) showCursor(positions[next.key], next.key);
    });

    function resized(force = false) {
      const bounds = measure();
      if (!bounds) return;
      const size = JSON.stringify([bounds.width, bounds.height, bounds.halves]);
      if (!force && lastSize === size) return;
      lastSize = size;
      if (gesture) end({ pointerId: gesture.pointer });
      reflow(bounds);
    }
    function restore() {
      if (gesture) end({ pointerId: gesture.pointer });
      docks = Object.fromEntries(movable.map(id => [id, { side: defaultSides[id], pos: initial[id] }]));
      delete cursor.dataset.device;
      current = 'pc';
      resized(true);
    }
    reset.addEventListener('click', restore);
    root.setAttribute('data-ready', '');
    restore();
    if (typeof ResizeObserver === 'function') new ResizeObserver(() => resized()).observe(board);
    else window.addEventListener('resize', () => resized());
  }
})();

(() => {
  'use strict';
  const instances=new WeakMap();
  const quad=[[910,372],[1480,370],[1435,789],[854,739]],W=640,H=440;
  const pcQuad=[[138,146],[849,100],[841,595],[136,565]];
  function inside(x,y,vertices){
    return vertices.every(([ax,ay],i)=>{
      const [bx,by]=vertices[(i+1)%vertices.length];
      return (bx-ax)*(y-ay)-(by-ay)*(x-ax)>=0;
    });
  }
  const art='/assets/preview/android-tablet-gesture-desk.webp';
  function projection(width,height){
    const [p0,p1,p2,p3]=quad.map(([x,y])=>[x*width/1536,y*height/1024]);
    const dx1=p1[0]-p2[0], dx2=p3[0]-p2[0], dx3=p0[0]-p1[0]+p2[0]-p3[0];
    const dy1=p1[1]-p2[1], dy2=p3[1]-p2[1], dy3=p0[1]-p1[1]+p2[1]-p3[1];
    const d=dx1*dy2-dx2*dy1;
    const g=(dx3*dy2-dx2*dy3)/d,h=(dx1*dy3-dx3*dy1)/d;
    const a=p1[0]-p0[0]+g*p1[0],b=p3[0]-p0[0]+h*p3[0],c=p0[0];
    const e=p1[1]-p0[1]+g*p1[1],f=p3[1]-p0[1]+h*p3[1],k=p0[1];
    return {css:'matrix3d('+[a/W,e/W,0,g/W,b/H,f/H,0,h/H,0,0,1,0,c,k,0,1].join(',')+')',
      inverse(x,y){
        const A=a-g*x,B=b-h*x,C=x-c,D=e-g*y,E=f-h*y,F=y-k,q=A*E-B*D;
        return {x:(C*E-B*F)/q*W,y:(A*F-C*D)/q*H};
      }};
  }
  function recognize(points){
    if(points.length<2)return '';
    const start=points[0],end=points.at(-1);
    const dx=end.x-start.x,dy=end.y-start.y;
    const horizontal=36,vertical=36;
    for(const turn of points.slice(1,-1)){
      const down=turn.y-start.y,right=end.x-turn.x;
      if(down>=vertical&&right>=horizontal&&Math.abs(turn.x-start.x)<down*.55&&Math.abs(end.y-turn.y)<right*.55)return 'home';
    }
    if(dx<=-horizontal&&Math.abs(dx)>Math.abs(dy)*1.6)return 'back';
    if(Math.abs(dy)>=vertical&&Math.abs(dy)>Math.abs(dx)*1.6)return dy<0?'up':'down';
    return '';
  }
  function mount(host){
    if(!host||host.nodeType!==1)throw new TypeError('A gesture demo mount is required.');
    if(instances.has(host))return instances.get(host);
    const root=document.createElement('div');
    root.className='om-tablet-gesture';
    root.innerHTML=`
      <div class="tg-scene" data-scene>
        <img class="tg-backdrop" src="${art}" width="1536" height="1024" alt="" decoding="async" data-photo>
        <div class="tg-tablet" data-tablet>
          <div class="tg-surface" data-surface data-mode="browser" tabindex="0" role="group" aria-label="Android 平板手勢：向左返回，向上或下捲動，向下再向右可將應用程式最小化。">
            <div class="tg-browser" data-browser aria-hidden="true">
              <div class="tg-toolbar"><b>‹　›</b><span data-address>網際網路 · 旅行日誌</span><b>⋮</b></div>
              <div class="tg-page-wrap" data-scroll><div class="tg-page" data-page></div></div>
            </div>
            <div class="tg-home" data-home hidden><button type="button" class="tg-internet" data-internet><span class="tg-globe" aria-hidden="true">◎</span>網際網路</button></div>
            <svg class="tg-path" viewBox="0 0 640 440" aria-hidden="true"><polyline data-path points="" fill="none" stroke="#00c3a0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle data-origin cx="0" cy="0" r="7" fill="#00605b" stroke="#dbfff5" stroke-width="2" visibility="hidden"/></svg>
          </div>
        </div>
        <span class="tg-cursor" data-cursor data-device="tablet" aria-hidden="true" hidden>
          <svg viewBox="0 0 24 30" width="24" height="30" focusable="false">
            <path class="tg-cursor-arrow" d="M1 1L22 19 13 18.4 17 26 13.6 28 9.3 20.3 3 27Z" fill="#fff" stroke="#142a43" stroke-width="2" stroke-linejoin="round"/>
            <circle class="tg-cursor-dot" cx="12" cy="15" r="7.5" fill="#fff" fill-opacity=".82" stroke="#142a43" stroke-width="2"/>
          </svg>
        </span>
        <button type="button" class="tg-right-button" data-right-button aria-pressed="false" aria-label="按右鍵" hidden>
          <svg viewBox="0 0 40 56" aria-hidden="true"><rect x="3" y="2" width="34" height="51" rx="16" fill="#fff" stroke="#214257" stroke-width="3"/><path class="tg-right-fill" d="M20 3v22h16V17C35 9 29 4 20 3Z"/><path d="M20 3v22m-16 0h32" stroke="#214257" stroke-width="2"/><path d="M20 9v7" stroke="#214257" stroke-width="3" stroke-linecap="round"/></svg>
          <span>按右鍵</span>
        </button>
      </div>
      <p class="tg-note">在 PC 與平板間移動游標。畫手勢時按住滑鼠右鍵，或使用畫面上的右鍵按鈕。</p>
      <div class="tg-controls" role="group" aria-label="手勢捷徑">
        <button type="button" data-action="back">← 返回</button>
        <button type="button" data-action="up">↑ 向上</button>
        <button type="button" data-action="down">↓ 向下</button>
        <button type="button" data-action="home">↓→ 最小化應用程式</button>
        <button type="button" data-reopen hidden>開啟網際網路</button>
      </div>
      <p class="tg-status" data-status role="status" aria-atomic="true"></p>`;
    host.append(root);
    const $=name=>root.querySelector('[data-'+name+']');
    const scene=$('scene'),photo=$('photo'),tablet=$('tablet'),surface=$('surface'),scroll=$('scroll'),page=$('page'),browser=$('browser'),home=$('home'),internet=$('internet'),reopenButton=$('reopen'),rightButton=$('right-button'),path=$('path'),origin=$('origin'),status=$('status'),cursor=$('cursor');
    const actions=[...root.querySelectorAll('[data-action]')];
    const articles=[
      {where:"旅行日誌",tag:"01 / 海岸",title:"寧靜的海灘",text:"風漸漸停了，柔和的海浪拍打著沙灘。"},
      {where:"旅行日誌",tag:"02 / 散步",title:"晨間漫步",text:"陽光穿過樹梢，小徑盡頭有一張長椅。"}
    ];
    let map=null,fallback=false,index=1,saved=[0,0],onHome=false,armed=false,drag=null;
    function tell(text){status.textContent=text;}
    function renderPage(){
      const a=articles[index];
      $('address').textContent="網際網路 · "+a.where;
      page.innerHTML=`<p class="tg-tag">${a.tag}</p><h3>${a.title}</h3><div class="tg-landscape" aria-hidden="true"></div><p>${a.text}</p><h4>稍作休息</h4><p>每一步都有不同的風景。停下來感受一下陽光和微風吧。</p><div class="tg-landscape tg-landscape--lower" aria-hidden="true"></div><p>一起記下今天走過的路吧。</p>`;
      if(!onHome)scroll.scrollTop=saved[index];
    }
    function renderMode(){
      browser.hidden=onHome;home.hidden=!onHome;reopenButton.hidden=!onHome;
      surface.dataset.mode=onHome?'home':'browser';actions.forEach(button=>button.hidden=onHome);
      if(!onHome)scroll.scrollTop=saved[index];
      rightButton.hidden=onHome;
    }
    function reopen(focus){
      if(!onHome)return;
      onHome=false;renderMode();
      tell("已重新開啟網際網路。");
      if(focus)surface.focus({preventScroll:true});
    }
    function act(action,focus=false){
      if(onHome)return;
      if(action==='back'){
        if(index===0){tell("沒有上一頁。");return;}
        saved[index]=scroll.scrollTop;index=0;renderPage();tell("已返回上一頁。");
      }else if(action==='up'||action==='down'){
        const before=scroll.scrollTop;
        scroll.scrollTop=before+(action==='up'?-120:120);
        saved[index]=scroll.scrollTop;
        tell(before===scroll.scrollTop?(action==='up'?"已到頁首。":"已到頁尾。"):(action==='up'?"已向上捲動。":"已向下捲動。"));
      }else if(action==='home'){
        saved[index]=scroll.scrollTop;onHome=true;setArmed(false);renderMode();
        tell("應用程式已最小化。選取平板上的「網際網路」即可重新開啟。");
        if(focus)internet.focus({preventScroll:true});
      }
    }
    function align(){
      if(fallback)return;
      const r=scene.getBoundingClientRect();if(!r.width||!r.height)return;
      map=projection(r.width,r.height);tablet.style.transform=map.css;
      if(!scene.dataset.mapped){cursor.hidden=false;scene.dataset.mapped='true';}
    }
    function fail(){
      fallback=true;map=null;scene.classList.add('tg-no-photo');tablet.style.transform='';hideCursor();
    }
    function hideCursor(){
      cursor.hidden=false;
      delete scene.dataset.cursorActive;
    }
    function moveCursor(e){
      if(e.isPrimary===false)return;
      const r=scene.getBoundingClientRect();
      if(!r.width||!r.height)return;
      const x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
      const within=x>=0&&x<=1&&y>=0&&y<=1;
      const target=e.target.closest('[data-right-button]');
      const device=!within||target?'':(fallback||inside(x*1536,y*1024,quad))?'tablet':inside(x*1536,y*1024,pcQuad)?'pc':'';
      if(!device){hideCursor();return;}
      cursor.dataset.device=device;
      cursor.style.left=(100*x)+'%';
      cursor.style.top=(100*y)+'%';
      cursor.hidden=false;
      scene.dataset.cursorActive='true';
    }
    for(const type of ['pointermove'])scene.addEventListener(type,moveCursor);
    for(const type of ['pointerleave','pointercancel'])scene.addEventListener(type,hideCursor);
    scene.addEventListener('pointerup',e=>{if(e.pointerType!=='mouse')hideCursor();});
    window.addEventListener('blur',hideCursor);
    function point(e){
      const r=(map?scene:surface).getBoundingClientRect();
      const x=e.clientX-r.left,y=e.clientY-r.top;
      const p=map?map.inverse(x,y):{x:x/(r.width||1)*W,y:y/(r.height||1)*H};
      return {x:Math.max(0,Math.min(W,p.x)),y:Math.max(0,Math.min(H,p.y))};
    }
    function paint(points){
      path.setAttribute('points',points.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
      origin.setAttribute('visibility',points.length?'visible':'hidden');
      if(points.length){origin.setAttribute('cx',points[0].x);origin.setAttribute('cy',points[0].y);}
    }
    function setArmed(value){
      armed=value;surface.classList.toggle('tg-armed',value);
      rightButton.setAttribute('aria-pressed',String(value));
    }
    rightButton.addEventListener('click',()=>{
      if(onHome)return;
      if(armed){cancel();tell("已取消右鍵。");}
      else {setArmed(true);tell("已按住右鍵。請在平板上畫出方向。");}
    });
    function cancel(){
      const id=drag?.id;drag=null;setArmed(false);paint([]);surface.classList.remove('tg-drawing');surface.classList.remove('tg-drawing-touch');
      if(id!==undefined&&surface.hasPointerCapture?.(id))surface.releasePointerCapture(id);
    }
    surface.addEventListener('contextmenu',e=>{if(!onHome&&e.button===2)e.preventDefault();});
    surface.addEventListener('pointerdown',e=>{
      if(onHome||drag||e.isPrimary===false)return;
      const mouse=e.pointerType==='mouse';
      const touch=e.pointerType==='touch'||e.pointerType==='pen';
      const physical=mouse&&e.button===2;
      const simulated=armed&&(mouse||touch)&&e.button===0;
      if(!physical&&!simulated)return;
      e.preventDefault();
      drag={id:e.pointerId,points:[point(e)]};paint(drag.points);
      surface.classList.add('tg-drawing');
      surface.classList.toggle('tg-drawing-touch',simulated);
      if (e.isTrusted) surface.setPointerCapture?.(e.pointerId);
    });
    surface.addEventListener('pointermove',e=>{
      if(drag?.id!==e.pointerId)return;
      const p=point(e),q=drag.points.at(-1);
      if(Math.hypot(p.x-q.x,p.y-q.y)<8)return;
      drag.points.push(p);
      if(drag.points.length>192)drag.points.splice(1,1);
      paint(drag.points);
    });
    surface.addEventListener('pointerup',e=>{
      if(drag?.id!==e.pointerId)return;
      const a=recognize([...drag.points,point(e)]);
      cancel();
      if(a)act(a);
      else tell("向左、向上、向下，或先向下再向右畫。");
    });
    for(const event of ['pointercancel','lostpointercapture'])surface.addEventListener(event,e=>{if(drag?.id===e.pointerId)cancel();});
    window.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&(armed||drag)){e.preventDefault();cancel();tell("已取消右鍵。");}
    });
    window.addEventListener('blur',cancel);
    surface.addEventListener('keydown',e=>{
      if(e.target!==surface||e.altKey||e.ctrlKey||e.metaKey)return;
      const a={ArrowLeft:'back',ArrowUp:'up',ArrowDown:'down',Home:'home'}[e.key];
      if(!onHome&&a){e.preventDefault();act(a,true);}
    });
    actions.forEach(b=>b.addEventListener('click',()=>act(b.dataset.action,true)));
    internet.addEventListener('click',()=>reopen(true));
    reopenButton.addEventListener('click',()=>reopen(true));
    photo.addEventListener('error',fail);
    if(photo.complete&&!photo.naturalWidth)fail();
    renderPage();align();saved[1]=Math.floor((scroll.scrollHeight-scroll.clientHeight)/2);renderMode();
    if(typeof ResizeObserver==='function')new ResizeObserver(align).observe(scene);
    else window.addEventListener('resize',align,{passive:true});
    const api={};instances.set(host,api);return api;
  }
  window.OneMouseTabletGestureDemo={mount};
})();
