import { query } from '../src/config/database';

async function clean() {
    console.log('🧹 BẮT ĐẦU DỌN DẸP DỮ LIỆU THỬ NGHIỆM...');

    try {
        // 1. Truncate sync tables
        console.log('- Đang xóa dữ liệu trong health_check_details...');
        await query('TRUNCATE TABLE health_check_details CASCADE');
        console.log('- Đang xóa dữ liệu trong health_check_masters...');
        await query('TRUNCATE TABLE health_check_masters CASCADE');

        // 2. Lấy danh sách doc_no của bệnh nhân test trong hms_doc để xóa hms_exam trước (do FK)
        const testDocs = await query(`
            SELECT hd_docno FROM hms_doc 
            WHERE hd_patientno IN (
                SELECT hp_patientno FROM hms_patient 
                WHERE hp_firstname = 'FILTER' OR hp_workplaceid IN ('COMP_A', 'COMP_B', 'COMP_C')
            )
        `);
        const docNos = testDocs.rows.map(r => r.hd_docno);

        if (docNos.length > 0) {
            console.log(`- Đang xóa ${docNos.length} bản ghi liên quan trong hms_exam...`);
            await query(`DELETE FROM hms_exam WHERE he_docno = ANY($1)`, [docNos]);
        }

        // 3. Xóa hms_doc
        console.log('- Đang xóa các bản ghi liên quan trong hms_doc...');
        await query(`
            DELETE FROM hms_doc 
            WHERE hd_patientno IN (
                SELECT hp_patientno FROM hms_patient 
                WHERE hp_firstname = 'FILTER' OR hp_workplaceid IN ('COMP_A', 'COMP_B', 'COMP_C')
            )
        `);

        // 4. Xóa hms_patient
        console.log('- Đang xóa các bản ghi liên quan trong hms_patient...');
        const deletePatientRes = await query(`
            DELETE FROM hms_patient 
            WHERE hp_firstname = 'FILTER' OR hp_workplaceid IN ('COMP_A', 'COMP_B', 'COMP_C')
        `);
        console.log(`✅ Đã xóa ${deletePatientRes.rowCount} bệnh nhân test khỏi hms_patient.`);

        console.log('🎉 Hoàn thành dọn dẹp dữ liệu!');
    } catch (e: any) {
        console.error('❌ Lỗi khi dọn dẹp:', e.message);
    } finally {
        process.exit(0);
    }
}

clean();
