const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const root=path.dirname(path.dirname(require.resolve('three'))),out=path.join(__dirname,'../docs/verification/current');await page.route('https://cdn.jsdelivr.net/npm/three@0.169.0/**',r=>r.fulfill({path:path.join(root,r.request().url().split('three@0.169.0/')[1]),contentType:'text/javascript'}));
await page.goto((process.env.TEST_URL||'http://127.0.0.1:8005/')+'?test');await page.waitForFunction(()=>window.__church?.advance);
const roof=await page.evaluate(async()=>{const T=await import('three'),w=__church.world,o=w.original.get('ROOF_Setback'),b=new T.Box3().setFromObject(o);return {min:b.min.toArray(),max:b.max.toArray(),rotation:o.quaternion.toArray(),environment:[...w.original.keys()].filter(n=>n.startsWith('ENV_')).length}});
assert(Math.abs(roof.min[1]-15.8)<.00001);assert(Math.abs(roof.max[1]-16)<.00001);assert.deepEqual(roof.rotation,[0,0,0,1]);assert(roof.environment>400);
await page.screenshot({path:path.join(out,'roof-fixed-exterior.png')});await page.click('[data-space="sanctuary"]');
await page.evaluate(()=>{const c=__church;c.thirdPerson.position.set(-4,-9.4,-3);c.thirdPerson.avatar.position.copy(c.thirdPerson.position);c.thirdPerson.follow.pose.yaw=.95;c.thirdPerson.follow.pose.pitch=.3;c.advance(0)});
await page.screenshot({path:path.join(out,'roof-fixed-sanctuary.png')});
const clear=await page.evaluate(async()=>{const T=await import('three'),ray=new T.Raycaster();ray.layers.enableAll();ray.set(new T.Vector3(0,-9.3,-6),new T.Vector3(0,1,0));ray.far=5.8;return ray.intersectObject(__church.world.original.get('ROOF_Setback')).length===0});assert(clear);assert.deepEqual(errors,[]);
fs.writeFileSync(path.join(out,'roof-regression-results.json'),JSON.stringify({roof,sanctuaryRayClear:clear,errors},null,2));console.log(JSON.stringify({roof,sanctuaryRayClear:clear,errors}));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
