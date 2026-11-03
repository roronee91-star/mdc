const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const out=path.join(__dirname,'../docs/verification/current');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1100,height:800}});page.setDefaultTimeout(90000);const errors=[],results=[];
 page.on('pageerror',e=>errors.push(e.message));
 const threeRoot=path.dirname(path.dirname(require.resolve('three')));
 await page.route('https://cdn.jsdelivr.net/npm/three@0.169.0/**',r=>r.fulfill({path:path.join(threeRoot,r.request().url().split('three@0.169.0/')[1]),contentType:'text/javascript'}));
 await page.goto((process.env.TEST_URL||'http://127.0.0.1:8001/')+'?test');await page.waitForFunction(()=>window.__church?.advance);
 const state=()=>page.evaluate(()=>({p:__church.thirdPerson.position.toArray(),floor:__church.space,lift:{...__church.world.lift},distance:__church.thirdPerson.distance,fade:__church.thirdPerson.faded.size}));
 async function framed(){return page.evaluate(async()=>{const T=await import('three'),c=__church.camera,a=__church.thirdPerson.avatar;c.updateMatrixWorld();a.updateMatrixWorld(true);if(c.position.distanceTo(a.position)>12)return false;const b=new T.Box3().setFromObject(a);for(const x of[b.min.x,b.max.x])for(const y of[b.min.y,b.max.y])for(const z of[b.min.z,b.max.z]){const p=new T.Vector3(x,y,z).project(c);if(Math.abs(p.x)>.98||Math.abs(p.y)>.98||p.z>1||p.z< -1)return false}return true})}
 async function shot(name){await page.screenshot({path:path.join(out,name+'.png')})}
 async function menu(id){if(await page.locator('body').evaluate(e=>e.classList.contains('compact')))await page.click('#spaces-toggle');await page.click('[data-space="'+id+'"]')}
 async function yaw0(){await page.evaluate(()=>{__church.thirdPerson.follow.pose.yaw=0;__church.thirdPerson.follow.snap()})}
 // Real keyboard events feed the production controller. Fixed time stepping avoids software-GPU speed affecting travel.
 async function go(axis,target){const s=await state(),index=axis==='x'?0:2,delta=target-s.p[index];if(Math.abs(delta)<.018)return;
  const key=axis==='x'?(delta>0?'d':'a'):(delta>0?'s':'w');await page.keyboard.down(key);
  const result=await page.evaluate(({axis,target,sign})=>{const c=__church,p=c.thirdPerson.position;let n=0,stuck=0;while(Math.abs(target-p[axis])>.018&&n++<1600){const before=p[axis];c.advance(Math.min(1/30,Math.abs(target-before)/2.2),false);if(Math.abs(p[axis]-before)<.00001)stuck++;else stuck=0;if(stuck>3)break;if((target-p[axis])*sign<0)break}c.advance(0);return {position:p.toArray(),remaining:Math.abs(target-p[axis]),n}}, {axis,target,sign:Math.sign(delta)});
  await page.keyboard.up(key);assert(result.remaining<.16,JSON.stringify({axis,target,...result}));
 }
 await shot('01-exterior-v13');
 await page.click('#walk');await yaw0();
 await go('x',9.2);await go('z',6.265);assert(await framed());
 results.push({test:'1F side entrance → EV lobby via WASD',pass:true,state:await state()});await shot('02-entrance-ev');
 // Closed wall: walk against the north wall outside its doorway.
 await go('z',4.95);await go('x',8.1);const before=await state();await page.keyboard.down('w');await page.evaluate(()=>__church.advance(1));await page.keyboard.up('w');const after=await state();assert(after.p[2]>3.9&&after.p[2]<before.p[2]);results.push({test:'wall collision',pass:true,state:after});
 await menu('sanctuary');await page.evaluate(()=>{const c=__church;c.thirdPerson.position.copy(c.world.spawn('sanctuary'));c.thirdPerson.avatar.position.copy(c.thirdPerson.position)});await yaw0();await go('x',5.35);await go('z',3.65);await shot('03-b1-start');
 const tops=[-6.266667,-3.133333,0,3.2,6.4,9.6,12.8];
 for(let i=0;i<7;i++){
  await go('z',7.65);await go('x',6.65);await go('z',3.65);await go('x',5.35);
  const s=await state();assert(Math.abs(s.p[1]-tops[i])<.02);results.push({test:'ascending switchback '+i,pass:true,state:s});
  if([2,3,5,6].includes(i)){assert(await framed());await shot('stair-arrival-'+i)}console.log('stairs',i,s.p[1]);
 }
 await go('x',6.65);
 for(let i=0;i<7;i++){await go('z',7.65);await go('x',5.35);await go('z',3.65);await go('x',6.65)}
 assert(Math.abs((await state()).p[1]+9.4)<.02);results.push({test:'4F → B1 continuous descent',pass:true});
 await go('x',5.35);await go('z',2.5);await go('x',9.2);await go('z',6.265);
 // Car initially at 1F: the B1 landing door must block entry until called.
 await page.keyboard.down('d');await page.evaluate(()=>__church.advance(1));await page.keyboard.up('d');assert((await state()).p[0]<9.75,JSON.stringify(await state()));results.push({test:'closed landing door prevents shaft entry',pass:true});
 await page.keyboard.press('e');await page.evaluate(()=>__church.advance(6));assert.equal((await state()).lift.phase,'open');await go('x',11);assert(await framed());await shot('04-lift-b1');
 for(const target of [0,3.2,9.6,12.8,-9.4]){
  await page.click('[data-lift="'+target+'"]');await page.evaluate(()=>__church.advance(12));const s=await state();assert(Math.abs(s.p[1]-target)<.02);assert.equal(s.lift.phase,'open');assert(await framed());
  await go('x',9.2);assert(Math.abs((await state()).p[1]-target)<.02);await go('x',11);
  results.push({test:'elevator ride, exit, reenter '+target,pass:true,state:s});await shot('lift-'+String(target).replace('.','_'));console.log('lift',target);
 }
 await go('x',9.2);await page.mouse.move(450,380);await page.mouse.down();await page.mouse.move(560,420,{steps:4});await page.mouse.up();await page.mouse.wheel(0,-400);await page.evaluate(()=>__church.advance(.5));assert(await framed());results.push({test:'pointer orbit / wheel / full body',pass:true});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>__church.advance(.5));assert(await framed());await shot('05-mobile-full-body');results.push({test:'portrait full body',pass:true});
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>__church.walking),false);assert.equal(await page.evaluate(()=>__church.thirdPerson.faded.size),0);results.push({test:'Esc restores materials and overview',pass:true});
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({browser:await browser.version(),method:'Real browser keyboard/pointer events; fixed-step production controller simulation between rendered frames',results,errors},null,2));console.log(JSON.stringify({passed:results.length,errors}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
