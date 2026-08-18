import qz from 'qz-tray';
import { PrinterManager } from './PrinterManager';

export class QZConnection {
  private static instance: QZConnection | null = null;
  private connectingPromise: Promise<void> | null = null;

  private constructor() {
    // Configure signing: QZ Tray will call this for every request
    qz.security.setSignatureAlgorithm('SHA512');

    qz.security.setCertificatePromise((resolve: (cert: string) => void) => {
      resolve(
        "-----BEGIN CERTIFICATE-----\n" +
        "MIIDWTCCAkGgAwIBAgIJVD0YX+yi3MV7MA0GCSqGSIb3DQEBCwUAMD0xGTAXBgNV\n" +
        "BAMTEEhJUyBPbmxpbmUgUHJpbnQxEzARBgNVBAoTCkhJUyBPbmxpbmUxCzAJBgNV\n" +
        "BAYTAlZOMB4XDTI2MDcxNDE3MjY1MVoXDTI3MDcxNDE3MjY1MVowPTEZMBcGA1UE\n" +
        "AxMQSElTIE9ubGluZSBQcmludDETMBEGA1UEChMKSElTIE9ubGluZTELMAkGA1UE\n" +
        "BhMCVk4wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCruZXF5aQ2KqsZ\n" +
        "9N9MXglyk8ULwjzRcAnkqiqtlwbDGsB33BTtOTi4GNK/OUXUt6DGoBtUAXnBl5u+\n" +
        "7PU83b2BJGpC+ugTfyiU+bRMIHSU9/bFiHL4G9UOAaTl78yvrZMO4d2K6h3rUhOW\n" +
        "3jz9M5D9vfwv4JBnbvQE9L2IR5oqk7PN66E1ghYLu4xnxy8d5yoEV6pHlqdLYszM\n" +
        "ByUNffnT/ohIYuS7sn0b7D1gUiCU5r9uL5zsRY737ePtxM0ql5rUTm+eoMTkS45G\n" +
        "5Cee8ESl3bK7PkCc5JTvg3ZOIla00mAKR1mFgsSghA5PXxPxyk7mtMWOPtzWEk6v\n" +
        "EKmzp7kvAgMBAAGjXDBaMAwGA1UdEwEB/wQCMAAwDgYDVR0PAQH/BAQDAgWgMB0G\n" +
        "A1UdJQQWMBQGCCsGAQUFBwMBBggrBgEFBQcDAjAbBgNVHREEFDASghBISVMgT25s\n" +
        "aW5lIFByaW50MA0GCSqGSIb3DQEBCwUAA4IBAQBLyVys1HliDEw3nDI+rty/Xak9\n" +
        "W7sfc0obzSMDkEn0TlfiqSI6f1LnRbXmdxIiLDJZLylrbQzcmnYfzfGeZe73fEaH\n" +
        "4UAqtQ+JhaCzaKM6AVCm6H3oFDQRlLkrNOKQTmdbAQQaHE4bYbj696WDmIr6LRIf\n" +
        "4SN1fcCY3guOloGAlxBok5m+pw6A547XzSs2rAzC5Qw7Z4fymF0Pqf5liUR65m9Y\n" +
        "7OtWqYQ4uCrD8u/iB99XguCb0qkHoTC4vOTH3hL9yyBYHrMG8zL7SIHqRffD/5mA\n" +
        "tmHgPJym5X13I2OTOzHTDAPtYD6hj35RGTc66zrWvBkWjWYsa+XStKfl43qG\n" +
        "-----END CERTIFICATE-----"
      );
    });

    qz.security.setSignaturePromise((toSign: string) => {
      return (resolve: (sig: string) => void, reject: (err: any) => void) => {
        fetch('/api/v1/qz/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challenge: toSign })
        })
          .then(res => res.json())
          .then(data => {
            if (data.status?.code === 0 && data.signature) {
              resolve(data.signature);
            } else {
              reject(new Error(data.status?.message || 'Signing failed'));
            }
          })
          .catch(err => {
            console.error('[Printing] [QZ] Failed to sign challenge:', err);
            reject(err);
          });
      };
    });

    qz.websocket.setClosedCallbacks((evt: any) => {
      console.warn('[Printing] [QZ] WebSocket connection closed:', evt);
    });
    qz.websocket.setErrorCallbacks((err: any) => {
      console.error('[Printing] [QZ] WebSocket connection error:', err);
    });
  }

  static getInstance(): QZConnection {
    if (!QZConnection.instance) {
      QZConnection.instance = new QZConnection();
    }
    return QZConnection.instance;
  }

  isActive(): boolean {
    return qz.websocket.isActive();
  }

  async connect(): Promise<void> {
    if (this.isActive()) {
      return;
    }

    if (this.connectingPromise) {
      return this.connectingPromise;
    }

    console.log('[Printing] [QZ] Connecting to QZ Tray WebSocket...');
    const host = PrinterManager.getQzHost();
    const retries = PrinterManager.getQzRetries();
    const delay = PrinterManager.getQzDelay();
    const usingSecure = PrinterManager.getQzUseSecure();

    const options = {
      host,
      retries,
      delay,
      usingSecure
    };

    this.connectingPromise = qz.websocket.connect(options)
      .then(() => {
        console.log('[Printing] [QZ] Successfully connected to QZ Tray.');
        this.connectingPromise = null;
      })
      .catch((err: any) => {
        console.error('[Printing] [QZ] QZ Tray connection failed:', err);
        this.connectingPromise = null;
        throw new Error(`Không kết nối được QZ Tray. Vui lòng kiểm tra xem phần mềm QZ Tray đã khởi chạy chưa. Chi tiết: ${err.message || err}`);
      });

    return this.connectingPromise || Promise.resolve();
  }

  async disconnect(): Promise<void> {
    if (!this.isActive()) return;
    console.log('[Printing] [QZ] Disconnecting QZ Tray WebSocket...');
    try {
      await qz.websocket.disconnect();
      console.log('[Printing] [QZ] Disconnected from QZ Tray.');
    } catch (err: any) {
      console.error('[Printing] [QZ] Error disconnecting:', err);
    }
  }
}
