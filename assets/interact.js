/* 种子愛旅行 · 互动层：点赞 / 分享 / 评论(Twikoo) */
(function () {
  var cfg = window.SITE_CONFIG || {};
  var pageUrl = location.href.split('#')[0];
  var pageTitle = document.title;

  /* ---------- 点赞 ---------- */
  var likeBtn = document.querySelector('.act-like');
  if (likeBtn) {
    var likeKey = 'zzly_like_' + location.pathname;
    var likedLocal = !!localStorage.getItem(likeKey);

    function renderLike(count, liked) {
      likeBtn.classList.toggle('liked', liked);
      likeBtn.querySelector('.act-num').textContent = (count === null ? '' : count);
    }
    renderLike(null, likedLocal);

    if (cfg.likeApi) {
      // 云端计数（CloudBase HTTP函数，开通后自动启用）
      fetch(cfg.likeApi + '?path=' + encodeURIComponent(location.pathname))
        .then(function (r) { return r.json(); })
        .then(function (d) { renderLike(d.count || 0, likedLocal); })
        .catch(function () {});
      likeBtn.addEventListener('click', function () {
        if (likeBtn.classList.contains('liked')) return;
        localStorage.setItem(likeKey, '1');
        renderLike(null, true);
        fetch(cfg.likeApi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: location.pathname })
        }).then(function (r) { return r.json(); })
          .then(function (d) { renderLike(d.count || 0, true); })
          .catch(function () {});
      });
    } else {
      // 后端未开通：仅本机记录
      likeBtn.title = '云端点赞计数开通中，当前仅在本机记录';
      likeBtn.addEventListener('click', function () {
        var liked = likeBtn.classList.contains('liked');
        if (liked) { localStorage.removeItem(likeKey); } else { localStorage.setItem(likeKey, '1'); }
        renderLike(null, !liked);
      });
    }
  }

  /* ---------- 分享 ---------- */
  function openWin(u) { window.open(u, '_blank', 'width=640,height=520,noopener'); }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-share]');
    if (!b) return;
    var kind = b.getAttribute('data-share');
    if (kind === 'copy') {
      (navigator.clipboard ? navigator.clipboard.writeText(pageUrl) : Promise.reject())
        .then(function () { toast('链接已复制'); })
        .catch(function () {
          var inp = document.createElement('input');
          inp.value = pageUrl; document.body.appendChild(inp);
          inp.select(); document.execCommand('copy'); inp.remove();
          toast('链接已复制');
        });
    } else if (kind === 'weibo') {
      openWin('https://service.weibo.com/share/share.php?url=' + encodeURIComponent(pageUrl) + '&title=' + encodeURIComponent(pageTitle));
    } else if (kind === 'qzone') {
      openWin('https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=' + encodeURIComponent(pageUrl) + '&title=' + encodeURIComponent(pageTitle));
    } else if (kind === 'wechat') {
      showQr();
    }
  });

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'act-toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 10);
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 1800);
  }

  function showQr() {
    var mask = document.createElement('div');
    mask.className = 'qr-mask';
    mask.innerHTML = '<div class="qr-box"><div class="qr-code"></div><p>微信扫一扫，分享给朋友</p></div>';
    mask.addEventListener('click', function () { mask.remove(); });
    document.body.appendChild(mask);
    if (window.QRCode) {
      new QRCode(mask.querySelector('.qr-code'), { text: pageUrl, width: 180, height: 180 });
    } else {
      mask.querySelector('.qr-code').textContent = pageUrl;
    }
  }

  /* ---------- 评论(Twikoo) ---------- */
  var tbox = document.getElementById('tcomment');
  if (tbox) {
    if (cfg.twikooEnvId && window.twikoo) {
      twikoo.init({
        envId: cfg.twikooEnvId,
        el: '#tcomment',
        path: location.pathname
      });
    } else {
      tbox.innerHTML = '<p class="tk-pending">评论区正在开通中，很快可以留言 ✍</p>';
    }
  }
})();
