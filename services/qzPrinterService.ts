// ==================== QZ TRAY PRINT SERVICE ====================
// File: services/qzPrinterService.ts

import qz from 'qz-tray';

class QzPrinterService {
    private isConnected = false;

    // 1. Establish connection to local QZ Tray application
    async connect(): Promise<void> {
        if (this.isConnected) return;
        try {
            // Check if QZ is already active
            if (qz.websocket.isActive()) {
                this.isConnected = true;
                return;
            }
            await qz.websocket.connect();
            this.isConnected = true;
            console.log("🟢 VIMES HIS: Connected to QZ Tray successfully!");
        } catch (error) {
            console.error("🔴 VIMES HIS: Failed to connect to QZ Tray client.", error);
            this.isConnected = false;
            throw new Error("Không thể kết nối đến ứng dụng QZ Tray cục bộ. Vui lòng bật ứng dụng QZ Tray trên máy tính!");
        }
    }

    // 2. Disconnect from QZ Tray
    async disconnect(): Promise<void> {
        if (!this.isConnected) return;
        try {
            await qz.websocket.disconnect();
            this.isConnected = false;
        } catch (err) {
            console.error("Error disconnecting QZ Tray:", err);
        }
    }

    // 3. Find target printer in the system
    async findPrinter(printerQuery: string): Promise<string> {
        await this.connect();
        try {
            const found = await qz.printers.find(printerQuery);
            return Array.isArray(found) ? found[0] : found;
        } catch (error) {
            console.error(`Không tìm thấy máy in nào phù hợp với từ khóa: "${printerQuery}"`, error);
            throw new Error(`Không tìm thấy máy in nhãn: "${printerQuery}"`);
        }
    }

    // 4. Print ZPL directly to a thermal printer
    async printZPL(printerQuery: string, zplCode: string): Promise<boolean> {
        try {
            // Find target printer
            const printerName = await this.findPrinter(printerQuery);
            
            // Create raw print configuration
            const config = qz.configs.create(printerName, {
                encoding: 'UTF-8',
                raw: {
                    type: 'raw'
                }
            });

            // Send raw ZPL data packet
            await qz.print(config, [zplCode]);
            console.log(`🖨️ VIMES HIS: Successfully printed ZPL to [${printerName}]`);
            return true;
        } catch (error: any) {
            console.error("🔴 VIMES HIS: Printing ZPL error:", error);
            throw error;
        }
    }

    // 5. Print HTML directly to a thermal printer (silent printing)
    async printHTML(printerQuery: string, htmlContent: string, options: any = {}): Promise<boolean> {
        try {
            await this.connect();
            const printerName = await this.findPrinter(printerQuery);
            const config = qz.configs.create(printerName, {
                margins: options.margins || 0,
                size: options.size || { width: 80, height: 150 }, // standard thermal receipt width 80mm
                units: options.units || 'mm'
            });
            const data = [{
                type: 'pixel',
                format: 'html',
                flavor: 'plain',
                data: htmlContent
            }];
            await qz.print(config, data);
            console.log(`🖨️ VIMES HIS: Successfully printed HTML to [${printerName}]`);
            return true;
        } catch (error: any) {
            console.error("🔴 VIMES HIS: Printing HTML error:", error);
            throw error;
        }
    }
}

export const qzPrinterService = new QzPrinterService();
