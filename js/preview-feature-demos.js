(() => {
  const buttons = new Map([...document.querySelectorAll('[data-feature-demo]')].map(button => [button.dataset.featureDemo, button]));
  let active = null, raceObserver = null, raceReadSize = null, capture = null;
  const panelFor = type => document.getElementById('feature-' + type + '-demo');
  const contentFor = type => panelFor(type).querySelector('[data-demo-content]');
  function mountRace(node) {
    const frame = document.createElement('iframe');
    frame.className = 'inline-race';
    frame.title = '폰으로 조작하는 미니 레이싱';
    frame.src = '/remote-demo?embed=1';
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
    buttons.get(type).setAttribute('aria-expanded', 'false');
    if (restoreFocus) buttons.get(type).focus();
  }
  for (const [type,button] of buttons) {
    if (type === 'capture' && !window.OneMouseCaptureDemo?.mount) continue;
    button.hidden = false;
    button.addEventListener('click', () => {
      if (active === type) { close(true); return; }
      close(false);
      active = type;
      const panel = panelFor(type);
      panel.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      if (type === 'race') mountRace(contentFor(type));
      else if (!capture) capture = window.OneMouseCaptureDemo.mount(contentFor(type));
      panel.querySelector('h3').focus({preventScroll:true});
      panel.scrollIntoView({block:'start'});
    });
  }
  document.querySelectorAll('[data-close-demo]').forEach(button => {
    button.addEventListener('click', () => close(true));
  });
})();
