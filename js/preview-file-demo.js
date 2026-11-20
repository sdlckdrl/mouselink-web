(() => {
  'use strict';
  const messages = {
    "ko": {
      "names": [
        "여행 사진.jpg",
        "작업 문서.pdf",
        "메모.txt"
      ],
      "folder": "파일 탐색기 · 공유 폴더",
      "windows": "Windows 예시 파일",
      "mac": "Mac 바탕화면",
      "hint": "이 체험에서는 파일이 복사되지 않고 옮겨져요. Windows와 Mac 어느 쪽이든 빈 곳을 드래그해 여러 파일을 선택하고, 선택한 파일 하나를 옆 화면으로 끌어 놓으세요.",
      "move": "선택한 파일 이동",
      "toMac": "Mac으로 이동",
      "toWindows": "Windows로 이동",
      "reset": "다시 시작",
      "resetStatus": "파일을 모두 Windows로 돌려놓았어요.",
      "selected": "{n}개 선택했어요.",
      "marquee": "{n}개 선택했어요. 선택한 파일 하나를 끌면 함께 옮겨져요.",
      "none": "선택된 파일이 없어요.",
      "moved": "{files} · {destination} 옮겼어요.",
      "invalid": "다른 화면 안에 놓아야 파일이 옮겨져요."
    },
    "en": {
      "names": [
        "Travel photo.jpg",
        "Work document.pdf",
        "Note.txt"
      ],
      "folder": "File Explorer · Shared folder",
      "windows": "Sample Windows files",
      "mac": "Mac desktop",
      "hint": "In this demo, files move instead of being copied. Drag from empty space on either screen to select several files, then drag one of the selected files to the other screen.",
      "move": "Move selected files",
      "toMac": "Move to Mac",
      "toWindows": "Move to Windows",
      "reset": "Reset demo",
      "resetStatus": "All files are back on Windows.",
      "selected": "Selected {n}.",
      "marquee": "Selected {n}. Drag any selected file to move them together.",
      "none": "No files selected.",
      "moved": "{files} · Moved to {side}.",
      "invalid": "Drop inside the other screen to move your files."
    },
    "es": {
      "names": [
        "Foto del viaje.jpg",
        "Documento de trabajo.pdf",
        "Nota.txt"
      ],
      "folder": "Explorador de archivos · Carpeta compartida",
      "windows": "Archivos de ejemplo en Windows",
      "mac": "Escritorio del Mac",
      "hint": "En esta demo, los archivos se mueven en vez de copiarse. Arrastra desde un espacio vacío de cualquiera de las pantallas para seleccionar varios archivos y lleva uno de ellos a la otra pantalla.",
      "move": "Mover archivos seleccionados",
      "toMac": "Mover al Mac",
      "toWindows": "Mover a Windows",
      "reset": "Reiniciar la demo",
      "resetStatus": "Todos los archivos volvieron a Windows.",
      "selected": "Seleccionados: {n}.",
      "marquee": "Seleccionados: {n}. Arrastra uno para moverlos juntos.",
      "none": "No hay archivos seleccionados.",
      "moved": "{files} · Se movieron a {side}.",
      "invalid": "Suelta los archivos dentro de la otra pantalla para moverlos."
    },
    "ja": {
      "names": [
        "旅行の写真.jpg",
        "作業資料.pdf",
        "メモ.txt"
      ],
      "folder": "エクスプローラー · 共有フォルダー",
      "windows": "Windowsのサンプルファイル",
      "mac": "Macのデスクトップ",
      "hint": "このデモではファイルをコピーせずに移動します。どちらの画面でも、空いている場所からドラッグして複数選択し、選択したファイルを一つ隣の画面へドラッグしてください。",
      "move": "選択したファイルを移動",
      "toMac": "Macへ移動",
      "toWindows": "Windowsへ移動",
      "reset": "デモをリセット",
      "resetStatus": "すべてのファイルをWindowsに戻しました。",
      "selected": "{n}個選択しました。",
      "marquee": "{n}個選択しました。一つをドラッグするとまとめて移動できます。",
      "none": "選択されたファイルはありません。",
      "moved": "{files} · {side}に移動しました。",
      "invalid": "移動するには、もう一方の画面内にドロップしてください。"
    },
    "zh": {
      "names": [
        "旅行照片.jpg",
        "工作文档.pdf",
        "备忘录.txt"
      ],
      "folder": "文件资源管理器 · 共享文件夹",
      "windows": "Windows 示例文件",
      "mac": "Mac 桌面",
      "hint": "此演示会移动文件，而不是复制文件。从任意屏幕的空白处拖动可选择多个文件，然后把其中一个拖到另一块屏幕即可一起移动。",
      "move": "移动所选文件",
      "toMac": "移到 Mac",
      "toWindows": "移到 Windows",
      "reset": "重置演示",
      "resetStatus": "所有文件已移回 Windows。",
      "selected": "已选中 {n} 个文件。",
      "marquee": "已选中 {n} 个文件。拖动任意一个即可一起移走。",
      "none": "未选中文件。",
      "moved": "{files} · 已移到 {side}。",
      "invalid": "请在另一块屏幕内松开以移动文件。"
    }
  };
  const language = document.documentElement.lang.toLowerCase().split('-')[0];
  const copy = messages[language] || messages.en;
  const files = [
    {id: 'photo', name: copy.names[0], type: 'photo', mark: 'JPG'},
    {id: 'work', name: copy.names[1], type: 'pdf', mark: 'PDF'},
    {id: 'note', name: copy.names[2], type: 'text', mark: 'TXT'},
  ];
  const photo = '/assets/preview/file-transfer-desk.webp';
  const mounts = new WeakMap();
  const format = (text, fields) => text.replace(/\{(\w+)\}/g, (_, key) => fields[key]);
  const other = side => side === 'windows' ? 'mac' : 'windows';
  const sideName = side => side === 'windows' ? 'Windows' : 'Mac';

  function node(tag, classes, text) {
    const element = document.createElement(tag);
    if (classes) element.className = classes.split(' ').map(name => `om-file-${name}`).join(' ');
    if (text) element.textContent = text;
    return element;
  }
  function button(classes, text) {
    const element = node('button', classes, text);
    element.type = 'button';
    return element;
  }
  function fileIcon(file) {
    const icon = node('span', `icon icon-${file.type}`, file.mark);
    icon.setAttribute('aria-hidden', 'true');
    return icon;
  }
  function inside(rect, point) {
    return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
  }
  function intersects(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }
  const pointOf = event => ({x: event.clientX, y: event.clientY});

  function mount(panel) {
    if (!panel || panel.nodeType !== 1) throw new TypeError('Expected a file demo panel.');
    if (mounts.has(panel)) return mounts.get(panel);
    const root = node('div', 'demo');
    const stage = node('div', 'stage');
    const backdrop = node('img', 'backdrop');
    Object.assign(backdrop, {src: photo, alt: '', width: 1536, height: 1024, draggable: false});
    const windows = node('div', 'windows-screen');
    const explorer = node('div', 'explorer');
    const title = node('div', 'explorer-title');
    const folderIcon = node('span', 'folder-icon');
    folderIcon.setAttribute('aria-hidden', 'true');
    title.append(folderIcon, node('span', 'folder-title', copy.folder));
    const grid = node('div', 'file-grid');
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', copy.windows);
    explorer.append(title, grid);
    windows.append(explorer);

    const mac = node('div', 'mac-screen');
    const desktop = node('div', 'received');
    desktop.setAttribute('role', 'group');
    desktop.setAttribute('aria-label', copy.mac);
    const macTitle = node('span', 'menu-bar', copy.mac);
    macTitle.setAttribute('aria-hidden', 'true');
    mac.append(macTitle, desktop);
    const layers = {windows: grid, mac: desktop};
    const screens = {windows, mac};

    const marquee = node('div', 'marquee');
    const ghost = node('div', 'ghost');
    const fallbackCursor = node('span', 'cursor');
    fallbackCursor.innerHTML = '<svg viewBox="0 0 25 29" aria-hidden="true"><path d="M1 1 2 23l6-6 5 10 4-2-5-10h8z" fill="#fff" stroke="#102638" stroke-width="2" stroke-linejoin="round"/></svg>';
    for (const decoration of [marquee, ghost, fallbackCursor]) {
      decoration.hidden = true;
      decoration.setAttribute('aria-hidden', 'true');
    }
    stage.append(backdrop, windows, mac, marquee, ghost, fallbackCursor);
    backdrop.addEventListener('error', () => stage.classList.add('om-file-photo-missing'));
    if (backdrop.complete && !backdrop.naturalWidth) stage.classList.add('om-file-photo-missing');

    const hint = node('p', 'hint', copy.hint);
    const tools = node('div', 'actions');
    const moveButton = button('action', copy.move);
    const resetButton = button('action', copy.reset);
    tools.append(moveButton, resetButton);
    const status = node('p', 'status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-atomic', 'true');
    root.append(stage, hint, tools, status);
    panel.append(root);

    // One real button per example file. Moving reparents that button; it never leaves a copy.
    const items = new Map();
    const locations = new Map();
    const macSlots = new Map();
    const selected = new Set();
    let gesture = null;
    let suppressClickUntil = 0;
    let cursorTimer;
    files.forEach(file => {
      const item = button('source');
      item.dataset.omFile = file.id;
      item.append(fileIcon(file), node('span', 'filename', file.name));
      items.set(file.id, item);
      locations.set(file.id, 'windows');
      grid.append(item);
    });

    const selectionSide = () => locations.get(selected.values().next().value);
    const countText = (message = copy.selected) => format(message, {n: selected.size});
    function update() {
      for (const [id, item] of items) item.setAttribute('aria-pressed', String(selected.has(id)));
      const from = selectionSide();
      moveButton.disabled = !from;
      moveButton.textContent = from === 'windows' ? copy.toMac : from === 'mac' ? copy.toWindows : copy.move;
    }
    function flip(id) {
      if (selected.size && selectionSide() !== locations.get(id)) selected.clear();
      if (selected.has(id)) selected.delete(id);
      else selected.add(id);
      update();
      status.textContent = selected.size ? countText() : copy.none;
    }
    function nearestMacSlot(point) {
      const bounds = mac.getBoundingClientRect();
      const x = point && bounds.width ? (point.x - bounds.left) / bounds.width : .67;
      const y = point && bounds.height ? (point.y - bounds.top) / bounds.height : .28;
      const taken = new Set(macSlots.values());
      const candidates = [];
      for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
        const index = row * 4 + col;
        if (taken.has(index)) continue;
        const left = (col + .5) / 4;
        const top = .24 + row * .25;
        candidates.push({index, left, top, distance: (left - x) ** 2 + (top - y) ** 2});
      }
      return candidates.sort((a, b) => a.distance - b.distance)[0];
    }
    function place(id, to, slot) {
      const item = items.get(id);
      if (to === 'mac') {
        item.className = 'om-file-source om-file-received-file';
        item.dataset.omReceived = id;
        item.style.left = `${slot.left * 100}%`;
        item.style.top = `${slot.top * 100}%`;
        macSlots.set(id, slot.index);
        desktop.append(item);
      } else {
        item.className = 'om-file-source';
        delete item.dataset.omReceived;
        item.style.left = '';
        item.style.top = '';
        macSlots.delete(id);
        // Restore original ordering without rebuilding neighboring files or their focus.
        const later = files.slice(files.findIndex(file => file.id === id) + 1)
          .find(file => locations.get(file.id) === 'windows');
        grid.insertBefore(item, later ? items.get(later.id) : null);
      }
      locations.set(id, to);
    }
    function moveSelection(from, point) {
      if (!from || from !== selectionSide()) return;
      const to = other(from);
      const transferFocused = document.activeElement === moveButton;
      const names = [];
      let firstMoved;
      for (const file of files) {
        if (!selected.has(file.id) || locations.get(file.id) !== from) continue;
        const slot = to === 'mac' ? nearestMacSlot(point) : null;
        if (to === 'mac' && !slot) continue;
        place(file.id, to, slot);
        firstMoved ||= items.get(file.id);
        names.push(file.name);
      }
      selected.clear();
      update();
      if (names.length) {
        status.textContent = format(copy.moved, {files: names.join(', '), side: sideName(to), destination: to === 'mac' ? 'Mac으로' : 'Windows로'});
        // A keyboard user can continue from the first file on the destination side.
        if (transferFocused) firstMoved.focus();
      }
    }

    function showFallbackCursor(point) {
      clearTimeout(cursorTimer);
      const bounds = stage.getBoundingClientRect();
      fallbackCursor.hidden = !inside(bounds, point);
      if (fallbackCursor.hidden) return;
      fallbackCursor.style.left = `${point.x - bounds.left}px`;
      fallbackCursor.style.top = `${point.y - bounds.top}px`;
    }
    function endGesture() {
      const previous = gesture;
      gesture = null;
      marquee.hidden = ghost.hidden = true;
      for (const screen of Object.values(screens)) screen.classList.remove('om-file-target-over');
      if (previous && stage.hasPointerCapture?.(previous.id)) stage.releasePointerCapture(previous.id);
    }
    function restoreSelection(previous) {
      selected.clear();
      previous.before.forEach(id => selected.add(id));
      update();
    }
    function interruptGesture() {
      if (!gesture) return;
      if (gesture.active) restoreSelection(gesture);
      suppressClickUntil = Date.now() + 450;
      endGesture();
      clearTimeout(cursorTimer);
      fallbackCursor.hidden = true;
    }
    function reset() {
      endGesture();
      clearTimeout(cursorTimer);
      fallbackCursor.hidden = true;
      for (const file of files) if (locations.get(file.id) !== 'windows') place(file.id, 'windows');
      selected.clear();
      update();
      status.textContent = copy.resetStatus;
    }
    function markGhost(point) {
      const scene = stage.getBoundingClientRect();
      ghost.style.left = `${point.x - scene.left}px`;
      ghost.style.top = `${point.y - scene.top}px`;
      ghost.hidden = false;
      const target = screens[other(gesture.side)];
      target.classList.toggle('om-file-target-over', inside(target.getBoundingClientRect(), point));
    }
    function markMarquee(point) {
      const limit = layers[gesture.side].getBoundingClientRect();
      const scene = stage.getBoundingClientRect();
      const x = Math.max(limit.left, Math.min(limit.right, point.x));
      const y = Math.max(limit.top, Math.min(limit.bottom, point.y));
      const start = gesture.start;
      const area = {left: Math.min(start.x, x), top: Math.min(start.y, y), right: Math.max(start.x, x), bottom: Math.max(start.y, y)};
      marquee.hidden = false;
      marquee.style.left = `${area.left - scene.left}px`;
      marquee.style.top = `${area.top - scene.top}px`;
      marquee.style.width = `${area.right - area.left}px`;
      marquee.style.height = `${area.bottom - area.top}px`;
      selected.clear();
      if (gesture.additive) gesture.before.forEach(id => {
        if (locations.get(id) === gesture.side) selected.add(id);
      });
      for (const [id, item] of items) {
        if (locations.get(id) === gesture.side && intersects(area, item.getBoundingClientRect())) selected.add(id);
      }
      update();
    }

    for (const [side, layer] of Object.entries(layers)) {
      layer.addEventListener('click', event => {
        if (Date.now() < suppressClickUntil && event.detail !== 0) return;
        const item = event.target.closest('[data-om-file]');
        if (item && layer.contains(item)) flip(item.dataset.omFile);
      });
      layer.addEventListener('pointerdown', event => {
        if (gesture || !['mouse', 'touch', 'pen'].includes(event.pointerType) || event.button !== 0 || event.isPrimary === false) return;
        const item = event.target.closest('[data-om-file]');
        const touch = event.pointerType !== 'mouse';
        const start = pointOf(event);
        gesture = {id: event.pointerId, side, start, touch, file: item?.dataset.omFile, active: false,
          additive: event.ctrlKey || event.metaKey || event.shiftKey, before: new Set(selected)};
        if (touch) {event.preventDefault();showFallbackCursor(start);}
      });
    }
    moveButton.addEventListener('click', () => moveSelection(selectionSide()));
    resetButton.addEventListener('click', reset);
    stage.addEventListener('pointerdown', () => {if (!gesture) suppressClickUntil = 0;}, {capture: true});
    stage.addEventListener('lostpointercapture', event => {if (gesture?.id === event.pointerId && event.target === stage) interruptGesture();});
    window.addEventListener('blur', interruptGesture);
    window.addEventListener('pointermove', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const point = pointOf(event);
      if (gesture.touch) showFallbackCursor(point);
      if (!gesture.active) {
        if (Math.hypot(point.x - gesture.start.x, point.y - gesture.start.y) < 6) return;
        gesture.active = true;
        if (event.isTrusted) stage.setPointerCapture?.(event.pointerId);
        if (gesture.file) {
          if (!selected.has(gesture.file)) {selected.clear();selected.add(gesture.file);update();}
          ghost.replaceChildren(fileIcon(files.find(file => file.id === gesture.file)), node('span', 'ghost-label', countText()));
        }
      }
      if (gesture.file) markGhost(point);
      else markMarquee(point);
    });
    window.addEventListener('pointerup', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const current = gesture;
      const point = pointOf(event);
      endGesture();
      if (current.touch) {
        showFallbackCursor(point);
        clearTimeout(cursorTimer);
        cursorTimer = setTimeout(() => {fallbackCursor.hidden = true;}, 850);
        suppressClickUntil = Date.now() + 450;
        if (!current.active && current.file && inside(items.get(current.file).getBoundingClientRect(), point)) flip(current.file);
      }
      if (!current.active) return;
      suppressClickUntil = Date.now() + 450;
      if (!current.file) status.textContent = selected.size ? countText(copy.marquee) : copy.none;
      else if (inside(screens[other(current.side)].getBoundingClientRect(), point)) moveSelection(current.side, point);
      else {
        restoreSelection(current);
        status.textContent = copy.invalid;
      }
    });
    window.addEventListener('pointercancel', event => {if (gesture?.id === event.pointerId) interruptGesture();});
    root.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      if (gesture) interruptGesture();
      else {selected.clear();update();status.textContent = copy.none;}
    });
    update();
    const instance = {reset};
    mounts.set(panel, instance);
    return instance;
  }
  window.OneMouseFileDemo = {mount};
})();
