/* 种子愛旅行 · 互动层：点赞(页面+单张照片) / 分享(微信直转/系统面板) / 评论(Twikoo) */
(function () {
  var cfg = window.SITE_CONFIG || {};
  var pageUrl = location.href.split('#')[0];
  var pagePath = location.pathname;
  var pageTitle = document.title;
  var isWeChat = /MicroMessenger/i.test(navigator.userAgent);

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'act-toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 10);
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 1800);
  }

  function copyText(text, okMsg) {
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
      .then(function () { toast(okMsg); })
      .catch(function () {
        var inp = document.createElement('input');
        inp.value = text; document.body.appendChild(inp);
        inp.select(); document.execCommand('copy'); inp.remove();
        toast(okMsg);
      });
  }

  /* ---------- 点赞（云端计数，页面级+照片级共用） ---------- */
  var likeKeyPrefix = 'zzly_like_';

  function likePathOf(el) {
    var anchor = el.getAttribute('data-anchor') || '';
    return pagePath + (anchor ? '#' + anchor : '');
  }

  function renderLike(el, count, liked) {
    el.classList.toggle('liked', liked);
    var num = el.querySelector('.act-num');
    if (num) num.textContent = (count === null || count === undefined) ? '' : (count > 0 ? count : '');
  }

  var likeEls = Array.prototype.slice.call(document.querySelectorAll('.act-like'));
  likeEls.forEach(function (el) {
    var p = likePathOf(el);
    renderLike(el, null, !!localStorage.getItem(likeKeyPrefix + p));
  });

  if (cfg.likeApi && likeEls.length) {
    // 一次请求批量取回本页所有点赞数（页面级+每张照片）
    fetch(cfg.likeApi + '?prefix=' + encodeURIComponent(pagePath))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var counts = d.counts || {};
        likeEls.forEach(function (el) {
          var p = likePathOf(el);
          renderLike(el, counts[p] || 0, !!localStorage.getItem(likeKeyPrefix + p));
        });
      }).catch(function () {});
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('.act-like');
    if (!el) return;
    var p = likePathOf(el);
    if (el.classList.contains('liked')) return;
    localStorage.setItem(likeKeyPrefix + p, '1');
    renderLike(el, null, true);
    if (cfg.likeApi) {
      fetch(cfg.likeApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: p })
      }).then(function (r) { return r.json(); })
        .then(function (d) { renderLike(el, d.count, true); })
        .catch(function () {});
    }
  });

  /* ---------- 分享 ---------- */
  function shareUrlOf(el) {
    var anchor = el.getAttribute('data-anchor') || '';
    return pageUrl + (anchor ? '#' + anchor : '');
  }

  function wechatOverlay() {
    var mask = document.createElement('div');
    mask.className = 'wx-mask';
    mask.innerHTML = '<div class="wx-tip"><span class="wx-arrow">➹</span>点右上角 <b>···</b><br>即可转发给朋友<br>或分享到朋友圈</div>';
    mask.addEventListener('click', function () { mask.remove(); });
    document.body.appendChild(mask);
  }

  function doShare(url, title) {
    if (isWeChat) { wechatOverlay(); return; }
    if (navigator.share) {
      navigator.share({ title: title, url: url }).catch(function () {});
      return;
    }
    copyText(url, '链接已复制，粘贴到微信即可分享');
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-share]');
    if (!b) return;
    var kind = b.getAttribute('data-share');
    var url = shareUrlOf(b);
    if (kind === 'copy') {
      copyText(url, '链接已复制');
    } else if (kind === 'weibo') {
      window.open('https://service.weibo.com/share/share.php?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(pageTitle), '_blank', 'width=640,height=520,noopener');
    } else if (kind === 'qzone') {
      window.open('https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(pageTitle), '_blank', 'width=640,height=520,noopener');
    } else if (kind === 'wechat' || kind === 'moment') {
      doShare(url, pageTitle);
    }
  });

  /* ---------- 单张照片「评论」→ 跳到评论区并带上照片编号 ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.m-comment');
    if (!b) return;
    var anchor = b.getAttribute('data-anchor') || '';
    var tag = anchor ? '#' + anchor.replace('m', '') + ' ' : '';
    var box = document.getElementById('tcomment');
    if (box) {
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(function () {
        var ta = box.querySelector('.tk-input textarea, textarea');
        if (ta) {
          if (!ta.value.startsWith(tag)) ta.value = tag + ta.value;
          ta.focus();
        } else {
          toast('评论时注明照片编号 ' + tag.trim() + ' 即可');
        }
      }, 600);
    }
  });

  /* ---------- 评论(Twikoo) ---------- */
  var tbox = document.getElementById('tcomment');
  if (tbox) {
    if (cfg.twikooEnvId && window.twikoo) {
      twikoo.init({
        envId: cfg.twikooEnvId,
        el: '#tcomment',
        path: pagePath
      });
    } else {
      tbox.innerHTML = '<p class="tk-pending">评论区正在开通中，很快可以留言 ✍</p>';
    }
  }
})();
