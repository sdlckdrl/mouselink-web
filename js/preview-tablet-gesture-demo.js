(() => {
  'use strict';
  const instances=new WeakMap();
  const quad=[[910,372],[1480,370],[1435,789],[854,739]],W=640,H=440;
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
          <div class="tg-surface" data-surface tabindex="0" role="group" aria-label="Android 태블릿 제스처: 왼쪽은 뒤로, 위아래는 스크롤, 아래로 그은 다음 오른쪽은 앱 최소화">
            <div class="tg-browser" data-browser aria-hidden="true">
              <div class="tg-toolbar"><b>‹　›</b><span data-address>인터넷 · 여행 기록</span><b>⋮</b></div>
              <div class="tg-page-wrap" data-scroll><div class="tg-page" data-page></div></div>
            </div>
            <div class="tg-home" data-home hidden><button type="button" class="tg-internet" data-internet><span class="tg-globe" aria-hidden="true">◎</span>인터넷</button></div>
            <svg class="tg-path" viewBox="0 0 640 440" aria-hidden="true"><polyline data-path points="" fill="none" stroke="#00c3a0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle data-origin cx="0" cy="0" r="7" fill="#00605b" stroke="#dbfff5" stroke-width="2" visibility="hidden"/></svg>
            <div class="tg-cue" data-cue hidden aria-hidden="true">
              <svg viewBox="0 0 40 56"><rect x="3" y="2" width="34" height="51" rx="16" fill="#fff" stroke="#214257" stroke-width="3"/><path d="M20 3v22h16V17C35 9 29 4 20 3Z" fill="#22cda7"/><path d="M20 3v22m-16 0h32" stroke="#214257" stroke-width="2"/><path d="M20 9v7" stroke="#214257" stroke-width="3" stroke-linecap="round"/></svg>
              <span>우클릭한 채 그리기</span>
            </div>
          </div>
        </div>
      </div>
      <div class="tg-controls" role="group" aria-label="제스처 도움 조작">
        <button type="button" data-arm aria-pressed="false">터치로 그리기</button>
        <button type="button" data-action="back">← 뒤로</button>
        <button type="button" data-action="up">↑ 위로</button>
        <button type="button" data-action="down">↓ 아래로</button>
        <button type="button" data-action="home">↓→ 앱 최소화</button>
        <button type="button" data-reopen hidden>인터넷 열기</button>
      </div>
      <p class="tg-note">태블릿 화면에서 마우스 오른쪽 버튼을 누른 채 그리세요. 예시 화면은 실제 기기에 연결되지 않아요.</p>
      <p class="tg-status" data-status role="status" aria-atomic="true"></p>`;
    host.append(root);
    const $=name=>root.querySelector('[data-'+name+']');
    const scene=$('scene'),photo=$('photo'),tablet=$('tablet'),surface=$('surface'),scroll=$('scroll'),page=$('page'),browser=$('browser'),home=$('home'),internet=$('internet'),reopenButton=$('reopen'),arm=$('arm'),cue=$('cue'),path=$('path'),origin=$('origin'),status=$('status');
    const actions=[...root.querySelectorAll('[data-action]')];
    const articles=[
      {where:'여행 기록',tag:'01 / 바다',title:'파도가 잔잔한 해변',text:'바람이 잦아들고 물결이 모래 위로 느리게 밀려왔어요.'},
      {where:'여행 기록',tag:'02 / 산책',title:'아침의 산책길',text:'나무 사이에 햇빛이 번지고 길 끝에 잠깐 쉬어 갈 벤치가 보여요.'}
    ];
    let map=null,fallback=false,index=1,saved=[0,0],onHome=false,armed=false,drag=null;
    function tell(text){status.textContent=text;}
    function renderPage(){
      const a=articles[index];
      $('address').textContent='인터넷 · '+a.where;
      page.innerHTML=`<p class="tg-tag">${a.tag}</p><h3>${a.title}</h3><div class="tg-landscape" aria-hidden="true"></div><p>${a.text}</p><h4>잠깐 쉬어 가기</h4><p>한 걸음씩 걷다 보면 풍경이 달라져요. 걸음을 멈춰 빛과 바람을 느껴 보세요.</p><div class="tg-landscape tg-landscape--lower" aria-hidden="true"></div><p>오늘 본 길을 함께 기억해요.</p>`;
      if(!onHome)scroll.scrollTop=saved[index];
    }
    function renderMode(){
      browser.hidden=onHome;home.hidden=!onHome;reopenButton.hidden=!onHome;
      arm.hidden=onHome;actions.forEach(button=>button.hidden=onHome);
      if(!onHome)scroll.scrollTop=saved[index];
      else cue.hidden=true;
    }
    function reopen(focus){
      if(!onHome)return;
      onHome=false;renderMode();
      tell('인터넷을 다시 열었어요.');
      if(focus)surface.focus({preventScroll:true});
    }
    function act(action,focus=false){
      if(onHome)return;
      if(action==='back'){
        if(index===0){tell('이전 페이지가 없어요.');return;}
        saved[index]=scroll.scrollTop;index=0;renderPage();tell('이전 페이지로 돌아갔어요.');
      }else if(action==='up'||action==='down'){
        const before=scroll.scrollTop;
        scroll.scrollTop=before+(action==='up'?-120:120);
        saved[index]=scroll.scrollTop;
        tell(before===scroll.scrollTop?(action==='up'?'페이지 맨 위예요.':'페이지 맨 아래예요.'):(action==='up'?'위로 스크롤했어요.':'아래로 스크롤했어요.'));
      }else if(action==='home'){
        saved[index]=scroll.scrollTop;onHome=true;setArmed(false);renderMode();
        tell('앱을 최소화했어요. 태블릿의 인터넷을 누르면 다시 열려요.');
        if(focus)internet.focus({preventScroll:true});
      }
    }
    function align(){
      if(fallback)return;
      const r=scene.getBoundingClientRect();if(!r.width||!r.height)return;
      map=projection(r.width,r.height);tablet.style.transform=map.css;
      scene.dataset.mapped='true';
    }
    function fail(){
      fallback=true;map=null;scene.classList.add('tg-no-photo');tablet.style.transform='';
    }
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
    function setArmed(on){
      armed=on;surface.classList.toggle('tg-armed',on);
      arm.setAttribute('aria-pressed',String(on));
      arm.textContent=on?'터치 그리기 취소':'터치로 그리기';
    }
    function cancel(){
      if(!drag)return;
      const id=drag.id;drag=null;paint([]);surface.classList.remove('tg-drawing');
      if(surface.hasPointerCapture?.(id))surface.releasePointerCapture(id);
    }
    surface.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&!onHome)cue.hidden=false;});
    surface.addEventListener('pointerleave',()=>{if(!drag)cue.hidden=true;});
    surface.addEventListener('contextmenu',e=>{if(!onHome&&e.button===2)e.preventDefault();});
    surface.addEventListener('pointerdown',e=>{
      if(onHome||drag||e.isPrimary===false)return;
      const mouse=e.pointerType==='mouse';
      if(mouse?e.button!==2:!armed||e.button!==0)return;
      e.preventDefault();cue.hidden=true;
      drag={id:e.pointerId,mouse,points:[point(e)]};paint(drag.points);
      surface.classList.add('tg-drawing');
      surface.setPointerCapture?.(e.pointerId);
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
      const a=recognize([...drag.points,point(e)]),mouse=drag.mouse;
      cancel();
      if(!mouse)setArmed(false);
      if(a)act(a);
      else tell('←, ↑, ↓ 또는 아래로 그은 뒤 오른쪽으로 그려 보세요.');
    });
    for(const event of ['pointercancel','lostpointercapture'])surface.addEventListener(event,e=>{if(drag?.id===e.pointerId)cancel();});
    surface.addEventListener('keydown',e=>{
      if(e.key==='Escape'){cancel();setArmed(false);return;}
      if(e.target!==surface||e.altKey||e.ctrlKey||e.metaKey)return;
      const a={ArrowLeft:'back',ArrowUp:'up',ArrowDown:'down',Home:'home'}[e.key];
      if(!onHome&&a){e.preventDefault();act(a,true);}
    });
    actions.forEach(b=>b.addEventListener('click',()=>act(b.dataset.action,true)));
    arm.addEventListener('click',()=>{cancel();setArmed(!armed);tell(armed?'태블릿 화면에서 손가락으로 방향을 그리세요.':'터치 그리기를 취소했어요.');});
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
