const urls = {
  carbone: process.env.CARBONE_HEALTH_URL || 'http://localhost:4000/health',
  api: process.env.API_HEALTH_URL || 'http://localhost:3001/api/health',
  minio: process.env.MINIO_HEALTH_URL || 'http://localhost:9000/minio/health/live'
};
(async()=>{const result={};for(const [name,url] of Object.entries(urls)){const start=Date.now();try{const r=await fetch(url,{signal:AbortSignal.timeout(3000)});result[name]={url,status:r.status,ok:r.ok,ms:Date.now()-start}}catch(error){result[name]={url,ok:false,ms:Date.now()-start,error:String(error)}}}console.log(JSON.stringify({result,allHealthy:Object.values(result).every(x=>x.ok)}));if(!Object.values(result).every(x=>x.ok))process.exitCode=1})().catch(error=>{console.error(error);process.exitCode=1});
