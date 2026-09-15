const fs = require('node:fs'); const path = require('node:path'); const crypto = require('node:crypto');
const root = process.argv[2] || process.env.TEMPLATE_ARTIFACT_ROOT || './storage/template-studio';
const files=[]; const walk=d=>{if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else files.push(p)}}; walk(root);
const groups=new Map(); for(const file of files){const h=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); if(!groups.has(h))groups.set(h,[]);groups.get(h).push(file)}
const duplicates=[...groups].filter(([,items])=>items.length>1).map(([sha256,items])=>({sha256,items})); console.log(JSON.stringify({root,files:files.length,duplicateGroups:duplicates.length,duplicates})); if(duplicates.length)process.exitCode=1;
