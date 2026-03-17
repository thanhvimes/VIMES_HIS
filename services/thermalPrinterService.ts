
import html2canvas from 'html2canvas';

/**
 * Dịch vụ hỗ trợ in ấn cho máy in nhiệt (Thermal Printer)
 * Cơ chế: Render HTML sang Canvas/Ảnh để đảm bảo định dạng và font tiếng Việt tốt nhất
 */
export const ThermalPrinterService = {
    /**
     * Render một element (hoặc HTML string) sang Canvas
     */
    async renderToCanvas(element: HTMLElement, options: { width?: number } = {}): Promise<HTMLCanvasElement> {
        const width = options.width || 576; // Tiêu chuẩn máy in 80mm
        
        // Thiết lập tạm thời để render chuẩn
        const originalWidth = element.style.width;
        element.style.width = `${width}px`;

        try {
            await document.fonts.ready;
            const canvas = await html2canvas(element, {
                backgroundColor: '#ffffff',
                scale: 2, // Tăng độ phân giải cho chữ sắc nét
                logging: false,
                useCORS: true,
                width: width,
            });
            return canvas;
        } finally {
            element.style.width = originalWidth;
        }
    },

    /**
     * Chuyển đổi element sang chuỗi Base64 ảnh (Data URL)
     */
    async getImageDataURL(element: HTMLElement): Promise<string> {
        const canvas = await this.renderToCanvas(element);
        return canvas.toDataURL('image/png');
    },

    /**
     * Gửi dữ liệu in qua ESC/POS (Bitmap) - Nếu có Proxy Agent
     * Dùng cho tích hợp máy in trực tiếp qua IP/USB
     */
    async printViaProxy(element: HTMLElement, proxyUrl: string, printerAddress: string): Promise<boolean> {
        const canvas = await this.renderToCanvas(element);
        const bitmapCommands = this.canvasToBitmapESC(canvas);
        
        try {
            const response = await fetch(proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: printerAddress,
                    data: this.uint8ToBase64(new Uint8Array(bitmapCommands))
                })
            });
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Lỗi in qua Proxy:', error);
            return false;
        }
    },

    /**
     * Thuật toán chuyển Canvas sang mảng Byte lệnh ESC/POS (Bit Image)
     */
    canvasToBitmapESC(canvas: HTMLCanvasElement): number[] {
        const ctx = canvas.getContext('2d');
        if (!ctx) return [];
        
        const width = canvas.width;
        const height = canvas.height;
        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;

        const widthBytes = Math.ceil(width / 8);
        const bitmapData: number[] = [];

        for (let y = 0; y < height; y++) {
            for (let xByte = 0; xByte < widthBytes; xByte++) {
                let byte = 0;
                for (let bit = 0; bit < 8; bit++) {
                    const x = xByte * 8 + bit;
                    if (x < width) {
                        const idx = (y * width + x) * 4;
                        const r = pixels[idx];
                        const g = pixels[idx + 1];
                        const b = pixels[idx + 2];
                        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                        if (gray < 128) { // Black
                            byte |= (1 << (7 - bit));
                        }
                    }
                }
                bitmapData.push(byte);
            }
        }

        // Tạo lệnh ESC/POS GS v 0
        const commands: number[] = [0x1D, 0x76, 0x30, 0x00];
        commands.push(widthBytes & 0xFF, (widthBytes >> 8) & 0xFF);
        commands.push(height & 0xFF, (height >> 8) & 0xFF);
        return [...commands, ...bitmapData, 0x1D, 0x56, 0x42, 0x00]; // Thêm lệnh cắt giấy
    },

    uint8ToBase64(uint8: Uint8Array): string {
        let binary = '';
        for (let i = 0; i < uint8.length; i++) {
            binary += String.fromCharCode(uint8[i]);
        }
        return window.btoa(binary);
    }
};
