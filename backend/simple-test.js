const http = require('http');

console.log('Testing vClinic API...\n');

// Step 1: Login
const loginData = JSON.stringify({
    userId: 'admin',
    password: 'Dunghoi1'
});

const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
};

const loginReq = http.request(loginOptions, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        const data = JSON.parse(body);

        if (data.token) {
            console.log('LOGIN SUCCESS!');
            console.log('Token:', data.token.substring(0, 50) + '...');

            // Step 2: Test schedule init with token
            const scheduleData = JSON.stringify({ days: 30 });
            const scheduleOptions = {
                hostname: 'localhost',
                port: 3000,
                path: '/api/v1/schedule/init',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.token}`,
                    'Content-Length': scheduleData.length
                }
            };

            console.log('\nTesting schedule init WITH token...');
            const scheduleReq = http.request(scheduleOptions, (res2) => {
                let body2 = '';
                res2.on('data', chunk => body2 += chunk);
                res2.on('end', () => {
                    console.log('Status:', res2.statusCode);
                    console.log('Response:', body2);

                    if (res2.statusCode === 200) {
                        console.log('\nSUCCESS! Backend API works perfectly!');
                        console.log('The problem is in the FRONTEND!');
                    } else {
                        console.log('\nFAILED! Backend rejected the request.');
                    }
                });
            });

            scheduleReq.write(scheduleData);
            scheduleReq.end();
        } else {
            console.log('LOGIN FAILED!');
            console.log(data);
        }
    });
});

loginReq.write(loginData);
loginReq.end();
