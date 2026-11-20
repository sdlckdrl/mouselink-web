(function () {
  'use strict';

  function matchingFragment(hash, option) {
    if (!hash) return '';
    let fragment;
    try {
      fragment = decodeURIComponent(hash.slice(1));
    } catch (_) {
      return '';
    }
    return (option.getAttribute('data-fragments') || '').split(' ').includes(fragment) ? hash : '';
  }

  for (const select of document.querySelectorAll('[data-language-picker]')) {
    const reset = () => {
      select.value = select.getAttribute('data-current-language');
    };
    reset();
    select.hidden = false;
    addEventListener('pageshow', reset);

    select.addEventListener('change', () => {
      const option = select.selectedOptions[0];
      if (!option || option.value === select.getAttribute('data-current-language')) return;
      const route = option.getAttribute('data-language-route');
      if (!route || !route.startsWith('/') || route.startsWith('//')) return;
      const current = new URL(location.href);
      const target = new URL(route, current.origin);
      if (target.origin !== current.origin || target.pathname === current.pathname) return;
      target.search = current.search;
      target.hash = matchingFragment(current.hash, option);
      location.assign(target.href);
    });
  }
})();
