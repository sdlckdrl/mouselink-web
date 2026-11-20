(() => {
  'use strict';

  const section = document.querySelector('[data-cmp-matrix]');
  if (!section || typeof matchMedia !== 'function') return;
  const picker = section.querySelector('[data-cmp-picker]');
  const select = section.querySelector('[data-cmp-select]');
  const cells = [...section.querySelectorAll('[data-cmp-app]')];
  const groups = section.querySelectorAll('[data-cmp-span]');
  if (!picker || !select || !cells.length) return;
  const breakpoint = matchMedia('(max-width:767px)');
  const appCount = new Set(cells.map(cell => cell.dataset.cmpApp)).size;

  function update() {
    const pair = breakpoint.matches;
    const competitor = select.value;
    section.dataset.matrixMode = pair ? 'pair' : 'all';
    picker.hidden = !pair;
    for (const cell of cells) {
      cell.hidden = pair && cell.dataset.cmpApp !== 'one' && cell.dataset.cmpApp !== competitor;
    }
    for (const group of groups) group.colSpan = pair ? 3 : appCount + 1;
  }

  select.addEventListener('change', update);
  if (breakpoint.addEventListener) breakpoint.addEventListener('change', update);
  else breakpoint.addListener(update);
  // Restore the visible pair if the browser restores the select value on Back.
  window.addEventListener('pageshow', update);
  update();
})();
