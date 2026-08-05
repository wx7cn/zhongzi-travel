/* 种子愛旅行 · 互动层：评论(Twikoo) */
(function () {
  var cfg = window.SITE_CONFIG || {};
  var pagePath = location.pathname;

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
