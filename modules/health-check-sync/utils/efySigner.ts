import { toast } from 'sonner';

// ==================== EFY-CA LOCAL SIGNING CONNECTOR ====================
// File: modules/health-check-sync/utils/efySigner.ts
//
// Giao tiếp với Plugin EFY-Signatures / eSigner chạy cục bộ trên máy trạm (Cổng 15805).
// Hỗ trợ cả hai giao thức HTTP POST và WebSocket để ký chuỗi XML.

/**
 * Mã hóa chuỗi UTF-8 sang Base64 chuẩn tương thích trình duyệt
 */
export function encodeBase64Utf8(str: string): string {
    return btoa(unescape(encodeURIComponent(str)));
}

/**
 * Giao tiếp với Plugin ký số qua giao thức HTTP POST
 */
async function signViaHttp(base64Xml: string, url: string, payloadType: 'action' | 'unsignedData' | 'direct'): Promise<string> {
    let body = {};
    if (payloadType === 'action') {
        body = { action: 'sign', data: base64Xml, fileType: 'xml' };
    } else if (payloadType === 'unsignedData') {
        body = { unsignedData: base64Xml, fileType: 'xml' };
    } else {
        body = { data: base64Xml };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(body),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Trích xuất chữ ký từ các định dạng kết quả phổ biến của eSigner
        const signedData = result.signature || result.data || result.signedData || result.value;
        if (signedData) {
            return signedData;
        }
        
        if (result.error || result.message) {
            throw new Error(result.error || result.message);
        }
        
        throw new Error("Không tìm thấy trường dữ liệu chữ ký trong phản hồi HTTP.");
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Giao tiếp với Plugin ký số qua kết nối WebSocket cục bộ
 */
function signViaWebSocket(base64Xml: string, wsUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            if (ws && ws.readyState !== WebSocket.CLOSED) {
                ws.close();
            }
            reject(new Error("Timeout kết nối tới WebSocket ký số (8 giây)"));
        }, 8000);

        let ws: WebSocket;
        try {
            ws = new WebSocket(wsUrl);
        } catch (e) {
            clearTimeout(timeout);
            return reject(e);
        }

        ws.onopen = () => {
            // Gửi bản tin yêu cầu ký theo chuẩn định dạng WebSocket của EFY/eSigner
            const request = {
                action: 'sign',
                msg_type: 'sign',
                data: base64Xml,
                fileType: 'xml',
                fileName: 'document.xml'
            };
            ws.send(JSON.stringify(request));
        };

        ws.onerror = (error) => {
            clearTimeout(timeout);
            reject(new Error("Lỗi kết nối WebSocket tới phần mềm ký số"));
        };

        ws.onmessage = (event) => {
            clearTimeout(timeout);
            ws.close();
            try {
                const result = JSON.parse(event.data);
                const signedData = result.signature || result.data || result.signedData || result.value;
                if (signedData) {
                    resolve(signedData);
                } else if (result.error || result.message) {
                    reject(new Error(result.error || result.message));
                } else {
                    // Nếu trả về trực tiếp chuỗi ký
                    if (typeof event.data === 'string' && event.data.length > 100) {
                        resolve(event.data);
                    } else {
                        reject(new Error("Phản hồi WebSocket không đúng định dạng."));
                    }
                }
            } catch (e) {
                // Trường hợp nhận được chuỗi signature thô trực tiếp
                if (typeof event.data === 'string' && event.data.length > 50) {
                    resolve(event.data);
                } else {
                    reject(new Error("Không thể phân tích kết quả ký từ WebSocket: " + event.data));
                }
            }
        };

        ws.onerror = (err) => {
            clearTimeout(timeout);
            reject(err);
        };
    });
}

// Cấu hình các cổng và định dạng API của các nhà mạng CA phổ biến tại Việt Nam
const caConfigs = [
    {
        name: 'EFY-CA eSigner / Local Port 15805',
        ports: [15805],
        testUrl: 'http://127.0.0.1:15805/ca/actions',
        signUrl: 'http://127.0.0.1:15805/ca/actions',
        payloadType: 'action' as const
    },
    {
        name: 'Ban Cơ yếu Chính phủ (VGCA)',
        ports: [12347],
        testUrl: 'http://127.0.0.1:12347/ca/actions/sign',
        signUrl: 'http://127.0.0.1:12347/ca/actions/sign',
        payloadType: 'unsignedData' as const
    },
    {
        name: 'VNPT-CA Plugin',
        ports: [14300, 9001],
        testUrl: 'http://127.0.0.1:14300/sign',
        signUrl: 'http://127.0.0.1:14300/sign',
        payloadType: 'direct' as const
    },
    {
        name: 'Viettel-CA Token Manager',
        ports: [19001, 19002],
        testUrl: 'http://127.0.0.1:19001/sign',
        signUrl: 'http://127.0.0.1:19001/sign',
        payloadType: 'direct' as const
    },
    {
        name: 'BKAV-CA eSigner',
        ports: [22442],
        testUrl: 'http://127.0.0.1:22442/sign',
        signUrl: 'http://127.0.0.1:22442/sign',
        payloadType: 'direct' as const
    },
    {
        name: 'MISA eSign Client',
        ports: [9876],
        testUrl: 'http://127.0.0.1:9876/sign',
        signUrl: 'http://127.0.0.1:9876/sign',
        payloadType: 'direct' as const
    },
    {
        name: 'Custom CA Plugin (Port 17918 / Direct)',
        ports: [17918],
        testUrl: 'http://127.0.0.1:17918/sign',
        signUrl: 'http://127.0.0.1:17918/sign',
        payloadType: 'direct' as const
    },
    {
        name: 'Custom CA Plugin (Port 17918 / Actions)',
        ports: [17918],
        testUrl: 'http://127.0.0.1:17918/ca/actions',
        signUrl: 'http://127.0.0.1:17918/ca/actions',
        payloadType: 'action' as const
    },
    {
        name: 'Custom CA Plugin (Port 17918 / Actions Sign)',
        ports: [17918],
        testUrl: 'http://127.0.0.1:17918/ca/actions/sign',
        signUrl: 'http://127.0.0.1:17918/ca/actions/sign',
        payloadType: 'unsignedData' as const
    },
    {
        name: 'Custom CA Plugin (Port 8884 / Direct)',
        ports: [8884],
        testUrl: 'http://127.0.0.1:8884/sign',
        signUrl: 'http://127.0.0.1:8884/sign',
        payloadType: 'direct' as const
    },
    {
        name: 'Custom CA Plugin (Port 8884 / Actions)',
        ports: [8884],
        testUrl: 'http://127.0.0.1:8884/ca/actions',
        signUrl: 'http://127.0.0.1:8884/ca/actions',
        payloadType: 'action' as const
    },
    {
        name: 'Custom CA Plugin (Port 8884 / Actions Sign)',
        ports: [8884],
        testUrl: 'http://127.0.0.1:8884/ca/actions/sign',
        signUrl: 'http://127.0.0.1:8884/ca/actions/sign',
        payloadType: 'unsignedData' as const
    },
    {
        name: 'Custom CA Plugin (Port 9983 / Direct)',
        ports: [9983],
        testUrl: 'http://127.0.0.1:9983/sign',
        signUrl: 'http://127.0.0.1:9983/sign',
        payloadType: 'direct' as const
    },
    {
        name: 'Custom CA Plugin (Port 9983 / Actions)',
        ports: [9983],
        testUrl: 'http://127.0.0.1:9983/ca/actions',
        signUrl: 'http://127.0.0.1:9983/ca/actions',
        payloadType: 'action' as const
    },
    {
        name: 'Custom CA Plugin (Port 9983 / Actions Sign)',
        ports: [9983],
        testUrl: 'http://127.0.0.1:9983/ca/actions/sign',
        signUrl: 'http://127.0.0.1:9983/ca/actions/sign',
        payloadType: 'unsignedData' as const
    }
];

/**
 * Tự động dò tìm (scan) phần mềm ký số đang hoạt động trên máy trạm
 */
async function detectActiveSigner(): Promise<{ url: string; payloadType: 'action' | 'unsignedData' | 'direct'; caName: string }> {
    console.log("🔍 Đang quét các cổng dịch vụ chữ ký số máy trạm...");
    
    for (const ca of caConfigs) {
        for (const port of ca.ports) {
            try {
                // Kiểm tra kết nối nhanh bằng cách gửi request ký số với payload giả lập
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1200); // 1.2s timeout
                
                let body = {};
                if (ca.payloadType === 'action') {
                    body = { action: 'sign', data: 'dGVzdA==', fileType: 'xml' };
                } else if (ca.payloadType === 'unsignedData') {
                    body = { unsignedData: 'dGVzdA==', fileType: 'xml' };
                } else {
                    body = { data: 'dGVzdA==' };
                }

                const response = await fetch(ca.signUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                // Bất cứ phản hồi nào (kể cả lỗi định dạng hay thành công) đều chứng tỏ Port đang MỞ và phần mềm CA đang chạy
                if (response.ok || response.status === 400 || response.status === 405 || response.status === 500) {
                    console.log(`🎉 Phát hiện dịch vụ ký số: ${ca.name} tại cổng ${port}`);
                    return {
                        url: ca.signUrl,
                        payloadType: ca.payloadType,
                        caName: ca.name
                    };
                }
            } catch (e) {
                // Tiếp tục thử cổng/nhà mạng tiếp theo
            }
        }
    }
    
    throw new Error("Không phát hiện bất kỳ phần mềm ký số máy trạm nào đang chạy.");
}

/**
 * Ký chuỗi XML chưa ký sử dụng Plugin ký số EFY-CA / eSigner chạy trên máy trạm
 * @param unsignedXml Chuỗi XML thô chưa ký
 * @param docNo Số hồ sơ để đặt tên file lưu trữ
 * @returns Trả về chuỗi JSON chứa chữ ký số Base64 bọc theo chuẩn VNeID của hệ thống
 */
export async function signXmlWithLocalEfyPlugin(unsignedXml: string, docNo: string = 'ksk_document'): Promise<string> {
    const base64Xml = encodeBase64Utf8(unsignedXml);

    // 1. Thử dò tìm thông minh tự động (Auto-detect) các cổng nhà mạng trước
    try {
        const activeSigner = await detectActiveSigner();
        toast.info(`Phát hiện máy trạm cài: ${activeSigner.caName}. Đang gọi ký số...`);
        try {
            const signedBase64 = await signViaHttp(base64Xml, activeSigner.url, activeSigner.payloadType);
            toast.success(`Chữ ký số hợp lệ từ cổng ${activeSigner.caName}!`);
            return wrapSignatureResult(signedBase64, docNo);
        } catch (postErr: any) {
            console.error("❌ Lỗi gọi ký số trên cổng phát hiện được:", postErr);
            toast.error(`Lỗi kết nối cổng ${activeSigner.caName}: ${postErr.message || postErr}. Thử fallback...`);
            throw postErr; // Ném ra ngoài để nhảy vào catch(scanErr) và dùng fallback
        }
    } catch (scanErr: any) {
        console.warn("⚠️ Quét tự động thất bại, chuyển sang cơ chế WebSocket/HTTP tuần tự...", scanErr.message);
    }

    // 2. Cơ chế fallback dự phòng (WebSocket / HTTP tuần tự nguyên bản)
    const httpEndpoints = [
        { url: 'https://localhost:15805/ca/actions', type: 'action' as const },
        { url: 'http://localhost:15805/ca/actions', type: 'action' as const },
        { url: 'https://127.0.0.1:15805/ca/actions', type: 'action' as const },
        { url: 'http://127.0.0.1:15805/ca/actions', type: 'action' as const },
        { url: 'https://localhost:15805/ca/actions/sign', type: 'unsignedData' as const },
        { url: 'http://localhost:15805/ca/actions/sign', type: 'unsignedData' as const },
        { url: 'https://localhost:15805/sign', type: 'direct' as const },
        { url: 'http://localhost:15805/sign', type: 'direct' as const },
        { url: 'http://localhost:12347/ca/actions/sign', type: 'action' as const }
    ];

    const wsUrls = [
        'ws://127.0.0.1:15805',
        'wss://127.0.0.1:15805',
        'ws://localhost:15805',
        'wss://localhost:15805'
    ];

    let lastError: any = null;
    for (const wsUrl of wsUrls) {
        try {
            console.log(`[EFY-CA] Đang thử kết nối qua WebSocket: ${wsUrl}`);
            const signedBase64 = await signViaWebSocket(base64Xml, wsUrl);
            console.log(`[EFY-CA] Ký số thành công qua WebSocket: ${wsUrl}`);
            toast.success("Kết nối thành công tới WebSocket ký số!");
            return wrapSignatureResult(signedBase64, docNo);
        } catch (err: any) {
            console.warn(`[EFY-CA] Thử WebSocket ${wsUrl} thất bại:`, err.message || err);
            lastError = err;
        }
    }

    toast("Đang thử kết nối HTTP POST tới cổng 15805/12347...");

    // 2. Thử ký qua các endpoint HTTP POST (nếu WebSocket bị chặn hoặc không khả dụng)
    for (const endpoint of httpEndpoints) {
        try {
            console.log(`[EFY-CA] Đang thử kết nối qua HTTP POST: ${endpoint.url}`);
            const signedBase64 = await signViaHttp(base64Xml, endpoint.url, endpoint.type);
            console.log(`[EFY-CA] Ký số thành công qua HTTP POST: ${endpoint.url}`);
            toast.success("Kết nối thành công tới HTTP POST ký số!");
            return wrapSignatureResult(signedBase64, docNo);
        } catch (err: any) {
            console.warn(`[EFY-CA] Thử HTTP ${endpoint.url} thất bại:`, err.message || err);
            lastError = err;
        }
    }

    // Ném lỗi chi tiết nếu tất cả đều thất bại
    const errMsg = lastError ? (lastError.message || JSON.stringify(lastError)) : "Không có phản hồi";
    throw new Error(
        `Không thể kết nối tới phần mềm ký số trên máy trạm (Cổng 15805).\n` +
        `- Vui lòng kiểm tra xem phần mềm ký số máy trạm đã được bật ở khay hệ thống chưa.\n` +
        `- Đảm bảo USB Token đã được cắm.\n` +
        `- Chi tiết lỗi: ${errMsg}`
    );
}

/**
 * Đóng gói chữ ký số Base64 nhận về thành định dạng JSON chuẩn được backend phân tích
 */
function wrapSignatureResult(signedBase64: string, docNo: string): string {
    // Làm sạch chuỗi base64 nếu chứa xuống dòng hay khoảng trắng thừa
    const cleanBase64 = signedBase64.replace(/[\r\n\s]/g, '');

    const wrapper = {
        signature_result: {
            signer_info: {
                user_id: "usb_token",
                name: "Chữ ký từ USB Token Máy Trạm",
                email: ""
            },
            signed_file: {
                file_name: `${docNo}_Signed.xml`,
                mime_type: "text/xml",
                data_base64: cleanBase64
            }
        }
    };
    return JSON.stringify(wrapper);
}
