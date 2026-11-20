(() => {
  'use strict';
  const PHOTO='/assets/preview/android-notification-desk.webp';
  const PC = { w:960,h:580,quad:[[155,115],[1122,54],[1097,697],[131,643]] };
  const PHONE = { w:210,h:480,quad:[[1249,400],[1458,399],[1406,888],[1190,870]] };
  const NOTE='회의는 오후 3시, 2층 회의실입니다.';
  const MAILS=[
    ['팀 메일','오늘 오후 회의 자료를 보냈어요. 회의 전에 마지막 페이지를 확인해 주세요.'],
    ['팀 메일','다음 주 일정이 업데이트됐어요. 변경된 장소와 시작 시간을 확인해 주세요.'],
    ['팀 메일','수정한 발표 자료를 보냈어요. 의견이 있으면 오늘 중으로 알려 주세요.'],
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
    const android=alertCard('phone-alert','Android · 메일');
    const windows=alertCard('pc-alert','Windows · OneMouse');

    function clipBox(kind,title,isSource){
      const box=el('div',kind);
      const label=el('div','note-title',title);
      const field=el('textarea','note-field');
      field.readOnly=true;field.spellcheck=false;
      field.rows=2;field.setAttribute('aria-label',title);
      field.value=isSource?NOTE:'';
      if(!isSource)field.placeholder='여기에 붙여넣기';
      const action=button('note-action',isSource?'복사':'붙여넣기');
      box.append(label,field,action);
      return {box,field,action};
    }
    const source=clipBox('phone-note','Android · 예시 메모',true);
    const dest=clipBox('pc-note','Windows · 메모장',false);
    const phoneScreen=el('div','screen-phone'), pcScreen=el('div','screen-pc');
    phoneScreen.append(source.box,android.shell);
    pcScreen.append(dest.box,windows.shell);
    stage.append(img,pcScreen,phoneScreen);

    const compactCopy=button('compact-action','폰에서 복사');
    const compactPaste=button('compact-action','PC에 붙여넣기');
    const compactControls=el('div','compact-controls');
    compactControls.append(compactCopy,compactPaste);

    const hint=el('p','hint','알림은 자동으로 뜹니다. 폰에서 복사하고 PC 메모장에 붙여넣어 보세요.');
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
      status.textContent='예시 메모를 복사했어요. PC 메모장에 붙여넣어 보세요.';
    }
    function paste(){
      if(!copied){status.textContent='먼저 폰의 예시 메모를 복사하세요.';return;}
      pasted=copied;updateClip();
      status.textContent='같은 글이 PC 메모장에 붙여넣어졌어요.';
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
