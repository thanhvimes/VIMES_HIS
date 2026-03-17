
import { pool } from './src/config/database';

async function debugProc() {
    const client = await pool.connect();
    try {
        client.on('notice', (msg: any) => console.log('PG NOTICE:', msg.message));
        
        await client.query(`
            CREATE OR REPLACE FUNCTION debug_json(p_payload JSONB) RETURNS VOID AS $$
            DECLARE
                v_val TEXT;
            BEGIN
                v_val := p_payload->'patient'->>'ethnic';
                RAISE NOTICE 'patient.ethnic: [%]', v_val;
                
                v_val := p_payload->'doc'->>'objectId';
                RAISE NOTICE 'doc.objectId: [%]', v_val;
                
                v_val := p_payload->'exam'->>'roomId';
                RAISE NOTICE 'exam.roomId: [%]', v_val;
                
                v_val := p_payload->'doc'->>'relation';
                RAISE NOTICE 'doc.relation: [%]', v_val;
            END;
            $$ LANGUAGE plpgsql;
        `);

        console.log("Testing with BHYT payload...");
        const payload = {
            patient: { ethnic: 1 },
            doc: { objectId: 'I' },
            exam: { roomId: 5 }
        };

        await client.query("SELECT debug_json($1::jsonb)", [JSON.stringify(payload)]);
        console.log("Done");
        process.exit(0);
    } catch (e: any) {
        console.error("DEBUG FAIL:", e.message);
        process.exit(1);
    } finally {
        client.release();
    }
}
debugProc();
