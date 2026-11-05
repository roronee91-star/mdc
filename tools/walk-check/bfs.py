import json, sys, os
from collections import deque
obs = json.load(open(sys.argv[1])); start = tuple(map(float, sys.argv[2].split(','))); R = float(sys.argv[3])
pts = json.loads(sys.argv[4])  # {"name":[x,z], ...}
box = [float(v) for v in sys.argv[5].split(',')]  # xmin,zmin,xmax,zmax
out_png = sys.argv[6] if len(sys.argv) > 6 else None
sx, sz = start
obs = [o for o in obs if not (o['n'] == 'anon' and abs((o['a'][0]+o['a'][2])/2 - sx) < 0.6 and abs((o['a'][1]+o['a'][3])/2 - sz) < 0.6)]
S = 0.025
x0, z0, x1, z1 = box
W = int((x1-x0)/S)+1; H = int((z1-z0)/S)+1
blocked = bytearray(W*H)
SKIP = os.environ.get('SKIP','').split(',') if os.environ.get('SKIP') else []
obs = [o for o in obs if not any(k in o['n'] for k in SKIP)]
def segd(px,pz,ax,az,bx,bz):
    dx,dz=bx-ax,bz-az; L=dx*dx+dz*dz
    t=0 if L==0 else max(0,min(1,((px-ax)*dx+(pz-az)*dz)/L))
    return ((px-ax-t*dx)**2+(pz-az-t*dz)**2)**0.5
def inq(px,pz,q):
    sgn=0
    for k in range(4):
        ax,az=q[k]; bx,bz=q[(k+1)%4]
        c=(bx-ax)*(pz-az)-(bz-az)*(px-ax)
        if c!=0:
            if sgn==0: sgn=1 if c>0 else -1
            elif (c>0)!=(sgn>0): return False
    return True
for o in obs:
    a = o['a']; q = o.get('q')
    import math
    i0 = max(0, math.ceil((a[0]-R-x0)/S)); i1 = min(W-1, math.floor((a[2]+R-x0)/S))
    j0 = max(0, math.ceil((a[1]-R-z0)/S)); j1 = min(H-1, math.floor((a[3]+R-z0)/S))
    for j in range(j0, j1+1):
        row = j*W
        for i in range(i0, i1+1):
            if blocked[row+i]: continue
            if q is None: blocked[row+i] = 1; continue
            px, pz = x0+i*S, z0+j*S
            if inq(px,pz,q) or min(segd(px,pz,*q[k],*q[(k+1)%4]) for k in range(4)) <= R: blocked[row+i] = 1
# 외곽 경계 밖은 막힘
seen = bytearray(W*H)
si, sj = int((sx-x0)/S), int((sz-z0)/S)
if blocked[sj*W+si]: print('START BLOCKED'); 
q = deque([(si, sj)]); seen[sj*W+si] = 1
while q:
    i, j = q.popleft()
    for di, dj in ((1,0),(-1,0),(0,1),(0,-1)):
        a, b = i+di, j+dj
        if 0 <= a < W and 0 <= b < H and not blocked[b*W+a] and not seen[b*W+a]:
            seen[b*W+a] = 1; q.append((a, b))
res = {}
for name, (px, pz) in pts.items():
    pi, pj = int((px-x0)/S), int((pz-z0)/S); rr = int(float(__import__("os").environ.get("TOL","0.5"))/S); ok = False
    for j in range(max(0,pj-rr), min(H, pj+rr+1)):
        for i in range(max(0,pi-rr), min(W, pi+rr+1)):
            if seen[j*W+i]: ok = True; break
        if ok: break
    res[name] = ok
bad = [k for k, v in res.items() if not v]
print(f'R={R}: reachable {len(res)-len(bad)}/{len(res)}', 'UNREACHABLE:', bad[:40])
if out_png:
    from PIL import Image
    im = Image.new('RGB', (W, H))
    px = im.load()
    for j in range(H):
        for i in range(W):
            px[i, j] = (60,60,60) if blocked[j*W+i] else ((120,200,120) if seen[j*W+i] else (230,230,230))
    for name,(x,z) in pts.items():
        i,j=int((x-x0)/S),int((z-z0)/S)
        if 0<=i<W and 0<=j<H: px[i,j]=(0,0,255) if res[name] else (255,0,0)
    im.resize((W*3,H*3), Image.NEAREST).save(out_png)
import os
if os.environ.get('ASCII'):
    ax0,az0,ax1,az1=map(float,os.environ['ASCII'].split(','))
    for j in range(int((az0-z0)/S), int((az1-z0)/S)):
        print(''.join('#' if blocked[j*W+i] else ('.' if seen[j*W+i] else ' ') for i in range(int((ax0-x0)/S), int((ax1-x0)/S))))
