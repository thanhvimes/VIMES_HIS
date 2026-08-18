const { spawn } = require('node:child_process');
const fs = require('node:fs');
const profiles = ['smoke10','load20','load40','spike5m','sustained30m'];
const out = process.env.BENCHMARK_OUTPUT || './benchmark-results'; fs.mkdirSync(out,{recursive:true});
const run = p => new Promise(resolve => { const child=spawn(process.execPath,['backend/scripts/run-template-load-profiles.cjs',p],{stdio:['ignore','pipe','inherit']}); let data=''; child.stdout.on('data',d=>data+=d); child.on('close',code=>{fs.writeFileSync(`${out}/${p}.json`,JSON.stringify({profile:p,code,output:data.trim(),recordedAt:new Date().toISOString()},null,2));resolve(code)}); });
(async()=>{const codes=[];for(const p of profiles)codes.push(await run(p));console.log(JSON.stringify({profiles,output:out,codes,allStarted:codes.every(c=>c===0)}));if(codes.some(c=>c!==0))process.exitCode=1})().catch(e=>{console.error(e);process.exitCode=1});
