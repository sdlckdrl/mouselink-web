(() => {
  'use strict';
  const finite = Number.isFinite;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const valid = (r) => r && [r.x, r.y, r.width, r.height].every(finite) && r.width > 0 && r.height > 0;

  function crop(anchor, current, glass) {
    if (!valid(glass) || !anchor || !current ||
        ![anchor.x, anchor.y, current.x, current.y].every(finite)) return null;
    const x = [anchor.x, current.x].map(n => clamp(n, glass.x, glass.x + glass.width));
    const y = [anchor.y, current.y].map(n => clamp(n, glass.y, glass.y + glass.height));
    return {x: Math.min(...x), y: Math.min(...y), width: Math.abs(x[0] - x[1]), height: Math.abs(y[0] - y[1])};
  }
  const palette = Object.freeze({photo:'#297c98', text:'#286498', document:'#256692',
    archive:'#97621c', note:'#9b5d23', screenshot:'#176957'});

  function drawIcon(ctx, box) {
    const size = Math.min(box.width * .50, box.height * .56, 14);
    const x = box.x + (box.width - size) / 2, y = box.y + 2;
    ctx.fillStyle = '#f9fdfd';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = Object.hasOwn(palette, box.kind) ? palette[box.kind] : palette.document;
    if (box.kind === 'photo' || box.kind === 'screenshot') {
      ctx.beginPath();
      ctx.moveTo(x + size*.13,y + size*.78);
      ctx.lineTo(x + size*.44,y + size*.36);
      ctx.lineTo(x + size*.61,y + size*.55);
      ctx.lineTo(x + size*.74,y + size*.43);
      ctx.lineTo(x + size*.87,y + size*.78);
      ctx.closePath();
      ctx.fill();
    } else {
      for (let i = 0; i < 3; i++)
        ctx.fillRect(x + size*.19, y + size*(.28 + i*.22), size*(i === 2 ? .38 : .62), Math.max(.65,size*.08));
    }
    if (box.label && box.height - size >= 7) {
      const font = clamp(box.height - size - 3, 6, 10);
      ctx.fillStyle = '#fff';
      ctx.font = font + 'px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(box.label, box.x + box.width / 2, box.y + box.height - 1, Math.max(1,box.width - 2));
    }
  }

  function drawNotepad(ctx, p) {
    const x = p.x, y = p.y, w = p.width, h = p.height;
    const header = clamp((p.bodyY || y + 15) - y, 0, h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#edf6f2';
    ctx.fillRect(x, y, w, header);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'top';
    if (w > 60) {
      ctx.fillStyle = '#214f44';
      ctx.font = '700 ' + clamp(w*.065,8,12) + 'px system-ui,sans-serif';
      ctx.fillText(p.title, x + 3, y + 3, Math.max(1, w - 6));
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(x,y+header,w,h-header);
    ctx.clip();
    const font = clamp(w*.09,9,14), row = font*1.3;
    ctx.fillStyle = '#152c40';
    ctx.font = font + 'px system-ui,sans-serif';
    const pad = w < 36 ? 1 : 3;
    let lineY = y + header + pad - (p.scrollTop || 0);
    const write = (line) => {
      if (lineY >= y + header - row) ctx.fillText(line,x+pad,lineY,Math.max(1,w-pad*2));
      lineY += row;
    };
    for (const str of (p.text || '').split('\n')) {
      let line = '';
      for (const char of str) {
        if (line && ctx.measureText(line+char).width > w-pad*2) { write(line); line = ''; }
        line += char;
        if (lineY > y+h) break;
      }
      if (lineY > y+h) break;
      write(line);
    }
    ctx.restore();
  }

  function snapshot({photo, bounds, rect, icons = [], panel, canvas} = {}) {
    if (!valid(rect) || !bounds || ![bounds.width, bounds.height].every(n => finite(n) && n > 0) ||
        !photo?.naturalWidth || !photo?.naturalHeight || !canvas?.getContext) return false;
    const left = clamp(rect.x, 0, bounds.width), top = clamp(rect.y, 0, bounds.height);
    const width = clamp(rect.x + rect.width, 0, bounds.width) - left;
    const height = clamp(rect.y + rect.height, 0, bounds.height) - top;
    if (width < 2 || height < 2) return false;
    const scale = Math.min(2, 1600 / width, 1600 / height);
    try {
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      const sx = photo.naturalWidth / bounds.width, sy = photo.naturalHeight / bounds.height;
      ctx.drawImage(photo, left * sx, top * sy, width * sx, height * sy, 0, 0, canvas.width, canvas.height);
      ctx.getImageData(0, 0, 1, 1); // Verify the crop is readable before reporting success.
      ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, -left * canvas.width / width, -top * canvas.height / height);
      for (const icon of icons) if (valid(icon) && icon.x < left + width && icon.x + icon.width > left &&
          icon.y < top + height && icon.y + icon.height > top) drawIcon(ctx, icon);
      if (valid(panel) && panel.x < left + width && panel.x + panel.width > left &&
          panel.y < top + height && panel.y + panel.height > top) drawNotepad(ctx, panel);
      return true;
    } catch {
      canvas.width = 0;
      return false;
    }
  }
  window.OneMouseGuideCapture = Object.freeze({snapshot, crop});
})();
