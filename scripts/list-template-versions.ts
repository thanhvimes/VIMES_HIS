import 'dotenv/config';
import { query, pool } from '../src/config/database';

query(`SELECT id, template_id, version, status, artifact_key, sample_data, validation_result->>'valid' AS valid FROM hms_document_template_version ORDER BY id`)
  .then(async result => { console.log(JSON.stringify(result.rows, null, 2)); const tests = await query(`SELECT template_version_id,id,name,test_type,input_data,is_required FROM hms_document_template_test_case ORDER BY template_version_id,id`); console.log(JSON.stringify(tests.rows, null, 2)); })
  .catch(error => { console.error(error); process.exitCode = 1; })
  .finally(() => pool.end());
