import {installOcclusion} from './occlusion.js';
import {BuildingWorld,FLOORS} from './building-world.js';
import {ThirdPerson} from './third-person.js';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));const gl=renderer.getContext(),debugInfo=gl.getExtension('WEBGL_debug_renderer_info');
const softwareRenderer=debugInfo&&/SwiftShader|llvmpipe|Software/i.test(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
if(softwareRenderer)renderer.setPixelRatio(.4);
renderer.shadowMap.enabled=!softwareRenderer;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;document.body.prepend(renderer.domElement);
const scene=new T.Scene(),camera=new T.PerspectiveCamera(52,innerWidth/innerHeight,.08,250),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.49;controls.minDistance=2;controls.maxDistance=85;
if(!softwareRenderer){const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;pmrem.dispose()}
const hemi=new T.HemisphereLight(0xe6f0ff,0x75634a,1.4);scene.add(hemi);const sun=new T.DirectionalLight(0xffefd6,3.5);sun.position.set(-24,35,22);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-38,right:38,top:35,bottom:-35,near:1,far:100});sun.shadow.normalBias=.035;scene.add(sun);scene.add(sun.target);
let space='outside';
let world;
try {world=await BuildingWorld.load()} catch(error){document.querySelector('#loading').textContent='모델을 불러오지 못했습니다. 새로고침해 주세요.';throw error}
// Preserve geometry/colors while keeping software WebGL usable.
if(softwareRenderer){const fallback=new Map();world.root.traverse(o=>{if(!o.isMesh)return;const convert=m=>{if(m.isMeshBasicMaterial)return m;if(!fallback.has(m)){const glass=m.transmission>0;fallback.set(m,new T.MeshLambertMaterial({color:m.color,map:m.map,emissive:m.emissive,emissiveIntensity:m.emissiveIntensity,side:m.side,transparent:glass||m.transparent,opacity:glass?.45:m.opacity,depthWrite:glass?false:m.depthWrite}))}return fallback.get(m)};o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material)})}
// Screen artwork is a local canvas texture, with no external image dependency.
const screenCanvas=document.createElement('canvas');screenCanvas.width=2255;screenCanvas.height=900;
const screenContext=screenCanvas.getContext('2d'),sky=screenContext.createLinearGradient(0,0,0,900);sky.addColorStop(0,'#162f40');sky.addColorStop(1,'#719295');screenContext.fillStyle=sky;screenContext.fillRect(0,0,2255,900);
screenContext.fillStyle='#ffffff';screenContext.textAlign='center';screenContext.font='600 94px sans-serif';screenContext.fillText('물댄동산교회',1127,415);screenContext.font='38px sans-serif';screenContext.fillText('함께 예배하는 공동체',1127,505);
const screenTexture=new T.CanvasTexture(screenCanvas);screenTexture.colorSpace=T.SRGBColorSpace;
world.screen.material.map=screenTexture;world.screen.material.color.set(0xffffff);world.screen.material.needsUpdate=true;
// The render batch owns a cloned material; update its screen copy as well.
const screenProxy=world.screen.userData.visualProxy;if(screenProxy){screenProxy.material.map=screenTexture;screenProxy.material.color.set(0xffffff);screenProxy.material.needsUpdate=true}
for(const {mesh,label,detail} of world.roomSigns){
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=196;const ctx=canvas.getContext('2d');ctx.fillStyle='#24433c';ctx.fillRect(0,0,768,196);ctx.textAlign='center';ctx.fillStyle='#f3e7cb';ctx.font='600 76px sans-serif';ctx.fillText(label,384,91);ctx.font='32px sans-serif';ctx.fillText(detail,384,150);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 for(const target of[mesh,mesh.userData.visualProxy].filter(Boolean)){target.material.map=texture;target.material.color.set(0xffffff);target.material.needsUpdate=true}
}
for(const mesh of world.visualBatches)installOcclusion(mesh.material);
scene.add(world.root);
const groups=Object.fromEntries(FLOORS.map(f=>[f.id,world.root])),obstacles={};
const data=Object.fromEntries(FLOORS.map(f=>[f.id,{
 title:({outside:'물댄동산교회',sanctuary:'함께 예배하는 본당',education:'배움과 성장',community:'식탁의 교제',terrace:'쉼과 사색'})[f.id],
 description:f.id==='outside'?'승인 외관을 담은 모델로 탐방을 시작하세요.':'계단과 승강기로 층을 오가며 둘러보세요.',
 chapter:f.label+' — 물댄동산교회',
 eye:f.id==='outside'?[32,23,38]:[10,f.y+2.2,2.5],target:f.id==='outside'?[0,6,0]:f.id==='sanctuary'?[-10.3,-6.1,-8.2]:[0,f.y+1,0],
 walk:world.spawn(f.id).toArray(),plan:({sanctuary:2,outside:3,education:4,community:5,terrace:6})[f.id]
}]));
const seatCount=world.meshes.filter(o=>/Pew.*Seat/.test(o.userData.name||o.name)).length;
function floorHeight(x,z){return world.support(x,z,thirdPerson?.position.y||0)??0}
const thirdPerson=new ThirdPerson(scene,camera);
let walking=false;const keys=new Set();
function setSpace(id){renderer.shadowMap.needsUpdate=true;space=id;world.root.visible=true;world.lift.passenger=false;const d=data[id];controls.maxPolarAngle=id==='outside'?Math.PI*.49:Math.PI*.8;camera.fov=id==='sanctuary'?64:52;camera.updateProjectionMatrix();document.body.classList.toggle('compact',id==='sanctuary');document.querySelector('#spaces-toggle').setAttribute('aria-expanded',String(id!=='sanctuary'));camera.position.set(...d.eye);controls.target.set(...d.target);controls.update();scene.background=new T.Color(id==='outside'?0xdce3df:0x9caa9b);scene.fog=id==='outside'?new T.Fog(0xdce3df,65,170):null;scene.environmentIntensity=id==='outside'?.65:.38;hemi.intensity=id==='outside'?1.0:.85;sun.intensity=id==='outside'?3.5:1.05;renderer.toneMappingExposure=id==='outside'?.95:.72;document.body.classList.toggle('interior',id!=='outside');document.querySelector('#heading').innerHTML=d.title;document.querySelector('#description').innerHTML=d.description;document.querySelector('#chapter').textContent=d.chapter;document.querySelectorAll('[data-space]').forEach(b=>b.classList.toggle('active',b.dataset.space===id));setWalk(id!=='outside')}
function setWalk(on){
 walking=on;keys.clear();controls.enabled=!on;
 document.body.classList.toggle('walking',on);
 document.querySelector('#quick-walk').textContent=on?'전체 보기':'직접 걸어보기';
 document.querySelector('#quick-walk').setAttribute('aria-pressed',String(on));
 document.querySelector('#reticle').hidden=true;
 document.querySelector('#touch').hidden=!(on&&matchMedia('(pointer:coarse)').matches);
 document.querySelector('#walk').textContent=on?'공간 전체 둘러보기':'캐릭터와 함께 걷기';
 liftPanel.hidden=!on;document.querySelector('#mode').textContent=on?'WASD / 방향키 이동 · 드래그 회전 · 휠 줌 · Esc 전체 보기':'둘러보기 · 드래그로 회전 / 휠로 확대';
 if(on){
  const p=space==='sanctuary'?new T.Vector3(-1,-9.4,-2):world.spawn(space);
  const v=new T.Vector3(...data[space].target).sub(p);
  thirdPerson.start(p,Math.atan2(-v.x,-v.z),groups[space],space==='outside');
  if(space==='sanctuary'){thirdPerson.follow.pose.pitch=.12;thirdPerson.follow.snap()}
  document.body.classList.add('compact');
  document.querySelector('#spaces-toggle').setAttribute('aria-expanded','false');
  thirdPerson.update(0,keys,allowed,floorHeight,world.root,()=>{});
 }else{
  thirdPerson.stop();camera.fov=space==='sanctuary'?64:52;camera.updateProjectionMatrix();
  camera.position.set(...data[space].eye);controls.target.set(...data[space].target);controls.update();
 }
 renderer.render(scene,camera);
}
document.querySelectorAll('[data-space]').forEach(b=>b.onclick=()=>setSpace(b.dataset.space));document.querySelector('#walk').onclick=()=>setWalk(!walking);document.querySelector('#quick-walk').onclick=()=>setWalk(!walking);document.querySelector('#reset').onclick=()=>setSpace(space);
const dialog=document.querySelector('#dialog');document.querySelector('#close').onclick=()=>dialog.close();document.querySelector('#plan').onclick=()=>{keys.clear();document.querySelector('#dialog-title').textContent='건축 평면도 · '+({outside:'1층',sanctuary:'지하 1층',education:'2층',community:'3층',terrace:'4층'}[space]);document.querySelector('#dialog-content').innerHTML=`<img src="assets/plans/church-plan-${data[space].plan}.png" alt="첨부 건축 평면도"><p>도면의 치수와 용도를 참고한 공간 연구입니다. 승강기와 계단 코어의 정확한 좌표 정합 및 층고 설계 검증은 진행 중입니다.</p>`;dialog.showModal()};document.querySelector('#help').onclick=()=>{keys.clear();document.querySelector('#dialog-title').textContent='천천히, 공간을 만나보세요';document.querySelector('#dialog-content').innerHTML='<p>전체 보기: 마우스를 드래그해 회전하고 휠로 확대합니다.<br>캐릭터와 함께 걷기: WASD 또는 방향키로 이동하고 드래그로 회전, 휠로 거리를 조절합니다. 좁은 공간에서는 시야를 가리는 부재만 잠시 숨겨집니다. 휴대전화에서는 방향 버튼으로 이동합니다.<br>Esc: 전체 보기로 돌아갑니다.<br>계단을 걸어 이동하거나 승강기 앞에서 E로 호출할 수 있습니다. 탑승 후 층 버튼을 누르세요. 공간 선택 메뉴는 해당 층으로 바로 이동합니다.</p>';dialog.showModal()};
addEventListener('keydown',e=>{if(dialog.open)return;if(e.key==='Escape'){setWalk(false);return}if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase())});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());let drag=false;renderer.domElement.addEventListener('pointerdown',e=>{drag=true;renderer.domElement.setPointerCapture(e.pointerId)});renderer.domElement.addEventListener('pointerup',()=>drag=false);renderer.domElement.addEventListener('pointercancel',()=>drag=false);renderer.domElement.addEventListener('pointermove',e=>{if(walking&&drag&&!dialog.open){thirdPerson.rotate(e.movementX,e.movementY)}});document.querySelectorAll('[data-move]').forEach(b=>{const key={forward:'w',back:'s',left:'a',right:'d'}[b.dataset.move];b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(key)};b.onpointerup=b.onpointercancel=()=>keys.delete(key)});
renderer.domElement.addEventListener('wheel',e=>{if(walking&&!dialog.open){e.preventDefault();thirdPerson.zoom(e.deltaY)}},{passive:false});
function allowed(x,z){return world.clearBody(x,z,thirdPerson.position.y)}
const liftPanel=document.createElement('section');liftPanel.id='lift-panel';liftPanel.hidden=true;
liftPanel.innerHTML='<strong id="lift-status">승강기</strong><button id="lift-call">호출 / 문 열기 (E)</button><div>'+FLOORS.map(f=>`<button data-lift="${f.y}">${f.label}</button>`).join('')+'</div>';
document.body.append(liftPanel);
document.querySelector('#lift-call').onclick=()=>world.callLift(thirdPerson.position);
document.querySelectorAll('[data-lift]').forEach(b=>b.onclick=()=>{if(world.insideCar(thirdPerson.position))world.requestLift(Number(b.dataset.lift),thirdPerson.position)});
addEventListener('keydown',e=>{if(e.key.toLowerCase()==='e'&&walking&&!dialog.open&&!e.repeat)world.callLift(thirdPerson.position)});
function liftUI(){
 const p=thirdPerson.position,l=world.lift;liftPanel.hidden=!walking||!world.nearLift(p)&&!l.passenger;
 const inside=world.insideCar(p);document.querySelectorAll('[data-lift]').forEach(b=>b.disabled=!inside||['moving','closing'].includes(l.phase));
 const floor=world.nearestFloor(p.y);if(walking){space=floor.id;document.querySelectorAll('[data-space]').forEach(b=>b.classList.toggle('active',b.dataset.space===space))}document.querySelector('#lift-status').textContent=l.phase==='moving'?'승강기 이동 중':inside?'도착 층을 선택하세요':floor.label+' · 승강기';
 if(walking){document.querySelector('#mode').textContent=floor.label+(floor.id==='sanctuary'?' · 본당 약 10m 공간감 / 실제 9m · 사람 1.65m':'')+' · WASD 이동 · 드래그 회전 · 휠 줌 · E 승강기 · Esc 전체 보기'}
}
function tick(dt,refreshView=true){
 if(walking&&!dialog.open){world.update(dt,thirdPerson.position);thirdPerson.update(dt,keys,allowed,floorHeight,world.root,(p,dx,dz,dt)=>world.move(p,dx,dz,dt),refreshView);if(refreshView)liftUI()}
}
const testing=new URLSearchParams(location.search).has('test');
const clock=new T.Clock();let lastRender=0;function animate(){requestAnimationFrame(animate);const now=performance.now();if(softwareRenderer&&now-lastRender<1000/12)return;lastRender=now;const dt=Math.min(clock.getDelta(),.1);if(!testing){tick(dt);if(!walking)controls.update();renderer.render(scene,camera)}else if(!window.__church)renderer.render(scene,camera);if(window.__church)window.__church.renderedSpace=space;}
setSpace('outside');animate();document.querySelector('#loading').remove();addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
document.querySelector('#spaces-toggle').onclick=()=>{const hidden=document.body.classList.toggle('compact');document.querySelector('#spaces-toggle').setAttribute('aria-expanded',String(!hidden))};
window.__church={get space(){return space},get walking(){return walking},camera,controls,scene,seatCount,groups,obstacles,floorHeight,thirdPerson,allowed,world,FLOORS,renderer};

if(testing)window.__church.advance=(seconds,render=true)=>{for(let t=0;t<seconds;t+=1/60)tick(Math.min(1/60,seconds-t),false);if(render){thirdPerson.follow.snap();tick(0);renderer.render(scene,camera)}};
