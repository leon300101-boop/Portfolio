/* MVP presentation adapter. It never moves the root or commits resources. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.LostCraftPiggyMVP=api})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';let serial=0;
function namespaceSvg(svg,prefix){const map=new Map;for(const n of svg.querySelectorAll('[id]'))map.set(n.id,prefix+n.id);for(const n of [svg,...svg.querySelectorAll('*')])for(const a of [...n.attributes]){let v=a.value;if(a.name==='id'&&map.has(v))v=map.get(v);else if(v[0]==='#'&&map.has(v.slice(1)))v='#'+map.get(v.slice(1));else for(const[k,to]of map)v=v.split('url(#'+k+')').join('url(#'+to+')');if(v!==a.value)n.setAttribute(a.name,v)}}
function createPiggyVisual(options,deps={}){const gait=deps.gait||root.CraftGait,skin=deps.skin||root.CraftNorthSkin,posesAPI=deps.poses||root.LostCraftPlayer;
 if(!gait||!skin||!posesAPI)throw new Error('Load gait-core, north-skin and player-state-controller first');
 const{host,northSvg,staticHost,contract,files}=options||{};if(!host?.ownerDocument||!northSvg||!staticHost||!contract)throw new TypeError('host, northSvg, staticHost, contract required');const units=options.artUnitsPerWorldUnit===undefined?1:options.artUnitsPerWorldUnit;if(!Number.isFinite(units)||units<=0)throw new RangeError('Positive artUnitsPerWorldUnit required');
 namespaceSvg(northSvg,options.idPrefix||('piggy-mvp-'+(++serial)+'-'));const doc=host.ownerDocument,win=doc.defaultView||root,media=win.matchMedia?.('(prefers-reduced-motion: reduce)'),poseOptions={files,reducedMotion:!!options.reducedMotion,spriteOffsets:options.spriteOffsets},poses=posesAPI.createPlayerStateController(staticHost,poseOptions),rig=skin.mount(northSvg,contract),driver=gait.createDriver();let mode='',dead=false,paused=false,visible=true,siteReduced=!!options.reducedMotion,generation=0;
 const reduced=()=>siteReduced||!!media?.matches;
 function show(next){if(dead)return;if(mode===next)return;mode=next;const walk=next==='walk-north-pilot';northSvg.style.display=walk?'':'none';staticHost.hidden=walk;host.setAttribute('data-piggy-mode',next);options.onState?.({mode:next,pilot:walk,productionApproved:false})}
 function idle(next='idle-side-static'){generation++;poses.stop();show(next)}
 function sync(){if(dead)return;poseOptions.reducedMotion=reduced();driver.setReducedMotion(reduced());driver.reset();driver.setPaused(paused||!visible||doc.hidden);idle(reduced()?'reduced-static':paused||!visible||doc.hidden?'paused-static':'idle-side-static')}
 function update(input){if(dead)return{status:'destroyed'};if(!input||!Number.isFinite(input.x)||!Number.isFinite(input.y))throw new RangeError('Finite world root required');const p=driver.update({...input,x:input.x*units,y:input.y*units});
 if(input.teleport||input.reset){idle('teleport-static');return{...p,mode}}
 if(reduced()||paused||!visible||doc.hidden){show(reduced()?'reduced-static':'paused-static');return{...p,mode}}
 const moving=p.state==='walking'||p.state==='turn';if(!moving){if(mode!=='potion-static-pose')idle();return{...p,mode}}
 if(mode==='potion-static-pose'){generation++;poses.stop()}
 const north=p.heading.y<0&&Math.abs(p.heading.x)<=-p.heading.y*Math.tan(Math.PI/8);
 if(north){if(mode!=='walk-north-pilot'){generation++;poses.stop();show('walk-north-pilot')}rig.render(p)}else if(mode!=='movement-static-fallback')idle('movement-static-fallback');
 return{...p,mode,requiresDirectionalArt:!north,cadenceWarning:p.stepsPerSecond>5,turnTransitionPending:p.state==='turn'};
 }
 function playPotion(id){if(dead)return Promise.resolve({status:'destroyed'});if(typeof id!=='string'||!id.trim())throw new TypeError('Nonempty visual action ID required');if(poses.state==='use-potion')return poses.playPotion(id);const promise=poses.playPotion(id);if(poses.state!=='use-potion')return promise;const token=++generation;show('potion-static-pose');return promise.then(result=>{if(!dead&&generation===token&&mode==='potion-static-pose')show('idle-side-static');return result})}
 function visibility(){sync()}
 doc.addEventListener('visibilitychange',visibility);media?.addEventListener?.('change',sync);win.addEventListener?.('pagehide',destroy);sync();
 function destroy(){if(dead)return;dead=true;generation++;doc.removeEventListener('visibilitychange',visibility);media?.removeEventListener?.('change',sync);win.removeEventListener?.('pagehide',destroy);poses.destroy();rig.destroy();driver.destroy();northSvg.style.display='none';host.removeAttribute('data-piggy-mode')}
 return{update,playPotion,stop(){if(!dead){driver.reset();idle()}},setPaused(v){paused=!!v;sync()},setVisible(v){visible=!!v;sync()},setReducedMotion(v){siteReduced=!!v;sync()},destroy,get mode(){return mode},get destroyed(){return dead}};
}
return{createPiggyVisual,namespaceSvg};
});

