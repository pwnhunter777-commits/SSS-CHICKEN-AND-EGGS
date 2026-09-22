import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Bill,
  getShopDisplayAddress,
  getShopDisplayName,
  HotelItem,
  LanguageCode,
  ProductItem,
  resolveHotelDisplayName,
  resolveItemDisplayName,
  ShopSettings,
} from '../types';
import { formatDisplayDate, formatDisplayTime, getHotelPhone } from './storage';

export async function generateBillPdfBlob(
  bill: Bill,
  settings: ShopSettings,
  recipientPhone?: string,
  elementId: string = 'printable-thermal-receipt',
  lang: LanguageCode = 'en',
  hotels: HotelItem[] = [],
  products: ProductItem[] = []
): Promise<Blob | null> {
  // 1. High-Fidelity DOM Capture (Preserves Exact Tamil Typography & Screenshot Layout)
  const receiptElem = document.getElementById(elementId);
  if (receiptElem) {
    try {
      // Measure natural dimensions so no edges or table columns are cropped on narrow viewports
      const naturalWidth = Math.max(400, receiptElem.scrollWidth || 0, receiptElem.offsetWidth || 0);
      const naturalHeight = Math.max(receiptElem.scrollHeight || 0, receiptElem.offsetHeight || 0);

      const dataUrl = await toPng(receiptElem, {
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        cacheBust: true,
        quality: 1,
        width: naturalWidth,
        height: naturalHeight,
        style: {
          width: `${naturalWidth}px`,
          minWidth: `${naturalWidth}px`,
          maxWidth: 'none',
          boxSizing: 'border-box',
          margin: '0',
          transform: 'none',
        },
      });

      let imgWidthPx = 0;
      let imgHeightPx = 0;
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          imgWidthPx = img.naturalWidth || img.width;
          imgHeightPx = img.naturalHeight || img.height;
          resolve();
        };
        img.onerror = (err) => reject(err);
        img.src = dataUrl;
      });

      const pdfWidth = 148; // Standard A5 width in mm
      const margin = 5;
      const printableWidth = pdfWidth - margin * 2;
      const imgHeightMm = (imgHeightPx * printableWidth) / (imgWidthPx || 1);
      const dynamicPageHeight = Math.max(210, Math.ceil(imgHeightMm + margin * 2));

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, dynamicPageHeight],
        compress: true,
      });

      pdf.addImage(dataUrl, 'PNG', margin, margin, printableWidth, imgHeightMm, undefined, 'FAST');

      return pdf.output('blob');
    } catch (domErr) {
      console.warn('DOM rasterization to PDF failed, proceeding to vector generator:', domErr);
    }
  }

  // 2. Vector PDF Generator strictly adhering to standard A5 Wholesale Bill dimensions and screenshot styling
  try {
    const isTamil = lang === 'ta';
    const curr = isTamil ? 'ரூ. ' : 'Rs. ';
    const pageWidth = 148; // Standard A5 width in mm
    const margin = 6;
    const contentWidth = pageWidth - margin * 2;
    const billAmount = Math.round(bill.totalAmount);

    // Store details ALWAYS in English itself (explicit user mandate)
    const englishShopName = (settings.shopNameEn || settings.shopName || 'SSS CHICKEN AGENCY').toUpperCase();
    const englishAddress = (settings.addressEn || settings.address || 'NO 6, PONDY MAIN ROAD, SULTHANPET, VILLIANUR, PUDUCHERRY - 605 110').toUpperCase();
    const phone = settings.phoneNumber || '8680000003';
    const gst = settings.gstNumber || '34AQPN8846J2ZF';

    const finalPhone = (recipientPhone || bill.hotelPhone || getHotelPhone(bill.hotelName, hotels) || '').trim();
    const hotelName = resolveHotelDisplayName(bill.hotelName, bill.hotelId, hotels, lang);

    const prevBalance = Math.round(bill.previousBalance || 0);
    const hasPrevBal = prevBalance !== 0;
    const netTotal = bill.netTotalWithBalance !== undefined
      ? Math.round(bill.netTotalWithBalance)
      : Math.round(billAmount + prevBalance);

    const itemCount = Math.max(1, bill.items.length);
    const tableHeight = 10 + itemCount * 7.5;
    const metaBoxH = hasPrevBal ? (finalPhone ? 19 : 17) : (finalPhone ? 15 : 13);
    const calcBoxH = hasPrevBal ? 14 : 8; // Row for bill amount + old balance if present
    const estimatedContentH =
      22 +
      metaBoxH + 4 +
      tableHeight + 4 +
      8 +
      calcBoxH + 4 +
      16;

    // Standard A5 page height (210mm), or expand dynamically if bill has many items
    const pageHeight = Math.max(210, Math.ceil(estimatedContentH + margin * 2));
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pageWidth, pageHeight],
      compress: true,
    });

    // Single outer rounded border matching screenshot
    pdf.setDrawColor(30, 41, 59);
    pdf.setLineWidth(0.6);
    pdf.roundedRect(margin, margin, contentWidth, pageHeight - margin * 2, 4, 4, 'S');

    let curY = margin + 6;

    // Shop Header: ALWAYS English
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.setTextColor(15, 23, 42);
    pdf.text(englishShopName, pageWidth / 2, curY, { align: 'center' });
    curY += 4.5;

    if (englishAddress) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(51, 65, 85);
      pdf.text(englishAddress, pageWidth / 2, curY, { align: 'center', maxWidth: 120 });
      curY += 4;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`Phone: ${phone}   |   GSTIN: ${gst}`, pageWidth / 2, curY, { align: 'center' });
    curY += 3.5;

    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.3);
    pdf.line(margin + 2, curY, pageWidth - margin - 2, curY);
    curY += 2.5;

    // Customer / Hotel Meta Box
    const metaBoxY = curY;
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(203, 213, 225);
    pdf.roundedRect(margin + 2, metaBoxY, contentWidth - 4, metaBoxH, 1.5, 1.5, 'FD');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text(isTamil ? 'ஹோட்டல் / வாடிக்கையாளர்:' : 'HOTEL / CUSTOMER:', margin + 5, metaBoxY + 4);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    pdf.text(hotelName, margin + 5, metaBoxY + 8.5, { maxWidth: 68 });
    if (finalPhone) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(5, 150, 105);
      pdf.text(`Ph: ${finalPhone}`, margin + 5, metaBoxY + 12.5);
    }
    if (hasPrevBal) {
      const prevBalY = finalPhone ? metaBoxY + 16.5 : metaBoxY + 13;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(225, 29, 72);
      pdf.text(`${isTamil ? 'பழைய பாக்கி:' : 'Old Bal:'} ${curr}${prevBalance.toLocaleString('en-IN')}`, margin + 5, prevBalY);
    }

    pdf.setDrawColor(203, 213, 225);
    pdf.line(82, metaBoxY, 82, metaBoxY + metaBoxH);

    const billTimeStr = formatDisplayTime(bill.createdAt, lang);
    const billDateStr = formatDisplayDate(bill.date, lang);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`${isTamil ? 'பில் எண்' : 'Bill No'}: #${bill.billNumber}`, contentWidth + margin - 5, metaBoxY + 4.5, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`${isTamil ? 'தேதி' : 'Date'}: ${billDateStr}`, contentWidth + margin - 5, metaBoxY + 8.5, { align: 'right' });
    if (billTimeStr) {
      pdf.text(`${isTamil ? 'நேரம்' : 'Time'}: ${billTimeStr}`, contentWidth + margin - 5, metaBoxY + 12, { align: 'right' });
    }
    curY = metaBoxY + metaBoxH + 2.5;

    // Items Table
    const tableBody = bill.items.map((item, idx) => {
      const itemName = resolveItemDisplayName(item, products, lang);
      const unit = isTamil ? 'கிலோ' : 'KG';
      return [
        (idx + 1).toString(),
        itemName,
        `${item.kg.toFixed(2)} ${unit}`,
        `${curr}${Math.round(item.pricePerKg)}`,
        `${curr}${Math.round(item.amount).toLocaleString('en-IN')}`,
      ];
    });

    const headers = isTamil
      ? [['#', 'பொருள் பெயர்', 'எடை (கிலோ)', 'விலை (ரூ)', 'தொகை (ரூ)']]
      : [['#', 'ITEM NAME', 'WEIGHT (KG)', 'RATE (RS)', 'AMOUNT (RS)']];

    autoTable(pdf, {
      startY: curY,
      margin: { left: margin + 2, right: margin + 2 },
      head: headers,
      body: tableBody,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        cellPadding: 2.2,
        lineColor: [203, 213, 225],
        lineWidth: 0.2,
        textColor: [15, 23, 42],
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'left', fontStyle: 'bold' },
        2: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },
        3: { halign: 'right', cellWidth: 22 },
        4: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 28 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    curY = (pdf as any).lastAutoTable.finalY + 2;

    // Total Weight Row
    pdf.setFillColor(241, 245, 249);
    pdf.setDrawColor(203, 213, 225);
    pdf.roundedRect(margin + 2, curY, contentWidth - 4, 6, 1, 1, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(isTamil ? 'மொத்த எடை:' : 'TOTAL WEIGHT:', margin + 5, curY + 4.2);
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`${bill.totalKg.toFixed(2)}`, contentWidth + margin - 5, curY + 4.2, { align: 'right' });
    curY += 8;

    // Bill Amount and Previous Balance Summary Box
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(203, 213, 225);
    pdf.roundedRect(margin + 2, curY, contentWidth - 4, calcBoxH, 1, 1, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(isTamil ? 'பில் தொகை:' : 'Current Bill Amount:', margin + 5, curY + 5.2);
    pdf.setFontSize(9.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`${curr}${billAmount.toLocaleString('en-IN')}`, contentWidth + margin - 5, curY + 5.2, {
      align: 'right',
    });

    if (hasPrevBal) {
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin + 4, curY + 7.5, contentWidth + margin - 4, curY + 7.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(225, 29, 72);
      pdf.text(isTamil ? 'பழைய பாக்கி:' : 'Previous Balance:', margin + 5, curY + 11.5);
      pdf.setFontSize(9.5);
      pdf.setTextColor(225, 29, 72);
      pdf.text(`${curr}${prevBalance.toLocaleString('en-IN')}`, contentWidth + margin - 5, curY + 11.5, {
        align: 'right',
      });
    }
    curY += calcBoxH + 2.5;

    // Grand Total Banner: strictly bill amount + previous balance
    pdf.setFillColor(15, 23, 42);
    pdf.roundedRect(margin + 2, curY, contentWidth - 4, 15, 1.5, 1.5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(203, 213, 225);
    const totalLabel = hasPrevBal
      ? (isTamil ? 'மொத்தம் செலுத்த வேண்டிய தொகை' : 'TOTAL PAYABLE DUE')
      : (isTamil ? 'மொத்தத் தொகை' : 'GRAND TOTAL');
    pdf.text(totalLabel, pageWidth / 2, curY + 4.5, { align: 'center' });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`${curr}${netTotal.toLocaleString('en-IN')}/-`, pageWidth / 2, curY + 11.8, {
      align: 'center',
    });

    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating A5 wholesale bill PDF:', error);
    return null;
  }
}

export async function downloadBillPdf(
  bill: Bill,
  settings: ShopSettings,
  recipientPhone?: string,
  elementId: string = 'printable-thermal-receipt',
  lang: LanguageCode = 'en',
  hotels: HotelItem[] = [],
  products: ProductItem[] = []
): Promise<boolean> {
  const filename = `A5_Bill_${bill.billNumber}_${bill.date}.pdf`;
  const blob = await generateBillPdfBlob(bill, settings, recipientPhone, elementId, lang, hotels, products);
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}

export async function shareBillAsPdfToWhatsApp(
  bill: Bill,
  settings: ShopSettings,
  phoneNumber?: string,
  elementId: string = 'printable-thermal-receipt',
  lang: LanguageCode = 'en',
  hotels: HotelItem[] = [],
  products: ProductItem[] = []
): Promise<{ success: boolean; sharedDirectly: boolean; message: string }> {
  const filename = `A5_Bill_${bill.billNumber}_${bill.date}.pdf`;
  const targetPhone = (phoneNumber || bill.hotelPhone || getHotelPhone(bill.hotelName, hotels) || '').trim();
  let cleanNumber = '';
  if (targetPhone.length > 0) {
    cleanNumber = targetPhone.replace(/\D/g, '');
    if (cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber;
    }
  }

  const pdfBlob = await generateBillPdfBlob(bill, settings, targetPhone, elementId, lang, hotels, products);
  if (!pdfBlob) {
    openWhatsAppChatWithoutText(cleanNumber);
    return {
      success: false,
      sharedDirectly: false,
      message: 'Could not generate PDF. Opened WhatsApp chat.',
    };
  }

  const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    if (navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: `Bill #${bill.billNumber} - ${bill.hotelName}`,
        });
        return {
          success: true,
          sharedDirectly: true,
          message: 'A5 Bill PDF shared to WhatsApp!',
        };
      } catch (shareErr: any) {
        if (shareErr?.name === 'AbortError') {
          return {
            success: true,
            sharedDirectly: true,
            message: 'Share cancelled by user.',
          };
        }
        console.log('Native PDF share skipped or failed, falling back:', shareErr);
      }
    }
  }

  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  openWhatsAppChatWithoutText(cleanNumber);
  return {
    success: true,
    sharedDirectly: false,
    message: 'A5 PDF saved to device and WhatsApp opened!',
  };
}

export function openWhatsAppChatWithoutText(phoneNumber?: string): void {
  let url = '';
  if (phoneNumber && phoneNumber.trim().length > 0) {
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber;
    }
    url = `https://wa.me/${cleanNumber}`;
  } else {
    url = `https://api.whatsapp.com/`;
  }
  window.open(url, '_blank');
}

export function openWhatsAppChatWithText(text: string, phoneNumber?: string): void {
  let cleanNumber = '';
  if (phoneNumber && phoneNumber.trim().length > 0) {
    cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber;
    }
  }
  let url = '';
  if (cleanNumber) {
    url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
  } else {
    url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  }
  window.open(url, '_blank');
}

export interface HotelBalanceShareData {
  hotelName: string;
  hotelNameTa?: string;
  hotelPhone?: string;
  totalBilled: number;
  totalPaid: number;
  totalBalAdded?: number;
  balance: number;
  totalKg: number;
  billCount: number;
  paymentCount: number;
  recentBills?: { billNumber: number; date: string; amount: number; kg: number }[];
  recentPayments?: { date: string; amount: number; mode?: string }[];
}

export function generateHotelBalanceWhatsAppText(
  data: HotelBalanceShareData,
  settings: ShopSettings,
  lang: LanguageCode = 'en'
): string {
  const isTa = lang === 'ta';
  const shopName = getShopDisplayName(settings, lang);
  const dateStr = new Date().toLocaleDateString(isTa ? 'ta-IN' : 'en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = new Date().toLocaleTimeString(isTa ? 'ta-IN' : 'en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const hotelDisplayName = isTa && data.hotelNameTa ? data.hotelNameTa : data.hotelName;
  const balanceInt = Math.round(data.balance);

  let msg = `*${shopName.toUpperCase()}*\n`;
  if (settings.phoneNumber) {
    msg += `📞 ${settings.phoneNumber}\n`;
  }
  msg += `*${isTa ? 'பாக்கி கணக்கு விவரம் / BALANCE STATEMENT' : 'BALANCE STATEMENT / BILL SLIP'}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🏨 *${isTa ? 'ஹோட்டல்' : 'Customer/Hotel'}:* ${hotelDisplayName}\n`;
  if (data.hotelPhone) {
    msg += `📱 *${isTa ? 'போன்' : 'Phone'}:* ${data.hotelPhone}\n`;
  }
  msg += `📅 *${isTa ? 'தேதி' : 'Date'}:* ${dateStr} (${timeStr})\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📊 *${isTa ? 'கணக்கு விவரம்' : 'Account Summary'}:*\n`;
  msg += `• ${isTa ? 'மொத்த பில் வரவு' : 'Total Billed'}: ₹${Math.round(data.totalBilled).toLocaleString('en-IN')} (${data.billCount} ${isTa ? 'பில்கள்' : 'bills'} • ${data.totalKg.toFixed(1)} Kg)\n`;
  if (data.totalBalAdded && data.totalBalAdded !== 0) {
    if (data.totalBalAdded > 0) {
      msg += `• ${isTa ? 'பாக்கி கூட்டல் / ஆரம்ப இருப்பு' : 'Balance Added / Opening Bal'}: +₹${Math.round(data.totalBalAdded).toLocaleString('en-IN')}\n`;
    } else {
      msg += `• ${isTa ? 'ஆரம்ப முன்பணம் (Credit)' : 'Opening Credit'}: -₹${Math.abs(Math.round(data.totalBalAdded)).toLocaleString('en-IN')}\n`;
    }
  }
  msg += `• ${isTa ? 'செலுத்திய வரவு' : 'Total Paid'}: ₹${Math.round(data.totalPaid).toLocaleString('en-IN')} (${data.paymentCount} ${isTa ? 'வரவுகள்' : 'payments'})\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;

  if (balanceInt > 0) {
    msg += `💰 *${isTa ? 'மீதி செலுத்த வேண்டிய தொகை' : 'PENDING BALANCE DUE'}:*\n`;
    msg += `👉 *₹${balanceInt.toLocaleString('en-IN')}*\n`;
  } else if (balanceInt === 0) {
    msg += `✅ *${isTa ? 'அனைத்து கணக்கும் செலுத்தப்பட்டது' : 'ACCOUNT FULLY SETTLED'}* (₹0)\n`;
  } else {
    msg += `🌟 *${isTa ? 'முன்பணம் உள்ளது' : 'ADVANCE BALANCE'}:* ₹${Math.abs(balanceInt).toLocaleString('en-IN')}\n`;
  }
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;

  if (data.recentBills && data.recentBills.length > 0) {
    msg += `🧾 *${isTa ? 'சமீபத்திய பில்கள்' : 'Recent Bills'}:*\n`;
    data.recentBills.slice(0, 3).forEach((b) => {
      msg += `  #${b.billNumber} (${b.date}): ₹${Math.round(b.amount).toLocaleString('en-IN')} [${b.kg.toFixed(1)}kg]\n`;
    });
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  }

  msg += `${isTa ? 'நன்றி! மீண்டும் வருக!' : 'Thank you for your business!'}`;
  return msg;
}

export async function generateHotelStatementPdfBlob(
  data: HotelBalanceShareData,
  settings: ShopSettings,
  elementId: string = 'printable-hotel-statement',
  lang: LanguageCode = 'en'
): Promise<Blob | null> {
  const statementElem = document.getElementById(elementId);

  // 1. High-DPI DOM rasterization
  if (statementElem) {
    try {
      const naturalWidth = Math.max(400, statementElem.scrollWidth || 0, statementElem.offsetWidth || 0);
      const naturalHeight = Math.max(statementElem.scrollHeight || 0, statementElem.offsetHeight || 0);

      const dataUrl = await toPng(statementElem, {
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        cacheBust: true,
        quality: 1,
        width: naturalWidth,
        height: naturalHeight,
        style: {
          width: `${naturalWidth}px`,
          minWidth: `${naturalWidth}px`,
          maxWidth: 'none',
          boxSizing: 'border-box',
          margin: '0',
          transform: 'none',
        },
      });

      let imgWidthPx = 0;
      let imgHeightPx = 0;
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          imgWidthPx = img.naturalWidth || img.width;
          imgHeightPx = img.naturalHeight || img.height;
          resolve();
        };
        img.onerror = (err) => reject(err);
        img.src = dataUrl;
      });

      const pdfWidth = 148; // Standard A5 width in mm
      const margin = 4;
      const printableWidth = pdfWidth - margin * 2;
      const imgHeightMm = (imgHeightPx * printableWidth) / (imgWidthPx || 1);
      const dynamicPageHeight = Math.ceil(imgHeightMm + margin * 2);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, dynamicPageHeight],
        compress: true,
      });

      pdf.addImage(dataUrl, 'PNG', margin, margin, printableWidth, imgHeightMm, undefined, 'FAST');
      return pdf.output('blob');
    } catch (domErr) {
      console.warn('DOM to Statement PDF image capture failed, falling back to vector:', domErr);
    }
  }

  // 2. Vector PDF fallback generator
  try {
    const pageWidth = 148;
    const pageHeight = 210;
    const margin = 8;
    const contentWidth = pageWidth - margin * 2;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pageWidth, pageHeight],
      compress: true,
    });

    pdf.setDrawColor(30, 41, 59);
    pdf.setLineWidth(0.4);
    pdf.rect(margin, margin, contentWidth, pageHeight - margin * 2, 'S');

    let curY = margin + 6;
    const shopName = getShopDisplayName(settings, lang);
    const shopAddress = getShopDisplayAddress(settings, lang);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(15, 23, 42);
    pdf.text(shopName.toUpperCase(), pageWidth / 2, curY, { align: 'center' });
    curY += 5;

    if (shopAddress) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(51, 65, 85);
      pdf.text(shopAddress, pageWidth / 2, curY, { align: 'center', maxWidth: 120 });
      curY += 4;
    }

    const phone = settings.phoneNumber || '8680000003';
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`Phone: ${phone}`, pageWidth / 2, curY, { align: 'center' });
    curY += 4;

    pdf.setDrawColor(203, 213, 225);
    pdf.line(margin + 2, curY, pageWidth - margin - 2, curY);
    curY += 4;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(5, 150, 105);
    pdf.text('HOTEL BALANCE STATEMENT', pageWidth / 2, curY, { align: 'center' });
    curY += 6;

    // Hotel Box
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(203, 213, 225);
    pdf.roundedRect(margin + 4, curY, contentWidth - 8, 16, 1, 1, 'FD');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text('CUSTOMER / HOTEL:', margin + 7, curY + 5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(15, 23, 42);
    pdf.text(data.hotelName, margin + 7, curY + 11);

    if (data.hotelPhone) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`Phone: ${data.hotelPhone}`, contentWidth + margin - 7, curY + 11, { align: 'right' });
    }
    curY += 22;

    // Summary Box
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(51, 65, 85);
    pdf.text(`Total Billed: Rs. ${Math.round(data.totalBilled).toLocaleString('en-IN')}`, margin + 7, curY);
    curY += 5;
    if (data.totalBalAdded && data.totalBalAdded !== 0) {
      const balLabel = data.totalBalAdded > 0
        ? `Balance Added / Opening Bal: +Rs. ${Math.round(data.totalBalAdded).toLocaleString('en-IN')}`
        : `Opening Credit: -Rs. ${Math.abs(Math.round(data.totalBalAdded)).toLocaleString('en-IN')}`;
      pdf.text(balLabel, margin + 7, curY);
      curY += 5;
    }
    pdf.text(`Total Paid: Rs. ${Math.round(data.totalPaid).toLocaleString('en-IN')}`, margin + 7, curY);
    curY += 7;

    // Balance Banner
    const isDue = data.balance >= 0;
    pdf.setFillColor(isDue ? 225 : 2, isDue ? 29 : 132, isDue ? 72 : 199); // Rose for due, cyan/blue for advance
    pdf.roundedRect(margin + 4, curY, contentWidth - 8, 14, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    pdf.text(
      isDue
        ? `NET BALANCE DUE: Rs. ${Math.round(data.balance).toLocaleString('en-IN')}`
        : `ADVANCE BALANCE: Rs. ${Math.abs(Math.round(data.balance)).toLocaleString('en-IN')}`,
      pageWidth / 2,
      curY + 9,
      { align: 'center' }
    );
    curY += 18;

    // Optional: Recent Bills Table
    if (data.recentBills && data.recentBills.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text('RECENT BILLS / சமீபத்திய பில்கள்:', margin + 4, curY);
      curY += 2;

      autoTable(pdf, {
        startY: curY,
        margin: { left: margin + 4, right: margin + 4 },
        head: [['Date', 'Bill #', 'Weight (Kg)', 'Amount (Rs.)']],
        body: data.recentBills.slice(0, 5).map((b) => [
          b.date,
          `#${b.billNumber}`,
          b.kg ? `${b.kg.toFixed(2)} kg` : '-',
          `Rs. ${Math.round(b.amount).toLocaleString('en-IN')}`,
        ]),
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 1.5 },
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        columnStyles: {
          0: { halign: 'center', cellWidth: 26 },
          1: { halign: 'center', cellWidth: 20 },
          2: { halign: 'right', cellWidth: 28 },
          3: { halign: 'right', fontStyle: 'bold' },
        },
      });
      curY = (pdf as any).lastAutoTable?.finalY ? (pdf as any).lastAutoTable.finalY + 4 : curY + 25;
    }

    // Optional: Recent Payments Table
    if (data.recentPayments && data.recentPayments.length > 0 && curY < pageHeight - 35) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text('RECENT PAYMENTS / செலுத்திய தொகை:', margin + 4, curY);
      curY += 2;

      autoTable(pdf, {
        startY: curY,
        margin: { left: margin + 4, right: margin + 4 },
        head: [['Date', 'Mode', 'Amount (Rs.)']],
        body: data.recentPayments.slice(0, 4).map((p) => [
          p.date,
          p.mode?.toUpperCase() || 'CASH',
          `Rs. ${Math.round(p.amount).toLocaleString('en-IN')}`,
        ]),
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 1.5 },
        headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        columnStyles: {
          0: { halign: 'center', cellWidth: 32 },
          1: { halign: 'center', cellWidth: 35 },
          2: { halign: 'right', fontStyle: 'bold' },
        },
      });
      curY = (pdf as any).lastAutoTable?.finalY ? (pdf as any).lastAutoTable.finalY + 4 : curY + 20;
    }

    return pdf.output('blob');
  } catch (e) {
    console.error('Vector statement PDF generation error:', e);
    return null;
  }
}

export async function downloadHotelStatementPdf(
  data: HotelBalanceShareData,
  settings: ShopSettings,
  elementId: string = 'printable-hotel-statement',
  lang: LanguageCode = 'en'
): Promise<boolean> {
  const safeName = (data.hotelName || 'Hotel').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Statement_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;
  const blob = await generateHotelStatementPdfBlob(data, settings, elementId, lang);
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}

export async function shareHotelStatementAsPdfToWhatsApp(
  data: HotelBalanceShareData,
  settings: ShopSettings,
  elementId: string = 'printable-hotel-statement',
  lang: LanguageCode = 'en'
): Promise<{ success: boolean; sharedDirectly: boolean; message: string }> {
  const safeName = (data.hotelName || 'Hotel').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Statement_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;
  const messageText = generateHotelBalanceWhatsAppText(data, settings, lang);

  let cleanNumber = '';
  if (data.hotelPhone && data.hotelPhone.trim().length > 0) {
    cleanNumber = data.hotelPhone.replace(/\D/g, '');
    if (cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber;
    }
  }

  const pdfBlob = await generateHotelStatementPdfBlob(data, settings, elementId, lang);
  if (!pdfBlob) {
    openWhatsAppChatWithText(messageText, cleanNumber);
    return {
      success: true,
      sharedDirectly: false,
      message: 'Opened WhatsApp with balance statement!',
    };
  }

  const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    if (navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: `Balance Statement - ${data.hotelName}`,
          text: messageText,
        });
        return {
          success: true,
          sharedDirectly: true,
          message: 'Statement PDF shared to WhatsApp!',
        };
      } catch (shareErr: any) {
        if (shareErr?.name === 'AbortError') {
          return {
            success: true,
            sharedDirectly: true,
            message: 'Share cancelled by user.',
          };
        }
        console.log('Native Statement PDF share skipped or failed, falling back:', shareErr);
      }
    }
  }

  // Fallback: download PDF and open WhatsApp with pre-filled text
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  openWhatsAppChatWithText(messageText, cleanNumber);
  return {
    success: true,
    sharedDirectly: false,
    message: 'PDF saved and WhatsApp opened with statement text!',
  };
}
