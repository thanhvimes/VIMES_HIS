// ==================== RECEPTION INSURANCE CONTROLLER ====================
// File: backend/src/controllers/reception/insurance.controller.ts

import { Request, Response } from 'express';
import { query, transaction } from '../../config/database';
import axios from 'axios';
import { AuthRequest } from '../../middleware/authMiddleware';
import crypto from 'crypto';

export interface InsuranceCardInfo {
    cardNo: string;
    startDate: string;
    endDate: string;
    regCode: string;
    code?: string;
    discount?: number;
    areaCode?: string;
}

export interface DocFlags {
    insLine?: string;
    emergency?: string;
    over5Year?: string;
    over5YearDate?: string | null;
    dateDiscountAll?: string | null;
    maDoituongKCB?: string;
    disRate?: number;
}

import { getBHXHConfig } from '../../config/bhxh';

class ReceptionInsuranceController {
    private tokenCache: { access_token: string; id_token: string; expiresAt: number } | null = null;

    /**
     * Lấy Token BHXH (có cache và hỗ trợ làm mới khi token hết hạn)
     */
    private async getBHXHToken(config: any, forceRefresh = false) {
        const now = Date.now();
        // Nếu token còn hạn (giả định 20 tiếng cho chắc chắn) và không bắt buộc làm mới thì dùng lại
        if (!forceRefresh && this.tokenCache && (this.tokenCache.expiresAt > now)) {
            return this.tokenCache;
        }

        const baseUrl = config.hhgd_url || 'https://egw.baohiemxahoi.gov.vn';
        const md5Password = crypto.createHash('md5').update(config.password || '').digest('hex');

        try {
            console.log(`📡 [BHXH Controller] Requesting new token for ${config.userid}...`);
            const tokenResponse = await axios.post(`${baseUrl}/api/token/take`, {
                username: config.userid,
                password: md5Password
            });

            console.log('📥 [BHXH Controller] Token response status:', tokenResponse.status);
            const authData = (tokenResponse.data as any)?.APIKey;
            if (!authData?.access_token) {
                throw new Error('Không lấy được Token từ cổng BHXH: ' + JSON.stringify(tokenResponse.data));
            }

            this.tokenCache = {
                access_token: authData.access_token,
                id_token: authData.id_token,
                expiresAt: now + 20 * 60 * 60 * 1000 // Cache trong 20 tiếng
            };

            console.log(`✅ [BHXH Controller] New token obtained. Expires at: ${new Date(this.tokenCache.expiresAt).toLocaleString()}`);
            return this.tokenCache;
        } catch (error: any) {
            console.error('❌ [BHXH Controller] getBHXHToken failure:', error.response?.data || error.message);
            throw new Error(`Lỗi kết nối lấy Token BHXH: ${error.message}`);
        }
    }

    /**
     * Kiểm tra thông tin thẻ BHYT qua cổng BHXH
     */
    async checkBHXHCard(req: AuthRequest, res: Response) {
        try {
            const { cardNo, patientName, birthYear } = (req as any).body;
            const staffName = (req as any).user?.name || (req as any).user?.username || 'Cán bộ tiếp nhận';

            console.log(`🔍 [BHXH Controller] Received check request: Card=${cardNo}, Name=${patientName}, By=${staffName}`);

            if (!cardNo || !patientName || !birthYear) {
                return res.status(400).json({ error: 'Thiếu thông tin tra cứu (Số thẻ, Họ tên, Năm sinh)' });
            }

            // Lấy cấu hình từ bộ nhớ (Đã tải ở server startup)
            const config = getBHXHConfig();
            if (!config) {
                console.error('❌ [BHXH Controller] BHXH Config NOT found in memory!');
                return res.status(500).json({ error: 'Chưa cấu hình hoặc không thể tải tài khoản cổng giám định BHXH' });
            }

            // Lấy hoặc tái sử dụng Token
            let tokenInfo = await this.getBHXHToken(config);
            const baseUrl = config.hhgd_url || 'https://egw.baohiemxahoi.gov.vn';

            // Cấu trúc payload tra cứu
            // Base payload for Check API
            const payload = {
                maThe: cardNo.substring(0, 15),
                hoTen: patientName,
                ngaySinh: birthYear.toString(),
                hoTenCb: config.staffName,
                cccdCb: config.cccdCb
            };

            // Enhanced payload for History 2025 (often requires full DOB)
            const historyPayload = { ...payload };
            // Try to use full DOB DD/MM/YYYY if available from frontend
            if ((req as any).body.dob) {
                const parts = (req as any).body.dob.split('-'); // 2024-05-20 -> [2024, 05, 20]
                if (parts.length === 3) {
                    historyPayload.ngaySinh = `${parts[2]}/${parts[1]}/${parts[0]}`;
                } else if ((req as any).body.dob.includes('/')) {
                    historyPayload.ngaySinh = (req as any).body.dob;
                }
            }

            let checkResponse: any;
            let historyResponse: any; // Result from Lskcb2025

            const md5Password = crypto.createHash('md5').update(config.password || '').digest('hex');

            // Function to call primary check API
            const callBHXHApi = async (tk: { access_token: string; id_token: string }) => {
                const checkUrl = `${baseUrl}/api/egw/KQNhanLichSuKCB2024?token=${tk.access_token}&id_token=${tk.id_token}&username=${config.userid}&password=${md5Password}`;
                console.log(`📡 [BHXH Controller] Calling Check API (2024): ${baseUrl}`);
                return await axios.post(checkUrl, payload);
            };

            // Function to call the NEW History 2025 API
            const callHistory2025Api = async (tk: { access_token: string; id_token: string }) => {
                const histUrl = `${baseUrl}/api/egw/Lskcb2025?token=${tk.access_token}&id_token=${tk.id_token}&username=${config.userid}&password=${md5Password}`;
                console.log(`📡 [BHXH Controller] Calling History 2025 API: ${historyPayload.ngaySinh}`);
                return await axios.post(histUrl, historyPayload);
            };

            // Function to call legacy 2019 History API (as seen in old system)
            const callHistory2019Api = async (tk: { access_token: string; id_token: string }) => {
                const histUrl = `${baseUrl}/api/egw/KQNhanLichSuKCB2019?token=${tk.access_token}&id_token=${tk.id_token}&username=${config.userid}&password=${md5Password}`;
                console.log(`📡 [BHXH Controller] Calling Legacy History 2019 API`);
                return await axios.post(histUrl, payload);
            };

            try {
                // Call all relevant APIs in parallel
                const results = await Promise.allSettled([
                    callBHXHApi(tokenInfo),
                    callHistory2025Api(tokenInfo),
                    callHistory2019Api(tokenInfo)
                ]);

                // Handle Check API (primary info)
                if (results[0].status === 'fulfilled') {
                    checkResponse = results[0].value;
                } else {
                    const error = (results[0] as PromiseRejectedResult).reason;
                    if (error.response?.status === 401 || error.response?.data?.maKetQua === '401') {
                        console.warn('⚠️ [BHXH Controller] Token expired, refreshing for all...');
                        tokenInfo = await this.getBHXHToken(config, true);
                        checkResponse = await callBHXHApi(tokenInfo);
                        historyResponse = await callHistory2025Api(tokenInfo);
                    } else {
                        throw error;
                    }
                }

                // Handle History APIs (2025 result or 2019 as fallback)
                if (results[1].status === 'fulfilled') {
                    historyResponse = results[1].value;
                } else if (results[2].status === 'fulfilled') {
                    console.log('🔄 [BHXH Controller] Using 2019 API as fallback history');
                    historyResponse = results[2].value;
                }
            } catch (error: any) {
                throw error;
            }

            const data = checkResponse.data as any;
            const historyData = historyResponse?.data || {};

            // DUMP RAW DATA TO FILE FOR DEEP DEBUGGING
            try {
                const fs = require('fs');
                const path = require('path');
                const logData = {
                    timestamp: new Date().toISOString(),
                    patient: patientName,
                    checkApi: data,
                    historyApi: historyData
                };
                fs.writeFileSync(path.join(process.cwd(), 'bhxh_debug_dump.json'), JSON.stringify(logData, null, 2));
                console.log('📂 [BHXH Controller] RAW DUMP saved to bhxh_debug_dump.json');
            } catch (err) {
                console.error('❌ Failed to dump debug data:', err);
            }

            console.log(`✅ [BHXH Controller] API Response Code: ${data.maKetQua} - ${data.ghiChu}`);

            const isSuccess = ['000', '001', '002', '003', '004'].includes(data.maKetQua);

            // Format BHXH raw date (YYYYMMDDHHMM[SS] -> DD/MM/YYYY HH:MM)
            const formatBHXHDate = (val: any) => {
                if (!val) return '';
                const s = String(val).trim();
                if (s.length >= 12 && /^\d+$/.test(s)) {
                    return `${s.substring(6, 8)}/${s.substring(4, 6)}/${s.substring(0, 4)} ${s.substring(8, 10)}:${s.substring(10, 12)}`;
                }
                if (s.length === 8 && /^\d+$/.test(s)) {
                    return `${s.substring(6, 8)}/${s.substring(4, 6)}/${s.substring(0, 4)}`;
                }
                return s;
            };

            // Helper to get first non-empty array
            const getFirstNotEmpty = (...arrays: any[]) => {
                for (const arr of arrays) {
                    if (Array.isArray(arr) && arr.length > 0) return arr;
                }
                return [];
            };

            const legacyHistoryData = (await Promise.allSettled([callHistory2019Api(tokenInfo)]))[0];
            const legacyData = legacyHistoryData.status === 'fulfilled' ? (legacyHistoryData.value as any).data : {};

            // PRIORITY LIST BASED ON DISCOVERED BHXH RESPONSE STRUCTURES
            // HOSPITAL CODE EXTRACTION HELPER (e.g., 01253_BV -> 01253)
            const extractHospCode = (val: any) => {
                if (!val) return '';
                const s = String(val).trim();
                const match = s.match(/^\d{5}/);
                return match ? match[0] : s;
            };

            const rawHistoryKCB = getFirstNotEmpty(
                historyData.dsLichSuKCB2025, historyData.dsLichSuKCB2024, historyData.dsLskcb, historyData.dsLichSuKCB,
                data.dsLichSuKCB2025, data.dsLichSuKCB2024, data.dsLichSuKCB2018, data.dsLichSuKCB, data.dsLichSuKcb,
                legacyData.dsLichSuKCB2025, legacyData.dsLichSuKCB2024, legacyData.dsLichSuKCB2018, legacyData.dsLichSuKCB,
                historyData.data?.dsLskcb, historyData.data?.dsLichSuKCB,
                Array.isArray(historyData) ? historyData : null
            );
            
            const rawHistoryCheckin = getFirstNotEmpty(
                historyData.dsLichSuKT2025, historyData.dsLichSuKT2018, historyData.dsLskt, historyData.dsLichSuKT,
                data.dsLichSuKT2025, data.dsLichSuKT2024, data.dsLichSuKT2018, data.dsLichSuKT, data.dsLichSuKt,
                legacyData.dsLichSuKT2025, legacyData.dsLichSuKT2018, legacyData.dsLichSuKT,
                historyData.data?.dsLskt, historyData.data?.dsLichSuKT
            );
            
            // LOGGING RAW DATA TO DEBUG (FOR DEVELOPER)
            console.log(`📊 [BHXH History] KCB items: ${rawHistoryKCB.length}, Checkin items: ${rawHistoryCheckin.length}`);

            // Normalize history items with CASE-INSENSITIVE field lookup
            const getVal = (obj: any, keys: string[]) => {
                if (!obj) return undefined;
                // 1. Literal match (most accurate)
                for (const k of keys) {
                    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
                }
                // 2. Case-insensitive match
                const lowerKeys = keys.map(k => k.toLowerCase());
                for (const key in obj) {
                    if (lowerKeys.includes(key.toLowerCase())) return obj[key];
                }
                return undefined;
            };

            // LOG KEYS FOR THE FIRST ITEM TO CONSOLE FOR DEBUGGING
            if (rawHistoryKCB.length > 0) {
                console.log('🔍 [BHXH Debug] KCB Keys:', Object.keys(rawHistoryKCB[0]));
            }
            if (rawHistoryCheckin.length > 0) {
                console.log('🔍 [BHXH Debug] Checkin Keys:', Object.keys(rawHistoryCheckin[0]));
            }

            // 1. GATHER ALL UNIQUE HOSPITAL CODES FROM BOTH HISTORIES
            const hospitalCodes = new Set<string>();
            const addCode = (val: any) => { 
                const code = extractHospCode(val);
                if (code) hospitalCodes.add(code); 
            };

            rawHistoryKCB.forEach((item: any) => {
                addCode(getVal(item, ['maCSKCB', 'maBenhVien', 'MA_CSKCB', 'ma_cskcb', 'macskcb', 'maBv', 'ma_bv', 'ma_coso', 'ma_cs_kcb']));
            });
            rawHistoryCheckin.forEach((item: any) => {
                addCode(getVal(item, ['userKT', 'maCSKCB', 'MA_CSKCB', 'ma_cskcb', 'macskcb', 'MA_CS_KCB', 'ma_coso', 'ma_cs_kcb']));
            });

            // 2. QUERY LOCAL DATABASE FOR HOSPITAL NAMES
            const hospitalMap: Record<string, string> = {};
            if (hospitalCodes.size > 0) {
                try {
                    const codesArray = Array.from(hospitalCodes);
                    const sql = `SELECT hh_id as id, hh_name as name FROM hms_hospital WHERE hh_id = ANY($1)`;
                    const hospitalResult = await query(sql, [codesArray]);
                    hospitalResult.rows.forEach(row => {
                        hospitalMap[row.id] = row.name;
                    });
                } catch (err) {
                    console.error('⚠️ [BHXH Controller] Failed to lookup hospital names:', err);
                }
            }

            // 3. DEFINE MAPPING HELPERS FOR STATUS CODES (MATCHING C++ LOGIC)
            const mapTinhTrangRV = (val: any) => {
                const s = String(val).trim();
                if (s === '1') return 'Ra viện';
                if (s === '2') return 'Chuyển viện';
                if (s === '3') return 'Trốn viện';
                if (s === '4') return 'Xin ra về';
                return val || '';
            };

            const mapKqDieuTri = (val: any) => {
                const s = String(val).trim();
                if (s === '1') return 'Khỏi';
                if (s === '2') return 'Đỡ';
                if (s === '3') return 'Không thay đổi';
                if (s === '4') return 'Nặng hơn';
                if (s === '5') return 'Tử vong';
                return val || '';
            };

            const mapLyDoVV = (val: any) => {
                const s = String(val).trim();
                if (s === '1') return 'Đúng tuyến';
                if (s === '2') return 'Cấp cứu';
                if (s === '3') return 'Trái tuyến';
                if (s === '4') return 'Thông tuyến';
                return val || '';
            };

            const historyKCB = rawHistoryKCB.map((item: any) => {
                const maBvRaw = getVal(item, ['maCSKCB', 'maBenhVien', 'MA_CSKCB', 'ma_cskcb', 'macskcb', 'maBv', 'ma_bv', 'ma_coso', 'ma_cs_kcb']);
                const maBv = extractHospCode(maBvRaw);
                const tenBvApi = getVal(item, ['tenCSKCB', 'tenBenhVien', 'TEN_CSKCB', 'ten_cskcb', 'tencskcb', 'ten_bv', 'tenBv', 'ten_coso', 'tenCoso', 'ten_cs_kcb']);
                
                return {
                    maHoSo: getVal(item, ['maHoSo', 'szMaHoso', 'ma_hoso', 'hoso_id']),
                    maBenhVien: maBv,
                    tenBenhVien: tenBvApi || hospitalMap[maBv] || maBvRaw || 'N/A',
                    ngayVao: formatBHXHDate(getVal(item, ['ngayVao', 'NGAY_VAO', 'ngay_vao', 'ngayVaoStr', 'ngay_vao_vien', 'ngay_vv'])),
                    ngayRa: formatBHXHDate(getVal(item, ['ngayRa', 'NGAY_RA', 'ngay_ra', 'ngayRaStr', 'ngay_ra_vien', 'ngay_rv'])),
                    tenBenh: getVal(item, ['tenBenh', 'TEN_BENH', 'ten_benh', 'chanDoan', 'chan_doan', 'benh_chinh']),
                    ketQuaDieuTri: mapKqDieuTri(getVal(item, ['ketQuaDieuTri', 'KQ_DT', 'kqdt', 'kqDieuTri', 'ket_qua_dt', 'kq_dieutri', 'ket_qua', 'kqDieuTri'])),
                    lyDoVaoVien: mapLyDoVV(getVal(item, ['lyDoVaoVien', 'LY_DO_VV', 'ly_do_vv', 'loaiTuyen', 'tuyen', 'loai_tuyen', 'lyDoVV'])),
                    tinhTrangRv: mapTinhTrangRV(getVal(item, ['tinhTrangRv', 'TTRV', 'ttrv', 'tinhTrangRaVien', 'tinh_trang_rv', 'tt_rv', 'tinh_trang', 'tinhTrang']))
                };
            });

            const historyCheckin = rawHistoryCheckin.map((item: any) => {
                const maCsRaw = getVal(item, ['userKT', 'maCSKCB', 'MA_CSKCB', 'ma_cskcb', 'macskcb', 'MA_CS_KCB', 'ma_coso', 'ma_cs_kcb']);
                const maCs = extractHospCode(maCsRaw);
                const tenCsApi = getVal(item, ['tenCSKCB', 'TEN_CSKCB', 'TEN_CS_KCB', 'ten_cskcb', 'tencskcb', 'ten_bv', 'tenBenhVien', 'ten_coso', 'ten_cs_kcb']);

                return {
                    maCSKCB: maCs,
                    tenCSKCB: tenCsApi || hospitalMap[maCs] || maCsRaw || 'N/A',
                    ngayKT: formatBHXHDate(getVal(item, ['ngayKT', 'NGAY_KT', 'ngay_kt', 'thoiGianKt', 'thoi_gian_kt', 'ngayVao', 'ngay_kt', 'thoiGianKT'])),
                    ghiChu: getVal(item, ['ghiChu', 'thong_bao', 'noi_dung_tb', 'kqdt', 'ketQua', 'GHICHU', 'noi_dung', 'noiDungTb', 'ghi_chu', 'tra_loi', 'thongBao'])
                };
            });

            return res.json({
                success: isSuccess,
                message: data.ghiChu || (isSuccess ? 'Thành công' : 'Thất bại'),
                errorCode: data.maKetQua,
                data: {
                    cardNo: data.maThe,
                    name: data.hoTen,
                    dob: data.ngaySinh,
                    gender: data.gioiTinh,
                    address: data.diaChi,
                    maDKBD: data.maDKBD,
                    startDate: data.gtTheTu,
                    endDate: data.gtTheDen,
                    startDateNew: data.gtTheTuMoi,
                    endDateNew: data.gtTheDenMoi,
                    maKV: data.maKV,
                    fiveYearDate: data.ngayDu5Nam,
                    newCardNo: data.maTheMoi,
                    newRegCode: data.maDKBDMoi,
                },
                historyKCB,
                historyCheckin
            });
        } catch (error: any) {
            const bhxhError = error.response?.data?.ghiChu || error.response?.data?.message || error.message;
            console.error('❌ checkBHXHCard Error:', bhxhError);
            return res.status(500).json({ 
                success: false,
                error: 'Lỗi kết nối cổng BHXH', 
                message: bhxhError 
            });
        }
    }

    /**
     * Lưu thông tin thẻ BHYT vào hms_card + cập nhật hms_doc
     */
    async saveInsuranceCard(req: AuthRequest, res: Response) {
        try {
            const { docNo, patientNo } = (req as any).body;
            const cardInfo: InsuranceCardInfo = (req as any).body.cardInfo;
            const docFlags: DocFlags = (req as any).body.docFlags || {};

            if (!docNo || !patientNo || !cardInfo) {
                throw new Error('Thiếu thông tin lưu thẻ (docNo, patientNo, cardInfo)');
            }
            const currentUser = req.userId || 'admin';

            const result = await transaction(async (client) => {
                // Tìm hoặc tạo mới hms_card
                const cardRes = await client.query(
                    `SELECT hc_idx FROM hms_card WHERE hc_patientno = $1 AND hc_cardno = $2`,
                    [patientNo, cardInfo.cardNo]
                );

                let cardIdx: number;
                if (cardRes.rows.length > 0) {
                    cardIdx = cardRes.rows[0].hc_idx;
                    await client.query(`
                        UPDATE hms_card SET
                            hc_regdate = $1, hc_expdate = $2, hc_regcode = $3,
                            hc_code = $4, hc_discount = $5, hc_area = $6,
                            hc_updatedby = $7, hc_updateddate = NOW()
                        WHERE hc_patientno = $8 AND hc_idx = $9
                    `, [cardInfo.startDate, cardInfo.endDate, cardInfo.regCode,
                    cardInfo.code || cardInfo.cardNo.substring(0, 2),
                    cardInfo.discount || 80, cardInfo.areaCode,
                        currentUser, patientNo, cardIdx]);
                } else {
                    const idxRes = await client.query(
                        `SELECT nextval('hms_card_hc_idx_seq') as next_idx`
                    );
                    cardIdx = parseInt(idxRes.rows[0].next_idx);
                    await client.query(`
                        INSERT INTO hms_card (
                            hc_patientno, hc_idx, hc_cardno, hc_regdate, hc_expdate,
                            hc_regcode, hc_code, hc_discount, hc_area, hc_active,
                            hc_createdby, hc_createddate
                        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Y',$10,NOW())
                    `, [patientNo, cardIdx, cardInfo.cardNo, cardInfo.startDate, cardInfo.endDate,
                        cardInfo.regCode, cardInfo.code || cardInfo.cardNo.substring(0, 2),
                        cardInfo.discount || 80, cardInfo.areaCode, currentUser]);
                }

                // Cập nhật hms_doc
                await client.query(`
                    UPDATE hms_doc SET
                        hd_cardno = $1, hd_cardidx = $2, hd_object = 'I',
                        hd_insline = $3, hd_emergency = $4,
                        hd_over5year = $5, hd_over5yeardate = $6,
                        hd_datediscountall = $7, hd_ma_doituong_kcb = $8, hd_disrate = $9
                    WHERE hd_docno = $10
                `, [
                    cardInfo.cardNo, cardIdx,
                    docFlags.insLine || 'N', docFlags.emergency || 'N',
                    docFlags.over5Year || 'N', docFlags.over5YearDate || null,
                    docFlags.dateDiscountAll || null, docFlags.maDoituongKCB || '1.1',
                    docFlags.disRate || 80, docNo
                ]);

                return cardIdx;
            });

            return res.json({ success: true, message: 'Lưu thông tin bảo hiểm thành công', cardIdx: result });
        } catch (error: any) {
            console.error('❌ saveInsuranceCard:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export default new ReceptionInsuranceController();
