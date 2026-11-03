import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {BuildingWorld} from '../src/building-world.js';
const bytes=fs.readFileSync(new URL('../assets/church-environment-20261103.glb',import.meta.url));
const scene=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;
const world=new BuildingWorld(scene),duplicates=[],inward=[],floating=[],intersections=[];
const n=o=>o.userData.name||o.name,triangles=new Map();
for(const o of world.meshes){
 const g=o.geometry,p=g.attributes.position,idx=g.index,count=idx?idx.count:p.count,b=o.userData.worldBounds,center=b.getCenter(new T.Vector3());let volume=0;
 for(let i=0;i<count;i+=3){const v=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(p,idx?idx.getX(i+k):i+k).applyMatrix4(o.matrixWorld));
  const key=v.map(a=>a.toArray().map(x=>Math.round(x*1e5)).join(',')).sort().join('|');
  if(triangles.has(key))duplicates.push([triangles.get(key),n(o)]);else triangles.set(key,n(o));
  volume+=v[0].clone().sub(center).dot(v[1].clone().sub(center).cross(v[2].clone().sub(center)))/6;
 }
 if(volume<-.0001)inward.push({name:n(o),signedVolume:volume});
 if(/Leg|ChairBase/.test(n(o))&&!/ENV/.test(n(o))){const c=b.getCenter(new T.Vector3()),support=world.support(c.x,c.z,b.min.y);if(support===null||Math.abs(support-b.min.y)>.03)floating.push({name:n(o),bottom:b.min.y,support});}
}
const furniture=world.meshes.filter(o=>/Pew|Dining|Desk|Table|Chair|Sofa|Cushion|Rack/.test(n(o))&&!/Rear_|Room/.test(n(o)));
const walls=world.meshes.filter(o=>/Wall|_N$|_S$|_E$|_W$|Glass/.test(n(o))&&!/ENV|RAIL/.test(n(o)));
for(const f of furniture)for(const wall of walls){const overlap=f.userData.worldBounds.clone().intersect(wall.userData.worldBounds),size=overlap.getSize(new T.Vector3());if(Math.min(size.x,size.y,size.z)>.005)intersections.push({furniture:n(f),wall:n(wall),overlap:size.toArray()});}
const result={meshCount:world.meshes.length,method:'World-space identical triangles at 0.01mm tolerance; signed-volume winding candidates; furniture-leg support rays; furniture/wall AABB overlap candidates (not confirmed intersections). Hanging fixtures excluded from floor support checks.',duplicateTriangles:duplicates,inwardCandidates:inward,floatingCandidates:floating,wallOverlapCandidates:intersections};
fs.writeFileSync(new URL('../docs/verification/current/mesh-audit.json',import.meta.url),JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
