
// 进入视口时触发淡入+Ken Burns
var io = new IntersectionObserver(function(entries){
  entries.forEach(function(e){
    if(e.isIntersecting){ e.target.classList.add('in-view'); }
  });
}, {threshold: 0.35});
document.querySelectorAll('.ex-panel').forEach(function(p){ io.observe(p); });

// 顶部进度条
var bar = document.querySelector('.ex-progress-bar');
if(bar){
  var update = function(){
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
  };
  window.addEventListener('scroll', update, {passive:true});
  update();
}
