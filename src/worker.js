import {processPixels} from './engine.js';
self.onmessage=({data:m})=>{try{const pixels=processPixels(new Uint8ClampedArray(m.buffer),m.width,m.height,m.settings);self.postMessage({id:m.id,width:m.width,height:m.height,buffer:pixels.buffer},[pixels.buffer]);}catch(error){self.postMessage({id:m.id,error:error.message});}};
