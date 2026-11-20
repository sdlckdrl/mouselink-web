(() => {
  'use strict';
  const PHOTO='/assets/preview/android-notification-desk.webp';
  const NOTE='회의는 오후 3시, 2층 회의실입니다.';
  const MAILS=[
    ['팀 메일','오늘 회의 자료를 보냈어요.'],
    ['팀 메일','다음 주 일정이 업데이트됐어요.'],
    ['팀 메일','수정한 자료를 확인해 주세요.'],
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
  function mount(panel){
    if(!panel||panel.nodeType!==1)throw new TypeError('Expected an Android demo panel.');
    if(instances.has(panel))return instances.get(panel);
    const root=el('div','demo');
    const modes=el('div','modes');
    modes.setAttribute('role','group');modes.setAttribute('aria-label','체험 선택');
    const alertMode=button('mode','알림'), clipMode=button('mode','복사·붙여넣기');
    modes.append(alertMode,clipMode);
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
    const smallPhone=alertCard('compact-alert','Android · 메일');
    const smallPC=alertCard('compact-alert','Windows · OneMouse');

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
    stage.append(img,android.shell,windows.shell,source.box,dest.box);

    const compactNotifications=el('div','compact-alerts');
    compactNotifications.append(smallPhone.shell,smallPC.shell);
    const compactSource=clipBox('compact-note','Android · 예시 메모',true);
    const compactDest=clipBox('compact-note','Windows · 메모장',false);
    const compactClipboard=el('div','compact-clipboard');
    compactClipboard.append(compactSource.box,compactDest.box);

    const controls=el('div','alert-controls');
    const pause=button('control','일시정지'), replay=button('control','알림 다시 보기');
    controls.append(pause,replay);
    const hint=el('p','hint');
    const status=el('p','status');
    status.setAttribute('role','status');status.setAttribute('aria-atomic','true');
    root.append(modes,hint,stage,compactNotifications,compactClipboard,controls,status);
    panel.append(root);

    let mode='alerts', copied=null, pasted='', visible=false, mailIndex=0;
    const motion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let paused=Boolean(motion?.matches);
    let timers=[];
    const schedule=(fn,delay)=>{const id=window.setTimeout(fn,delay);timers.push(id);};
    const clearTimers=()=>{timers.forEach(id=>window.clearTimeout(id));timers=[];};
    const allAlerts=[android,windows,smallPhone,smallPC];
    function hideAlerts(){for(const card of allAlerts)card.shell.hidden=true;}
    function stopTimers(){clearTimers();hideAlerts();}
    function allowed(){return mode==='alerts'&&visible&&!document.hidden;}
    function updateControlSize(){
      const narrow=root.getBoundingClientRect().width<=650;
      for(const box of [source,dest]){
        box.field.tabIndex=box.action.tabIndex=narrow?-1:0;
        box.box.setAttribute('aria-hidden',String(narrow));
      }
    }
    if(typeof ResizeObserver==='function')new ResizeObserver(updateControlSize).observe(root);
    else window.addEventListener('resize',updateControlSize,{passive:true});
    updateControlSize();
    function present(card,mail){card.sender.textContent=mail[0];card.content.textContent=mail[1];card.shell.hidden=false;}
    function fire(manual=false){
      clearTimers();hideAlerts();
      if(!allowed()){if(manual)status.textContent='사진이 보이는 곳에서 예시 알림을 다시 볼 수 있어요.';return;}
      const mail=MAILS[mailIndex++%MAILS.length];
      for(const card of [android,smallPhone])present(card,mail);
      schedule(()=>{if(allowed())for(const card of [windows,smallPC])present(card,mail);},450);
      schedule(()=>{for(const card of [android,smallPhone])card.shell.hidden=true;},3950);
      schedule(()=>{for(const card of [windows,smallPC])card.shell.hidden=true;},4700);
      if(!paused)schedule(()=>{if(allowed()&&!paused)fire();},6650);
      if(manual)status.textContent=`예시 알림: ${mail[1]} Android에서 Windows로 이어집니다.`;
    }
    function syncAlerts(delay=550){
      stopTimers();pause.textContent=paused?'자동 재생':'일시정지';
      if(allowed()&&!paused)schedule(()=>fire(),delay);
    }
    function switchMode(next){
      if(next!==mode){copied=null;pasted='';status.textContent='';}
      mode=next;
      const clipboard=next==='clipboard';
      alertMode.setAttribute('aria-pressed',String(!clipboard));
      clipMode.setAttribute('aria-pressed',String(clipboard));
      source.box.hidden=dest.box.hidden=compactClipboard.hidden=!clipboard;
      compactNotifications.hidden=controls.hidden=clipboard;
      hint.textContent=clipboard?'폰에서 복사하고 PC 메모장에 붙여넣으세요. 이 예시 안에서만 동작해요.':'예시 메일이 폰에 뜨면 잠시 뒤 PC에도 같은 알림이 나타나요.';
      updateClip();syncAlerts();
    }
    function updateClip(){
      for(const d of [dest,compactDest]){d.field.value=pasted;d.action.disabled=!copied;}
    }
    function copy(){
      if(mode!=='clipboard')return;
      copied=NOTE;updateClip();
      status.textContent='예시 메모를 복사했어요. PC 메모장에 붙여넣어 보세요.';
    }
    function paste(){
      if(mode!=='clipboard')return;
      if(!copied){status.textContent='먼저 폰의 예시 메모를 복사하세요.';return;}
      pasted=copied;updateClip();
      status.textContent='같은 글이 PC 메모장에 붙여넣어졌어요.';
    }
    for(const s of [source,compactSource]){
      s.action.addEventListener('click',copy);
      s.field.addEventListener('keydown',event=>{if(shortcut(event,'c')){event.preventDefault();copy();}});
      s.field.addEventListener('copy',event=>{event.preventDefault();copy();});
    }
    for(const d of [dest,compactDest]){
      d.action.addEventListener('click',paste);
      d.field.addEventListener('keydown',event=>{if(shortcut(event,'v')){event.preventDefault();paste();}});
      d.field.addEventListener('paste',event=>{event.preventDefault();paste();});
      d.field.addEventListener('copy',event=>event.preventDefault());
    }
    alertMode.addEventListener('click',()=>switchMode('alerts'));
    clipMode.addEventListener('click',()=>switchMode('clipboard'));
    pause.addEventListener('click',()=>{paused=!paused;status.textContent='';syncAlerts(paused?550:120);});
    replay.addEventListener('click',()=>fire(true));
    document.addEventListener('visibilitychange',()=>syncAlerts());
    motion?.addEventListener?.('change',event=>{if(event.matches){paused=true;syncAlerts();}});
    if(typeof IntersectionObserver==='function'){
      const watch=new IntersectionObserver(entries=>{
        const active=entries.some(entry=>entry.target===stage&&entry.isIntersecting&&entry.intersectionRatio>=.1);
        if(active!==visible){visible=active;syncAlerts();}
      },{threshold:[0,.1]});
      watch.observe(stage);
    }
    // With no observer, keep autoplay off; the replay button can opt in while visible.
    else {
      paused=true;
      replay.addEventListener('click',()=>{
        const r=stage.getBoundingClientRect();
        if(r.bottom>0&&r.right>0&&r.top<window.innerHeight&&r.left<window.innerWidth){visible=true;fire(true);}
      });
    }
    switchMode('alerts');
    const instance={reset(){paused=Boolean(motion?.matches);mailIndex=0;copied=null;pasted='';status.textContent='';switchMode('alerts');}};
    instances.set(panel,instance);
    return instance;
  }
  window.OneMouseAndroidDemo={mount};
})();
