const {app,BrowserWindow,Menu,dialog,ipcMain,protocol,net,shell}=require('electron');
const {readFile,writeFile,stat}=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
protocol.registerSchemesAsPrivileged([{scheme:'lumen',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
app.setName('Lumen Studio');
let mainWindow;
const send=action=>mainWindow?.webContents.send('lumen:action',action);
const allowed=event=>{if(event.sender!==mainWindow?.webContents||event.senderFrame!==mainWindow.webContents.mainFrame||!event.senderFrame.url.startsWith('lumen://app/'))throw Error('Untrusted caller');};
async function openPhotos(){
 const result=await dialog.showOpenDialog(mainWindow,{title:'Open photographs',properties:['openFile','multiSelections'],filters:[{name:'Photographs',extensions:['jpg','jpeg','png','webp']}]});
 if(result.canceled)return [];
 const files=[];for(const file of result.filePaths){const meta=await stat(file);if(meta.size>60*1024*1024)throw Error('A selected photo exceeds60MB.');const bytes=await readFile(file);const ext=path.extname(file).toLowerCase();files.push({name:path.basename(file),type:ext==='.png'?'image/png':ext==='.webp'?'image/webp':'image/jpeg',bytes});}return files;
}
async function createWindow(){
 mainWindow=new BrowserWindow({width:1500,height:980,minWidth:1000,minHeight:700,title:'Lumen Studio',backgroundColor:'#131516',titleBarStyle:'hiddenInset',trafficLightPosition:{x:18,y:18},webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false}});
 mainWindow.on('closed',()=>{mainWindow=null;});
 mainWindow.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('lumen://app/guide.html')||url.startsWith('lumen://app/docs/evidence.html')){const help=new BrowserWindow({width:1100,height:850,title:'Lumen Studio Guide',webPreferences:{sandbox:true,nodeIntegration:false,contextIsolation:true}});help.loadURL(url);help.webContents.setWindowOpenHandler(()=>({action:'deny'}));}return {action:'deny'};});
 mainWindow.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith('lumen://app/'))event.preventDefault();});
 await mainWindow.loadURL('lumen://app/index.html');
}
app.whenReady().then(async()=>{
 protocol.handle('lumen',request=>{const url=new URL(request.url);if(url.hostname!=='app')return new Response('Not found',{status:404});const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)||file.includes(path.sep+'desktop'+path.sep))return new Response('Not found',{status:404});return net.fetch(pathToFileURL(file).href);});
 ipcMain.handle('lumen:open',async event=>{allowed(event);return openPhotos();});
 ipcMain.handle('lumen:save',async(event,payload)=>{allowed(event);if(!payload||typeof payload.name!=='string'||!(payload.bytes instanceof Uint8Array)||payload.bytes.length>300*1024*1024)throw Error('Invalid export');const result=await dialog.showSaveDialog(mainWindow,{title:'Save edited photograph',defaultPath:path.basename(payload.name),createDirectory:true});if(result.canceled)return {canceled:true};await writeFile(result.filePath,payload.bytes);return {canceled:false,name:path.basename(result.filePath)};});
 const command=(label,accelerator,action)=>({label,accelerator,click:()=>send(action)});
 Menu.setApplicationMenu(Menu.buildFromTemplate([
 {label:'Lumen Studio',submenu:[{role:'about'},{type:'separator'},{role:'services'},{type:'separator'},{role:'hide'},{role:'hideOthers'},{role:'unhide'},{type:'separator'},{role:'quit'}]},
 {label:'File',submenu:[command('Open Photos…','CmdOrCtrl+O','import'),command('Export Photo…','CmdOrCtrl+Shift+E','export'),{type:'separator'},command('Save Edit Recipe…','CmdOrCtrl+Shift+S','recipe'),{type:'separator'},{role:'close'}]},
 {label:'Edit',submenu:[command('Undo','CmdOrCtrl+Z','undo'),command('Redo','CmdOrCtrl+Shift+Z','redo'),{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}, {type:'separator'},command('Reset Adjustments',undefined,'reset')]},
 {label:'View',submenu:[command('Show Original','CmdOrCtrl+Shift+B','compare'),command('Crop',undefined,'crop'),{type:'separator'},{role:'togglefullscreen'},{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'}]},
 {label:'Develop',submenu:[command('Point Curve',undefined,'panel:curvePanel'),command('Color Mixer',undefined,'panel:mixerPanel'),command('Masks','CmdOrCtrl+Shift+M','masks'),command('Remove · Clone / Heal','CmdOrCtrl+Shift+R','retouch'),{type:'separator'},command('Texture & Atmosphere',undefined,'panel:atmospherePanel'),command('Noise Reduction',undefined,'panel:noisePanel'),command('Optics',undefined,'panel:opticsPanel'),command('Film Grain',undefined,'panel:grainPanel'),{type:'separator'},command('Show Clipping',undefined,'clipping')]},
 {role:'windowMenu'}, {label:'Help',submenu:[command('How Lumen Works',undefined,'guide'),command('Keyboard Shortcuts',undefined,'shortcuts')]}
 ]));
 await createWindow();app.on('activate',()=>{if(!mainWindow)createWindow();});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
