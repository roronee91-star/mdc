import * as T from 'three';
import {createFollowCamera} from './walk_camera_v12.js';

// Camera and player state are separate: zoom/occlusion never move the player.
export class ThirdPerson {
  constructor(scene, camera) {
    this.camera = camera;
    this.position = new T.Vector3();
    this.phase = 0;
    this.ray = new T.Raycaster();
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
    part(new T.SphereGeometry(.17, 16, 12), skin, 1.55);
    part(new T.CapsuleGeometry(.22, .36, 4, 12), cloth, 1.05);
    this.legs = [-1, 1].map(side => part(new T.CapsuleGeometry(.09, .49, 4, 8), pants, .35, side * .12));
    this.arms = [-1, 1].map(side => part(new T.CapsuleGeometry(.065, .42, 4, 8), cloth, 1.02, side * .3));
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
    for (const [mesh, material] of this.faded) mesh.material = material;
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
    // Current architecture is batched by material, so an entire batch may fade.
    group.updateMatrixWorld(true);
    const occluders = new Set();
    const samples = [[0, .1], [0, 1.7], ...Array.from({length: 15}, (_, i) => [(i - 7) * .055, .9])];
    for (const [x, y] of samples) {
      const sample = this.position.clone().add(new T.Vector3(Math.cos(this.yaw) * x, y, -Math.sin(this.yaw) * x));
      const direction = sample.sub(this.camera.position);
      this.ray.set(this.camera.position, direction.clone().normalize());
      this.ray.far = direction.length();
      for (const hit of this.ray.intersectObject(group, true)) hit.object.visible && occluders.add(hit.object);
      // Reverse rays also detect the exit face when the camera is inside a wall.
      this.ray.set(this.camera.position.clone().add(direction), direction.clone().normalize().negate());
      for (const hit of this.ray.intersectObject(group, true)) hit.object.visible && occluders.add(hit.object);
    }
    for (const mesh of occluders) {
      this.faded.set(mesh, mesh.material);
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
