import React from 'react';
import { Archive, Download, ArrowRight, ShieldCheck } from 'lucide-react';
import { LanguageCode } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface BackupCleanupModalProps {
  isOpen: boolean;
  billsToArchiveCount: number;
  paymentsToArchiveCount?: number;
  retentionDays: number;
  language: LanguageCode;
  onDownloadAndCleanup: () => void;
  onCleanupNow: () => void;
  onClose?: () => void;
}

export const BackupCleanupModal: React.FC<BackupCleanupModalProps> = ({
  isOpen,
  billsToArchiveCount,
  paymentsToArchiveCount = 0,
  retentionDays,
  language,
  onDownloadAndCleanup,
  onCleanupNow,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const totalRecords = billsToArchiveCount + paymentsToArchiveCount;

  return (
    <div
      id="backup-cleanup-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="backup-cleanup-modal-content"
        className="bg-white rounded-2xl max-w-sm w-full p-3.5 shadow-2xl border border-emerald-100 space-y-2.5"
      >
        {/* Header Icon & Title */}
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
            <Archive className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
              {t.backupPromptTitle}
            </h3>
            <p className="text-[10px] text-emerald-700 font-black mt-0.5 leading-tight">
              {language === 'ta'
                ? `${retentionDays} நாட்களுக்கு முந்தைய பதிவுகள்`
                : `Records older than ${retentionDays} days`}
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 space-y-1.5">
          <p className="text-xs font-black text-emerald-950 leading-tight">
            {language === 'ta'
              ? `${billsToArchiveCount} பழைய பில்கள் காப்பகப்படுத்தப்படும். ஹோட்டல் பாக்கிகள் ஆரம்ப இருப்பாகப் பாதுகாக்கப்படும்.`
              : `${billsToArchiveCount} old bills will be archived. Dues are kept as opening balances.`}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-black">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              {language === 'ta'
                ? 'பாக்கிகள் மற்றும் கணக்குத் தொகைகள் இழக்கப்படாது.'
                : 'No outstanding balances or payments will be lost.'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-1.5 pt-0.5">
          {/* Button 1: Download backup & clean up */}
          <button
            id="btn-download-backup-cleanup"
            type="button"
            onClick={onDownloadAndCleanup}
            className="w-full min-h-[2.4rem] py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-black text-xs rounded-xl shadow-2xs shadow-emerald-700/25 flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer touch-manipulation"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.downloadBackupAndCleanup}</span>
          </button>

          {/* Button 2: Clean up now */}
          <button
            id="btn-cleanup-now"
            type="button"
            onClick={onCleanupNow}
            className="w-full min-h-[2.4rem] py-1.5 px-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer touch-manipulation"
          >
            <span>{t.cleanupNow}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>
    </div>
  );
};
