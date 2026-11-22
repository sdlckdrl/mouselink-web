(() => {
  'use strict';
  const copy = {
    ko: ['메모장','스크린샷','파일 넘기기','복사','붙여넣기','닫기','메모를 써 보세요.','파일을 골라 옆 화면으로 끌어 보세요.','화면에서 영역을 드래그하세요. Enter: 전체 화면','가상 화면 캡처','복사했어요.','붙여넣었어요.','복사할 텍스트를 선택하세요.','먼저 메모에서 텍스트를 복사하세요.','캡처할 영역을 다시 골라 보세요.','이동한 화면: '],
    en: ['Notepad','Screenshot','Move file','Copy','Paste','Close','Write a note…','Drag a file onto the other screen.','Drag on the screen. Enter: whole screen.','Virtual screenshot','Copied.','Pasted.','Select the text to copy.','Copy some text from a note first.','Try selecting the region again.','Moved to: '],
    es: ['Bloc de notas','Captura','Mover archivo','Copiar','Pegar','Cerrar','Escribe una nota…','Arrastra un archivo a la otra pantalla.','Arrastra en la pantalla. Intro: pantalla completa.','Captura de pantalla virtual','Copiado.','Pegado.','Selecciona el texto que quieres copiar.','Copia primero texto de una nota.','Vuelve a seleccionar la zona.','Movido a: '],
    ja: ['メモ帳','スクリーンショット','ファイル移動','コピー','貼り付け','閉じる','メモを書いてみましょう。','ファイルを別の画面にドラッグします。','画面上でドラッグします。Enter：画面全体。','仮想画面のキャプチャ','コピーしました。','貼り付けました。','コピーするテキストを選択してください。','先にメモからテキストをコピーしてください。','範囲をもう一度選択してください。','移動先：'],
    zh: ['记事本','截图','移动文件','复制','粘贴','关闭','写一条笔记…','把文件拖到另一块屏幕。','在屏幕上拖动选区。按 Enter 截取整屏。','虚拟屏幕截图','已复制。','已粘贴。','请选择要复制的文字。','请先从记事本复制文字。','请重新选择截图区域。','已移动到：'],
  };
  const transfer = {
    ko: ['보내기','취소','선택한 파일','받은 화면: ','카드의 빈 곳을 밀어 커서를 움직여요. 잠깐 누른 뒤 밀면 선택하거나 끌 수 있어요.','빈 곳에서 여러 파일을 선택한 뒤 옆 화면으로 끌어요.'],
    en: ['Send','Cancel','Files selected','Received on: ','Swipe on any blank part of the card to move the cursor. Hold, then slide to select or drag.','Drag from a blank area to select files, then drag them to the other screen.'],
    es: ['Enviar','Cancelar','Archivos seleccionados','Recibido en: ','Desliza en una zona libre de la tarjeta para mover el cursor. Mantén pulsado y desliza para seleccionar o arrastrar.','Selecciona archivos desde una zona vacía y arrástralos a la otra pantalla.'],
    ja: ['送信','キャンセル','選択したファイル','受信先：','カードの空いている所で指を滑らせるとカーソルが動きます。少し押してから滑らせると選択やドラッグができます。','空いている所からファイルを囲み、別の画面へドラッグします。'],
    zh: ['发送','取消','已选文件','接收设备：','在卡片空白处滑动即可移动光标。按住片刻再滑动，即可框选或拖动。','从空白处框选文件，然后拖到另一块屏幕。'],
  };
  const iconPaths = {
    document: '<path d="M6 3h8l4 4v14H6zM10 12h4m-4 4h4"/>',
    photo: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="m6 16 4-5 3 3 2-2 3 4"/>',
    archive: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M12 5v3m0 2v2m0 2v3"/>',
    note: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 9h6m-6 3h6m-6 3h4"/>',
    screenshot: '<path d="M4 10V5h5m6 0h5v5m0 4v5h-5m-6 0H4v-5M8 12h8m-4-4v8"/>',
    move: '<path d="M4 8h15l-3-3m4 11H5l3 3"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 5V4H4v12h1"/>',
    paste: '<path d="M8 5H5v15h14V5h-3M9 12h6m-6 4h4"/><rect x="8" y="3" width="8" height="5" rx="1"/>',
  };
  const icon = (name) => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">' + iconPaths[name] + '</svg>';
  const create = (tag, cls) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    return el;
  };
  const button = (label, glyph, cls = 'handoff-command') => {
    const el = create('button', cls);
    el.type = 'button';
    if (glyph) el.innerHTML = icon(glyph);
    el.append(label);
    return el;
  };
  const place = (node, {x,y,width,height}, unit = 'px') => {
    node.style.left = x + unit; node.style.top = y + unit;
    if (width !== undefined) node.style.width = width + unit;
    if (height !== undefined) node.style.height = height + unit;
  };
  const extent = (points, inset = false) => {
    const [[ax,ay],[bx,by],[cx,cy],[dx,dy]] = points;
    const low = inset ? Math.max : Math.min, high = inset ? Math.min : Math.max;
    const x = low(ax, dx), y = low(ay, by);
    return {x, y, width:high(bx, cx)-x, height:high(cy, dy)-y};
  };
  const focusEditorFor = (e) => {
    if (e.pointerType === 'touch' || e.sourceCapabilities?.firesTouchEvents) return false;
    return e.detail === 0 || e.pointerType === 'mouse' || !window.matchMedia?.('(pointer: coarse)').matches;
  };
  const inside = ({x,y}, r) => x >= r.x && x <= r.x+r.width && y >= r.y && y <= r.y+r.height;
  const overlap = (a, b) => a && b && a.width > 0 && a.height > 0 &&
    a.x < b.x+b.width && a.x+a.width > b.x && a.y < b.y+b.height && a.y+a.height > b.y;
  const percent = (r, bounds) => ({
    x:r.x * bounds.width/100, y:r.y * bounds.height/100,
    width:r.width * bounds.width/100, height:r.height * bounds.height/100,
  });

  function mount({demo, scene, photo, lang, device, active, glass, acquire, select}) {
    const [
      notepad, capture, move, copyText, pasteText, closeText, placeholder, _dragHint, captureHint,
      captured, copied, pasted, chooseText, noClipboard, chooseRegion, moved,
    ] = copy[lang.split('-')[0]] || copy.en;
    const [send, cancel, filesSelected, received, touchHint, groupHint] =
      transfer[lang.split('-')[0]] || transfer.en;
    const captureApi = window.OneMouseGuideCapture;
    const screenActions = new WeakMap();
    // Register only our in-screen buttons. Direct and virtual input share one
    // action without inventing a DOM click or touching anything outside the demo.
    function onScreenAction(control, side, run) {
      screenActions.set(control,{side,run});
      control.addEventListener('click', (e) => run(focusEditorFor(e)));
    }
    const desktops = [0,1].map((side) => {
      const desktop = create('div','handoff-desktop');
      const icons = create('div','handoff-icons');
      const note = button('','note','');
      const label = create('span','handoff-file-label'); label.textContent = notepad; note.append(label);
      note.dataset.noteLaunch = '';
      note.dataset.kind = 'note';
      const app = makeEditor(side, note);
      onScreenAction(note,side, (focus) => app.open(note,focus));
      desktop.append(icons, app.editor);
      scene.append(desktop);
      return {desktop, icons, note, app};
    });
    const tools = create('div','handoff-tools');
    const noteButton = button(notepad,'note'), shotButton = button(capture,'screenshot'), moveButton = button(move,'move');
    shotButton.setAttribute('aria-keyshortcuts','Control+Alt+S');
    const chord = create('kbd','handoff-chord');
    chord.textContent = 'Ctrl+Alt+S'; chord.setAttribute('aria-hidden','true');
    shotButton.append(chord);
    shotButton.setAttribute('aria-pressed','false');
    shotButton.hidden = !captureApi;
    tools.append(noteButton, shotButton, moveButton);
    const feedback = create('p','handoff-feedback');
    feedback.setAttribute('role','status');
    const result = create('section','handoff-capture-result');
    result.hidden = true;
    result.setAttribute('role','group');
    // In the real flow even a remote crop opens on the controlling Windows PC.
    desktops[0].desktop.append(result);
    demo.querySelector('.handoff-hint').before(tools, feedback);
    const resultHead = create('div','handoff-result-head');
    const resultTitle = create('span');
    const closeResult = button('×',null,''); closeResult.setAttribute('aria-label',closeText);
    resultHead.append(resultTitle, closeResult);
    const resultActions = create('div','handoff-result-actions');
    const sendButton = button(send,'move'), cancelButton = button(cancel,null);
    sendButton.dataset.sendCapture = '';
    cancelButton.dataset.cancelCapture = '';
    resultActions.append(sendButton,cancelButton);
    result.append(resultHead,resultActions);
    result.addEventListener('pointermove', (e) => e.stopPropagation());
    const ghost = create('span','handoff-drag'), rect = create('span','handoff-selection');
    ghost.setAttribute('aria-hidden','true'); rect.setAttribute('aria-hidden','true');
    ghost.hidden = rect.hidden = true; scene.append(ghost, rect);

    const files = [
      {id:'photo', kind:'photo', name:'Photo.jpg', side:0},
      {id:'document', kind:'document', name:'Plan.pdf', side:0},
      {id:'archive', kind:'archive', name:'Files.zip', side:0},
    ];
    let clip = '', resultOpener = null;
    let selected = new Set(), sceneGesture = null, captureSide = null, captureId = 0;
    let touchGroupSide = null, draft = null, relativeGesture = null;
    let shown = null, suppressTrigger = null;
    const announce = (s) => { feedback.textContent = s; };
    const local = (e) => {
      const r = scene.getBoundingClientRect();
      return {x:e.clientX-r.left,y:e.clientY-r.top};
    };
    const bounds = () => scene.getBoundingClientRect();
    function glassBounds(i) { return percent(extent(glass()[i], true), bounds()); }
    function localBox(el) {
      const r = bounds(), b = el.getBoundingClientRect();
      return {x:b.left-r.left, y:b.top-r.top, width:b.width, height:b.height};
    }
    function formatGroup(items) {
      return items.length === 1 ? items[0].name : filesSelected + ': ' + items.length;
    }

    function renderFiles() {
      moveButton.disabled = selected.size === 0;
      for (const [i,{icons,note}] of desktops.entries()) {
        icons.replaceChildren(note);
        for (const f of files.filter(f => f.side === i)) {
          const el = button('',f.kind,'handoff-file');
          if (f.canvas) {
            const thumb = create('canvas','handoff-capture-thumb');
            thumb.width = 28; thumb.height = 20;
            thumb.setAttribute('aria-hidden','true');
            const ctx = thumb.getContext?.('2d');
            if (ctx) {
              const scale = Math.min(thumb.width/f.canvas.width,thumb.height/f.canvas.height);
              const w = f.canvas.width*scale, h = f.canvas.height*scale;
              ctx.drawImage(f.canvas,(thumb.width-w)/2,(thumb.height-h)/2,w,h);
              el.replaceChildren(thumb);
            }
          }
          const label = create('span','handoff-file-label'); label.textContent = f.name;
          el.append(label);
          el.dataset.file = f.id; el.dataset.kind = f.kind;
          el.setAttribute('aria-label',f.name);
          el.setAttribute('aria-pressed',String(selected.has(f)));
          el.addEventListener('click', (e) => {
            if (suppressTrigger === el && e.detail !== 0) { suppressTrigger = null; return; }
            touchGroupSide = null;
            select(f.side);
            if (e.shiftKey) {
              toggleFile(f);
              return;
            }
            setSelection([f]);
            if (f.canvas && !draft) showCapture(f, el);
          });
          icons.append(el);
        }
      }
    }
    function setSelection(items) {
      selected = new Set(items);
      moveButton.disabled = selected.size === 0;
      for (const el of scene.querySelectorAll('[data-file]')) {
        el.setAttribute('aria-pressed',String([...selected].some(f => f.id === el.dataset.file)));
      }
    }
    function toggleFile(f) {
      const next = new Set([...selected].filter(item => item.side === f.side));
      if (next.has(f)) next.delete(f); else next.add(f);
      setSelection(next);
      announce(selected.size ? formatGroup([...selected]) : '');
    }
    function moveFiles(items, i, focus = false) {
      if (!items.length || items[0].side === i) return;
      touchGroupSide = null;
      for (const f of items) f.side = i;
      selected = new Set(items); select(i); renderFiles();
      if (focus) moveButton.focus({preventScroll:true});
      announce(formatGroup(items) + ' · ' + moved + device(i));
    }
    moveButton.addEventListener('click', () => {
      const items = [...selected];
      if (items.length) moveFiles(items, 1-items[0].side, true);
    });
    function areaSelection(i, selection) {
      const hits = [...desktops[i].icons.querySelectorAll('[data-file]')]
        .filter(el => overlap(localBox(el),selection));
      setSelection(hits.map(el => files.find(f => f.id === el.dataset.file)).filter(Boolean));
    }

    function makeEditor(i, launcher) {
      const editor = create('section','handoff-editor');
      editor.hidden = true;
      editor.setAttribute('role','group');
      const editorHead = create('div','handoff-editor-head');
      const title = create('span','handoff-editor-title');
      title.textContent = notepad;
      const close = button('×',null,'');
      close.setAttribute('aria-label',closeText);
      const field = create('textarea');
      field.rows = 2; field.maxLength = 2000; field.placeholder = placeholder;
      field.spellcheck = false; field.autocomplete = 'off';
      const editorTools = create('div','handoff-editor-tools');
      function compactCommand(label, glyph, shortcuts) {
        const cmd = button('', glyph), text = create('span','handoff-command-label');
        text.textContent = label;
        cmd.append(text);
        cmd.setAttribute('aria-label',label);
        cmd.setAttribute('aria-keyshortcuts',shortcuts);
        return cmd;
      }
      const copyButton = compactCommand(copyText,'copy','Control+C Meta+C');
      const pasteButton = compactCommand(pasteText,'paste','Control+V Meta+V');
      editorTools.append(copyButton, pasteButton, close);
      editorHead.append(title, editorTools);
      editor.append(editorHead, field);
      launcher.setAttribute('aria-expanded','false');
      let opener;
      function label() {
        const name = notepad + ' · ' + device(i);
        editor.setAttribute('aria-label',name);
        field.setAttribute('aria-label',name);
      }
      function open(by, focus = true) {
        opener = by;
        if (active() !== i) select(i);
        label();
        editor.hidden = false;
        launcher.setAttribute('aria-expanded','true');
        // Touch opens the panel first; tapping the field is what starts typing.
        if (focus) field.focus({preventScroll:true});
      }
      onScreenAction(close,i, () => {
        dismiss();
        opener?.focus({preventScroll:true});
      });
      // Let the textarea use native selection/caret gestures, not the stage trackpad.
      editor.addEventListener('pointerdown', (e) => { select(i); e.stopPropagation(); });
      editor.addEventListener('pointermove', (e) => e.stopPropagation());
      function copySelection(allIfNone) {
        const text = field.value.slice(field.selectionStart, field.selectionEnd) || (allIfNone ? field.value : '');
        if (!text) { announce(chooseText); return; }
        clip = text; announce(copied);
      }
      function pasteSelection(focus = true) {
        if (!clip) { announce(noClipboard); return; }
        const available = field.maxLength - (field.value.length - (field.selectionEnd-field.selectionStart));
        field.setRangeText(clip.slice(0, Math.max(0, available)), field.selectionStart, field.selectionEnd, 'end');
        if (focus) field.focus({preventScroll:true});
        announce(pasted);
      }
      onScreenAction(copyButton,i, () => copySelection(true));
      onScreenAction(pasteButton,i,pasteSelection);
      field.addEventListener('keydown', (e) => {
        if (e.isComposing || e.altKey || !(e.ctrlKey || e.metaKey)) return;
        const k = (e.key || '').toLowerCase();
        if (!['c','v','x'].includes(k)) return;
        e.preventDefault();
        if (k === 'v') pasteSelection();
        if (k === 'c') copySelection(false);
      });
      // Menu paste and key shortcuts use only the internal demo buffer.
      field.addEventListener('copy', (e) => { e.preventDefault(); copySelection(false); });
      field.addEventListener('paste', (e) => { e.preventDefault(); pasteSelection(); });
      field.addEventListener('cut', (e) => e.preventDefault());
      field.addEventListener('drop', (e) => e.preventDefault());
      field.addEventListener('beforeinput', (e) => {
        if (['insertFromPaste','insertFromDrop','deleteByCut'].includes(e.inputType)) e.preventDefault();
      });
      function dismiss() {
        editor.hidden = true;
        launcher.setAttribute('aria-expanded','false');
      }
      return {editor, field, open, label, dismiss};
    }
    noteButton.addEventListener('click', (e) => desktops[active()].app.open(noteButton,focusEditorFor(e)));

    function activateAtCursor(side, point) {
      if (sceneGesture || relativeGesture || captureSide !== null ||
          ![0,1].includes(side) || !inside(point,glassBounds(side))) return false;
      const r = bounds();
      const target = document.elementFromPoint?.(r.left + point.x,r.top + point.y);
      const control = target?.closest('button');
      const action = control && screenActions.get(control);
      if (!action || action.side !== side || !scene.contains(control) ||
          control.disabled || control.closest('[hidden],[inert]')) return false;
      action.run(false);
      return true;
    }

    function showCapture(f, opener, preview = false) {
      if (shown?.parentNode === result) shown.remove();
      shown = f.canvas;
      result.append(shown);
      resultTitle.textContent = f.name + ' · ' + (preview ? captured : received + device(f.side));
      result.setAttribute('aria-label',resultTitle.textContent);
      result.dataset.stage = preview ? 'draft' : 'received';
      resultActions.hidden = !preview;
      if (preview) {
        const label = send + ' · ' + device(1-f.side);
        sendButton.setAttribute('aria-label',label);
        sendButton.title = label;
      }
      resultOpener = opener; result.hidden = false;
      desktops[0].icons.inert = desktops[0].app.editor.inert = true;
    }
    function hideCapture(restore = false) {
      draft = null; result.hidden = true;
      desktops[0].icons.inert = desktops[0].app.editor.inert = false;
      if (shown?.parentNode === result) shown.remove();
      shown = null; delete result.dataset.stage;
      if (restore) (resultOpener?.isConnected ? resultOpener : shotButton).focus({preventScroll:true});
    }
    onScreenAction(closeResult,0, () => hideCapture(true));
    onScreenAction(cancelButton,0, () => { hideCapture(true); announce(''); });
    onScreenAction(sendButton,0, () => {
      if (!draft) return;
      const f = draft;
      draft = null; f.side = 1-f.side;
      // Keep the small demo usable: only a successful send replaces the previous image.
      const last = files.findIndex(item => item.kind === 'screenshot');
      if (last !== -1) files.splice(last,1);
      files.unshift(f);
      desktops[f.side].app.dismiss();
      selected = new Set([f]); select(f.side); renderFiles();
      const tile = [...desktops[f.side].icons.querySelectorAll('[data-file]')].find(el => el.dataset.file === f.id);
      if (f.side === 0) {
        // Do not leave the preview covering a new image that arrived on the main PC.
        hideCapture();
      } else {
        showCapture(f,tile || shotButton);
      }
      tile?.focus({preventScroll:true});
      announce(f.name + ' · ' + received + device(f.side));
    });
    function arm(i) {
      cancelRelativeTouch();
      end(null,true);
      touchGroupSide = null;
      hideCapture();
      captureSide = i; select(i);
      scene.dataset.capturing = '';
      shotButton.setAttribute('aria-pressed','true');
      scene.focus({preventScroll:true});
      announce(captureHint);
    }
    function disarm() {
      captureSide = null;
      delete scene.dataset.capturing;
      shotButton.setAttribute('aria-pressed','false');
      rect.hidden = true;
    }
    shotButton.addEventListener('click', () => {
      if (captureSide !== null) { end(null,true); disarm(); announce(''); }
      else arm(active());
    });
    function actualCapture(i, selection) {
      if (!selection || selection.width < 4 || selection.height < 4) {
        announce(chooseRegion); return;
      }
      const r = bounds(), canvas = create('canvas');
      const icons = [...desktops[i].icons.children].map((el) => {
        const b = el.getBoundingClientRect();
        return {x:b.left-r.left, y:b.top-r.top, width:b.width, height:b.height, kind:el.dataset.kind,
          label:el.getAttribute('aria-label') || notepad};
      });
      const {editor, field} = desktops[i].app;
      let panel;
      if (!editor.hidden) {
        const frame = editor.getBoundingClientRect(), body = field.getBoundingClientRect();
        panel = {x:frame.left-r.left, y:frame.top-r.top, width:frame.width, height:frame.height,
          bodyY:body.top-r.top, title:notepad, text:field.value, scrollTop:field.scrollTop};
      }
      if (!captureApi.snapshot({photo, bounds:r, rect:selection, icons, panel, canvas})) {
        announce(chooseRegion); return;
      }
      disarm();
      const id = ++captureId;
      const f = {id:'capture-'+id, side:i, kind:'screenshot', name:'Capture-'+id+'.png', canvas};
      canvas.setAttribute('role','img'); canvas.setAttribute('aria-label',f.name + ' · ' + captured);
      draft = f;
      showCapture(f, shotButton, true);
      sendButton.focus({preventScroll:true});
      announce(f.name + ' · ' + captured);
    }

    // The scene owns virtual cursor motion. Only resolve its starting hotspot
    // here, never the physical finger position, and keep native gestures separate.
    function beginRelativeTouch(id, side, point) {
      if (relativeGesture || sceneGesture || captureSide !== null ||
          ![0,1].includes(side) || !inside(point,glassBounds(side))) return null;
      const r = bounds();
      const el = document.elementFromPoint?.(r.left + point.x,r.top + point.y);
      if (!el || !scene.contains(el) || el.closest('[data-note-launch],.handoff-editor,.handoff-capture-result')) return null;
      const tile = el.closest('[data-file]');
      const previous = [...selected];
      if (tile && desktops[side].icons.contains(tile)) {
        const f = files.find(f => f.id === tile.dataset.file && f.side === side);
        if (!f) return null;
        const items = selected.has(f) ? previous : [f];
        relativeGesture = {kind:'drag',id,side,point,items,previous};
        setSelection(items);
        return 'drag';
      }
      if (tile || !captureApi || (el !== scene && !desktops[side].icons.contains(el))) return null;
      relativeGesture = {kind:'files',id,side,point,previous};
      return 'files';
    }
    function moveRelativeTouch(id, side, point) {
      const g = relativeGesture;
      if (!g || g.id !== id) return;
      if (g.kind === 'files') {
        const r = captureApi.crop(g.point,point,glassBounds(g.side));
        if (!r) return;
        rect.dataset.mode = 'files';
        place(rect,r); rect.hidden = false;
        areaSelection(g.side,r);
      } else {
        ghost.hidden = false; ghost.textContent = formatGroup(g.items);
        place(ghost,point);
      }
    }
    function endRelativeTouch(id, side, point, canceled = false) {
      const g = relativeGesture;
      if (!g || g.id !== id) return;
      if (!canceled && g.kind === 'files') moveRelativeTouch(id,side,point);
      relativeGesture = null;
      ghost.hidden = rect.hidden = true;
      if (canceled) { setSelection(g.previous); return; }
      touchGroupSide = null;
      if (g.kind === 'files') announce(selected.size ? formatGroup([...selected]) : '');
      else {
        const target = 1-g.side;
        if (side === target && inside(point,percent(extent(glass()[target]),bounds()))) moveFiles(g.items,target);
        else select(g.side);
      }
    }
    function cancelRelativeTouch() {
      if (relativeGesture) endRelativeTouch(relativeGesture.id,0,null,true);
    }

    function capturePointer(node, id) { node.setPointerCapture?.(id); }
    function end(e, canceled = false) {
      const g = sceneGesture;
      if (!g || (e && g.id !== e.pointerId)) return;
      sceneGesture = null;
      ghost.hidden = rect.hidden = true;
      if (canceled) {
        if (g.kind === 'files') setSelection(g.previous);
        return;
      }
      const p = local(e);
      if (g.kind === 'capture') {
        actualCapture(g.side, captureApi.crop(g.point,p,glassBounds(g.side)));
      } else if (g.kind === 'files') {
        const r = captureApi?.crop(g.point,p,glassBounds(g.side));
        if (g.dragged && r) areaSelection(g.side,r);
        else if (!g.dragged) setSelection([]);
        if (selected.size) announce(formatGroup([...selected]));
        else announce('');
        touchGroupSide = null;
      } else if (g.dragged) {
        suppressTrigger = g.el;
        const target = 1-g.side;
        if (inside(p, percent(extent(glass()[target]),bounds()))) moveFiles(g.items,target);
        else select(g.side);
      } else if (g.touch && (touchGroupSide === g.side || e.timeStamp - g.started >= 450)) {
        // A file hold starts multi-selection without turning a page scroll or a
        // blank-screen trackpad gesture into a marquee. A quick tap adds/removes.
        if (touchGroupSide !== g.side) setSelection([]);
        touchGroupSide = g.side;
        suppressTrigger = g.el;
        select(g.side); toggleFile(g.file);
        if (!selected.size) touchGroupSide = null;
      }
    }
    scene.addEventListener('contextmenu', (e) => {
      if (e.target.closest('[data-file]')) e.preventDefault();
    });
    scene.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.isPrimary === false || sceneGesture || relativeGesture) return;
      const el = e.target.closest('[data-file]');
      const p = local(e), id = e.pointerId;
      const startSide = [0,1].find(i => inside(p,glassBounds(i)));
      suppressTrigger = null;
      if (captureSide !== null) {
        if (startSide !== captureSide) return;
        sceneGesture = {kind:'capture', id, side:captureSide, point:p};
        e.preventDefault();
      } else if (el) {
        const f = files.find(f => f.id === el.dataset.file);
        if (!f) return;
        const items = selected.has(f) ? [...selected] : [f];
        sceneGesture = {kind:'drag', id, side:f.side, file:f, items, el, point:p, dragged:false,
          touch:e.pointerType === 'touch', started:e.timeStamp};
      } else if (captureApi && e.target === scene && startSide !== undefined && e.pointerType === 'mouse') {
        sceneGesture = {kind:'files', id, side:startSide, point:p, previous:[...selected], dragged:false};
        select(startSide);
        scene.focus({preventScroll:true});
        e.preventDefault();
      } else return;
      e.stopImmediatePropagation();
      // Capturing on the file retains its normal click target for a tap.
      capturePointer(el || scene,id);
    },true);
    scene.addEventListener('pointermove', (e) => {
      const g = sceneGesture;
      if (!g || g.id !== e.pointerId) return;
      e.stopImmediatePropagation();
      const p = local(e);
      if (g.kind === 'capture' || g.kind === 'files') {
        if (g.kind === 'files' && !g.dragged && Math.hypot(p.x-g.point.x,p.y-g.point.y) < 4) return;
        g.dragged = true;
        const r = captureApi.crop(g.point,p,glassBounds(g.side));
        if (!r) return;
        rect.dataset.mode = g.kind;
        place(rect,r); rect.hidden = false;
        if (g.kind === 'files') areaSelection(g.side,r);
      } else {
        if (!g.dragged && Math.hypot(p.x-g.point.x,p.y-g.point.y) < 5) return;
        if (!g.dragged) setSelection(g.items);
        g.dragged = true; ghost.hidden = false; ghost.textContent = formatGroup(g.items); place(ghost,p);
        const i = inside(p,glassBounds(1-g.side)) ? 1-g.side : g.side, r = glassBounds(i);
        acquire(i, (p.x-r.x)/r.width, (p.y-r.y)/r.height);
      }
    },true);
    scene.addEventListener('pointerup', (e) => end(e), true);
    for (const name of ['pointercancel','lostpointercapture']) scene.addEventListener(name,e => end(e,true),true);
    window.addEventListener('blur', () => { cancelRelativeTouch(); end(null,true); });
    demo.addEventListener('keydown', (e) => {
      // The listener never runs for browser/page shortcuts outside this demo.
      if (captureApi && !e.repeat && !e.isComposing && !e.getModifierState?.('AltGraph') &&
          e.ctrlKey && e.altKey && !e.shiftKey && !e.metaKey &&
          (e.code === 'KeyS' || e.key?.toLowerCase() === 's') && demo.contains(document.activeElement)) {
        e.preventDefault(); arm(active()); return;
      }
      if (e.key === 'Escape' && (captureSide !== null || sceneGesture || relativeGesture || touchGroupSide !== null || !result.hidden)) {
        const opener = sceneGesture?.el || shotButton;
        cancelRelativeTouch(); end(null,true); disarm();
        if (touchGroupSide !== null) setSelection([]);
        touchGroupSide = null;
        if (!result.hidden) hideCapture(true);
        else opener.focus({preventScroll:true});
        announce(''); e.preventDefault(); return;
      }
      if (e.target === scene && captureSide !== null && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault(); actualCapture(captureSide,glassBounds(captureSide));
      }
    },true);

    renderFiles();
    return {
      beginRelativeTouch, moveRelativeTouch, endRelativeTouch, activateAtCursor,
      selectDevice(i) {
        cancelRelativeTouch();
        touchGroupSide = null;
        if (captureSide !== null) { end(null, true); arm(i); }
      },
      setDesk(mode) {
        cancelRelativeTouch();
        end(null, true); disarm(); touchGroupSide = null;
        if (!result.hidden) hideCapture();
        const boxes = glass();
        desktops.forEach(({desktop,note,app}, i) => {
          note.setAttribute('aria-label',notepad + ' · ' + device(i));
          desktop.dataset.device = i && mode === 'phone' ? 'narrow' : 'wide';
          place(desktop, extent(boxes[i],true), '%');
          app.label();
        });
      },
    };
  }
  window.OneMouseGuideWorkspace = Object.freeze({mount});
})();
