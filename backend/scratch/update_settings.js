const { query } = require('../dist/config/database');
const SecurityUtils = require('../dist/utils/security').default;

const vneid_username = '8934285039320_api';
const vneid_password = 'Abc123@#';
const vneid_public_key = `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxzCtlvwFM3R3lgL8IrkdAvjXFeAwZvGGDJyps/2T0OpXfxe3Gqz/guHIJnDr3R9fQCpW1c8i3zPsViZCjTKJA28TDR4XxnGav24bPaWThCHPTg2cS1+Iu/kucruo+elkNPF8aVyp4mrfF81z79SFLmNdpEiqflrB3nVmPZduSqaadGMpyPiz/7kftGDY9O6pShgSZpnhadmvNWiJsiCw/Ydw8uRCpdfAdqc6LQPuQNvOPCQkMFjgI34LmQb4v04cg1mL5K0DwIYyX1AfHRljZAkxpIXDhsLDjcuXoOfvx4z98mbgld7SrrOSVW6/BT4ArZdUQUcwwS9hD/EHB9wO8QIDAQAB`;
const vneid_private_key = `MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDHMK2W/AUzdHeWAvwiuR0C+NcV4DBm8YYMnKmz/ZPQ6ld/F7carP+C4cgmcOvdH19AKlbVzyLfM+xWJkKNMokDbxMNHhfGcZq/bhs9pZOEIc9ODZxLX4i7+S5yu6j56WQ08XxpXKniat8XzXPv1IUuY12kSKp+WsHedWY9l25Kppp0YynI+LP/uR+0YNj07qlKGBJmmeFp2a81aImyILD9h3Dy5EKl18B2pzotA+5A2848JCQwWOAjfguZBvi/ThyDWYvkrQPAhjJfUB8dGWNkCTGkhcOGwsONy5eg5+/HjP3yZuCV3tKus5JVbr8FPgCtl1RBRzDBL2EP8QcH3A7xAgMBAAECggEACD4W/dWmkbI06WDM3hM4zIzfaiLjf9wIWPTh5x5D98/9sEc7Awwj+96T06bmNLmRzYf+/USft9qoQcmeJQWBgtJNqJQdZd9hOOERmKHFlqD3SQ6iQEJ3GBez7MigEbzfIht402uTplhXrF6KqNLLks+G8keVQgqnhXkIUr3FoSo8aArbZC6OcIkeuXncsyauocnkH4uWBneqAEA40eyUCUPgS87anRqCRZ+ceoNUAdbWFbdv1HKHsCxhPUJ48TJFrU5Oa2Uij4jpFBBdbCHOAwqH+A8OvEmDlFBRO94Q95Qve7+MSyMMjjLUcIgZRVBGdHDPTVY2RGAHQV4KzVyv4QKBgQDujbRAmRBbJGafIjLkcV49WyvT+GSW1fV8ZHV6chCp99tjwekiEXPVv2p38Fg2ihUarQNVCW3zwnMgQ3jt7VoTBIIMyOt0mGS8aBguECE4Y29a5pZRBdhR5jVe8IFjdOAi2IDyPpp1Yi+lS+luHvZc9fOpoGhnMqG7SBLWzwOdUQKBgQDVwf8sNKZtsrVCOuml2yKEKSnz5d3fY+bkTaIi9anViYqzKPp5T7XiH/n4A50sMMasVSwGu8ovI+JmyXj/Ba+6mG5UCcw372gNs0H4/fxofkT2d/v8dN5Nik9LgoNFur1qr5qJ9hN9XWBIo6+W3j1rVHMnHnDvLYUuSIz/F2BvoQKBgEOXQPBgriK04KLMJNFXUdVepL9tjMq0GtdA+4xTD2epQ68zPSQa/9AbaUZMgiIJ48roJJ6OimnbuZT1qSj47GGhEFwg/Z3OpBRCBj/e8BqzCdUeqo6QcmdaK9sXmAGfFvaok3iPxmHmDQvvw1chTLqwMXbpbUt4LB0NYdEdXK/RAoGBAL3NFBbcaSrek7PLO8vZWDyhkG7QnMHOoyX1CRKhr7u79TxAFqfA729plTtzegvTA5XhysXv2QcihdVe7+EB25eD4fMdAAhqu6nukZXVcFoYRIPU5hq0au/O77nMmWNA/Q/N/RqjNYsLboMRVMhRbZfv1I/Xp8+4S5ldMlUPHMIBAoGAF1sYLjHcQBeGLKXH2hfCvFXjFwYp9llmtmL/kYbuVo9NeP0KbRKx1J/0HbxJVAZcWLyrb7kY9keZWTLkzQhVIh/LoAtp+8f21WHCOrSsV6xzr9n0ACEWAak08tWl0j7R51I52mySmLyA1KpdCksKwcLLvqGqU3KRqQ2LHOWgI68=`;

async function main() {
    try {
        console.log('Encrypting fields...');
        const enc_password = SecurityUtils.encrypt(vneid_password);
        const enc_private_key = SecurityUtils.encrypt(vneid_private_key);

        console.log('Checking existing settings...');
        const check = await query('SELECT id FROM health_check_settings LIMIT 1');
        if (check.rows.length === 0) {
            console.log('No health check settings found. Creating one...');
            await query(`
                INSERT INTO health_check_settings (
                    vneid_url, vneid_username, vneid_password, vneid_public_key, vneid_private_key, ma_cskcb, ma_gtin_cskcb, auto_sync_enabled, auto_sync_interval
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                'https://admin.csdlksk.vn/api',
                vneid_username,
                enc_password,
                vneid_public_key,
                enc_private_key,
                '12345',
                '12345',
                false,
                60
            ]);
            console.log('Successfully created health check settings.');
        } else {
            console.log('Found health check settings. Updating...');
            await query(`
                UPDATE health_check_settings
                SET vneid_username = $1,
                    vneid_password = $2,
                    vneid_public_key = $3,
                    vneid_private_key = $4
                WHERE id = $5
            `, [
                vneid_username,
                enc_password,
                vneid_public_key,
                enc_private_key,
                check.rows[0].id
            ]);
            console.log('Successfully updated health check settings.');
        }
        
        // Print updated status (decrypted check)
        const updated = await query('SELECT vneid_username, vneid_password, vneid_public_key, vneid_private_key FROM health_check_settings LIMIT 1');
        const row = updated.rows[0];
        console.log('Verification:');
        console.log('vneid_username:', row.vneid_username);
        console.log('vneid_password (decrypted):', SecurityUtils.decrypt(row.vneid_password));
        console.log('vneid_public_key matches:', row.vneid_public_key === vneid_public_key);
        console.log('vneid_private_key matches:', SecurityUtils.decrypt(row.vneid_private_key) === vneid_private_key);
        
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

main();
