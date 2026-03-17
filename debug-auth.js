// ==================== DEBUG SCRIPT ====================
// Paste script này vào Console của browser (F12)
// để kiểm tra localStorage và test API

console.clear();
console.log('🔍 ========== DEBUGGING AUTHENTICATION ==========');

// 1. Kiểm tra localStorage
console.log('\n📋 Step 1: Checking localStorage...');
const currentUser = localStorage.getItem('currentUser');
const authToken = localStorage.getItem('auth_token');

console.log('localStorage["currentUser"]:', currentUser ? 'EXISTS' : '❌ NOT FOUND');
console.log('localStorage["auth_token"]:', authToken ? 'EXISTS (OLD KEY!)' : 'not found');

if (currentUser) {
    try {
        const parsed = JSON.parse(currentUser);
        console.log('✅ currentUser data:', parsed);
        console.log('   - Has token:', !!parsed.token);
        console.log('   - Token preview:', parsed.token ? parsed.token.substring(0, 50) + '...' : 'N/A');
        console.log('   - User:', parsed.name);
        console.log('   - DeptId:', parsed.deptId);
    } catch (e) {
        console.error('❌ Error parsing currentUser:', e);
    }
} else {
    console.error('❌ currentUser NOT FOUND in localStorage!');
    console.error('💡 You need to login again!');
}

// 2. Test apiClient.getAuthToken()
console.log('\n🔑 Step 2: Testing token extraction (simulating apiClient)...');
function testGetAuthToken() {
    const userSession = localStorage.getItem('currentUser');
    if (userSession) {
        try {
            const parsed = JSON.parse(userSession);
            return parsed.token || null;
        } catch {
            return null;
        }
    }
    return null;
}

const extractedToken = testGetAuthToken();
console.log('Token extracted by apiClient logic:', extractedToken ? extractedToken.substring(0, 50) + '...' : '❌ NULL');

// 3. Test API call
console.log('\n📡 Step 3: Testing schedule init API...');

if (!extractedToken) {
    console.error('❌ Cannot test API - no token found!');
    console.error('💡 Solution: Run this command to login and save token:');
    console.log(`
// Copy and run this:
fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'admin', password: 'Dunghoi1' })
})
.then(res => res.json())
.then(data => {
    if (data.success) {
        localStorage.setItem('currentUser', JSON.stringify({
            token: data.token,
            ...data.user
        }));
        console.log('✅ Token saved! Reload page and try again.');
        location.reload();
    } else {
        console.error('❌ Login failed:', data.message);
    }
});
    `);
} else {
    console.log('Testing API with token...');

    fetch('http://localhost:3000/api/v1/schedule/init', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${extractedToken}`
        },
        body: JSON.stringify({ days: 30 })
    })
        .then(async (response) => {
            const data = await response.json();
            console.log('\n📊 API Response:');
            console.log('   Status:', response.status);
            console.log('   Data:', data);

            if (response.ok) {
                console.log('✅ API WORKS! The problem is in the frontend code.');
                console.log('💡 Solution: Clear browser cache and reload:');
                console.log('   1. Press Ctrl+Shift+R (hard reload)');
                console.log('   2. Or clear cache: DevTools → Application → Clear storage');
            } else {
                console.error('❌ API failed:', data.message);
                if (response.status === 401) {
                    console.error('💡 Token is invalid or expired. Login again.');
                }
            }
        })
        .catch(err => {
            console.error('❌ Fetch error:', err);
        });
}

console.log('\n🔍 ========== END DEBUG ==========');
