(() => {
  const play = document.querySelector('[data-promo-video-play]');
  const player = document.getElementById('promo-video-player');
  if (!play || !player) return;

  play.addEventListener('click', (event) => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();

    const frame = document.createElement('iframe');
    frame.src = 'https://www.youtube-nocookie.com/embed/lfrUuJgT5nw?autoplay=1&playsinline=1&rel=0';
    frame.title = 'OneMouse 소개 영상 — 마우스·키보드 공유, 파일 전송과 원격제어';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    player.replaceChildren(frame);
    frame.focus();
  });
})();
