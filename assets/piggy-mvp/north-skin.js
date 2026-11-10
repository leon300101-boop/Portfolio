(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CraftNorthSkin=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function interpolate(y,ys,pts){let i=0;while(i<ys.length-2&&y>ys[i+1])i++;const t=(y-ys[i])/(ys[i+1]-ys[i]);return{x:pts[i].x+(pts[i+1].x-pts[i].x)*t,y:pts[i].y+(pts[i+1].y-pts[i].y)*t}}
function matrices(pose,contract){const out={},ys=contract.jointSourceY,s=contract.legWidthScale;
 contract.legs.forEach((leg,index)=>{const points=[pose.hips[index],pose.legs[index].knee,pose.legs[index].ankle,{x:pose.feet[index].x,y:pose.feet[index].y}],sourceX=leg.sourceX.map((x,i)=>({x,y:ys[i]}));
 for(const band of contract.bands.filter(b=>b.name===leg.name)){const[y0,y1]=band.sourceY,dy=y1-y0,p0=interpolate(y0,ys,points),p1=interpolate(y1,ys,points),x0=interpolate(y0,ys,sourceX).x,x1=interpolate(y1,ys,sourceX).x,c=(p1.x-p0.x-s*(x1-x0))/dy,d=(p1.y-p0.y)/dy,e=p0.x-s*x0-c*y0,f=p0.y-d*y0;out[band.id]=[s,0,c,d,e,f]}
 });return out;
}
function partTransforms(p){const c=Math.cos(p.phase*Math.PI*2),base=`translate(${p.sway} ${p.bob}) rotate(${p.bodyRoll} 45 63)`;return{body:`${base} translate(45 6.6)`,leftArm:`${base} translate(31.7 41.5) rotate(${6.5*c}) scale(1 ${1+.09*c})`,rightArm:`${base} translate(58.3 41.5) rotate(${-6.5*c}) scale(1 ${1-.09*c})`}}
function mount(svg,contract){const groups={},skin={};for(const n of ['body','leftArm','rightArm']){groups[n]=svg.querySelector('[data-part="'+n+'"]');if(!groups[n])throw new Error('Missing '+n)}for(const b of contract.bands){skin[b.id]=svg.querySelector('[data-skin="'+b.id+'"]');if(!skin[b.id])throw new Error('Missing skin '+b.id)}let destroyed=false;
 return{render(p){if(destroyed)return;for(const[id,m]of Object.entries(matrices(p,contract)))skin[id].setAttribute('transform','matrix('+m.join(' ')+')');for(const[n,t]of Object.entries(partTransforms(p)))groups[n].setAttribute('transform',t)},destroy(){destroyed=true}};
}
return{interpolate,matrices,partTransforms,mount};
});

