/* Visual-only gait math. Units are the native90 art frame; never camera-pan deltas. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CraftGait=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const TAU=Math.PI*2,STANCE=.56;
const mod=x=>((x%1)+1)%1;
function unit(v){const l=Math.hypot(v.x,v.y);if(!Number.isFinite(l)||l<1e-8)throw new RangeError('Finite nonzero heading required');return{x:v.x/l,y:v.y/l}}
function cycleDistance(heading){const d=unit(heading);return 1/Math.hypot(d.x/40,d.y/20)}
function hermite(a,b,da,db,t){return(2*t*t*t-3*t*t+1)*a+(t*t*t-2*t*t+t)*da+(-2*t*t*t+3*t*t)*b+(t*t*t-t*t)*db}
function footAt(phase,heading,base,options={}){const p=mod(phase),d=unit(heading),D=options.cycleDistance||cycleDistance(d),front=D*STANCE/2;let longitudinal,lift=0;
 if(p<STANCE)longitudinal=front-D*p;
 else{const q=(p-STANCE)/(1-STANCE);longitudinal=hermite(-front,front,-D*(1-STANCE),-D*(1-STANCE),q);lift=(options.clearance||3.2)*Math.sin(Math.PI*q)**2}
 return{x:base.x+d.x*longitudinal,y:base.y+d.y*longitudinal-lift,groundY:base.y+d.y*longitudinal,contact:p<STANCE,phase:p,lift,longitudinal};
}
function solveIK(hip,ankle,upper,lower,bend=1){const dx=ankle.x-hip.x,dy=ankle.y-hip.y,requested=Math.hypot(dx,dy),lo=Math.abs(upper-lower)+.0001,hi=upper+lower-.0001,r=Math.max(lo,Math.min(hi,requested)),ux=requested>1e-8?dx/requested:0,uy=requested>1e-8?dy/requested:1,a=(upper*upper-lower*lower+r*r)/(2*r),h=Math.sqrt(Math.max(0,upper*upper-a*a));return{knee:{x:hip.x+ux*a-uy*h*bend,y:hip.y+uy*a+ux*h*bend},ankle:{x:hip.x+ux*r,y:hip.y+uy*r},reachError:Math.abs(requested-r)}}
function sample(phase,heading={x:0,y:-1},options={}){const p=mod(phase),d=unit(heading),north=Math.abs(d.y)>=Math.abs(d.x)-1e-9,D=options.cycleDistance||cycleDistance(d),bob=Math.sin(2*TAU*p)*(options.weightAmplitude===undefined?1:options.weightAmplitude),sway=north?-.55*Math.sin(TAU*p):0;
 const bases=north?[{x:38,y:80},{x:52,y:80}]:[{x:45,y:80},{x:45,y:78.8}],hips=north?[{x:38+sway,y:63+bob},{x:52+sway,y:63+bob}]:[{x:44,y:55+bob},{x:46,y:54.5+bob}];
 const feet=bases.map((b,i)=>footAt(p+i*.5,d,b,{cycleDistance:D}));const legs=feet.map((f,i)=>{
 if(!north)return solveIK(hips[i],{x:f.x,y:f.y-4},13,14,-1);
 // Bend in the depth/height plane, then project. Screen-plane knees would splay like a frog.
 const projection=.55, depthFactor=Math.hypot(d.x,d.y/projection),height=17-bob;
 const physical=solveIK({x:0,y:height},{x:f.longitudinal*depthFactor,y:4+f.lift},10.5,11,1);
 const k=physical.knee.x/depthFactor;
 return{knee:{x:bases[i].x+d.x*k+sway*.5,y:80+d.y*k-physical.knee.y},ankle:{x:f.x,y:f.y-4},reachError:physical.reachError,physical};
 });
 return{phase:p,heading:d,cycleDistance:D,northProjection:north,bob,sway,bodyRoll:north?.65*Math.sin(TAU*p):.5*Math.sin(TAU*p),feet,hips,legs,arms:[12*Math.cos(TAU*p),-12*Math.cos(TAU*p)],nominalSpeed:D*1.5};
}
function createDriver(options={}){let distance=0,previous=null,heading={x:0,y:-1},destroyed=false,paused=false,reduced=!!options.reducedMotion;let state='idle';
 return{update(input){if(destroyed)throw new Error('Driver destroyed');const q={x:input.x,y:input.y};if(!Number.isFinite(q.x)||!Number.isFinite(q.y))throw new RangeError('Finite root required');const reset=!!input.teleport||!!input.reset;
 if(reset||!previous){previous=q;distance=0;state=reset?'teleport':'idle';return{...sample(0,heading),state,distance,root:q}}const delta={x:q.x-previous.x,y:q.y-previous.y},travel=Math.hypot(delta.x,delta.y);previous=q;
 if(paused||reduced){state=reduced?'reduced-motion':'paused';return{...sample(0,heading),state,distance,root:q}}
 if(travel>0.00001){const next=unit(delta);const dot=next.x*heading.x+next.y*heading.y;if(dot<Math.cos(Math.PI/8)){distance=0;state='turn';}else state='walking';heading=next;distance+=travel/cycleDistance(heading)}else state='idle';
 const pose=sample(distance,heading);const velocity=input.dt>0?travel/input.dt:0;return{...pose,state,distance,root:q,velocity,stepsPerSecond:velocity/pose.cycleDistance*2,turnNeedsReview:state==='turn'};},
 reset(q){previous=q?{x:q.x,y:q.y}:null;distance=0;state='idle'},setPaused(v){paused=!!v},setReducedMotion(v){reduced=!!v;distance=0},destroy(){destroyed=true;previous=null},get state(){return state},get destroyed(){return destroyed}};
}
return{STANCE,cycleDistance,footAt,solveIK,sample,createDriver};
});




