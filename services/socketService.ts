
/**
 * DỊCH VỤ SOCKET NÂNG CẤP (BUSINESS REAL-TIME HUB)
 * Hỗ trợ giao tiếp liên module: Tiếp nhận <-> Khám bệnh <-> Dược <-> Viện phí
 */

type SocketCallback = (data: any) => void;

class SocketService {
    private listeners: Record<string, SocketCallback[]> = {};
    private isConnected: boolean = false;

    connect(userId: string) {
        console.log(`[Socket] Kết nối hệ thống Real-time cho: ${userId}`);
        this.isConnected = true;
        this.trigger('connect', { status: 'ready' });
    }

    // Gửi dữ liệu (Emit) đồng thời tự động phát sóng cục bộ cho bản Demo
    emit(event: string, data: any) {
        console.log(`[Socket Emit] ${event}:`, data);
        
        // Trong thực tế, server sẽ nhận và broadcast lại.
        // Ở đây ta giả lập server bằng cách tự trigger các listener đang lắng nghe event này.
        setTimeout(() => {
            this.trigger(event, data);
        }, 100);
    }

    on(event: string, callback: SocketCallback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    off(event: string, callback?: SocketCallback) {
        if (!callback) {
            delete this.listeners[event];
        } else if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    private trigger(event: string, data: any) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
}

export const socketService = new SocketService();
