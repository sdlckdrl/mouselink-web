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
    <span class="game-score" data-score>통과 0 / 8</span>
    <div class="game-overlay" data-game-overlay><span data-game-title>미니 레이싱</span><small data-game-subtitle>Android 게임패드로 시작</small></div>
  </div>`;
  function mount(node) {
    if (!node || node.nodeType !== 1) throw new TypeError('A racing card element is required.');
    if (instances.has(node)) return instances.get(node);
    const desk = document.createElement('div');
    desk.className='om-race-card';
    desk.innerHTML=`
      <div class="race-scene" data-scene role="group" aria-label="사진 속 모니터와 폰에서 같은 레이싱을 체험">
        <img class="race-backdrop" data-backdrop src="/assets/preview/remote-racing-example.webp" width="1199" height="675" alt="" decoding="async">
        <div class="race-projection race-projection--monitor" aria-hidden="true"><div class="race-display" data-monitor></div></div>
        <div class="race-projection race-projection--phone" aria-hidden="true"><div class="race-display" data-phone><div data-phone-screen></div></div></div>
        <div class="race-controls" data-controls tabindex="0" role="group" aria-label="게임 조작. 시작한 뒤 방향 버튼이나 키보드 방향키로 차선을 바꿔요.">
          <span class="race-steering" aria-label="차선 이동" role="group">
            <button type="button" data-direction="left" aria-label="왼쪽 차선으로 이동">←</button>
            <button type="button" data-direction="right" aria-label="오른쪽 차선으로 이동">→</button>
          </span>
          <button class="race-toggle" type="button" data-toggle>게임 시작</button>
          <button class="race-reset" type="button" data-reset aria-label="레이싱 초기화" title="레이싱 초기화">↻</button>
        </div>
        <span data-status class="race-sr" role="status"></span>
      </div>`;
    node.replaceChildren(desk);
    const $=name=>desk.querySelector('[data-'+name+']');
    const scene=$('scene'),backdrop=$('backdrop'),phoneDisplay=$('phone'),mirror=$('monitor'),control=$('phone-screen');
    const live=$('status'),gameControls=$('controls'),toggle=$('toggle'),gameReset=$('reset');
    const dirs=[...desk.querySelectorAll('[data-direction]')];
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
  const goal=8, trafficLanes=[0,2,1,2,0,1,0,2], speed=.075;
  const directions={left:-1,right:1};
  let timer, frame=0, lane=1, traffic=[], passed=0, spawnCount=0;
  function stop(){if(timer!==undefined){clearInterval(timer);timer=undefined;}}
  function drive(){stop();timer=setInterval(step,145);}
  function step(){
    if(phase!=='playing')return;
    frame++;
    if(frame===1||frame%6===0){traffic.push({lane:trafficLanes[spawnCount%trafficLanes.length],at:0});spawnCount++;}
    traffic.forEach(car=>{car.at+=speed;});
    if(traffic.some(car=>car.at>=.86&&car.at<=1.07&&car.lane===lane)){phase='lose';stop();}
    else {
      const before=traffic.length;
      traffic=traffic.filter(car=>car.at<1.13);
      passed+=before-traffic.length;
      if(passed>=goal){phase='complete';stop();}
    }
    renderGame();
    if(phase!=='playing' && desk.contains(document.activeElement))toggle.focus({preventScroll:true});
  }
  let game;
  let phase, lastScore;
  function setGame(next) { stop(); frame=passed=spawnCount=0; lane=1; traffic=[]; phase=next; lastScore=0; renderGame(); if(next==='playing')drive(); }
  function cloneInto() {
    stage.forEach(screen=>screen.innerHTML=GAME_ART);
  }
  function announce(t) {live.textContent=t;}
  const roadPoint=(column,f)=>({x:200+(column-1)*(23+75*f),y:104+104*f});
  function renderGame(){
    scene.classList.toggle('is-live',phase!=='idle');
    const car=roadPoint(lane,1), score=Math.min(goal,passed);
    game.forEach(nodes=>{
      nodes.player.setAttribute('transform',`translate(${car.x},${car.y})`);
      nodes.road.replaceChildren(...[.28,.56,.84].flatMap(base=>{
        const f=(base+frame*.043)%1;
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
      nodes.score.textContent='통과 '+score+' / '+goal;
      nodes.overlay.hidden=phase==='playing';
      if(phase!=='playing'){
        nodes.title.textContent={idle:'미니 레이싱',paused:'잠시 쉬는 중',complete:'완주했어요!',lose:'차에 닿았어요'}[phase];
        nodes.subtitle.textContent={idle:'Android 게임패드로 시작',paused:'계속하려면 재개',complete:'8대를 모두 피했어요.',lose:'다시 도전해 보세요.'}[phase];
      }
    });
    desk.dataset.phase=phase;
    dirs.forEach(button=>{button.disabled=phase!=='playing';});
    toggle.textContent={idle:'게임 시작',playing:'일시정지',paused:'계속하기',complete:'한 번 더',lose:'다시 도전'}[phase];
    gameReset.disabled=phase==='idle';
    if(phase==='complete') announce('차 8대를 다 피했어요. 완주!');
    else if(phase==='lose')announce('앞차에 닿아서 게임을 마쳤어요.');
    else if(phase==='paused')announce('게임을 일시정지했어요.');
    else if(phase==='idle')announce('게임을 시작하고 방향 버튼이나 키보드 방향키로 앞차 8대를 피하세요.');
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
  function move(direction) {
    if(phase!=='playing'||!directions[direction])return;
    lane=Math.max(0,Math.min(2,lane+directions[direction]));
    if(traffic.some(car=>car.lane===lane&&car.at>=.86&&car.at<=1.07)){phase='lose';stop();}
    renderGame();
    if(phase==='lose' && desk.contains(document.activeElement))toggle.focus({preventScroll:true});
  }
  dirs.forEach(btn=>btn.addEventListener('click',()=>move(btn.dataset.direction)));
  desk.addEventListener('keydown',e=>{
    if(phase!=='playing'||e.altKey||e.ctrlKey||e.metaKey)return;
    const aliases={ArrowLeft:'left',ArrowRight:'right'};
    if(!aliases[e.key])return;
    e.preventDefault(); move(aliases[e.key]);
  });
  function start() {
    if(phase==='playing')return;
    if(phase==='paused'){phase='playing';drive();renderGame();}
    else setGame('playing');
    announce('레이싱을 시작했어요. 좌우로 차선을 바꿔 보세요.');
    gameControls.focus({preventScroll:true});
  }
  function pause(){
    if(phase==='playing'){phase='paused';stop();renderGame();}
  }
  toggle.addEventListener('click',()=>{
    if(phase==='playing')pause();
    else start();
  });
  gameReset.addEventListener('click',()=>{setGame('idle');toggle.focus({preventScroll:true});});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)pause();
  });
  setupGame();
  if(backdrop.complete&&!backdrop.naturalWidth)missingPhoto();
  alignScreens();
  if(typeof ResizeObserver==='function')new ResizeObserver(alignScreens).observe(scene);
  else window.addEventListener('resize',alignScreens,{passive:true});
  if(typeof IntersectionObserver==='function')new IntersectionObserver(entries=>{
    if(entries.some(entry=>!entry.isIntersecting))pause();
  },{threshold:.05}).observe(scene);
  const controller={start};
  instances.set(node,controller);
  return controller;
  }
  window.OneMouseRaceCard = {mount};
})();
