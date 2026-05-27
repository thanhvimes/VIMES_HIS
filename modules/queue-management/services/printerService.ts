import { AppSettings, TicketData } from "../types";
import Printer from "../../../plugins/PrinterPlugin";
import html2canvas from "html2canvas";
import { generateTicketHTMLForCanvas } from "./ticketTemplate";
import { generateReceiptHTMLForCanvas } from "./receiptTemplate";
import { ReceiptData } from "../types";
import { Capacitor } from '@capacitor/core';

/**
 * Loại bỏ dấu Tiếng Việt - sử dụng khi máy in không hỗ trợ Unicode/Code Page
 */
const removeAccents = (str: string): string => {
    return str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

/**
 * Chuyển đổi text sang mảng UTF-8 bytes
 * Sử dụng cho máy in hỗ trợ UTF-8 trực tiếp
 */
const encodeTextToUTF8Bytes = (text: string): number[] => {
    const encoder = new TextEncoder();
    return Array.from(encoder.encode(text));
};

/**
 * Helper to get printer address based on connection type
 */
const getPrinterAddress = (config: any): string => {
    if (config.type === 'LAN') {
        return `${config.ipAddress || '127.0.0.1'}:${config.port || 9100}`;
    }
    return config.printerId || "";
};

/**
 * Chuyển mảng byte sang Base64 một cách an toàn (tránh lỗi stack overflow với mảng lớn)
 */
const cmdToBase64 = (bytes: number[] | Uint8Array): string => {
    if (!bytes || bytes.length === 0) return "";
    const uint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let binary = "";
    // Xử lý theo chunk nội bộ để tránh "Maximum call stack"
    const INTERNAL_CHUNK = 8192;
    for (let i = 0; i < uint8.length; i += INTERNAL_CHUNK) {
        const chunk = uint8.subarray(i, i + INTERNAL_CHUNK);
        binary += String.fromCharCode.apply(null, chunk as any);
    }
    return window.btoa(binary);
};

/**
 * Universal helper to send data to printer (supports Native and Web)
 */
const sendToPrinter = async (bytes: number[], settings: AppSettings, onLog?: (m: string) => void): Promise<boolean> => {
    const isNative = Capacitor.isNativePlatform();
    const address = getPrinterAddress(settings.printerConfig);

    console.log(`[Printer] Starting print job. Native: ${isNative}, Address: ${address}`);
    if (onLog) onLog(`Chuẩn bị gửi dữ liệu (${bytes.length} bytes)...`);

    // 1. Prepare Command Stream using Uint8Array for performance
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
            console.log(`[Printer] Connecting to native printer: ${address}`);
            await Printer.connect({ address });

            const CHUNK_SIZE = 32768;
            for (let i = 0; i < fullBytes.length; i += CHUNK_SIZE) {
                const chunk = Array.from(fullBytes.subarray(i, i + CHUNK_SIZE));
                await Printer.printRaw({ data: cmdToBase64(chunk) });
                await new Promise(r => setTimeout(r, 5));
            }
            console.log(`[Printer] Native print job completed.`);
            return true;
        } catch (e: any) {
            console.error(`[Printer] Native Error:`, e);
            if (onLog) onLog(`Lỗi in Native: ${e.message}`);
            return false;
        }
    } else {
        const proxyUrl = settings.printerConfig.webProxyUrl || `${window.location.protocol}//${window.location.hostname}:3000/api/print`;
        console.log(`[Printer] Sending to Web Proxy: ${proxyUrl}`);
        if (onLog) onLog(`Gửi tới Web Proxy...`);

        try {
            const response = await fetch(proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: settings.printerConfig.type,
                    address: address,
                    ip: settings.printerConfig.ipAddress,
                    port: settings.printerConfig.port,
                    data: cmdToBase64(Array.from(fullBytes))
                })
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error || "Proxy error");
            console.log(`[Printer] Proxy print job completed.`);
            return true;
        } catch (e: any) {
            console.error(`[Printer] Web Proxy Error:`, e);
            if (onLog) onLog(`Lỗi Web Proxy: ${e.message}`);
            return false;
        }
    }
};

/**
 * Dịch vụ in ấn với hỗ trợ đa dạng encoding cho Tiếng Việt:
 */
export const printTicket = async (data: TicketData, settings: AppSettings, onLog?: (m: string) => void): Promise<boolean> => {
    if (!settings.printerConfig.enabled) return false;

    if (settings.printerConfig.printMode === 'IMAGE') {
        return printTicketAsImage(data, settings, onLog);
    }

    const encodingMode = settings.printerConfig.encodingMode || 'UTF8';

    const processText = (text: string): string => {
        if (encodingMode === 'NO_ACCENTS') return removeAccents(text);
        return text;
    };

    try {
        if (onLog) onLog("Đang chuẩn bị dữ liệu in...");

        let printCommands: number[] = [];
        const addBytes = (b: number[]) => { printCommands.push(...b); };
        const addText = (t: string) => {
            const encoder = new TextEncoder();
            addBytes(Array.from(encoder.encode(t)));
        };

        // Initialize (ESC @)
        addBytes([0x1B, 0x40]);

        // Configure encoding (CODEPAGE)
        if (encodingMode === 'CODEPAGE') {
            const codePage = settings.printerConfig.codePage || 30;
            addBytes([0x1B, 0x74, codePage]);
        }

        const hNameRaw = settings?.hospitalName || "BENH VIEN";
        const pNameRaw = data?.patientName || "CONG DAN";
        const deptRaw = data?.department || "KHAM BENH";

        const hName = processText(hNameRaw.toUpperCase());
        const pName = processText(pNameRaw.toUpperCase());
        const dept = processText(deptRaw);

        // Header
        addBytes([0x1B, 0x61, 0x01]); // Center
        addBytes([0x1B, 0x45, 0x01]); // Bold On
        addText(hName + "\n");
        addBytes([0x1B, 0x45, 0x00]); // Bold Off
        addText("--------------------------------\n\n");

        let ticketTitleRaw = "PHIẾU ĐĂNG KÝ KHÁM";
        let roomLabelRaw = "PHÒNG KHÁM: ";

        if (data.isQuickNumber) {
            ticketTitleRaw = data.isPriority ? "SỐ ƯU TIÊN" : "SỐ THỨ TỰ";
            roomLabelRaw = "PHÒNG/QUẦY: ";
        } else if (data.type === 'EXECUTION') {
            ticketTitleRaw = "SỐ THỨ TỰ CẬN LÂM SÀNG";
            roomLabelRaw = "PHÒNG THỰC HIỆN: ";
        } else if (data.type === 'PAYMENT') {
            ticketTitleRaw = "SỐ THỨ TỰ THANH TOÁN";
            roomLabelRaw = "QUẦY THU NGÂN: ";
        } else if (data.type === 'DRUG') {
            ticketTitleRaw = "SỐ THỨ TỰ NHẬN THUỐC";
            roomLabelRaw = "QUẦY PHÁT THUỐC: ";
        }

        // Title
        addBytes([0x1B, 0x45, 0x01]); // Bold On
        addText(processText(ticketTitleRaw) + "\n");

        // Ticket Number (Big Font)
        addBytes([0x1D, 0x21, 0x11]);
        addText((data.ticketNumber || "---") + "\n");
        addBytes([0x1D, 0x21, 0x00]);
        addBytes([0x1B, 0x45, 0x00]);
        addText("\n--------------------------------\n");

        // Body
        addBytes([0x1B, 0x61, 0x00]); // Left
        addBytes([0x1B, 0x45, 0x01]); addText(processText("BỆNH NHÂN: ")); addBytes([0x1B, 0x45, 0x00]); addText(pName + "\n");
        addBytes([0x1B, 0x45, 0x01]); addText(processText(roomLabelRaw)); addBytes([0x1B, 0x45, 0x00]); addText(dept + "\n");
        addBytes([0x1B, 0x45, 0x01]); addText(processText("THỜI GIAN: ")); addBytes([0x1B, 0x45, 0x00]); addText(data.time + "\n\n");

        // Footer
        addBytes([0x1B, 0x61, 0x01]); // Center
        addText("--------------------------------\n");
        addText(processText("Vui lòng đợi tới lượt.\nCảm ơn quý khách!") + "\n\n\n\n");

        // Cut
        addBytes([0x1D, 0x56, 0x42, 0x00]);

        return await sendToPrinter(printCommands, settings, onLog);
    } catch (e: any) {
        if (onLog) onLog(`LỖI: ${e.message}`);
        return false;
    }
};

/**
 * Render HTML to Canvas using html2canvas
 * Creates an off-screen element, renders HTML, captures to canvas, then cleans up
 */
const renderHTMLToCanvas = async (html: string): Promise<HTMLCanvasElement> => {
    // Create temporary container
    const container = document.createElement('div');
    container.id = 'printer-render-container';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '576px'; // Đảm bảo width cố định

    // Wrap HTML trong một div chính để html2canvas không bị bắt nhầm thẻ <link> hoặc <style>
    container.innerHTML = `<div id="printer-target" style="width: 576px; background: white; display: inline-block;">${html}</div>`;
    document.body.appendChild(container);

    try {
        // Wait for fonts to load
        await document.fonts.ready;
        // Đợi thêm một chút để layout engine tính toán lại (tránh height 0)
        await new Promise(r => setTimeout(r, 100));

        const target = document.getElementById('printer-target');
        if (!target) throw new Error('Cannot find printer target element');

        // Render to canvas
        const canvas = await html2canvas(target, {
            backgroundColor: '#ffffff',
            scale: 1,
            logging: false,
            useCORS: true,
            width: 576,
        });

        if (canvas.height === 0) {
            throw new Error('Canvas height is 0. Content might be empty or hidden.');
        }

        return canvas;
    } finally {
        // Cleanup
        document.body.removeChild(container);
    }
};

/**
 * Convert canvas to monochrome bitmap for ESC/POS printing
 * Uses Floyd-Steinberg dithering for better quality
 */
const canvasToBitmapCommands = (canvas: HTMLCanvasElement): number[] => {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    // Convert to grayscale and apply threshold
    const threshold = 128;
    const binaryPixels: number[] = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];

            // Convert to grayscale
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;

            // Apply threshold (0 = black, 1 = white)
            binaryPixels.push(gray < threshold ? 0 : 1);
        }
    }

    // Pack pixels into bytes (8 pixels per byte)
    const widthBytes = Math.ceil(width / 8);
    const bitmapData: number[] = [];

    for (let y = 0; y < height; y++) {
        for (let xByte = 0; xByte < widthBytes; xByte++) {
            let byte = 0;
            for (let bit = 0; bit < 8; bit++) {
                const x = xByte * 8 + bit;
                if (x < width) {
                    const pixelIdx = y * width + x;
                    // Invert: 0 = white, 1 = black for ESC/POS
                    if (binaryPixels[pixelIdx] === 0) {
                        byte |= (1 << (7 - bit));
                    }
                }
            }
            bitmapData.push(byte);
        }
    }

    // Build ESC/POS raster image command: GS v 0
    // Format: 1D 76 30 m xL xH yL yH [data]
    const commands: number[] = [];

    // GS v 0 - Print raster bitmap
    commands.push(0x1D, 0x76, 0x30);

    // m = mode (0 = normal, 1 = double width, 2 = double height, 3 = quadruple)
    commands.push(0x00);

    // xL, xH = width in bytes (little-endian)
    commands.push(widthBytes & 0xFF);
    commands.push((widthBytes >> 8) & 0xFF);

    // yL, yH = height in pixels (little-endian)
    commands.push(height & 0xFF);
    commands.push((height >> 8) & 0xFF);

    // Bitmap data
    for (let i = 0; i < bitmapData.length; i++) {
        commands.push(bitmapData[i]);
    }

    return commands;
};

/**
 * Print ticket as image (bitmap)
 * This method eliminates all encoding issues by rendering text as pixels
 * Works on ALL thermal printers that support ESC/POS raster graphics
 */
export const printTicketAsImage = async (
    data: TicketData,
    settings: AppSettings,
    onLog?: (m: string) => void
): Promise<boolean> => {
    if (!settings.printerConfig.enabled) return false;

    try {
        if (onLog) onLog("🖼️ Chế độ: In ảnh (Image Mode)");
        if (onLog) onLog("Đang tạo mẫu phiếu...");

        // Generate HTML template
        const html = generateTicketHTMLForCanvas(data, settings);

        if (onLog) onLog("Đang render HTML thành ảnh...");

        // Render to canvas
        const canvas = await renderHTMLToCanvas(html);

        if (onLog) onLog(`Kích thước ảnh: ${canvas.width}x${canvas.height}px`);
        if (onLog) onLog("Đang chuyển đổi sang bitmap...");

        // Convert to bitmap commands
        const bitmapCommands = canvasToBitmapCommands(canvas);

        if (onLog) onLog(`Kích thước bitmap: ${bitmapCommands.length} bytes`);

        // Send to printer
        return await sendToPrinter(bitmapCommands, settings, onLog);
    } catch (e: any) {
        if (onLog) onLog(`❌ LỖI IN: ${e.message || JSON.stringify(e)}`);
        console.error("Image print error:", e);
        return false;
    }
};

/**
 * Print receipt as image (bitmap)
 */
export const printReceiptAsImage = async (
    data: ReceiptData,
    settings: AppSettings,
    onLog?: (m: string) => void
): Promise<boolean> => {
    if (!settings.printerConfig.enabled) return false;

    try {
        if (onLog) onLog("🖼️ Chế độ: In biên lai (Image Mode)");
        if (onLog) onLog("Đang tạo mẫu biên lai...");

        // Generate HTML template
        const html = generateReceiptHTMLForCanvas(data, settings);

        if (onLog) onLog("Đang render HTML thành ảnh...");

        // Render to canvas
        const canvas = await renderHTMLToCanvas(html);

        if (onLog) onLog(`Kích thước ảnh: ${canvas.width}x${canvas.height}px`);
        if (onLog) onLog("Đang chuyển đổi sang bitmap...");

        // Convert to bitmap commands
        const bitmapCommands = canvasToBitmapCommands(canvas);

        if (onLog) onLog(`Kích thước bitmap: ${bitmapCommands.length} bytes`);

        // Send to printer
        return await sendToPrinter(bitmapCommands, settings, onLog);
    } catch (e: any) {
        if (onLog) onLog(`❌ LỖI IN: ${e.message || JSON.stringify(e)}`);
        console.error("Receipt image print error:", e);
        return false;
    }
};

export const DEFAULT_HTML_TEMPLATE = "";