const { spawnSync } = require('node:child_process');
const cases=[['evaluate-resilience-criteria.cjs','backend/benchmark-data/acceptance-evidence.sample.json'],['validate-acceptance-evidence.cjs','backend/benchmark-data/acceptance-evidence.sample.json']];
const results=cases.map(([script,file])=>{const r=spawnSync(process.execPath,[`backend/scripts/${script}`,file],{encoding:'utf8'});return{script,status:r.status,passed:r.status===0,stdout:r.stdout.trim()}});console.log(JSON.stringify({results,passed:results.every(x=>x.passed)}));if(results.some(x=>!x.passed))process.exitCode=1;
