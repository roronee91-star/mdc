// 화음과 멜로디가 맞는지: 마디마다 첫 음(센박)이 적힌 화음의 음인지 확인
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader'] });
  const ctx = await b.newContext(); await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', 'a'); } catch (e) {} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(5000);
  console.log(await p.evaluate(() => {
    const h = window.__dbg.hymns[0], NI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
    const chordPcs = (c) => { const m = c.match(/^([A-G])([b#]?)(m?)/); const r = (NI[m[1]] + (m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0) + 12) % 12; return [r, (r + (m[3] ? 3 : 4)) % 12, (r + 7) % 12]; };
    const total = h.notes.reduce((a, n) => a + n[1], 0); let pos = 0; const rows = [];
    h.notes.forEach(([n, d]) => { const bp = pos - h.pickup; if (bp >= 0 && Math.abs(bp % h.bar) < 1e-6) { const i = bp / h.bar, c = h.chords[i]; const pc = window.__dbg.midiOf(n) % 12; rows.push(`${i + 1}마디 ${c}: ${n} ${chordPcs(c).includes(pc) ? '✓' : '✗'}`); } pos += d; });
    return `박 합계 ${total} = 못갖춘 ${h.pickup} + ${(total - h.pickup) / h.bar}마디 (화음 ${h.chords.length}개)\n` + rows.join('\n');
  }));
  await p.click('#bgmToggle'); await p.waitForTimeout(1500); console.log('토스트:', await p.textContent('#toast'));
  console.log(errs.join(';') || 'no errors'); await b.close();
})();
