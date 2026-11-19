(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const W = 640, H = 360;
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
  function picture(bounds) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}`);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('width', bounds.w);
    svg.setAttribute('height', bounds.h);
    scene.forEach(([tag, attrs]) => {
      const shape = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([key, value]) => shape.setAttribute(key, value));
      svg.append(shape);
    });
    return svg;
  }

  function mount(panel) {
    if (!panel || panel.nodeType !== 1) throw new TypeError('A capture demo panel element is required.');
    const existing = mounts.get(panel);
    if (existing) return existing;

    const root = el('div', 'demo');
    const brief = el('p', 'intro', '예시 화면에서 캡처할 부분을 고르고 폰으로 보내 보세요. 실제 화면이나 파일에는 접근하지 않아요.');
    const grid = el('div', 'devices');
    const desktop = el('div', 'desktop');
    const desktopTitle = el('div', 'device-title', '예시 PC');
    const source = el('div', 'source');
    source.tabIndex = 0;
    source.setAttribute('role', 'button');
    source.setAttribute('aria-label', '예시 PC 화면. Enter 또는 스페이스로 전체 캡처');
    const selection = el('div', 'selection');
    selection.hidden = true;
    selection.setAttribute('aria-hidden', 'true');
    source.append(picture(FULL), selection);

    const toolbar = el('div', 'tools');
    const area = button('영역 선택', 'button');
    area.setAttribute('aria-pressed', 'false');
    const all = button('전체 캡처', 'button');
    toolbar.append(area, all);
    desktop.append(desktopTitle, source, toolbar);

    const phone = el('div', 'phone');
    const phoneTitle = el('div', 'device-title', '예시 Android 폰');
    const phoneBody = el('div', 'phone-body');
    const phoneView = el('div', 'phone-view');
    const phoneHint = el('div', 'phone-hint', '받은 캡처가 여기에 표시돼요.');
    phoneView.append(phoneHint);
    phoneBody.append(phoneView);
    phone.append(phoneTitle, phoneBody);
    grid.append(desktop, phone);

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
    const status = el('p', 'status', '영역을 직접 고르거나 전체 화면을 캡처하세요.');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-atomic', 'true');
    tray.append(preview, controls, status);
    root.append(brief, grid, tray);
    panel.append(root);

    let armed = false, active = null, captured = null;

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
      previewView.replaceChildren(picture(box));
      preview.hidden = false;
      send.disabled = clear.disabled = false;
      status.textContent = note + ' 폰으로 보낼 수 있어요.';
    }
    function reset() {
      dropActive();
      captured = null;
      setArmed(false);
      drawSelection(null);
      preview.hidden = true;
      previewView.replaceChildren();
      phoneView.replaceChildren(phoneHint);
      phoneView.classList.remove('om-capture-received');
      send.disabled = clear.disabled = true;
      status.textContent = '영역을 직접 고르거나 전체 화면을 캡처하세요.';
    }
    source.addEventListener('pointerdown', event => {
      // Only consume touch gestures after the user explicitly chooses an area.
      if (!armed || active || event.button !== 0 || event.isPrimary === false) return;
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
        const w=320, h=180;
        commit({ x: Math.max(0, Math.min(W-w,end.x-w/2)), y: Math.max(0,Math.min(H-h,end.y-h/2)), w, h }, '누른 곳 주변을 캡처했어요.');
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
      phoneView.replaceChildren(picture(captured), el('span', 'delivered', '캡처 받음'));
      phoneView.classList.add('om-capture-received');
      status.textContent = '고른 이미지가 예시 폰에 전송됐어요.';
    });
    clear.addEventListener('click', () => { reset(); area.focus({ preventScroll: true }); });
    root.addEventListener('keydown', event => {
      if (event.key === 'Escape' && armed) { event.preventDefault(); cancelSelection(true); }
    });

    const instance = { reset };
    mounts.set(panel, instance);
    return instance;
  }

  window.OneMouseCaptureDemo = { mount };
})();
