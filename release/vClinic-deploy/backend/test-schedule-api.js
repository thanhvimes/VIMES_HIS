// Test schedule API
const fetch = require('node-fetch');

async function testScheduleAPI() {
    const url = 'http://localhost:3000/api/v1/schedule/slots?deptId=KB&specialityCode=1&date=2026-01-19';

    console.log('Testing:', url);

    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testScheduleAPI();
