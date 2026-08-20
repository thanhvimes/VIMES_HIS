const { query } = require('./dist/config/database');

async function main() {
    try {
        console.log("=== Check recent hms_testorder and hms_testorderline ===");
        const orders = await query(`
            SELECT o.hpc_orderid, o.hpc_docno, o.hpc_groupid, l.hpcl_itemid, f.hfl_name, f.hfl_subitem
            FROM hms_testorder o
            JOIN hms_testorderline l ON l.hpcl_orderid = o.hpc_orderid
            JOIN hms_fee_list f ON f.hfl_feeid = l.hpcl_itemid
            ORDER BY o.hpc_orderid DESC, l.hpcl_orderlineid ASC
            LIMIT 30
        `);
        console.log(orders.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

main();
