import React, { useState, useEffect } from 'react';
import {
  Printer,
  RotateCcw,
  Check,
  Scale,
} from 'lucide-react';
import { Product, ShopSettings, Bill, BillItem, Language, ChickenVariant, getProductName } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import {
  getTodayPrices,
  getTodayKey,
  addBill,
  generateNextBillNumber,
  saveProducts,
  loadDailyPrices,
  saveDailyPrices,
  loadWithoutSkinOffset,
  saveWithoutSkinOffset,
} from '../utils/storage';
import { printBillViaBluetooth } from '../utils/bluetoothPrinter';
import { ChickenCutCard, ChickenCutItemData } from '../components/ChickenCutCard';
import { ChickenCutDropdown } from '../components/ChickenCutDropdown';

interface BillingPageProps {
  products: Product[];
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
  settings: ShopSettings;
  language: Language;
}

export const BillingPage: React.FC<BillingPageProps> = ({
  products,
  setProducts,
  settings,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const todayKey = getTodayKey();

  // Saved daily prices
  const [dailyPrices, setDailyPrices] = useState<{ [productId: string]: number }>({});
  // Active Cuts State: Map from productId to ChickenCutItemData
  const [cutItems, setCutItems] = useState<{
    [productId: string]: ChickenCutItemData;
  }>({});
  // Selected Active Cut for quick selector tabs
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || 'p0'
  );

  // Without Skin price increase offset (e.g. +₹50/Kg)
  const [withoutSkinOffset, setWithoutSkinOffset] = useState<number>(() => {
    return settings.withoutSkinOffset !== undefined
      ? settings.withoutSkinOffset
      : loadWithoutSkinOffset();
  });

  // Handler when user saves without skin increase
  const handleSaveWithoutSkinOffset = (newOffset: number) => {
    setWithoutSkinOffset(newOffset);
    saveWithoutSkinOffset(newOffset);

    // Update existing items in bill that use 'without_skin'
    setCutItems((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        const item = next[id];
        if (item.variant === 'without_skin') {
          const newRate = Math.max(1, item.baseRate + newOffset);
          let newPrice = item.price;
          let numericAmt = item.numericAmount;
          if (item.numericKg > 0) {
            numericAmt = Math.round(item.numericKg * newRate);
            newPrice = String(numericAmt);
          }
          next[id] = {
            ...item,
            adjustedRate: newRate,
            price: newPrice,
            numericAmount: numericAmt,
          };
        }
      });
      return next;
    });
    setToastMessage(language === 'ta' ? `தோல் இல்லா விலை +₹${newOffset}/கிலோ என அமைக்கப்பட்டது` : `Without skin increase set to +₹${newOffset}/Kg`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Last saved bill for receipt printing
  const [lastPrintedBill, setLastPrintedBill] = useState<Bill | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Load daily prices
  useEffect(() => {
    const prices = getTodayPrices(products);
    setDailyPrices(prices);
    // Initialize the primary selected product item if empty
    if (products.length > 0) {
      setSelectedProductId((prev) => {
        const exists = products.some((p) => p.id === prev);
        return exists ? prev : products[0].id;
      });
    }
  }, [products]);

  // Handler to add a new cut directly from dropdown
  const handleAddProductFromDropdown = (nameEn: string, nameTa: string, price: number) => {
    const newProd: Product = {
      id: 'p_' + Date.now(),
      name: nameEn || nameTa,
      nameEn: nameEn || nameTa,
      nameTa: nameTa || nameEn,
      defaultPrice: price,
    };
    const updatedProducts = [...products, newProd];
    if (setProducts) {
      setProducts(updatedProducts);
    }
    saveProducts(updatedProducts);

    // Update today's daily prices
    const allPrices = loadDailyPrices();
    const todayPrices = { ...(allPrices[todayKey] || {}), [newProd.id]: price };
    allPrices[todayKey] = todayPrices;
    saveDailyPrices(allPrices);
    setDailyPrices(todayPrices);

    // Set as active selection
    setSelectedProductId(newProd.id);
    setCutItems((prev) => ({
      ...prev,
      [newProd.id]: {
        productId: newProd.id,
        variant: 'without_skin',
        baseRate: price,
        adjustedRate: price,
        kg: '',
        price: '',
        numericKg: 0,
        numericAmount: 0,
        isExpanded: true,
      },
    }));
    const displayName = getProductName(newProd, language);
    setToastMessage(language === 'ta' ? `"${displayName}" (₹${price}/கிலோ) சேர்க்கப்பட்டது` : `Added "${displayName}" (₹${price}/Kg) to cuts list`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Handler to remove a cut from dropdown
  const handleRemoveProduct = (productId: string) => {
    const prodToRemove = products.find((p) => p.id === productId);
    const updatedProducts = products.filter((p) => p.id !== productId);
    if (setProducts) {
      setProducts(updatedProducts);
    }
    saveProducts(updatedProducts);

    // Remove from active cut items if present
    setCutItems((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });

    // If currently selected, select another cut
    if (selectedProductId === productId) {
      if (updatedProducts.length > 0) {
        setSelectedProductId(updatedProducts[0].id);
      } else {
        setSelectedProductId('');
      }
    }
    const displayName = prodToRemove ? getProductName(prodToRemove, language) : '';
    setToastMessage(language === 'ta' ? `"${displayName}" நீக்கப்பட்டது` : `Removed cut`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Ensure item exists in cutItems
  const getItemData = (productId: string): ChickenCutItemData => {
    if (cutItems[productId]) {
      return cutItems[productId];
    }
    const baseRate = dailyPrices[productId] || 220;
    return {
      productId,
      variant: 'with_skin',
      baseRate: baseRate,
      adjustedRate: baseRate,
      kg: '',
      price: '',
      numericKg: 0,
      numericAmount: 0,
      isExpanded: true,
    };
  };

  // Update a cut's data
  const handleUpdateCut = (productId: string, partial: Partial<ChickenCutItemData>) => {
    setCutItems((prev) => {
      const current = prev[productId] || getItemData(productId);
      return {
        ...prev,
        [productId]: {
          ...current,
          ...partial,
        },
      };
    });
  };

  // Remove / Reset a single cut
  const handleRemoveCut = (productId: string) => {
    setCutItems((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
    setToastMessage(language === 'ta' ? 'பொருள் நீக்கப்பட்டது' : 'Item removed');
    setTimeout(() => setToastMessage(null), 1500);
  };

  // Active items with kg > 0 or amount > 0
  const activeBillItems: BillItem[] = (Object.values(cutItems) as ChickenCutItemData[])
    .filter((item) => item.numericAmount > 0 && item.numericKg > 0)
    .map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const isEggItem =
        item.variant === 'egg' ||
        item.variant === 'without_skin' ||
        item.productId === 'p_egg' ||
        (prod?.nameEn || prod?.name || '').trim().toLowerCase() === 'egg';

      const nameEn = isEggItem ? 'Egg' : (prod?.nameEn || prod?.name || 'Chicken Cut');
      const nameTa = isEggItem ? 'முட்டை' : (prod?.nameTa || prod?.name || 'கோழி துண்டு');
      const variantLabelsEn: Record<ChickenVariant, string> = {
        egg: 'Egg',
        without_skin: 'Egg',
        with_skin: 'With Skin',
        boneless: 'Boneless',
      };
      const variantLabelsTa: Record<ChickenVariant, string> = {
        egg: 'முட்டை',
        without_skin: 'முட்டை',
        with_skin: 'தோலுடன்',
        boneless: 'எலும்பில்லாதது',
      };
      const resolvedName = language === 'ta' ? nameTa : nameEn;
      const resolvedVariantLabel = isEggItem
        ? (language === 'ta' ? 'முட்டை' : 'Egg')
        : (language === 'ta' ? variantLabelsTa[item.variant] : variantLabelsEn[item.variant]);

      return {
        productId: item.productId,
        productName: resolvedName,
        productNameEn: nameEn,
        productNameTa: nameTa,
        variant: isEggItem ? 'egg' : item.variant,
        variantLabel: resolvedVariantLabel || 'Standard',
        baseRate: item.baseRate,
        pricePerKg: item.adjustedRate,
        kg: item.numericKg,
        amount: item.numericAmount,
      };
    });

  const totalAmount = activeBillItems.reduce((acc, item) => acc + item.amount, 0);
  const chickenItems = activeBillItems.filter((i) => i.variant !== 'egg');
  const eggItems = activeBillItems.filter((i) => i.variant === 'egg');
  const totalChickenKg = chickenItems.reduce((acc, item) => acc + item.kg, 0);
  const totalEggQty = eggItems.reduce((acc, item) => acc + item.kg, 0);
  const totalKg = totalChickenKg;
  const eggRate = dailyPrices['p_egg'] || 6;

  // Clear entire bill
  const handleResetBill = () => {
    setCutItems({});
    setToastMessage(language === 'ta' ? 'பில் அழிக்கப்பட்டது' : 'Bill cleared');
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Helper to trigger direct thermal print without changing screen
  const triggerSystemThermalPrint = () => {
    const style = document.createElement('style');
    style.id = 'print-page-size-style';
    style.innerHTML = '@page { size: 80mm auto; margin: 0mm !important; }';
    document.head.appendChild(style);
    window.print();
    setTimeout(() => {
      const el = document.getElementById('print-page-size-style');
      if (el) el.remove();
    }, 1000);
  };

  // Create & Save Bill + Print
  const handleCreateAndPrintBill = async () => {
    if (activeBillItems.length === 0) {
      setToastMessage(t.noItemsInBill);
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const newBillNumber = generateNextBillNumber();

    const finalBill: Bill = {
      id: 'bill_' + Date.now(),
      billNumber: newBillNumber,
      date: todayKey,
      time: timeFormatted,
      timestamp: now.getTime(),
      hotelName: settings.shopName,
      hotelPhone: settings.phoneNumber,
      items: activeBillItems,
      totalAmount: totalAmount,
      totalKg: totalKg,
    };

    // 1. Save to storage immediately
    addBill(finalBill);
    setLastPrintedBill(finalBill);

    // 2. Trigger Print without changing screen
    setIsPrinting(true);
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).bluetooth) {
        const result = await printBillViaBluetooth(finalBill, settings, language);
        if (result.success) {
          setToastMessage(
            language === 'ta'
              ? `பில் #${newBillNumber} சேமிக்கப்பட்டு புளூடூத்தில் அச்சிடப்பட்டது!`
              : `Bill #${newBillNumber} saved & printed via Bluetooth!`
          );
        } else {
          triggerSystemThermalPrint();
          setToastMessage(
            language === 'ta'
              ? `பில் #${newBillNumber} சேமிக்கப்பட்டு அச்சிடப்பட்டது!`
              : `Bill #${newBillNumber} saved & printed!`
          );
        }
      } else {
        triggerSystemThermalPrint();
        setToastMessage(
          language === 'ta'
            ? `பில் #${newBillNumber} சேமிக்கப்பட்டு அச்சிடப்பட்டது!`
            : `Bill #${newBillNumber} saved & printed!`
        );
      }
    } catch (e: any) {
      triggerSystemThermalPrint();
      setToastMessage(
        language === 'ta'
          ? `பில் #${newBillNumber} சேமிக்கப்பட்டு அச்சிடப்பட்டது!`
          : `Bill #${newBillNumber} saved & printed!`
      );
    } finally {
      setIsPrinting(false);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const addedProductIds = Object.keys(cutItems).filter(
    (id) => cutItems[id]?.numericAmount > 0
  );

  return (
    <div className="pb-32 pt-2 px-3.5 max-w-md mx-auto min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-4 right-4 z-50 max-w-md mx-auto bg-emerald-800 text-white py-3 px-4 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-500 animate-in fade-in slide-in-from-top-4">
          <Check className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Chicken Cuts Dropdown */}
      <ChickenCutDropdown
        products={products}
        dailyPrices={dailyPrices}
        cutItems={cutItems}
        selectedProductId={selectedProductId}
        language={language}
        onSelectCut={(productId) => {
          setSelectedProductId(productId);
          if (!cutItems[productId]) {
            setCutItems((prev) => ({
              ...prev,
              [productId]: getItemData(productId),
            }));
          }
        }}
        onAddProduct={handleAddProductFromDropdown}
        onRemoveProduct={handleRemoveProduct}
      />

      {/* Main Cut Cards Display */}
      <div>
        {(() => {
          const prod =
            products.find((p) => p.id === selectedProductId) || products[0];
          if (!prod) return null;
          const baseRate = dailyPrices[prod.id] || 220;
          const data = getItemData(prod.id);
          return (
            <ChickenCutCard
              key={prod.id}
              product={prod}
              baseRate={baseRate}
              eggRate={eggRate}
              withoutSkinOffset={withoutSkinOffset}
              data={data}
              language={language}
              onUpdate={(partial) => handleUpdateCut(prod.id, partial)}
              onRemove={() => handleRemoveCut(prod.id)}
              onSaveWithoutSkinOffset={handleSaveWithoutSkinOffset}
            />
          );
        })()}

        {/* Other Active Cuts in Current Bill */}
        {addedProductIds
          .filter((id) => id !== selectedProductId)
          .map((prodId) => {
            const prod = products.find((p) => p.id === prodId);
            if (!prod) return null;
            const baseRate = dailyPrices[prodId] || 220;
            const data = getItemData(prodId);
            return (
              <div key={prodId} className="mt-2">
                <div className="flex items-center justify-between mb-1 px-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t.additionalCutInBill}
                  </span>
                </div>
                <ChickenCutCard
                  product={prod}
                  baseRate={baseRate}
                  eggRate={eggRate}
                  withoutSkinOffset={withoutSkinOffset}
                  data={data}
                  language={language}
                  onUpdate={(partial) => handleUpdateCut(prodId, partial)}
                  onRemove={() => handleRemoveCut(prodId)}
                  onSaveWithoutSkinOffset={handleSaveWithoutSkinOffset}
                />
              </div>
            );
          })}
      </div>

      {/* Floating / Sticky Bill Summary & Print Controls */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-lg border-2 border-emerald-600 mt-1.5 mb-3">
        {/* Bill Summary Rows */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100 flex-wrap">
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              {totalEggQty > 0 && totalChickenKg > 0
                ? (language === 'ta' ? 'மொத்த எடை & எண்ணிக்கை' : 'Total Weight & Qty')
                : totalEggQty > 0
                ? (language === 'ta' ? 'மொத்த முட்டை' : 'Total Eggs')
                : t.totalKg}
            </div>
            <div className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-1.5 flex-wrap mt-0.5">
              {totalChickenKg > 0 && (
                <span className="flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>{totalChickenKg.toFixed(3)} {language === 'ta' ? 'கிலோ' : 'KG'}</span>
                </span>
              )}
              {totalChickenKg > 0 && totalEggQty > 0 && (
                <span className="text-gray-300">|</span>
              )}
              {totalEggQty > 0 && (
                <span className="flex items-center gap-1 text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded text-xs font-bold">
                  <span>🥚 {totalEggQty} {language === 'ta' ? 'முட்டை' : 'Eggs'}</span>
                </span>
              )}
              {totalChickenKg === 0 && totalEggQty === 0 && (
                <span className="text-gray-400 text-sm">0.000 Kg</span>
              )}
            </div>
          </div>
          <div className="text-right min-w-0">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              {t.totalAmount}
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-800 tracking-tight whitespace-nowrap">
              ₹{totalAmount.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Buttons: Clear & Print */}
        <div className="grid grid-cols-4 gap-1.5 mt-2">
          <button
            type="button"
            onClick={handleResetBill}
            disabled={activeBillItems.length === 0}
            className="col-span-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-1 rounded-xl flex flex-col items-center justify-center text-[11px] transition-all disabled:opacity-40 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 mb-0.5" />
            <span className="text-center leading-tight truncate max-w-full">{t.clearBill}</span>
          </button>
          <button
            type="button"
            onClick={handleCreateAndPrintBill}
            disabled={activeBillItems.length === 0 || isPrinting}
            className="col-span-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all disabled:opacity-50 cursor-pointer text-sm"
          >
            <Printer className="w-4 h-4 text-emerald-200 shrink-0" />
            <span className="font-extrabold truncate">
              {isPrinting
                ? t.connecting
                : language === 'ta'
                ? 'அச்சிடு & சேமி'
                : 'Print & Save'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
