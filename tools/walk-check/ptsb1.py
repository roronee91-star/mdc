import json, math
s=json.load(open('obsb1.json.seats.json')); P={}
for i,t in enumerate(s):
    dx,dz=-13-t['x'],-17.5-t['z']; L=math.hypot(dx,dz)
    P[f'S{i}']=[t['x']+dx/L*0.42, t['z']+dz/L*0.42]
P.update({'stage':[-10.5,-13.0],'pulpitFront':[-9.6,-13.6],'mother':[-0.2,-13.5],'motherN':[-0.2,-16.0],'engineer':[-5.0,-0.6],'desk':[-6.2,-0.9]})
print(json.dumps(P))
