(() => {
  'use strict';
  const instances = new WeakMap();
  const GAME_ART = `<div class="game-frame">
    <svg aria-hidden="true" viewBox="0 0 400 224" preserveAspectRatio="none">
      <rect width="400" height="224" fill="#233f5f"/>
      <circle cx="293" cy="80" r="30" fill="#ffc98b" opacity=".78"/>
      <path fill="#30475c" d="M0 104 36 72 70 104 116 61 155 100 194 82 230 103 269 78 312 110 340 76 365 100 400 77V147H0Z"/>
      <path fill="#374b52" d="M0 120 55 107 88 125 151 106 193 126 243 112 278 121 330 108 400 122V224H0Z"/>
      <path fill="#212a37" stroke="#546577" stroke-width="2" d="M168 104H232L382 224H18Z"/>
      <path fill="none" stroke="#c0ced9" stroke-width="2.2" d="M168 104 18 224M232 104l150 120"/>
      <g data-road fill="none" stroke="#d5dbe3" stroke-opacity=".8" stroke-width="1.8" stroke-linecap="round"></g>
      <g data-traffic></g>
      <g data-player>
        <ellipse cx="0" cy="6" rx="18" ry="8" fill="#091421" opacity=".7"/>
        <path d="M-16-3-11-17H11L16-3 17 8H-17Z" fill="#6bf5c6" stroke="#c7fae5" stroke-width="1.2"/>
        <path d="M-8-14H8l4 9h-24Z" fill="#16405a"/>
        <path d="M-16 3h6m20 0h6" stroke="#f8a6a5" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M-5 7h10" stroke="#d2ffea" stroke-width="2"/>
      </g>
    </svg>
    <span class="game-title">LANE RUSH</span>
    <span class="game-score" data-score>점수 0</span>
    <div class="game-overlay" data-game-overlay><span data-game-title>미니 레이싱</span><small data-game-subtitle>Android 게임패드로 시작</small></div>
  </div>`;
  const picks=[
    {id:'race',name:'레이싱',hint:'차선 바꾸기',icon:'<path d="M4 17h16M6 16l1.5-5 2-3h5l2 3 1.5 5M8 17v2m8-2v2M8 13h8"/><path d="M10 4h4"/>'},
    {id:'breakout',name:'벽돌 깨기',hint:'손가락으로 끌기',icon:'<path d="M4 6h4v3H4zM10 6h4v3h-4zM16 6h4v3h-4zM7 18h10"/><circle cx="14" cy="13" r="1.4"/>'},
    {id:'rabbit',name:'토끼 점프',hint:'탭해서 점프',icon:'<path d="M7 13C5 10 5 5 7 4c2 0 3 4 3 7m2 0c1-4 3-7 5-6 2 2 0 6-2 8m-8 0a6 4 0 1 0 8 0"/><path d="M9 16h.01m4 0h.01"/>'},
  ];
  function library(interactive){
    return '<div class="arcade-library"><div class="arcade-brand">ONEMOUSE ARCADE</div><div class="arcade-tiles">'+picks.map(game=>{
      const content='<svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">'+game.icon+'</svg><b>'+game.name+'</b><small>'+game.hint+'</small>';
      return interactive?'<button type="button" class="arcade-tile" data-pick="'+game.id+'" aria-label="'+game.name+'">'+content+'</button>':'<div class="arcade-tile" data-cover="'+game.id+'">'+content+'</div>';
    }).join('')+'</div></div>';
  }
  function mount(node) {
    if (!node || node.nodeType !== 1) throw new TypeError('A racing card element is required.');
    if (instances.has(node)) return instances.get(node);
    const desk = document.createElement('div');
    desk.className='om-race-card';
    desk.innerHTML=`
      <div class="race-scene" data-scene role="group" aria-label="사진 속 PC와 폰의 원격 게임 체험">
        <img class="race-backdrop" data-backdrop src="/assets/preview/remote-racing-example.webp" width="1199" height="675" alt="" decoding="async">
        <div class="race-projection race-projection--monitor"><div class="race-display" data-monitor></div></div>
        <div class="race-projection race-projection--phone" aria-hidden="true"><div class="race-display" data-phone><div data-phone-screen></div></div></div>
        <div class="race-controls" data-controls tabindex="0" role="group" aria-label="레이싱 조작. 조이스틱 또는 방향키로 이동하고 A로 가속, B로 감속하세요.">
          <div class="race-joystick" data-steer tabindex="0" role="group" aria-label="조이스틱. 좌우 방향키로도 움직일 수 있어요."><span aria-hidden="true" class="race-stick-guides">‹ <i></i> ›</span><span class="race-stick-thumb" data-thumb aria-hidden="true"></span></div>
          <div class="race-system">
            <button class="race-toggle" type="button" data-toggle>게임 시작</button>
            <button class="race-reset" type="button" data-reset aria-label="레이싱 초기화" title="레이싱 초기화">↻</button>
          </div>
          <div class="race-ab">
            <button class="race-pedal race-pedal-a" type="button" data-pedal="accelerate" aria-label="A 가속" title="A 가속 (X 키)"><b>A</b><small>가속</small></button>
            <button class="race-pedal race-pedal-b" type="button" data-pedal="brake" aria-label="B 감속" title="B 감속 (Z 키)"><b>B</b><small>감속</small></button>
          </div>
        </div>
        <div class="arcade-slide" data-slide hidden aria-hidden="true"></div>
        <button class="arcade-list" type="button" data-list hidden>게임 목록</button>
        <div class="arcade-controls" data-arcade-controls tabindex="0" role="group" aria-label="미니게임 조작" hidden>
          <span class="arcade-steering" role="group" aria-label="패들 이동">
            <button type="button" data-arcade-left aria-label="패들 왼쪽">←</button>
            <button type="button" data-arcade-right aria-label="패들 오른쪽">→</button>
          </span>
          <button class="arcade-action" type="button" data-action>점프</button>
          <button type="button" data-arcade-pause>일시정지</button>
          <button type="button" data-arcade-reset aria-label="게임 다시 시작">↻</button>
        </div>
        <span data-status class="race-sr" role="status"></span>
      </div>`;
    node.replaceChildren(desk);
    const $=name=>desk.querySelector('[data-'+name+']');
    const scene=$('scene'),backdrop=$('backdrop'),phoneDisplay=$('phone'),mirror=$('monitor'),control=$('phone-screen');
    const live=$('status'),gameControls=$('controls'),toggle=$('toggle'),gameReset=$('reset');
    const list=$('list'),slide=$('slide'),arcadeControls=$('arcade-controls'),primary=$('action'),arcadePause=$('arcade-pause'),arcadeReset=$('arcade-reset');
    const pad=arcadeControls.querySelector('.arcade-steering');
    const stick=$('steer'),thumb=$('thumb');
    const pedals=[...desk.querySelectorAll('[data-pedal]')];
  // Corners are measured in the published 1199×675 photo (top-left clockwise).
  const screenQuads = [
    [mirror, [[143,15],[714,77],[714,332],[149,372]]],
    [phoneDisplay, [[591,363],[885,341],[935,505],[611,534]]]
  ];
  function projectScreen(quad, width, height){
    const [p0,p1,p2,p3]=quad.map(([x,y])=>[x*width/1199,y*height/675]);
    const dx1=p1[0]-p2[0], dx2=p3[0]-p2[0], dx3=p0[0]-p1[0]+p2[0]-p3[0];
    const dy1=p1[1]-p2[1], dy2=p3[1]-p2[1], dy3=p0[1]-p1[1]+p2[1]-p3[1];
    const determinant=dx1*dy2-dx2*dy1;
    const g=(dx3*dy2-dx2*dy3)/determinant, h=(dx1*dy3-dx3*dy1)/determinant;
    return `matrix3d(${[
      (p1[0]-p0[0]+g*p1[0])/400,(p1[1]-p0[1]+g*p1[1])/400,0,g/400,
      (p3[0]-p0[0]+h*p3[0])/224,(p3[1]-p0[1]+h*p3[1])/224,0,h/224,
      0,0,1,0,p0[0],p0[1],0,1
    ].join(',')})`;
  }
  function alignScreens(){
    const {width,height}=scene.getBoundingClientRect();
    if(!width||!height||scene.classList.contains('photo-missing'))return;
    screenQuads.forEach(([screen,quad])=>{screen.style.transform=projectScreen(quad,width,height);});
    scene.dataset.mapped='true';
  }
  function missingPhoto(){
    scene.classList.add('photo-missing');
    live.textContent='배경 이미지를 불러오지 못했지만 두 화면에서 같은 게임을 계속할 수 있어요.';
  }
  backdrop.addEventListener('error',missingPhoto);
  const stage = [mirror, control], ns='http://www.w3.org/2000/svg';
  const trafficLanes=[0,2,1,2,0,1,0,2];
  const directions={left:-1,right:1};
  const held=new Map();
  let timer, road=0, lane=1, traffic=[], passed=0, spawnCount=0, nextCar=0;
  let stickId=null, steerDir='', steerAt=0;
  function refreshPedals(){
    for(const b of pedals)b.classList.toggle('is-held',[...held.values()].includes(b.dataset.pedal));
    desk.dataset.pace=[...held.values()].includes('brake')?'brake':[...held.values()].includes('accelerate')?'accelerate':'normal';
  }
  function resetStick(){
    stickId=null;steerDir='';thumb.style.transform='';
  }
  function clearInput(){held.clear();refreshPedals();resetStick();}
  function stop(){if(timer!==undefined){clearInterval(timer);timer=undefined;}clearInput();}
  function drive(){stop();timer=setInterval(step,110);}
  function step(){
    if(mode!=='race'||phase!=='playing')return;
    const speed={normal:.066,accelerate:.104,brake:.042}[desk.dataset.pace];
    road+=speed; nextCar-=speed;
    if(nextCar<=0){traffic.push({lane:trafficLanes[spawnCount%trafficLanes.length],at:0});spawnCount++;nextCar+=.45;}
    traffic.forEach(car=>{car.at+=speed;});
    if(steerDir && performance.now()>=steerAt){steerAt=performance.now()+210;move(steerDir,false);}
    if(traffic.some(car=>car.at>=.86&&car.at<=1.07&&car.lane===lane)){phase='lose';stop();}
    else {
      const before=traffic.length;
      traffic=traffic.filter(car=>car.at<1.13);
      passed+=before-traffic.length;
    }
    renderGame();
    if(phase!=='playing' && desk.contains(document.activeElement))toggle.focus({preventScroll:true});
  }
  let mode='library', engine=null, arcadeViews=[], animation=0, lastTick=0, paused=false, result='';
  let game;
  let phase, lastScore;
  function setGame(next) { stop(); road=passed=spawnCount=nextCar=0; lane=1; traffic=[]; phase=next; lastScore=0; renderGame(); if(next==='playing')drive(); }
  function cloneInto() {
    stage.forEach(screen=>screen.innerHTML=GAME_ART);
  }
  function announce(t) {live.textContent=t;}
  const roadPoint=(column,f)=>({x:200+(column-1)*(23+75*f),y:104+104*f});
  function renderGame(){
    scene.classList.add('is-live');
    const car=roadPoint(lane,1), score=passed;
    game.forEach(nodes=>{
      nodes.player.setAttribute('transform',`translate(${car.x},${car.y})`);
      nodes.road.replaceChildren(...[.28,.56,.84].flatMap(base=>{
        const f=(base+road*.63)%1;
        return [-.5,.5].map(offset=>{
          const a=roadPoint(1+offset,f),b=roadPoint(1+offset,Math.min(1,f+.07));
          const line=document.createElementNS(ns,'path');
          line.setAttribute('d',`M${a.x} ${a.y}L${b.x} ${b.y}`);
          return line;
        });
      }));
      nodes.traffic.replaceChildren(...traffic.map(other=>{
        const f=Math.min(1.10,other.at),p=roadPoint(other.lane,f), h=8+f*15, w=13+f*17;
        const group=document.createElementNS(ns,'g'), rectangle=document.createElementNS(ns,'rect'), back=document.createElementNS(ns,'path');
        group.setAttribute('transform',`translate(${p.x},${p.y})`);
        for(const [k,v] of Object.entries({x:-w/2,y:-h,width:w,height:h+5,rx:4,fill:['#ffbc6b','#86b3ff','#ee93b0'][other.lane],stroke:'#dfdfe6','stroke-width':'.7'}))rectangle.setAttribute(k,v);
        back.setAttribute('d',`M${-w*.35} ${-h*.20}h${w*.22}m${w*.25} 0h${w*.22}`);
        back.setAttribute('stroke','#7f2f46');back.setAttribute('stroke-width','2');
        group.append(rectangle,back);return group;
      }));
      nodes.score.textContent='점수 '+score;
      nodes.overlay.hidden=phase==='playing';
      if(phase!=='playing'){
        nodes.title.textContent={idle:'미니 레이싱',paused:'잠시 쉬는 중',lose:'차에 닿았어요'}[phase];
        nodes.subtitle.textContent={idle:'Android 게임패드로 시작',paused:'계속하려면 재개',lose:'다시 도전해 보세요.'}[phase];
      }
    });
    desk.dataset.phase=phase;
    pedals.forEach(button=>{button.disabled=phase!=='playing';});
    stick.setAttribute('aria-disabled',String(phase!=='playing'));
    toggle.textContent={idle:'게임 시작',playing:'일시정지',paused:'계속하기',lose:'다시 도전'}[phase];
    gameReset.disabled=phase==='idle';
    if(phase==='lose')announce('충돌했어요. 최종 점수 '+score+'점.');
    else if(phase==='paused')announce('게임을 일시정지했어요.');
    else if(phase==='idle')announce('조이스틱이나 방향키로 차량을 피하세요. A는 가속, B는 감속이에요.');
    else if(score!==lastScore)announce('차 '+score+'대를 피했어요.');
    lastScore=score;
  }
  function setupGame() {
    cloneInto();
    game=stage.map(screen=>Object.fromEntries(
      [['player','player'],['traffic','traffic'],['road','road'],['score','score'],['overlay','game-overlay'],['title','game-title'],['subtitle','game-subtitle']]
        .map(([k,attr])=>[k,screen.querySelector('[data-'+attr+']')])
    ));
    setGame('idle');
  }
  function move(direction,refresh=true) {
    if(phase!=='playing'||!directions[direction])return;
    lane=Math.max(0,Math.min(2,lane+directions[direction]));
    if(!refresh)return;
    if(traffic.some(car=>car.lane===lane&&car.at>=.86&&car.at<=1.07)){phase='lose';stop();}
    renderGame();
    if(phase==='lose' && desk.contains(document.activeElement))toggle.focus({preventScroll:true});
  }
  function pointStick(event){
    const r=stick.getBoundingClientRect();
    const limit=r.width*.29;
    if(!limit)return;
    let x=event.clientX-r.left-r.width/2, y=event.clientY-r.top-r.height/2;
    const ratio=Math.min(1,limit/(Math.hypot(x,y)||1));x*=ratio;y*=ratio;
    thumb.style.transform='translate('+x+'px,'+y+'px)';
    const direction=x>limit*.43?'right':x<-limit*.43?'left':'';
    if(direction!==steerDir){
      steerDir=direction;
      if(direction){steerAt=performance.now()+235;move(direction);}
    }
  }
  stick.addEventListener('pointerdown',event=>{
    if(mode!=='race'||phase!=='playing'||event.button!==0||stickId!==null)return;
    event.preventDefault();stickId=event.pointerId;stick.setPointerCapture(stickId);pointStick(event);
  });
  stick.addEventListener('pointermove',event=>{if(event.pointerId===stickId)pointStick(event);});
  for(const event of ['pointerup','pointercancel','lostpointercapture']){
    stick.addEventListener(event,e=>{if(e.pointerId===stickId)resetStick();});
  }
  for(const b of pedals){
    b.addEventListener('pointerdown',e=>{
      if(mode!=='race'||phase!=='playing'||e.button!==0)return;
      e.preventDefault();b.setPointerCapture(e.pointerId);
      held.set('p'+e.pointerId,b.dataset.pedal);refreshPedals();
    });
    for(const name of ['pointerup','pointercancel','lostpointercapture']){
      b.addEventListener(name,e=>{if(held.delete('p'+e.pointerId))refreshPedals();});
    }
  }
  const pedalKeys={x:'accelerate',z:'brake',X:'accelerate',Z:'brake'};
  desk.addEventListener('keydown',e=>{
    if(mode!=='race'||phase!=='playing'||e.altKey||e.ctrlKey||e.metaKey)return;
    const aliases={ArrowLeft:'left',ArrowRight:'right'};
    if(aliases[e.key]){e.preventDefault();move(aliases[e.key]);return;}
    const pedal=pedalKeys[e.key] || ([' ','Enter'].includes(e.key)?e.target.dataset.pedal:null);
    if(pedal){e.preventDefault();held.set('k'+e.code,pedal);refreshPedals();}
  });
  window.addEventListener('keyup',e=>{if(held.delete('k'+e.code))refreshPedals();});
  window.addEventListener('blur',clearInput);
  function start() {
    if(phase==='playing')return;
    if(phase==='paused'){phase='playing';drive();renderGame();}
    else setGame('playing');
    announce('레이싱을 시작했어요. 조이스틱으로 차선을 바꾸고 A로 가속, B로 감속하세요.');
    gameControls.focus({preventScroll:true});
  }
  function pause(){
    if(mode==='breakout'||mode==='rabbit'){pauseArcade();return;}
    if(mode==='race'&&phase==='playing'){phase='paused';stop();renderGame();}
  }
  toggle.addEventListener('click',()=>{
    if(phase==='playing')pause();
    else start();
  });
  gameReset.addEventListener('click',()=>{setGame('idle');toggle.focus({preventScroll:true});});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)pause();
  });
  function stopArcade(){
    if(animation)cancelAnimationFrame(animation);
    animation=0;lastTick=0;
  }
  function activate(next){
    mode=next;desk.dataset.game=mode;
    gameControls.hidden=mode!=='race';
    arcadeControls.hidden=mode!=='breakout'&&mode!=='rabbit';
    list.hidden=mode==='library';
    mirror.setAttribute('aria-hidden',String(mode!=='library'));
    slide.hidden=mode!=='breakout';
  }
  function openLibrary(focusId){
    stop();stopArcade();engine=null;arcadeViews=[];
    activate('library');scene.classList.add('is-live');
    mirror.innerHTML=library(true);control.innerHTML=library(false);
    announce('OneMouse 아케이드에서 게임을 고르세요.');
    if(focusId)mirror.querySelector('[data-pick="'+focusId+'"]')?.focus({preventScroll:true});
  }
  function paintArcade(){
    if(!engine)return;
    const snapshot=engine.state();
    for(const view of arcadeViews){
      engine.draw(view.ctx);
      view.score.textContent='점수 '+snapshot.score;
      view.overlay.hidden=!paused&&!result;
      view.overlay.textContent=paused?'잠시 쉬는 중':result==='won'?'성공!':'게임 끝';
    }
  }
  function updateArcadeControls(){
    const locked=paused||Boolean(result);
    primary.textContent=result?'다시 도전':mode==='breakout'?'공 발사':'점프';
    primary.disabled=paused;
    arcadePause.textContent=paused?'계속하기':'일시정지';
    arcadePause.disabled=Boolean(result);
    slide.hidden=mode!=='breakout'||locked;
    for(const b of pad.querySelectorAll('button'))b.disabled=locked;
  }
  function frameArcade(now){
    animation=0;
    if(!engine||paused||result||document.hidden)return;
    const dt=lastTick?Math.min(.032,(now-lastTick)/1000):0;
    lastTick=now;engine.step(dt);
    result=engine.state().result;paintArcade();
    if(result){
      updateArcadeControls();announce(result==='won'?'성공했어요.':'게임이 끝났어요. 다시 도전할 수 있어요.');
    }else animation=requestAnimationFrame(frameArcade);
  }
  function queueArcade(){if(!animation&&!paused&&!result)animation=requestAnimationFrame(frameArcade);}
  function pauseArcade(){
    if(!engine||paused||result)return;
    paused=true;stopArcade();updateArcadeControls();paintArcade();announce('게임을 일시정지했어요.');
  }
  function prepareArcade(id){
    stop();stopArcade();
    engine=window.OneMouseArcadeGames?.create(id);
    if(!engine){announce('게임을 불러오지 못했어요. 새로고침해 주세요.');return false;}
    activate(id);scene.classList.add('is-live');paused=false;result='';
    pad.hidden=id!=='breakout';
    arcadeViews=stage.map(screen=>{
      screen.innerHTML='<div class="game-frame"><canvas width="640" height="360"></canvas><span class="game-title" data-arcade-title></span><span class="game-score" data-points></span><div class="game-overlay" data-arcade-overlay hidden></div></div>';
      const canvas=screen.querySelector('canvas');
      screen.querySelector('[data-arcade-title]').textContent=picks.find(game=>game.id===id).name;
      return {ctx:canvas.getContext('2d'),score:screen.querySelector('[data-points]'),overlay:screen.querySelector('[data-arcade-overlay]')};
    });
    updateArcadeControls();paintArcade();queueArcade();return true;
  }
  function pick(id){
    if(id==='race'){
      stopArcade();engine=null;arcadeViews=[];activate('race');setupGame();start();
    }else if(id==='breakout'||id==='rabbit'){
      if(!prepareArcade(id))return;
      arcadeControls.focus({preventScroll:true});
      announce(id==='breakout'?'패들을 끌거나 좌우 방향키로 옮기고 공을 발사하세요.':'점프 버튼이나 스페이스 키로 장애물을 넘으세요.');
    }
  }
  mirror.addEventListener('click',event=>{
    const button=event.target.closest('[data-pick]');
    if(mode==='library'&&button)pick(button.dataset.pick);
  });
  list.addEventListener('click',()=>openLibrary(mode));
  function action(){
    if(!engine||paused)return;
    if(result){prepareArcade(mode);return;}
    engine.action();paintArcade();
  }
  function nudge(direction){
    if(mode!=='breakout'||!engine||paused||result)return;
    engine.nudge(direction);paintArcade();
  }
  primary.addEventListener('click',action);
  $('arcade-left').addEventListener('click',()=>nudge(-1));
  $('arcade-right').addEventListener('click',()=>nudge(1));
  arcadePause.addEventListener('click',()=>{
    if(!engine||result)return;
    if(!paused){pauseArcade();return;}
    paused=false;updateArcadeControls();paintArcade();queueArcade();announce('게임을 재개했어요.');
  });
  arcadeReset.addEventListener('click',()=>{if(engine){prepareArcade(mode);announce('게임을 초기화했어요.');}});
  let tracking=null;
  function slideTo(event){
    if(!engine||paused||result)return;
    const r=slide.getBoundingClientRect();
    if(r.width)engine.move(Math.max(0,Math.min(1,(event.clientX-r.left)/r.width)));
    paintArcade();
  }
  slide.addEventListener('pointerdown',event=>{
    if(event.button!==0||event.isPrimary===false)return;
    tracking=event.pointerId;slide.setPointerCapture(tracking);slideTo(event);
  });
  slide.addEventListener('pointermove',event=>{if(tracking===event.pointerId)slideTo(event);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])slide.addEventListener(type,event=>{
    if(tracking===event.pointerId){if(event.type==='pointerup')slideTo(event);tracking=null;}
  });
  desk.addEventListener('keydown',event=>{
    if(event.altKey||event.ctrlKey||event.metaKey)return;
    if(event.key==='Escape'&&mode!=='library'){event.preventDefault();openLibrary(mode);return;}
    if(!engine||paused||event.target.closest('button'))return;
    if((event.key===' '||(mode==='rabbit'&&event.key==='ArrowUp'))&&!event.repeat){event.preventDefault();action();}
    if(mode==='breakout'&&(event.key==='ArrowLeft'||event.key==='ArrowRight')){
      event.preventDefault();nudge(event.key==='ArrowLeft'?-1:1);
    }
  });
  openLibrary();
  if(backdrop.complete&&!backdrop.naturalWidth)missingPhoto();
  alignScreens();
  if(typeof ResizeObserver==='function')new ResizeObserver(alignScreens).observe(scene);
  else window.addEventListener('resize',alignScreens,{passive:true});
  if(typeof IntersectionObserver==='function')new IntersectionObserver(entries=>{
    if(entries.some(entry=>!entry.isIntersecting))pause();
  },{threshold:.05}).observe(scene);
  const controller={start(){pick('race');}};
  instances.set(node,controller);
  return controller;
  }
  window.OneMouseRaceCard = {mount};
})();
