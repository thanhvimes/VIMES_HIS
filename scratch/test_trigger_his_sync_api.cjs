const axios = require('axios');

async function triggerSync() {
    console.log('📡 Triggering HIS Backend sync endpoint directly: POST http://localhost:3001/api/health-check/documents/sync ...');
    try {
        const res = await axios.post('http://localhost:3001/api/health-check/documents/sync', {
            doc_ids: [2215]
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('\n🎉🎉🎉 HIS BACKEND RESPONSE (200):');
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.log(`\n❌ HIS BACKEND ERROR (${err.response?.status}):`);
        console.log(JSON.stringify(err.response?.data || err.message, null, 2));
    }
}

triggerSync();
