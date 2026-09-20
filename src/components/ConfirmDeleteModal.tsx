import React from 'react';
import { Trash2, X } from 'lucide-react';
import { LanguageCode } from '../types';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  itemDetails?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  language?: LanguageCode;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  message,
  itemDetails,
  confirmLabel,
  cancelLabel,
  language = 'en',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isTamil = language === 'ta';
  const defaultTitle = title || (isTamil ? 'நீக்க விரும்புகிறீர்களா?' : 'Do you want to delete?');
  const defaultConfirm = confirmLabel || (isTamil ? 'ஆம், நீக்கு' : 'Yes, Delete');
  const defaultCancel = cancelLabel || (isTamil ? 'ரத்து செய்' : 'Cancel');

  return (
    <div
      id="confirm-delete-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        id="confirm-delete-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs max-h-[92dvh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-red-100 transform animate-in zoom-in-95 duration-150 flex flex-col"
      >
        {/* Header Icon + Close */}
        <div className="bg-red-50/80 px-3.5 pt-3 pb-2 border-b border-red-100 flex items-start justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight break-words">
                {defaultTitle}
              </h3>
              <p className="text-[10px] font-black text-red-700 leading-tight">
                {isTamil ? 'இந்த செயலை மாற்ற முடியாது' : 'This action cannot be undone'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1 min-h-[2.4rem] min-w-[2.4rem] flex items-center justify-center rounded-lg hover:bg-red-100/50 transition-colors cursor-pointer touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-3.5 py-2.5 space-y-2 overflow-y-auto flex-1">
          <p className="text-xs font-black text-slate-700 leading-normal break-words">
            {message}
          </p>
          {itemDetails && (
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs font-black text-slate-800 break-words leading-tight">
              {itemDetails}
            </div>
          )}
        </div>

        {/* Action Buttons: Cancel vs Delete */}
        <div className="px-3.5 pb-3 pt-1 grid grid-cols-2 gap-1.5 flex-shrink-0">
          <button
            id="btn-confirm-delete-cancel"
            type="button"
            onClick={onCancel}
            className="min-h-[2.4rem] py-1.5 px-3 bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white rounded-lg font-black text-xs shadow-2xs transition-all active:scale-95 flex items-center justify-center touch-manipulation cursor-pointer"
          >
            <span className="leading-normal">{defaultCancel}</span>
          </button>
          <button
            id="btn-confirm-delete-yes"
            type="button"
            onClick={onConfirm}
            className="min-h-[2.4rem] py-1.5 px-3 bg-red-600 hover:bg-red-700 active:bg-rose-800 text-white rounded-lg font-black text-xs shadow-2xs shadow-red-600/25 transition-all active:scale-95 flex items-center justify-center gap-1 touch-manipulation cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="leading-normal">{defaultConfirm}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
