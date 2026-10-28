// Independent local tools. Adobe's captured implementation is not used here.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const finite=(value,fallback,min,max,name)=>{const n=Number(value??fallback);if(!Number.isFinite(n))throw Error('Invalid '+name);return clamp(n,min,max);};
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
const point=p=>{if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1)throw Error('Invalid tool point');return {x:p.x,y:p.y};};
const identity=()=>[[0,0],[1,1]];
export const CURVE_MIN_GAP=.001;
export const COLOR_RANGES=[['red',0,'#df736e'],['orange',30,'#d99a65'],['yellow',60,'#d2c571'],['green',120,'#89b77c'],['aqua',180,'#72bbb5'],['blue',240,'#7e9bc7'],['purple',270,'#a68ac5'],['magenta',300,'#c184ac']];
export function advancedDefaults(){return {curves:{rgb:identity(),r:identity(),g:identity(),b:identity()},mixer:Object.fromEntries(COLOR_RANGES.map(([name])=>[name,{hue:0,saturation:0,luminance:0}])),texture:0,clarity:0,dehaze:0,noiseReduction:0,colorNoiseReduction:0,grain:0,grainSize:25,grainRoughness:50,distortion:0,chromaticRed:0,chromaticBlue:0,defringe:0,masks:[],retouches:[]};}
const linear=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
const encoded=v=>v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055;
const adjustmentNames=['exposure','contrast','highlights','shadows','temperature','saturation'];
export function normalizeLocal(input={}){return Object.fromEntries(adjustmentNames.map(name=>[name,finite(input[name],0,name==='exposure'?-4:-100,name==='exposure'?4:100,'mask '+name)]));}
function normalizeStroke(s){if(!s||!Array.isArray(s.points)||!s.points.length||s.points.length>512)throw Error('Brush stroke requires1–512 points');return {points:s.points.map(point),radius:finite(s.radius,.05,.002,.5,'brush radius'),feather:finite(s.feather,.7,0,1,'brush feather'),erase:!!s.erase};}
export function normalizeAdvanced(input={}){
 const s=advancedDefaults();
 for(const name of ['texture','clarity','dehaze','distortion','chromaticRed','chromaticBlue'])s[name]=finite(input[name],0,-100,100,name);
 for(const name of ['noiseReduction','colorNoiseReduction','grain','defringe'])s[name]=finite(input[name],0,0,100,name);
 for(const name of ['grainSize','grainRoughness'])s[name]=finite(input[name],s[name],1,100,name);
 for(const key of ['rgb','r','g','b']){
  const points=input.curves?.[key]??s.curves[key];
  if(!Array.isArray(points)||points.length<2||points.length>16)throw Error('A curve needs2–16 points');
  let previous=-1;for(const p of points){if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||p[0]<0||p[0]>1||p[1]<0||p[1]>1||p[0]-previous<CURVE_MIN_GAP-1e-12)throw Error('Invalid curve points');previous=p[0];}
  if(points[0][0]!==0||points.at(-1)[0]!==1)throw Error('Curve endpoints must span0 to1');s.curves[key]=points.map(p=>[...p]);
 }
 for(const [name]of COLOR_RANGES)for(const key of ['hue','saturation','luminance'])s.mixer[name][key]=finite(input.mixer?.[name]?.[key],0,-100,100,'color mixer');
 if(input.masks!=null&&!Array.isArray(input.masks))throw Error('Invalid mask collection');
 if((input.masks?.length||0)>12)throw Error('Up to12 masks supported');
 s.masks=(input.masks||[]).map((mask,i)=>{
  if(!mask||!['brush','linear','radial'].includes(mask.type))throw Error('Invalid mask type');
  if(mask.strokes!=null&&!Array.isArray(mask.strokes))throw Error('Invalid brush strokes');
  if((mask.strokes?.length||0)>64)throw Error('Up to64 strokes per mask');
  return {id:String(mask.id??i).slice(0,80),name:String(mask.name||'Mask '+(i+1)).slice(0,80),type:mask.type,enabled:mask.enabled!==false,inverted:!!mask.inverted,opacity:finite(mask.opacity,1,0,1,'mask opacity'),feather:finite(mask.feather,.7,0,1,'mask feather'),start:point(mask.start||{x:.25,y:.25}),end:point(mask.end||{x:.75,y:.75}),strokes:(mask.strokes||[]).map(normalizeStroke),adjustments:normalizeLocal(mask.adjustments)};
 });
 if(new Set(s.masks.map(mask=>mask.id)).size!==s.masks.length)throw Error('Mask identifiers must be unique');
 if(input.retouches!=null&&!Array.isArray(input.retouches))throw Error('Invalid retouch collection');
 if((input.retouches?.length||0)>64)throw Error('Up to64 retouch strokes supported');
 s.retouches=(input.retouches||[]).map(stroke=>{if(!['clone','heal'].includes(stroke.mode))throw Error('Invalid retouch mode');return {...normalizeStroke(stroke),mode:stroke.mode,source:point(stroke.source),opacity:finite(stroke.opacity,1,0,1,'retouch opacity')};});
 return s;
}
// Shape-preserving cubic interpolation; compiled once per render.
export function curveValue(points,x){
 let i=0;while(i<points.length-2&&x>points[i+1][0])i++;
 const [x0,y0]=points[i],[x1,y1]=points[i+1],d=(y1-y0)/(x1-x0);
 const slope=j=>{if(j===0)return (points[1][1]-points[0][1])/(points[1][0]-points[0][0]);if(j===points.length-1)return (points[j][1]-points[j-1][1])/(points[j][0]-points[j-1][0]);const a=(points[j][1]-points[j-1][1])/(points[j][0]-points[j-1][0]),b=(points[j+1][1]-points[j][1])/(points[j+1][0]-points[j][0]);return a*b<=0?0:2*a*b/(a+b);};
 let m0=slope(i),m1=slope(i+1);if(!d){m0=0;m1=0;}else{const norm=(m0/d)**2+(m1/d)**2;if(norm>9){const scale=3/Math.sqrt(norm);m0*=scale;m1*=scale;}}
 const t=clamp((x-x0)/(x1-x0)),t2=t*t,t3=t2*t;
 return clamp((2*t3-3*t2+1)*y0+(t3-2*t2+t)*(x1-x0)*m0+(-2*t3+3*t2)*y1+(t3-t2)*(x1-x0)*m1);
}
export function rgbToHsl(r,g,b){const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));h=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;h=((h*60)%360+360)%360;}return [h,s,l];}
export function hslToRgb(h,s,l){const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;const v=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return v.map(n=>n+m);}
export function applyAdvancedColor(data,s){
 const curvesActive=Object.values(s.curves).some(p=>p.length!==2||p[0][1]!==0||p[1][1]!==1),mixerActive=Object.values(s.mixer).some(v=>Object.values(v).some(Boolean));
 if(!curvesActive&&!mixerActive&&!s.dehaze)return;
 const luts=Object.fromEntries(Object.entries(s.curves).map(([key,points])=>[key,Float32Array.from({length:4097},(_,i)=>curveValue(points,i/4096))]));
 const sample=(lut,v)=>{const f=clamp(v)*4096,i=Math.floor(f);return lut[i]+(lut[Math.min(4096,i+1)]-lut[i])*(f-i);};
 for(let i=0;i<data.length;i+=4){let r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255;
  if(s.dehaze>0){const dark=Math.min(r,g,b),t=Math.max(.25,1-s.dehaze/100*.75*dark);r=(r-1+t)/t;g=(g-1+t)/t;b=(b-1+t)/t;}else if(s.dehaze<0){const a=-s.dehaze/100*.4;r=r*(1-a)+a;g=g*(1-a)+a;b=b*(1-a)+a;}
  if(curvesActive){r=sample(luts.r,sample(luts.rgb,r));g=sample(luts.g,sample(luts.rgb,g));b=sample(luts.b,sample(luts.rgb,b));}
  if(mixerActive){let [h,sat,l]=rgbToHsl(clamp(r),clamp(g),clamp(b));let dh=0,ds=0,dl=0,total=0;for(const[name,center]of COLOR_RANGES){const delta=Math.abs(h-center),distance=Math.min(delta,360-delta),w=Math.max(0,1-distance/60);const v=s.mixer[name];total+=w;dh+=v.hue*w;ds+=v.saturation*w;dl+=v.luminance*w;}if(total&&sat>.001){const chromaWeight=Math.min(1,sat*4);h=(h+dh/total*.45+360)%360;sat=clamp(sat*(1+ds/total/100));l=clamp(l+dl/total/100*.4*chromaWeight);[r,g,b]=hslToRgb(h,sat,l);}}
  data[i]=clamp(r)*255;data[i+1]=clamp(g)*255;data[i+2]=clamp(b)*255;
 }
}
function sampleChannel(data,w,h,x,y,c){x=clamp(x,0,w-1);y=clamp(y,0,h-1);const x0=Math.floor(x),y0=Math.floor(y),x1=Math.min(w-1,x0+1),y1=Math.min(h-1,y0+1),fx=x-x0,fy=y-y0;return (data[(y0*w+x0)*4+c]*(1-fx)+data[(y0*w+x1)*4+c]*fx)*(1-fy)+(data[(y1*w+x0)*4+c]*(1-fx)+data[(y1*w+x1)*4+c]*fx)*fy;}
export function correctOptics(source,w,h,s){
 if(!s.distortion&&!s.chromaticRed&&!s.chromaticBlue&&!s.defringe)return source;
 const out=new Uint8ClampedArray(source.length),k=s.distortion/100*.32;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,nx=(x+.5)/w*2-1,ny=(y+.5)/h*2-1,r2=(nx*nx+ny*ny)/2,f=1+k*r2;
  for(let c=0;c<4;c++){const ca=c===0?s.chromaticRed/100*.012:c===2?s.chromaticBlue/100*.012:0,scale=f+ca*r2;out[i+c]=sampleChannel(source,w,h,(nx*scale+1)*w/2-.5,(ny*scale+1)*h/2-.5,c);}
  if(s.defringe){const r=out[i],g=out[i+1],b=out[i+2],purple=Math.max(0,Math.min(r,b)-g-12),green=Math.max(0,g-Math.max(r,b)-12),centerL=.2126*r+.7152*g+.0722*b,neighborL=(xx,yy)=>.2126*sampleChannel(source,w,h,xx,yy,0)+.7152*sampleChannel(source,w,h,xx,yy,1)+.0722*sampleChannel(source,w,h,xx,yy,2),edge=Math.max(Math.abs(centerL-neighborL(x-1,y)),Math.abs(centerL-neighborL(x+1,y)),Math.abs(centerL-neighborL(x,y-1)),Math.abs(centerL-neighborL(x,y+1))),amount=s.defringe/100*clamp(edge/30);out[i]=r-purple*amount*.6+green*amount*.4;out[i+1]=g+purple*amount*.5-green*amount*.7;out[i+2]=b-purple*amount*.6+green*amount*.4;}
 }return out;
}
const distanceToSegment=(px,py,ax,ay,bx,by)=>{const dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy,t=length?clamp(((px-ax)*dx+(py-ay)*dy)/length):0;return Math.hypot(px-ax-t*dx,py-ay-t*dy);};
export function maskAlpha(mask,w,h){
 const out=new Float32Array(w*h);if(mask.enabled===false)return out;
 if(mask.type==='brush'){
  for(const stroke of mask.strokes){const points=stroke.points,r=stroke.radius*Math.min(w,h),inner=r*(1-stroke.feather),coverage=stroke.erase?new Float32Array(w*h):out;for(let n=0;n<points.length;n++){const a=points[Math.max(0,n-1)],b=points[n],ax=a.x*(w-1),ay=a.y*(h-1),bx=b.x*(w-1),by=b.y*(h-1);const x0=Math.max(0,Math.floor(Math.min(ax,bx)-r)),x1=Math.min(w-1,Math.ceil(Math.max(ax,bx)+r)),y0=Math.max(0,Math.floor(Math.min(ay,by)-r)),y1=Math.min(h-1,Math.ceil(Math.max(ay,by)+r));for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const d=distanceToSegment(x,y,ax,ay,bx,by),weight=d<=inner?1:1-smooth((d-inner)/Math.max(.001,r-inner)),i=y*w+x;coverage[i]=Math.max(coverage[i],weight);}}if(stroke.erase)for(let i=0;i<out.length;i++)out[i]*=1-coverage[i];}
 }else for(let y=0;y<h;y++)for(let x=0;x<w;x++){const nx=(x+.5)/w,ny=(y+.5)/h;let weight;
  if(mask.type==='linear'){const dx=(mask.end.x-mask.start.x)*w,dy=(mask.end.y-mask.start.y)*h,length=dx*dx+dy*dy,t=length<1e-8?0:((nx-mask.start.x)*w*dx+(ny-mask.start.y)*h*dy)/length,feather=mask.feather??.7;weight=length<1e-8?0:feather===0?(t>=.5?1:0):smooth((t-.5)/feather+.5);}
  else{const cx=(mask.start.x+mask.end.x)/2,cy=(mask.start.y+mask.end.y)/2,rx=Math.max(.002,Math.abs(mask.end.x-mask.start.x)/2),ry=Math.max(.002,Math.abs(mask.end.y-mask.start.y)/2),r=Math.hypot((nx-cx)/rx,(ny-cy)/ry),inner=1-mask.feather;weight=r<=inner?1:1-smooth((r-inner)/Math.max(.001,1-inner));}
  out[y*w+x]=weight;
 }
 for(let i=0;i<out.length;i++)out[i]=(mask.inverted?1-out[i]:out[i])*mask.opacity;
 return out;
}
export function applyMasks(data,w,h,masks){
 for(const mask of masks){if(!mask.enabled||!Object.values(mask.adjustments).some(Boolean))continue;const alpha=maskAlpha(mask,w,h),s=mask.adjustments;
  for(let p=0;p<alpha.length;p++){const a=alpha[p];if(!a)continue;const i=p*4;let r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255;const lum=.2126*r+.7152*g+.0722*b,stops=s.exposure+s.shadows/100*(1-lum)**3+s.highlights/100*lum**2,gain=2**stops;r=encoded(linear(r)*gain*2**(s.temperature/100*.35));g=encoded(linear(g)*gain);b=encoded(linear(b)*gain*2**(-s.temperature/100*.35));const contrast=2**(s.contrast/100);r=(r-.5)*contrast+.5;g=(g-.5)*contrast+.5;b=(b-.5)*contrast+.5;const l=.2126*r+.7152*g+.0722*b,sat=1+s.saturation/100;r=l+(r-l)*sat;g=l+(g-l)*sat;b=l+(b-l)*sat;data[i]+=a*(clamp(r)*255-data[i]);data[i+1]+=a*(clamp(g)*255-data[i+1]);data[i+2]+=a*(clamp(b)*255-data[i+2]);}
 }
}
export function retouch(source,w,h,strokes){
 if(!strokes.length)return source;const result=source.slice();
 for(const stroke of strokes){const first=stroke.points[0],dx=(stroke.source.x-first.x)*(w-1),dy=(stroke.source.y-first.y)*(h-1),r=stroke.radius*Math.min(w,h),inner=r*(1-stroke.feather),coverage=maskAlpha({type:'brush',enabled:true,inverted:false,opacity:stroke.opacity,strokes:[stroke]},w,h);
  let correction=[0,0,0];if(stroke.mode==='heal'){let count=0;const target=[0,0,0],origin=[0,0,0];const cx=first.x*(w-1),cy=first.y*(h-1),step=Math.max(1,Math.round(r/5));for(let yy=-r;yy<=r;yy+=step)for(let xx=-r;xx<=r;xx+=step)if(xx*xx+yy*yy<r*r){count++;for(let c=0;c<3;c++){target[c]+=sampleChannel(result,w,h,cx+xx,cy+yy,c);origin[c]+=sampleChannel(source,w,h,cx+dx+xx,cy+dy+yy,c);}}if(count)correction=target.map((v,c)=>(v-origin[c])/count);}
  for(let p=0;p<coverage.length;p++){const a=coverage[p];if(!a)continue;const x=p%w,y=Math.floor(p/w),i=p*4;for(let c=0;c<3;c++){const value=clamp(sampleChannel(source,w,h,x+dx,y+dy,c)+correction[c],0,255);result[i+c]+=(value-result[i+c])*a;}}
 }return result;
}
export function reduceNoise(source,w,h,lumaAmount,colorAmount){
 if(!lumaAmount&&!colorAmount)return source;const out=source.slice(),range=12+lumaAmount*.35;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(!source[i+3])continue;const r=source[i],g=source[i+1],b=source[i+2],l=.2126*r+.7152*g+.0722*b;let weight=0,sl=0,cr=0,cb=0;
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=clamp(x+dx,0,w-1),yy=clamp(y+dy,0,h-1),j=(yy*w+xx)*4;if(!source[j+3])continue;const nl=.2126*source[j]+.7152*source[j+1]+.0722*source[j+2],d=nl-l,ww=Math.exp(-(dx*dx+dy*dy)/5-d*d/(2*range*range));weight+=ww;sl+=nl*ww;cr+=(source[j]-nl)*ww;cb+=(source[j+2]-nl)*ww;}
  if(!weight)continue;const nl=l+(sl/weight-l)*lumaAmount/100,nr=(r-l)+(cr/weight-(r-l))*colorAmount/100,nb=(b-l)+(cb/weight-(b-l))*colorAmount/100;out[i]=nl+nr;out[i+2]=nl+nb;out[i+1]=(nl-.2126*out[i]-.0722*out[i+2])/.7152;
 }return out;
}
function boxBlur(input,w,h,radius){const temp=new Float32Array(input.length),out=new Float32Array(input.length),r=Math.max(1,Math.round(radius));for(let y=0;y<h;y++){let sum=0;for(let x=-r;x<=r;x++)sum+=input[y*w+clamp(x,0,w-1)];for(let x=0;x<w;x++){temp[y*w+x]=sum/(r*2+1);sum+=input[y*w+clamp(x+r+1,0,w-1)]-input[y*w+clamp(x-r,0,w-1)];}}for(let x=0;x<w;x++){let sum=0;for(let y=-r;y<=r;y++)sum+=temp[clamp(y,0,h-1)*w+x];for(let y=0;y<h;y++){out[y*w+x]=sum/(r*2+1);sum+=temp[clamp(y+r+1,0,h-1)*w+x]-temp[clamp(y-r,0,h-1)*w+x];}}return out;}
export function finishPixels(data,w,h,s){
 if(s.texture||s.clarity||s.sharpness){const luma=new Float32Array(w*h);for(let p=0;p<luma.length;p++)luma[p]=.2126*data[p*4]+.7152*data[p*4+1]+.0722*data[p*4+2];const fine=boxBlur(luma,w,h,Math.max(1,Math.max(w,h)/1600)),broad=s.clarity?boxBlur(luma,w,h,Math.max(2,Math.max(w,h)*.012)):null;for(let p=0;p<luma.length;p++){const d=(luma[p]-fine[p])*(s.texture/100*1.1+s.sharpness/100*.8)+(broad?(luma[p]-broad[p])*s.clarity/100*.9:0);for(let c=0;c<3;c++)data[p*4+c]+=d;}}
 if(s.grain){const cell=Math.max(.5,(.4+s.grainSize/30)*Math.max(w,h)/1600),rough=s.grainRoughness/100,hash=(x,y)=>{let n=Math.imul(x^0x9e3779b9,y^0x85ebca6b);n=Math.imul(n^(n>>>16),0x7feb352d);return ((n^(n>>>15))>>>0)/4294967295-.5;};for(let y=0;y<h;y++)for(let x=0;x<w;x++){const n=hash(Math.floor(x/cell),Math.floor(y/cell))*(1-rough*.4)+hash(x,y)*rough*.4,i=(y*w+x)*4,l=(data[i]+data[i+1]+data[i+2])/765,amount=s.grain/100*45*(.45+.55*Math.sin(Math.PI*l));for(let c=0;c<3;c++)data[i+c]+=n*amount;}}
}
export function clippingStats(data){let shadows=0,highlights=0,total=0;for(let i=0;i<data.length;i+=4){if(!data[i+3])continue;total++;if(Math.max(data[i],data[i+1],data[i+2])<=1)shadows++;if(Math.max(data[i],data[i+1],data[i+2])>=254)highlights++;}return {shadows,highlights,total};}
