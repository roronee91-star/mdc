import base64,re
sp='/tmp/claude-0/-home-claude/3cebc179-b39c-543d-9cec-40bb8e74b996/scratchpad'
h=open('/home/claude/church-site/index.html',encoding='utf-8').read()
glb=base64.b64encode(open('/home/claude/church-site/church-model-release-20261104.glb','rb').read()).decode()
style=re.search(r'<style>(.*?)</style>',h,re.S).group(1)
bodystart=h.index('<body>')+len('<body>'); ms=h.index('<script type="module">')
body=h[bodystart:ms]
mod=h[ms+len('<script type="module">'):h.rindex('</script>')]
def rep(s,old,new):
    assert s.count(old)==1,(old,s.count(old)); return s.replace(old,new)
mod=rep(mod,"import {GLTFLoader} from './vendor/three/loaders/GLTFLoader.js';","import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';")
mod=rep(mod,"import {OrbitControls} from './vendor/three/controls/OrbitControls.js';","import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';")
mod=rep(mod,"    const loader = new GLTFLoader();","""    const loader = new GLTFLoader();
    loader.load = function (url, onLoad, onProgress, onError) {   // 미리보기용: 파일 안에 넣은 모델을 바로 읽음
      const b = atob(window.__GLB_B64); const u = new Uint8Array(b.length);
      for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
      this.parse(u.buffer, '', onLoad, onError);
    };""")
out=f'''<title>물댄동산교회 투어</title>
<style>{style}</style>
<script>window.__GLB_B64="{glb}";</script>
<script type="importmap">{{"imports":{{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"}}}}</script>
{body}
<script type="module">{mod}</script>
'''
open(sp+'/preview.html','w',encoding='utf-8').write(out)
print('preview',round(len(out)/1e6,2),'MB')
