export type Page = 'daily-price' | 'billing' | 'register' | 'total' | 'settings';
export type Language = 'en' | 'ta';
export type ChickenVariant = 'with_skin' | 'without_skin' | 'boneless' | 'egg';

export interface Product {
  id: string;
  name: string; // legacy / primary name
  nameEn?: string; // English name
  nameTa?: string; // Tamil name
  defaultPrice?: number;
}

export function getProductName(product: Product, lang?: string): string {
  if (lang === 'ta') {
    return product.nameTa || product.name || product.nameEn || '';
  }
  return product.nameEn || product.name || product.nameTa || '';
}

export interface DailyPriceMap {
  [date: string]: {
    [productId: string]: number;
  };
}

export interface ShopSettings {
  shopName: string;
  phoneNumber: string;
  gstNumber: string;
  address: string;
  upiId: string;
  withoutSkinOffset?: number; // Extra amount added to With Skin rate for Without Skin (default +50)
  securityPin?: string; // 4-digit PIN (default '1234')
  pinProtectionEnabled?: boolean; // master toggle
  protectDailyPrice?: boolean; // require PIN to edit daily rates
  protectSettings?: boolean; // require PIN to open settings
  protectBillDelete?: boolean; // require PIN to delete a bill in register
  protectAppLock?: boolean; // require PIN on startup / manual lock
  logoUrl?: string; // custom logo url or default /logo.png
  billPrintWidth?: number; // Bill Print Width in cm (default 17)
  printerPaperWidth?: '80mm' | '58mm'; // Thermal paper roll width (80mm default, 58mm)
  printerColumns?: number; // 48 for 80mm (default), 32 for 58mm
  printerFeedLines?: number; // Extra line feeds at bottom (default 0 for zero gap)
  printerAutoCut?: boolean; // Send cut command (default false for manual tear / no feed)
  fontSizeScale?: number; // Accessibility font scale multiplier (default 1.0)
}

export interface BillItem {
  productId: string;
  productName: string;
  productNameEn?: string;
  productNameTa?: string;
  variant?: ChickenVariant;
  variantLabel?: string;
  baseRate: number;
  pricePerKg: number;
  kg: number;
  amount: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  timestamp: number;
  hotelName?: string;
  hotelPhone?: string;
  items: BillItem[];
  totalAmount: number;
  totalKg: number;
}

export interface DailyReport {
  date: string;
  totalBills: number;
  totalAmount: number;
  totalKg: number;
  productBreakdown: {
    [productId: string]: {
      productId: string;
      productName: string;
      totalKg: number;
      totalAmount: number;
      variants: {
        [variant: string]: {
          kg: number;
          amount: number;
        };
      };
    };
  };
}
