import { useEffect, useRef, useState } from 'react';
import { Armchair, Printer, RotateCcw, RotateCcwSquare, RotateCwSquare, Save, X } from 'lucide-react';
import QRCode from 'qrcode';
import { Student } from '../types';
import { QRCodeImage } from './BarcodeComponents';

type Orientation = 'landscape' | 'portrait';

interface Position {
  x: number;
  y: number;
  rotation?: number;
}

interface SavedSeatingChart {
  orientation: Orientation;
  positions: Record<string, Position>;
}

interface SeatingChartSheetProps {
  classId: string;
  className: string;
  schoolName?: string;
  students: Student[];
  onClose: () => void;
}

const TEACHER_DESK_ID = '__teacher_desk__';

function createDefaultPositions(students: Student[], orientation: Orientation): Record<string, Position> {
  const columns = orientation === 'landscape' ? 5 : 4;
  const rows = Math.max(1, Math.ceil(students.length / columns));
  const positions: Record<string, Position> = {
    [TEACHER_DESK_ID]: { x: 50, y: 91, rotation: 0 }
  };

  students.forEach((student, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    positions[student.id] = {
      x: ((column + 0.5) / columns) * 100,
      y: 9 + ((row + 0.5) / rows) * 70,
      rotation: 0
    };
  });
  return positions;
}

function escapePrintText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function SeatingChartSheet({
  classId,
  className,
  schoolName,
  students,
  onClose
}: SeatingChartSheetProps) {
  const storageKey = `class_scanner_${classId}_seating_chart`;
  const roomRef = useRef<HTMLDivElement>(null);
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedDeskId, setSelectedDeskId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let loaded: SavedSeatingChart | null = null;
    try {
      const raw = localStorage.getItem(storageKey);
      loaded = raw ? JSON.parse(raw) : null;
    } catch {
      loaded = null;
    }

    const nextOrientation = loaded?.orientation || 'landscape';
    const defaults = createDefaultPositions(students, nextOrientation);
    const validIds = new Set([TEACHER_DESK_ID, ...students.map((student) => student.id)]);
    const loadedPositions = Object.fromEntries(
      Object.entries(loaded?.positions || {}).filter(([id]) => validIds.has(id))
    );
    setOrientation(nextOrientation);
    setPositions({ ...defaults, ...loadedPositions });
  }, [classId]);

  useEffect(() => {
    setPositions((current) => {
      const defaults = createDefaultPositions(students, orientation);
      const validIds = new Set([TEACHER_DESK_ID, ...students.map((student) => student.id)]);
      return Object.fromEntries(
        Object.entries({ ...defaults, ...current }).filter(([id]) => validIds.has(id))
      );
    });
  }, [students, orientation]);

  const moveDesk = (clientX: number, clientY: number) => {
    if (!draggingId || !roomRef.current) return;
    const bounds = roomRef.current.getBoundingClientRect();
    const x = Math.min(95, Math.max(5, ((clientX - bounds.left) / bounds.width) * 100));
    const y = Math.min(94, Math.max(6, ((clientY - bounds.top) / bounds.height) * 100));
    setPositions((current) => ({
      ...current,
      [draggingId]: { ...current[draggingId], x, y }
    }));
    setSaved(false);
  };

  const setDeskRotation = (deskId: string, rotation: number) => {
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    setPositions((current) => ({
      ...current,
      [deskId]: { ...(current[deskId] || { x: 50, y: 50 }), rotation: normalizedRotation }
    }));
    setSaved(false);
  };

  const saveChart = () => {
    localStorage.setItem(storageKey, JSON.stringify({ orientation, positions } satisfies SavedSeatingChart));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const resetChart = () => {
    setPositions(createDefaultPositions(students, orientation));
    setSaved(false);
  };

  const changeOrientation = (nextOrientation: Orientation) => {
    setOrientation(nextOrientation);
    setSaved(false);
  };

  const printChart = async () => {
    const printArea = document.getElementById('print-area-wrapper');
    if (!printArea) return;

    const qrEntries = await Promise.all(students.map(async (student) => [
      student.id,
      await QRCode.toDataURL(
        student.qrCodeOption === 'id_and_name' ? `${student.id} - ${student.name}` : student.id,
        { width: 180, margin: 1, color: { dark: '#000000', light: '#ffffff' } }
      )
    ] as const));
    const qrCodes = new Map(qrEntries);
    const deskWidth = orientation === 'landscape' ? 12.5 : 17;

    const studentDesks = students.map((student) => {
      const position = positions[student.id] || { x: 50, y: 50 };
      const initials = student.name.split(' ').map((part) => part[0]).join('').slice(0, 2);
      const photo = student.photoUrl
        ? `<img src="${escapePrintText(student.photoUrl)}" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid #ffffff;box-shadow:0 0 0 1px #94a3b8;" />`
        : `<div style="width:32px;height:32px;border-radius:50%;background:#dbeafe;color:#1e40af;border:2px solid #ffffff;box-shadow:0 0 0 1px #94a3b8;display:flex;align-items:center;justify-content:center;font:700 9px Arial,sans-serif;box-sizing:border-box;">${escapePrintText(initials)}</div>`;
      return `<div style="position:absolute;left:${position.x}%;top:${position.y}%;transform:translate(-50%,-50%) rotate(${position.rotation || 0}deg);transform-origin:center;width:${deskWidth}%;height:80px;box-sizing:border-box;border:1.5px solid #64748b;border-radius:5px;background:#fff;padding:15px 6px 6px;display:flex;align-items:center;gap:5px;break-inside:avoid;">
        <div style="position:absolute;left:50%;top:0;transform:translate(-50%,-58%);z-index:2;">${photo}</div>
        <div style="min-width:0;flex:1;font:700 9px Arial,sans-serif;color:#0f172a;line-height:1.15;word-break:normal;overflow-wrap:normal;hyphens:none;">${escapePrintText(student.name)}</div>
        <img src="${qrCodes.get(student.id)}" alt="" style="width:42px;height:42px;flex:none;" />
      </div>`;
    }).join('');

    const teacherPosition = positions[TEACHER_DESK_ID] || { x: 50, y: 91 };
    printArea.innerHTML = `<style>@page { size: letter ${orientation}; margin: 8mm; }</style>
      <div style="height:${orientation === 'landscape' ? '7.85in' : '10.35in'};box-sizing:border-box;background:#fff;color:#0f172a;font-family:Arial,sans-serif;display:flex;flex-direction:column;overflow:hidden;">
        <header style="height:0.55in;flex:none;text-align:center;border-bottom:2px solid #0f172a;">
          <div style="font-size:18px;font-weight:800;">${escapePrintText(className)}</div>
          <div style="font-size:11px;color:#475569;margin-top:3px;">${escapePrintText(schoolName?.trim() || 'School')}</div>
        </header>
        <div style="position:relative;flex:1;margin-top:8px;border:2px solid #94a3b8;border-radius:6px;background:#f8fafc;overflow:hidden;">
          ${studentDesks}
          <div style="position:absolute;left:${teacherPosition.x}%;top:${teacherPosition.y}%;transform:translate(-50%,-50%) rotate(${teacherPosition.rotation || 0}deg);transform-origin:center;width:${orientation === 'landscape' ? 16 : 22}%;height:70px;border:2px solid #1e3a8a;border-radius:5px;background:#dbeafe;display:flex;align-items:center;justify-content:center;font:800 12px Arial,sans-serif;color:#1e3a8a;">TEACHER DESK</div>
        </div>
      </div>`;

    const handleAfterPrint = () => {
      printArea.innerHTML = '';
      window.removeEventListener('afterprint', handleAfterPrint);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    window.setTimeout(() => window.print(), 180);
  };

  const renderStudentDesk = (student: Student) => {
    const position = positions[student.id] || { x: 50, y: 50 };
    const initials = student.name.split(' ').map((part) => part[0]).join('').slice(0, 2);
    const qrValue = student.qrCodeOption === 'id_and_name' ? `${student.id} - ${student.name}` : student.id;
    return (
      <button
        key={student.id}
        type="button"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setSelectedDeskId(student.id);
          setDraggingId(student.id);
        }}
        onPointerMove={(event) => moveDesk(event.clientX, event.clientY)}
        onPointerUp={() => setDraggingId(null)}
        onPointerCancel={() => setDraggingId(null)}
        className="absolute flex h-[92px] -translate-x-1/2 -translate-y-1/2 touch-none select-none items-center gap-1 rounded-md border border-slate-300 bg-white px-1.5 pb-1.5 pt-4 text-left shadow-sm hover:border-blue-400 hover:shadow-md"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          width: orientation === 'landscape' ? '12.5%' : '17%',
          transform: `translate(-50%, -50%) rotate(${position.rotation || 0}deg)`,
          transformOrigin: 'center'
        }}
        title={`Move ${student.name}'s desk`}
      >
        <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-[58%]">
          {student.photoUrl ? (
            <img src={student.photoUrl} alt="" className="h-9 w-9 rounded-full border-2 border-white object-cover shadow ring-1 ring-slate-400" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-blue-100 text-[9px] font-bold text-blue-800 shadow ring-1 ring-slate-400">{initials}</span>
          )}
        </span>
        <span className="min-w-0 flex-1 text-[9px] font-bold leading-tight text-slate-800">{student.name}</span>
        <QRCodeImage value={qrValue} size={34} />
      </button>
    );
  };

  const teacherPosition = positions[TEACHER_DESK_ID] || { x: 50, y: 91 };
  const selectedPosition = selectedDeskId ? positions[selectedDeskId] : null;
  const selectedDeskName = selectedDeskId === TEACHER_DESK_ID
    ? 'Teacher Desk'
    : students.find((student) => student.id === selectedDeskId)?.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="seating-chart-title">
      <div className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="mr-auto">
            <h3 id="seating-chart-title" className="flex items-center gap-2 text-base font-bold text-slate-900"><Armchair className="h-5 w-5 text-blue-600" /> Seating Chart Quick-Scan Sheet</h3>
            <p className="mt-1 text-xs text-slate-500">Drag each desk into place, save the room, then print.</p>
          </div>
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {(['landscape', 'portrait'] as Orientation[]).map((option) => (
              <button key={option} onClick={() => changeOrientation(option)} className={`rounded-md px-3 py-1.5 text-xs font-bold capitalize ${orientation === option ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>{option}</button>
            ))}
          </div>
          {selectedDeskId && selectedPosition && selectedDeskName && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5">
              <span className="max-w-32 truncate text-[10px] font-bold text-blue-900" title={selectedDeskName}>{selectedDeskName}</span>
              <button type="button" onClick={() => setDeskRotation(selectedDeskId, (selectedPosition.rotation || 0) - 15)} className="rounded p-1 text-blue-700 hover:bg-blue-100" title="Rotate 15 degrees left"><RotateCcwSquare className="h-4 w-4" /></button>
              <input
                type="range"
                min="0"
                max="359"
                step="1"
                value={selectedPosition.rotation || 0}
                onChange={(event) => setDeskRotation(selectedDeskId, Number(event.target.value))}
                className="w-28 accent-blue-600"
                aria-label={`Rotate ${selectedDeskName}`}
              />
              <span className="w-9 text-right text-[10px] font-black text-blue-800">{Math.round(selectedPosition.rotation || 0)}°</span>
              <button type="button" onClick={() => setDeskRotation(selectedDeskId, (selectedPosition.rotation || 0) + 15)} className="rounded p-1 text-blue-700 hover:bg-blue-100" title="Rotate 15 degrees right"><RotateCwSquare className="h-4 w-4" /></button>
            </div>
          )}
          <button onClick={resetChart} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" title="Reset desk positions"><RotateCcw className="h-4 w-4" /></button>
          <button onClick={saveChart} className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"><Save className="h-4 w-4" /> {saved ? 'Saved' : 'Save Layout'}</button>
          <button onClick={printChart} className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"><Printer className="h-4 w-4" /> Print</button>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Close seating chart"><X className="h-5 w-5" /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-5">
          <div
            ref={roomRef}
            className="relative mx-auto overflow-hidden rounded-md border-2 border-slate-300 bg-white shadow-inner"
            style={{ aspectRatio: orientation === 'landscape' ? '11 / 7.6' : '8.5 / 11', width: orientation === 'landscape' ? '100%' : 'min(68%, 680px)' }}
          >
            <div className="absolute inset-x-0 top-0 z-10 border-b border-slate-200 bg-white/95 py-2 text-center shadow-sm">
              <div className="text-sm font-black text-slate-900">{className}</div>
              <div className="text-[10px] font-semibold text-slate-500">{schoolName?.trim() || 'School'}</div>
            </div>
            {students.map(renderStudentDesk)}
            <button
              type="button"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                setSelectedDeskId(TEACHER_DESK_ID);
                setDraggingId(TEACHER_DESK_ID);
              }}
              onPointerMove={(event) => moveDesk(event.clientX, event.clientY)}
              onPointerUp={() => setDraggingId(null)}
              onPointerCancel={() => setDraggingId(null)}
              className="absolute flex h-[72px] -translate-x-1/2 -translate-y-1/2 touch-none select-none items-center justify-center rounded-md border-2 border-blue-800 bg-blue-100 px-3 py-3 text-xs font-black text-blue-900 shadow-sm"
              style={{
                left: `${teacherPosition.x}%`,
                top: `${teacherPosition.y}%`,
                width: orientation === 'landscape' ? '16%' : '22%',
                transform: `translate(-50%, -50%) rotate(${teacherPosition.rotation || 0}deg)`,
                transformOrigin: 'center'
              }}
            >
              Teacher Desk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}