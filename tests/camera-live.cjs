const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1100,height:800}}),errors=[],results=[];page.setDefaultTimeout(90000);page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE',e.message)});page.on('console',m=>{console.log('CONSOLE',m.text())});
 const root=path.dirname(path.dirname(require.resolve('three'))),out=path.join(__dirname,'../docs/verification/current');
 await page.route('https://cdn.jsdelivr.net/npm/three@0.169.0/**',r=>r.fulfill({path:path.join(root,r.request().url().split('three@0.169.0/')[1]),contentType:'text/javascript'}));
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:8001/');await page.waitForFunction(()=>window.__church);console.log('loaded');
 await page.click('[data-space="education"]');
 const before=await page.evaluate(()=>__church.thirdPerson.position.toArray());
 await page.keyboard.down('w');await page.waitForTimeout(2000);await page.keyboard.up('w');await page.waitForTimeout(1000);
 const after=await page.evaluate(()=>__church.thirdPerson.position.toArray());assert(Math.hypot(after[0]-before[0],after[2]-before[2])>.05);results.push('Real-time WASD moves avatar');
 async function check(){return page.evaluate(async()=>{const T=await import('three'),c=__church.camera,a=__church.thirdPerson.avatar;c.updateMatrixWorld();a.updateMatrixWorld(true);const b=new T.Box3().setFromObject(a);let framed=true;for(const x of[b.min.x,b.max.x])for(const y of[b.min.y,b.max.y])for(const z of[b.min.z,b.max.z]){const p=new T.Vector3(x,y,z).project(c);if(Math.abs(p.x)>.98||Math.abs(p.y)>.98||Math.abs(p.z)>1)framed=false}return {framed,distance:c.position.distanceTo(a.position),fade:__church.thirdPerson.faded.size,yaw:__church.thirdPerson.yaw,zoom:__church.thirdPerson.distance}})}
 let c=await check();assert(c.framed&&c.distance<12);results.push({test:'Live follow camera / full body',...c});
 await page.mouse.move(400,350);await page.mouse.down();await page.mouse.move(520,400,{steps:5});await page.mouse.up();await page.mouse.wheel(0,-400);await page.waitForTimeout(1000);let d=await check();assert(d.framed&&Math.abs(d.yaw-c.yaw)>.1&&d.zoom<c.zoom);results.push({test:'Live drag rotation / zoom',...d});
 await page.screenshot({path:path.join(out,'camera-live-desktop.png')});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1000);d=await check();assert(d.framed);results.push({test:'Live portrait framing',...d});await page.screenshot({path:path.join(out,'camera-live-portrait.png')});
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>__church.thirdPerson.faded.size),0);assert.deepEqual(errors,[]);results.push('Esc restores original materials; no page errors');fs.writeFileSync(path.join(out,'camera-live-results.json'),JSON.stringify({results,errors},null,2));console.log(JSON.stringify({passed:results.length}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
