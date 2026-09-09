import { Product, DailyPriceMap, ShopSettings, Bill, Language, DailyReport } from '../types';

export const DEFAULT_PRODUCTS: Product[] = [
  { id: 'p0', name: 'Chicken', nameEn: 'Chicken', nameTa: 'கோழி (உயிருடன்)', defaultPrice: 220 },
  { id: 'p_egg', name: 'Egg', nameEn: 'Egg', nameTa: 'முட்டை', defaultPrice: 6 },
];

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'SSS CHICKEN AGENCY',
  phoneNumber: '8680000003',
  gstNumber: '34AQPN8846J2ZF',
  address: 'NO 6, PONDY MAIN ROAD, SULTHANPET, VILLIANUR, PUDUCHERRY - 605 110',
  upiId: 'NAZIRAHAMED0003@okhdfcbank',
  billPrintWidth: 17,
  printerPaperWidth: '80mm',
  printerColumns: 48,
  printerFeedLines: 8,
  printerAutoCut: false,
  withoutSkinOffset: 50,
  securityPin: '1234',
  pinProtectionEnabled: false,
  protectDailyPrice: true,
  protectSettings: true,
  protectBillDelete: true,
  protectAppLock: false,
  logoUrl: '/logo.png',
  fontSizeScale: 1.0,
};

export const DEFAULT_AROMAKE_HOTELS: string[] = [
  'Aromake Biriyani & Fast Food',
  'Aromake Star Hotel',
  'Aromake Family Restaurant',
  'Aromake Mess & Catering',
  'Aromake Dhaba',
];

const STORAGE_KEYS = {
  PRODUCTS: 'retail_chicken_shop_products_v1',
  DAILY_PRICES: 'retail_chicken_shop_daily_prices_v1',
  SETTINGS: 'retail_chicken_shop_settings_v1',
  BILLS: 'retail_chicken_shop_bills_v1',
  LANGUAGE: 'retail_chicken_shop_lang_v1',
  HOTELS: 'retail_chicken_shop_hotels_v1',
};

export function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr?: string, lang: Language = 'en'): string {
  const date = dateStr ? new Date(dateStr) : new Date();
  return date.toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Built-in map to resolve Tamil names for default cuts
const KNOWN_CUTS_TAMIL: Record<string, string> = {
  chicken: 'கோழி (உயிருடன்)',
  'curry cut': 'கறி துண்டுகள்',
  'biriyani piece': 'பிரியாணி துண்டு',
  '65 piece': '65 துண்டுகள்',
  boneless: 'எலும்பில்லாதது',
  wings: 'இறக்கைகள்',
  lever: 'கல்லீரல்',
  liver: 'கல்லீரல்',
  'leg boneless': 'லெக் போன்லெஸ்',
  'leg skinless chicken': 'லெக் ஸ்கின்லெஸ்',
  'skin chicken': 'தோல் கோழி',
  bone: 'எலும்பு',
  'grave piece': 'கிரேவி துண்டு',
  'gravy piece': 'கிரேவி துண்டு',
  'fry piece': 'வறுவல் துண்டு',
};

// Storage helpers
export function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (raw) {
      const parsed: Product[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hydrated = parsed.map((p) => {
          const lowerName = (p.name || '').trim().toLowerCase();
          const defaultTa = KNOWN_CUTS_TAMIL[lowerName] || p.name || '';
          return {
            ...p,
            nameEn: p.nameEn || p.name || 'Chicken Cut',
            nameTa: p.nameTa || defaultTa || 'கோழி துண்டு',
          };
        });

        const onlyChickenList = hydrated.filter((p) => {
          const isChicken = p.id === 'p0' || (p.nameEn || p.name || '').trim().toLowerCase() === 'chicken';
          const isEgg = p.id === 'p_egg' || (p.nameEn || p.name || '').trim().toLowerCase() === 'egg';
          const isOldDefaultCut = /^p(1[0-2]|[1-9])$/.test(p.id);
          return isChicken || isEgg || !isOldDefaultCut;
        });

        const chickenIdx = onlyChickenList.findIndex(
          (p) => (p.nameEn || p.name || '').trim().toLowerCase() === 'chicken'
        );
        if (chickenIdx === -1) {
          onlyChickenList.unshift({
            id: 'p0',
            name: 'Chicken',
            nameEn: 'Chicken',
            nameTa: 'கோழி (உயிருடன்)',
            defaultPrice: 220,
          });
        }

        const eggIdx = onlyChickenList.findIndex(
          (p) => p.id === 'p_egg' || (p.nameEn || p.name || '').trim().toLowerCase() === 'egg'
        );
        if (eggIdx === -1) {
          const insertPos = onlyChickenList.findIndex(
            (p) => (p.nameEn || p.name || '').trim().toLowerCase() === 'chicken'
          ) + 1;
          onlyChickenList.splice(insertPos || 1, 0, {
            id: 'p_egg',
            name: 'Egg',
            nameEn: 'Egg',
            nameTa: 'முட்டை',
            defaultPrice: 6,
          });
        }
        saveProducts(onlyChickenList);
        return onlyChickenList;
      }
    }
  } catch (e) {
    console.error('Error loading products from localStorage', e);
  }
  saveProducts(DEFAULT_PRODUCTS);
  return DEFAULT_PRODUCTS;
}

export function saveProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products to localStorage', e);
  }
}

export function loadDailyPrices(): DailyPriceMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_PRICES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading daily prices from localStorage', e);
  }
  return {};
}

export function saveDailyPrices(prices: DailyPriceMap): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_PRICES, JSON.stringify(prices));
  } catch (e) {
    console.error('Error saving daily prices to localStorage', e);
  }
}

export function getTodayPrices(products: Product[]): { [productId: string]: number } {
  const allPrices = loadDailyPrices();
  const todayKey = getTodayKey();
  const savedToday = allPrices[todayKey];

  if (savedToday && Object.keys(savedToday).length > 0) {
    const merged = { ...savedToday };
    products.forEach((p) => {
      if (merged[p.id] === undefined) {
        merged[p.id] = p.defaultPrice || (p.id === 'p_egg' ? 6 : 220);
      }
    });
    return merged;
  }

  const fallbackPrices: { [productId: string]: number } = {};
  const dates = Object.keys(allPrices).sort().reverse();
  const latestSaved = dates.length > 0 ? allPrices[dates[0]] : null;

  products.forEach((p) => {
    if (latestSaved && latestSaved[p.id] !== undefined) {
      fallbackPrices[p.id] = latestSaved[p.id];
    } else {
      fallbackPrices[p.id] = p.defaultPrice || (p.id === 'p_egg' ? 6 : 220);
    }
  });

  return fallbackPrices;
}

export function isPriceSetForToday(): boolean {
  const allPrices = loadDailyPrices();
  const todayKey = getTodayKey();
  return !!(allPrices[todayKey] && Object.keys(allPrices[todayKey]).length > 0);
}

export function loadShopSettings(): ShopSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      const isOldPlaceholder =
        !parsed.shopName ||
        parsed.shopName === 'Fresh Chicken Center' ||
        parsed.phoneNumber === '9876543210';

      const upgradedSettings: ShopSettings = {
        ...DEFAULT_SETTINGS,
        ...parsed,
        shopName: isOldPlaceholder ? DEFAULT_SETTINGS.shopName : (parsed.shopName || DEFAULT_SETTINGS.shopName),
        phoneNumber: isOldPlaceholder ? DEFAULT_SETTINGS.phoneNumber : (parsed.phoneNumber || DEFAULT_SETTINGS.phoneNumber),
        gstNumber: isOldPlaceholder ? DEFAULT_SETTINGS.gstNumber : (parsed.gstNumber || DEFAULT_SETTINGS.gstNumber),
        address: isOldPlaceholder ? DEFAULT_SETTINGS.address : (parsed.address || DEFAULT_SETTINGS.address),
        upiId: isOldPlaceholder ? DEFAULT_SETTINGS.upiId : (parsed.upiId || DEFAULT_SETTINGS.upiId),
        billPrintWidth: parsed.billPrintWidth ? Number(parsed.billPrintWidth) : 17,
        printerPaperWidth: parsed.printerPaperWidth || '80mm',
        printerColumns: parsed.printerColumns ? Number(parsed.printerColumns) : 48,
        printerFeedLines:
          localStorage.getItem('retail_printer_feed_upgraded_v3') !== 'true'
            ? 8
            : parsed.printerFeedLines !== undefined
            ? Number(parsed.printerFeedLines)
            : 8,
        printerAutoCut: parsed.printerAutoCut ?? false,
        securityPin: parsed.securityPin || '1234',
        pinProtectionEnabled: parsed.pinProtectionEnabled ?? false,
        protectDailyPrice: parsed.protectDailyPrice ?? true,
        protectSettings: parsed.protectSettings ?? true,
        protectBillDelete: parsed.protectBillDelete ?? true,
        protectAppLock: parsed.protectAppLock ?? false,
        logoUrl: parsed.logoUrl || '/logo.png',
        fontSizeScale:
          parsed.fontSizeScale !== undefined
            ? Number(parsed.fontSizeScale)
            : 1.0,
        withoutSkinOffset:
          parsed.withoutSkinOffset !== undefined
            ? Number(parsed.withoutSkinOffset)
            : 50,
      };

      if (upgradedSettings.fontSizeScale) {
        applyFontScale(upgradedSettings.fontSizeScale);
      }

      return upgradedSettings;
    }
  } catch (e) {
    console.error('Error loading settings from localStorage', e);
  }

  applyFontScale(DEFAULT_SETTINGS.fontSizeScale || 1.0);
  saveShopSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export function applyFontScale(scale: number): void {
  if (typeof document !== 'undefined') {
    const safeScale = Math.min(1.5, Math.max(0.85, Number(scale) || 1.0));
    document.documentElement.style.setProperty('--app-font-scale', String(safeScale));
    try {
      localStorage.setItem('retail_chicken_shop_font_scale_v1', String(safeScale));
    } catch {
      // ignore
    }
  }
}

export function saveShopSettings(settings: ShopSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    if (settings.fontSizeScale !== undefined) {
      applyFontScale(settings.fontSizeScale);
    }
  } catch (e) {
    console.error('Error saving settings to localStorage', e);
  }
}

export function loadWithoutSkinOffset(): number {
  const settings = loadShopSettings();
  return typeof settings.withoutSkinOffset === 'number' && !isNaN(settings.withoutSkinOffset)
    ? settings.withoutSkinOffset
    : 50;
}

export function saveWithoutSkinOffset(offset: number): void {
  const settings = loadShopSettings();
  settings.withoutSkinOffset = offset;
  saveShopSettings(settings);
}

export function loadBills(): Bill[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BILLS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading bills from localStorage', e);
  }
  return [];
}

export function saveBills(bills: Bill[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
  } catch (e) {
    console.error('Error saving bills to localStorage', e);
  }
}

export function addBill(bill: Bill): void {
  const bills = loadBills();
  bills.unshift(bill);
  saveBills(bills);
}

export function updateBill(updatedBill: Bill): void {
  const bills = loadBills();
  const idx = bills.findIndex((b) => b.id === updatedBill.id);
  if (idx !== -1) {
    bills[idx] = updatedBill;
  } else {
    bills.unshift(updatedBill);
  }
  saveBills(bills);
}

export function deleteBillById(id: string): Bill[] {
  const bills = loadBills().filter((b) => b.id !== id);
  saveBills(bills);
  return bills;
}

export function generateNextBillNumber(): string {
  const bills = loadBills();
  if (bills.length === 0) {
    return '1001';
  }
  const maxNum = bills.reduce((max, b) => {
    const num = parseInt(b.billNumber.replace(/\D/g, ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 1000);
  return String(maxNum + 1);
}

export function loadLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as Language;
    if (saved && (saved === 'en' || saved === 'ta')) {
      return saved;
    }
  } catch (e) {
    console.error('Error loading language', e);
  }
  return 'en';
}

export function saveLanguage(lang: Language): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  } catch (e) {
    console.error('Error saving language', e);
  }
}

export function loadHotels(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HOTELS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading hotels', e);
  }
  return DEFAULT_AROMAKE_HOTELS;
}

export function saveHotels(hotels: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HOTELS, JSON.stringify(hotels));
  } catch (e) {
    console.error('Error saving hotels', e);
  }
}

export const loadSettings = loadShopSettings;
export const saveSettings = saveShopSettings;

export function saveFontSizeScale(scale: number): void {
  applyFontScale(scale);
  const s = loadShopSettings();
  s.fontSizeScale = scale;
  saveShopSettings(s);
}

export function clearAllBills(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.BILLS);
  } catch (e) {
    console.error('Error clearing bills', e);
  }
}

export function clearAllRetailData(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (e) {
    console.error('Error clearing all retail data', e);
  }
}

export function generateDailyReport(date: string): DailyReport {
  const allBills = loadBills().filter((b) => b.date === date);
  const totalBills = allBills.length;
  const totalAmount = allBills.reduce((acc, b) => acc + b.totalAmount, 0);
  const totalKg = allBills.reduce((acc, b) => acc + b.totalKg, 0);

  const productBreakdown: DailyReport['productBreakdown'] = {};

  allBills.forEach((bill) => {
    bill.items?.forEach((item) => {
      if (!productBreakdown[item.productId]) {
        productBreakdown[item.productId] = {
          productId: item.productId,
          productName: item.productName,
          totalKg: 0,
          totalAmount: 0,
          variants: {},
        };
      }
      productBreakdown[item.productId].totalKg += item.kg;
      productBreakdown[item.productId].totalAmount += item.amount;

      const v = item.variant || 'with_skin';
      if (!productBreakdown[item.productId].variants[v]) {
        productBreakdown[item.productId].variants[v] = {
          kg: 0,
          amount: 0,
        };
      }
      productBreakdown[item.productId].variants[v].kg += item.kg;
      productBreakdown[item.productId].variants[v].amount += item.amount;
    });
  });

  return {
    date,
    totalBills,
    totalAmount,
    totalKg,
    productBreakdown,
  };
}

export function shareWhatsAppSummary(report: DailyReport): void {
  const settings = loadShopSettings();
  let text = `*${settings.shopName}*\n`;
  text += `*Daily Sales Report - ${report.date}*\n`;
  text += `---------------------------------\n`;
  text += `Total Bills: ${report.totalBills}\n`;
  text += `Total Quantity: ${report.totalKg.toFixed(2)} Kg\n`;
  text += `Total Amount: Rs. ${report.totalAmount.toFixed(2)}\n`;
  text += `---------------------------------\n`;
  text += `*Item Breakdown:*\n`;

  Object.values(report.productBreakdown).forEach((p) => {
    text += `• *${p.productName}*: ${p.totalKg.toFixed(2)} Kg = Rs. ${Math.round(p.totalAmount)}\n`;
    Object.entries(p.variants).forEach(([v, val]) => {
      if (val.kg > 0) {
        const vName = v === 'with_skin' ? 'With Skin' : v === 'without_skin' ? 'Without Skin' : 'Boneless';
        text += `   - ${vName}: ${val.kg.toFixed(2)} Kg\n`;
      }
    });
  });

  text += `---------------------------------\n`;
  text += `Generated at ${new Date().toLocaleTimeString('en-IN')}`;

  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

export function exportReportToCSV(report: DailyReport): void {
  const settings = loadShopSettings();
  const rows: string[][] = [
    [settings.shopName, 'Daily Sales Report'],
    ['Date', report.date],
    ['Total Bills', String(report.totalBills)],
    ['Total Weight (Kg)', report.totalKg.toFixed(2)],
    ['Total Sales (Rs)', report.totalAmount.toFixed(2)],
    [],
    ['Item Name', 'Variant', 'Weight (Kg)', 'Amount (Rs)'],
  ];

  Object.values(report.productBreakdown).forEach((p) => {
    Object.entries(p.variants).forEach(([v, val]) => {
      if (val.kg > 0) {
        rows.push([p.productName, v, val.kg.toFixed(2), String(Math.round(val.amount))]);
      }
    });
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `retail_report_${report.date}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
