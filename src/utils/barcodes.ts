import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 180,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

export function renderBarcodeToCanvas(canvas: HTMLCanvasElement, text: string) {
  try {
    JsBarcode(canvas, text, {
      format: 'CODE128',
      width: 1.5,
      height: 38,
      displayValue: true,
      fontSize: 11,
      margin: 2,
      font: 'monospace'
    });
  } catch (err) {
    console.error('Error generating Barcode:', err);
  }
}

export async function generateBarcodeDataUrl(text: string): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, text, {
      format: 'CODE128',
      width: 1.6,
      height: 40,
      displayValue: true,
      fontSize: 11,
      margin: 2,
      font: 'monospace'
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Error generating barcode data URL:', err);
    return '';
  }
}
