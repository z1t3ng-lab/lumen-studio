const {_electron:electron}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,writeFile} from 'node:fs/promises';
const profile=await mkdtemp('/private/tmp/lumen-audit-');
const source=process.env.AUDIT_TARGET==='source';
const executablePath=process.cwd()+(source?'/dist/runtime/Electron.app/Contents/MacOS/Electron':'/dist/Lumen Studio.app/Contents/MacOS/Lumen Studio');
const app=await electron.launch({executablePath,args:[...(source?[process.cwd()+'/desktop/main.cjs']:[]),'--user-data-dir='+profile]});
const report={date:new Date().toISOString(),profile,checks:[]};
try{
 const page=await app.firstWindow();await page.waitForFunction(()=>document.body.getAttribute('aria-busy')==='false');
 const guide=app.waitForEvent('window');await page.locator('#guideBtn').click();await guide;
 await app.evaluate(async({BrowserWindow})=>{const w=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().endsWith('/index.html'));await new Promise(resolve=>{w.once('closed',resolve);w.close();});});
 const nextEditor=app.waitForEvent('window');
 await app.evaluate(({app})=>app.emit('activate'));
 const reopened=await nextEditor;
 await app.evaluate(async({BrowserWindow})=>{for(let i=0;i<100;i++){if(BrowserWindow.getAllWindows().some(w=>w.webContents.getURL().endsWith('/index.html')))return;await new Promise(r=>setTimeout(r,20));}});
 assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().filter(w=>w.webContents.getURL().endsWith('/index.html')).length),1);
 report.checks.push('Dock activation recreates editor while Guide remains open');
 await reopened.waitForFunction(()=>document.body.getAttribute('aria-busy')==='false');
 await app.evaluate(({Menu})=>Menu.getApplicationMenu().items.find(i=>i.label==='Help').submenu.items.find(i=>i.label==='Keyboard Shortcuts').click());
 await reopened.locator('#helpDialog').waitFor({state:'visible'});
 report.checks.push('Native menu targets the recreated editor');report.status='pass';console.log(report.checks);
}catch(error){report.status='fail';report.failure=error.message;console.error(error);process.exitCode=1;}
finally{await mkdir('docs/debug-validation',{recursive:true});await writeFile('docs/debug-validation/desktop-'+(process.env.AUDIT_PHASE||'after')+'.json',JSON.stringify(report,null,2));await app.close();}
