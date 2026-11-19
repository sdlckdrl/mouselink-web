(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const PHOTO_WIDTH = 1536, PHOTO_HEIGHT = 1024;
  const IMAGE = '/assets/feature-screenshot-share-photo.webp';
  // Rectangle safely inside the coast shown on the photographed monitor.
  const SAMPLE_X = 368, SAMPLE_Y = 248, W = 508, H = 262;
  // Bounds of the received image inside the pictured phone, clockwise.
  const PHONE_QUAD = [[1177,470],[1366,480],[1348,703],[1158,693]];
  const PHONE_W = 192, PHONE_H = 224;
  const FULL = { x: 0, y: 0, w: W, h: H };
  const mounts = new WeakMap();

  // A local illustration in fixed coordinates. The source, preview and phone
  // render this same scene rather than reading any pixels or device data.
  const scene = [
    ['rect', { x: 0, y: 0, width: 640, height: 360, fill: '#d4eff1' }],
    ['path', { d: 'M0 0H640V143C503 163 368 152 236 129 129 113 58 114 0 141Z', fill: '#c3e4f0' }],
    ['circle', { cx: 475, cy: 87, r: 46, fill: '#ffdaa0' }],
    ['path', { d: 'M0 232 109 110 141 147 207 73 314 216 379 154 452 221 536 151 640 217V360H0Z', fill: '#7398a8' }],
    ['path', { d: 'm147 148 60-75 55 72-35-14-17 13-13-9-24 9Z', fill: '#f6f6e9' }],
    ['path', { d: 'M0 238c73-14 110-11 161 3 90 26 139-14 232-18 89-5 155 19 247 5v132H0Z', fill: '#417b91' }],
    ['path', { d: 'M0 258c70-13 139-19 198-10 89 14 151-9 225-10 85 0 137 26 217 20M0 278c61-7 161-1 218 6 113 12 185-28 281-20l141 12M223 304c106-5 157-22 235-16l88 5M338 317c71-9 118-8 177-7', fill: 'none', stroke: '#9ed3d6', 'stroke-width': 2.5, opacity: .8 }],
    ['path', { d: 'M0 261c42 2 52 26 89 43 42 19 120 20 157 56H0ZM640 288c-38-7-85 15-104 36l-38 36h142Z', fill: '#284e55' }],
    ['path', { d: 'M36 315v-46m-17 28 17-30 17 30m-21 6 24-40 24 40m-24 13v-49m533 78v-51m-22 34 22-39 22 39', fill: 'none', stroke: '#153e40', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }],
    ['path', { d: 'M425 98h100m-86 8h64m-54 6h46', fill: 'none', stroke: '#fff2d2', 'stroke-width': 1.7, opacity: .68 }]
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
  function picture(bounds, usePhoto) {
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
    if (usePhoto) {
      // Re-render the same static photo in monitor-local coordinates. The
      // outer viewBox clips it to the exact sample selection.
      const staticPhoto = document.createElementNS(NS, 'image');
      staticPhoto.setAttribute('href', IMAGE);
      staticPhoto.setAttribute('x', -SAMPLE_X);
      staticPhoto.setAttribute('y', -SAMPLE_Y);
      staticPhoto.setAttribute('width', PHOTO_WIDTH);
      staticPhoto.setAttribute('height', PHOTO_HEIGHT);
      staticPhoto.setAttribute('preserveAspectRatio', 'none');
      clip.append(staticPhoto);
      return svg;
    }
    const fallback = document.createElementNS(NS, 'g');
    fallback.setAttribute('transform', `scale(${W/640} ${H/360})`);
    scene.forEach(([tag, attrs]) => {
      const shape = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([key, value]) => shape.setAttribute(key, value));
      fallback.append(shape);
    });
    clip.append(fallback);
    return svg;
  }

  function mount(panel) {
    if (!panel || panel.nodeType !== 1) throw new TypeError('A capture demo panel element is required.');
    const existing = mounts.get(panel);
    if (existing) return existing;

    const root = el('div', 'demo');
    const brief = el('p', 'intro', '예시 화면에서 캡처할 부분을 고르고 폰으로 보내 보세요. 실제 화면이나 파일에는 접근하지 않아요.');
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
    source.style.left = `${SAMPLE_X/PHOTO_WIDTH*100}%`;
    source.style.top = `${SAMPLE_Y/PHOTO_HEIGHT*100}%`;
    source.style.width = `${W/PHOTO_WIDTH*100}%`;
    source.style.height = `${H/PHOTO_HEIGHT*100}%`;
    const sourceFallback = el('div', 'source-fallback');
    sourceFallback.append(picture(FULL, false));
    const selection = el('div', 'selection');
    selection.hidden = true;
    selection.setAttribute('aria-hidden', 'true');
    source.append(sourceFallback, selection);

    const phone = el('div', 'phone');
    const phoneView = el('div', 'phone-view');
    const phoneHint = el('div', 'phone-hint', '받은 캡처가 여기에 표시돼요.');
    phone.setAttribute('aria-label', '사진 속 예시 Android 폰');
    phoneView.append(phoneHint);
    phone.append(phoneView);
    stage.append(backdrop, source, phone);
    const caption = el('figcaption', 'caption', '사진 속 모니터와 폰으로 체험해요. 배경은 AI로 제작한 사용 예시예요.');
    figure.append(stage, caption);

    const toolbar = el('div', 'tools');
    const area = button('영역 선택', 'button');
    area.setAttribute('aria-pressed', 'false');
    const all = button('전체 캡처', 'button');
    toolbar.append(area, all);

    const tray = el('div', 'tray');
    const preview = el('div', 'preview');
    preview.hidden = true;
    preview.append(el('p', 'preview-label', '보낼 이미지'));
    const previewView = el('div', 'preview-view');
    preview.append(previewView);
    const controls = el('div', 'tools');
    const send = button('폰으로 보내기', 'button om-capture-primary');
    send.disabled = true;
    const clear = button('다시 시작', 'button');
    clear.disabled = true;
    controls.append(send, clear);
    const idleText = '마우스로 모니터 속 이미지를 바로 드래그하세요. 터치 화면에서는 영역 선택을 먼저 눌러요.';
    const status = el('p', 'status', idleText);
    status.setAttribute('role', 'status');
    status.setAttribute('aria-atomic', 'true');
    tray.append(preview, controls, status);
    root.append(brief, figure, toolbar, tray);
    panel.append(root);

    let armed = false, active = null, captured = null, sent = null, photoFail = false;

    function alignPhone() {
      if (photoFail) return;
      const {width, height} = stage.getBoundingClientRect();
      if (!width || !height) return;
      const [p0,p1,p2,p3] = PHONE_QUAD.map(([x,y]) => [x*width/PHOTO_WIDTH, y*height/PHOTO_HEIGHT]);
      const dx1=p1[0]-p2[0], dx2=p3[0]-p2[0], dx3=p0[0]-p1[0]+p2[0]-p3[0];
      const dy1=p1[1]-p2[1], dy2=p3[1]-p2[1], dy3=p0[1]-p1[1]+p2[1]-p3[1];
      const det=dx1*dy2-dx2*dy1;
      const g=(dx3*dy2-dx2*dy3)/det, h=(dx1*dy3-dx3*dy1)/det;
      phone.style.transform = `matrix3d(${[
        (p1[0]-p0[0]+g*p1[0])/PHONE_W,(p1[1]-p0[1]+g*p1[1])/PHONE_W,0,g/PHONE_W,
        (p3[0]-p0[0]+h*p3[0])/PHONE_H,(p3[1]-p0[1]+h*p3[1])/PHONE_H,0,h/PHONE_H,
        0,0,1,0,p0[0],p0[1],0,1
      ].join(',')})`;
      stage.classList.add('om-capture-mapped');
    }
    function showReceiver(crop) {
      phoneView.replaceChildren(picture(crop, !photoFail), el('span', 'delivered', '캡처 받음'));
      phoneView.classList.add('om-capture-received');
    }
    function missingPhoto() {
      photoFail = true;
      stage.classList.add('om-capture-photo-missing');
      caption.textContent = '사진을 불러오지 못했어요. 대신 예시 PC와 폰으로 같은 방식의 캡처를 체험할 수 있어요.';
      if (captured) previewView.replaceChildren(picture(captured, false));
      if (sent) showReceiver(sent);
    }
    backdrop.addEventListener('load', alignPhone);
    backdrop.addEventListener('error', missingPhoto);
    if (backdrop.complete && !backdrop.naturalWidth) missingPhoto();
    alignPhone();
    if (typeof ResizeObserver === 'function') new ResizeObserver(alignPhone).observe(stage);
    else window.addEventListener('resize', alignPhone, { passive:true });

    function point(event) {
      const r = source.getBoundingClientRect();
      const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
      return {
        x: clamp(Math.round((event.clientX-r.left) / (r.width || 1) * W), 0, W),
        y: clamp(Math.round((event.clientY-r.top) / (r.height || 1) * H), 0, H)
      };
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
    function setArmed(value) {
      armed = value;
      source.classList.toggle('om-capture-selecting', value);
      area.setAttribute('aria-pressed', String(value));
    }
    function dropActive() {
      if (!active) return;
      const id = active.id;
      active = null;
      if (source.hasPointerCapture?.(id)) source.releasePointerCapture(id);
    }
    function cancelSelection(focusArea = false) {
      dropActive();
      setArmed(false);
      drawSelection(captured && captured!==FULL ? captured : null);
      clear.disabled = !captured;
      status.textContent = captured ? '영역 선택을 취소했어요. 기존 캡처를 보낼 수 있어요.' : '영역 선택을 취소했어요.';
      if (focusArea) area.focus({ preventScroll: true });
    }
    function commit(box, note) {
      dropActive();
      setArmed(false);
      captured = box;
      drawSelection(box===FULL ? null : box);
      previewView.replaceChildren(picture(box, !photoFail));
      preview.hidden = false;
      send.disabled = clear.disabled = false;
      status.textContent = note + ' 폰으로 보낼 수 있어요.';
    }
    function reset() {
      dropActive();
      captured = sent = null;
      setArmed(false);
      drawSelection(null);
      preview.hidden = true;
      previewView.replaceChildren();
      phoneView.replaceChildren(phoneHint);
      phoneView.classList.remove('om-capture-received');
      send.disabled = clear.disabled = true;
      status.textContent = idleText;
    }
    source.addEventListener('pointerdown', event => {
      // Desktop can capture immediately; touch keeps scrolling until armed.
      if ((!armed && event.pointerType !== 'mouse') || active || event.button !== 0 || event.isPrimary === false) return;
      event.preventDefault();
      active = { id: event.pointerId, start: point(event), x: event.clientX, y: event.clientY };
      source.setPointerCapture?.(event.pointerId);
      drawSelection(null);
    });
    source.addEventListener('pointermove', event => {
      if (!active || event.pointerId !== active.id) return;
      drawSelection(bounds(active.start, point(event)));
    });
    source.addEventListener('pointerup', event => {
      if (!active || event.pointerId !== active.id) return;
      const end = point(event), box = bounds(active.start, end);
      if (Math.abs(event.clientX-active.x)<7 || Math.abs(event.clientY-active.y)<7) {
        // Tap / very short movement: take a visible sample centred near the tap.
        const w=Math.round(W/2), h=Math.round(H/2);
        commit({ x: Math.max(0, Math.min(W-w,end.x-w/2)), y: Math.max(0,Math.min(H-h,end.y-h/2)), w, h }, '누른 곳 주변을 캡처했어요.');
      } else commit(box, '선택한 영역을 캡처했어요.');
    });
    function interrupted(event) {
      if (!active || active.id !== event.pointerId) return;
      dropActive();
      drawSelection(null);
      status.textContent = armed ? '선택이 중단됐어요. 다시 드래그하거나 한 번 눌러 주세요.' : idleText;
    }
    source.addEventListener('pointercancel', interrupted);
    source.addEventListener('lostpointercapture', interrupted);
    source.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      commit(FULL, '전체 화면을 캡처했어요.');
    });
    source.addEventListener('click', event => {
      // Assistive technology may activate a role=button with a click only.
      if (event.detail === 0) commit(FULL, '전체 화면을 캡처했어요.');
    });
    area.addEventListener('click', () => {
      if (armed) { cancelSelection(); return; }
      setArmed(true);
      drawSelection(null);
      clear.disabled = false;
      status.textContent = '화면에서 드래그하거나 한 번 눌러 영역을 고르세요. 영역 선택 버튼을 다시 누르면 취소돼요.';
    });
    all.addEventListener('click', () => commit(FULL, '전체 화면을 캡처했어요.'));
    send.addEventListener('click', () => {
      if (!captured) return;
      sent = captured;
      showReceiver(sent);
      status.textContent = '고른 이미지가 예시 폰에 전송됐어요.';
    });
    clear.addEventListener('click', () => { reset(); area.focus({ preventScroll: true }); });
    root.addEventListener('keydown', event => {
      if (event.key === 'Escape' && armed) { event.preventDefault(); cancelSelection(true); }
    });

    const instance = { reset, start: alignPhone };
    mounts.set(panel, instance);
    return instance;
  }

  window.OneMouseCaptureDemo = { mount };
})();
