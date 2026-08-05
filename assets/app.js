
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
