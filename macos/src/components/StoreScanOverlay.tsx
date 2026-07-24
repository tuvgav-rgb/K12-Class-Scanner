import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, CircleAlert, Gift, ScanLine, XCircle } from 'lucide-react';
import { StoreScanResult } from '../hooks/useClassState';

interface StoreScanOverlayProps {
  result: StoreScanResult | null;
  onClose: () => void;
}

export default function StoreScanOverlay({ result, onClose }: StoreScanOverlayProps) {
  useEffect(() => {
    if (!result) return;

    const timer = window.setTimeout(onClose, 2000);
    return () => window.clearTimeout(timer);
  }, [result, onClose]);

  const isSuccess = result?.status === 'success';
  const isWarning = result?.status === 'warning';
  const isPriceCheck = result?.status === 'price-check';
  const statusLabel = isSuccess ? 'Purchase approved' : isPriceCheck ? 'Price check' : isWarning ? 'Buyer required' : 'Purchase denied';
  const StatusIcon = isSuccess ? CheckCircle2 : isPriceCheck || isWarning ? CircleAlert : XCircle;

  return (
    <AnimatePresence>
      {result && (
        <motion.div
          key={result.timestamp}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-5 backdrop-blur-sm"
          role="status"
          aria-live="assertive"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.86, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -12 }}
            transition={{ type: 'spring', damping: 24, stiffness: 360 }}
            className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className={`flex items-center justify-center gap-3 px-6 py-4 text-center text-sm font-black uppercase tracking-wider ${
              isSuccess ? 'bg-emerald-600 text-white' : isPriceCheck ? 'bg-blue-600 text-white' : isWarning ? 'bg-amber-500 text-slate-950' : 'bg-rose-600 text-white'
            }`}>
              <StatusIcon className="h-6 w-6" />
              {statusLabel}
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-[220px_1fr] sm:p-8">
              <div className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
                {result.item.imageUrl ? (
                  <img src={result.item.imageUrl} alt={result.item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <Gift className="h-24 w-24" />
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-col justify-center text-center sm:text-left">
                <div className="mb-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 sm:justify-start">
                  <ScanLine className="h-4 w-4" />
                  Store item scanned
                </div>
                <h2 className="break-words text-3xl font-black leading-tight text-slate-900">{result.item.name}</h2>
                <div className="mt-4 inline-flex self-center rounded-xl bg-amber-100 px-4 py-2 text-xl font-black text-amber-800 sm:self-start">
                  {result.item.cost.toLocaleString()} points
                </div>
                <p className="mt-5 text-base font-semibold leading-relaxed text-slate-600">{result.message}</p>
                {result.student && (
                  <p className="mt-3 text-sm font-bold text-slate-500">
                    {isSuccess ? `${result.student.name}'s new balance: ${result.student.points.toLocaleString()} points` : `Buyer: ${result.student.name}`}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}