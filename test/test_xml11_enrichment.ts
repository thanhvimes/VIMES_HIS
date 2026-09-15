import { generateXmlPayload } from '../src/controllers/health-check/xml-generator';
import { query } from '../src/config/database';

async function testXml11() {
    console.log('🧪 Testing XML11 Paraclinical Generation...');

    // 1. Simulating an item with raw HIS code and value with unit
    const item = {
        service_code: 'B1100467',
        value: '4.1 mmol/L',
        unit: 'lần',
        conclusion: 'Bình thường'
    };

    // 2. Fetch metadata from DB
    const res = await query(`
        SELECT TRIM(f.hfl_feeid) AS service_code, 
               TRIM(COALESCE(p.hfl_regcode, f.hfl_regcode, f.hfl_feeid)) AS reg_code,
               TRIM(COALESCE(f.hfl_ma_chi_so, p.hfl_ma_chi_so, p.hfl_regcode, f.hfl_regcode, f.hfl_feeid)) AS ma_chi_so,
               TRIM(COALESCE(f.hfl_ma_chi_so, p.hfl_ma_chi_so, '')) AS hfl_ma_chi_so,
               f.hfl_name AS service_name,
               f.hfl_unit AS unit
        FROM hms_fee_list f
        LEFT JOIN hms_fee_list p ON p.hfl_feeid = f.hfl_subitem
        WHERE f.hfl_feeid = $1
    `, [item.service_code]);

    if (res.rows.length > 0) {
        const meta = res.rows[0];
        (item as any).reg_code = meta.reg_code;
        (item as any).ma_chi_so = meta.ma_chi_so;
        (item as any).hfl_ma_chi_so = meta.hfl_ma_chi_so;
        (item as any).service_name = meta.service_name;
        (item as any).index_name = meta.service_name;
    }

    // 3. Generate XML
    const xml = generateXmlPayload(
        '3',
        { patientName: 'NGUYỄN VĂN A', cccd: '035789641236', dob: '1989-08-25', gender: 'M', docNo: '26401287' },
        {},
        { paraclinical_items: [item] },
        { fitness_class: '1' }
    );

    console.log('--- XML11 Result Snippet ---');
    const match = xml.match(/<KHAM_CAN_LAM_SANG>[\s\S]*?<\/KHAM_CAN_LAM_SANG>/);
    if (match) {
        console.log(match[0]);
    } else {
        console.log('XML11 not found');
    }

    if (!xml.includes('<MA_DICH_VU>H173</MA_DICH_VU>')) {
        throw new Error('Assertion failed: MA_DICH_VU must be taken from hfl_ma_chi_so (H173)');
    }
    console.log('✅ Assertion passed: MA_DICH_VU is correctly taken from hms_fee_list.hfl_ma_chi_so');

    process.exit(0);
}

testXml11();
