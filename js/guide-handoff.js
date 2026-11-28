(() => {
  'use strict';
  // Glass corners (top left, top right, bottom right, bottom left), as % of the desk.
  const fromPhoto = (points) => points.map(([x, y]) => [x / 1536 * 100, y / 1024 * 100]);
  const desks = {
    mac: {
      photo: 'file-transfer-desk.webp',
      glass: [[[4.5,23.2],[49.1,23.2],[49.1,61.5],[4.5,61.5]],
              [[51.9,23.3],[95.7,23.3],[95.7,59.9],[51.9,59.9]]],
    },
    windows: {
      photo: 'windows-handoff-desk.webp',
      glass: [[[4.5,23.1],[49.1,22.9],[49.1,61.6],[4.5,61.6]],
              [[53.2,33.4],[93.8,33.4],[93.8,67.6],[53.2,67.6]]],
    },
    phone: {
      photo: 'android-notification-desk.webp',
      glass: [fromPhoto([[155,115],[1122,54],[1097,697],[131,643]]),
              fromPhoto([[1249,400],[1458,399],[1406,888],[1190,870]])],
    },
    tablet: {
      photo: 'android-tablet-gesture-desk.webp',
      glass: [fromPhoto([[138,146],[849,100],[841,595],[136,565]]),
              fromPhoto([[910,372],[1480,370],[1435,789],[854,739]])],
    },
  };
  const languages = {/* web-demo-locales */
    "pt-br":{"title":"Experimente mover o cursor","choice":"Escolha um dispositivo Android","source":"Meu PC Windows","mac":"Mac","windows":"Outro PC Windows","phone":"Celular Android","tablet":"Tablet Android","hint":"Mova o mouse ou deslize o dedo para a direita. Para voltar, vá para a esquerda. No teclado, use ← e →.","position":"Cursor em: "},
    "de":{"title":"Probiere aus, den Mauszeiger zu bewegen","choice":"Android-Gerät auswählen","source":"Mein Windows-PC","mac":"Mac","windows":"Anderer Windows-PC","phone":"Android-Smartphone","tablet":"Android-Tablet","hint":"Bewege die Maus oder streiche mit dem Finger nach rechts. Nach links geht es zurück. Mit der Tastatur verwendest du ← und →.","position":"Mauszeiger auf: "},
    "zh-tw":{"title":"試著移動游標","choice":"選擇 Android 裝置","source":"我的 Windows 電腦","mac":"Mac","windows":"另一台 Windows 電腦","phone":"Android 手機","tablet":"Android 平板","hint":"把滑鼠或手指往右移，往左移即可返回。使用鍵盤時，請按 ← 或 →。","position":"游標位置： "},
    "fr":{"title":"Essayez de déplacer le pointeur","choice":"Choisir un appareil Android","source":"Mon PC Windows","mac":"Mac","windows":"Autre PC Windows","phone":"Téléphone Android","tablet":"Tablette Android","hint":"Déplacez la souris ou faites glisser un doigt vers la droite. Revenez vers la gauche pour retourner au point de départ. Au clavier, utilisez ← et →.","position":"Pointeur sur : "},
    "id":{"title":"Coba gerakkan kursor","choice":"Pilih perangkat Android","source":"PC Windows saya","mac":"Mac","windows":"PC Windows lain","phone":"Ponsel Android","tablet":"Tablet Android","hint":"Gerakkan mouse atau geser satu jari ke kanan. Geser ke kiri untuk kembali. Di keyboard, gunakan ← dan →.","position":"Kursor di: "},
  /* end-web-demo-locales */
    ko: {
      title:'커서 넘기기 체험', choice:'Android 기기 선택',
      source:'내 Windows PC', mac:'Mac', windows:'다른 Windows PC', phone:'Android 폰', tablet:'Android 태블릿',
      hint:'마우스나 손가락을 오른쪽으로 밀어 보세요. 돌아올 땐 왼쪽으로 밀어요. 키보드는 ← → 키를 쓰세요.',
      position:'커서 위치: ',
    },
    en: {
      title:'Try moving the cursor', choice:'Choose an Android device',
      source:'My Windows PC', mac:'Mac', windows:'Other Windows PC', phone:'Android phone', tablet:'Android tablet',
      hint:'Move your mouse or slide a finger to the right. Move left to come back. On a keyboard, use ← and →.',
      position:'Cursor on: ',
    },
    es: {
      title:'Prueba a mover el cursor', choice:'Elige un dispositivo Android',
      source:'Mi PC Windows', mac:'Mac', windows:'Otro PC Windows', phone:'Teléfono Android', tablet:'Tableta Android',
      hint:'Mueve el ratón o desliza un dedo a la derecha. Vuelve por la izquierda. Con el teclado, usa ← y →.',
      position:'Cursor en: ',
    },
    ja: {
      title:'カーソル移動を体験', choice:'Android 端末を選択',
      source:'自分の Windows PC', mac:'Mac', windows:'別の Windows PC', phone:'Android スマートフォン', tablet:'Android タブレット',
      hint:'マウスか指を右に動かしてみましょう。左に動かすと戻れます。キーボードでは ← → キーを使います。',
      position:'カーソルの位置：',
    },
    zh: {
      title:'试试跨屏移动光标', choice:'选择 Android 设备',
      source:'我的 Windows 电脑', mac:'Mac', windows:'另一台 Windows 电脑', phone:'Android 手机', tablet:'Android 平板',
      hint:'向右移动鼠标或滑动手指，向左移动即可返回。使用键盘时，按 ← 或 → 键。',
      position:'光标位置：',
    },
  };
  const t = languages[document.documentElement.lang.toLowerCase()] || languages[document.documentElement.lang.toLowerCase().split('-')[0]] || languages.en;
  const touchDragDelay = 250;
  const touchSlop = 5;
  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
  const mix = (a, b, f) => a + (b - a) * f;
  const point = ([a,b,c,d], u, v) => [
    mix(mix(a[0], b[0], u), mix(d[0], c[0], u), v),
    mix(mix(a[1], b[1], u), mix(d[1], c[1], u), v),
  ];
  // Invert the nearly rectangular quadrilaterals (some photos are in perspective).
  function screenCoordinates([a,b,c,d], x, y) {
    let u = .5, v = .5;
    for (let i = 0; i < 4; ++i) {
      const top = mix(a[1], b[1], u), bottom = mix(d[1], c[1], u);
      v = (y - top) / (bottom - top);
      const left = mix(a[0], d[0], v), right = mix(b[0], c[0], v);
      u = (x - left) / (right - left);
    }
    return [u, v];
  }
  const pointer = '<svg viewBox="0 0 24 30" focusable="false" aria-hidden="true"><path d="M1 1L22 19 13 18.4 17 26 13.6 28 9.3 20.3 3 27Z" fill="#fff" stroke="#142a43" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="15" r="7.5" fill="#fff" stroke="#142a43" stroke-width="2"/></svg>';

  function mount(step) {
    const detail = step.querySelector(':scope > details.handoff-original');
    if (!detail) return;
    const mobile = step.dataset.handoff === 'android';
    let mode = mobile ? 'phone' : step.dataset.handoff;
    let desk = desks[mode], side = 0, u = .72, v = .62, contact = null;
    let mounted = false, request = 0;
    const demo = document.createElement('figure');
    demo.className = 'handoff-demo';
    demo.innerHTML =
      '<figcaption class="handoff-heading"><span></span></figcaption>' +
      '<div class="handoff-scene" role="group" tabindex="0"><img alt="" draggable="false">' + pointer + '</div>' +
      '<div class="handoff-controls"><button type="button" data-side="source"></button>' +
      '<span aria-hidden="true">⇄</span><button type="button" data-side="target"></button></div>' +
      '<p class="handoff-hint"></p><span role="status" class="handoff-sr"></span>';
    const heading = demo.querySelector('figcaption'), scene = demo.querySelector('.handoff-scene');
    const marker = scene.querySelector('svg'), photo = scene.querySelector('img');
    const buttons = [...demo.querySelectorAll('[data-side]')], hint = demo.querySelector('.handoff-hint');
    const status = demo.querySelector('[role="status"]');
    marker.classList.add('handoff-cursor');
    heading.firstChild.innerHTML = pointer;
    heading.firstChild.querySelector('circle').remove();
    heading.firstChild.append(t.title);
    hint.id = step.id + '-hint';
    hint.textContent = t.hint;
    scene.setAttribute('aria-describedby', hint.id);
    buttons[0].textContent = t.source;
    let picker;
    if (mobile) {
      picker = document.createElement('select');
      picker.className = 'handoff-choice';
      picker.setAttribute('aria-label', t.choice);
      for (const name of ['phone', 'tablet']) picker.add(new Option(t[name], name));
      picker.addEventListener('change', () => load(picker.value));
      heading.append(picker);
    }
    function draw(i, x, y) {
      side = i; u = clamp(x); v = clamp(y);
      const p = point(desk.glass[side], clamp(u,.015,.985), clamp(v,.015,.98));
      marker.style.left = p[0] + '%'; marker.style.top = p[1] + '%';
      demo.dataset.shape = side && mobile ? 'dot' : 'arrow';
      const active = side ? 'target' : 'source';
      if (demo.dataset.active !== active) {
        demo.dataset.active = active;
        buttons.forEach((btn, j) => btn.setAttribute('aria-pressed', String(j === side)));
        status.textContent = t.position + (side ? t[mode] : t.source);
      }
    }
    const workspace = window.OneMouseGuideWorkspace?.mount({
      demo, scene, photo, lang: document.documentElement.lang,
      device: (i) => i ? t[mode] : t.source,
      active: () => side,
      glass: () => desk.glass,
      acquire: (index, x, y) => draw(index, x, y),
      select: (index) => draw(index, .5, .5),
    });
    function virtualPoint(r = scene.getBoundingClientRect()) {
      const p = point(desk.glass[side], clamp(u,.015,.985), clamp(v,.015,.98));
      return {x:p[0] * r.width/100, y:p[1] * r.height/100};
    }
    function finishContact(canceled) {
      if (!contact) return;
      if (contact.action) workspace?.endRelativeTouch?.(contact.id, side, virtualPoint(), canceled);
      contact = null;
    }
    function load(name) {
      const version = ++request, next = new Image();
      next.decoding = 'async';
      next.onload = () => {
        if (version !== request) return;
        finishContact(true); mode = name; desk = desks[name];
        photo.src = next.src;
        buttons[1].textContent = t[name];
        scene.setAttribute('aria-label', t.title + ': ' + t.source + ' → ' + t[name]);
        draw(0, .72, .62);
        workspace?.setDesk(name);
        if (mounted) return;
        mounted = true;
        detail.after(demo);
        step.classList.add('handoff-ready');
      };
      // If a secondary image fails, keep the currently working desk and its geometry.
      next.onerror = () => { if (version === request && picker) picker.value = mode; };
      next.src = '/assets/preview/' + desks[name].photo;
    }
    buttons.forEach((btn, i) => btn.addEventListener('click', () => {
      draw(i, .5, .5);
      workspace?.selectDevice(i);
    }));
    demo.addEventListener('keydown', (e) => {
      if ((e.target !== scene && !buttons.includes(e.target)) || e.ctrlKey || e.metaKey || e.altKey ||
          !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      const i = Number(e.key === 'ArrowRight');
      draw(i, .5, .5);
      if (buttons.includes(e.target)) buttons[i].focus({preventScroll:true});
    });
    // Only blank parts of this card are a trackpad. Buttons, the device picker,
    // notepad editing, and directly selected screenshot regions stay native.
    const directTouch = 'button,a,input,textarea,select,option,label,summary,[contenteditable],.handoff-desktop';
    demo.addEventListener('pointerdown', (e) => {
      if (!['touch','pen'].includes(e.pointerType) || e.isPrimary === false || contact || e.button !== 0 ||
          scene.dataset.capturing !== undefined || e.target.closest?.(directTouch)) return;
      contact = {id:e.pointerId, x:e.clientX, y:e.clientY, started:e.timeStamp,
        moving:false, action:null, origin:side};
      (e.target === scene ? scene : demo).setPointerCapture?.(e.pointerId);
      e.preventDefault();
      // Like a trackpad: a new contact never moves the cursor to the finger.
    });
    demo.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' || contact?.id !== e.pointerId) return;
      const r = scene.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const dx = e.clientX - contact.x, dy = e.clientY - contact.y;
      // Like Features, the first deliberate movement distinguishes a quick
      // cursor swipe from a held drag. Both use the prior virtual position.
      if (!contact.moving) {
        if (Math.hypot(dx,dy) < touchSlop) return;
        contact.moving = true;
        if (e.timeStamp - contact.started >= touchDragDelay) {
          contact.action = workspace?.beginRelativeTouch?.(e.pointerId, side, virtualPoint(r));
        }
      }
      const stepX = dx * 2.3 / r.width, nextY = v + dy * 1.9 / r.height;
      if (contact.action === 'files') {
        // A marquee is clipped to the display where it was started.
        draw(contact.origin, u + stepX, nextY);
      } else {
        // Relative motion and file drags can cross between the two screens.
        const next = clamp(side + u + stepX, 0, 2);
        const i = Number(next >= 1);
        draw(i, next - i, nextY);
      }
      if (contact.action) workspace?.moveRelativeTouch?.(e.pointerId, side, virtualPoint(r));
      contact.x = e.clientX; contact.y = e.clientY;
    });
    scene.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || contact) return;
      const r = scene.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const x = 100 * (e.clientX - r.left) / r.width, y = 100 * (e.clientY - r.top) / r.height;
      const local = desk.glass.map(q => screenCoordinates(q, x, y));
      const hit = local.findIndex(([a,b]) => a >= 0 && a <= 1 && b >= 0 && b <= 1);
      if (hit !== -1) { draw(hit, ...local[hit]); return; }
      // Crossing the bezel or a gap parks the single cursor inside the last glass.
      const [a,b] = local[side];
      if (b >= -.16 && b <= 1.16) draw(side, a, b);
    });
    const release = (e) => {
      if (contact?.id !== e.pointerId) return;
      const canceled = e.type !== 'pointerup';
      const tap = !canceled && !contact.moving &&
        e.timeStamp - contact.started < touchDragDelay &&
        Math.hypot(e.clientX - contact.x,e.clientY - contact.y) < touchSlop;
      finishContact(canceled);
      if (tap) workspace?.activateAtCursor?.(side,virtualPoint());
    };
    for (const event of ['pointerup','pointercancel','lostpointercapture']) demo.addEventListener(event, release);
    window.addEventListener('blur', () => finishContact(true));
    load(mode);
  }
  const steps = document.querySelectorAll('[data-handoff]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const {target,isIntersecting} of entries) if (isIntersecting) {
        observer.unobserve(target); mount(target);
      }
    }, {rootMargin:'300px 0px'});
    steps.forEach(step => observer.observe(step));
  } else steps.forEach(mount);
})();
