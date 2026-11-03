const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.setDefaultTimeout(90000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const root=path.dirname(path.dirname(require.resolve('three'))),out=path.join(__dirname,'../docs/verification/current');
 await page.route('https://cdn.jsdelivr.net/npm/three@0.169.0/**',r=>r.fulfill({path:path.join(root,r.request().url().split('three@0.169.0/')[1]),contentType:'text/javascript'}));
 await page.goto((process.env.TEST_URL||'http://127.0.0.1:8008/')+'?test');await page.waitForFunction(()=>window.__church?.advance);
 await page.click('[data-space="community"]');
 const hall=await page.evaluate(()=>{const w=__church.world,n=o=>o.userData.name||o.name;return {...w.diningHall,tables:w.meshes.filter(o=>/^03_Dining_[0-2]_\d+_Top$/.test(n(o))).length,removed:!w.original.get('Upper_Setback_Glass').parent,fourth:w.meshes.filter(o=>/^03_Dining_3_/.test(n(o))).length}});
 assert.equal(hall.tableRows,3);assert.equal(hall.tables,9);assert(hall.removed);assert.equal(hall.fourth,0);
 await page.evaluate(()=>{const c=__church;c.thirdPerson.position.set(1.5,9.6,1);c.thirdPerson.avatar.position.copy(c.thirdPerson.position);c.thirdPerson.follow.pose.yaw=0;c.thirdPerson.follow.pose.pitch=.28;c.advance(0)});
 await page.keyboard.down('w');const walk=await page.evaluate(()=>{const c=__church,p=c.thirdPerson.position;let n=0;while(p.z>-8.3&&n++<1000)c.advance(1/60,false);c.advance(0);return {position:p.toArray(),steps:n}});await page.keyboard.up('w');assert(walk.position[2]<-8.1,JSON.stringify(walk));
 await page.evaluate(()=>{const c=__church;c.thirdPerson.position.set(1.5,9.6,2);c.thirdPerson.avatar.position.copy(c.thirdPerson.position);c.thirdPerson.follow.pose.yaw=0;c.thirdPerson.follow.pose.pitch=.42;c.thirdPerson.follow.pose.distance=9;c.renderer.setPixelRatio(.8);c.advance(0)});
 await page.screenshot({path:path.join(out,'dining-hall-three-rows.png')});assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'dining-hall-results.json'),JSON.stringify({hall,walkedAcrossFormerGlassLine:true,walk,errors},null,2));console.log(JSON.stringify({hall,walkedAcrossFormerGlassLine:true,errors}));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
