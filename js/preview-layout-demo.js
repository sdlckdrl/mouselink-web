(() => {
  'use strict';

  const initial = { pc: [50, 47], mac: [18, 43], phone: [48, 83], tablet: [83, 47] };
  const defaultSides = { mac: 'left', phone: 'bottom', tablet: 'right' };
  const edges = { left: [0, -1], right: [0, 1], top: [1, -1], bottom: [1, 1] };
  const edgeKeys = Object.keys(edges);
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
    let positions = { pc: initial.pc };
    let docks, lastSize;
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

    function nearestDock(id, target, bounds, occupied, sides = edgeKeys) {
      const { width, height, halves } = bounds;
      const dims = [width, height];
      const gap = dims.map(size => 100 / size); // one actual CSS pixel
      const margin = gap.map(n => n * 3);
      const own = halves[id], pc = halves.pc;
      const candidates = [];
      for (const side of sides) {
        const [normal, sign] = edges[side];
        const tangent = 1 - normal;
        const fixed = initial.pc[normal] + sign * (pc[normal] + own[normal] + gap[normal]);
        if (fixed < own[normal] + margin[normal] || fixed > 100 - own[normal] - margin[normal]) continue;
        const pcAlong = initial.pc[tangent];
        // Keep a visible length of edge contact, not merely corner-to-corner.
        const reach = pc[tangent] + own[tangent] - Math.min(gap[tangent] * 6, own[tangent], pc[tangent]);
        const low = Math.max(own[tangent] + margin[tangent], pcAlong - reach);
        const high = Math.min(100 - own[tangent] - margin[tangent], pcAlong + reach);
        if (low > high) continue;
        let intervals = [[low, high]];
        for (const [other, center] of Object.entries(occupied)) {
          if (other === id || other === 'pc') continue;
          const size = halves[other];
          if (Math.abs(fixed - center[normal]) >= own[normal] + size[normal] + gap[normal] - 1e-7) continue;
          const radius = own[tangent] + size[tangent] + gap[tangent];
          const left = center[tangent] - radius, right = center[tangent] + radius;
          intervals = intervals.flatMap(([a, b]) => {
            const next = [];
            if (a <= Math.min(b, left)) next.push([a, Math.min(b, left)]);
            if (Math.max(a, right) <= b) next.push([Math.max(a, right), b]);
            return next;
          });
        }
        for (const [a, b] of intervals) {
          const pos = [];
          pos[normal] = fixed;
          pos[tangent] = clamp(target[tangent], a, b);
          candidates.push({ side, pos, cost: distance(pos, target, width, height) });
        }
      }
      return candidates.sort((a, b) => a.cost - b.cost)[0];
    }

    function dragDevice(id, target, { width, height, halves }) {
      const [ox, oy] = positions[id];
      const [rx, ry] = halves[id];
      const gx = 3 / width * 100, gy = 3 / height * 100;
      const x = clamp(target[0], rx + gx, 100 - rx - gx);
      const y = clamp(target[1], ry + gy, 100 - ry - gy);
      const fitting = ([cx, cy]) => keys.every(key => {
        if (key === id) return true;
        const [px, py] = positions[key];
        return Math.abs(cx - px) + 1e-7 >= rx + halves[key][0] || Math.abs(cy - py) + 1e-7 >= ry + halves[key][1];
      });
      const best = [[x, y], [x, oy], [ox, y]].filter(fitting)
        .sort((a, b) => distance(a, target, width, height) - distance(b, target, width, height))[0];
      if (best) positions[id] = best;
      draw();
      showCursor(positions[id], id);
    }

    function applyDock(id, dock) {
      if (!dock) return false;
      docks[id] = dock;
      positions[id] = dock.pos;
      draw();
      showCursor(dock.pos, id);
      return true;
    }

    function reflow(bounds) {
      // Try every ordering: preserving all current sides takes priority over
      // sliding a neighbor by as little as possible.
      let best;
      for (const first of movable) {
        for (const second of movable.filter(id => id !== first)) {
          const third = movable.find(id => id !== first && id !== second);
          const occupied = { pc: initial.pc };
          let noFit = false, switched = 0, cost = 0;
          const fitted = {};
          for (const id of [first, second, third]) {
            const previous = docks[id];
            const choices = [previous.side, ...edgeKeys.filter(side => side !== previous.side)];
            const dock = nearestDock(id, previous.pos, bounds, occupied, choices.slice(0, 1))
              || nearestDock(id, previous.pos, bounds, occupied, choices.slice(1));
            if (!dock) { noFit = true; break; }
            switched += Number(dock.side !== previous.side);
            cost += dock.cost;
            fitted[id] = dock;
            occupied[id] = dock.pos;
          }
          if (!noFit && (!best || switched < best.switched || (switched === best.switched && cost < best.cost))) {
            best = { occupied, fitted, switched, cost };
          }
        }
      }
      if (!best) return;
      positions = best.occupied;
      docks = best.fitted;
      draw();
      showCursor(positions[current], current);
    }

    function distance(a, b, width, height) {
      return Math.hypot((a[0] - b[0]) * width, (a[1] - b[1]) * height);
    }

    function end(event, drop = false) {
      if (!gesture || gesture.pointer !== event.pointerId) return;
      const { drag, moved, target } = gesture;
      gesture = null;
      delete board.dataset.layoutDragging;
      if (board.hasPointerCapture(event.pointerId)) board.releasePointerCapture(event.pointerId);
      if (!drag || !moved) return;
      const bounds = drop && measure();
      applyDock(drag, (bounds && nearestDock(drag, target, bounds, positions)) || docks[drag]);
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
      if (drag) showCursor(point(event, bounds), id);
      else track(point(event, bounds), bounds);
      if (event.isTrusted) board.setPointerCapture(event.pointerId);
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
      gesture.target = [x - gesture.offset[0], y - gesture.offset[1]];
      dragDevice(gesture.drag, gesture.target, bounds);
    }

    board.addEventListener('pointermove', move);
    board.addEventListener('pointerup', event => {
      if (!gesture || gesture.pointer !== event.pointerId) return;
      move(event);
      end(event, true);
    });
    board.addEventListener('pointercancel', event => end(event));
    board.addEventListener('lostpointercapture', event => end(event));

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
        const prev = docks[id];
        const requested = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'top', ArrowDown: 'bottom' }[event.key];
        const tangent = edges[prev.side][0] === 0 ? dy : dx;
        const target = [x + dx * step / bounds.width * 100, y + dy * step / bounds.height * 100];
        // Slide along the current edge; if stopped at its limit, move around
        // the corner. An arrow towards the opposite edge docks there directly.
        let dock = tangent ? nearestDock(id, target, bounds, positions, [prev.side]) : null;
        if (!dock || distance(dock.pos, prev.pos, bounds.width, bounds.height) < .01) {
          if (prev.side !== requested) dock = nearestDock(id, target, bounds, positions, [requested]);
        }
        if (dock && distance(dock.pos, prev.pos, bounds.width, bounds.height) >= .01 && applyDock(id, dock)) {
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

    function resized(force = false) {
      const bounds = measure();
      if (!bounds) return;
      const size = JSON.stringify([bounds.width, bounds.height, bounds.halves]);
      if (!force && lastSize === size) return;
      lastSize = size;
      if (gesture) end({ pointerId: gesture.pointer });
      reflow(bounds);
    }
    function restore() {
      if (gesture) end({ pointerId: gesture.pointer });
      docks = Object.fromEntries(movable.map(id => [id, { side: defaultSides[id], pos: initial[id] }]));
      delete cursor.dataset.device;
      current = 'pc';
      resized(true);
    }
    reset.addEventListener('click', restore);
    root.setAttribute('data-ready', '');
    restore();
    if (typeof ResizeObserver === 'function') new ResizeObserver(() => resized()).observe(board);
    else window.addEventListener('resize', () => resized());
  }
})();
