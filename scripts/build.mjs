import { cp, mkdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const source = new URL('../../豆豆暑假学习计划_v1.0/math_bank.json', import.meta.url);
await mkdir(new URL('data/', root), { recursive: true });
await mkdir(new URL('public/data/', root), { recursive: true });
await cp(source, new URL('data/summer-bank.json', root));
await cp(source, new URL('public/data/summer-bank.json', root));
for (const file of ['index.html', 'manifest.webmanifest', 'sw.js']) await cp(new URL(file, root), new URL(`public/${file}`, root));
await mkdir(new URL('public/icons/', root), { recursive: true });
await cp(new URL('icons/app-icon.svg', root), new URL('public/icons/app-icon.svg', root));
for (const dir of ['js', 'css']) await cp(new URL(`${dir}/`, root), new URL(`public/${dir}/`, root), { recursive: true });
console.log('Built PWA files and copied the 55-question summer bank.');
