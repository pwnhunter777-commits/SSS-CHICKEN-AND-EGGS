import { Bill, ShopSettings, Language } from '../types';

/**
 * Format plain text receipt with clean column alignment for 80mm (48 cols) / 58mm (32 cols) thermal printers
 * Uses strictly standard ASCII characters and CRLF line breaks to ensure 100% printer compatibility.
 */
export function formatBillReceiptText(bill: Bill, settings: ShopSettings, language: Language = 'en'): string {
  const cols = settings.printerColumns || (settings.printerPaperWidth === '58mm' ? 32 : 48);
  const line = '-'.repeat(cols) + '\r\n';
  const dLine = '='.repeat(cols) + '\r\n';

  let receipt = '';

  // TOP: Hotel Name & Phone Number (Starts immediately with zero top gap)
  const hotel = (bill.hotelName || settings.shopName || 'HOTEL').toUpperCase();
  const phone = bill.hotelPhone || settings.phoneNumber || '';

  const padHotel = Math.max(0, Math.floor((cols - hotel.length) / 2));
  receipt += `${' '.repeat(padHotel)}${hotel}\r\n`;

  if (phone) {
    const phStr = `Ph: ${phone}`;
    const padPh = Math.max(0, Math.floor((cols - phStr.length) / 2));
    receipt += `${' '.repeat(padPh)}${phStr}\r\n`;
  }

  receipt += dLine;

  // Left side: ITEM, Right side: TOTAL (flush to the far right edge)
  const headerSpaces = Math.max(1, cols - 4 - 5);
  receipt += `ITEM${' '.repeat(headerSpaces)}TOTAL\r\n`;
  receipt += line;

  bill.items.forEach((item, index) => {
    const rawName = item.productNameEn || item.productName || 'Chicken';
    const cleanName = rawName.replace(/[^\x20-\x7E]/g, '').trim() || 'Chicken';
    const itemTitle = `${index + 1}. ${cleanName}`;
    const amtStr = `Rs.${Math.round(item.amount)}`;

    if (itemTitle.length + amtStr.length + 1 <= cols) {
      const spaces = cols - itemTitle.length - amtStr.length;
      receipt += `${itemTitle}${' '.repeat(spaces)}${amtStr}\r\n`;
    } else {
      receipt += `${itemTitle}\r\n`;
      const spaces = Math.max(1, cols - amtStr.length);
      receipt += `${' '.repeat(spaces)}${amtStr}\r\n`;
    }

    const qtyStr = `   ${item.kg.toFixed(2)} kg x Rs.${item.pricePerKg}`;
    receipt += `${qtyStr}\r\n`;
  });

  receipt += line;

  // Total: Left side TOTAL, Right side Total Amount (flush right)
  const totalLeft = 'TOTAL:';
  const totalVal = `Rs. ${Math.round(bill.totalAmount)}`;
  const totalSpaces = Math.max(1, cols - totalLeft.length - totalVal.length);
  receipt += `${totalLeft}${' '.repeat(totalSpaces)}${totalVal}\r\n`;
  receipt += dLine;

  // Bottom feed lines to clear the tear bar / give space in the bottom
  const feedLines = settings.printerFeedLines !== undefined ? settings.printerFeedLines : 8;
  if (feedLines > 0) {
    receipt += '\r\n'.repeat(feedLines);
  }

  return receipt;
}

/**
 * Generate binary ESC/POS command buffer for thermal receipt printers
 * Safe commands supported across 100% of 58mm & 80mm mini POS printers.
 * Eliminates top/right margins and provides bottom feed for clean tearing.
 */
export function generateEscPosBytes(bill: Bill, settings: ShopSettings, language: Language = 'en'): Uint8Array {
  const encoder = new TextEncoder();
  const buffer: number[] = [];
  const cols = settings.printerColumns || (settings.printerPaperWidth === '58mm' ? 32 : 48);

  const pushBytes = (...bytes: number[]) => {
    for (let i = 0; i < bytes.length; i++) buffer.push(bytes[i]);
  };

  const pushText = (text: string) => {
    // Ensure clean ASCII to prevent character set corruption in POS printers
    const safeText = text.replace(/[^\x00-\x7F]/g, '');
    const encoded = encoder.encode(safeText);
    for (let i = 0; i < encoded.length; i++) buffer.push(encoded[i]);
  };

  const line = '-'.repeat(cols) + '\r\n';
  const dLine = '='.repeat(cols) + '\r\n';

  // 1. Configure ultra-compact line spacing & zero margin without hardware form-feed
  pushBytes(0x1B, 0x33, 16); // ESC 3 16 -> 16-dot ultra compact line spacing
  pushBytes(0x1B, 0x21, 0x00); // Standard character size
  pushBytes(0x1B, 0x45, 0x00); // Bold OFF
  pushBytes(0x1D, 0x4C, 0x00, 0x00); // GS L 0 0 -> Left margin 0

  const printWidthDots = cols * 12; // 48 * 12 = 576 dots (80mm) or 384 dots (58mm)
  pushBytes(0x1D, 0x57, printWidthDots & 0xFF, (printWidthDots >> 8) & 0xFF); // GS W nL nH -> Full printable width

  // 2. TOP: Hotel Name and Phone Number (Center Align: ESC a 1)
  pushBytes(0x1B, 0x61, 0x01);
  const hotel = (bill.hotelName || settings.shopName || 'HOTEL').toUpperCase();
  const phone = bill.hotelPhone || settings.phoneNumber || '';

  // Hotel Name in Double-Height Bold
  pushBytes(0x1B, 0x21, 0x10); // Double height
  pushBytes(0x1B, 0x45, 0x01); // Bold ON
  pushText(`${hotel}\r\n`);
  pushBytes(0x1B, 0x21, 0x00); // Normal size
  pushBytes(0x1B, 0x45, 0x00); // Bold OFF

  if (phone) {
    pushBytes(0x1B, 0x45, 0x01); // Bold ON
    pushText(`Ph: ${phone}\r\n`);
    pushBytes(0x1B, 0x45, 0x00); // Bold OFF
  }

  pushText(dLine);

  // 5. TABLE HEADER: Left side ITEM, Right side TOTAL (Left Align: ESC a 0)
  pushBytes(0x1B, 0x61, 0x00);
  pushBytes(0x1B, 0x45, 0x01); // Bold ON
  const headerSpaces = Math.max(1, cols - 4 - 5);
  pushText(`ITEM${' '.repeat(headerSpaces)}TOTAL\r\n`);
  pushBytes(0x1B, 0x45, 0x00); // Bold OFF
  pushText(line);

  // 6. ITEMS: Left side item, Right side amount aligned to col 'cols'
  bill.items.forEach((item, index) => {
    const rawName = item.productNameEn || item.productName || 'Chicken';
    const cleanName = rawName.replace(/[^\x20-\x7E]/g, '').trim() || 'Chicken';
    const itemTitle = `${index + 1}. ${cleanName}`;
    const amtStr = `Rs.${Math.round(item.amount)}`;

    pushBytes(0x1B, 0x45, 0x01); // Bold ON
    if (itemTitle.length + amtStr.length + 1 <= cols) {
      const spaces = cols - itemTitle.length - amtStr.length;
      pushText(`${itemTitle}${' '.repeat(spaces)}${amtStr}\r\n`);
    } else {
      pushText(`${itemTitle}\r\n`);
      const spaces = Math.max(1, cols - amtStr.length);
      pushText(`${' '.repeat(spaces)}${amtStr}\r\n`);
    }
    pushBytes(0x1B, 0x45, 0x00); // Bold OFF

    // Quantity / Rate
    const isEggItem =
      item.variant === 'egg' ||
      (item.productNameEn || item.productName || '').toLowerCase().includes('egg');
    if (isEggItem) {
      pushText(`   ${item.kg} Nos x Rs.${item.pricePerKg}\r\n`);
    } else {
      pushText(`   ${item.kg.toFixed(2)} kg x Rs.${item.pricePerKg}\r\n`);
    }
  });

  pushText(line);

  // 7. TOTAL: Left side TOTAL, Right side Total Amount in BIG FONT across full width
  const doubleCols = Math.floor(cols / 2);
  const totalLeft = 'TOTAL:';
  const totalVal = `Rs. ${Math.round(bill.totalAmount)}`;
  const spacesDouble = Math.max(1, doubleCols - totalLeft.length - totalVal.length);

  pushBytes(0x1B, 0x45, 0x01); // Bold ON
  pushBytes(0x1D, 0x21, 0x11); // GS ! 0x11 (2x width + 2x height)
  pushText(`${totalLeft}${' '.repeat(spacesDouble)}${totalVal}\r\n`);
  pushBytes(0x1D, 0x21, 0x00); // Reset font size
  pushBytes(0x1B, 0x45, 0x00); // Bold OFF
  pushText(dLine);

  // 8. BOTTOM: Feed lines after TOTAL to clear tear bar
  const feedLines = settings.printerFeedLines !== undefined ? settings.printerFeedLines : 8;
  if (feedLines > 0) {
    pushBytes(0x1B, 0x64, feedLines); // ESC d n -> Feed lines after total
  }

  if (settings.printerAutoCut) {
    pushBytes(0x1D, 0x56, 0x01); // GS V 1 (Partial cut)
  }

  return new Uint8Array(buffer);
}

export interface BluetoothPrintResult {
  success: boolean;
  message: string;
  isSimulated?: boolean;
}

/**
 * Send bytes safely to Bluetooth LE printer with strict 20-byte MTU chunking
 */
async function sendBytesToCharacteristic(characteristic: any, data: Uint8Array): Promise<void> {
  const CHUNK_SIZE = 20;
  const DELAY_MS = 45; // 45ms pacing for microcontrollers to prevent UART buffer drops

  const canWriteWithoutResp = Boolean(characteristic.properties?.writeWithoutResponse);
  const canWriteWithResp = Boolean(characteristic.properties?.write);

  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    try {
      if (canWriteWithoutResp && characteristic.writeValueWithoutResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      } else if (canWriteWithResp && characteristic.writeValueWithResponse) {
        await characteristic.writeValueWithResponse(chunk);
      } else if (characteristic.writeValue) {
        await characteristic.writeValue(chunk);
      } else if (characteristic.writeValueWithoutResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      }
    } catch (err) {
      try {
        if (characteristic.writeValue) {
          await characteristic.writeValue(chunk);
        }
      } catch (innerErr) {
        console.warn('GATT write error:', innerErr);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }
}

export async function printBillViaBluetooth(
  bill: Bill,
  settings: ShopSettings,
  language: Language = 'en'
): Promise<BluetoothPrintResult> {
  if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) {
    return {
      success: false,
      message: language === 'ta'
        ? 'புளூடூத் ஆதரவு இந்த உலாவியில் இல்லை. பிரிண்ட் விருப்பத்தைப் பயன்படுத்தவும்.'
        : 'Web Bluetooth is not supported on this browser/platform. Please use Print / PDF.',
      isSimulated: true,
    };
  }

  try {
    const bluetooth = (navigator as any).bluetooth;
    const device = await bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Print Service
        'e7810a06-73ae-499d-8c15-faa9aef0c3f2',
        '0000ffe0-0000-1000-8000-00805f9b34fb', // Common BLE Serial (HC-08, PT-210, etc.)
        '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART
        '0000ff00-0000-1000-8000-00805f9b34fb',
        '0000ae00-0000-1000-8000-00805f9b34fb',
        '0000af00-0000-1000-8000-00805f9b34fb',
      ],
    });

    if (!device.gatt) {
      throw new Error('Device does not support GATT connection.');
    }

    const server = await device.gatt.connect();
    const services = await server.getPrimaryServices();
    if (services.length === 0) {
      throw new Error('No compatible printer services found.');
    }

    let writableChar: any = null;
    for (const service of services) {
      try {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.writeWithoutResponse || char.properties.write) {
            writableChar = char;
            break;
          }
        }
        if (writableChar) break;
      } catch (e) {
        // continue search
      }
    }

    if (!writableChar) {
      throw new Error('No writable printer characteristic found on connected Bluetooth device.');
    }

    const data = generateEscPosBytes(bill, settings, language);
    await sendBytesToCharacteristic(writableChar, data);

    return {
      success: true,
      message: language === 'ta'
        ? `பில் #${bill.billNumber} புளூடூத் பிரிண்டரில் வெற்றிகரமாக அச்சிடப்பட்டது!`
        : `Bill #${bill.billNumber} printed successfully on ${device.name || 'Bluetooth printer'}!`,
    };
  } catch (error: any) {
    console.warn('Bluetooth print error:', error);
    return {
      success: false,
      message: error?.message || (language === 'ta' ? 'புளூடூத் அச்சு ரத்து செய்யப்பட்டது.' : 'Bluetooth print cancelled or failed.'),
      isSimulated: true,
    };
  }
}

/**
 * Perform a test print with sample test bill
 */
export async function testPrintBluetooth(
  settings: ShopSettings,
  language: Language = 'en'
): Promise<{ success: boolean; message: string; isSimulated?: boolean }> {
  const dummyBill: Bill = {
    id: 'test_' + Date.now(),
    billNumber: 'TEST-01',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
    hotelName: settings.shopName || 'SSS CHICKEN AND EGG AGENCY',
    items: [
      {
        productId: 'p0',
        productName: 'Chicken (With Skin)',
        productNameEn: 'Chicken (With Skin)',
        productNameTa: 'கோழி (தோலுடன்)',
        variant: 'with_skin',
        baseRate: 220,
        pricePerKg: 220,
        kg: 1.5,
        amount: 330,
      },
    ],
    totalKg: 1.5,
    totalAmount: 330,
  };

  return printBillViaBluetooth(dummyBill, settings, language);
}

