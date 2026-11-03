/* Plays the bar recordings only while they are on screen; leaves the poster still when reduced motion is on. */
(function(){
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce||!('IntersectionObserver' in window))return;
  var io=new IntersectionObserver(function(es){es.forEach(function(e){var v=e.target;if(e.isIntersecting){var p=v.play();if(p&&p.catch)p.catch(function(){})}else{v.pause()}})},{threshold:.35});
  function scan(root){(root.querySelectorAll?root.querySelectorAll('video.barVid:not([data-bv])'):[]).forEach(function(v){v.setAttribute('data-bv','1');io.observe(v)})}
  function start(){scan(document);new MutationObserver(function(){scan(document)}).observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
