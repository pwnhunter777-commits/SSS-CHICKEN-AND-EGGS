import { Bill, HotelItem, HotelPayment, ShopSettings } from '../types';

/**
 * Data Retention Engine & Local Phone Storage Manager
 * 
 * Rules:
 * 1. All data is saved exclusively inside the user's phone browser storage (localStorage / offline).
 * 2. Any records older than configurable retentionDays (default 31 days) are pruned.
 * 3. Never lose dues: Before deleting old wholesale bills & payments, net balance is computed
 *    per hotel (bills - payments + balance_add) and saved as a single "opening balance" record.
 * 4. Opening balance records (isOpeningBalance = true) are NEVER purged by retention.
 * 5. Atomic & safe: writes opening balances first, deletes old records only after that succeeds.
 *    Rolls back on quota/write errors leaving data completely intact.
 * 6. If retentionDays === 0, keep forever (nothing is deleted).
 */

export const RETENTION_DAYS = 31;

export const STORAGE_KEYS = {
  SETTINGS: 'chicken_app_settings',
  PRODUCTS: 'chicken_app_products',
  DAILY_PRICES: 'chicken_app_daily_prices',
  BILLS: 'chicken_app_bills',
  HOTELS: 'chicken_app_hotels',
  HOTEL_PAYMENTS: 'chicken_app_hotel_payments',
  RETAIL_BILLS: 'retail_chicken_shop_bills_v1',
  RETAIL_DAILY_PRICES: 'retail_chicken_shop_daily_prices_v1',
  INVESTMENT_PREFIX: 'apex_investment_daily_',
  LAST_CLEANUP: 'chicken_app_last_cleanup_timestamp',
  CLEANUP_PROMPT_DATE: 'chicken_app_cleanup_prompt_date',
};

/**
 * Returns whether a date or timestamp is older than the configured retention period.
 * If retentionDays === 0, returns false (keep forever).
 */
export function isOlderThanRetention(
  dateInput?: string | number | null,
  retentionDays: number = RETENTION_DAYS,
  referenceNow: Date = new Date()
): boolean {
  if (retentionDays <= 0) return false;
  if (!dateInput) return false;

  let itemTimestamp: number;

  if (typeof dateInput === 'number') {
    itemTimestamp = dateInput;
  } else if (typeof dateInput === 'string') {
    // If it's a date string like "2026-08-10"
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [year, month, day] = dateInput.split('-').map(Number);
      // End of that day (23:59:59.999)
      itemTimestamp = new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
    } else {
      itemTimestamp = new Date(dateInput).getTime();
    }
  } else {
    return false;
  }

  if (isNaN(itemTimestamp)) return false;

  const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;
  const cutoffTime = referenceNow.getTime() - maxAgeMs;

  return itemTimestamp < cutoffTime;
}

/**
 * Backward-compatible helper for 31-day check.
 */
export function isOlderThan31Days(
  dateInput?: string | number | null,
  referenceNow: Date = new Date()
): boolean {
  return isOlderThanRetention(dateInput, RETENTION_DAYS, referenceNow);
}

/**
 * Returns the exact cutoff date string (YYYY-MM-DD) for the given retention days.
 */
export function getCutoffDateString(
  retentionDays: number = RETENTION_DAYS,
  referenceNow: Date = new Date()
): string {
  if (retentionDays <= 0) return 'Never';
  const cutoff = new Date(referenceNow.getTime() - retentionDays * 24 * 60 * 60 * 1000);
  const year = cutoff.getFullYear();
  const month = String(cutoff.getMonth() + 1).padStart(2, '0');
  const day = String(cutoff.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Hotel matching logic identical to HotelPage.tsx:
 * checks hotelId (matching id or key), then falls back to hotelName (en or ta, case-insensitive).
 */
export function isBillMatchingHotel(
  bill: Bill,
  hotel: { id?: string; nameEn?: string; nameTa?: string; key?: string }
): boolean {
  if (bill.hotelId && (bill.hotelId === hotel.id || (hotel.key && bill.hotelId === hotel.key))) {
    return true;
  }
  const bName = (bill.hotelName || '').trim().toLowerCase();
  const en = (hotel.nameEn || '').trim().toLowerCase();
  const ta = (hotel.nameTa || '').trim().toLowerCase();
  if (!bName) return false;
  return (en !== '' && bName === en) || (ta !== '' && bName === ta);
}

export function isPaymentMatchingHotel(
  payment: HotelPayment,
  hotel: { id?: string; nameEn?: string; nameTa?: string; key?: string }
): boolean {
  if (payment.hotelId && (payment.hotelId === hotel.id || (hotel.key && payment.hotelId === hotel.key))) {
    return true;
  }
  const pName = (payment.hotelName || '').trim().toLowerCase();
  const en = (hotel.nameEn || '').trim().toLowerCase();
  const ta = (hotel.nameTa || '').trim().toLowerCase();
  if (!pName) return false;
  return (en !== '' && pName === en) || (ta !== '' && pName === ta);
}

export interface CleanupResult {
  wholesaleBillsRemoved: number;
  wholesalePaymentsRemoved: number;
  wholesalePricesRemoved: number;
  retailBillsRemoved: number;
  retailPricesRemoved: number;
  investmentRecordsRemoved: number;
  openingBalancesCreatedOrUpdated: number;
  totalRemoved: number;
  cutoffDate: string;
  timestamp: string;
  retentionDays: number;
}

export interface PendingCleanupCheck {
  wholesaleBillsCount: number;
  wholesalePaymentsCount: number;
  wholesalePricesCount: number;
  retailBillsCount: number;
  retailPricesCount: number;
  investmentRecordsCount: number;
  totalCount: number;
  cutoffDate: string;
  billsToArchive: number;
  paymentsToArchive: number;
  willDeleteData: boolean;
}

/**
 * Read-only check to see if any records would be deleted by cleanup.
 */
export function checkPendingCleanup(
  retentionDays: number = RETENTION_DAYS,
  now: Date = new Date()
): PendingCleanupCheck {
  if (retentionDays <= 0) {
    return {
      wholesaleBillsCount: 0,
      wholesalePaymentsCount: 0,
      wholesalePricesCount: 0,
      retailBillsCount: 0,
      retailPricesCount: 0,
      investmentRecordsCount: 0,
      totalCount: 0,
      cutoffDate: 'Never',
      billsToArchive: 0,
      paymentsToArchive: 0,
      willDeleteData: false,
    };
  }

  const cutoffDate = getCutoffDateString(retentionDays, now);
  let wholesaleBillsCount = 0;
  let wholesalePaymentsCount = 0;
  let wholesalePricesCount = 0;
  let retailBillsCount = 0;
  let retailPricesCount = 0;
  let investmentRecordsCount = 0;

  try {
    // 1. Wholesale Bills
    const rawBills = localStorage.getItem(STORAGE_KEYS.BILLS);
    if (rawBills) {
      const parsed: Bill[] = JSON.parse(rawBills);
      if (Array.isArray(parsed)) {
        wholesaleBillsCount = parsed.filter((b) =>
          isOlderThanRetention(b.date || b.createdAt, retentionDays, now)
        ).length;
      }
    }

    // 2. Wholesale Payments (excluding opening balances which are NEVER pruned)
    const rawPayments = localStorage.getItem(STORAGE_KEYS.HOTEL_PAYMENTS);
    if (rawPayments) {
      const parsed: HotelPayment[] = JSON.parse(rawPayments);
      if (Array.isArray(parsed)) {
        wholesalePaymentsCount = parsed.filter(
          (p) =>
            !p.isOpeningBalance &&
            isOlderThanRetention(p.date || p.createdAt, retentionDays, now)
        ).length;
      }
    }

    // 3. Wholesale Daily Prices
    const rawPrices = localStorage.getItem(STORAGE_KEYS.DAILY_PRICES);
    if (rawPrices) {
      const parsed = JSON.parse(rawPrices);
      if (parsed && typeof parsed === 'object') {
        for (const dateKey of Object.keys(parsed)) {
          if (isOlderThanRetention(dateKey, retentionDays, now)) {
            wholesalePricesCount++;
          }
        }
      }
    }

    // 4. Retail Bills
    const rawRetailBills = localStorage.getItem(STORAGE_KEYS.RETAIL_BILLS);
    if (rawRetailBills) {
      const parsed = JSON.parse(rawRetailBills);
      if (Array.isArray(parsed)) {
        retailBillsCount = parsed.filter((b) =>
          isOlderThanRetention(b.timestamp || b.date, retentionDays, now)
        ).length;
      }
    }

    // 5. Retail Daily Prices
    const rawRetailPrices = localStorage.getItem(STORAGE_KEYS.RETAIL_DAILY_PRICES);
    if (rawRetailPrices) {
      const parsed = JSON.parse(rawRetailPrices);
      if (parsed && typeof parsed === 'object') {
        for (const dateKey of Object.keys(parsed)) {
          if (isOlderThanRetention(dateKey, retentionDays, now)) {
            retailPricesCount++;
          }
        }
      }
    }

    // 6. Investment Daily Records
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEYS.INVESTMENT_PREFIX)) {
        const datePart = key.replace(STORAGE_KEYS.INVESTMENT_PREFIX, '');
        if (isOlderThanRetention(datePart, retentionDays, now)) {
          investmentRecordsCount++;
        }
      }
    }
  } catch (err) {
    console.error('Error during checkPendingCleanup:', err);
  }

  const totalCount =
    wholesaleBillsCount +
    wholesalePaymentsCount +
    wholesalePricesCount +
    retailBillsCount +
    retailPricesCount +
    investmentRecordsCount;

  return {
    wholesaleBillsCount,
    wholesalePaymentsCount,
    wholesalePricesCount,
    retailBillsCount,
    retailPricesCount,
    investmentRecordsCount,
    totalCount,
    cutoffDate,
    billsToArchive: wholesaleBillsCount,
    paymentsToArchive: wholesalePaymentsCount,
    willDeleteData: totalCount > 0,
  };
}

/**
 * Executes full data cleanup with guaranteed dues preservation and atomic rollback.
 * 
 * Flow:
 * 1. Calculate net balance for each hotel from old bills and payments about to be removed.
 * 2. Create or merge into a single opening balance record per hotel (type: 'balance_add', isOpeningBalance: true).
 * 3. Opening balance records are NEVER deleted.
 * 4. Write opening balance records first.
 * 5. Delete old records only after opening balance write succeeds.
 * 6. If anything throws (e.g. QuotaExceededError), rollback all data to original state.
 */
export function executeDataCleanup(
  retentionDays: number = RETENTION_DAYS,
  now: Date = new Date()
): CleanupResult {
  const cutoffDate = getCutoffDateString(retentionDays, now);
  const emptyResult: CleanupResult = {
    wholesaleBillsRemoved: 0,
    wholesalePaymentsRemoved: 0,
    wholesalePricesRemoved: 0,
    retailBillsRemoved: 0,
    retailPricesRemoved: 0,
    investmentRecordsRemoved: 0,
    openingBalancesCreatedOrUpdated: 0,
    totalRemoved: 0,
    cutoffDate,
    timestamp: now.toISOString(),
    retentionDays,
  };

  // Retention = 0 means keep forever
  if (retentionDays <= 0) {
    return emptyResult;
  }

  // Backup original strings for atomic rollback if quota or write error occurs
  let originalBillsStr: string | null = null;
  let originalPaymentsStr: string | null = null;
  let originalPricesStr: string | null = null;
  let originalRetailBillsStr: string | null = null;
  let originalRetailPricesStr: string | null = null;
  const removedInvestmentBackups: Record<string, string> = {};

  try {
    originalBillsStr = localStorage.getItem(STORAGE_KEYS.BILLS);
    originalPaymentsStr = localStorage.getItem(STORAGE_KEYS.HOTEL_PAYMENTS);
    originalPricesStr = localStorage.getItem(STORAGE_KEYS.DAILY_PRICES);
    originalRetailBillsStr = localStorage.getItem(STORAGE_KEYS.RETAIL_BILLS);
    originalRetailPricesStr = localStorage.getItem(STORAGE_KEYS.RETAIL_DAILY_PRICES);

    // 1. Parse existing data in memory
    const allBills: Bill[] = originalBillsStr ? JSON.parse(originalBillsStr) : [];
    const allPayments: HotelPayment[] = originalPaymentsStr ? JSON.parse(originalPaymentsStr) : [];

    // Separate old bills vs retained bills
    const oldBills: Bill[] = [];
    const retainedBills: Bill[] = [];
    allBills.forEach((b) => {
      if (isOlderThanRetention(b.date || b.createdAt, retentionDays, now)) {
        oldBills.push(b);
      } else {
        retainedBills.push(b);
      }
    });

    // Separate old payments vs retained payments
    // NOTE: Opening balance records must NEVER be purged!
    const oldPayments: HotelPayment[] = [];
    const retainedPayments: HotelPayment[] = [];
    allPayments.forEach((p) => {
      if (p.isOpeningBalance) {
        retainedPayments.push(p);
      } else if (isOlderThanRetention(p.date || p.createdAt, retentionDays, now)) {
        oldPayments.push(p);
      } else {
        retainedPayments.push(p);
      }
    });

    // 2. Parse daily prices and retail
    let wholesalePricesRemoved = 0;
    const cleanedWholesalePrices: Record<string, any> = {};
    if (originalPricesStr) {
      const parsed = JSON.parse(originalPricesStr);
      if (parsed && typeof parsed === 'object') {
        for (const [dateKey, val] of Object.entries(parsed)) {
          if (isOlderThanRetention(dateKey, retentionDays, now)) {
            wholesalePricesRemoved++;
          } else {
            cleanedWholesalePrices[dateKey] = val;
          }
        }
      }
    }

    let retailBillsRemoved = 0;
    const retainedRetailBills: any[] = [];
    if (originalRetailBillsStr) {
      const parsed = JSON.parse(originalRetailBillsStr);
      if (Array.isArray(parsed)) {
        parsed.forEach((b) => {
          if (isOlderThanRetention(b.timestamp || b.date, retentionDays, now)) {
            retailBillsRemoved++;
          } else {
            retainedRetailBills.push(b);
          }
        });
      }
    }

    let retailPricesRemoved = 0;
    const cleanedRetailPrices: Record<string, any> = {};
    if (originalRetailPricesStr) {
      const parsed = JSON.parse(originalRetailPricesStr);
      if (parsed && typeof parsed === 'object') {
        for (const [dateKey, val] of Object.entries(parsed)) {
          if (isOlderThanRetention(dateKey, retentionDays, now)) {
            retailPricesRemoved++;
          } else {
            cleanedRetailPrices[dateKey] = val;
          }
        }
      }
    }

    // 3. Investment daily records keys
    const investmentKeysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEYS.INVESTMENT_PREFIX)) {
        const datePart = key.replace(STORAGE_KEYS.INVESTMENT_PREFIX, '');
        if (isOlderThanRetention(datePart, retentionDays, now)) {
          investmentKeysToRemove.push(key);
        }
      }
    }

    // Check if there is anything to remove
    const willRemoveWholesale = oldBills.length > 0 || oldPayments.length > 0;
    const willRemoveOther =
      wholesalePricesRemoved > 0 ||
      retailBillsRemoved > 0 ||
      retailPricesRemoved > 0 ||
      investmentKeysToRemove.length > 0;

    if (!willRemoveWholesale && !willRemoveOther) {
      // Nothing to clean up
      return emptyResult;
    }

    // 4. Compute each hotel's net balance from the records about to be removed
    // Dues formula: bills - payments + balance_add
    // Find all distinct hotels across registered hotels, old records, and retained records
    const rawHotels = localStorage.getItem(STORAGE_KEYS.HOTELS);
    const registeredHotels: HotelItem[] = rawHotels ? JSON.parse(rawHotels) : [];
    
    // Build a unique list of hotel entities to evaluate
    const hotelEntities: Array<{ id?: string; nameEn: string; nameTa: string; key?: string }> = [
      ...registeredHotels.map((h) => ({ id: h.id, nameEn: h.nameEn, nameTa: h.nameTa, key: h.id })),
    ];

    const ensureHotelEntity = (name: string, id?: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const exists = hotelEntities.some((h) => {
        if (id && h.id && h.id === id) return true;
        return (
          h.nameEn.toLowerCase() === trimmed.toLowerCase() ||
          h.nameTa.toLowerCase() === trimmed.toLowerCase()
        );
      });
      if (!exists) {
        hotelEntities.push({
          id: id || 'custom_' + trimmed,
          nameEn: trimmed,
          nameTa: trimmed,
          key: id || 'custom_' + trimmed,
        });
      }
    };

    oldBills.forEach((b) => ensureHotelEntity(b.hotelName, b.hotelId));
    oldPayments.forEach((p) => ensureHotelEntity(p.hotelName, p.hotelId));
    allPayments.forEach((p) => {
      if (p.isOpeningBalance) ensureHotelEntity(p.hotelName, p.hotelId);
    });

    // Create a working copy of payments
    let updatedPayments = [...retainedPayments];
    let openingBalancesUpdatedCount = 0;

    if (willRemoveWholesale) {
      hotelEntities.forEach((hotel) => {
        // Find old bills and payments matching this hotel
        const matchingOldBills = oldBills.filter((b) => isBillMatchingHotel(b, hotel));
        const matchingOldPayments = oldPayments.filter((p) => isPaymentMatchingHotel(p, hotel));

        if (matchingOldBills.length === 0 && matchingOldPayments.length === 0) {
          return;
        }

        const oldBilled = matchingOldBills.reduce((sum, b) => sum + b.totalAmount, 0);
        const oldPaid = matchingOldPayments
          .filter((p) => p.type !== 'balance_add')
          .reduce((sum, p) => sum + p.amount, 0);
        const oldBalAdded = matchingOldPayments
          .filter((p) => p.type === 'balance_add')
          .reduce((sum, p) => sum + p.amount, 0);

        const netArchivedDues = oldBilled + oldBalAdded - oldPaid;

        // Look for existing single opening balance record for this hotel
        const existingOpIndex = updatedPayments.findIndex(
          (p) => p.isOpeningBalance && isPaymentMatchingHotel(p, hotel)
        );

        if (existingOpIndex >= 0) {
          // Merge into existing opening balance record
          const existingOp = updatedPayments[existingOpIndex];
          const newAmount = existingOp.amount + netArchivedDues;
          updatedPayments[existingOpIndex] = {
            ...existingOp,
            amount: newAmount,
            date: cutoffDate,
            notes: `Opening balance (archived up to ${cutoffDate})`,
          };
          openingBalancesUpdatedCount++;
        } else if (netArchivedDues !== 0) {
          // Create new opening balance record
          const newOpRecord: HotelPayment = {
            id: `op_bal_${(hotel.id || hotel.nameEn).replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
            hotelId: hotel.id && !hotel.id.startsWith('custom_') ? hotel.id : undefined,
            hotelName: hotel.nameEn,
            amount: netArchivedDues,
            date: cutoffDate,
            createdAt: now.toISOString(),
            paymentMode: 'other',
            type: 'balance_add',
            isOpeningBalance: true,
            notes: `Opening balance (archived up to ${cutoffDate})`,
          };
          updatedPayments.push(newOpRecord);
          openingBalancesUpdatedCount++;
        }
      });
    }

    // 5. SAFE ATOMIC PERSISTENCE
    // STEP 1: Write the updated payments with opening balance records FIRST.
    // If this fails (e.g. storage full), an exception is caught and nothing is deleted.
    const paymentsJson = JSON.stringify(updatedPayments);
    localStorage.setItem(STORAGE_KEYS.HOTEL_PAYMENTS, paymentsJson);

    // STEP 2: Only after opening balance records write succeeds, delete/overwrite old records
    if (oldBills.length > 0) {
      localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(retainedBills));
    }

    if (wholesalePricesRemoved > 0) {
      localStorage.setItem(STORAGE_KEYS.DAILY_PRICES, JSON.stringify(cleanedWholesalePrices));
    }

    if (retailBillsRemoved > 0) {
      localStorage.setItem(STORAGE_KEYS.RETAIL_BILLS, JSON.stringify(retainedRetailBills));
    }

    if (retailPricesRemoved > 0) {
      localStorage.setItem(STORAGE_KEYS.RETAIL_DAILY_PRICES, JSON.stringify(cleanedRetailPrices));
    }

    // Backup investment values before removing
    for (const key of investmentKeysToRemove) {
      const val = localStorage.getItem(key);
      if (val) removedInvestmentBackups[key] = val;
      localStorage.removeItem(key);
    }

    // Update cleanup timestamp
    localStorage.setItem(STORAGE_KEYS.LAST_CLEANUP, now.toISOString());

    const totalRemoved =
      oldBills.length +
      oldPayments.length +
      wholesalePricesRemoved +
      retailBillsRemoved +
      retailPricesRemoved +
      investmentKeysToRemove.length;

    return {
      wholesaleBillsRemoved: oldBills.length,
      wholesalePaymentsRemoved: oldPayments.length,
      wholesalePricesRemoved,
      retailBillsRemoved,
      retailPricesRemoved,
      investmentRecordsRemoved: investmentKeysToRemove.length,
      openingBalancesCreatedOrUpdated: openingBalancesUpdatedCount,
      totalRemoved,
      cutoffDate,
      timestamp: now.toISOString(),
      retentionDays,
    };
  } catch (error) {
    // ATOMIC ROLLBACK: Restore original storage data completely
    console.error('Data cleanup failed; rolling back all changes to prevent data loss:', error);
    try {
      if (originalBillsStr !== null) {
        localStorage.setItem(STORAGE_KEYS.BILLS, originalBillsStr);
      }
      if (originalPaymentsStr !== null) {
        localStorage.setItem(STORAGE_KEYS.HOTEL_PAYMENTS, originalPaymentsStr);
      }
      if (originalPricesStr !== null) {
        localStorage.setItem(STORAGE_KEYS.DAILY_PRICES, originalPricesStr);
      }
      if (originalRetailBillsStr !== null) {
        localStorage.setItem(STORAGE_KEYS.RETAIL_BILLS, originalRetailBillsStr);
      }
      if (originalRetailPricesStr !== null) {
        localStorage.setItem(STORAGE_KEYS.RETAIL_DAILY_PRICES, originalRetailPricesStr);
      }
      for (const [key, val] of Object.entries(removedInvestmentBackups)) {
        localStorage.setItem(key, val);
      }
    } catch (rollbackErr) {
      console.error('Critical rollback error:', rollbackErr);
    }
    return emptyResult;
  }
}

/**
 * Backward-compatible alias for executeDataCleanup using 31 days.
 */
export function execute31DayDataCleanup(
  now: Date = new Date(),
  retentionDays: number = RETENTION_DAYS
): CleanupResult {
  return executeDataCleanup(retentionDays, now);
}

/**
 * Returns statistics about local phone storage and active records within retention window.
 */
export function getStorageStats(retentionDays: number = RETENTION_DAYS) {
  let wholesaleBillsCount = 0;
  let wholesalePaymentsCount = 0;
  let retailBillsCount = 0;
  let investmentDaysCount = 0;
  let totalStorageBytes = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || '';
        totalStorageBytes += key.length + val.length;

        if (key === STORAGE_KEYS.BILLS) {
          const arr = JSON.parse(val);
          if (Array.isArray(arr)) wholesaleBillsCount = arr.length;
        } else if (key === STORAGE_KEYS.HOTEL_PAYMENTS) {
          const arr = JSON.parse(val);
          if (Array.isArray(arr)) wholesalePaymentsCount = arr.length;
        } else if (key === STORAGE_KEYS.RETAIL_BILLS) {
          const arr = JSON.parse(val);
          if (Array.isArray(arr)) retailBillsCount = arr.length;
        } else if (key.startsWith(STORAGE_KEYS.INVESTMENT_PREFIX)) {
          investmentDaysCount++;
        }
      }
    }
  } catch {
    // Ignore error
  }

  const lastCleanup = localStorage.getItem(STORAGE_KEYS.LAST_CLEANUP) || null;

  return {
    retentionDays,
    cutoffDate: getCutoffDateString(retentionDays),
    wholesaleBillsCount,
    wholesalePaymentsCount,
    retailBillsCount,
    investmentDaysCount,
    totalStorageKb: Math.round((totalStorageBytes / 1024) * 10) / 10,
    lastCleanup,
  };
}

