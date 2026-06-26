const axios = require('axios');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');

const cookiesMap = new Map();

function updateCookies(setCookieHeader) {
    if (!setCookieHeader) return;
    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    cookies.forEach(c => {
        const parts = c.split(';')[0].trim().split('=');
        if (parts[0]) {
            cookiesMap.set(parts[0], parts.slice(1).join('='));
        }
    });
}

function getCookieHeader() {
    return Array.from(cookiesMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
}

async function request(url, method = 'GET', data = null, referer = '') {
    const headers = {
        'Host': 'logindkninhbinhthanglong.pmr.vn:8080',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Sec-Fetch-Site': referer ? 'same-origin' : 'none',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-User': '?1',
        'Sec-Fetch-Dest': 'document',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cookie': getCookieHeader()
    };
    
    if (referer) {
        headers['Referer'] = referer;
    }
    
    if (method === 'POST') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        headers['Origin'] = 'http://logindkninhbinhthanglong.pmr.vn:8080';
    }

    const config = {
        method,
        url,
        headers,
        data,
        maxRedirects: 0,
        validateStatus: status => true
    };
    const res = await axios(config);
    updateCookies(res.headers['set-cookie']);
    return res;
}

async function run() {
    const baseUrl = 'http://logindkninhbinhthanglong.pmr.vn:8080';
    const loginUrl = baseUrl + '/Login.aspx';
    
    console.log('1. Fetching login page...');
    const res1 = await request(loginUrl);
    const redirectUrl = baseUrl + res1.headers['location'];
    const res2 = await request(redirectUrl, 'GET', null, loginUrl);
    
    const html = res2.data;
    const viewstate = html.match(/id="__VIEWSTATE" value="([^"]+)"/)?.[1] || '';
    const viewstategenerator = html.match(/id="__VIEWSTATEGENERATOR" value="([^"]+)"/)?.[1] || '';
    const eventvalidation = html.match(/id="__EVENTVALIDATION" value="([^"]+)"/)?.[1] || '';

    console.log('2. Posting login...');
    const requestBody = querystring.stringify({
        '__EVENTTARGET': 'LoginUser$LoginButton',
        '__EVENTARGUMENT': '',
        '__VIEWSTATE': viewstate,
        '__VIEWSTATEGENERATOR': viewstategenerator,
        '__EVENTVALIDATION': eventvalidation,
        'LoginUser$UserName': 'ktv.nbtl',
        'LoginUser$Password': 'nbtl@123'
    });

    const loginRes = await request(redirectUrl, 'POST', requestBody, redirectUrl);
    console.log('Login POST Status:', loginRes.status);
    
    // Follow redirect to /Default.aspx
    const defaultUrl = baseUrl + loginRes.headers['location'];
    const defaultRes = await request(defaultUrl, 'GET', null, redirectUrl);
    console.log('Default.aspx Status:', defaultRes.status);
    
    // Follow redirect to /UserProfilePage/HomePage.aspx
    const homeUrl = baseUrl + defaultRes.headers['location'];
    console.log('Fetching Homepage with full headers...');
    const homeRes = await request(homeUrl, 'GET', null, defaultUrl);
    console.log('Homepage status:', homeRes.status);
    console.log('Homepage Location Header:', homeRes.headers['location']);
}

run().catch(err => {
    console.error('Error executing script:', err);
});
