import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export const FLOORS = [{id:'sanctuary',label:'B1',y:-9.4},{id:'outside',label:'1F',y:0},{id:'education',label:'2F',y:3.2},{id:'community',label:'3F',y:9.6},{id:'terrace',label:'4F',y:12.8}];
const stairHole={x1:4.5,x2:7.5,z1:2.8,z2:8.6};
const liftHole={x1:9.94,x2:12.05,z1:4.91,z2:7.62};
const down=new T.Vector3(0,-1,0);
const sourceName=o=>o.userData.name||o.name;

export class BuildingWorld {
  static async load(){const gltf=await new GLTFLoader().loadAsync('assets/church-v13.glb');return new BuildingWorld(gltf.scene)}
  constructor(model){
    this.root=model;this.root.name='church-v13';this.root.updateMatrixWorld(true);
    this.repairs=[];this.ray=new T.Raycaster();this.ray.layers.enableAll();this.meshes=[];this.walkables=[];this.solids=[];this.doors=[];
    this.original=new Map();this.root.traverse(o=>{if(o.isMesh)this.original.set(sourceName(o),o)});
    this.trim=new T.MeshStandardMaterial({color:0xd6d0c2,roughness:.7});
    this.fixStructure();this.buildLift();this.index();this.batchVisuals();
  }
  box(name,x,y,z,w,h,d,material=this.trim,parent=this.root){
    const o=new T.Mesh(new T.BoxGeometry(w,h,d),material);o.name=name;o.position.set(x,y,z);o.receiveShadow=true;parent.add(o);return o;
  }
  // Retain outer edges and material; cut only registered rectangular core openings.
  slab(name,bounds,holes,material){
    const {min:a,max:b}=bounds;const shape=new T.Shape();
    shape.moveTo(a.x,-a.z);shape.lineTo(b.x,-a.z);shape.lineTo(b.x,-b.z);shape.lineTo(a.x,-b.z);shape.closePath();
    for(const h of holes){const p=new T.Path();p.moveTo(h.x1,-h.z1);p.lineTo(h.x1,-h.z2);p.lineTo(h.x2,-h.z2);p.lineTo(h.x2,-h.z1);p.closePath();shape.holes.push(p)}
    const geom=new T.ExtrudeGeometry(shape,{depth:b.y-a.y,bevelEnabled:false});geom.rotateX(-Math.PI/2);geom.translate(0,a.y,0);
    const o=new T.Mesh(geom,material);o.name=name;o.receiveShadow=true;this.root.add(o);return o;
  }
  fixStructure(){
    for(const name of ['B1_Ceiling','SITE_Sidewalk']){
      const o=this.original.get(name);if(!o)continue;const b=new T.Box3().setFromObject(o);
      this.slab(name+'_core_openings',b,[stairHole,liftHole],o.material);o.removeFromParent();this.repairs.push(name+': stair and EV openings');
    }
    this.slab('Ground_floor_0m',new T.Box3(new T.Vector3(-12.425,-.2,-9.225),new T.Vector3(12.425,0,9.225)),[stairHole,liftHole],this.trim);
    // A legacy partition was left at the origin by the supplied export; its segmented replacements already exist.
    this.original.get('01_Lobby_E')?.removeFromParent();
    const north=this.original.get('01_Lobby_N');
    if(north){
      const m=north.material;north.removeFromParent();
      for(const [a,b]of [[4,4.75],[7.5,8.65],[9.75,10]])this.box('Lobby_N_segment',(a+b)/2,1.5,3.8,b-a,3,.12,m);
      this.box('Lobby_N_EV_header',9.2,2.575,3.8,1.1,.85,.12,m);
      this.repairs.push('1F internal EV corridor doorway added; front facade unchanged');
    }
    const desk=this.original.get('01_Reception');if(desk){desk.position.z=8.05;desk.updateMatrixWorld(true)}
    this.box('Entrance_Landing_1F',7.35,-.08,8.55,1.7,.16,.5);

    // This room partition occupies the existing B1 stair flight/landing footprint.
    this.original.get('B1_Room_Front_A_6')?.removeFromParent();
    this.repairs.push('Removed obsolete 01_Lobby_E and B1 stair-intersecting partition B1_Room_Front_A_6');
    for(const f of FLOORS){
      this.box('Landing_bridge_'+f.label,6,f.y-.08,2.95,2.6,.16,.5);
      this.box('Landing_exit_'+f.label,7.55,f.y-.08,3.55,1.1,.16,.9);
    }
    // Hollow the internal fill only; the front/right/left/top exterior planes stay at exactly the original bounds.
    const tower=this.original.get('HERO_Cross_Tower');
    if(tower){
      const b=new T.Box3().setFromObject(tower),a=b.min,c=b.max,t=.18,m=tower.material;
      this.box('HERO_Cross_Tower_front',(a.x+c.x)/2,(a.y+c.y)/2,c.z-t/2,c.x-a.x,c.y-a.y,t,m);
      for(const x of [a.x+t/2,c.x-t/2])this.box('HERO_Cross_Tower_side',x,(a.y+c.y)/2,(a.z+c.z-t)/2,t,c.y-a.y,c.z-a.z-t,m);
      this.box('HERO_Cross_Tower_cap',(a.x+c.x)/2,c.y-t/2,(a.z+c.z)/2,c.x-a.x,t,c.z-a.z,m);
      tower.removeFromParent();this.repairs.push('Cross tower internal fill hollowed; exterior front/right/left/top bounds retained');
    }
    // The existing 1F reception blocks the landing exit; keep it, using the north corridor around it.
  }
  buildLift(){
    const steel=new T.MeshStandardMaterial({color:0x7b898c,metalness:.5,roughness:.35});
    const group=new T.Group();group.name='Elevator_car';this.root.add(group);
    this.car=group;this.lift={y:0,target:0,phase:'open',openness:1,passenger:false};
    this.box('Lift_car_floor',11,-.07,6.265,1.75,.14,2.35,steel,group);
    this.box('Lift_car_roof',11,2.38,6.265,1.75,.12,2.35,steel,group);
    this.box('Lift_car_east',11.85,1.16,6.265,.06,2.32,2.35,steel,group);
    for(const z of [5.12,7.41])this.box('Lift_car_side',11,1.16,z,1.75,2.32,.06,steel,group);
    for(const f of FLOORS){
      this.box('Lift_sill_floor_'+f.label,9.925,f.y-.07,6.265,.4,.14,1.32,steel);
      const old=[...this.original.values()].find(o=>sourceName(o).includes('ElevatorDoor')&&Math.abs(new T.Box3().setFromObject(o).min.y-f.y)<.03);
      old?.removeFromParent();
      for(const sign of [-1,1]){
        const mesh=this.box('Lift_landing_door_'+f.label+'_'+sign,9.915,f.y+1.05,6.265+sign*.3,.10,2.1,.6,steel);
        mesh.userData.ignoreCameraCollision=false;this.doors.push({mesh,floor:f.y,sign});
      }
    }
    // Car gate prevents stepping into the shaft during travel.
    this.gate=this.box('Lift_car_gate',10.13,1.05,6.265,.06,2.1,1.2,steel,group);
    this.updateDoors();
  }
  index(){
    this.root.updateMatrixWorld(true);this.meshes=[];this.walkables=[];this.solids=[];
    this.root.traverse(o=>{if(!o.isMesh)return;o.geometry.computeBoundingBox();o.geometry.computeBoundingSphere();
      o.userData.worldBounds=new T.Box3().setFromObject(o);this.meshes.push(o);
      const name=sourceName(o),landingDoor=name.startsWith('Lift_landing_door_');
      if(!landingDoor&&/SLAB|Floor$|floor|Sidewalk|Road|Flight|STAIR_[AB]_|Landing|GroundLanding|Stage|Podium/i.test(name))this.walkables.push(o);
      // Stair risers are handled by step-up support, not horizontal wall collision.
      if(landingDoor||!/Flight|STAIR_[AB]_|Landing|CoreMarker|ParkingStripe|JOINT_|FRAME_|FIN_|RailPost|CeilingLamp|Light|Sign|Text/i.test(name))this.solids.push(o);
    });
  }
  batchVisuals(){
    const batches=new Map(),dynamic=new Set(this.doors.map(d=>d.mesh));
    for(const o of this.meshes){
      if(o.parent===this.car||dynamic.has(o)||Array.isArray(o.material))continue;
      const key=o.material.uuid+'|'+Boolean(o.geometry.index)+'|'+Object.keys(o.geometry.attributes).sort().join(',');
      if(!batches.has(key))batches.set(key,{material:o.material,parts:[],originals:[]});
      const batch=batches.get(key);batch.parts.push(o.geometry.clone().applyMatrix4(o.matrixWorld));batch.originals.push(o);
    }
    this.visualBatches=[];
    for(const batch of batches.values()){
      const geometry=mergeGeometries(batch.parts,false);for(const g of batch.parts)g.dispose();
      if(!geometry)continue;
      const mesh=new T.Mesh(geometry,batch.material);mesh.name='Render_batch_'+batch.material.name;
      mesh.castShadow=true;mesh.receiveShadow=true;this.root.add(mesh);this.visualBatches.push(mesh);
      for(const original of batch.originals){original.layers.set(1);original.userData.visualProxy=mesh}
    }
  }
  nearestFloor(y){return FLOORS.reduce((a,b)=>Math.abs(b.y-y)<Math.abs(a.y-y)?b:a)}
  insideCar(p){return p.x>10.28&&p.x<11.65&&p.z>5.38&&p.z<7.14&&Math.abs(p.y-this.lift.y)<.25}
  nearLift(p){return p.x>8.3&&p.x<11.9&&Math.abs(p.z-6.265)<1.45&&Math.abs(p.y-this.nearestFloor(p.y).y)<.3}
  requestLift(y,p){
    if(this.lift.phase==='moving'||this.lift.phase==='closing')return false;
    this.lift.passenger=this.insideCar(p);this.lift.target=y;
    if(Math.abs(y-this.lift.y)<.01){this.lift.phase='opening';return true}
    this.lift.phase='closing';return true;
  }
  callLift(p){return this.nearLift(p)&&this.requestLift(this.nearestFloor(p.y).y,p)}
  updateDoors(){
    for(const d of this.doors){const opening=Math.abs(d.floor-this.lift.y)<.02?this.lift.openness:0;
      d.mesh.position.z=6.265+d.sign*(.3+opening*.68);d.mesh.updateMatrixWorld(true);d.mesh.userData.worldBounds=new T.Box3().setFromObject(d.mesh);
    }
    this.gate.visible=this.lift.openness<.95;this.gate.userData.noCollision=!this.gate.visible;
    this.car.position.y=this.lift.y;this.car.updateMatrixWorld(true);
    this.car.traverse(o=>{if(o.isMesh)o.userData.worldBounds=new T.Box3().setFromObject(o)});
  }
  update(dt,p){
    const l=this.lift;
    if(l.phase==='closing'){
      const obstruction=p.x>9.65&&p.x<10.35&&Math.abs(p.z-6.265)<.85&&Math.abs(p.y-l.y)<.3;
      if(obstruction&&!this.insideCar(p)){l.phase='opening'}
      else {l.openness=Math.max(0,l.openness-dt*1.7);if(l.openness===0){l.passenger=this.insideCar(p);l.phase='moving'}}
    }
    else if(l.phase==='moving'){
      const previous=l.y;const delta=T.MathUtils.clamp(l.target-l.y,-2.6*dt,2.6*dt);l.y+=delta;
      if(l.passenger)p.y+=l.y-previous;
      if(Math.abs(l.target-l.y)<.001){l.y=l.target;l.phase='opening'}
    }else if(l.phase==='opening'){l.openness=Math.min(1,l.openness+dt*1.7);if(l.openness===1)l.phase='open'}
    this.updateDoors();
  }
  candidates(list,min,max){return list.filter(o=>o.visible&&!o.userData.noCollision&&o.userData.worldBounds.intersectsBox(new T.Box3(min,max)))}
  support(x,z,y){
    this.ray.set(new T.Vector3(x,y+.24,z),down);this.ray.near=0;this.ray.far=.55;
    const candidates=this.candidates(this.walkables,new T.Vector3(x-.01,y-.31,z-.01),new T.Vector3(x+.01,y+.24,z+.01));
    const hit=this.ray.intersectObjects(candidates,false).find(h=>h.face.normal.clone().transformDirection(h.object.matrixWorld).y>.55);
    return hit?hit.point.y:null;
  }
  clearBody(x,z,y){
    const radius=.2;
    const min=new T.Vector3(x-radius,y+.26,z-radius),max=new T.Vector3(x+radius,y+1.72,z+radius);
    const nearby=this.candidates(this.solids,min,max);
    // Cardinal and diagonal capsule cross sections detect actual holes, not whole-mesh boxes.
    for(const h of [.30,.95,1.62])for(let i=0;i<8;i++){
      const angle=i*Math.PI/4,direction=new T.Vector3(Math.cos(angle),0,Math.sin(angle));
      this.ray.set(new T.Vector3(x,y+h,z),direction);this.ray.near=0;this.ray.far=radius;
      if(this.ray.intersectObjects(nearby,false).length)return false;
    }
    this.ray.set(new T.Vector3(x,y+.25,z),new T.Vector3(0,1,0));this.ray.far=1.47;
    return this.ray.intersectObjects(nearby,false).length===0;
  }
  move(p,dx,dz,dt){
    if(this.lift.passenger&&['moving','closing'].includes(this.lift.phase))return;
    // Substeps preserve thin-wall collision and step support even with slow frames.
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.035));
    for(let i=0;i<steps;i++)for(const [sx,sz] of [[dx/steps,0],[0,dz/steps]]){
      if(sx===0&&sz===0)continue;
      const x=p.x+sx,z=p.z+sz;
      const floor=this.support(x,z,p.y);
      if(floor!==null&&Math.abs(x)<24&&Math.abs(z)<24&&this.clearBody(x,z,floor)){p.set(x,floor,z)}
    }
  }
  spawn(id){const f=FLOORS.find(f=>f.id===id)||FLOORS[1];return new T.Vector3(id==='outside'?14:7.85,id==='outside'?-.05:f.y,2.5)}
}
