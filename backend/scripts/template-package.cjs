const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');const cp=require('node:child_process');
const [mode,input,output]=process.argv.slice(2);
if(!['export','verify'].includes(mode)||!input){console.error('Usage: template-package.cjs export <dir> <zip> | verify <zip>');process.exit(2)}
if(mode==='export'){
 if(!output)process.exit(2);const files=[];const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else files.push(p)}};walk(input);
 const manifest=files.map(f=>({path:path.relative(input,f).replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')}));fs.writeFileSync(path.join(input,'manifest.json'),JSON.stringify({version:1,files:manifest},null,2));cp.execFileSync('tar',['-a','-c','-f',output,'-C',input,'.']);console.log(JSON.stringify({output,files:manifest.length}));
} else {
 const dir=path.join(process.cwd(),`.template-package-${Date.now()}`);fs.mkdirSync(dir);cp.execFileSync('tar',['-xf',input,'-C',dir]);const m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));const failed=m.files.filter(x=>!fs.existsSync(path.join(dir,x.path))||crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,x.path))).digest('hex')!==x.sha256);console.log(JSON.stringify({file:input,files:m.files.length,failed,passed:!failed.length}));if(failed.length)process.exitCode=1;
}
