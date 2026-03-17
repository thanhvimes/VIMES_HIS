// ============================================
// 🔍 VCLINIC DEBUG SCRIPT - Paste vào Browser Console
// ============================================

console.clear();
console.log('%c🔍 vClinic Debug Script', 'font-size: 20px; font-weight: bold; color: #667eea;');
console.log('%c================================================', 'color: #667eea;');

// Step 1: Check localStorage
console.log('\n%c📋 STEP 1: Checking localStorage', 'font-size: 16px; font-weight: bold; color: #27ae60;');
const currentUser = localStorage.getItem('currentUser');
const authToken = localStorage.getItem('auth_token');

console.log('localStorage.length:', localStorage.length);
console.log('All keys:', Object.keys(localStorage));

if (currentUser) {
    console.log('%c✅ currentUser EXISTS', 'color: #27ae60; font-weight: bold;');
    try {
        const parsed = JSON.parse(currentUser);
        console.log('Parsed data:', parsed);
        if (parsed.token) {
            console.log('%c✅ HAS TOKEN', 'color: #27ae60; font-weight: bold;');
            console.log('Token preview:', parsed.token.substring(0, 50) + '...');
        } else {
            console.log('%c❌ NO TOKEN in currentUser!', 'color: #e74c3c; font-weight: bold;');
        }
    } catch (e) {
        console.log('%c❌ Parse error:', 'color: #e74c3c; font-weight: bold;', e.message);
    }
} else {
    console.log('%c❌ currentUser NOT FOUND', 'color: #e74c3c; font-weight: bold;');
}

if (authToken) {
    console.log('%c⚠️ auth_token EXISTS (OLD KEY!)', 'color: #f39c12; font-weight: bold;');
}

// Step 2: Test apiClient logic
console.log('\n%c🔧 STEP 2: Testing apiClient getAuthToken() logic', 'font-size: 16px; font-weight: bold; color: #27ae60;');

function testGetAuthToken() {
    const userSession = localStorage.getItem('currentUser');
    console.log('localStorage.getItem("currentUser"):', userSession ? 'EXISTS' : 'NULL');

    if (userSession) {
        try {
            const parsed = JSON.parse(userSession);
            const token = parsed.token || null;

            if (token) {
                console.log('%c✅ Token extracted successfully', 'color: #27ae60; font-weight: bold;');
                console.log('Token:', token.substring(0, 50) + '...');
                console.log('Authorization header would be:', `Bearer ${token.substring(0, 30)}...`);
                return token;
            } else {
                console.log('%c❌ NO TOKEN in parsed data', 'color: #e74c3c; font-weight: bold;');
                return null;
            }
        } catch (e) {
            console.log('%c❌ JSON.parse() failed:', 'color: #e74c3c; font-weight: bold;', e.message);
            return null;
        }
    } else {
        console.log('%c❌ currentUser is NULL', 'color: #e74c3c; font-weight: bold;');
        return null;
    }
}

const extractedToken = testGetAuthToken();

// Step 3: Test actual API call
console.log('\n%c📡 STEP 3: Testing API call with token', 'font-size: 16px; font-weight: bold; color: #27ae60;');

if (extractedToken) {
    console.log('Will test API call with token...');

    fetch('/api/v1/schedule/init', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${extractedToken}`
        },
        body: JSON.stringify({ days: 30 })
    })
        .then(response => {
            console.log('\n%c📥 API Response:', 'font-size: 14px; font-weight: bold; color: #3498db;');
            console.log('Status:', response.status);
            console.log('Status Text:', response.statusText);

            if (response.ok) {
                console.log('%c✅ API CALL SUCCESSFUL!', 'color: #27ae60; font-weight: bold; font-size: 16px;');
            } else {
                console.log('%c❌ API CALL FAILED!', 'color: #e74c3c; font-weight: bold; font-size: 16px;');
            }

            return response.json();
        })
        .then(data => {
            console.log('Response data:', data);

            if (data.success) {
                console.log('%c🎉 SUCCESS! Schedule initialized!', 'color: #27ae60; font-weight: bold; font-size: 18px;');
            } else {
                console.log('%c❌ Failed:', 'color: #e74c3c; font-weight: bold;', data.message);
            }
        })
        .catch(error => {
            console.log('%c❌ ERROR:', 'color: #e74c3c; font-weight: bold;', error.message);
        });
} else {
    console.log('%c⚠️ Cannot test API - no token available', 'color: #f39c12; font-weight: bold;');
    console.log('%c💡 You need to login first!', 'color: #3498db; font-weight: bold;');
}

// Step 4: Instructions
console.log('\n%c📖 INSTRUCTIONS:', 'font-size: 16px; font-weight: bold; color: #667eea;');
console.log('%c================================================', 'color: #667eea;');
console.log('1. If you see "currentUser NOT FOUND" → Login first!');
console.log('2. If you see "NO TOKEN in currentUser" → authService.ts is not saving token correctly');
console.log('3. If you see "Token extracted successfully" but API still fails → Check Network tab');
console.log('4. If API call succeeds here but fails in app → Frontend code issue');
console.log('%c================================================', 'color: #667eea;');

console.log('\n%c✅ Debug script completed!', 'font-size: 16px; font-weight: bold; color: #27ae60;');
