import { registerPlugin } from '@capacitor/core';

export interface PrinterPlugin {
    echo(options: { value: string }): Promise<{ value: string }>;
    connect(options: { address?: string, type?: number }): Promise<void>;
    printText(options: { text: string }): Promise<void>;
    printRaw(options: { data: string }): Promise<void>;
    getUsbPrinters(): Promise<{ printers: { name: string; address: string; vendorId: number; productId: number; deviceId: number; hasPermission: boolean }[] }>;
    requestPermissions(options: { address?: string; deviceId?: number }): Promise<{ granted: boolean; status?: string }>;
}

const Printer = registerPlugin<PrinterPlugin>('Printer');

export default Printer;
