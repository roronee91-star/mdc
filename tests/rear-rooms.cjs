const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const root=path.dirname(path.dirname(require.resolve('three'))),out=path.join(__dirname,'../docs/verification/current');await page.route('https://cdn.jsdelivr.net/npm/three@0.169.0/**',r=>r.fulfill({path:path.join(root,r.request().url().split('three@0.169.0/')[1]),contentType:'text/javascript'}));
await page.goto((process.env.TEST_URL||'http://127.0.0.1:8007/')+'?test');await page.waitForFunction(()=>window.__church?.advance);
await page.click('[data-space="sanctuary"]');
async function go(x,z){await page.evaluate(({x,z})=>{const c=__church,p=c.thirdPerson.position;c.thirdPerson.follow.pose.yaw=Math.atan2(-(x-p.x),-(z-p.z))},{x,z});await page.keyboard.down('w');const result=await page.evaluate(({x,z})=>{const c=__church,p=c.thirdPerson.position;let n=0;while(Math.hypot(x-p.x,z-p.z)>.025&&n++<1600){const before=p.clone();c.advance(Math.min(1/60,Math.hypot(x-p.x,z-p.z)/2.2),false);if(before.distanceTo(p)<1e-7)break}c.advance(0);return {target:[x,z],position:[p.x,p.z],remaining:Math.hypot(x-p.x,z-p.z),y:p.y}},{x,z});await page.keyboard.up('w');assert(result.remaining<.25,JSON.stringify(result));return result}
await go(-7.18,-5.08);await go(-1,-2);await go(3,1.5);await go(4.4,1.4);await go(8.1,1.4);await go(8.35,6.9);await go(3.8,6.9);await go(2.1,6.9);await go(2.1,9.3);await go(.9,9.3);
const roomView=async(name,yaw)=>{await page.evaluate(yaw=>{const c=__church;c.thirdPerson.follow.pose.yaw=yaw;c.thirdPerson.follow.pose.pitch=.24;c.advance(0)},yaw);await page.screenshot({path:path.join(out,name+'.png')})};
await roomView('engineer-room',0);
await page.evaluate(()=>{__church.thirdPerson.follow.pose.yaw=0});await page.keyboard.down('d');await page.evaluate(()=>__church.advance(2));await page.keyboard.up('d');assert(await page.evaluate(()=>__church.thirdPerson.position.x<2.85));
await page.evaluate(()=>{const c=__church;c.thirdPerson.position.set(.9,-9.4,9.3);c.thirdPerson.avatar.position.copy(c.thirdPerson.position);c.advance(0)});
await go(2.1,8.3);await go(2.1,6.9);await go(-5,6.9);await go(-5,8.8);await go(-8.5,8.8);await roomView('mother-room',0);
// The viewing glass must block walking; the actual framed doorway must allow it.
await page.keyboard.down('w');await page.evaluate(()=>__church.advance(2));await page.keyboard.up('w');assert(await page.evaluate(()=>__church.thirdPerson.position.z>7.6));
await go(-8.5,8.8);await go(-5,8.8);await go(-5,6.9);await go(3.8,6.9);await go(8.35,6.9);await go(8.35,1.4);await go(9.2,2.5);await go(9.2,6.265);
await page.evaluate(()=>{const c=__church;c.thirdPerson.position.set(-2,-9.4,3);c.thirdPerson.avatar.position.copy(c.thirdPerson.position);c.thirdPerson.follow.pose.distance=7.5;c.renderer.setPixelRatio(.8)});await roomView('rear-rooms-overview',Math.PI);
const rooms=await page.evaluate(()=>__church.world.rearRooms);assert.equal(rooms.length,2);assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'rear-rooms-results.json'),JSON.stringify({rooms,enteredBoth:true,exitedBoth:true,glassBlocks:true,sideWallBlocks:true,liftRouteClear:true,errors},null,2));console.log(JSON.stringify({enteredBoth:true,exitedBoth:true,glassBlocks:true,sideWallBlocks:true,liftRouteClear:true,errors}));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
