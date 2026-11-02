import bpy, hashlib, json
from mathutils import Vector
slab_names=['SLAB_3.1','SLAB_6.3','SLAB_9.5']
def fingerprint(o):
 d={'matrix':[list(r) for r in o.matrix_world],'type':o.type,'data':o.data.name if o.data else None}
 if o.type=='MESH':
  d['vertices']=[list(v.co) for v in o.data.vertices]
  d['faces']=[list(p.vertices) for p in o.data.polygons]
  d['materials']=[m.name if m else None for m in o.data.materials]
 return hashlib.sha256(json.dumps(d,sort_keys=True).encode()).hexdigest()
protected={o.name:fingerprint(o) for o in bpy.data.objects if o.name not in slab_names}
def zb(o):
 p=[o.matrix_world@Vector(c) for c in o.bound_box]
 return min(v.z for v in p),max(v.z for v in p)
sources=[o for o in bpy.data.objects if (o.name.startswith('STAIR_Flight') or o.name.startswith('STAIR_FloorLanding') or o.name.startswith('STAIR_MidLanding') or o.name.startswith('STAIR_MidGuard')) and zb(o)[1]<=3.201 and zb(o)[0]>=-0.001]
assert len(sources)==23, len(sources)
created=[]
for source in sources:
 obj=source.copy()
 if 'hf_id' in obj: del obj['hf_id']
 obj.data=source.data.copy()
 obj.name='CONNECT_3F_4F_'+source.name
 for collection in source.users_collection: collection.objects.link(obj)
 matrix=source.matrix_world.copy()
 matrix.translation.z+=9.6
 obj.matrix_world=matrix
 created.append(obj.name)
for name in slab_names:
 slab=bpy.data.objects[name]
 slab.data=slab.data.copy()
 bpy.ops.mesh.primitive_cube_add(size=1, location=((9.94+12.05)/2,(-7.62-4.91)/2,slab.matrix_world.translation.z))
 cutter=bpy.context.object
 cutter.name='TEMP_EV_OPENING'
 cutter.dimensions=(12.05-9.94,7.62-4.91,1.2)
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 modifier=slab.modifiers.new('EV_shaft_opening','BOOLEAN')
 modifier.operation='DIFFERENCE'
 modifier.solver='EXACT'
 modifier.object=cutter
 bpy.context.view_layer.objects.active=slab
 bpy.ops.object.modifier_apply(modifier=modifier.name)
 bpy.data.objects.remove(cutter,do_unlink=True)
bpy.context.view_layer.update()
assert all(fingerprint(bpy.data.objects[n])==h for n,h in protected.items()), 'Unrelated geometry changed'
probes=[]
for name in slab_names:
 o=bpy.data.objects[name];inv=o.matrix_world.inverted()
 for x,y in [(11,-6.265),(10.1,-7.4),(11.9,-5.1)]:
  hit,*_=o.ray_cast(inv@Vector((x,y,30)),(inv.to_3x3()@Vector((0,0,-1))).normalized())
  assert not hit,(name,x,y)
  probes.append({'slab':name,'x':x,'y':y,'clear':not hit})
tops=[zb(bpy.data.objects[n])[1] for n in created if 'Flight' in n]
assert abs(max(tops)-12.8)<0.001
result={'protected_objects_unchanged':len(protected),'created':created,'added_steps':len(tops),'top_step':max(tops),'shaft_probe_results':probes,'limitations':'Existing provisional shaft XY retained; plan registration, B1 openings, visual and browser circulation checks still required.'}

