const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try {
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.setDefaultTimeout(90000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const root=path.dirname(path.dirname(require.resolve('three'))),out=path.join(__dirname,'../docs/verification/current');
 await page.route('https://cdn.jsdelivr.net/npm/three@0.169.0/**',r=>r.fulfill({path:path.join(root,r.request().url().split('three@0.169.0/')[1]),contentType:'text/javascript'}));
 await page.goto((process.env.TEST_URL||'http://127.0.0.1:8001/')+'?test');await page.waitForFunction(()=>window.__church?.advance);
 await page.click('[data-space="sanctuary"]');
 const result=await page.evaluate(async()=>{
  const T=await import('three'),c=__church,pews=[...c.world.original].filter(([n])=>/Pew.*Seat/.test(n));
  const seat=pews[12][1],b=new T.Box3().setFromObject(seat),center=b.getCenter(new T.Vector3());
  c.thirdPerson.position.set(center.x,-9.4,center.z-1.2);c.thirdPerson.avatar.position.copy(c.thirdPerson.position);c.thirdPerson.follow.pose.yaw=0;c.advance(.2);
  const faded=[...c.thirdPerson.faded.keys()],hiddenPews=pews.filter(([,o])=>faded.includes(o)).length;
  let exact=true;for(const o of c.world.meshes){const r=o.userData.visualRange,p=o.userData.visualProxy;if(!r)continue;const a=p.geometry.getAttribute('sourceVisibility').array,v=faded.includes(o)?0:1;for(let i=r.start;i<r.start+r.count;i++)if(a[i]!==v)exact=false}
  return {faded:faded.length,hiddenPews,totalPews:pews.length,exact,opaqueBatches:c.world.visualBatches.filter(m=>!m.material.transparent).length,fov:c.camera.fov};
 });
 assert.equal(result.hiddenPews,0);assert(result.exact);assert(result.fov>=64);
 await page.screenshot({path:path.join(out,'pew-occlusion-local.png')});
 await page.keyboard.down('w');await page.evaluate(()=>__church.advance(.5));await page.keyboard.up('w');
 await page.keyboard.press('Escape');assert(await page.evaluate(()=>__church.world.visualBatches.every(m=>m.geometry.getAttribute('sourceVisibility').array.every(v=>v===1))));
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'pew-occlusion-results.json'),JSON.stringify({result,restored:true,errors},null,2));console.log(JSON.stringify(result));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
