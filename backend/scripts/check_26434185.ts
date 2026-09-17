import { query, pool } from '../src/config/database';

async function test() {
  const m = await query('SELECT id, doc_no, patient_name, form_type, send_status, error_message, xml_data FROM health_check_masters WHERE doc_no = $1', ['26434185']);
  console.log('Master row:', {
    id: m.rows[0]?.id,
    doc_no: m.rows[0]?.doc_no,
    patient_name: m.rows[0]?.patient_name,
    send_status: m.rows[0]?.send_status,
    error_message: m.rows[0]?.error_message
  });
  if (m.rows.length) {
    const d = await query('SELECT clinical_data, conclusion_data FROM health_check_details WHERE master_id = $1', [m.rows[0].id]);
    const c = d.rows[0]?.clinical_data || {};
    console.log('Full clinical keys:', Object.keys(c));
    console.log('Ethnic/Admin:', {
      ethnic: c.ethnic,
      dan_toc: c.dan_toc,
      ma_dan_toc: c.ma_dan_toc,
      address: c.address,
      matinh_cu_tru: c.matinh_cu_tru,
      maxa_cu_tru: c.maxa_cu_tru,
      province_name: c.province_name,
      ward_name: c.ward_name,
    });
    const xml = m.rows[0]?.xml_data || '';
    const matchDiaChi = xml.match(/<DIA_CHI>(.*?)<\/DIA_CHI>/);
    const matchMaTinh = xml.match(/<MATINH_CU_TRU>(.*?)<\/MATINH_CU_TRU>/);
    const matchMaXa = xml.match(/<MAXA_CU_TRU>(.*?)<\/MAXA_CU_TRU>/);
    const matchNghe = xml.match(/<MA_NGHE_NGHIEP>(.*?)<\/MA_NGHE_NGHIEP>/);
    console.log('XML tags:', {
      DIA_CHI: matchDiaChi ? matchDiaChi[0] : null,
      MATINH_CU_TRU: matchMaTinh ? matchMaTinh[0] : null,
      MAXA_CU_TRU: matchMaXa ? matchMaXa[0] : null,
      MA_NGHE_NGHIEP: matchNghe ? matchNghe[0] : null,
    });
  }
  await pool.end();
}
test().catch(console.error);
