/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Scan, Keyboard, HelpCircle } from 'lucide-react';
import { Student, Assignment, StoreItem } from '../types';

interface ScannerHeaderProps {
  onScan: (rawCode: string) => void;
  activeStudentName?: string | null;
  activeStudentPoints?: number | null;
  onClearActiveStudent?: () => void;
  currentTab: string;
  students: Student[];
  assignments: Assignment[];
  storeItems: StoreItem[];
}

export default function ScannerHeader({
  onScan,
  activeStudentName,
  activeStudentPoints,
  onClearActiveStudent,
  currentTab,
  students,
  assignments,
  storeItems
}: ScannerHeaderProps) {
  const [scanInput, setScanInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scan code detection (automatic submission for standard and combined codes)
  useEffect(() => {
    const code = scanInput.trim().toUpperCase();
    if (!code) return;

    // Small debounce/settle delay (100ms) to allow the scanner or user to finish typing and prevent partial match triggers
    const timer = setTimeout(() => {
      const isStudentId = students.some((s) => s.id.toUpperCase() === code);
      const isAssignmentId = assignments.some((a) => a.id.toUpperCase() === code);
      const isItemId = storeItems.some((i) =>
        i.id.toUpperCase() === code || i.packageBarcode?.trim().toUpperCase() === code
      );

      // Check combined code (e.g. STU1001_ASM1001)
      let isCombinedCode = false;
      const separators = ['_', '-', ':'];
      for (const sep of separators) {
        if (code.includes(sep)) {
          const parts = code.split(sep);
          if (parts.length === 2) {
            const partA = parts[0].trim().toUpperCase();
            const partB = parts[1].trim().toUpperCase();
            const studentA = students.some((s) => s.id.toUpperCase() === partA);
            const assignmentB = assignments.some((a) => a.id.toUpperCase() === partB);
            const studentB = students.some((s) => s.id.toUpperCase() === partB);
            const assignmentA = assignments.some((a) => a.id.toUpperCase() === partA);
            if ((studentA && assignmentB) || (studentB && assignmentA)) {
              isCombinedCode = true;
              break;
            }
          }
        }
      }

      if (isStudentId || isAssignmentId || isItemId || isCombinedCode) {
        onScan(code);
        setScanInput('');
        addPulseEffect();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [scanInput, students, assignments, storeItems, onScan]);

  // Global hotkey: Capture any printable character keypress and focus the scanner
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in a standard text input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ignore modifier keys (e.g., Ctrl+C, Cmd+R)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // Focus global scanner input on any alphanumeric/printable character
      if (e.key.length === 1) {
        inputRef.current?.focus();
        // Do NOT call preventDefault so that the pressed character naturally appears in the focused input
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-refocus scanner input on student selection or tab switches to keep physical scanner flow continuous
  useEffect(() => {
    const activeEl = document.activeElement;
    const isTypingElsewhere = activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      (activeEl as HTMLElement).isContentEditable
    );
    
    if (!isTypingElsewhere && activeEl !== inputRef.current) {
      inputRef.current?.focus();
    }
  }, [activeStudentName, currentTab]);

  const [pulse, setPulse] = useState(false);
  const addPulseEffect = () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = scanInput.trim();
    if (code) {
      onScan(code);
      setScanInput('');
      addPulseEffect();
    }
  };

  return (
    <div className="relative bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 shadow-sm">
      {/* Search Input Area */}
      <form
        onSubmit={handleSubmit}
        className={`relative flex-1 max-w-xl flex items-center transition-all duration-300 ${
          pulse ? 'scale-[1.02] ring-4 ring-blue-50 rounded-xl' : ''
        }`}
      >
        <div className="absolute left-4 text-slate-400 pointer-events-none flex items-center gap-1.5">
          <Scan className={`w-5 h-5 ${isFocused ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          id="scanner-global-input"
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={`Ready to scan student ID or assignment...`}
          className={`w-full pl-12 pr-28 py-3 bg-slate-100 border text-slate-800 placeholder-slate-400 rounded-xl text-sm font-medium focus:outline-none transition-all duration-200 ${
            isFocused
              ? 'bg-white border-blue-500 ring-4 ring-blue-50 shadow-sm'
              : 'border-transparent hover:bg-slate-200/50'
          }`}
          autoComplete="off"
        />

        {/* Floating Right Badges inside Input */}
        <div className="absolute right-3 flex items-center gap-2">
          {/* Pulsing Status Dot */}
          <div className="flex items-center gap-1.5 bg-white/95 border border-slate-100 py-1 px-2.5 rounded-lg shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">Scanner Live</span>
          </div>

          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/80 transition-colors"
            title="How to scan"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Active Scan Context Status / Onboarding banner */}
      <div className="flex items-center gap-3">
        {activeStudentName ? (
          <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 text-blue-900 py-1.5 px-3.5 rounded-xl text-sm animate-fade-in shadow-sm">
            <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="font-semibold text-blue-800">
              Active Student: <span className="font-bold underline">{activeStudentName}</span>
            </span>
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-xs font-bold">
              {activeStudentPoints} pts
            </span>
            <button
              onClick={onClearActiveStudent}
              className="ml-1 text-blue-400 hover:text-blue-700 font-bold text-xs"
              title="Clear Selection"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-500 max-w-xs text-right hidden lg:block">
            {currentTab === 'Class Store' && (
              <span className="text-blue-600 font-semibold bg-blue-50/50 px-2 py-1 rounded-md">
                💡 Scan a Student ID barcode first to check out store items
              </span>
            )}
            {currentTab === 'Assignments' && (
              <span className="text-emerald-600 font-semibold bg-emerald-50/50 px-2 py-1 rounded-md">
                💡 Select an assignment, then scan students to mark Done!
              </span>
            )}
            {currentTab === 'Dashboard' && (
              <span className="text-slate-500 font-medium">
                💡 Press <kbd className="bg-slate-100 px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold shadow-sm">S</kbd> to quick-focus scanner from anywhere.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Popover Help Panel */}
      {showHelp && (
        <div className="absolute top-20 left-6 right-6 md:left-6 md:right-auto md:w-[420px] bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xl z-50 animate-slide-in text-slate-700 leading-relaxed text-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Scan className="w-4 h-4 text-emerald-500" /> Physical Barcode Integration
            </h4>
            <button
              onClick={() => setShowHelp(false)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          </div>
          <div className="space-y-3">
            <p>
              This console is built for <strong>physical USB or Bluetooth barcode/QR code scanners</strong>.
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1.5">
              <div className="flex gap-2">
                <span className="font-bold text-slate-700">1.</span>
                <span>Select the input field (or press <kbd className="bg-slate-200/80 px-1 py-0.5 rounded">S</kbd> on your keyboard).</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-700">2.</span>
                <span>Aim your scanner at any student ID card, item barcode, or assignment code.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-700">3.</span>
                <span>The scanner will type the code automatically and trigger instant processing!</span>
              </div>
            </div>
            <div className="text-xs text-indigo-600 font-medium space-y-1 mt-2">
              <p>🎯 <strong>Interactive Shortcut Examples:</strong></p>
              <ul className="list-disc list-inside pl-1 space-y-0.5">
                <li>Scan <code className="bg-indigo-50 px-1 rounded font-mono font-bold">STU1001</code> to instantly open Alex's profile.</li>
                <li>On the Store tab, scan a Student code, then scan an item code (like <code className="bg-indigo-50 px-1 rounded font-mono font-bold">ITM101</code>) to purchase it!</li>
                <li>On Assignments, select homework and scan student IDs in bulk to check them off with sounds.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
