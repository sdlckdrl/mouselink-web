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
    ['text', { x: 29, y: 56, fill: '#143249', 'text-anchor': 'middle', 'font-size': 8, 'font-family': 'system-ui' }, '내 PC'],
    ['text', { x: 29, y: 99, fill: '#143249', 'text-anchor': 'middle', 'font-size': 8, 'font-family': 'system-ui' }, '휴지통'],
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
    source.setAttribute('aria-label', '사진 속 PC의 예시 화면. Enter 또는 스페이스로 전체 캡처');
    const desktop = el('div', 'desktop-art');
    desktop.append(picture(FULL));
    const selection = el('div', 'selection');
    selection.hidden = true;
    selection.setAttribute('aria-hidden', 'true');
    const cursor = el('div','virtual-cursor');
    cursor.hidden = true;
    cursor.setAttribute('aria-hidden','true');
    source.append(desktop, selection, cursor);

    const monitorLayer = el('div', 'monitor-layer');
    const monitor = el('div', 'monitor');
    const dialog = el('section', 'window');
    dialog.hidden = true;
    dialog.setAttribute('aria-label', '선택한 스크린샷 미리보기');
    const bar = el('div', 'window-bar');
    bar.append(el('span', 'window-brand', 'OneMouse'));
    const monitorPreview = el('div', 'monitor-preview');
    const monitorActions = el('div', 'monitor-actions');
    const mkActions = () => ({
      copy: button('복사', 'button'),
      save: button('저장', 'button'),
      send: button('보내기', 'button om-capture-primary')
    });
    const inside = mkActions();
    monitorActions.append(inside.copy, inside.save, inside.send);
    dialog.append(bar, el('p', 'window-title', '스크린샷'), monitorPreview, monitorActions);
    monitor.append(source);
    monitorLayer.append(monitor);
    const popupPlane = el('div', 'popup-plane');
    popupPlane.append(dialog);

    const phone = el('div', 'phone');
    const phoneView = el('div', 'phone-view');
    const phoneHint = el('div', 'phone-hint', '받은 캡처가 여기에 표시돼요.');
    phone.setAttribute('aria-label', '사진 속 예시 Android 폰');
    phoneView.append(phoneHint);
    phone.append(phoneView);
    stage.append(backdrop, monitorLayer, phone, popupPlane);
    const caption = el('figcaption', 'caption', '바탕화면을 마우스나 손가락으로 드래그해 캡처하세요. AI 배경의 예시 화면입니다.');
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
      phoneView.replaceChildren(picture(crop), el('span', 'delivered', '캡처 받음'));
      phoneView.classList.add('om-capture-received');
    }
    function missingPhoto() {
      photoFail = true;
      monitorMap = null;
      stage.classList.add('om-capture-photo-missing');
      caption.textContent = '사진 없이도 예시 바탕화면을 드래그하거나 한 번 눌러 캡처할 수 있어요.';
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
      inside.save.disabled = true;
      const current = pendingPng = pngBlob(box);
      current.then(blob => {
        if (pendingPng !== current) return;
        png = blob;
        inside.save.disabled = false;
      }, () => {
        if (pendingPng === current) status.textContent = '이 브라우저에서 PNG를 만들지 못했어요. 예시 폰으로 보내기는 이용할 수 있어요.';
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
      status.textContent = '';
    }
    async function copyCapture() {
      if (!captured || !pendingPng) return;
      const selected = pendingPng;
      try {
        if (!navigator.clipboard?.write || typeof ClipboardItem !== 'function') throw new Error('Permission unavailable');
        await navigator.clipboard.write([new ClipboardItem({'image/png': png || selected})]);
        if (selected === pendingPng) conclude('클립보드에 복사했어요. 바탕화면에서 다시 캡처할 수 있어요.');
      } catch {
        if (selected === pendingPng) status.textContent = '이 브라우저에서 이미지 복사를 할 수 없어요. 저장을 이용해 보세요.';
      }
    }
    function saveCapture() {
      if (!captured || !png) return;
      const url = URL.createObjectURL(png);
      const download = el('a');
      download.href = url;
      download.download = 'onemouse-demo-capture.png';
      root.append(download);
      download.click();
      download.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      conclude('예시 캡처 PNG 다운로드를 시작했어요.');
    }
    function sendCapture() {
      if (!captured) return;
      showReceiver(captured);
      conclude('사진 속 폰에서 캡처를 받았어요.');
    }
    inside.copy.addEventListener('click',copyCapture);
    inside.save.addEventListener('click',saveCapture);
    inside.send.addEventListener('click',sendCapture);
    function tapCapture(event) {
      const end = point(event), w = Math.round(W/2), h = Math.round(H/2);
      commit({ x: Math.max(0, Math.min(W-w,end.x-w/2)), y: Math.max(0,Math.min(H-h,end.y-h/2)), w, h }, '누른 곳 주변을 캡처했어요.');
    }
    source.addEventListener('pointerdown', event => {
      if (active || event.button !== 0 || event.isPrimary === false) return;
      event.preventDefault();
      closeCapture();
      const start = point(event);
      active = { id:event.pointerId,start,x:event.clientX,y:event.clientY,touch:event.pointerType==='touch' };
      if(active.touch)showCursor(start);
      source.setPointerCapture?.(event.pointerId);
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
      } else commit(box, '선택한 영역을 캡처했어요.');
    });
    function interrupted(event) {
      if (!active || active.id !== event.pointerId) return;
      dropActive();
      drawSelection(null);
      status.textContent = '선택이 중단됐어요. 다시 드래그하거나 한 번 눌러 주세요.';
    }
    source.addEventListener('pointercancel', interrupted);
    source.addEventListener('lostpointercapture', interrupted);
    source.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      commit(FULL, '전체 화면을 캡처했어요.', true);
    });
    source.addEventListener('click', event => {
      // Assistive technology may activate a role=button with a click only.
      if (event.detail === 0) commit(FULL, '전체 화면을 캡처했어요.', true);
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
