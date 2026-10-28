"""Build an ad-hoc-signed local Mac app, preserving the previous bundle."""
from pathlib import Path
from datetime import datetime
import argparse, json, plistlib, shutil, subprocess
parser=argparse.ArgumentParser()
parser.add_argument('--replace',action='store_true',help='Preserve existing app in dist/previous and replace it after the new build passes signing.')
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
runtime=root/'dist/runtime/Electron.app'
output=root/'dist/Lumen Studio.app'
staging=root/'dist/.Lumen Studio-build.app'
version=json.loads((root/'package.json').read_text())['version']
if not runtime.is_dir():raise SystemExit('Extract the cached Electron runtime into dist/runtime first.')
if output.exists() and not args.replace:raise SystemExit('Output exists. Use --replace to keep a rollback copy and update it.')
if staging.exists():raise SystemExit('A staging build already exists; inspect it before building again.')
subprocess.run(['/usr/bin/ditto',str(runtime),str(staging)],check=True)
contents=staging/'Contents'
info=plistlib.loads((contents/'Info.plist').read_bytes())
old=info['CFBundleExecutable'];(contents/'MacOS'/old).rename(contents/'MacOS/Lumen Studio')
info.update(CFBundleExecutable='Lumen Studio',CFBundleName='Lumen Studio',CFBundleDisplayName='Lumen Studio',CFBundleIdentifier='local.lumenstudio.desktop',CFBundleShortVersionString=version,CFBundleVersion=version,LSApplicationCategoryType='public.app-category.photography')
(contents/'Info.plist').write_bytes(plistlib.dumps(info))
appdir=contents/'Resources/app';appdir.mkdir(parents=True,exist_ok=True)
for name in ['src','assets','desktop','docs']:shutil.copytree(root/name,appdir/name)
for name in ['index.html','style.css','guide.html','README.md']:shutil.copy2(root/name,appdir/name)
(appdir/'package.json').write_text(json.dumps({'name':'lumen-studio','version':version,'main':'desktop/main.cjs'}))
subprocess.run(['/usr/bin/codesign','--force','--deep','--sign','-',str(staging)],check=True)
subprocess.run(['/usr/bin/codesign','--verify','--deep','--strict',str(staging)],check=True)
if output.exists():
 previous=root/'dist/previous';previous.mkdir(exist_ok=True)
 old_info=plistlib.loads((output/'Contents/Info.plist').read_bytes())
 backup=previous/('Lumen Studio-'+old_info.get('CFBundleShortVersionString','old')+'-'+datetime.now().strftime('%Y%m%d-%H%M%S')+'.app')
 output.rename(backup)
 print('Previous build preserved:',backup)
staging.rename(output)
print('Built:',output)
