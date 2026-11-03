import * as T from 'three';
import {setSourceVisibility} from './occlusion.js';
import {createFollowCamera} from './walk_camera_v12.js';

// Camera and player state are separate: zoom/occlusion never move the player.
export class ThirdPerson {
  constructor(scene, camera) {
    this.camera = camera;
    this.position = new T.Vector3();
    this.phase = 0;
    this.ray = new T.Raycaster();
    this.ray.layers.enableAll();
    this.faded = new Map();
    this.fadeMaterials = new WeakMap();
    this.avatar = new T.Group();
    this.avatar.name = 'walk-avatar';
    const cloth = new T.MeshStandardMaterial({color: 0x426f87, roughness: .85});
    const skin = new T.MeshStandardMaterial({color: 0xd7aa85, roughness: .9});
    const pants = new T.MeshStandardMaterial({color: 0x293947, roughness: .9});
    const part = (geometry, material, y, x = 0) => {
      const mesh = new T.Mesh(geometry, material);
      mesh.position.set(x, y, 0);
      mesh.castShadow = false;
      this.avatar.add(mesh);
      return mesh;
    };
    // Adult proportions, standing bounds exactly 0–1.65m (including shoes).
    part(new T.SphereGeometry(.11, 20, 16), skin, 1.54);
    part(new T.CylinderGeometry(.055,.06,.12,12), skin, 1.4);
    part(new T.CylinderGeometry(.17,.135,.48,16), cloth, 1.12);
    part(new T.CapsuleGeometry(.135,.05,4,12), pants, .81);
    this.legs = [-1,1].map(side=>{
      const leg=part(new T.CapsuleGeometry(.065,.59,4,10),pants,.39,side*.085);
      const shoe=new T.Mesh(new T.BoxGeometry(.13,.06,.23),pants);shoe.position.set(0,-.36,.035);leg.add(shoe);return leg;
    });
    this.arms = [-1,1].map(side=>{
      const arm=part(new T.CapsuleGeometry(.045,.44,4,10),cloth,1.05,side*.215);
      const hand=new T.Mesh(new T.SphereGeometry(.05,12,8),skin);hand.position.y=-.29;arm.add(hand);return arm;
    });
    const contact=new T.Mesh(new T.CircleGeometry(.22,24),new T.MeshBasicMaterial({color:0x29251e,transparent:true,opacity:.18,depthWrite:false}));
    contact.rotation.x=-Math.PI/2;contact.position.y=.008;this.avatar.add(contact);
    this.avatar.visible = false;
    scene.add(this.avatar);
    this.follow = createFollowCamera(T, camera, this.avatar, () => this.world);
  }
  get yaw() { return this.follow.pose.yaw; }
  get distance() { return this.follow.pose.distance; }
  get pitch() { return this.follow.pose.pitch; }
  start(position, yaw, group, outdoor = false) {
    this.position.copy(position);
    this.world = group;
    this.avatar.position.copy(position);
    this.follow.reset(outdoor);
    this.follow.pose.yaw = yaw;
    this.follow.snap();
    this.avatar.visible = true;
    this.avatar.rotation.y = yaw + Math.PI;

  }
  stop() {
    this.avatar.visible = false;
    this.restore();
  }
  rotate(dx, dy) {
    this.follow.orbit(dx, dy);
  }
  zoom(delta) {
    this.follow.zoom(delta);
  }
  restore() {
    for (const [mesh, material] of this.faded) {if (!setSourceVisibility(mesh, 1)) mesh.material = material;}
    this.faded.clear();
  }
  update(dt, keys, allowed, floorHeight, group, movement, refreshView = true) {
    let f = Number(keys.has('w') || keys.has('arrowup')) - Number(keys.has('s') || keys.has('arrowdown'));
    let r = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
    const step = 2.2 * dt / Math.max(1, Math.hypot(f, r));
    const dx = (-Math.sin(this.yaw) * f + Math.cos(this.yaw) * r) * step;
    const dz = (-Math.cos(this.yaw) * f - Math.sin(this.yaw) * r) * step;
    const before = this.position.clone();
    if (movement) movement(this.position, dx, dz, dt);
    else {
      if (allowed(this.position.x + dx, this.position.z)) this.position.x += dx;
      if (allowed(this.position.x, this.position.z + dz)) this.position.z += dz;
      this.position.y = floorHeight(this.position.x, this.position.z);
    }
    const moving = Math.hypot(this.position.x - before.x, this.position.z - before.z) > .00001;
    if (moving) {
      this.avatar.rotation.y = Math.atan2(dx, dz);
      this.phase += dt * 9;
    }
    this.legs.forEach((leg, i) => leg.rotation.x = moving ? Math.sin(this.phase + i * Math.PI) * .35 : 0);
    this.arms.forEach((arm, i) => arm.rotation.x = moving ? -Math.sin(this.phase + i * Math.PI) * .25 : 0);
    this.avatar.position.copy(this.position);
    if (!refreshView) return;
    this.world = group;
    this.follow.update(dt);
    this.camera.updateMatrixWorld();
    this.avatar.updateMatrixWorld(true);
    this.restore();
    // Keep the framing in narrow rooms; temporarily fade intervening surfaces.
    // Raycast source objects; hide only their vertex ranges in render batches.
    group.updateMatrixWorld(true);
    const occluders = new Set();
    if(this.targetWorld!==group){this.targetWorld=group;this.targets=[];group.traverse(o=>{if(o.isMesh&&!o.userData.visualBatch)this.targets.push(o)})}
    const samples = [[0, .1], [0, 1.64], ...Array.from({length: 15}, (_, i) => [(i - 7) * .055, .9])];
    for (const [x, y] of samples) {
      const sample = this.position.clone().add(new T.Vector3(Math.cos(this.yaw) * x, y, -Math.sin(this.yaw) * x));
      const direction = sample.sub(this.camera.position);
      this.ray.set(this.camera.position, direction.clone().normalize());
      this.ray.far = direction.length();
      for (const hit of this.ray.intersectObjects(this.targets, false)) hit.object.visible && occluders.add(hit.object);
      // Reverse rays also detect the exit face when the camera is inside a wall.
      this.ray.set(this.camera.position.clone().add(direction), direction.clone().normalize().negate());
      for (const hit of this.ray.intersectObjects(this.targets, false)) hit.object.visible && occluders.add(hit.object);
    }
    // Keep each pew coherent: do not leave its legs floating when its seat is hidden.
    const pews=new Set([...occluders].map(o=>(o.userData.name||o.name).match(/^(B1_Pew_\d+)_/)?.[1]).filter(Boolean));
    if(pews.size)for(const o of this.targets){const key=(o.userData.name||o.name).match(/^(B1_Pew_\d+)_/)?.[1];if(pews.has(key))occluders.add(o)}
    for (const mesh of occluders) {
      this.faded.set(mesh, mesh.material);
      if (setSourceVisibility(mesh, 0)) continue;
      if (!this.fadeMaterials.has(mesh)) {
        const make = material => {
          const faded = material.clone();
          faded.transparent = true;
          faded.opacity = .08;
          faded.depthWrite = false;
          return faded;
        };
        this.fadeMaterials.set(mesh, Array.isArray(mesh.material) ? mesh.material.map(make) : make(mesh.material));
      }
      mesh.material = this.fadeMaterials.get(mesh);
    }
  }
}
