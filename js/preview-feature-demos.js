(() => {
  const buttons = new Map();
  document.querySelectorAll('[data-feature-demo]').forEach(button => {
    const type = button.dataset.featureDemo;
    if (!buttons.has(type)) buttons.set(type, []);
    buttons.get(type).push(button);
  });
  const expand = (type, value) => buttons.get(type).forEach(button => button.setAttribute('aria-expanded', String(value)));
  let active = null, opener = null, raceObserver = null, raceReadSize = null, capture = null;
  const panelFor = type => document.getElementById('feature-' + type + '-demo');
  const contentFor = type => panelFor(type).querySelector('[data-demo-content]');
  function mountRace(node) {
    const frame = document.createElement('iframe');
    frame.className = 'inline-race';
    frame.title = '폰으로 조작하는 미니 레이싱';
    frame.src = '/remote-demo?embed=1&play=1';
    frame.addEventListener('load', () => {
      if (!frame.isConnected) return;
      const main = frame.contentDocument?.getElementById('main');
      if (!main) return;
      raceReadSize = () => {
        const height = Math.ceil(main.getBoundingClientRect().height) + 8;
        if (height > 40 && frame.style.height !== height + 'px') frame.style.height = height + 'px';
      };
      raceReadSize();
      if (typeof ResizeObserver === 'function') {
        raceObserver = new ResizeObserver(raceReadSize);
        raceObserver.observe(main);
      }
      window.addEventListener('resize', raceReadSize);
    });
    node.append(frame);
  }
  function close(restoreFocus) {
    if (!active) return;
    const type = active;
    active = null;
    if (type === 'race') {
      raceObserver?.disconnect();
      if (raceReadSize) window.removeEventListener('resize', raceReadSize);
      raceObserver = raceReadSize = null;
      contentFor(type).replaceChildren();
    } else {
      capture?.reset?.();
    }
    panelFor(type).hidden = true;
    expand(type, false);
    if (restoreFocus) opener?.focus();
  }
  for (const [type, group] of buttons) for (const button of group) {
    if (type === 'capture' && !window.OneMouseCaptureDemo?.mount) continue;
    button.hidden = false;
    button.addEventListener('click', () => {
      if (active === type) { close(true); return; }
      close(false);
      active = type;
      opener = button;
      const panel = panelFor(type);
      panel.hidden = false;
      expand(type, true);
      if (type === 'race') mountRace(contentFor(type));
      else {
        if (!capture) capture = window.OneMouseCaptureDemo.mount(contentFor(type));
        capture?.start?.();
      }
      panel.querySelector('h3').focus({preventScroll:true});
      panel.scrollIntoView({block:'start'});
    });
  }
  document.querySelectorAll('[data-close-demo]').forEach(button => {
    button.addEventListener('click', () => close(true));
  });
})();
