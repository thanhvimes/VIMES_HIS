import SecurityUtils from '../utils/security';
import { query } from '../config/database';
import { loadHealthCheckSettings } from '../config/health-check-settings';

const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDDUMitnqYjnO55+YmB1G/3/1aEj4BlygA91yia3Hd99PA7D79c2XnHN3PTZxn2nFDnfONg8om6qBxCA8fs5rBsog9ireh91YDe3dm642mEvejqxzRdtuzg4Pb6L2JZzsg5i5skZoKrvYeiF1S63bLxWzh8Vf0g1andSxdrRmAadVEpFXiu10kMtiFU2+Q+KPSquhXh10izuTGPgqibJfiaFNqxrqB+q2cW6EPJLaoHNYaPfkjwXuCAZziLNJLsZiRmJgOBFpsYdAkHwDJlSbERf5UcmE9GfwKih1OhhALU3tz+T++JE3LImLzckFvHIWwJTcRxF8ipLO9l/7oJuNvVAgMBAAECggEAXvNC28Sol9+Ov5VkF82isTlcYg0xKkrNW0Lh5ocPQBh3QP8i1IyU+xgmIruYj57mZeL81wCRnEBlnGIiKzTqx6TxPdO1lpbYk3/efVBY18NLG/fDqVtoRNqYtn+anHY+OFt6DHQZSkxVR6N3+XAVsefayfczm2bDsWTz+Z640aMkpeWm1N7bqSmoeVPDyn/6CliMHHl4+2Hb8k9tUgCHx/KKh/U4/rkHmOfGyVjGGITTeHdbY9DeOpvG76e20i5Rn9pSy9zKKJ9IQ7/2YknhZD7AIHCVK+iFgWv7RkfgCjULM4Lpkbo3hbRhT/QSx+jSROD4UGAK15fYMgarFMB58QKBgQDzSSrq1TErd/EYw+Fy4vDrtLzbiNH7NonfcBVeAliaAK0x8xfT/Pek8RHUrt+u1UD/tMfywqRXU3h+ARCFBbR7nkASN2ht1sSrbxEqUb309des1b0Qzjo3QZvhaEXCVjEDsQGQOMdILBIXVwt45T/jKvpGhpvGIgw6MEtBJ/yJKwKBgQDNhdb5gECUPn5gD6y3whpVLgWIWETNBB7Wim2VaKQFugJMxSXRIqVnsEW1EFg02FLcDHmwPkdsgqKr65HkGmYpnXkX1sfv8/1U5OMlf8LbyBbSVMy8VBjQkdugndFnuMfW2tYgJvdmz7oMHJnaI+ao3eoX29NPYQUBHGMlxVOu/wKBgQDFvqIgsFq//0S7oXOdYzL6EzUyp/otW74jHEJx4CxOOOCN6g5jI4nSypN4sQ9lVzb24OVov6a+yDz3Bjx8Mw/pLs7bP6glJ11CDwv/vuNMuYqtlCmSAF43TZ+7TnrtJAvA+V3Q8SWh1xh5WiocARK1vdgh/QWevUv8/AYfFrZgcwKBgQCHCQ06WZ4UyQrXqvTct9f9Z4OTFgv+eFqas9FUfbBnYtPoBRDX3F+5RQRH9zk9X3Txx/CccA8VqK+hLeJpcT720NSjaSds7W7hvJHSLaOmLE1yXO04QDkdsPgRDCBueeYzsQ1HitK65nljQ9eCkFwZT9VjX7fzS9ex5yjtxD07mQKBgQDXjaYD0PpKmC034w+NX/V6SDOoPpFqDibYwk3JRGhM96UDFNjQCfzY2DRkZeW90nQlldowO8o5DXNlJV+SCFFGfI75BdEHoC1fXPANZbmBMRW6x9szqpa68l5R0LUSyYQWjAHqF4fuc5doF2toz8fUxcSoD3JkNszGyg9SVCp0lQ==
-----END PRIVATE KEY-----`;

const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAw1DIrZ6mI5zuefmJgdRv9/9WhI+AZcoAPdcomtx3ffTwOw+/XNl5xzdz02cZ9pxQ53zjYPKJuqgcQgPH7OawbKIPYq3ofdWA3t3ZuuNphL3o6sc0Xbbs4OD2+i9iWc7IOYubJGaCq72HohdUut2y8Vs4fFX9INWp3UsXa0ZgGnVRKRV4rtdJDLYhVNvkPij0qroV4ddIs7kxj4KomyX4mhTasa6gfqtnFuhDyS2qBzWGj35I8F7ggGc4izSS7GYkZiYDgRabGHQJB8AyZUmxEX+VHJhPRn8CoodToYQC1N7c/k/viRNyyJi83JBbxyFsCU3EcRfIqSzvZf+6Cbjb1QIDAQAB
-----END PUBLIC KEY-----`;

async function main() {
    const encPriv = 'enc:' + SecurityUtils.encrypt(privateKey.trim());
    await query(
        `UPDATE health_check_settings SET vneid_private_key = $1, vneid_public_key = $2, updated_at = NOW() WHERE id = (SELECT id FROM health_check_settings ORDER BY id ASC LIMIT 1)`,
        [encPriv, publicKey.trim()]
    );
    await loadHealthCheckSettings();
    const r = await query(`SELECT id, ma_cskcb, vneid_private_key, vneid_public_key FROM health_check_settings ORDER BY id ASC LIMIT 1`);
    console.log('🎉 SUCCESSFULLY UPDATED RSA KEYS IN DB:', {
        id: r.rows[0].id,
        ma_cskcb: r.rows[0].ma_cskcb,
        priv_len: r.rows[0].vneid_private_key.length,
        pub_preview: r.rows[0].vneid_public_key.substring(0, 35)
    });
}

main().catch(console.error);
