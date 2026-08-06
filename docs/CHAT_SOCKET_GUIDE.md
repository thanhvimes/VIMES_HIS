
# HƯỚNG DẪN TÍCH HỢP CHAT REAL-TIME VỚI SOCKET.IO

Tài liệu này giúp bạn hiểu cách hệ thống Chat nội bộ hoạt động và cách chuyển từ giả lập (Mock) sang kết nối thật.

## 1. Kiến trúc luồng dữ liệu (Data Flow)

Hệ thống Chat được xây dựng trên 3 chân kiềng:
1.  **Zustand Store (`stores/useChatStore.ts`)**: Đóng vai trò là "Bộ nhớ tạm". Nó lưu trữ toàn bộ tin nhắn đang hiển thị trên màn hình. Mọi thay đổi ở Store sẽ khiến React render lại giao diện ngay lập tức.
2.  **Socket Service (`services/socketService.ts`)**: Đóng vai trò là "Người vận chuyển". Chịu trách nhiệm đẩy tin nhắn lên server và đón tin nhắn từ server về.
3.  **UI Component (`components/ChatWidget.tsx`)**: Đóng vai trò "Người đại diện". Hiển thị dữ liệu từ Store và gọi các hành động (Actions) từ Store.

## 2. Cách chuyển sang Socket.io thật (Backend thực tế)

Khi bạn có server Node.js chạy Socket.io, hãy sửa file `services/socketService.ts` như sau:

```typescript
import { io, Socket } from "socket.io-client";

class SocketService {
    private socket: Socket | null = null;

    connect(userId: string) {
        // Kết nối tới địa chỉ Backend của bạn
        this.socket = io("http://localhost:8000", {
            query: { userId }
        });

        this.socket.on("connect", () => {
            console.log("Đã kết nối Socket thật!");
        });

        // Khi có tin nhắn từ server gửi về
        this.socket.on("new_message", (data) => {
            // Gọi Store để cập nhật UI
            // useChatStore.getState().receiveMessage(data);
        });
    }

    emit(event: string, data: any) {
        this.socket?.emit(event, data);
    }
}
```

## 3. Các tính năng nâng cao đã tích hợp (Giả lập)

*   **Optimistic UI:** Khi bạn bấm gửi, tin nhắn hiện ngay trên màn hình của bạn mà không chờ server phản hồi. Điều này tạo cảm giác cực kỳ mượt mà.
*   **Typing Indicator:** Sử dụng sự kiện `typing` và `stop_typing` để báo cho đối phương biết bạn đang gõ.
*   **Unread Badges:** Tự động đếm số tin nhắn chưa đọc nếu bạn đang ở cửa sổ chat khác hoặc đang đóng widget.
*   **Sound Notification:** Tự động phát âm thanh khi có tin nhắn mới (mô phỏng trong `socketService`).

## 4. Bảo mật trong Chat Y tế
Trong môi trường bệnh viện, nội dung chat thường chứa thông tin bệnh nhân. Lưu ý:
*   Luôn sử dụng **HTTPS/WSS** (Secure WebSocket).
*   Mã hóa nội dung tin nhắn ở Backend trước khi lưu vào Database.
*   Tự động xóa lịch sử chat sau một khoảng thời gian quy định (nếu hệ thống yêu cầu bảo mật cao).

---
*Hy vọng tài liệu này giúp bạn nắm vững cơ chế Real-time trong lập trình Web hiện đại!*
