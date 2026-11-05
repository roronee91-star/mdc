import json
pX=lambda m:-12.4+m*0.4986; pZ=lambda m:-17.5+m*0.949
P={}
# 의자 '뒤' 통로 지점(의자를 빼고 앉으러 서는 곳)
for c,tx in enumerate([-7.0,-5.4,-3.8]):
  for r,tz in enumerate([pZ(1.7),pZ(5.5),pZ(9.3)]):
    for k in (-0.85,0,0.85):
      P[f'D{c}{r}W{k}']=[tx-0.30-0.42,tz+k]; P[f'D{c}{r}E{k}']=[tx+0.30+0.42,tz+k]
rz0=-15.1; rz3=pZ(9.8); rz=[rz0+(rz3-rz0)*i/3 for i in range(4)]
for i in range(3):
  cz=(rz[i]+rz[i+1])/2
  for k in (-0.23,0.23):
    P[f'G{i+1}W{k}']=[-1.40-0.36,cz+k]; P[f'G{i+1}E{k}']=[-0.82+0.36,cz+k]
P['kitchenW']=[-11.8,-14.0]; P['kitchenE']=[-9.2,-14.0]; P['serve']=[-7.9,-14.85]
P['toilet']=[pX(2.5),pZ(8.0)]; P['storeS']=[-9.5,-9.9]
print(json.dumps(P))
