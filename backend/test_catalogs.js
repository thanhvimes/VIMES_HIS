
const axios = require('axios');
const BASE_URL = 'http://localhost:3000/api/v1';

const endpoints = [
    '/reception/catalogs/provinces',
    '/reception/catalogs/departments',
    '/reception/catalogs/rooms',
    '/reception/catalogs/ethnicities',
    '/reception/catalogs/occupations',
    '/reception/catalogs/examtypes',
    '/reception/catalogs/objects',
    '/reception/catalogs/nations',
    '/reception/catalogs/relationships'
];

async function test() {
    for (const endpoint of endpoints) {
        try {
            const res = await axios.get(BASE_URL + endpoint);
            console.log(`✅ ${endpoint}: ${res.data.length} items`);
        } catch (e) {
            console.log(`❌ ${endpoint}: ${e.message}`);
        }
    }
}

test();
