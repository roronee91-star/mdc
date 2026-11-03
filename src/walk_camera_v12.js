/**
 * Full-body third-person follow camera, THREE.js 0.169+
 * Camera only: player movement/collision logic remains in the host app.
 */
export function createFollowCamera(THREE, camera, avatar, getWorld = () => null) {
  const anchor = new THREE.Vector3();
  const desired = new THREE.Vector3();
  const view = new THREE.Vector3();
  const ray = new THREE.Raycaster();
  ray.layers.enableAll();
  const pose = {yaw: 0.35, pitch: 0.34, distance: 7.5};
  const allowed = {
    minDistance: 5.5,
    maxDistance: 11.0,
    minPitch: 0.10,
    maxPitch: 0.72,
  };
  let blockers = [];
  let lastWorld = null;

  function refreshBlockers() {
    const world = getWorld();
    if (world === lastWorld) return;
    lastWorld = world;
    blockers = [];
    world?.traverse(o => {
      if (!o.isMesh || !o.visible || o.userData.visualBatch || o.userData?.ignoreCameraCollision) return;
      const n = (o.name || "").toLowerCase();
      if (o.isMesh) {
        blockers.push(o);
      }
    });
  }

  function orbit(dx, dy) {
    pose.yaw -= dx * 0.005;
    pose.pitch = THREE.MathUtils.clamp(
      pose.pitch + dy * 0.0035, allowed.minPitch, allowed.maxPitch
    );
  }
  function zoom(wheelDelta) {
    pose.distance = THREE.MathUtils.clamp(
      pose.distance + Math.sign(wheelDelta) * 0.65,
      allowed.minDistance, allowed.maxDistance
    );
  }
  function reset(outdoor = false) {
    pose.yaw = outdoor ? 0.45 : 0.35;
    pose.pitch = outdoor ? 0.29 : 0.24;
    pose.distance = outdoor ? 10 : 7.5;
    snap();
  }
  function snap() {
    update(1, true);
  }
  function update(dt, immediate = false) {
    if (!avatar) return;
    refreshBlockers();

    // Center the camera on the avatar's torso: feet and head remain visible.
    anchor.copy(avatar.position).add(new THREE.Vector3(0, 1.0, 0));
    view.set(
      Math.sin(pose.yaw) * Math.cos(pose.pitch),
      Math.sin(pose.pitch),
      Math.cos(pose.yaw) * Math.cos(pose.pitch)
    ).normalize();

    let safeDistance = pose.distance;
    // Pull in temporarily when the camera would pass through a wall.
    // At close range, widen the field of view to preserve full-body framing.
    if (blockers.length) {
      ray.set(anchor, view);
      ray.near = 0.15;
      ray.far = pose.distance;
      const hit = ray.intersectObjects(blockers, false).find(h => h.object.visible);
      if (hit) safeDistance = Math.max(3.6, Math.min(safeDistance, hit.distance - 0.35));
    }
    // Portrait view needs enough horizontal room for shoulders too.
    const halfFov = THREE.MathUtils.degToRad(64 / 2);
    const halfWidth = Math.atan(Math.tan(halfFov) * camera.aspect);
    safeDistance = Math.max(safeDistance, .55 / Math.sin(halfWidth));
    desired.copy(anchor).addScaledVector(view, safeDistance);
    const alpha = immediate ? 1 : 1 - Math.exp(-7.5 * Math.min(dt, 0.05));
    camera.position.lerp(desired, alpha);
    const fov = safeDistance < 4.9 ? 70 : 64;
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, fov, alpha);
      camera.updateProjectionMatrix();
    }
    camera.lookAt(anchor);
  }
  return {pose, update, orbit, zoom, reset, snap, refreshBlockers};
}
