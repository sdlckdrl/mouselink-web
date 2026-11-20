(() => {
  'use strict';
  const files = [
    {id:'photo', name:'여행 사진.jpg', type:'photo', mark:'JPG'},
    {id:'work', name:'작업 문서.pdf', type:'pdf', mark:'PDF'},
    {id:'note', name:'메모.txt', type:'text', mark:'TXT'},
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
    title.append(folder,node('span','folder-title','파일 탐색기 · 공유 폴더'));
    const grid=node('div','file-grid');
    grid.setAttribute('role','group');
    grid.setAttribute('aria-label','Windows 예시 파일');
    explorer.append(title,grid);
    windows.append(explorer);
    const mac=node('div','mac-screen');
    const drop=button('drop');
    drop.setAttribute('aria-label','선택한 파일을 Mac 바탕화면에 보내기');
    drop.append(node('span','menu-bar','Mac 바탕화면'));
    const receivedLayer=node('div','received');
    receivedLayer.setAttribute('aria-hidden','true');
    mac.append(drop,receivedLayer);
    const selection=node('div','marquee');selection.hidden=true;selection.setAttribute('aria-hidden','true');
    const ghost=node('div','ghost');ghost.hidden=true;ghost.setAttribute('aria-hidden','true');
    stage.append(backdrop, windows, mac, selection, ghost);
    backdrop.addEventListener('error',()=>stage.classList.add('om-file-photo-missing'));
    if (backdrop.complete&&!backdrop.naturalWidth)stage.classList.add('om-file-photo-missing');

    const mobile=node('div','mobile');
    const mobileGroup=node('div','mobile-files');
    mobileGroup.setAttribute('role','group');
    mobileGroup.setAttribute('aria-label','옮길 예시 파일 선택');
    const mobileSend=button('mobile-send','Mac으로 보내기');
    mobile.append(mobileGroup,mobileSend);

    const hint=node('p','hint','왼쪽 폴더에서 파일을 골라 오른쪽 Mac으로 끌어 놓으세요. 클릭이나 탭으로 골라 보낼 수도 있어요.');
    const foot=node('div','foot');
    const status=node('p','status');
    status.setAttribute('role','status');status.setAttribute('aria-atomic','true');
    const resetButton=button('reset','초기화');
    resetButton.hidden=true;
    foot.append(status,resetButton);
    root.append(stage,mobile,hint,foot);
    panel.append(root);
    const selected=new Set();
    const placed=new Map();
    const items=new Map();
    const mobileItems=new Map();
    let gesture=null, suppressClickUntil=0;

    files.forEach(file=>{
      const item=button('source');
      item.dataset.omFile=file.id;
      item.append(fileIcon(file),node('span','filename',file.name));
      grid.append(item); items.set(file.id,item);
      const simple=button('mobile-file',file.name);
      mobileGroup.append(simple);mobileItems.set(file.id,simple);
      simple.addEventListener('click',()=>flip(file.id));
    });
    function update() {
      for (const file of files) {
        const active=selected.has(file.id);
        items.get(file.id).setAttribute('aria-pressed',String(active));
        mobileItems.get(file.id).setAttribute('aria-pressed',String(active));
      }
      drop.classList.toggle('om-file-target-ready',selected.size>0);
      drop.setAttribute('aria-disabled',String(selected.size===0));
      mobileSend.disabled=selected.size===0;
      resetButton.hidden=placed.size===0;
    }
    function flip(id) {
      if (selected.has(id))selected.delete(id);else selected.add(id);
      update();
      status.textContent=selected.size ? `${selected.size}개 선택했어요.` : '';
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
      status.textContent=additions.length ? `${additions.join(', ')} · Mac에 도착했어요.` : '선택한 파일은 이미 Mac에 있어요.';
    }
    function hideGesture() {
      const old=gesture;gesture=null;
      selection.hidden=ghost.hidden=true;
      drop.classList.remove('om-file-target-over');
      if(old&&stage.hasPointerCapture?.(old.id))stage.releasePointerCapture(old.id);
    }
    function reset() {
      hideGesture();selected.clear();placed.clear();receivedLayer.replaceChildren();status.textContent='';update();
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
    mobileSend.addEventListener('click',()=>send());
    resetButton.addEventListener('click',()=>{reset();items.get(files[0].id).focus({preventScroll:true});});
    grid.addEventListener('pointerdown',event=>{
      if(gesture||event.pointerType!=='mouse'||event.button!==0||event.isPrimary===false)return;
      const file=event.target.closest('[data-om-file]');
      gesture={id:event.pointerId,start:relativePoint(event),file:file?.dataset.omFile,active:false,additive:event.ctrlKey||event.metaKey||event.shiftKey,before:new Set(selected)};
    });
    window.addEventListener('pointermove',event=>{
      if(!gesture||gesture.id!==event.pointerId)return;
      const point=relativePoint(event);
      if(!gesture.active){
        if(Math.hypot(point.x-gesture.start.x,point.y-gesture.start.y)<6)return;
        gesture.active=true;
        stage.setPointerCapture?.(event.pointerId);
        if(gesture.file){
          if(!selected.has(gesture.file)){selected.clear();selected.add(gesture.file);update();}
          ghost.replaceChildren(fileIcon(files.find(f=>f.id===gesture.file)),node('span','ghost-label',`${selected.size}개`));
        }
      }
      if(gesture.file)markGhost(point);else markMarquee(point);
    });
    window.addEventListener('pointerup',event=>{
      if(!gesture||gesture.id!==event.pointerId)return;
      const current=gesture;const point=relativePoint(event);
      hideGesture();
      if(!current.active)return;
      suppressClickUntil=Date.now()+300;
      if(current.file){
        if(inside(mac.getBoundingClientRect(),point))send(point);
        else status.textContent='Mac 화면 안에 놓으면 파일이 옮겨져요.';
      }else status.textContent=selected.size?`${selected.size}개 선택했어요. 선택한 파일 하나를 끌면 함께 옮겨져요.`:'선택된 파일이 없어요.';
    });
    window.addEventListener('pointercancel',event=>{if(gesture?.id===event.pointerId)hideGesture();});
    root.addEventListener('keydown',event=>{
      if(event.key==='Escape'){
        if(gesture)hideGesture();
        else {selected.clear();update();status.textContent='';}
      }
    });
    update();
    const instance={reset};mounts.set(panel,instance);return instance;
  }
  window.OneMouseFileDemo={mount};
})();
