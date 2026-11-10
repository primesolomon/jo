(function(){
  const N = 20, S = 400 / N;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const $ = id => document.getElementById(id);
  const overlay = $('overlay'), scoreEl = $('score'), bestEl = $('best');
  const DIRS = {up:[0,-1], down:[0,1], left:[-1,0], right:[1,0]};
  let snake, dir, queue, food, score, best = 0, timer, running = false, paused = false;

  try { best = parseInt(localStorage.getItem('snake-best')) || 0; } catch (e) {}
  bestEl.textContent = best;

  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  function reset(){
    snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
    dir = DIRS.right; queue = []; score = 0;
    scoreEl.textContent = 0;
    placeFood();
  }
  function placeFood(){
    do { food = {x:Math.floor(Math.random()*N), y:Math.floor(Math.random()*N)}; }
    while (snake.some(s => s.x === food.x && s.y === food.y));
  }
  function speed(){ return Math.max(60, 130 - Math.floor(score / 5) * 6); }

  function start(){
    reset(); running = true; paused = false;
    overlay.hidden = true; draw(); schedule();
  }
  function schedule(){ clearTimeout(timer); timer = setTimeout(tick, speed()); }

  function tick(){
    if (!running || paused) return;
    if (queue.length) dir = queue.shift();
    const h = {x:snake[0].x + dir[0], y:snake[0].y + dir[1]};
    const hitWall = h.x < 0 || h.y < 0 || h.x >= N || h.y >= N;
    const ate = h.x === food.x && h.y === food.y;
    const body = ate ? snake : snake.slice(0, -1);
    if (hitWall || body.some(s => s.x === h.x && s.y === h.y)) return gameOver();
    snake.unshift(h);
    if (ate){
      score++; scoreEl.textContent = score;
      if (score > best){
        best = score; bestEl.textContent = best;
        try { localStorage.setItem('snake-best', best); } catch (e) {}
      }
      placeFood();
    } else snake.pop();
    draw(); schedule();
  }

  function gameOver(){
    running = false; draw();
    $('title').textContent = 'Game over';
    $('msg').textContent = 'You scored ' + score + '. Best is ' + best + '.';
    $('start').textContent = 'Play again';
    overlay.hidden = false;
    $('start').focus();
  }

  function turn(name){
    if (!running || paused) return;
    const d = DIRS[name];
    const last = queue.length ? queue[queue.length-1] : dir;
    if (d[0] === -last[0] && d[1] === -last[1]) return;
    if (d[0] === last[0] && d[1] === last[1]) return;
    if (queue.length < 2) queue.push(d);
  }

  function togglePause(){
    if (!running) return;
    paused = !paused;
    if (paused){
      $('title').textContent = 'Paused';
      $('msg').textContent = 'Press Space to resume.';
      $('start').textContent = 'Resume';
      overlay.hidden = false;
    } else { overlay.hidden = true; schedule(); }
  }

  function draw(){
    ctx.fillStyle = css('--panel'); ctx.fillRect(0,0,400,400);
    ctx.fillStyle = css('--grid');
    for (let x = 0; x < N; x++) for (let y = 0; y < N; y++)
      if ((x + y) % 2) ctx.fillRect(x*S, y*S, S, S);
    ctx.fillStyle = css('--food');
    ctx.beginPath(); ctx.arc(food.x*S + S/2, food.y*S + S/2, S*0.36, 0, Math.PI*2); ctx.fill();
    snake.forEach((s,i) => {
      ctx.fillStyle = css(i ? '--snake' : '--head');
      const p = i ? 2 : 1;
      ctx.beginPath(); ctx.roundRect(s.x*S + p, s.y*S + p, S - p*2, S - p*2, 5); ctx.fill();
    });
  }

  const keys = {ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',
                ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};
  document.addEventListener('keydown', e => {
    if (keys[e.key]){ e.preventDefault(); turn(keys[e.key]); }
    else if (e.key === ' '){
      if (document.activeElement && document.activeElement.tagName === 'BUTTON') return;
      e.preventDefault(); running ? togglePause() : start();
    }
  });
  $('start').addEventListener('click', () => {
    if (running && paused) togglePause(); else start();
  });
  document.querySelectorAll('.pad button').forEach(b =>
    b.addEventListener('click', () => turn(b.dataset.d)));

  let t0 = null;
  cv.addEventListener('touchstart', e => { t0 = e.touches[0]; }, {passive:true});
  cv.addEventListener('touchend', e => {
    if (!t0) return;
    const t = e.changedTouches[0], dx = t.clientX - t0.clientX, dy = t.clientY - t0.clientY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 20)
      turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    t0 = null;
  }, {passive:true});

  reset(); draw();
})();