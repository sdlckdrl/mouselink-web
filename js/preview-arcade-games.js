(() => {
  'use strict';

  const W = 640, H = 360;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }
  function oval(ctx, x, y, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function polygon(ctx, points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    ctx.fill();
  }
  function sky(ctx, high, low) {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, high);
    gradient.addColorStop(1, low);
    rect(ctx, 0, 0, W, H, gradient);
  }
  function clock(dt, update) {
    let remaining = Number.isFinite(dt) ? clamp(dt, 0, .12) : 0;
    while (remaining > 0) {
      const tick = Math.min(remaining, 1 / 180);
      update(tick);
      remaining -= tick;
    }
  }

  function breakout() {
    const wall = 16, padY = 313, padW = 132, padH = 14, r = 8;
    const bricks = Array.from({length: 21}, (_, i) => ({
      x: 28 + i % 7 * 84, y: 48 + Math.floor(i / 7) * 27,
      w: 78, h: 21, color: ['#ff8da3', '#ffc888', '#8de8d3'][Math.floor(i / 7)], alive: true,
    }));
    let score = 0, lives = 3, result = '', paddle = W / 2;
    let x = paddle, y = padY - r - 2, vx = 0, vy = 0, flying = false;
    const move = value => {
      if (result || !Number.isFinite(value)) return;
      paddle = clamp(value * W, wall + padW / 2, W - wall - padW / 2);
      if (!flying) x = paddle;
    };
    function action() {
      if (result || flying) return;
      flying = true;
      vx = (lives % 2 ? 1 : -1) * 132;
      vy = -345;
    }
    function nudge(direction) {
      const sign = direction === 'left' || direction === -1 ? -1 : direction === 'right' || direction === 1 ? 1 : 0;
      if (sign) move(paddle / W + sign * .065);
    }
    function tick(dt) {
      if (!flying || result) return;
      const oldX = x, oldY = y;
      x += vx * dt;
      y += vy * dt;
      if (x < wall + r) { x = wall + r; vx = Math.abs(vx); }
      if (x > W - wall - r) { x = W - wall - r; vx = -Math.abs(vx); }
      if (y < wall + r) { y = wall + r; vy = Math.abs(vy); }

      if (vy > 0 && oldY <= padY - r && y >= padY - r &&
          Math.abs(x - paddle) <= padW / 2 + r * .5) {
        const fraction = clamp((x - paddle) / (padW / 2), -1, 1);
        const angle = fraction * 1.08;
        const speed = Math.min(500, Math.max(370, Math.hypot(vx, vy) + 8));
        y = padY - r - .01;
        vx = Math.sin(angle) * speed;
        vy = -Math.cos(angle) * speed;
        if (Math.abs(vx) < 36) vx = (vx < 0 ? -1 : 1) * 36;
      }

      for (const brick of bricks) {
        if (!brick.alive || x + r <= brick.x || x - r >= brick.x + brick.w ||
            y + r <= brick.y || y - r >= brick.y + brick.h) continue;
        brick.alive = false;
        score += 1;
        const hitFromLeft = oldX + r <= brick.x;
        const hitFromRight = oldX - r >= brick.x + brick.w;
        const hitFromTop = oldY + r <= brick.y;
        const hitFromBottom = oldY - r >= brick.y + brick.h;
        if ((hitFromLeft || hitFromRight) && !(hitFromTop || hitFromBottom)) {
          x = hitFromLeft ? brick.x - r : brick.x + brick.w + r;
          vx = -vx;
        } else {
          y = vy < 0 ? brick.y + brick.h + r : brick.y - r;
          vy = -vy;
        }
        if (score === bricks.length) result = 'won';
        break;
      }
      if (y - r > H && !result) {
        lives -= 1;
        flying = false;
        if (!lives) result = 'lost';
        x = paddle;
        y = padY - r - 2;
      }
    }
    function draw(ctx) {
      sky(ctx, '#132152', '#253978');
      rect(ctx, 10, 12, 6, 332, '#5269aa');
      rect(ctx, 624, 12, 6, 332, '#5269aa');
      rect(ctx, 16, 12, 608, 4, '#5269aa');
      rect(ctx, 16, 343, 608, 3, '#5269aa');
      for (const brick of bricks) {
        if (!brick.alive) continue;
        rect(ctx, brick.x, brick.y + 4, brick.w, brick.h, '#17274e');
        rect(ctx, brick.x, brick.y, brick.w, brick.h, brick.color);
        rect(ctx, brick.x + 4, brick.y + 3, brick.w - 8, 3, '#ffffff70');
      }
      for (let i = 0; i < 3; i++) {
        oval(ctx, 32 + 22 * i, 334, 6, 6, i < lives ? '#ffbe99' : '#4e5e94');
      }
      rect(ctx, paddle - padW / 2, padY + 4, padW, padH, '#17274e');
      rect(ctx, paddle - padW / 2, padY, padW, padH, '#a8f7eb');
      rect(ctx, paddle - padW / 2 + 5, padY + 2, padW - 10, 3, '#efffff');
      if (lives) {
        oval(ctx, x, y, r + 4, r + 4, '#e5fbff30');
        oval(ctx, x, y, r, r, '#fff8da');
      }
    }
    return { draw, step: dt => clock(dt, tick), action, move, nudge, state: () => ({score, result}) };
  }

  function rabbit() {
    const ground = 277, runner = 124, jump = 515, gravity = 1380;
    const goal = 9, spacing = [0, 420, 825, 1300, 1765, 2215, 2705, 3160, 3650];
    const hurdles = spacing.map((offset, index) => ({
      at: 515 + offset, w: [35, 40, 32][index % 3], h: [32, 39, 35, 45][index % 4], passed: false,
    }));
    let score = 0, result = '', running = false, travelled = 0, raise = 0, speedY = 0;
    let queued = 0;
    function action() {
      if (result) return;
      if (!running) running = true;
      if (raise <= .01) { speedY = jump; return; }
      if (speedY < 0 && raise < 35) queued = .10;
    }
    function tick(dt) {
      if (!running || result) return;
      travelled += (190 + score * 3) * dt;
      if (raise > 0 || speedY > 0) {
        speedY -= gravity * dt;
        raise += speedY * dt;
        if (raise <= 0) {
          raise = 0;
          speedY = queued > 0 ? jump : 0;
          queued = 0;
        }
      }
      queued = Math.max(0, queued - dt);
      for (const hurdle of hurdles) {
        if (hurdle.passed) continue;
        const x = hurdle.at - travelled;
        if (runner + 17 > x + 2 && runner - 13 < x + hurdle.w - 2 && raise + 4 < hurdle.h) {
          result = 'lost';
          return;
        }
        if (x + hurdle.w <= runner - 13) {
          hurdle.passed = true;
          score += 1;
          if (score === goal) result = 'won';
        }
      }
    }
    function draw(ctx) {
      sky(ctx, '#282855', '#7e6995');
      oval(ctx, 500, 86, 34, 34, '#ffe79b');
      oval(ctx, 510, 77, 28, 28, '#39325d');
      for (const [x, y, radius] of [[30, 68, 3], [78, 39, 3], [163, 89, 2], [254, 48, 4], [336, 110, 2], [418, 30, 3], [580, 53, 3], [610, 119, 4]]) {
        oval(ctx, x, y, radius, radius, '#f9e6a2');
      }
      for (let x = -180 - travelled * .12 % 173; x < W + 80; x += 173) {
        oval(ctx, x, ground + 21, 112, 102, '#393658');
        oval(ctx, x + 83, ground + 26, 116, 62, '#484461');
      }
      rect(ctx, 0, ground, W, H - ground, '#233e4e');
      rect(ctx, 0, ground, W, 5, '#8ee4bd');
      for (let x = -travelled % 90; x < W; x += 90) {
        rect(ctx, x, ground + 29, 45, 3, '#548686');
        rect(ctx, x + 19, ground + 54, 32, 3, '#548686');
      }
      for (const hurdle of hurdles) {
        const x = hurdle.at - travelled;
        if (x >= W || x + hurdle.w <= 0) continue;
        const top = ground - hurdle.h;
        polygon(ctx, [[x,ground],[x + 6,top + 7],[x + 18,top],[x + hurdle.w - 5,top + 9],[x + hurdle.w,ground]], '#6dc8a2');
        polygon(ctx, [[x + 9,top + 10],[x + 18,top],[x + 22,top + 14],[x + 17,ground]], '#9ce5b0');
      }
      oval(ctx, runner, ground + 3, 30 - raise * .10, 5, '#142732');
      const feet = ground - raise - 3;
      const stride = running && !raise && !result ? Math.sin(travelled * .12) * 5 : 0;
      oval(ctx, runner - 25, feet - 17, 9, 9, '#f8f3df');
      oval(ctx, runner - 6, feet - 17, 23, 16, '#f8f3df');
      oval(ctx, runner + 14, feet - 26, 17, 17, '#fff9e8');
      oval(ctx, runner + 9, feet - 49, 5.5, 19, '#fff9e8');
      oval(ctx, runner + 19, feet - 49, 5.5, 19, '#fff9e8');
      oval(ctx, runner + 19, feet - 51, 2, 12, '#ee97a2');
      oval(ctx, runner + 21, feet - 28, 3, 3, '#2d3051');
      oval(ctx, runner + 30, feet - 23, 3, 2.5, '#eb9b9a');
      oval(ctx, runner - 10 + stride, feet, 12, 4.5, '#eee0cf');
      oval(ctx, runner + 14 - stride, feet, 9, 4, '#fff9e8');
    }
    return { draw, step: dt => clock(dt, tick), action, move() {}, nudge() {}, state: () => ({score, result}) };
  }

  window.OneMouseArcadeGames = Object.freeze({
    create(id) {
      if (id === 'breakout') return breakout();
      if (id === 'rabbit') return rabbit();
      throw new RangeError('Unknown OneMouse arcade game');
    },
  });
})();
