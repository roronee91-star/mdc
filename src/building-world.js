import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export const FLOORS = [{id:'sanctuary',label:'B1',y:-9.4},{id:'outside',label:'1F',y:0},{id:'education',label:'2F',y:3.2},{id:'community',label:'3F',y:9.6},{id:'terrace',label:'4F',y:12.8}];
const stairHole={x1:4.5,x2:7.5,z1:2.8,z2:8.6};
const liftHole={x1:9.94,x2:12.05,z1:4.91,z2:7.62};
const down=new T.Vector3(0,-1,0);
const sourceName=o=>o.userData.name||o.name;

export class BuildingWorld {
  static async load(){const gltf=await new GLTFLoader().loadAsync('assets/church-environment-20261103.glb');return new BuildingWorld(gltf.scene)}
  constructor(model){
    this.root=model;this.root.name='church-v13';this.root.updateMatrixWorld(true);
    this.repairs=[];this.ray=new T.Raycaster();this.ray.layers.enableAll();this.meshes=[];this.walkables=[];this.solids=[];this.doors=[];
    this.original=new Map();this.root.traverse(o=>{if(o.isMesh)this.original.set(sourceName(o),o)});
    this.trim=new T.MeshStandardMaterial({color:0xd6d0c2,roughness:.7});
    this.fixStructure();this.fitSanctuary();this.expandSanctuary();this.buildRearRooms();this.openDiningHall();this.furnishEducationRooms();this.buildLift();this.index();this.batchVisuals();
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
    // Restore the approved roof transform: the supplied environment export rotated
    // this horizontal slab into a vertical panel extending down into the sanctuary.
    const roof=this.original.get('ROOF_Setback');
    if(roof){roof.position.set(0,15.899999618530273,-6);roof.quaternion.identity();roof.scale.set(1,1,1);roof.updateMatrixWorld(true);this.repairs.push('ROOF_Setback restored to approved horizontal roof at 15.8–16m; no B1 intrusion')}

    // The new landscape base spans through the building; open only its concealed footprint.
    const grass=this.original.get('ENV_Ground_Grass');
    if(grass){this.slab('ENV_Ground_Grass_building_opening',new T.Box3().setFromObject(grass),[{x1:-13.3,x2:13.3,z1:-11.2,z2:11.2}],grass.material);grass.removeFromParent();this.repairs.push('Landscape base opened under building to preserve B1 stair headroom')}

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
  fitSanctuary(){
    const floor=-9.4,ceiling=-.4;
    this.sanctuary={floor,ceiling,height:9,visualHeight:'약 10m',personHeight:1.65,screenWidth:4.4,screenHeight:3.49};
    // Use the full structural clearance below 1F. This is 9m, the closest honest
    // fit to the requested ~10m while preserving the fixed B1/1F elevations.
    const finish=this.root.getObjectByName('B1_Ceiling_core_openings');
    finish.material=new T.MeshStandardMaterial({color:0xe5dfd3,roughness:.95,emissive:0xe5dfd3,emissiveIntensity:.22});
    const backdrop=this.original.get('B1_Stage_Backdrop');
    backdrop.geometry.computeBoundingBox();backdrop.scale.y=8.55/(backdrop.geometry.boundingBox.max.y-backdrop.geometry.boundingBox.min.y);backdrop.position.y=floor+.3+8.55/2;
    const vertical=this.original.get('B1_Cross_Vertical'),horizontal=this.original.get('B1_Cross_Horizontal');
    vertical.geometry.computeBoundingBox();vertical.scale.y=2.75/(vertical.geometry.boundingBox.max.y-vertical.geometry.boundingBox.min.y);vertical.position.y=floor+3;
    horizontal.scale.x=1.6/.8;horizontal.position.y=floor+3.68;
    const frame=new T.MeshStandardMaterial({color:0x202a2b,roughness:.7});
    const screenMaterial=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false});
    this.screen=this.box('B1_Projection_Screen',-10.28,floor+5+3.49/2,-8.18,6.2,3.49,.045,screenMaterial);
    this.screen.quaternion.copy(backdrop.quaternion);
    const border=this.box('B1_Screen_Frame',-10.32,this.screen.position.y,-8.22,6.36,3.65,.06,frame);border.quaternion.copy(backdrop.quaternion);
    // Fine wall bands make the room height readable without changing its footprint.
    const band=new T.MeshStandardMaterial({color:0xaaa08e,roughness:.9});
    this.box('B1_Height_Band_N',0,floor+3,-10.98,26.2,.045,.025,band);
    this.box('B1_Height_Band_W',-13.08,floor+3,0,.025,.045,22,band);
    this.repairs.push('B1 full structural ceiling 9m (visual target ~10m); cross below 6.2 × 3.49m screen; 1.65m adult reference');
  }
  expandSanctuary(){
    const floor=-9.4,wood=this.original.get('B1_StageFan').material;
    this.original.get('B1_StageFan').removeFromParent();
    // Broad fan-shaped platform, with a curved front and clear side approaches.
    const shape=new T.Shape();shape.moveTo(-3.4,0);shape.lineTo(3.4,0);shape.lineTo(5.4,-3.3);shape.quadraticCurveTo(0,-5.5,-5.4,-3.3);shape.closePath();
    const geometry=new T.ExtrudeGeometry(shape,{depth:.3,bevelEnabled:false,curveSegments:24});geometry.rotateX(-Math.PI/2);
    const stage=new T.Mesh(geometry,wood);stage.name='B1_Expanded_Stage';stage.rotation.y=Math.PI/4;stage.position.set(-10.5,floor,-8.4);this.root.add(stage);this.stage=stage;
    // A 15cm intermediate step makes the 30cm platform accessible from the aisle.
    const step=this.box('B1_Stage_Approach_Step',-7.18,floor+.075,-5.08,2.4,.15,.7,wood);step.rotation.y=Math.PI/4;
    for(const n of ['B1_Pulpit','B1_PulpitTop']){const o=this.original.get(n);o.scale.x*=1.8;o.scale.z*=1.35}
    this.original.get('B1_Stage_Backdrop').scale.x*=1.4;
    this.sanctuary.screenWidth=6.2;
    const fabric=new T.MeshStandardMaterial({color:0xaaa394,roughness:.95});
    for(const [n,o]of this.original){if(/^B1_Pew_\d+_(Seat|Back)$/.test(n))o.material=fabric;
      if(/^B1_Pew_0[012]_/.test(n)){const dx=o.position.x+12.8,dz=o.position.z+10.7,l=Math.hypot(dx,dz);o.position.x+=dx/l*.6;o.position.z+=dz/l*.6}
    }
    const added=new Map();
    const rows=[[25,21,.315,1.26],[26,22,.65,1.126],[27,23,1.126,.65],[28,24,1.26,.315],[29,26,.65,1.126],[30,27,1.126,.65],[31,28,1.26,.315],[32,31,1.26,.315],[33,30,1.126,.65],[34,32,1.26,.315],
      [38,30,1.126,.65],[39,31,1.26,.315]];
    for(const[id,source,dx,dz]of rows){const prefix='B1_Pew_'+String(source).padStart(2,'0')+'_',next='B1_Pew_'+id+'_';
      const originals=source<25?[...this.original].filter(([n])=>n.startsWith(prefix)).map(([,o])=>o):added.get(source);
      const copies=originals.map(o=>{const c=o.clone();c.name=(o.userData.name||o.name).replace(prefix,next);c.userData={name:c.name};c.position.x+=dx;c.position.z+=dz;this.root.add(c);return c});added.set(id,copies);
    }
    // One concentric tier per seating row: 12cm steps descend toward the stage.
    this.root.updateMatrixWorld(true);
    const pewMeshes=[];this.root.traverse(o=>{if(o.isMesh&&/^B1_Pew_\d+_/.test(sourceName(o)))pewMeshes.push(o)});
    const center=new T.Vector2(-10.5,-8.4),tiers=new Map();
    for(const o of pewMeshes){const seatName=sourceName(o).match(/^(B1_Pew_\d+)_/)[1];if(!tiers.has(seatName))tiers.set(seatName,Math.max(0,Math.min(11,Math.floor((Math.hypot(o.position.x-center.x,o.position.z-center.y)-5.2)/1.3))))}
    const tierMaterial=new T.MeshStandardMaterial({color:0xb8afa0,roughness:1,side:T.DoubleSide});
    // Build clipped quarter-ring terraces instead of full rings. The clipping
    // keeps the raised seating floor out of the rear rooms and lift corridor;
    // the inner vertical quads make every 12cm descent visible as a real step.
    for(let i=0;i<=11;i++){
      const inner=5.2+i*1.3,outer=inner+1.3,y=floor+i*.12+.02,positions=[];
      for(let s=0;s<128;s++){
        const a=s/128*Math.PI/2,b=(s+1)/128*Math.PI/2;
        const p=(r,t,h)=>[center.x+Math.sin(t)*r,h,center.y+Math.cos(t)*r];
        const ia=p(inner,a,y),ib=p(inner,b,y),oa=p(outer,a,y),ob=p(outer,b,y);
        const valid=([x,,z])=>x<=8&&z<=6.4&&!(x>5.3&&z>.6&&z<2.2)&&!(x>4.3&&x<7.8&&z>2.5&&z<6.5);
        if(![ia,ib,oa,ob].every(valid))continue;
        positions.push(...ia,...oa,...ob,...ia,...ob,...ib);
        if(i>0){const low=y-.12;positions.push(...p(inner,a,low),...ia,...ib,...p(inner,a,low),...ib,...p(inner,b,low))}
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.computeVertexNormals();
      const tier=new T.Mesh(g,tierMaterial);tier.name='B1_Seating_Tier_'+i;this.root.add(tier);
    }
    // A conventional eight-step aisle descends from the seating rake to the
    // original B1 stair landing, eliminating the former jump and loose wedges.
    for(let i=0;i<9;i++){
      const h=(9-i)*.12;
      this.box('B1_Seating_Tier_AisleStep_'+i,4.45+(i+.5)*.4,floor+h/2,1.4,.405,h,1.55,tierMaterial);
    }
    for(const o of pewMeshes)o.position.y+=tiers.get(sourceName(o).match(/^(B1_Pew_\d+)_/)[1])*.12;
    // Four separate cushions per bench echo the reference seating without losing the existing pew frames.
    this.root.updateMatrixWorld(true);const seatParts=[];this.root.traverse(o=>{if(o.isMesh&&/^B1_Pew_\d+_(Seat|Back)$/.test(sourceName(o)))seatParts.push(o)});
    for(const o of seatParts){const name=sourceName(o),isSeat=name.endsWith('_Seat');o.material=wood;
      for(let i=0;i<4;i++){const point=o.localToWorld(new T.Vector3(-.9+i*.6,isSeat?.095:0,isSeat?0:-.085));const pad=this.box(name.replace(/_(Seat|Back)$/,'')+(isSeat?'_Cushion_':'_Upholstery_')+i,point.x,point.y,point.z,.54,isSeat?.055:.48,isSeat?.4:.055,fabric);pad.quaternion.copy(o.quaternion);if(!isSeat){const rear=o.localToWorld(new T.Vector3(-.9+i*.6,0,.085));const cushion=this.box(name.replace(/_Back$/,'')+'_RearUpholstery_'+i,rear.x,rear.y,rear.z,.54,.48,.055,fabric);cushion.quaternion.copy(o.quaternion)}}
    }
    const timber=new T.MeshStandardMaterial({color:0xb59a72,roughness:.9});
    const backdropTrim=new T.Group();backdropTrim.position.set(-10.5,floor+.3,-8.4);backdropTrim.rotation.y=Math.PI/4;this.root.add(backdropTrim);
    for(let i=0;i<28;i++)this.box('B1_Acoustic_Slat_'+i,-3.375+i*.25,1.325,.12,.12,2.65,.035,timber,backdropTrim);
    const trackMaterial=new T.MeshStandardMaterial({color:0x33312b,roughness:.8}),lampMaterial=new T.MeshBasicMaterial({color:0xffdca3,toneMapped:false});
    for(const [row,v,width]of [[0,5,8],[1,9,12],[2,13,12]]){
      const track=new T.Group();track.position.set(-10.5+v/Math.SQRT2,floor+8.65,-8.4+v/Math.SQRT2);track.rotation.y=Math.PI/4;this.root.add(track);
      this.box('B1_Lighting_Track_'+row,0,0,0,width,.055,.06,trackMaterial,track);
      for(let u=-width/2+.5;u<width/2;u+=1.5){this.box('B1_Light_Housing',u,-.09,0,.13,.15,.17,trackMaterial,track);this.box('B1_Light_Diffuser',u,-.17,.015,.11,.018,.14,lampMaterial,track)}
    }
    this.sanctuary.pewCount=37;this.sanctuary.stageWidth=10.8;this.sanctuary.stageDepth=4.4;this.sanctuary.frontAisleClearance=.9;this.sanctuary.tierRise=.12;this.sanctuary.tierCount=12;
    this.repairs.push('Expanded curved stage 10.8m × 4.4m; 37 upholstered pews on 12 descending 12cm terraces; 0.9m minimum front circulation band');
  }
  buildRearRooms(){
    const floor=-9.4,front=7.4,back=10.98,height=3;
    for(const name of ['B1_Room_Front_A_0','B1_Room_Front_A_-7','B1_South_Room_Partition_-4','B1_South_Room_Partition_3'])this.original.get(name)?.removeFromParent();
    const wall=new T.MeshStandardMaterial({color:0xd9d3c7,roughness:.9});
    const timber=new T.MeshStandardMaterial({color:0x917957,roughness:.85});
    const glass=new T.MeshStandardMaterial({color:0xb9d9df,transparent:true,opacity:.2,depthWrite:false,roughness:.15,side:T.DoubleSide});
    const floorMaterial=new T.MeshStandardMaterial({color:0xbab09c,roughness:1});
    const ceilingMaterial=new T.MeshStandardMaterial({color:0xe5dfd3,roughness:.95,emissive:0xe5dfd3,emissiveIntensity:.22}),roomLight=new T.MeshBasicMaterial({color:0xffeccb,toneMapped:false});
    const fabric=new T.MeshStandardMaterial({color:0x9ba997,roughness:1});
    const dark=new T.MeshStandardMaterial({color:0x37474a,roughness:.7});
    const display=new T.MeshBasicMaterial({color:0x467f8e,toneMapped:false});
    this.roomSigns=[];
    this.rearRooms=[{id:'Mother',label:'자모실',detail:'보호자 · 유아',x1:-13,x2:-4.1,door:[-5.6,-4.4],window:[-11.9,-6.2]},
      {id:'Engineer',label:'엔지니어룸',detail:'음향 · 영상',x1:-4.1,x2:3.1,door:[1.5,2.7],window:[-3.4,.9]}];
    for(const r of this.rearRooms){
      const prefix='B1_'+r.id+'_',width=r.x2-r.x1,center=(r.x1+r.x2)/2,[d1,d2]=r.door,[w1,w2]=r.window;
      r.front=front;r.back=back;r.floor=floor;r.height=height;r.doorCenter=(d1+d2)/2;
      this.box(prefix+'floor',center,floor+.0075,(front+back)/2,width-.12,.015,back-front-.12,floorMaterial);
      this.box(prefix+'Ceiling',center,floor+height+.06,(front+back)/2,width,.12,back-front,ceilingMaterial);
      this.box(prefix+'Ceiling_Light',center,floor+height-.04,(front+back)/2,1.2,.035,.5,roomLight);
      this.box(prefix+'Rear_Wall',center,floor+height/2,back,width,height,.12,wall);
      for(const[a,b]of[[r.x1,w1],[w2,d1],[d2,r.x2]])this.box(prefix+'Front_Pier',(a+b)/2,floor+height/2,front,b-a,height,.14,wall);
      this.box(prefix+'Window_Sill',(w1+w2)/2,floor+.5,front,w2-w1,1,.14,wall);
      this.box(prefix+'Window_Header',(w1+w2)/2,floor+2.65,front,w2-w1,.7,.14,wall);
      this.box(prefix+'View_Glass',(w1+w2)/2,floor+1.65,front,w2-w1,1.3,.035,glass);
      for(const y of [1,2.3])this.box(prefix+'Window_Frame',(w1+w2)/2,floor+y,front-.08,w2-w1,.045,.05,timber);
      for(let x=w1;x<=w2+.001;x+=(w2-w1)/3)this.box(prefix+'Window_Mullion',x,floor+1.65,front-.08,.045,1.3,.05,timber);
      this.box(prefix+'Door_Header',r.doorCenter,floor+2.6,front,d2-d1,.8,.14,wall);
      for(const x of[d1,d2])this.box(prefix+'Door_Jamb',x,floor+1.1,front,.05,2.2,.18,timber);
      // Fixed-open door leaf: 1.2m framed opening, no hidden teleport or missing wall.
      this.box(prefix+'Open_Door',d2-.035,floor+1.075,front+.59,.055,2.15,1.12,timber);
      const sign=new T.Mesh(new T.PlaneGeometry(1.8,.46),new T.MeshBasicMaterial({color:0xffffff,toneMapped:false}));sign.name=prefix+'Room_Sign';sign.position.set(r.doorCenter,floor+2.57,front-.09);sign.rotation.y=Math.PI;this.root.add(sign);this.roomSigns.push({mesh:sign,label:r.label,detail:r.detail});
    }
    for(const x of[-13,-4.1,3.1])this.box('B1_Rear_Room_Side_Wall',x,floor+height/2,(front+back)/2,.14,height,back-front,wall);
    for(const x of[-10.8,-7.4]){this.box('B1_Mother_Sofa_Base',x,floor+.24,10.25,2.5,.48,.7,timber);this.box('B1_Mother_Sofa_Cushion',x,floor+.51,10.2,2.4,.12,.65,fabric);this.box('B1_Mother_Sofa_Back',x,floor+.84,10.57,2.5,.6,.14,fabric)}
    this.box('B1_Mother_Play_floor',-8.5,floor+.022,8.9,3.5,.014,1.2,fabric);
    this.box('B1_Mother_Changing_Cabinet',-12.3,floor+.43,8.7,.8,.86,1.1,timber);
    this.box('B1_Mother_Changing_Pad',-12.3,floor+.9,8.7,.76,.08,1.04,fabric);
    this.box('B1_Engineer_Console_Base',-1.2,floor+.34,8.04,4,.68,.7,timber);
    this.box('B1_Engineer_Console_Top',-1.2,floor+.74,8.04,4.1,.12,.8,dark);
    for(const x of[-2.5,-.5]){this.box('B1_Engineer_Monitor',x,floor+1.08,7.85,.75,.44,.06,display);this.box('B1_Engineer_Control_Surface',x,floor+.83,8.19,.8,.06,.35,dark);this.box('B1_Engineer_Chair_Base',x,floor+.24,9.25,.5,.48,.5,dark);this.box('B1_Engineer_Chair_Back',x,floor+.77,9.48,.5,.6,.08,dark)}
    this.box('B1_Engineer_Equipment_Rack',-3.5,floor+.85,10.25,.65,1.7,.65,dark);
    this.repairs.push('Rear fragments replaced by separate Mother and Engineer rooms with continuous walls, ceilings, viewing windows and 1.2m open doorways');
  }
  openDiningHall(){
    // Upper_Setback_Glass is the 3F front curtain wall. Keep it continuous and
    // move all dining rows behind it so no table is split by the facade plane.
    for(const [name,o] of this.original)if(/^03_Dining_3_/.test(name))o.removeFromParent();
    const rowTargets=[-3.7,-5.9,-8];
    for(const [name,o] of this.original){const match=name.match(/^03_Dining_[0-2]_(\d+)_/);if(match)o.position.z+=rowTargets[Number(match[1])]-[-1.1,-4.1,-7.1][Number(match[1])]}
    // Close the previously open rear elevation without cutting through the hall:
    // an opaque sill and upper glazing sit on the actual rear boundary at z=-9m.
    const wall=new T.MeshStandardMaterial({color:0xd6d0c2,roughness:.9});
    const glass=new T.MeshStandardMaterial({color:0xa8c7cc,transparent:true,opacity:.38,depthWrite:false,roughness:.18,side:T.DoubleSide});
    const frame=new T.MeshStandardMaterial({color:0x6f7775,roughness:.75});
    this.box('03_Dining_Rear_Sill',1.45,10.05,-8.98,12.78,.9,.14,wall);
    this.box('03_Dining_Rear_Glass',1.45,11.55,-8.98,12.78,2.1,.055,glass);
    this.box('03_Dining_Rear_Header',1.45,12.55,-8.98,12.78,.1,.16,frame);
    for(let x=-4.94;x<=7.85;x+=1.6)this.box('03_Dining_Rear_Mullion',x,11.55,-8.91,.055,2.1,.07,frame);
    this.diningHall={floor:9.6,tableRows:3,frontGlazingContinuous:true,rearEnclosed:true,bounds:{x1:-4.2,x2:4.2,z1:-8.9,z2:-2.85}};
    this.repairs.push('3F front curtain wall restored continuously; all three dining rows moved behind facade glazing; rear elevation enclosed');
  }
  furnishEducationRooms(){
    const floor=3.2,wood=new T.MeshStandardMaterial({color:0xb58c5a,roughness:.88}),fabric=new T.MeshStandardMaterial({color:0x9caa9e,roughness:1});
    const large={id:'GroupRoom',label:'소그룹실',x:-.8,z:-4.1};
    this.box('02_GroupRoom_TableTop',large.x,floor+.76,large.z,3.6,.1,1.4,wood);
    for(const x of[large.x-1.48,large.x+1.48])for(const z of[large.z-.48,large.z+.48])this.box('02_GroupRoom_TableLeg',x,floor+.37,z,.12,.74,.12,wood);
    for(const x of[-2.15,-1.25,-.35,.55])for(const side of[-1,1]){
      const z=large.z+side*1.05,i=(side+1)*2+Math.round((x+2.15)/.9),seat=this.box('02_GroupRoom_ChairSeat_'+i,x,floor+.46,z,.55,.09,.52,fabric);
      this.box('02_GroupRoom_ChairBase_'+i,x,floor+.23,z,.12,.46,.12,wood);const back=this.box('02_GroupRoom_ChairBack_'+i,x,floor+.78,z+side*.22,.55,.56,.08,fabric);back.rotation.y=0;
    }
    const prayer=[{id:'PrayerA',label:'기도실 1',x:7.25,z:-.83},{id:'PrayerB',label:'기도실 2',x:7.25,z:-4.08}];
    for(const room of prayer)for(let i=0;i<4;i++){const dx=(i%2-.5)*1.1,dz=(Math.floor(i/2)-.5)*1.1;this.box('02_'+room.id+'_FloorCushion_'+i,room.x+dx,floor+.09,room.z+dz,.72,.18,.72,fabric)}
    this.educationRooms={rooms:[{...large,center:[large.x,floor,large.z]},...prayer.map(r=>({...r,center:[r.x,floor,r.z]}))],tables:1,chairs:8,cushions:8};
    this.repairs.push('2F large group room furnished with meeting table and eight chairs; two small prayer rooms furnished with eight floor cushions');
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
      if(!landingDoor&&/SLAB|Floor$|floor|Sidewalk|Road|Flight|STAIR_[AB]_|Landing|GroundLanding|Stage|Podium|Seating_Tier/i.test(name))this.walkables.push(o);
      // Stair risers are handled by step-up support, not horizontal wall collision.
      if(landingDoor||!/Flight|STAIR_[AB]_|Landing|Seating_Tier|CoreMarker|ParkingStripe|JOINT_|FRAME_|FIN_|RailPost|CeilingLamp|Light|Sign|Text/i.test(name))this.solids.push(o);
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
      geometry.setAttribute('sourceVisibility',new T.BufferAttribute(new Float32Array(geometry.attributes.position.count).fill(1),1));
      const mesh=new T.Mesh(geometry,batch.material.clone());mesh.userData.visualBatch=true;mesh.name='Render_batch_'+batch.material.name;
      mesh.castShadow=true;mesh.receiveShadow=true;this.root.add(mesh);this.visualBatches.push(mesh);
      let start=0;for(const original of batch.originals){const count=original.geometry.attributes.position.count;original.layers.set(1);original.userData.visualProxy=mesh;original.userData.visualRange={start,count};start+=count}
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
  candidates(list,min,max){const bounds=new T.Box3(min,max);return list.filter(o=>o.visible&&!o.userData.noCollision&&o.userData.worldBounds.intersectsBox(bounds))}
  support(x,z,y){
    this.ray.set(new T.Vector3(x,y+.24,z),down);this.ray.near=0;this.ray.far=.55;
    const candidates=this.candidates(this.walkables,new T.Vector3(x-.01,y-.31,z-.01),new T.Vector3(x+.01,y+.24,z+.01));
    const hit=this.ray.intersectObjects(candidates,false).find(h=>h.face.normal.clone().transformDirection(h.object.matrixWorld).y>.55);
    return hit?hit.point.y:null;
  }
  clearBody(x,z,y){
    const radius=.2;
    const min=new T.Vector3(x-radius,y+.26,z-radius),max=new T.Vector3(x+radius,y+1.65,z+radius);
    const nearby=this.candidates(this.solids,min,max);
    // Cardinal and diagonal capsule cross sections detect actual holes, not whole-mesh boxes.
    for(const h of [.30,.95,1.62])for(let i=0;i<8;i++){
      const angle=i*Math.PI/4,direction=new T.Vector3(Math.cos(angle),0,Math.sin(angle));
      this.ray.set(new T.Vector3(x,y+h,z),direction);this.ray.near=0;this.ray.far=radius;
      if(this.ray.intersectObjects(nearby,false).length)return false;
    }
    this.ray.set(new T.Vector3(x,y+.25,z),new T.Vector3(0,1,0));this.ray.far=1.4;
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
  spawn(id){const f=FLOORS.find(f=>f.id===id)||FLOORS[1];if(id==='outside')return new T.Vector3(14,-.05,2.5);if(id==='community')return new T.Vector3(4.7,f.y,-3.35);return new T.Vector3(7.85,f.y,2.5)}
}
