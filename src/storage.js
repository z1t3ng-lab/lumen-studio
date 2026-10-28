let dbPromise;
const open=()=>dbPromise??=new Promise((resolve,reject)=>{const r=indexedDB.open('lumen-studio',1);r.onupgradeneeded=()=>r.result.createObjectStore('photos',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
async function transaction(mode,fn){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('photos',mode);const request=fn(tx.objectStore('photos'));tx.oncomplete=()=>resolve(request.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Storage transaction aborted'));});}
export const listPhotos=()=>transaction('readonly',store=>store.getAll());
export const savePhoto=p=>transaction('readwrite',store=>store.put({id:p.id,name:p.name,blob:p.blob,width:p.width,height:p.height,settings:p.settings,rating:p.rating||0,history:p.history,historyIndex:p.historyIndex}));
export const deletePhoto=id=>transaction('readwrite',store=>store.delete(id));
