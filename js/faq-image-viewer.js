/* The guide's in-place image viewer, with non-navigating thumbnail buttons. */
(() => {
  const viewer = document.querySelector('#faq-image-viewer');
  if (!viewer || typeof viewer.showModal !== 'function') return;
  const image = viewer.querySelector('img');
  const status = viewer.querySelector('[role="status"]');
  const close = viewer.querySelector('button');
  let opener;
  let backdrop = false;

  for (const button of document.querySelectorAll('#faq-device-reset [data-faq-shot]')) {
    button.disabled = false;
    button.addEventListener('click', () => {
      if (viewer.open) return;
      const thumb = button.querySelector('img');
      if (!thumb) return;
      opener = button;
      backdrop = false;
      status.hidden = true;
      image.hidden = false;
      image.alt = thumb.alt;
      viewer.showModal();
      image.src = thumb.currentSrc || thumb.src;
    });
  }
  image.addEventListener('error', () => {
    if (!viewer.open) return;
    image.hidden = true;
    status.hidden = false;
  });
  close.addEventListener('click', () => viewer.close());
  viewer.addEventListener('pointerdown', e => { backdrop = e.target === viewer; });
  viewer.addEventListener('click', e => {
    if (backdrop && e.target === viewer) viewer.close();
    backdrop = false;
  });
  viewer.addEventListener('close', () => {
    if (viewer.open) return;
    image.removeAttribute('src');
    image.hidden = true;
    status.hidden = true;
    opener?.focus({ preventScroll: true });
    opener = null;
  });
})();
