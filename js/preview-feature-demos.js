(() => {
  const capture = document.querySelector('[data-capture-inline]');
  if (capture) window.OneMouseCaptureDemo?.mount?.(capture);
  const race = document.querySelector('[data-race-inline]');
  if (race) window.OneMouseRaceCard?.mount?.(race);
})();
