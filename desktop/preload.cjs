const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('lumenDesktop',{
 platform:process.platform,
 openPhotos:()=>ipcRenderer.invoke('lumen:open'),
 saveFile:(name,bytes)=>ipcRenderer.invoke('lumen:save',{name,bytes}),
 onAction:callback=>{const handler=(_event,action)=>callback(action);ipcRenderer.on('lumen:action',handler);return ()=>ipcRenderer.removeListener('lumen:action',handler);}
});
