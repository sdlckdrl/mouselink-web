(() => {
  'use strict';

  const initial = { pc: [50, 47], mac: [18, 43], phone: [48, 83], tablet: [83, 47] };
  const names = { pc: 'Windows PC', mac: 'Mac', phone: 'Android 폰', tablet: 'Android 태블릿' };
  const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  for (const root of document.querySelectorAll('[data-layout-demo]')) {
    const board = root.querySelector('[data-layout-board]');
    const cursor = root.querySelector('[data-layout-cursor]');
    const svg = root.querySelector('[data-layout-lines]');
    const reset = root.querySelector('[data-layout-reset]');
    const status = root.querySelector('[data-layout-status]');
    if (!board || !cursor || !svg || !reset || !status) continue;
    const keys = Object.keys(initial);
    const devices = Object.fromEntries(keys.map(id => [id, board.querySelector(`[data-layout-device="${id}"]`)]));
    if (keys.some(id => !devices[id])) continue;
    const movable = keys.filter(id => id !== 'pc');
    const lines = Object.fromEntries(movable.map(id => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      svg.append(line);
      return [id, line];
    }));
    let positions;
    let current = 'pc';
    let gesture = null;

    const writePosition = (element, [x, y]) => {
      element.style.left = `${x}%`;
      element.style.top = `${y}%`;
    };
    const draw = () => {
      for (const id of keys) writePosition(devices[id], positions[id]);
      for (const id of movable) {
        const [x1, y1] = positions.pc;
        const [x2, y2] = positions[id];
        Object.entries({ x1, y1, x2, y2 }).forEach(([key, value]) => lines[id].setAttribute(key, value));
      }
    };
    const showCursor = (position, id = current) => {
      writePosition(cursor, position);
      cursor.hidden = false;
      if (id !== current || !cursor.dataset.device) {
        current = id;
        cursor.dataset.device = id;
        cursor.dataset.shape = id === 'pc' || id === 'mac' ? 'arrow' : 'dot';
        board.dataset.layoutActive = id;
        for (const key of keys) devices[key].toggleAttribute('data-layout-active', key === id);
        status.textContent = `커서: ${names[id]}`;
      }
    };

    function measure() {
      const box = board.getBoundingClientRect();
      const width = board.clientWidth;
      const height = board.clientHeight;
      if (!width || !height) return null;
      const halves = Object.fromEntries(keys.map(id => {
        const rect = devices[id].getBoundingClientRect();
        return [id, [rect.width / width * 50, rect.height / height * 50]];
      }));
      return { x: box.left + board.clientLeft, y: box.top + board.clientTop, width, height, halves };
    }

    function point(event, bounds, bounded = true) {
      const x = (event.clientX - bounds.x) / bounds.width * 100;
      const y = (event.clientY - bounds.y) / bounds.height * 100;
      return bounded ? [clamp(x, 0, 100), clamp(y, 0, 100)] : [x, y];
    }

    function track(position, { halves }) {
      const id = keys.find(key => {
        const [x, y] = positions[key];
        const [rx, ry] = halves[key];
        return Math.abs(position[0] - x) <= rx && Math.abs(position[1] - y) <= ry;
      });
      showCursor(position, id);
    }

    function moveDevice(id, target, { width, height, halves }) {
      const [ox, oy] = positions[id];
      const [rx, ry] = halves[id];
      const gapX = 4 / width * 100;
      const gapY = 4 / height * 100;
      const x = clamp(target[0], Math.min(50, rx + gapX), Math.max(50, 100 - rx - gapX));
      const y = clamp(target[1], Math.min(50, ry + gapY), Math.max(50, 100 - ry - gapY));
      const overlap = ([cx, cy]) => keys.reduce((sum, key) => {
        if (key === id) return sum;
        const [px, py] = positions[key];
        const [hx, hy] = halves[key];
        const across = Math.max(0, Math.min(rx * 2, hx * 2, rx + hx + gapX - Math.abs(cx - px)));
        const down = Math.max(0, Math.min(ry * 2, hy * 2, ry + hy + gapY - Math.abs(cy - py)));
        return sum + across * down;
      }, 0);
      const prior = overlap([ox, oy]);
      const choices = [[x, y], [x, oy], [ox, y]];
      const legal = choices.filter(candidate => {
        if (candidate[0] === ox && candidate[1] === oy) return false;
        const coverage = overlap(candidate);
        // If very narrow initial CSS creates overlap, only permit moves that improve it.
        return coverage === 0 || coverage < prior;
      });
      if (!legal.length) return false;
      legal.sort((a, b) => distance(a, target, width, height) - distance(b, target, width, height));
      positions[id] = legal[0];
      draw();
      showCursor(positions[id], id);
      return true;
    }

    function distance(a, b, width, height) {
      return Math.hypot((a[0] - b[0]) * width, (a[1] - b[1]) * height);
    }

    function end(event) {
      if (!gesture || gesture.pointer !== event.pointerId) return;
      gesture = null;
      delete board.dataset.layoutDragging;
      if (board.hasPointerCapture(event.pointerId)) board.releasePointerCapture(event.pointerId);
    }

    board.addEventListener('pointerdown', event => {
      if (gesture || event.button !== 0 || event.isPrimary === false) return;
      const bounds = measure();
      if (!bounds) return;
      const id = event.target.closest('[data-layout-device]')?.dataset.layoutDevice;
      const position = point(event, bounds, false);
      const drag = movable.includes(id) ? id : null;
      gesture = {
        pointer: event.pointerId, drag, moved: false,
        start: [event.clientX, event.clientY],
        offset: drag ? [position[0] - positions[id][0], position[1] - positions[id][1]] : [0, 0],
      };
      if (drag) showCursor(positions[id], id);
      else track(point(event, bounds), bounds);
      board.setPointerCapture(event.pointerId);
    });

    function move(event) {
      if (gesture && gesture.pointer !== event.pointerId) return;
      if (!gesture && event.pointerType === 'touch') return;
      const bounds = measure();
      if (!bounds) return;
      if (!gesture?.drag) {
        track(point(event, bounds), bounds);
        return;
      }
      if (!gesture.moved && Math.hypot(event.clientX - gesture.start[0], event.clientY - gesture.start[1]) < 4) return;
      gesture.moved = true;
      board.dataset.layoutDragging = gesture.drag;
      const [x, y] = point(event, bounds, false);
      moveDevice(gesture.drag, [x - gesture.offset[0], y - gesture.offset[1]], bounds);
    }

    board.addEventListener('pointermove', move);
    board.addEventListener('pointerup', event => {
      if (!gesture || gesture.pointer !== event.pointerId) return;
      move(event);
      end(event);
    });
    board.addEventListener('pointercancel', end);
    board.addEventListener('lostpointercapture', end);

    board.addEventListener('keydown', event => {
      const direction = arrows[event.key];
      if (!direction || event.altKey || event.ctrlKey || event.metaKey || gesture) return;
      const [dx, dy] = direction;
      const bounds = measure();
      if (!bounds) return;
      const id = event.target.dataset.layoutDevice;
      if (movable.includes(id)) {
        event.preventDefault();
        const [x, y] = positions[id];
        const step = event.shiftKey ? 20 : 8;
        if (moveDevice(id, [x + dx * step / bounds.width * 100, y + dy * step / bounds.height * 100], bounds)) {
          status.textContent = `${names[id]} 위치를 옮겼어요.`;
        }
        return;
      }
      if (event.target !== board) return;
      event.preventDefault();
      const [x, y] = positions[current];
      const ranked = keys.filter(key => key !== current).map(key => {
        const [tx, ty] = positions[key];
        const px = (tx - x) * bounds.width;
        const py = (ty - y) * bounds.height;
        const forward = px * dx + py * dy;
        const sideways = Math.abs(px * dy - py * dx);
        return { key, forward, sideways, score: Math.hypot(px, py) + sideways * 0.8 };
      }).filter(candidate => candidate.forward > 0);
      const aligned = ranked.filter(candidate => candidate.sideways <= candidate.forward);
      const next = (aligned.length ? aligned : ranked).sort((a, b) => a.score - b.score)[0];
      if (next) showCursor(positions[next.key], next.key);
    });

    function restore() {
      if (gesture) end({ pointerId: gesture.pointer });
      positions = Object.fromEntries(keys.map(id => [id, [...initial[id]]]));
      draw();
      delete cursor.dataset.device;
      showCursor(positions.pc, 'pc');
    }
    reset.addEventListener('click', restore);
    root.setAttribute('data-ready', '');
    restore();
  }
})();
