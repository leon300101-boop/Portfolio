/* Plays the bar recordings only while they are on screen; leaves the poster still when reduced motion is on. */
(function(){
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce||!('IntersectionObserver' in window))return;
  var io=new IntersectionObserver(function(es){es.forEach(function(e){var v=e.target;if(e.isIntersecting){var p=v.play();if(p&&p.catch)p.catch(function(){})}else{v.pause()}})},{threshold:.35});
  /* Callouts that point at map content (not the fixed HUD) follow the recording: data-switch="from,to" hides them while the map scrolls (from..to), then they reappear at data-x2/data-y2, and return to their first position when it loops. */
  function sync(v){var f=v.closest&&v.closest('.barNum');if(!f)return;var cs=f.querySelectorAll('.cl[data-switch]');if(!cs.length)return;
    cs.forEach(function(c){c._x=c.style.getPropertyValue('--x');c._y=c.style.getPropertyValue('--y')});
    function upd(){var t=v.currentTime;cs.forEach(function(c){var w=c.getAttribute('data-switch').split(',');var a=parseFloat(w[0]),b=parseFloat(w[1]);var mid=t>=a&&t<b,moved=t>=b;c.classList.toggle('off',mid);
      c.style.setProperty('--x',moved?c.getAttribute('data-x2'):c._x);c.style.setProperty('--y',moved?c.getAttribute('data-y2'):c._y)})}
    v.addEventListener('timeupdate',upd);v.addEventListener('seeked',upd);v.addEventListener('ended',upd);
    if(v.requestVideoFrameCallback){(function loop(){upd();v.requestVideoFrameCallback(loop)})()}}
  function scan(root){(root.querySelectorAll?root.querySelectorAll('video.barVid:not([data-bv])'):[]).forEach(function(v){v.setAttribute('data-bv','1');io.observe(v);sync(v)})}
  function start(){scan(document);new MutationObserver(function(){scan(document)}).observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
