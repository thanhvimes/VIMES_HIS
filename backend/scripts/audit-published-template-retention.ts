import 'dotenv/config';
import { query } from '../src/config/database';

const retentionDays = Number(process.env.TEMPLATE_PUBLISHED_RETENTION_DAYS || 365);
query(`
  SELECT v.id, t.code, v.version, v.status, v.published_at
  FROM hms_document_template_version v
  JOIN hms_document_template t ON t.id=v.template_id
  WHERE v.status IN ('PUBLISHED','RETIRED')
    AND v.published_at < NOW() - ($1 || ' days')::interval
  ORDER BY v.published_at ASC
`, [retentionDays]).then(result => {
  console.log(JSON.stringify({ retentionDays, candidates: result.rows, count: result.rows.length }));
}).catch(error => { console.error(error); process.exitCode = 1; });
