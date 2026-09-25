export interface ShopSettings {
  shopName: string;
  shopNameEn?: string;
  shopNameTa?: string;
  phoneNumber: string;
  gstNumber: string;
  address: string;
  addressEn?: string;
  addressTa?: string;
  upiId: string;
  billWidthCm?: number;
  fontSizeScale?: number; // percentage, e.g. 80 to 140, default 100
  isBoldText?: boolean; // whether all text across the app is bolded
  retentionDays?: number; // 31, 60, 90, 180, 365, or 0 (keep forever)
}

export interface ProductItem {
  id: string;
  name: string; // fallback / common name
  nameEn?: string; // English name
  nameTa?: string; // Tamil name
  pricePerKg: number;
  isCustom?: boolean;
}

export interface HotelItem {
  id: string;
  nameEn: string;
  nameTa: string;
  phone?: string;
}

export interface DailyPriceRecord {
  date: string; // YYYY-MM-DD
  savedAt: string;
  prices: Record<string, number>; // productId -> pricePerKg
}

export interface BillItem {
  productId: string;
  productName: string;
  pricePerKg: number;
  kg: number;
  amount: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO string
  hotelName: string;
  hotelId?: string;
  hotelPhone?: string;
  items: BillItem[];
  totalKg: number;
  totalAmount: number;
  previousBalance?: number;
  netTotalWithBalance?: number;
}

export interface HotelPayment {
  id: string;
  hotelId?: string;
  hotelName: string;
  amount: number;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO string
  paymentMode?: 'cash' | 'upi' | 'bank' | 'other' | 'cheque';
  notes?: string;
  type?: 'payment' | 'balance_add';
  isOpeningBalance?: boolean;
}

export type AppPage = 'daily-price' | 'billing' | 'register' | 'total' | 'hotel' | 'settings';
export type LanguageCode = 'en' | 'ta';

export type ActiveScreen = 'main' | 'wholesale' | 'retail' | 'login' | 'investment';

export interface SectorItem {
  id: 'investment' | 'wholesale' | 'retail';
  title: string;
  description: string;
  badge?: string;
  overview?: string;
  keyDetails?: Array<{ label: string; value: string }>;
}

export interface StoreConfig {
  name: string;
  fontSize: number;
}

export const DEFAULT_PRODUCTS: ProductItem[] = [
  { id: 'p1', name: 'Biriyani piece', nameEn: 'Biriyani piece', nameTa: 'பிரியாணி பீஸ்', pricePerKg: 240 },
  { id: 'p2', name: '65 piece', nameEn: '65 piece', nameTa: '65 பீஸ்', pricePerKg: 260 },
  { id: 'p3', name: 'Boneless', nameEn: 'Boneless', nameTa: 'போன்லெஸ் (எலும்பில்லா)', pricePerKg: 320 },
  { id: 'p4', name: 'Wings', nameEn: 'Wings', nameTa: 'விங்ஸ் (இறக்கை)', pricePerKg: 200 },
  { id: 'p5', name: 'Liver', nameEn: 'Liver', nameTa: 'ஈரல்', pricePerKg: 160 },
  { id: 'p6', name: 'Leg boneless', nameEn: 'Leg boneless', nameTa: 'லெக் போன்லெஸ்', pricePerKg: 340 },
  { id: 'p7', name: 'Leg Skinless chicken', nameEn: 'Leg Skinless chicken', nameTa: 'லெக் தோலில்லா சிக்கன்', pricePerKg: 250 },
  { id: 'p8', name: 'Skin chicken', nameEn: 'Skin chicken', nameTa: 'தோலுடன் சிக்கன்', pricePerKg: 190 },
  { id: 'p9', name: 'Bone', nameEn: 'Bone', nameTa: 'எலும்பு (சூப் போன்)', pricePerKg: 120 },
  { id: 'p10', name: 'Gravy piece', nameEn: 'Gravy piece', nameTa: 'கிரேவி பீஸ்', pricePerKg: 220 },
  { id: 'p11', name: 'Fry piece', nameEn: 'Fry piece', nameTa: 'ஃப்ரை பீஸ்', pricePerKg: 230 },
];

export const DEFAULT_HOTELS: HotelItem[] = [
  { id: 'h1', nameEn: 'K.N. Hotel', nameTa: 'கே.என். ஹோட்டல்' },
  { id: 'h2', nameEn: 'DJ Hotel', nameTa: 'டி.ஜே. ஹோட்டல்' },
  { id: 'h3', nameEn: 'Babu Biriyani', nameTa: 'பாபு பிரியாணி' },
  { id: 'h4', nameEn: 'S.S.S. Biriyani', nameTa: 'எஸ்.எஸ்.எஸ். பிரியாணி' },
  { id: 'h5', nameEn: 'Kadhar Hotel', nameTa: 'காதர் ஹோட்டல்' },
  { id: 'h6', nameEn: 'Rahmath Hotel', nameTa: 'ரஹ்மத் ஹோட்டல்' },
  { id: 'h7', nameEn: 'Dhaba', nameTa: 'தாபா' },
  { id: 'h8', nameEn: 'Santhosh Fast Food', nameTa: 'சந்தோஷ் பாஸ்ட் புட்' },
  { id: 'h9', nameEn: 'Savitha', nameTa: 'சவிதா' },
  { id: 'h10', nameEn: 'Ibrahim Biriyani', nameTa: 'இப்ராஹிம் பிரியாணி' },
  { id: 'h11', nameEn: 'HOPE', nameTa: 'ஹோப் (HOPE)' },
  { id: 'h12', nameEn: 'Murugan Vada', nameTa: 'முருகன் வடை கடை' },
  { id: 'h13', nameEn: 'Saravana Hotel', nameTa: 'சரவணா ஹோட்டல்' },
  { id: 'h14', nameEn: 'Muniyandi Vilas', nameTa: 'முனியாண்டி விலாஸ்' },
];

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'SSS CHICKEN AND EGG AGENCY',
  shopNameTa: 'எஸ்.எஸ்.எஸ். சிக்கன் & முட்டை ஏஜென்சி',
  phoneNumber: '8680000003',
  gstNumber: '34AQPN8846J2ZF',
  address: 'NO 6, PONDY MAIN ROAD, SULTHANPET, VILLIANUR, PUDUCHERRY - 605 110',
  addressTa: 'எண் 6, பாண்டி மெயின் ரோடு, சுல்தான்பேட்டை, வில்லியனூர், புதுச்சேரி - 605 110',
  upiId: 'NAZIRAHAMED0003@okhdfcbank',
  billWidthCm: 19,
  fontSizeScale: 135, // Default 135% scale for clear visual accessibility
  isBoldText: true, // Default bold mode for high contrast and readability
  retentionDays: 31, // Default 31 days data retention
};

// Helper function to get product name based on active language
export function getProductName(product: ProductItem, lang: LanguageCode): string {
  if (lang === 'ta') {
    return product.nameTa || product.name || product.nameEn || '';
  }
  return product.nameEn || product.name || product.nameTa || '';
}

// Helper function to get hotel name based on active language
export function getHotelName(hotel: HotelItem, lang: LanguageCode): string {
  if (lang === 'ta') {
    return hotel.nameTa || hotel.nameEn || '';
  }
  return hotel.nameEn || hotel.nameTa || '';
}

// Helper function to get shop name based on active language
export function getShopDisplayName(settings: ShopSettings, lang: LanguageCode): string {
  if (lang === 'ta') {
    if (settings.shopNameTa && settings.shopNameTa.trim() && settings.shopNameTa !== 'எஸ்.எஸ்.எஸ். சிக்கன் ஏஜென்சி') return settings.shopNameTa;
    return 'எஸ்.எஸ்.எஸ். சிக்கன் & முட்டை ஏஜென்சி';
  }
  return settings.shopName || 'SSS CHICKEN AND EGG AGENCY';
}

// Helper function to get shop address based on active language
export function getShopDisplayAddress(settings: ShopSettings, lang: LanguageCode): string {
  if (lang === 'ta') {
    if (settings.addressTa && settings.addressTa.trim()) return settings.addressTa;
    if (settings.address?.includes('PONDY MAIN ROAD') || settings.address?.includes('VILLIANUR') || !settings.address) {
      return 'எண் 6, பாண்டி மெயின் ரோடு, சுல்தான்பேட்டை, வில்லியனூர், புதுச்சேரி - 605 110';
    }
    return settings.address;
  }
  return settings.address || 'NO 6, PONDY MAIN ROAD, SULTHANPET, VILLIANUR, PUDUCHERRY - 605 110';
}

// Helper function to resolve item name: ALWAYS returns Tamil name as mandated
export function resolveItemDisplayName(
  item: { productId?: string; productName: string },
  products: ProductItem[] = [],
  _lang?: LanguageCode
): string {
  // 1. Try finding by productId in loaded products
  if (item.productId) {
    const p = products.find((x) => x.id === item.productId);
    if (p && p.nameTa) return p.nameTa;
    if (p) return getProductName(p, 'ta');
    const def = DEFAULT_PRODUCTS.find((x) => x.id === item.productId);
    if (def && def.nameTa) return def.nameTa;
    if (def) return getProductName(def, 'ta');
  }

  // 2. Try special cases like gravy piece, egg, etc.
  const cleanName = item.productName?.trim().toLowerCase() || '';
  if (cleanName === 'gravy piece' || cleanName === 'கிரேவி பீஸ்') {
    return 'கிரேவி பீஸ்';
  }
  if (cleanName === 'biriyani piece' || cleanName === 'biryani piece' || cleanName === 'பிரியாணி பீஸ்') {
    return 'பிரியாணி பீஸ்';
  }
  if (cleanName === '65 piece' || cleanName === '65 பீஸ்' || cleanName === 'chicken 65') {
    return '65 பீஸ்';
  }
  if (cleanName === 'boneless' || cleanName === 'போன்லெஸ்' || (cleanName.includes('boneless') && !cleanName.includes('leg'))) {
    return 'போன்லெஸ் (எலும்பில்லா)';
  }
  if (cleanName === 'leg boneless' || cleanName === 'லெக் போன்லெஸ்') {
    return 'லெக் போன்லெஸ்';
  }
  if (cleanName === 'leg skinless chicken' || cleanName === 'லெக் தோலில்லா சிக்கன்') {
    return 'லெக் தோலில்லா சிக்கன்';
  }
  if (cleanName === 'wings' || cleanName === 'விங்ஸ்' || cleanName.includes('wings')) {
    return 'விங்ஸ் (இறக்கை)';
  }
  if (cleanName === 'liver' || cleanName === 'ஈரல்') {
    return 'ஈரல்';
  }
  if (cleanName === 'skin chicken' || cleanName === 'chicken (with skin)' || cleanName === 'with skin' || cleanName.includes('skin chicken')) {
    return 'தோலுடன் சிக்கன்';
  }
  if (cleanName === 'skinless chicken' || cleanName === 'chicken skinless' || cleanName.includes('skinless')) {
    return 'தோல் நீக்கிய சிக்கன்';
  }
  if (cleanName === 'bone' || cleanName === 'எலும்பு' || cleanName.includes('soup bone')) {
    return 'எலும்பு (சூப் போன்)';
  }
  if (cleanName === 'fry piece' || cleanName === 'ஃப்ரை பீஸ்') {
    return 'ஃப்ரை பீஸ்';
  }
  if (cleanName === 'egg' || cleanName === 'முட்டை' || cleanName === 'muttai') {
    return 'முட்டை';
  }

  // 3. Try matching productName across defaults
  const matched = (products.length > 0 ? products : DEFAULT_PRODUCTS).find(
    (x) =>
      x.name?.trim().toLowerCase() === cleanName ||
      x.nameEn?.trim().toLowerCase() === cleanName ||
      x.nameTa?.trim().toLowerCase() === cleanName
  );
  if (matched && matched.nameTa) {
    return matched.nameTa;
  }

  return item.productName;
}

// Helper function to resolve hotel name to the target language (defaults to Tamil)
export function resolveHotelDisplayName(
  hotelName: string,
  hotelId: string | undefined,
  hotels: HotelItem[] = [],
  lang: LanguageCode = 'ta'
): string {
  const targetLang = lang || 'ta';

  if (hotelId) {
    const h = hotels.find((x) => x.id === hotelId);
    if (h) {
      if (targetLang === 'ta' && h.nameTa) return h.nameTa;
      return getHotelName(h, targetLang);
    }
    const defH = DEFAULT_HOTELS.find((x) => x.id === hotelId);
    if (defH) {
      if (targetLang === 'ta' && defH.nameTa) return defH.nameTa;
      return getHotelName(defH, targetLang);
    }
  }

  const cleanName = (hotelName || '').trim().toLowerCase();

  const matched = (hotels.length > 0 ? hotels : DEFAULT_HOTELS).find(
    (x) =>
      x.nameEn?.trim().toLowerCase() === cleanName ||
      x.nameTa?.trim().toLowerCase() === cleanName ||
      x.id?.trim().toLowerCase() === cleanName
  );
  if (matched) {
    if (targetLang === 'ta' && matched.nameTa) return matched.nameTa;
    return getHotelName(matched, targetLang);
  }

  const defMatched = DEFAULT_HOTELS.find(
    (x) =>
      x.nameEn?.trim().toLowerCase() === cleanName ||
      x.nameTa?.trim().toLowerCase() === cleanName ||
      x.id?.trim().toLowerCase() === cleanName
  );
  if (defMatched) {
    if (targetLang === 'ta' && defMatched.nameTa) return defMatched.nameTa;
    return getHotelName(defMatched, targetLang);
  }

  // Alias lookup for English -> Tamil hotel translations
  const aliasMap: Record<string, string> = {
    'kn': 'கே.என். ஹோட்டல்',
    'k.n': 'கே.என். ஹோட்டல்',
    'kn hotel': 'கே.என். ஹோட்டல்',
    'k.n. hotel': 'கே.என். ஹோட்டல்',
    'dj': 'டி.ஜே. ஹோட்டல்',
    'dj hotel': 'டி.ஜே. ஹோட்டல்',
    'babu': 'பாபு பிரியாணி',
    'babu biriyani': 'பாபு பிரியாணி',
    'sss': 'எஸ்.எஸ்.எஸ். பிரியாணி',
    's.s.s': 'எஸ்.எஸ்.எஸ். பிரியாணி',
    'sss biriyani': 'எஸ்.எஸ்.எஸ். பிரியாணி',
    's.s.s. biriyani': 'எஸ்.எஸ்.எஸ். பிரியாணி',
    'kadhar': 'காதர் ஹோட்டல்',
    'kadhar hotel': 'காதர் ஹோட்டல்',
    'rahmath': 'ரஹ்மத் ஹோட்டல்',
    'rahmath hotel': 'ரஹ்மத் ஹோட்டல்',
    'dhaba': 'தாபா',
    'santhosh': 'சந்தோஷ் பாஸ்ட் புட்',
    'santhosh fast food': 'சந்தோஷ் பாஸ்ட் புட்',
    'savitha': 'சவிதா',
    'ibrahim': 'இப்ராஹிம் பிரியாணி',
    'ibrahim biriyani': 'இப்ராஹிம் பிரியாணி',
    'hope': 'ஹோப் (HOPE)',
    'murugan': 'முருகன் வடை கடை',
    'murugan vada': 'முருகன் வடை கடை',
    'saravana': 'சரவணா ஹோட்டல்',
    'saravana hotel': 'சரவணா ஹோட்டல்',
    'muniyandi': 'முனியாண்டி விலாஸ்',
    'muniyandi vilas': 'முனியாண்டி விலாஸ்',
    'hotel': 'ஹோட்டல்',
    'customer': 'வாடிக்கையாளர்',
    'other customer': 'வாடிக்கையாளர்',
  };

  if (targetLang === 'ta' && aliasMap[cleanName]) {
    return aliasMap[cleanName];
  }

  return hotelName;
}
