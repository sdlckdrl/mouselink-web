(() => {
  'use strict';

  // Demos still own all keyboard, game, selection, gesture and transfer actions.
  // Only touch/pen aimed at a simulated screen goes through the relative pointer.
  const clamp = n => Math.min(.99, Math.max(.01, n));
  const contactThreshold = 5;
  const dragDelay = 250;
  const synthetic = new WeakSet();
  const surfaceByPointer = new Map();
  let lastTouchClick = null;

  const labels = {
    ko: ['손가락을 밀면 커서가 움직여요. 짧게 탭하면 커서 위치를 클릭해요.', '드래그하려면 잠깐 누른 뒤 미세요.', '우클릭 모드에서는 손가락을 밀어 방향을 그리세요.'],
    en: ['Slide a finger to move the cursor. Tap to click where it is pointing.', 'To drag, hold briefly before sliding.', 'With right-click armed, slide your finger to draw a gesture.'],
    ja: ['指を滑らせるとカーソルが動き、タップするとカーソル位置をクリックします。', 'ドラッグするには少し押さえてから指を滑らせます。', '右クリックを有効にしたら、指を滑らせてジェスチャーを描きます。'],
    zh: ['滑动手指移动光标，轻点即可在光标位置点击。', '如需拖动，请先按住片刻，再滑动。', '开启右键模式后，滑动手指绘制手势。'],
    es: ['Desliza un dedo para mover el cursor. Toca para hacer clic donde apunta.', 'Para arrastrar, mantén el dedo un momento antes de deslizarlo.', 'Con el clic derecho activado, desliza el dedo para dibujar el gesto.'],
  };
  const language = document.documentElement.lang.toLowerCase().split('-')[0];
  const copy = labels[language] || labels.en;
  const inside = (rect, x, y) => rect.width > 0 && rect.height > 0
    && x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom;

  function mount(surface, options = {}) {
    if (!surface || surface.dataset.omCursor !== undefined) return;
    let position = options.start || [.5, .5];
    let contact = null;
    const existing = options.marker ? surface.querySelector(options.marker) : null;
    const marker = existing || document.createElement('span');
    if (!existing) {
      marker.className = 'om-demo-pointer';
      marker.setAttribute('aria-hidden', 'true');
      marker.innerHTML = '<svg viewBox="0 0 24 30" focusable="false"><path d="M1 1L22 19 13 18.4 17 26 13.6 28 9.3 20.3 3 27Z" fill="#fff" stroke="#142a43" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="15" r="7.5" fill="#fff" stroke="#142a43" stroke-width="2"/></svg>';
      surface.append(marker);
    }
    surface.dataset.omCursor = '';
    if (!options.directOnly) surface.dataset.omTrackpad = '';

    function paint(next) {
      position = [clamp(next[0]), clamp(next[1])];
      if (existing) return;
      marker.style.left = position[0] * 100 + '%';
      marker.style.top = position[1] * 100 + '%';
      const { left, top, width, height } = surface.getBoundingClientRect();
      const x = left + position[0] * width, y = top + position[1] * height;
      marker.dataset.shape = options.mobile &&
        inside(surface.querySelector(options.mobile)?.getBoundingClientRect() || {}, x, y) ? 'dot' : 'arrow';
    }

    function visiblePosition() {
      // Native keyboard navigation changes the existing mark without firing a pointer event.
      if (existing && !existing.hidden && existing.style.left.endsWith('%') && existing.style.top.endsWith('%')) {
        return [parseFloat(existing.style.left) / 100, parseFloat(existing.style.top) / 100];
      }
      return position;
    }

    function coordinate(at) {
      const r = surface.getBoundingClientRect();
      return [r.left + at[0] * r.width, r.top + at[1] * r.height];
    }

    function pick(at) {
      const [x, y] = coordinate(at);
      const element = document.elementFromPoint(x, y);
      return element && surface.contains(element) ? element : surface;
    }

    function route(type, input, at, target, pressed) {
      const [clientX, clientY] = coordinate(at);
      if (!target || !target.isConnected) target = surface;
      const event = new PointerEvent(type, {
        bubbles: true, cancelable: true, composed: true,
        pointerId: input.id, pointerType: 'mouse', isPrimary: true,
        button: type === 'pointermove' ? -1 : 0,
        buttons: pressed ? 1 : 0, clientX, clientY,
      });
      synthetic.add(event);
      target.dispatchEvent(event);
    }

    function start(event) {
      if (synthetic.has(event) || !['touch', 'pen'].includes(event.pointerType) ||
          event.isPrimary === false || event.button !== 0 || contact ||
          options.directOnly || event.target.closest(options.direct || '[data-om-cursor-direct]')) return;
      const r = surface.getBoundingClientRect();
      if (!r.width || !r.height) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const origin = visiblePosition();
      const target = pick(origin);
      const eager = Boolean(options.eager && target.closest(options.eager));
      contact = { id:event.pointerId, startX:event.clientX, startY:event.clientY,
        lastX:event.clientX, lastY:event.clientY, started:event.timeStamp,
        at:origin, origin, target, drag:eager, moved:false };
      surfaceByPointer.set(event.pointerId, { move, finish });
      if (eager) route('pointerdown', contact, origin, target, true);
    }

    function move(event) {
      if (!contact) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const r = surface.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (!contact.moved) {
        if (Math.hypot(event.clientX - contact.startX, event.clientY - contact.startY) < contactThreshold) return;
        contact.moved = true;
        if (!contact.drag && options.drag && contact.target.closest(options.drag) &&
            event.timeStamp - contact.started >= dragDelay) {
          contact.drag = true;
          route('pointerdown', contact, contact.origin, contact.target, true);
        }
      }
      const at = [
        clamp(contact.at[0] + (event.clientX - contact.lastX) / r.width * 1.25),
        clamp(contact.at[1] + (event.clientY - contact.lastY) / r.height * 1.25),
      ];
      contact.lastX = event.clientX;
      contact.lastY = event.clientY;
      contact.at = at;
      paint(at);
      route('pointermove', contact, at, contact.drag ? contact.target : pick(at), contact.drag);
    }

    function finish(event, canceled = false) {
      if (!contact) return;
      const input = contact;
      contact = null;
      surfaceByPointer.delete(input.id);
      if (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!canceled) lastTouchClick = { surface, time:performance.now(), x:event.clientX, y:event.clientY };
      }
      if (input.drag) {
        route(canceled ? 'pointercancel' : 'pointerup', input, input.at, input.target, false);
      } else if (!canceled && !input.moved) {
        const target = pick(input.at);
        const button = target.closest('button:not(:disabled)');
        route('pointerdown', input, input.at, target, true);
        route('pointerup', input, input.at, target, false);
        if (button && surface.contains(button)) button.click();
      }
    }

    if (!options.directOnly) surface.addEventListener('pointerdown', start, {capture:true, passive:false});
    surface.addEventListener('pointermove', event => {
      if (synthetic.has(event) || event.pointerType !== 'mouse') return;
      const r = surface.getBoundingClientRect();
      if (inside(r, event.clientX, event.clientY)) {
        paint([(event.clientX - r.left) / r.width, (event.clientY - r.top) / r.height]);
      }
    }, {capture:true, passive:true});

    if (!options.directOnly) {
      const hint = document.createElement('p');
      hint.id = 'om-cursor-help-' + (++hintNumber);
      hint.className = 'om-cursor-help';
      hint.textContent = copy[0] + (options.drag ? ' ' + copy[1] : '') + (options.arm ? ' ' + copy[2] : '');
      surface.after(hint);
      const desc = surface.getAttribute('aria-describedby');
      surface.setAttribute('aria-describedby', [desc, hint.id].filter(Boolean).join(' '));
    }
    paint(position);
  }

  // Stop real touch dispatch only for the one gesture owned by a demo.
  for (const [type, callback] of [
    ['pointermove', (owner, e) => owner.move(e)],
    ['pointerup', (owner, e) => owner.finish(e)],
    ['pointercancel', (owner, e) => owner.finish(e, true)],
  ]) {
    window.addEventListener(type, event => {
      if (synthetic.has(event)) return;
      const owner = surfaceByPointer.get(event.pointerId);
      if (owner) callback(owner, event);
    }, {capture:true, passive:false});
  }
  window.addEventListener('click', event => {
    if (!event.isTrusted || !lastTouchClick || event.detail === 0) return;
    const {surface, time, x, y} = lastTouchClick;
    if (performance.now() - time > 650 || !surface.contains(event.target) ||
      event.pointerType === 'mouse' && !event.sourceCapabilities?.firesTouchEvents ||
      Math.hypot(event.clientX - x, event.clientY - y) > 3) return;
    lastTouchClick = null;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, {capture:true});
  const release = () => {
    for (const owner of surfaceByPointer.values()) owner.finish(null, true);
    lastTouchClick = null;
  };
  window.addEventListener('blur', release);
  window.addEventListener('pagehide', release);
  window.addEventListener('keydown', event => { if (event.key === 'Escape') release(); }, {capture:true});

  let hintNumber = 0;
  mount(document.querySelector('#cursor-scene'), {marker:'#cursor-mark'});
  for (const [selector, options] of [
    ['[data-layout-board]', {marker:'[data-layout-cursor]', drag:'[data-layout-device]:not([data-layout-device="pc"])'}],
    ['.om-capture-stage', {start:[.5,.36], mobile:'.om-capture-phone', drag:'.om-capture-source'}],
    ['.om-file-stage', {start:[.31,.37], drag:'.om-file-file-grid,.om-file-received'}],
    ['.om-android-stage', {start:[.5,.37], mobile:'.om-android-screen-phone'}],
    ['.tg-scene', {marker:'.tg-cursor', start:[.75,.56], direct:'[data-right-button]', arm:'[data-right-button]', eager:'.tg-surface.tg-armed'}],
    ['.race-scene', {start:[.33,.32], mobile:'[data-phone]', direct:'button,.race-joystick,[data-slide]'}],
  ]) {
    document.querySelectorAll(selector).forEach(surface => mount(surface, options));
  }
})();
