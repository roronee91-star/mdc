// Per-source visibility survives material batching without fading unrelated objects.
export function installOcclusion(material) {
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute float sourceVisibility;\nvarying float vSourceVisibility;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSourceVisibility = sourceVisibility;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vSourceVisibility;')
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif (vSourceVisibility < 0.5) discard;');
  };
  material.customProgramCacheKey = () => 'source-occlusion-v1';
  material.needsUpdate = true;
}
export function setSourceVisibility(mesh, value) {
  const proxy = mesh.userData.visualProxy, range = mesh.userData.visualRange;
  if (!proxy || !range) return false;
  const attribute = proxy.geometry.getAttribute('sourceVisibility');
  attribute.array.fill(value, range.start, range.start + range.count);
  attribute.needsUpdate = true;
  return true;
}
