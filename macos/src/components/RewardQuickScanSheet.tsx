import { useEffect, useState } from 'react';
import { CheckSquare2, Printer, Square, X } from 'lucide-react';
import QRCode from 'qrcode';
import { RewardItem } from '../types';
import { QRCodeImage } from './BarcodeComponents';
import SafeRewardImage from './SafeRewardImage';

interface RewardQuickScanSheetProps {
  classId: string;
  className: string;
  schoolName?: string;
  rewards: RewardItem[];
  onClose: () => void;
}

function escapePrintText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function RewardQuickScanSheet({
  classId,
  className,
  schoolName,
  rewards,
  onClose
}: RewardQuickScanSheetProps) {
  const storageKey = `class_scanner_${classId}_reward_quick_scan_ids`;
  const activeRewards = rewards.filter((reward) => !reward.archived);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const activeIds = new Set(activeRewards.map((reward) => reward.id));
    let savedIds: string[] = [];
    try {
      savedIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch {
      savedIds = [];
    }
    const validSavedIds = savedIds.filter((id) => activeIds.has(id));
    setSelectedIds(validSavedIds.length > 0 ? validSavedIds : activeRewards.map((reward) => reward.id));
  }, [classId]);

  const updateSelection = (ids: string[]) => {
    setSelectedIds(ids);
    localStorage.setItem(storageKey, JSON.stringify(ids));
  };

  const toggleReward = (rewardId: string) => {
    updateSelection(selectedIds.includes(rewardId)
      ? selectedIds.filter((id) => id !== rewardId)
      : [...selectedIds, rewardId]
    );
  };

  const selectedRewards = activeRewards.filter((reward) => selectedIds.includes(reward.id));

  const printSheet = async () => {
    const printArea = document.getElementById('print-area-wrapper');
    if (!printArea || selectedRewards.length === 0) return;

    const qrEntries = await Promise.all(selectedRewards.map(async (reward) => [
      reward.id,
      await QRCode.toDataURL(reward.id, {
        width: 240,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      })
    ] as const));
    const qrCodes = new Map(qrEntries);

    const cards = selectedRewards.map((reward) => {
      const pointsLabel = reward.type === 'custom'
        ? 'Prize'
        : `${reward.pointsValue > 0 ? '+' : ''}${reward.pointsValue} points`;
      const typeLabel = reward.type === 'behavior'
        ? `${reward.pointsValue < 0 ? 'Negative' : 'Positive'} behavior`
        : reward.type === 'points' ? 'Point reward' : 'Classroom prize';
      const accent = reward.pointsValue < 0 ? '#be123c' : reward.type === 'behavior' ? '#0369a1' : '#047857';
      const image = reward.imageUrl
        ? `<img src="${escapePrintText(reward.imageUrl)}" alt="" style="width:42px;height:42px;border-radius:7px;object-fit:cover;flex:none;" />`
        : '';
      return `<div style="height:1.55in;box-sizing:border-box;border:1.5px solid #94a3b8;border-top:5px solid ${accent};border-radius:7px;padding:9px;display:flex;align-items:center;gap:9px;break-inside:avoid;background:#fff;">
        ${image}
        <div style="min-width:0;flex:1;">
          <div style="font:800 13px Arial,sans-serif;color:#0f172a;line-height:1.15;">${escapePrintText(reward.name)}</div>
          <div style="margin-top:5px;font:700 9px Arial,sans-serif;color:${accent};text-transform:uppercase;">${escapePrintText(typeLabel)}</div>
          <div style="margin-top:4px;font:800 11px Arial,sans-serif;color:#334155;">${escapePrintText(pointsLabel)}</div>
          <div style="margin-top:5px;font:700 8px 'Courier New',monospace;color:#94a3b8;">${escapePrintText(reward.id)}</div>
        </div>
        <img src="${qrCodes.get(reward.id)}" alt="" style="width:82px;height:82px;flex:none;" />
      </div>`;
    }).join('');

    printArea.innerHTML = `<style>@page { size: letter portrait; margin: 10mm; }</style>
      <div style="background:#fff;color:#0f172a;font-family:Arial,sans-serif;">
        <header style="display:flex;align-items:end;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:8px;margin-bottom:12px;">
          <div><div style="font-size:18px;font-weight:900;">${escapePrintText(className)} Rewards</div><div style="margin-top:3px;font-size:10px;color:#475569;">${escapePrintText(schoolName?.trim() || 'School')} · Quick-Scan Sheet</div></div>
          <div style="font-size:9px;color:#64748b;">Scan a reward, then scan a student</div>
        </header>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">${cards}</div>
      </div>`;

    const handleAfterPrint = () => {
      printArea.innerHTML = '';
      window.removeEventListener('afterprint', handleAfterPrint);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    window.setTimeout(() => window.print(), 180);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="reward-sheet-title">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="mr-auto">
            <h3 id="reward-sheet-title" className="text-base font-bold text-slate-900">Rewards Quick-Scan Sheet</h3>
            <p className="mt-1 text-xs text-slate-500">Choose the rewards and behaviors you use most often.</p>
          </div>
          <button onClick={() => updateSelection(activeRewards.map((reward) => reward.id))} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Select All</button>
          <button onClick={() => updateSelection([])} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Clear</button>
          <button onClick={printSheet} disabled={selectedRewards.length === 0} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"><Printer className="h-4 w-4" /> Print Selected ({selectedRewards.length})</button>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Close rewards quick-scan sheet"><X className="h-5 w-5" /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-5">
          {activeRewards.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-semibold text-slate-500">Create or restore an active reward before making a quick-scan sheet.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeRewards.map((reward) => {
                const selected = selectedIds.includes(reward.id);
                return (
                  <button key={reward.id} type="button" onClick={() => toggleReward(reward.id)} className={`flex min-h-[112px] items-center gap-3 rounded-xl border p-3 text-left transition-all ${selected ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <SafeRewardImage src={reward.imageUrl} alt={reward.name} name={reward.name} type={reward.type} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold leading-tight text-slate-900">{reward.name}</div>
                      <div className={`mt-1 text-xs font-bold ${reward.pointsValue < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{reward.type === 'custom' ? 'Prize' : `${reward.pointsValue > 0 ? '+' : ''}${reward.pointsValue} points`}</div>
                    </div>
                    <QRCodeImage value={reward.id} size={48} />
                    {selected ? <CheckSquare2 className="h-5 w-5 shrink-0 text-blue-600" /> : <Square className="h-5 w-5 shrink-0 text-slate-300" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}