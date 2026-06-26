const http = require('http');

function test(userId) {
  const url = `http://localhost:3001/api/queue/surgery-tables?userId=${encodeURIComponent(userId)}`;
  console.log(`Testing: ${url}`);
  http.get(url, (res) => {
    let data = '';
    console.log(`Status Code: ${res.statusCode}`);
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`Response: ${data}`);
    });
  }).on('error', (err) => {
    console.error(`Error: ${err.message}`);
  });
}

test('thamnth');
test('admin');
test('');
