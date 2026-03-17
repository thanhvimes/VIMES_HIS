
import html2canvas from "html2canvas";
import { Capacitor } from '@capacitor/core';
import { PrinterConfig } from "../modules/reception/services/settingsService";

/**
 * Interface cho dữ liệu in phiếu khám (Ticket)
 */
export interface PrintTicketData {
    ticketNumber: string;
    patientName: string;
    patientId?: string;
    dob?: string;
    gender?: string;
    department: string;
    time: string;
    isPriority?: boolean;
    hospitalName?: string;
}

/**
 * Loại bỏ dấu Tiếng Việt
 */
const removeAccents = (str: string): string => {
    return str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

/**
 * Helper lấy địa chỉ máy in dựa trên kết nối
 */
const getPrinterAddress = (config: PrinterConfig): string => {
    if (config.type === 'LAN') {
        return `${config.ipAddress || '127.0.0.1'}:${config.port || 9100}`;
    }
    return config.printerId || "";
};

/**
 * Chuyển mảng byte sang Base64
 */
const cmdToBase64 = (bytes: number[] | Uint8Array): string => {
    if (!bytes || bytes.length === 0) return "";
    const uint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let binary = "";
    const INTERNAL_CHUNK = 8192;
    for (let i = 0; i < uint8.length; i += INTERNAL_CHUNK) {
        const chunk = uint8.subarray(i, i + INTERNAL_CHUNK);
        binary += String.fromCharCode.apply(null, chunk as any);
    }
    return window.btoa(binary);
};

/**
 * Gửi lệnh tới máy in (Hỗ trợ Native Proxy hoặc Web Proxy)
 */
const sendToPrinter = async (bytes: number[], config: PrinterConfig, onLog?: (m: string) => void): Promise<boolean> => {
    const isNative = Capacitor.isNativePlatform();
    const address = getPrinterAddress(config);

    if (onLog) onLog(`Chuẩn bị gửi dữ liệu (${bytes.length} bytes) tới ${address}...`);

    // Gán INIT / FEED / CUT mặc định
    const INIT = [0x1B, 0x40];
    const RESET = [0x1B, 0x40];
    const FEED_CUT = [0x1B, 0x64, 0x03, 0x1D, 0x56, 0x42, 0x00];

    const fullBytes = new Uint8Array(INIT.length + bytes.length + RESET.length + FEED_CUT.length);
    fullBytes.set(INIT, 0);
    fullBytes.set(bytes, INIT.length);
    fullBytes.set(RESET, INIT.length + bytes.length);
    fullBytes.set(FEED_CUT, INIT.length + bytes.length + RESET.length);

    if (isNative) {
        try {
            // Native integration (via Capacitor Plugin if registered)
            const PrinterPlugin = (window as any).Printer;
            if (!PrinterPlugin) throw new Error("Printer Plugin not found in native environment");
            
            await PrinterPlugin.connect({ address });
            await PrinterPlugin.printRaw({ data: cmdToBase64(Array.from(fullBytes)) });
            return true;
        } catch (e: any) {
            if (onLog) onLog(`Lỗi in Native: ${e.message}`);
            return false;
        }
    } else {
        // Web Proxy (Local Agent)
        const proxyUrl = config.webProxyUrl || `http://localhost:9100/print`;
        try {
            const response = await fetch(proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: config.type,
                    address: address,
                    data: cmdToBase64(Array.from(fullBytes))
                })
            });
            const result = await response.json();
            return result.success;
        } catch (e: any) {
            if (onLog) onLog(`Lỗi Web Proxy: ${e.message}`);
            return false;
        }
    }
};

/**
 * Chuyển HTML sang Bitmap lệnh ESC/POS
 */
const canvasToBitmapCommands = (canvas: HTMLCanvasElement): number[] => {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');

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
                    const gray = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
                    if (gray < 128) byte |= (1 << (7 - bit));
                }
            }
            bitmapData.push(byte);
        }
    }

    const commands: number[] = [0x1D, 0x76, 0x30, 0x00];
    commands.push(widthBytes & 0xFF, (widthBytes >> 8) & 0xFF);
    commands.push(height & 0xFF, (height >> 8) & 0xFF);
    return [...commands, ...bitmapData];
};

/**
 * Dịch vụ in ấn chính
 */
export const printerService = {
    /** In phiếu khám */
    async printTicket(data: PrintTicketData, config: PrinterConfig, onLog?: (m: string) => void): Promise<boolean> {
        if (!config.enabled) return false;

        if (config.printMode === 'IMAGE') {
            return this.printAsImage(this.generateDefaultHTML(data), config, onLog);
        }

        // Text Mode with Encoding
        let commands: number[] = [];
        const encoder = new TextEncoder();
        const addText = (t: string) => commands.push(...Array.from(encoder.encode(t)));
        const process = (t: string) => config.encodingMode === 'NO_ACCENTS' ? removeAccents(t) : t;

        commands.push(0x1B, 0x40); // Init
        if (config.encodingMode === 'CODEPAGE') {
            commands.push(0x1B, 0x74, config.codePage || 30);
        }

        commands.push(0x1B, 0x61, 0x01); // Center
        addText(`${process(data.hospitalName || "PHÒNG KHÁM")}\n--------------------------\n`);
        commands.push(0x1B, 0x45, 0x01, 0x1D, 0x21, 0x11); // Bold + Zoom
        addText(`${data.ticketNumber}\n`);
        commands.push(0x1B, 0x45, 0x00, 0x1D, 0x21, 0x00);
        addText(`--------------------------\n`);
        commands.push(0x1B, 0x61, 0x00); // Left
        addText(`${process("Bệnh nhân: ")}${process(data.patientName)}\n`);
        addText(`${process("Phòng khám: ")}${process(data.department)}\n`);
        addText(`${process("Thời gian: ")}${data.time}\n\n`);
        
        return await sendToPrinter(commands, config, onLog);
    },

    /** In dạng ảnh cho độ chính xác cao nhất */
    async printAsImage(html: string, config: PrinterConfig, onLog?: (m: string) => void): Promise<boolean> {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = config.width === '80mm' ? '576px' : '384px';
        container.innerHTML = `<div id="vclinic-print-target" style="background: white; padding: 20px;">${html}</div>`;
        document.body.appendChild(container);

        try {
            await document.fonts.ready;
            const target = document.getElementById('vclinic-print-target');
            if (!target) throw new Error("Render target not found");

            const canvas = await html2canvas(target, { backgroundColor: '#ffffff', scale: 1 });
            const bitmap = canvasToBitmapCommands(canvas);
            return await sendToPrinter(bitmap, config, onLog);
        } catch (e: any) {
            if (onLog) onLog(`Lỗi in ảnh: ${e.message}`);
            return false;
        } finally {
            document.body.removeChild(container);
        }
    },

    /** Mẫu HTML mặc định */
    generateDefaultHTML(data: PrintTicketData): string {
        return `
            <div style="text-align: center; font-family: Arial, sans-serif;">
                <h3 style="margin: 0; font-size: 18px;">${data.hospitalName || 'PHÒNG KHÁM VIMES'}</h3>
                <div style="margin: 10px 0; border-top: 1px dashed #000;"></div>
                <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">SỐ THỨ TỰ KHÁM</div>
                <div style="font-size: 48px; font-weight: bold; margin: 10px 0;">${data.ticketNumber}</div>
                <div style="margin: 10px 0; border-top: 1px dashed #000;"></div>
                <div style="text-align: left; font-size: 14px; line-height: 1.6;">
                    <div><b>Bệnh nhân:</b> ${data.patientName}</div>
                    <div><b>Phòng khám:</b> ${data.department}</div>
                    <div><b>Thời gian:</b> ${data.time}</div>
                </div>
                <div style="margin: 20px 0; font-size: 12px; font-style: italic;">
                    Vui lòng đợi tới lượt. Cảm ơn quý khách!
                </div>
            </div>
        `;
    }
};
