import {advancedDefaults,normalizeAdvanced,correctOptics,retouch,reduceNoise,applyAdvancedColor,applyMasks,finishPixels} from './advanced-engine.js';
// Original, deliberately readable algorithms. No Adobe code or color profiles.
const BASE_DEFAULTS=Object.freeze({exposure:0,contrast:0,highlights:0,shadows:0,whites:0,blacks:0,temperature:0,tint:0,vibrance:0,saturation:0,sharpness:0,vignette:0,rotation:0,crop:null});
const deepFreeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(deepFreeze);Object.freeze(v);}return v;};
export const DEFAULTS=deepFreeze({...BASE_DEFAULTS,...advancedDefaults()});
export const PRESETS=[
 {name:'Original',tag:'A clean starting point',values:{}},
 {name:'Golden hour',tag:'Warm light · soft contrast',values:{temperature:22,tint:4,exposure:.15,highlights:-22,shadows:12,vibrance:15}},
 {name:'Alpine',tag:'Cool shadows · crisp color',values:{temperature:-12,contrast:15,highlights:-20,shadows:16,vibrance:22,sharpness:15}},
 {name:'Silver print',tag:'Monochrome · deep blacks',values:{saturation:-100,contrast:23,shadows:10,blacks:-12,vignette:15}},
 {name:'Quiet film',tag:'Muted color · lifted shadows',values:{contrast:-14,saturation:-18,temperature:9,blacks:16,highlights:-15,vignette:8}}
];
export const clamp=(v,min=0,max=1)=>Math.min(max,Math.max(min,v));
export function normalizeSettings(input={}){
 const s={...BASE_DEFAULTS,...normalizeAdvanced(input)};
 for(const k of Object.keys(BASE_DEFAULTS))if(k!=='crop'&&k!=='rotation'){const n=Number(input[k]??0);if(!Number.isFinite(n))throw Error('Invalid '+k);s[k]=clamp(n,k==='exposure'?-4:(k==='sharpness'||k==='vignette'?0:-100),k==='exposure'?4:100);}
 const rotation=Number(input.rotation??0);if(!Number.isFinite(rotation))throw Error('Invalid rotation');
 s.rotation=((Math.round(rotation/90)*90)%360+360)%360;
 if(input.crop){const c=input.crop;if(!['x','y','w','h'].every(k=>Number.isFinite(c[k]))||c.w<=0||c.h<=0||c.x<0||c.y<0||c.x+c.w>1.000001||c.y+c.h>1.000001)throw Error('Invalid crop');s.crop={x:c.x,y:c.y,w:c.w,h:c.h};}
 return s;
}
export const toLinear=v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);
export const toSRGB=v=>v<=.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-.055;
const lut=Float32Array.from({length:256},(_,i)=>toLinear(i/255));
export function processPixels(source,width,height,settings){
 const s=normalizeSettings(settings);
 source=correctOptics(source,width,height,s);
 source=retouch(source,width,height,s.retouches);
 source=reduceNoise(source,width,height,s.noiseReduction,s.colorNoiseReduction);
 const out=new Uint8ClampedArray(source.length);
 const exposure=Math.pow(2,s.exposure),contrast=Math.pow(2,s.contrast/100);
 const warm=s.temperature/100,tint=s.tint/100;
 const gains=[Math.pow(2,warm*.35+tint*.12),Math.pow(2,-tint*.24),Math.pow(2,-warm*.35+tint*.12)];
 for(let i=0;i<source.length;i+=4){
  let r=lut[source[i]]*exposure*gains[0],g=lut[source[i+1]]*exposure*gains[1],b=lut[source[i+2]]*exposure*gains[2];
  const lum=.2126*r+.7152*g+.0722*b,L=clamp(lum);
  const shadow=Math.pow(1-L,3),highlight=Math.pow(L,2);
  const stops=s.shadows/100*shadow*1.25+s.highlights/100*highlight+s.blacks/100*Math.pow(1-L,8)*1.5+s.whites/100*Math.pow(L,6);
  const gain=Math.pow(2,stops);r=toSRGB(Math.max(0,r*gain));g=toSRGB(Math.max(0,g*gain));b=toSRGB(Math.max(0,b*gain));
  r=(r-.5)*contrast+.5;g=(g-.5)*contrast+.5;b=(b-.5)*contrast+.5;
  const y=.2126*r+.7152*g+.0722*b,chroma=Math.max(r,g,b)-Math.min(r,g,b);
  const saturation=Math.max(0,(1+s.saturation/100)*(1+s.vibrance/100*(1-clamp(chroma))));
  r=y+(r-y)*saturation;g=y+(g-y)*saturation;b=y+(b-y)*saturation;
  const pixel=i/4,x=(pixel%width+.5)/width*2-1,yy=(Math.floor(pixel/width)+.5)/height*2-1;
  const v=1-s.vignette/100*.8*clamp((x*x+yy*yy)/2);
  out[i]=clamp(r*v)*255;out[i+1]=clamp(g*v)*255;out[i+2]=clamp(b*v)*255;out[i+3]=source[i+3];
 }
 applyAdvancedColor(out,s);
 applyMasks(out,width,height,s.masks);
 finishPixels(out,width,height,s);
 return out;
}
export function histogram(data){const bins=[new Uint32Array(256),new Uint32Array(256),new Uint32Array(256)];for(let i=0;i<data.length;i+=4)if(data[i+3])for(let c=0;c<3;c++)bins[c][data[i+c]]++;return bins;}
export function cropPixels(w,h,crop){const c=crop||{x:0,y:0,w:1,h:1};const x=Math.min(w-1,Math.round(c.x*w)),y=Math.min(h-1,Math.round(c.y*h));return {x,y,w:Math.max(1,Math.min(w-x,Math.round(c.w*w))),h:Math.max(1,Math.min(h-y,Math.round(c.h*h)))};}
export function centeredCrop(width,height,ratio){if(!ratio)return null;const current=width/height;return current>ratio?{x:(1-ratio/current)/2,y:0,w:ratio/current,h:1}:{x:0,y:(1-current/ratio)/2,w:1,h:current/ratio};}
