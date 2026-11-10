/* Visual pose/state orchestration only: no navigation, currency or gameplay commit authority. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.LostCraftPlayer=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function createPlayerStateController(host,options={}){
 if(!host?.ownerDocument)throw new TypeError('Player visual host required');
 const doc=host.ownerDocument,win=doc.defaultView||globalThis,files=options.files||{},walk=options.walkController,walkHost=options.walkHost;
 if(!files.idleSide||!files.north)throw new TypeError('idleSide and north sprites required');
 let img=options.imageElement||host.querySelector('img'),owned=false;
 if(!img){img=doc.createElement('img');host.appendChild(img);owned=true;}
 img.alt='';img.draggable=false;img.style.pointerEvents='none';img.setAttribute('aria-hidden','true');
 const media=win.matchMedia?win.matchMedia('(prefers-reduced-motion: reduce)'):null;
 const handled=new Set();let dead=false,state='idle-side',pending=null;
 const reduced=()=>!!options.reducedMotion||!!media?.matches;
 const frames=list=>(list||[]).map(f=>typeof f==='string'?{src:f,holdMs:120}:f).filter(f=>f&&typeof f.src==='string'&&f.src);
 function pauseWalk(){if(walk)walk.pause();if(walkHost)walkHost.hidden=true;img.hidden=false;}
 function show(next,src){state=next;pauseWalk();if(src){img.src=src;const offset=options.spriteOffsets?.[src];img.style.transform='translateY('+(Number(offset?.y)||0)+'px)';}host.setAttribute('data-player-state',next);
  if(next==='north-walk'&&walk&&walkHost&&!doc.hidden&&!reduced()){img.hidden=true;walkHost.hidden=false;walk.play();}
  if(typeof options.onState==='function')options.onState({state:next,locomotionMode:next==='north-walk'?(walk&&walkHost&&!reduced()?'experimental-cutout':'static-north-fallback'):'pose-sequence'});
 }
 function cancel(reason){const p=pending;if(!p)return;pending=null;if(p.timer!==null)win.clearTimeout(p.timer);p.resolve({status:'cancelled',reason,actionId:p.actionId});}
 function sequence(next,steps,finalState,finalSrc,actionId){
  cancel('superseded');pauseWalk();return new Promise(resolve=>{const p={timer:null,resolve,actionId,index:0,target:finalState};pending=p;
   function advance(){if(dead||pending!==p)return;if(p.index>=steps.length){pending=null;show(finalState,finalSrc);resolve({status:'finished',state:finalState,actionId});return;}
    const frame=steps[p.index++];show(next,frame.src);p.timer=win.setTimeout(advance,Math.max(1,Number(frame.holdMs)||120));}
   advance();
  });
 }
 function turnToIdle(){if(dead)return Promise.resolve({status:'destroyed'});if(state==='idle-side'&&!pending)return Promise.resolve({status:'unchanged',state});if(pending?.target==='idle-side'&&state==='turning')return Promise.resolve({status:'pending',state});
  const steps=reduced()||doc.hidden?[]:frames(files.turnFrames).reverse();return sequence('turning',steps,'idle-side',files.idleSide);
 }
 function setMoving(moving){if(!moving)return turnToIdle();if(dead)return Promise.resolve({status:'destroyed'});if(doc.hidden)return Promise.resolve({status:'hidden'});
  if(state==='north-walk'&&!pending)return Promise.resolve({status:'unchanged',state});if(pending?.target==='north-walk')return Promise.resolve({status:'pending',state});
  const steps=reduced()?[]:frames(files.turnFrames);return sequence('turning',steps,'north-walk',files.north);
 }
 function playPotion(actionId){if(dead)return Promise.resolve({status:'destroyed'});if(typeof actionId!=='string'||!actionId.trim())throw new TypeError('Nonempty visual action ID required');
  if(handled.has(actionId))return Promise.resolve({status:'duplicate',actionId});if(state==='use-potion'&&pending)return Promise.resolve({status:'busy',actionId});
  const poses=frames(files.potionFrames);if(!poses.length)return Promise.resolve({status:'unavailable',actionId});if(doc.hidden)return Promise.resolve({status:'hidden',actionId});
  handled.add(actionId);const steps=reduced()?[{src:poses[poses.length-1].src,holdMs:240}]:poses;
  return sequence('use-potion',steps,'idle-side',files.idleSide,actionId);
 }
 function stop(){if(dead)return;cancel('stopped');show('idle-side',files.idleSide);}
 function visibility(){if(doc.hidden)stop();}
 function preference(){if(!reduced()){if(state==='north-walk'&&!pending)show('north-walk',files.north);return;}const wasMoving=state==='north-walk';cancel('reduced-motion');show(wasMoving?'north-walk':'idle-side',wasMoving?files.north:files.idleSide);}
 function destroy(){if(dead)return;cancel('destroyed');dead=true;pauseWalk();walk?.destroy();if(media){if(media.removeEventListener)media.removeEventListener('change',preference);else media.removeListener?.(preference);}doc.removeEventListener('visibilitychange',visibility);win.removeEventListener?.('pagehide',destroy);if(owned)img.remove();}
 if(media){if(media.addEventListener)media.addEventListener('change',preference);else media.addListener?.(preference);}doc.addEventListener('visibilitychange',visibility);win.addEventListener?.('pagehide',destroy);show('idle-side',files.idleSide);
 return Object.freeze({setMoving,turnToIdle,playPotion,stop,destroy,get state(){return state;},get destroyed(){return dead;},get motionMode(){return walk&&walkHost?'experimental-cutout-with-authored-pose-holds':'sprite-pose-holds';}});
}
return {createPlayerStateController};
});
