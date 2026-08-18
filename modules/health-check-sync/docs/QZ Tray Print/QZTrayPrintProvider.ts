import qz from 'qz-tray';
import type { PrintOptions, PrintProvider } from './PrintProvider';
import { PAPER_SIZE } from './PaperSize';
import { QZConnection } from './QZConnection';

export class QZTrayPrintProvider implements PrintProvider {
  private connection = QZConnection.getInstance();

  async print(options: PrintOptions): Promise<void> {
    console.log('[Printing] [QZ] Starting QZ Tray print job...');

    // 1. Ensure connection is active
    await this.connection.connect();

    // 2. Validate printer
    const printerName = options.printer;
    if (!printerName) {
      throw new Error('Không tìm thấy máy in. Vui lòng cấu hình máy in mặc định.');
    }

    // 3. Prepare print data & detect type
    let htmlData = options.html;
    const extraOptions = options as any;
    const qrHtml = extraOptions.qrHtml || '';
    const isPdfBase64 = extraOptions.isPdfBase64 === true
      || (typeof htmlData === 'string' && htmlData.trimStart().startsWith('JVBERi'));

    // 4. Resolve page size & configuration settings
    const paperKey = options.paper || 'A5';
    const sizeConfig = PAPER_SIZE[paperKey];
    
    const configOptions: any = {
      orientation: options.orientation || 'portrait',
      copies: options.copies || 1,
      scaleContent: false
    };

    if (isPdfBase64) {
      configOptions.scaleContent = true;
      configOptions.margins = 0;
    }

    if (sizeConfig) {
      configOptions.size = {
        width: sizeConfig.width,
        height: sizeConfig.height
      };
      configOptions.units = sizeConfig.units;
    }

    console.log(`[Printing] [QZ] Printing to "${printerName}" with config:`, configOptions);

    // 5. Create print configuration
    const config = qz.configs.create(printerName, configOptions);

    let data: any[];

    if (isPdfBase64) {
      // ── PDF base64 mode (từ DOCX render) ─────────────────────────────────────
      console.log('[Printing] [QZ] Sending PDF as base64 to QZ Tray...');
      data = [{
        type: 'pixel',
        format: 'pdf',
        flavor: 'base64',
        data: htmlData,
        options: {
          ignoreTransparency: true
        }
      }];
    } else {
      // ── HTML mode (thông thường) ──────────────────────────────────────────────
      if (qrHtml) {
        if (htmlData.includes('</body>')) {
          htmlData = htmlData.replace('</body>', `${qrHtml}</body>`);
        } else {
          htmlData = htmlData + qrHtml;
        }
      }
      data = [{
        type: 'pixel',
        format: 'html',
        flavor: 'plain',
        data: htmlData
      }];
    }

    console.log('[QZ PDF Debug]', {
      isPdfBase64,
      base64Length: htmlData.length,
      base64Prefix: htmlData.substring(0, 20),
      configOptions,
      printData: {
        type: data[0]?.type,
        format: data[0]?.format,
        flavor: data[0]?.flavor
      }
    });

    // 6. Execute print
    try {
      await qz.print(config, data);
      console.log('[Printing] [QZ] Print job sent to QZ Tray successfully.');
    } catch (err: any) {
      console.error('[Printing] [QZ] Printing error:', err);
      throw new Error(`Máy in từ chối lệnh in hoặc xảy ra lỗi. Chi tiết: ${err.message || err}`);
    }
  }

  async getPrinters(): Promise<string[]> {
    console.log('[Printing] [QZ] Fetching printer list from QZ Tray...');
    try {
      await this.connection.connect();
      const printers = await qz.printers.find();
      console.log(`[Printing] [QZ] Found ${printers.length} printers.`);
      return printers;
    } catch (err: any) {
      console.error('[Printing] [QZ] Error fetching printers:', err);
      throw new Error(`Không thể lấy danh sách máy in từ QZ Tray. Chi tiết: ${err.message || err}`);
    }
  }
}
