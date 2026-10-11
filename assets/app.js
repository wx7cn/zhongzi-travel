
function closeZoom(){
  var lb = document.querySelector('.lb');
  if(lb){
    if(lb._osd){ try{ lb._osd.destroy(); }catch(err){} }
    lb.remove();
  }
}
document.addEventListener('click', function(e){
  var img = e.target.closest('.m-photo img');
  if(!img) return;
  var lb = document.createElement('div');
  lb.className = 'lb';
  if(window.OpenSeadragon){
    var mount = document.createElement('div');
    mount.className = 'lb-osd';
    lb.appendChild(mount);
    var hint = document.createElement('div');
    hint.className = 'lb-hint';
    hint.textContent = '\u6eda\u8f6e/\u53cc\u6307\u7f29\u653e \u00b7 \u62d6\u62fd\u5e73\u79fb';
    lb.appendChild(hint);
    var closeBtn = document.createElement('button');
    closeBtn.className = 'lb-close';
    closeBtn.textContent = '\u2715';
    closeBtn.addEventListener('click', closeZoom);
    lb.appendChild(closeBtn);
    document.body.appendChild(lb);
    lb._osd = OpenSeadragon({
      element: mount,
      tileSources: { type: 'image', url: img.src },
      showNavigationControl: false,
      gestureSettingsMouse: { clickToZoom: true, dblClickToZoom: true },
      maxZoomPixelRatio: 3,
      visibilityRatio: 0.6
    });
  } else {
    var big = document.createElement('img');
    big.src = img.src;
    lb.appendChild(big);
    lb.addEventListener('click', closeZoom);
    document.body.appendChild(lb);
  }
});
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){ closeZoom(); }
});

// ---------- 扇形封面流：每张卡的 transform / 亮度 / 透明度 / 层级都由「与中心的索引差 d」算出 ----------
(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function pad(x){ return (x < 10 ? '0' : '') + x; }

  function initCF(root){
    var track = root.querySelector('.cf-track');
    var cards = Array.prototype.slice.call(track.querySelectorAll('.cf-card'));
    var n = cards.length;
    if(!n) return;
    var loop = n >= 8;                       // 卡够多才首尾相接，少了就两端停住
    var pos = +root.getAttribute('data-start') || 0;   // 连续位置（拖动时为小数）
    var cur = pos;
    var cap = root.querySelector('.cf-caption');
    var capK = cap.querySelector('.cf-k'), capT = cap.querySelector('.cf-title'),
        capM = cap.querySelector('.cf-meta'), capGo = cap.querySelector('.cf-go'),
        capMore = cap.querySelector('.cf-more');
    var countEl = root.querySelector('.cf-count b');
    var prevBtn = root.querySelector('.cf-prev'), nextBtn = root.querySelector('.cf-next');
    var bgs = root.querySelectorAll('.cf-bg img'), bgOn = 0;
    var G;

    function mod(i){ return ((i % n) + n) % n; }
    function geom(){
      var w = cards[0].offsetWidth, narrow = root.clientWidth < 640;
      G = { w: w, spread: w * (narrow ? .40 : .50), ang: narrow ? 7 : 9, vis: narrow ? 2.7 : 3.7 };
    }
    function diff(i){
      var d = i - pos;
      if(loop){ d = ((d % n) + n) % n; if(d > n / 2) d -= n; }
      return d;
    }
    function layout(){
      cards.forEach(function(c, i){
        var d = diff(i), a = Math.abs(d), sg = d < 0 ? -1 : 1, k = Math.min(a, 4);
        var x = sg * G.spread * (a <= 1 ? a : 1 + (a - 1) * .74);   // 越往外排得越密
        var y = Math.pow(a, 1.5) * G.w * .05;                        // 两侧下沉成弧
        var r = d * G.ang;                                           // 扇形旋转
        var sc = 1 - k * .1;                                         // 逐级缩小
        var br = 1 - k * .17;                                        // 逐级变暗
        var op = Math.max(0, Math.min(1, 1 - a * .08, G.vis - a));   // 远端淡出
        c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + r.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
        c.style.filter = 'brightness(' + br.toFixed(3) + ')';
        c.style.opacity = op.toFixed(3);
        c.style.visibility = op < .01 ? 'hidden' : 'visible';
        c.style.zIndex = 100 - Math.round(a * 10);                   // 越近中心越靠上
        var on = a < .5;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-hidden', on ? 'false' : 'true');
        c.tabIndex = on ? 0 : -1;
      });
    }
    function caption(){
      var c = cards[cur];
      if(countEl) countEl.textContent = pad(cur + 1);
      if(prevBtn && !loop){ prevBtn.disabled = cur === 0; nextBtn.disabled = cur === n - 1; }
      cap.classList.add('swap');
      clearTimeout(cap._t);
      cap._t = setTimeout(function(){
        capK.textContent = c.getAttribute('data-k');
        capT.textContent = c.getAttribute('data-title');
        capM.textContent = c.getAttribute('data-meta');
        capGo.href = c.href;
        var more = c.getAttribute('data-more');
        if(more){ capMore.textContent = more; capMore.href = c.getAttribute('data-more-href'); capMore.hidden = false; }
        else { capMore.hidden = true; }
        cap.classList.remove('swap');
      }, reduce ? 0 : 200);
      var img = c.querySelector('img'), src = img.getAttribute('src');
      var nxt = bgs[1 - bgOn], old = bgs[bgOn];
      if(!nxt || old.getAttribute('src') === src) return;
      nxt.onload = function(){ nxt.classList.add('on'); old.classList.remove('on'); };
      nxt.src = src;
      bgOn = 1 - bgOn;
    }
    function sync(){
      layout();
      var c = mod(Math.round(pos));
      if(c !== cur){ cur = c; caption(); }
    }
    function go(target){
      if(!loop) target = Math.max(0, Math.min(n - 1, target));
      pos = target;
      sync();
    }
    function step(dir){ go(Math.round(pos) + dir); }
    function toCard(i){ go(Math.round(pos) + Math.round(diff(i))); }

    // 自动轮播（仅首页）：悬停/聚焦暂停，用户一旦动手就停
    var timer = null, hover = false, seen = true;
    function stop(){ if(timer){ clearInterval(timer); timer = null; } }

    root.classList.add('cf-ready', 'is-dragging');
    geom(); layout(); caption();
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ root.classList.remove('is-dragging'); }); });

    if(prevBtn){ prevBtn.addEventListener('click', function(){ stop(); step(-1); }); }
    if(nextBtn){ nextBtn.addEventListener('click', function(){ stop(); step(1); }); }

    // 点侧卡：先转到中心；点中心卡：进入
    var justDragged = false;
    cards.forEach(function(c, i){
      c.addEventListener('click', function(e){
        if(justDragged){ e.preventDefault(); return; }
        if(i !== cur){ e.preventDefault(); stop(); toCard(i); }
      });
      c.addEventListener('dragstart', function(e){ e.preventDefault(); });
    });

    // 拖动 / 横滑：整组跟手连续转动，松手吸附到最近一张
    var sx = 0, sy = 0, sp = 0, down = false, dragging = false;
    track.addEventListener('pointerdown', function(e){
      if(e.button !== 0) return;
      down = true; dragging = false; sx = e.clientX; sy = e.clientY; sp = pos;
    });
    window.addEventListener('pointermove', function(e){
      if(!down) return;
      var dx = e.clientX - sx;
      if(!dragging){
        if(Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(e.clientY - sy)) return;
        dragging = true; stop(); root.classList.add('is-dragging');
      }
      var p = sp - dx / G.spread;
      if(!loop) p = Math.max(-.35, Math.min(n - .65, p));
      pos = p; sync();
    });
    function release(){
      if(!down) return;
      down = false;
      if(!dragging) return;
      root.classList.remove('is-dragging');
      var moved = pos - sp, t = Math.round(pos);
      if(t === Math.round(sp) && Math.abs(moved) > .18) t += moved > 0 ? 1 : -1;   // 轻轻一甩也翻页
      go(t);
      justDragged = true;
      setTimeout(function(){ justDragged = false; }, 0);
    }
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);

    // 键盘与触控板横向滚动
    root.addEventListener('keydown', function(e){
      if(e.key === 'ArrowLeft'){ e.preventDefault(); stop(); step(-1); }
      else if(e.key === 'ArrowRight'){ e.preventDefault(); stop(); step(1); }
    });
    var wheelLock = 0;
    track.addEventListener('wheel', function(e){
      if(Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 12) return;
      e.preventDefault();
      var now = Date.now();
      if(now - wheelLock < 420) return;
      wheelLock = now; stop(); step(e.deltaX > 0 ? 1 : -1);
    }, {passive:false});

    window.addEventListener('resize', function(){ geom(); layout(); });

    if(root.getAttribute('data-autoplay') && !reduce && n > 1){
      timer = setInterval(function(){ if(!hover && seen && !document.hidden) step(1); }, 5200);
      root.addEventListener('mouseenter', function(){ hover = true; });
      root.addEventListener('mouseleave', function(){ hover = false; });
      root.addEventListener('focusin', function(){ hover = true; });
      root.addEventListener('focusout', function(){ hover = false; });
      if('IntersectionObserver' in window){
        new IntersectionObserver(function(es){ seen = es[0].isIntersecting; }, {threshold:.4}).observe(root);
      }
    }
  }
  Array.prototype.forEach.call(document.querySelectorAll('.cf'), initCF);
})();
