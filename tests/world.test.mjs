import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {BuildingWorld,FLOORS} from '../src/building-world.js';
const bytes=fs.readFileSync(new URL('../assets/church-v13.glb',import.meta.url));
const scene=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;
scene.updateMatrixWorld(true);
const protectedParts=new Map();scene.traverse(o=>{if(o.isMesh&&/Pew|Stage|Glass|FIN_|FRAME_|Cross/.test(o.name)&&o.name!=='HERO_Cross_Tower')protectedParts.set(o,{matrix:o.matrixWorld.toArray(),vertices:Array.from(o.geometry.attributes.position.array)})});
const w=new BuildingWorld(scene),p=new T.Vector3(5.35,-9.4,3.65),results=[];
const closedDoorProbe=new T.Vector3(9.2,-9.4,6.265);for(let i=0;i<100;i++)w.move(closedDoorProbe,.025,0,1/60);assert(closedDoorProbe.x<9.75);results.push('Closed landing door blocks shaft entry');
function go(x,z){for(let i=0;i<2000;i++){const dx=x-p.x,dz=z-p.z,n=Math.hypot(dx,dz);if(n<.015)return;const before=p.clone();w.move(p,dx/n*Math.min(n,.025),dz/n*Math.min(n,.025),1/60);assert(before.distanceTo(p)>.000001,`Blocked ${p.toArray()} toward ${x},${z}`)}throw Error('Route timeout')}
for(const expected of [-6.266667,-3.133333,0,3.2,6.4,9.6,12.8]){for(const [x,z] of [[5.35,7.65],[6.65,7.65],[6.65,3.65],[5.35,3.65]])go(x,z);assert(Math.abs(p.y-expected)<.002)}
results.push('Continuous B1 → 4F staircase ascent');go(6.65,3.65);
for(let i=0;i<7;i++)for(const[x,z]of[[6.65,7.65],[5.35,7.65],[5.35,3.65],[6.65,3.65]])go(x,z);
assert(Math.abs(p.y+9.4)<.002);results.push('Continuous 4F → B1 staircase descent');
for(const f of FLOORS){p.set(5.35,f.y,3.65);for(const[x,z]of[[5.35,2.5],[9.2,2.5],[9.2,6.265]])go(x,z);w.callLift(p);for(let i=0;i<2000&&w.lift.phase!=='open';i++)w.update(.04,p);go(11,6.265);assert(w.insideCar(p));results.push(f.label+' stair landing → EV corridor → car')}
for(const target of [-9.4,0,3.2,9.6,12.8]){assert(w.requestLift(target,p));for(let i=0;i<2000&&w.lift.phase!=='open';i++)w.update(.04,p);assert(Math.abs(p.y-target)<.002);go(9.2,6.265);go(11,6.265);results.push('EV ride / exit / reentry '+target)}
for(const[o,s]of protectedParts){assert.deepEqual(o.matrixWorld.toArray(),s.matrix);assert.deepEqual(Array.from(o.geometry.attributes.position.array),s.vertices)}results.push(protectedParts.size+' protected facade / stage / pew meshes unchanged');
const raw=w.original.get('HERO_Cross_Tower'),shell=w.meshes.filter(o=>o.name.startsWith('HERO_Cross_Tower_')),ray=new T.Raycaster();ray.layers.enableAll();
for(const[origin,direction]of[[[10,10,20],[0,0,-1]],[[20,10,8],[-1,0,0]],[[0,10,8],[1,0,0]],[[10,25,8],[0,-1,0]]]){ray.set(new T.Vector3(...origin),new T.Vector3(...direction));const a=ray.intersectObject(raw)[0],b=ray.intersectObjects(shell)[0];assert(a&&b);assert(a.point.distanceTo(b.point)<.00001)}results.push('Cross tower front / right / left / roof exterior planes retained');
p.copy(w.spawn('outside'));for(const[x,z]of[[9.2,2.5],[9.2,6.265]])go(x,z);results.push('1F side entrance → EV lobby');
const output={tests:results.length,results,visualDrawBatches:w.visualBatches.length,collisionMeshes:w.meshes.length,repairs:w.repairs};fs.mkdirSync(new URL('../docs/verification/current/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('../docs/verification/current/structure-results.json',import.meta.url),JSON.stringify(output,null,2));console.log(JSON.stringify(output));
