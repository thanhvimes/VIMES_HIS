import { query } from '../src/config/database';

async function run() {
    try {
        const res = await query(`
            SELECT f.hfl_feeid, f.hfl_name, f.hfl_unit, f.hfl_regcode, f.hfl_ma_chi_so, f.hfl_groupid, f.hfl_subitem,
                   p.hfl_name AS parent_name, p.hfl_regcode AS parent_regcode, p.hfl_ma_chi_so AS parent_ma_chi_so
            FROM hms_fee_list f
            LEFT JOIN hms_fee_list p ON p.hfl_feeid = f.hfl_subitem
            WHERE f.hfl_ma_chi_so IS NOT NULL AND length(trim(f.hfl_ma_chi_so)) > 0
            LIMIT 20
        `);
        console.log('Sample rows with hfl_ma_chi_so:', JSON.stringify(res.rows, null, 2));
        
        const countRes = await query(`
            SELECT COUNT(*) AS total,
                   COUNT(f.hfl_ma_chi_so) FILTER (WHERE length(trim(f.hfl_ma_chi_so)) > 0) AS has_ma_chi_so,
                   COUNT(f.hfl_regcode) FILTER (WHERE length(trim(f.hfl_regcode)) > 0) AS has_regcode
            FROM hms_fee_list f
        `);
        console.log('Stats:', countRes.rows[0]);
    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}

run();
