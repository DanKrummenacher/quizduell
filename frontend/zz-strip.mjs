import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
const [, , out, width, ...files] = process.argv;
const img = (f) => 'data:image/png;base64,' + readFileSync(f).toString('base64');
const html = `<body style="margin:0;padding:10px;background:#ccd;display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start">${files.map(f=>`<figure style="margin:0"><figcaption style="font:13px sans-serif">${f.split('/').pop()}</figcaption><img src="${img(f)}" style="width:${width}px;display:block"></figure>`).join('')}</body>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1700, height: 800 } });
await p.setContent(html); await p.screenshot({ path: out, fullPage: true }); await b.close();
