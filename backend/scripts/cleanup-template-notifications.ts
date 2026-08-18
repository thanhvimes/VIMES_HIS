import 'dotenv/config';
import { query, pool } from '../src/config/database';

const retentionDays = Number(process.env.TEMPLATE_NOTIFICATION_RETENTION_DAYS || 90);
query(`DELETE FROM hms_document_template_notification WHERE is_read=true AND created_at < NOW() - ($1 || ' days')::interval`, [retentionDays])
  .then(result => console.log(JSON.stringify({ retentionDays, removed: result.rowCount })))
  .catch(error => { console.error(error); process.exitCode = 1; })
  .finally(() => pool.end());
