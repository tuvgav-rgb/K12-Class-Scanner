/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  UserPlus,
  Search,
  Plus,
  Minus,
  CreditCard,
  Trash2,
  ChevronDown,
  ChevronUp,
  Printer,
  X,
  Sparkles,
  School,
  IdCard,
  Upload,
  User,
  Check,
  Download,
  Copy
} from 'lucide-react';
import { Student } from '../types';
import { Barcode, QRCodeImage } from './BarcodeComponents';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

interface CardTheme {
  id: string;
  name: string;
  bgClasses: string;
  textNameColor: string;
  textLabelColor: string;
  accentTextColor: string;
  accentSvgColor: string;
  logoBgColor: string;
  badgeBgColor: string;
  borderClasses: string;
  glow1: string;
  glow2: string;
  printBg: string;
  printText: string;
  printStyles: {
    border: string;
    headerBorder: string;
    schoolLogoBg: string;
    schoolNameColor: string;
    labelColor: string;
    valueColor: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    printGlow1: string;
    printGlow2: string;
  };
}

const CARD_THEMES: CardTheme[] = [
  {
    id: 'navy',
    name: 'Classic Navy',
    bgClasses: 'bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950',
    textNameColor: 'text-white',
    textLabelColor: 'text-slate-400',
    accentTextColor: 'text-blue-300',
    accentSvgColor: 'text-blue-400',
    logoBgColor: 'bg-white/20',
    badgeBgColor: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
    borderClasses: 'border-slate-800',
    glow1: 'bg-blue-500/15',
    glow2: 'bg-emerald-500/5',
    printBg: 'linear-gradient(135deg, #090d16 0%, #0f172a 60%, #1e3a8a 100%)',
    printText: '#ffffff',
    printStyles: {
      border: '1.5px solid rgba(255, 255, 255, 0.15)',
      headerBorder: 'rgba(255, 255, 255, 0.15)',
      schoolLogoBg: 'rgba(255, 255, 255, 0.2)',
      schoolNameColor: '#93c5fd',
      labelColor: '#94a3b8',
      valueColor: '#60a5fa',
      badgeBg: 'rgba(59, 130, 246, 0.25)',
      badgeText: '#dbeafe',
      badgeBorder: '1.5px solid rgba(59, 130, 246, 0.3)',
      printGlow1: 'rgba(59, 130, 246, 0.15)',
      printGlow2: 'rgba(16, 185, 129, 0.05)'
    }
  },
  {
    id: 'emerald',
    name: 'Emerald Mint',
    bgClasses: 'bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900',
    textNameColor: 'text-white',
    textLabelColor: 'text-slate-400',
    accentTextColor: 'text-emerald-300',
    accentSvgColor: 'text-emerald-400',
    logoBgColor: 'bg-white/20',
    badgeBgColor: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
    borderClasses: 'border-emerald-900/30',
    glow1: 'bg-emerald-500/15',
    glow2: 'bg-blue-500/5',
    printBg: 'linear-gradient(135deg, #022c22 0%, #064e3b 60%, #022c22 100%)',
    printText: '#ffffff',
    printStyles: {
      border: '1.5px solid rgba(16, 185, 129, 0.15)',
      headerBorder: 'rgba(255, 255, 255, 0.15)',
      schoolLogoBg: 'rgba(255, 255, 255, 0.2)',
      schoolNameColor: '#6ee7b7',
      labelColor: '#94a3b8',
      valueColor: '#6ee7b7',
      badgeBg: 'rgba(16, 185, 129, 0.25)',
      badgeText: '#d1fae5',
      badgeBorder: '1.5px solid rgba(16, 185, 129, 0.3)',
      printGlow1: 'rgba(16, 185, 129, 0.15)',
      printGlow2: 'rgba(59, 130, 246, 0.05)'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset Gold',
    bgClasses: 'bg-gradient-to-br from-stone-950 via-amber-950 to-orange-950',
    textNameColor: 'text-white',
    textLabelColor: 'text-stone-400',
    accentTextColor: 'text-amber-300',
    accentSvgColor: 'text-amber-400',
    logoBgColor: 'bg-white/20',
    badgeBgColor: 'bg-amber-500/20 text-amber-200 border-amber-500/30',
    borderClasses: 'border-orange-900/30',
    glow1: 'bg-orange-500/15',
    glow2: 'bg-amber-500/5',
    printBg: 'linear-gradient(135deg, #1c1917 0%, #451a03 55%, #7c2d12 100%)',
    printText: '#ffffff',
    printStyles: {
      border: '1.5px solid rgba(249, 115, 22, 0.2)',
      headerBorder: 'rgba(255, 255, 255, 0.15)',
      schoolLogoBg: 'rgba(255, 255, 255, 0.2)',
      schoolNameColor: '#fcd34d',
      labelColor: '#a8a29e',
      valueColor: '#fbbf24',
      badgeBg: 'rgba(245, 158, 11, 0.25)',
      badgeText: '#fef3c7',
      badgeBorder: '1.5px solid rgba(245, 158, 11, 0.3)',
      printGlow1: 'rgba(249, 115, 22, 0.15)',
      printGlow2: 'rgba(245, 158, 11, 0.05)'
    }
  },
  {
    id: 'violet',
    name: 'Royal Violet',
    bgClasses: 'bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950',
    textNameColor: 'text-white',
    textLabelColor: 'text-purple-300/70',
    accentTextColor: 'text-fuchsia-300',
    accentSvgColor: 'text-fuchsia-400',
    logoBgColor: 'bg-white/20',
    badgeBgColor: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
    borderClasses: 'border-purple-900/30',
    glow1: 'bg-fuchsia-500/15',
    glow2: 'bg-purple-500/5',
    printBg: 'linear-gradient(135deg, #0f172a 0%, #3b0764 60%, #1e1b4b 100%)',
    printText: '#ffffff',
    printStyles: {
      border: '1.5px solid rgba(192, 38, 211, 0.2)',
      headerBorder: 'rgba(255, 255, 255, 0.15)',
      schoolLogoBg: 'rgba(255, 255, 255, 0.2)',
      schoolNameColor: '#f5d0fe',
      labelColor: '#cbd5e1',
      valueColor: '#e879f9',
      badgeBg: 'rgba(168, 85, 247, 0.25)',
      badgeText: '#f3e8ff',
      badgeBorder: '1.5px solid rgba(168, 85, 247, 0.3)',
      printGlow1: 'rgba(192, 38, 211, 0.15)',
      printGlow2: 'rgba(168, 85, 247, 0.05)'
    }
  },
  {
    id: 'cherry',
    name: 'Cherry Blossom',
    bgClasses: 'bg-gradient-to-br from-rose-950 via-rose-900 to-slate-900',
    textNameColor: 'text-white',
    textLabelColor: 'text-rose-200/60',
    accentTextColor: 'text-rose-300',
    accentSvgColor: 'text-rose-400',
    logoBgColor: 'bg-white/20',
    badgeBgColor: 'bg-rose-500/20 text-rose-200 border-rose-500/30',
    borderClasses: 'border-rose-900/30',
    glow1: 'bg-rose-400/20',
    glow2: 'bg-rose-500/5',
    printBg: 'linear-gradient(135deg, #4c0519 0%, #881337 55%, #1e1b4b 100%)',
    printText: '#ffffff',
    printStyles: {
      border: '1.5px solid rgba(244, 63, 94, 0.2)',
      headerBorder: 'rgba(255, 255, 255, 0.15)',
      schoolLogoBg: 'rgba(255, 255, 255, 0.2)',
      schoolNameColor: '#fecdd3',
      labelColor: '#fda4af',
      valueColor: '#fb7185',
      badgeBg: 'rgba(244, 63, 94, 0.25)',
      badgeText: '#ffe4e6',
      badgeBorder: '1.5px solid rgba(244, 63, 94, 0.3)',
      printGlow1: 'rgba(244, 63, 94, 0.15)',
      printGlow2: 'rgba(244, 63, 94, 0.05)'
    }
  },
  {
    id: 'cosmic',
    name: 'Cosmic Neon',
    bgClasses: 'bg-gradient-to-br from-indigo-950 via-slate-900 to-pink-950',
    textNameColor: 'text-white',
    textLabelColor: 'text-slate-400',
    accentTextColor: 'text-cyan-300',
    accentSvgColor: 'text-fuchsia-400',
    logoBgColor: 'bg-white/20',
    badgeBgColor: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/30',
    borderClasses: 'border-indigo-900/40',
    glow1: 'bg-fuchsia-500/20',
    glow2: 'bg-cyan-400/15',
    printBg: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #50072b 100%)',
    printText: '#ffffff',
    printStyles: {
      border: '1.5px solid rgba(6, 182, 212, 0.2)',
      headerBorder: 'rgba(255, 255, 255, 0.15)',
      schoolLogoBg: 'rgba(255, 255, 255, 0.2)',
      schoolNameColor: '#a5f3fc',
      labelColor: '#cbd5e1',
      valueColor: '#a5f3fc',
      badgeBg: 'rgba(6, 182, 212, 0.25)',
      badgeText: '#cffafe',
      badgeBorder: '1.5px solid rgba(6, 182, 212, 0.3)',
      printGlow1: 'rgba(240, 46, 170, 0.15)',
      printGlow2: 'rgba(34, 211, 238, 0.1)'
    }
  },
  {
    id: 'ocean',
    name: 'Ocean Wave',
    bgClasses: 'bg-gradient-to-br from-slate-900 via-teal-950 to-cyan-950',
    textNameColor: 'text-white',
    textLabelColor: 'text-teal-200/50',
    accentTextColor: 'text-cyan-300',
    accentSvgColor: 'text-teal-400',
    logoBgColor: 'bg-white/20',
    badgeBgColor: 'bg-teal-500/20 text-teal-200 border-teal-500/30',
    borderClasses: 'border-cyan-900/30',
    glow1: 'bg-cyan-500/15',
    glow2: 'bg-teal-500/5',
    printBg: 'linear-gradient(135deg, #0f172a 0%, #042f2e 55%, #083344 100%)',
    printText: '#ffffff',
    printStyles: {
      border: '1.5px solid rgba(6, 182, 212, 0.15)',
      headerBorder: 'rgba(255, 255, 255, 0.15)',
      schoolLogoBg: 'rgba(255, 255, 255, 0.2)',
      schoolNameColor: '#a5f3fc',
      labelColor: '#94a3b8',
      valueColor: '#a5f3fc',
      badgeBg: 'rgba(6, 182, 212, 0.25)',
      badgeText: '#cffafe',
      badgeBorder: '1.5px solid rgba(6, 182, 212, 0.3)',
      printGlow1: 'rgba(6, 182, 212, 0.15)',
      printGlow2: 'rgba(20, 184, 166, 0.05)'
    }
  },
  {
    id: 'charcoal',
    name: 'Charcoal Tech',
    bgClasses: 'bg-gradient-to-br from-stone-950 via-stone-900 to-neutral-950',
    textNameColor: 'text-white',
    textLabelColor: 'text-stone-400',
    accentTextColor: 'text-stone-300',
    accentSvgColor: 'text-stone-400',
    logoBgColor: 'bg-white/10',
    badgeBgColor: 'bg-stone-500/20 text-stone-200 border-stone-500/30',
    borderClasses: 'border-stone-800',
    glow1: 'bg-stone-700/10',
    glow2: 'bg-stone-500/5',
    printBg: 'linear-gradient(135deg, #0c0a09 0%, #1c1917 60%, #0a0a0a 100%)',
    printText: '#ffffff',
    printStyles: {
      border: '1.5px solid rgba(255, 255, 255, 0.15)',
      headerBorder: 'rgba(255, 255, 255, 0.15)',
      schoolLogoBg: 'rgba(255, 255, 255, 0.15)',
      schoolNameColor: '#e7e5e4',
      labelColor: '#a8a29e',
      valueColor: '#e7e5e4',
      badgeBg: 'rgba(120, 113, 108, 0.25)',
      badgeText: '#f5f5f4',
      badgeBorder: '1.5px solid rgba(120, 113, 108, 0.3)',
      printGlow1: 'rgba(255, 255, 255, 0.05)',
      printGlow2: 'rgba(255, 255, 255, 0.02)'
    }
  }
];

interface RosterViewProps {
  students: Student[];
  schoolName?: string;
  schoolLogoUrl?: string;
  idCardTitle?: string;
  onAddStudent: (id: string, name: string, grade: string) => boolean;
  onDeleteStudent: (studentId: string) => void;
  onAdjustPoints: (studentId: string, amount: number) => void;
  selectedStudentId: string | null;
  onSelectStudent: (studentId: string | null) => void;
  onUpdateStudent: (oldId: string, updatedFields: Partial<Student> & { id?: string }) => boolean;
}

export default function RosterView({
  students,
  schoolName,
  schoolLogoUrl,
  idCardTitle,
  onAddStudent,
  onDeleteStudent,
  onAdjustPoints,
  selectedStudentId,
  onSelectStudent,
  onUpdateStudent
}: RosterViewProps) {
  // Filters and UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('5A');

  // Printing states
  const [showPrintAll, setShowPrintAll] = useState(false);
  const [bulkThemeId, setBulkThemeId] = useState('individual');
  const [bulkPrintColorMode, setBulkPrintColorMode] = useState<'color' | 'bw'>('color');

  const activeStudent = students.find(s => s.id === selectedStudentId) || null;
  const activeThemeId = activeStudent?.cardTheme || 'navy';
  const theme = CARD_THEMES.find(t => t.id === activeThemeId) || CARD_THEMES[0];
  const cardSchoolName = schoolName?.trim() || 'School';
  const cardIdTitle = idCardTitle?.trim() || 'Member ID Card';

  // Local editing states to avoid collisions while typing
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [photoCrop, setPhotoCrop] = useState<{ src: string; zoom: number; offsetX: number; offsetY: number } | null>(null);
  const photoDragStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const cropSize = 288;

  useEffect(() => {
    if (activeStudent) {
      setEditId(activeStudent.id);
      setEditName(activeStudent.name);
      setEditGrade(activeStudent.grade);
    } else {
      setEditId('');
      setEditName('');
      setEditGrade('');
    }
  }, [activeStudent?.id]);

  // File upload helpers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeStudent) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoCrop({ src: reader.result as string, zoom: 1, offsetX: 0, offsetY: 0 });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const saveCroppedPhoto = () => {
    if (!photoCrop || !activeStudent) return;

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext('2d');
      if (!context) return;

      const baseScale = cropSize / Math.min(image.width, image.height);
      const scale = baseScale * photoCrop.zoom * (canvas.width / cropSize);
      const width = image.width * scale;
      const height = image.height * scale;
      const offsetScale = canvas.width / cropSize;
      context.drawImage(
        image,
        (canvas.width - width) / 2 + photoCrop.offsetX * offsetScale,
        (canvas.height - height) / 2 + photoCrop.offsetY * offsetScale,
        width,
        height
      );
      onUpdateStudent(activeStudent.id, { photoUrl: canvas.toDataURL('image/jpeg', 0.88) });
      setPhotoCrop(null);
    };
    image.src = photoCrop.src;
  };

  // Downloading QR Code
  const downloadQRAsImage = async () => {
    if (!activeStudent) return;
    const valueToEncode = activeStudent.qrCodeOption === 'id_and_name' 
      ? `${activeStudent.id} - ${activeStudent.name}` 
      : activeStudent.id;
    try {
      const highResQrUrl = await QRCode.toDataURL(valueToEncode, {
        width: 400, // Very high resolution
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      const link = document.createElement('a');
      link.href = highResQrUrl;
      link.download = `QR_${activeStudent.id}_${activeStudent.name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to generate high-res QR for download:', err);
      alert('Error preparing QR Code download.');
    }
  };

  // Copying QR Code
  const copyQRToClipboard = async () => {
    if (!activeStudent) return;
    const valueToEncode = activeStudent.qrCodeOption === 'id_and_name' 
      ? `${activeStudent.id} - ${activeStudent.name}` 
      : activeStudent.id;
    try {
      const highResQrUrl = await QRCode.toDataURL(valueToEncode, {
        width: 400, // Very high resolution
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      const response = await fetch(highResQrUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      alert('QR Code image successfully copied to clipboard! You can now paste it into any document header/footer.');
    } catch (err) {
      console.error('Failed to copy QR code image:', err);
      alert('Could not copy image automatically. You can right-click the QR Code to copy or download it instead.');
    }
  };

  // Downloading Barcode
  const downloadBarcodeAsImage = async () => {
    if (!activeStudent) return;
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, activeStudent.id, {
        format: 'CODE128',
        width: 4, // Higher resolution bar width
        height: 120, // Tall barcode
        displayValue: true,
        fontSize: 14,
        margin: 10,
        lineColor: '#0f172a',
        background: '#ffffff'
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Barcode_${activeStudent.id}_${activeStudent.name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download barcode:', err);
      alert('Error preparing barcode download.');
    }
  };

  // Copying Barcode
  const copyBarcodeToClipboard = async () => {
    if (!activeStudent) return;
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, activeStudent.id, {
        format: 'CODE128',
        width: 4, // Higher resolution bar width
        height: 120, // Tall barcode
        displayValue: true,
        fontSize: 14,
        margin: 10,
        lineColor: '#0f172a',
        background: '#ffffff'
      });
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            alert('Barcode image successfully copied to clipboard! You can now paste it into any document.');
          } catch (err) {
            console.error('Clipboard write failed:', err);
            alert('Copying failed. Try right-clicking to copy or download as image.');
          }
        }
      }, 'image/png');
    } catch (err) {
      console.error('Failed to copy barcode:', err);
      alert('Copying barcode image failed.');
    }
  };

  // Auto-generate student ID based on existing count
  const handleAutoFillId = () => {
    const nextNum = 1001 + students.length;
    setNewStudentId(`STU${nextNum}`);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    let idToUse = newStudentId.trim().toUpperCase();
    if (!idToUse) {
      idToUse = `STU${1001 + students.length}`;
    }

    const success = onAddStudent(idToUse, newStudentName, newStudentGrade);
    if (success) {
      setNewStudentName('');
      setNewStudentId('');
      setShowAddForm(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const triggerPrint = () => {
    window.print();
  };

  // Helper to get a consistent avatar accent color for student name initials
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-600 text-white',
      'bg-emerald-600 text-white',
      'bg-amber-600 text-white',
      'bg-rose-600 text-white',
      'bg-teal-600 text-white',
      'bg-violet-600 text-white',
      'bg-cyan-600 text-white',
      'bg-sky-600 text-white'
    ];
    const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Roster & Member Cards</h2>
          <p className="text-xs text-slate-500 font-medium">Manage student accounts, track economy points, and print barcode member IDs</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-blue-100 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <UserPlus className="w-4 h-4" />
            {showAddForm ? 'Hide Form' : 'Add Student'}
          </button>
          
          <button
            onClick={() => setShowPrintAll(true)}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold py-2.5 px-4 rounded-xl text-xs shadow-sm transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print All ID Cards
          </button>
        </div>
      </div>

      {/* Onboarding Drawer/Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateStudent}
          className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm space-y-4 max-w-2xl"
        >
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
            <UserPlus className="w-4 h-4 text-blue-500" /> Onboard New Student
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Student Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Liam Johnson"
                value={newStudentName}
                onChange={e => setNewStudentName(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800"
              />
            </div>

            {/* Custom Student ID */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Student ID</label>
                <button
                  type="button"
                  onClick={handleAutoFillId}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Auto-Fill ID
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. STU1011"
                value={newStudentId}
                onChange={e => setNewStudentId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-mono font-bold"
              />
            </div>

            {/* Class Grade */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Class / Grade</label>
              <input
                type="text"
                placeholder="e.g. 5A"
                value={newStudentGrade}
                onChange={e => setNewStudentGrade(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewStudentName('');
                setNewStudentId('');
              }}
              className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-xl text-xs shadow-md shadow-blue-100 transition-all cursor-pointer"
            >
              Confirm Onboard
            </button>
          </div>
        </form>
      )}

      {/* Roster Table Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Roster List (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/85 shadow-sm rounded-3xl overflow-hidden flex flex-col">
          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, ID, or grade..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider bg-slate-100/80 px-2.5 py-1 rounded-lg">
              {filteredStudents.length} Students found
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-700">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-5">Student Details</th>
                  <th className="py-3 px-4 font-mono">Student ID</th>
                  <th className="py-3 px-4 text-center">Grade</th>
                  <th className="py-3 px-4 text-center">Points</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <IdCard className="w-8 h-8 opacity-40 mx-auto mb-2" />
                      No students matches search or roster is empty.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const initials = s.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2);
                    const isActive = s.id === selectedStudentId;

                    return (
                      <tr
                        key={s.id}
                        className={`hover:bg-slate-50/50 transition-colors ${
                          isActive ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        {/* Name Column */}
                        <td className="py-3 px-5 flex items-center gap-3">
                          {s.photoUrl ? (
                            <img src={s.photoUrl} className="w-8.5 h-8.5 rounded-full object-cover shrink-0 shadow-sm" alt={`${s.name} avatar`} />
                          ) : (
                            <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${getAvatarColor(s.name)}`}>
                              {initials}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-slate-800 block text-xs hover:text-blue-600 cursor-pointer" onClick={() => onSelectStudent(s.id)}>
                              {s.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{cardSchoolName} Student</span>
                          </div>
                        </td>

                        {/* ID Column */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-500 text-xs">{s.id}</td>

                        {/* Grade Column */}
                        <td className="py-3 px-4 text-center text-xs font-semibold text-slate-600">{s.grade}</td>

                        {/* Points Column */}
                        <td className="py-3 px-4 text-center">
                          <span className="bg-amber-50 text-amber-800 border border-amber-100 py-1 px-2.5 rounded-lg text-xs font-bold shadow-sm inline-block min-w-[50px]">
                            {s.points} <span className="text-[9px] font-medium text-amber-500">pts</span>
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td className="py-3 px-5 text-right flex items-center justify-end gap-1.5 h-full mt-1.5">
                          <button
                            onClick={() => onAdjustPoints(s.id, 10)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-1.5 rounded-lg border border-emerald-100/30 shadow-sm hover:scale-105 transition-all cursor-pointer"
                            title="Add 10 economy points"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onAdjustPoints(s.id, -10)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-700 p-1.5 rounded-lg border border-amber-100/30 shadow-sm hover:scale-105 transition-all cursor-pointer"
                            title="Deduct 10 economy points"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectStudent(s.id)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-1.5 rounded-lg border border-blue-100/30 shadow-sm hover:scale-105 transition-all cursor-pointer"
                            title="View / Print Badge Card"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteStudent(s.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-lg border border-rose-100/30 shadow-sm hover:scale-105 transition-all cursor-pointer"
                            title="Remove student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Student Card Panel (1 Col) */}
        <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-sm space-y-5">
          {activeStudent ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <CreditCard className="w-4.5 h-4.5 text-blue-500" /> Member Badge Card
                </h3>
                <button
                  onClick={() => onSelectStudent(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  Clear
                </button>
              </div>

              {/* The Physical Card Rendering (Interactive mockup) */}
              <div
                id="interactive-member-card"
                className={`w-full aspect-[1.58/1] ${theme.bgClasses} border ${theme.borderClasses} text-white rounded-2xl p-4.5 shadow-xl relative flex flex-col justify-between overflow-hidden transition-all duration-300`}
              >
                {/* Background vector accents */}
                <div className={`absolute right-0 bottom-0 w-28 h-28 ${theme.glow1} rounded-full blur-2xl pointer-events-none`} />
                <div className={`absolute left-6 top-6 w-10 h-10 ${theme.glow2} rounded-full blur-lg pointer-events-none`} />

                {/* Header branding */}
                <div className="flex items-center gap-2 border-b border-white/10 pb-2 relative z-10">
                  {schoolLogoUrl ? (
                    <img src={schoolLogoUrl} className={`w-5 h-5 object-contain rounded ${theme.logoBgColor} p-0.5`} alt="school logo" />
                  ) : (
                    <School className={`w-4.5 h-4.5 ${theme.accentSvgColor}`} />
                  )}
                  <div className="leading-none">
                    <span className={`text-[9px] uppercase tracking-wider font-extrabold ${theme.accentTextColor} block truncate max-w-[130px]`}>
                      {cardSchoolName}
                    </span>
                    <span className="text-[7px] text-slate-400 block mt-0.5">Grade Badge ID Panel</span>
                  </div>
                  <div className={`max-w-[96px] truncate text-[8px] font-extrabold px-1.5 py-0.5 rounded-md ml-auto border ${theme.badgeBgColor}`} title={cardIdTitle}>
                    {cardIdTitle}
                  </div>
                </div>

                {/* Main section: profile avatar & names */}
                <div className="flex items-start gap-3 mt-1.5 flex-1 relative z-10">
                  {/* Photo or Initials */}
                  {activeStudent.photoUrl ? (
                    <img src={activeStudent.photoUrl} className="w-11 h-11 rounded-full object-cover shadow-md shrink-0 border border-white/10" alt={`${activeStudent.name} avatar`} />
                  ) : (
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-md ${getAvatarColor(editName !== undefined ? editName : activeStudent.name)}`}>
                      {(editName !== undefined ? editName : activeStudent.name)
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                  )}
                  {/* Text details */}
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="text-sm font-extrabold truncate block text-white leading-tight">
                      {editName !== undefined ? editName : activeStudent.name}
                    </span>
                    <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider block">
                      ID: <span className={`font-mono font-bold ${theme.accentTextColor}`}>{editId !== undefined ? editId : activeStudent.id}</span>
                    </span>
                    <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider block">
                      Grade: <span className="font-bold text-white">{editGrade !== undefined ? editGrade : activeStudent.grade}</span>
                    </span>
                  </div>
                </div>

                {/* Codes segment depending on choice */}
                <div className="flex items-end justify-between gap-2 pt-2 border-t border-white/5 mt-auto min-h-[40px] relative z-10">
                  {/* 1D Barcode */}
                  {(activeStudent.barcodeOption === 'both' || activeStudent.barcodeOption === 'barcode_only' || !activeStudent.barcodeOption) && (
                    <div className="flex-1 max-w-[155px]">
                      <Barcode value={editId !== undefined ? editId : activeStudent.id} displayValue={false} height={20} width={1.2} />
                    </div>
                  )}
                  {/* 2D QR Code */}
                  {(activeStudent.barcodeOption === 'both' || activeStudent.barcodeOption === 'qr_only' || !activeStudent.barcodeOption) && (
                    <div className="shrink-0">
                      <QRCodeImage 
                        value={activeStudent.qrCodeOption === 'id_and_name' ? `${editId !== undefined ? editId : activeStudent.id} - ${editName !== undefined ? editName : activeStudent.name}` : (editId !== undefined ? editId : activeStudent.id)} 
                        size={40} 
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions and Actions */}
              <div className="space-y-4 pt-1">
                <button
                  onClick={() => {
                    // Prepares print container for individual card
                    const element = document.getElementById('print-area-wrapper');
                    if (element) {
                      const printColor = activeStudent.printColorMode === 'color';
                      const cardBackground = printColor ? theme.printBg : '#ffffff';
                      const cardTextColor = printColor ? theme.printText : '#0f172a';
                      const cardBorder = printColor ? theme.printStyles.border : '3px solid #0f172a';
                      const headerBorderColor = printColor ? theme.printStyles.headerBorder : '#0f172a';
                      const schoolNameColorStyle = printColor ? `color: ${theme.printStyles.schoolNameColor};` : 'color: #0f172a;';
                      const labelColorStyle = printColor ? `color: ${theme.printStyles.labelColor};` : 'color: #64748b;';
                      const nameColorStyle = printColor ? `color: ${theme.printText};` : 'color: #0f172a;';
                      const badgeBgStyle = printColor 
                        ? `background: ${theme.printStyles.badgeBg}; border: ${theme.printStyles.badgeBorder}; color: ${theme.printStyles.badgeText};` 
                        : 'background: #f8fafc; border: 1.5px solid #0f172a; color: #0f172a;';
                      const borderTopStyle = printColor ? `border-top: 1.5px dashed ${theme.printStyles.headerBorder};` : 'border-top: 1.5px dashed #0f172a;';

                      const glowsHtml = printColor 
                        ? `<div style="position: absolute; right: 0; bottom: 0; width: 140px; height: 140px; background: ${theme.printStyles.printGlow1}; border-radius: 50%; filter: blur(30px); pointer-events: none;"></div>
                           <div style="position: absolute; left: 20px; top: 20px; width: 60px; height: 60px; background: ${theme.printStyles.printGlow2}; border-radius: 50%; filter: blur(15px); pointer-events: none;"></div>`
                        : '';

                      const schoolLogoHtml = schoolLogoUrl
                        ? `<img src="${schoolLogoUrl}" style="width: 22px; height: 22px; object-fit: contain; border-radius: 4px; ${printColor ? `background: ${theme.printStyles.schoolLogoBg};` : 'background: rgba(0,0,0,0.05);'} padding: 2px;" />`
                        : `<div style="width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; background: #2563eb; border-radius: 4px; color: white;"><svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg></div>`;

                      const photoHtml = activeStudent.photoUrl
                        ? `<img src="${activeStudent.photoUrl}" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 1.5px solid ${printColor ? 'rgba(255,255,255,0.15)' : '#0f172a'};" />`
                        : `<div style="width: 44px; height: 44px; border-radius: 8px; background: #2563eb; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; font-family: sans-serif;">${activeStudent.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>`;

                      const barcodeHtml = (activeStudent.barcodeOption === 'both' || activeStudent.barcodeOption === 'barcode_only' || !activeStudent.barcodeOption)
                        ? `<div id="print-bc-container" style="flex: 1; max-width: 170px; ${printColor ? 'background: #ffffff; border-radius: 8px; padding: 4px; display: flex; align-items: center; justify-content: center; box-sizing: border-box;' : ''}"></div>`
                        : ``;

                      const qrHtml = (activeStudent.barcodeOption === 'both' || activeStudent.barcodeOption === 'qr_only' || !activeStudent.barcodeOption)
                        ? `<div id="print-qr-container" style="width: 50px; height: 50px; ${printColor ? 'background: #ffffff; border-radius: 8px; padding: 2px; display: flex; align-items: center; justify-content: center; box-sizing: border-box;' : ''}"></div>`
                        : ``;

                      element.innerHTML = `
                        <div class="print-card-single" style="padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff;">
                          <div style="font-family: system-ui, -apple-system, sans-serif; border: ${cardBorder}; border-radius: 18px; padding: 16px; width: 335px; height: 215px; background: ${cardBackground}; color: ${cardTextColor}; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; position: relative; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
                            ${glowsHtml}
                            <div style="display: flex; align-items: center; gap: 8px; border-bottom: 2px solid ${headerBorderColor}; padding-bottom: 8px; margin-bottom: 6px; position: relative; z-index: 1;">
                              ${schoolLogoHtml}
                              <div style="line-height: 1.1;">
                                <div style="font-weight: 900; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; ${schoolNameColorStyle}">${cardSchoolName}</div>
                                <div style="font-size: 7px; ${labelColorStyle} font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Student Member ID</div>
                              </div>
                              <div style="font-size: 9px; font-weight: 900; ${badgeBgStyle} padding: 2px 6px; border-radius: 6px; margin-left: auto; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${cardIdTitle}
                              </div>
                            </div>
                            
                            <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 6px; position: relative; z-index: 1;">
                              ${photoHtml}
                              <div style="line-height: 1.2;">
                                <div style="font-weight: 800; font-size: 14px; ${nameColorStyle}">${activeStudent.name}</div>
                                <div style="font-size: 10px; ${printColor ? `color: ${theme.printStyles.labelColor}` : 'color: #475569'}; font-family: monospace; font-weight: bold; margin-top: 2px;">
                                  ID: <span style="${printColor ? `color: ${theme.printStyles.valueColor}` : ''}">${activeStudent.id}</span>
                                </div>
                              </div>
                            </div>

                            <div style="display: flex; align-items: flex-end; justify-content: space-between; margin-top: auto; ${borderTopStyle} padding-top: 8px; min-height: 40px; gap: 12px; position: relative; z-index: 1;">
                              ${barcodeHtml}
                              ${qrHtml}
                            </div>
                          </div>
                        </div>
                      `;
                      
                      // Generate Barcode directly in print container (high quality)
                      const printBcContainer = document.getElementById('print-bc-container');
                      if (printBcContainer) {
                        try {
                           const bcSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                           bcSvg.setAttribute('class', 'barcode-svg mx-auto');
                           bcSvg.style.width = '100%';
                           bcSvg.style.height = '40px';
                           printBcContainer.appendChild(bcSvg);
                           JsBarcode(bcSvg, editId !== undefined ? editId : activeStudent.id, {
                             format: 'CODE128',
                             width: 1.5,
                             height: 40,
                             displayValue: false,
                             margin: 0,
                             lineColor: '#000000',
                             background: 'transparent'
                           });
                        } catch (err) {
                          console.error('Failed to generate print barcode:', err);
                        }
                      }
 
                      // Generate QR directly in print container (high quality)
                      const printQrContainer = document.getElementById('print-qr-container');
                      if (printQrContainer) {
                        const qrVal = activeStudent.qrCodeOption === 'id_and_name' 
                          ? `${editId !== undefined ? editId : activeStudent.id} - ${editName !== undefined ? editName : activeStudent.name}` 
                          : (editId !== undefined ? editId : activeStudent.id);
                        QRCode.toDataURL(qrVal, {
                          width: 150,
                          margin: 1,
                          color: {
                            dark: '#000000',
                            light: '#ffffff'
                          }
                        }).then((dataUrl) => {
                          const img = document.createElement('img');
                          img.src = dataUrl;
                          img.style.width = '50px';
                          img.style.height = '50px';
                          printQrContainer.appendChild(img);
                        }).catch((err) => {
                          console.error('Failed to generate print QR:', err);
                        });
                      }
 
                      const handleAfterPrint = () => {
                        element.innerHTML = '';
                        window.removeEventListener('afterprint', handleAfterPrint);
                      };
                      window.addEventListener('afterprint', handleAfterPrint);

                      setTimeout(() => {
                        window.focus();
                        window.print();
                      }, 250);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-slate-100"
                >
                  <Printer className="w-4 h-4 text-slate-300" />
                  Print Selected Card
                </button>
              </div>

              {/* Customizable Live Editor Settings Tray */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Live Customization Tray
                </span>

                <div className="space-y-3.5 text-xs text-slate-600 bg-slate-50/50 p-4.5 rounded-2xl border border-slate-100/80">
                  {/* Row 1: Student Name & Class Grade */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => {
                          setEditName(e.target.value);
                          onUpdateStudent(activeStudent.id, { name: e.target.value });
                        }}
                        className="w-full bg-white border border-slate-200 py-1.5 px-2.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Class Grade</label>
                      <input
                        type="text"
                        value={editGrade}
                        onChange={(e) => {
                          setEditGrade(e.target.value);
                          onUpdateStudent(activeStudent.id, { grade: e.target.value });
                        }}
                        className="w-full bg-white border border-slate-200 py-1.5 px-2.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Row 2: User ID */}
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">User ID</label>
                        {editId !== activeStudent.id && (
                          <button
                            onClick={() => {
                              if (!editId.trim()) return;
                              // Check if ID is already taken
                              if (students.some(s => s.id === editId.trim() && s.id !== activeStudent.id)) {
                                alert('This User ID is already assigned to another student!');
                                return;
                              }
                              onUpdateStudent(activeStudent.id, { id: editId.trim() });
                            }}
                            className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5 hover:underline"
                          >
                            <Check className="w-2.5 h-2.5" /> Commit
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={editId}
                        onChange={(e) => setEditId(e.target.value)}
                        placeholder="e.g. STU1001"
                        className={`w-full bg-white border py-1.5 px-2.5 rounded-xl text-xs font-mono font-bold text-slate-700 focus:outline-none ${editId !== activeStudent.id ? 'border-emerald-300 bg-emerald-50/10 animate-pulse' : 'border-slate-200 focus:border-blue-500'}`}
                      />
                    </div>
                  </div>

                  {/* Row 3: Student Photo */}
                  <div className="grid grid-cols-1 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Student Photo</label>
                      <div className="flex items-center gap-1.5">
                        <label className="flex-1 flex items-center justify-center gap-1 border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold py-1.5 px-2 rounded-xl cursor-pointer shadow-sm text-slate-600 transition-colors">
                          <Upload className="w-3 h-3 text-slate-400" /> Choose & Crop
                          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        </label>
                        {activeStudent.photoUrl && (
                          <button
                            onClick={() => onUpdateStudent(activeStudent.id, { photoUrl: undefined })}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-sm"
                            title="Remove Photo"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Row 4: Barcode / QR Selection & QR content options */}
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100/70">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Code Layout</label>
                      <select
                        value={activeStudent.barcodeOption || 'both'}
                        onChange={(e) => onUpdateStudent(activeStudent.id, { barcodeOption: e.target.value as any })}
                        className="w-full bg-white border border-slate-200 py-1.5 px-2 rounded-xl text-[10px] font-bold text-slate-700 focus:outline-none"
                      >
                        <option value="both">Both Barcode & QR</option>
                        <option value="barcode_only">Barcode Only</option>
                        <option value="qr_only">QR Code Only</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">QR Code Data</label>
                      <select
                        value={activeStudent.qrCodeOption || 'id_only'}
                        onChange={(e) => onUpdateStudent(activeStudent.id, { qrCodeOption: e.target.value as any })}
                        className="w-full bg-white border border-slate-200 py-1.5 px-2 rounded-xl text-[10px] font-bold text-slate-700 focus:outline-none"
                        disabled={activeStudent.barcodeOption === 'barcode_only'}
                      >
                        <option value="id_only">Student ID Only</option>
                        <option value="id_and_name">ID & Full Name</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 5: Card Custom Themes & Print Version Mode */}
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100/70">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Card Color Theme</label>
                      <select
                        value={activeStudent.cardTheme || 'navy'}
                        onChange={(e) => onUpdateStudent(activeStudent.id, { cardTheme: e.target.value })}
                        className="w-full bg-white border border-slate-200 py-1.5 px-2 rounded-xl text-[10px] font-bold text-slate-700 focus:outline-none"
                      >
                        {CARD_THEMES.map((themeOption) => (
                          <option key={themeOption.id} value={themeOption.id}>
                            {themeOption.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Print Version Mode</label>
                      <select
                        value={activeStudent.printColorMode || 'bw'}
                        onChange={(e) => onUpdateStudent(activeStudent.id, { printColorMode: e.target.value as any })}
                        className="w-full bg-white border border-slate-200 py-1.5 px-2 rounded-xl text-[10px] font-bold text-slate-700 focus:outline-none"
                      >
                        <option value="bw">Ink-Saver B&W</option>
                        <option value="color">Prestige Full-Color</option>
                      </select>
                    </div>
                  </div>

                  {/* Standalone Save / Copy Tools (Document header-footer ready!) */}
                  <div className="pt-2.5 border-t border-slate-150 space-y-2">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider pl-0.5">
                      Save & Copy Standalone Codes
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Barcode section */}
                      {(activeStudent.barcodeOption === 'both' || activeStudent.barcodeOption === 'barcode_only' || !activeStudent.barcodeOption) && (
                        <div className="space-y-1 border border-slate-200/50 rounded-xl p-2 bg-white/70">
                          <span className="text-[8px] font-extrabold text-slate-500 block uppercase tracking-wide text-center">Barcode</span>
                          <div className="flex gap-1">
                            <button
                              onClick={copyBarcodeToClipboard}
                              className="flex-1 flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold py-1 rounded-lg text-slate-700 cursor-pointer shadow-sm transition-all"
                            >
                              <Copy className="w-2.5 h-2.5 text-slate-500" /> Copy
                            </button>
                            <button
                              onClick={downloadBarcodeAsImage}
                              className="flex-1 flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold py-1 rounded-lg text-slate-700 cursor-pointer shadow-sm transition-all"
                            >
                              <Download className="w-2.5 h-2.5 text-slate-500" /> Save
                            </button>
                          </div>
                        </div>
                      )}

                      {/* QR Code section */}
                      {(activeStudent.barcodeOption === 'both' || activeStudent.barcodeOption === 'qr_only' || !activeStudent.barcodeOption) && (
                        <div className="space-y-1 border border-slate-200/50 rounded-xl p-2 bg-white/70">
                          <span className="text-[8px] font-extrabold text-slate-500 block uppercase tracking-wide text-center">QR Code</span>
                          <div className="flex gap-1">
                            <button
                              onClick={copyQRToClipboard}
                              className="flex-1 flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold py-1 rounded-lg text-slate-700 cursor-pointer shadow-sm transition-all"
                            >
                              <Copy className="w-2.5 h-2.5 text-slate-500" /> Copy
                            </button>
                            <button
                              onClick={downloadQRAsImage}
                              className="flex-1 flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold py-1 rounded-lg text-slate-700 cursor-pointer shadow-sm transition-all"
                            >
                              <Download className="w-2.5 h-2.5 text-slate-500" /> Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center space-y-2">
              <IdCard className="w-10 h-10 opacity-30" />
              <div>
                <p className="font-semibold text-slate-600 text-xs">No Student Selected</p>
                <p className="text-[10px] max-w-[200px] mt-1 text-slate-400">
                  Select a student from the roster list on the left to generate their physical barcode card.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Batch Print All Cards Overlay Modal */}
      {showPrintAll && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Roster Card Sheets</h3>
                  <p className="text-xs text-slate-500 font-medium">Batch printing system for all {students.length} students</p>
                </div>
              </div>

              {/* Sheet Customizer Controls */}
              <div className="flex items-center gap-3 self-start md:self-auto">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Sheet Theme</label>
                  <select
                    value={bulkThemeId}
                    onChange={(e) => setBulkThemeId(e.target.value)}
                    className="bg-white border border-slate-200 py-1.5 px-2.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="individual">Use Student Theme</option>
                    {CARD_THEMES.map((themeOption) => (
                      <option key={themeOption.id} value={themeOption.id}>
                        {themeOption.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Sheet Print Style</label>
                  <select
                    value={bulkPrintColorMode}
                    onChange={(e) => setBulkPrintColorMode(e.target.value as any)}
                    className="bg-white border border-slate-200 py-1.5 px-2.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="bw">Ink-Saver B&W</option>
                    <option value="color">Prestige Full-Color</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setShowPrintAll(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 shadow-sm rounded-xl self-end md:self-auto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Print Grid Preview */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100/50">
              <div className="bg-white border border-slate-200/60 p-8 shadow-inner rounded-2xl max-w-[800px] mx-auto">
                <div className="text-center mb-6 border-b border-dashed border-slate-200 pb-4">
                  <h4 className="font-extrabold text-blue-700 uppercase tracking-widest text-xs">{cardSchoolName}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1"> Roster Card Sheet - Grade 5A</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="bulk-card-print-target">
                  {students.map((student) => {
                    const qrVal = student.qrCodeOption === 'id_and_name' 
                      ? `${student.id} - ${student.name}` 
                      : student.id;

                    const studentThemeId = bulkThemeId === 'individual' ? (student.cardTheme || 'navy') : bulkThemeId;
                    const studentTheme = CARD_THEMES.find(t => t.id === studentThemeId) || CARD_THEMES[0];
                    const isColorStyle = bulkPrintColorMode === 'color';

                    return (
                      <div
                        key={student.id}
                        className={`border rounded-2xl p-4 flex flex-col justify-between aspect-[1.58/1] h-[180px] box-border relative overflow-hidden shadow-sm transition-all duration-300 ${
                          isColorStyle 
                            ? `${studentTheme.bgClasses} ${studentTheme.borderClasses} text-white` 
                            : 'bg-white border-2 border-slate-200 text-slate-900'
                        }`}
                      >
                        {/* Glow spots in preview */}
                        {isColorStyle && (
                          <>
                            <div className={`absolute right-0 bottom-0 w-24 h-24 ${studentTheme.glow1} rounded-full blur-2xl pointer-events-none`} />
                            <div className={`absolute left-4 top-4 w-8 h-8 ${studentTheme.glow2} rounded-full blur-lg pointer-events-none`} />
                          </>
                        )}

                        <div className={`flex items-center gap-1.5 border-b pb-1.5 relative z-10 ${isColorStyle ? 'border-white/10' : 'border-slate-100'}`}>
                          {schoolLogoUrl ? (
                            <img src={schoolLogoUrl} className={`w-4 h-4 object-contain rounded ${isColorStyle ? studentTheme.logoBgColor : 'bg-slate-100 p-0.5'}`} alt="school logo" />
                          ) : (
                            <School className={`w-3.5 h-3.5 ${isColorStyle ? studentTheme.accentSvgColor : 'text-blue-500'}`} />
                          )}
                          <span className={`text-[8px] uppercase tracking-wider font-extrabold truncate max-w-[130px] ${isColorStyle ? studentTheme.accentTextColor : 'text-blue-600'}`}>
                            {cardSchoolName}
                          </span>
                          <span className={`max-w-[96px] truncate text-[8px] font-bold px-1.5 py-0.5 rounded ml-auto border ${isColorStyle ? studentTheme.badgeBgColor : 'bg-slate-50 border-slate-200 text-slate-600'}`} title={cardIdTitle}>
                            {cardIdTitle}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 my-2 flex-1 relative z-10">
                          {student.photoUrl ? (
                            <img src={student.photoUrl} className={`w-10 h-10 rounded-full object-cover shrink-0 border ${isColorStyle ? 'border-white/10' : 'border-slate-100'}`} alt={`${student.name} avatar`} />
                          ) : (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${getAvatarColor(student.name)}`}>
                              {student.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                            </div>
                          )}
                          <div>
                            <span className={`text-xs font-bold block leading-tight ${isColorStyle ? 'text-white' : 'text-slate-900'}`}>{student.name}</span>
                            <span className={`text-[9px] font-mono font-bold mt-0.5 block ${isColorStyle ? studentTheme.accentTextColor : 'text-slate-500'}`}>ID: {student.id}</span>
                          </div>
                        </div>

                        <div className={`flex items-end justify-between gap-3 pt-2 border-t mt-auto min-h-[32px] relative z-10 ${isColorStyle ? 'border-white/5' : 'border-dashed border-slate-100'}`}>
                          {(student.barcodeOption === 'both' || student.barcodeOption === 'barcode_only' || !student.barcodeOption) && (
                            <div className="flex-1 max-w-[130px]" id={`bulk-bc-wrap-${student.id}`}>
                              <Barcode value={student.id} displayValue={false} height={20} width={1.1} />
                            </div>
                          )}
                          {(student.barcodeOption === 'both' || student.barcodeOption === 'qr_only' || !student.barcodeOption) && (
                            <div id={`bulk-qr-wrap-${student.id}`}>
                              <QRCodeImage value={qrVal} size={32} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-[11px] text-slate-400 font-semibold">
                🚨 Direct Tip: Set print layout margins to "None" for pixel-perfect card borders.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPrintAll(false)}
                  className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer border border-slate-200 bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Write HTML template directly to print area
                    const element = document.getElementById('print-area-wrapper');
                    if (element) {
                      const printHtml = students.map((student) => {
                        const initials = student.name.split(' ').map(n=>n[0]).join('').slice(0,2);
                        const studentThemeId = bulkThemeId === 'individual' ? (student.cardTheme || 'navy') : bulkThemeId;
                        const studentTheme = CARD_THEMES.find(t => t.id === studentThemeId) || CARD_THEMES[0];
                        const isColorStyle = bulkPrintColorMode === 'color';

                        const schoolLogoHtml = schoolLogoUrl
                          ? `<img src="${schoolLogoUrl}" style="width: 22px; height: 22px; object-fit: contain; border-radius: 4px; ${isColorStyle ? `background: ${studentTheme.printStyles.schoolLogoBg};` : 'background: rgba(0,0,0,0.05);'} padding: 2px;" />`
                          : `<div style="width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; background: #2563eb; border-radius: 4px; color: white;"><svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg></div>`;

                        const photoHtml = student.photoUrl
                          ? `<img src="${student.photoUrl}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 1.5px solid ${isColorStyle ? 'rgba(255,255,255,0.15)' : '#0f172a'};" />`
                          : `<div style="width: 44px; height: 44px; border-radius: 50%; background: #2563eb; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; font-family: sans-serif;">${initials}</div>`;

                        const barcodeHtml = (student.barcodeOption === 'both' || student.barcodeOption === 'barcode_only' || !student.barcodeOption)
                          ? `<div id="bulk-print-bc-${student.id}" style="flex: 1; max-width: 170px; ${isColorStyle ? 'background: #ffffff; border-radius: 8px; padding: 4px; display: flex; align-items: center; justify-content: center; box-sizing: border-box;' : ''}"></div>`
                          : ``;

                        const qrHtml = (student.barcodeOption === 'both' || student.barcodeOption === 'qr_only' || !student.barcodeOption)
                          ? `<div id="bulk-print-qr-${student.id}" style="width: 50px; height: 50px; ${isColorStyle ? 'background: #ffffff; border-radius: 8px; padding: 2px; display: flex; align-items: center; justify-content: center; box-sizing: border-box;' : ''}"></div>`
                          : ``;

                        const cardBackground = isColorStyle ? studentTheme.printBg : '#ffffff';
                        const cardTextColor = isColorStyle ? studentTheme.printText : '#0f172a';
                        const cardBorder = isColorStyle ? studentTheme.printStyles.border : '3px solid #0f172a';
                        const headerBorderColor = isColorStyle ? studentTheme.printStyles.headerBorder : '#0f172a';
                        const schoolNameColorStyle = isColorStyle ? `color: ${studentTheme.printStyles.schoolNameColor};` : 'color: #0f172a;';
                        const labelColorStyle = isColorStyle ? `color: ${studentTheme.printStyles.labelColor};` : 'color: #64748b;';
                        const nameColorStyle = isColorStyle ? `color: ${studentTheme.printText};` : 'color: #0f172a;';
                        const badgeBgStyle = isColorStyle ? `background: ${studentTheme.printStyles.badgeBg}; border: ${studentTheme.printStyles.badgeBorder}; color: ${studentTheme.printStyles.badgeText};` : 'background: #f8fafc; border: 1.5px solid #0f172a; color: #0f172a;';
                        const borderTopStyle = isColorStyle ? `border-top: 1.5px dashed ${studentTheme.printStyles.headerBorder};` : 'border-top: 1.5px dashed #0f172a;';

                        const glowsHtml = isColorStyle 
                          ? `<div style="position: absolute; right: 0; bottom: 0; width: 140px; height: 140px; background: ${studentTheme.printStyles.printGlow1}; border-radius: 50%; filter: blur(30px); pointer-events: none;"></div>
                             <div style="position: absolute; left: 20px; top: 20px; width: 60px; height: 60px; background: ${studentTheme.printStyles.printGlow2}; border-radius: 50%; filter: blur(15px); pointer-events: none;"></div>`
                          : '';

                        return `
                          <div style="font-family: system-ui, -apple-system, sans-serif; border: ${cardBorder}; border-radius: 18px; padding: 16px; width: 335px; height: 215px; background: ${cardBackground}; color: ${cardTextColor}; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; page-break-inside: avoid; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); position: relative; overflow: hidden;">
                            ${glowsHtml}
                            <div style="display: flex; align-items: center; gap: 8px; border-bottom: 2px solid ${headerBorderColor}; padding-bottom: 8px; margin-bottom: 6px; position: relative; z-index: 1;">
                              ${schoolLogoHtml}
                              <div style="line-height: 1.1;">
                                <div style="font-weight: 900; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; ${schoolNameColorStyle}">${cardSchoolName}</div>
                                <div style="font-size: 7px; ${labelColorStyle} font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Student Member ID</div>
                              </div>
                              <div style="font-size: 9px; font-weight: 900; ${badgeBgStyle} padding: 2px 6px; border-radius: 6px; margin-left: auto; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${cardIdTitle}
                              </div>
                            </div>
                            
                            <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 6px; position: relative; z-index: 1;">
                              ${photoHtml}
                              <div style="line-height: 1.2;">
                                <div style="font-weight: 800; font-size: 14px; ${nameColorStyle}">${student.name}</div>
                                <div style="font-size: 10px; ${isColorStyle ? `color: ${studentTheme.printStyles.labelColor}` : 'color: #475569'}; font-family: monospace; font-weight: bold; margin-top: 2px;">
                                  ID: <span style="${isColorStyle ? `color: ${studentTheme.printStyles.valueColor};` : ''}">${student.id}</span>
                                </div>
                              </div>
                            </div>

                            <div style="display: flex; align-items: flex-end; justify-content: space-between; margin-top: auto; ${borderTopStyle} padding-top: 8px; min-height: 40px; gap: 12px; position: relative; z-index: 1;">
                              ${barcodeHtml}
                              ${qrHtml}
                            </div>
                          </div>
                        `;
                      }).join('');

                      element.innerHTML = `
                        <div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; padding: 20px; background: #fff; min-height: 100vh;">
                          ${printHtml}
                        </div>
                      `;

                      // Generate barcodes and QRs directly (high quality)
                      students.forEach((student) => {
                        const bcContainer = document.getElementById(`bulk-print-bc-${student.id}`);
                        if (bcContainer) {
                          try {
                            const bcSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                            bcSvg.setAttribute('class', 'barcode-svg mx-auto');
                            bcSvg.style.width = '100%';
                            bcSvg.style.height = '40px';
                            bcContainer.appendChild(bcSvg);
                            JsBarcode(bcSvg, student.id, {
                              format: 'CODE128',
                              width: 1.5,
                              height: 40,
                              displayValue: false,
                              margin: 0,
                              lineColor: '#000000',
                              background: 'transparent'
                            });
                          } catch (err) {
                            console.error('Failed to generate bulk print barcode:', err);
                          }
                        }

                        const qrContainer = document.getElementById(`bulk-print-qr-${student.id}`);
                        if (qrContainer) {
                          const qrVal = student.qrCodeOption === 'id_and_name' 
                            ? `${student.id} - ${student.name}` 
                            : student.id;
                          QRCode.toDataURL(qrVal, {
                            width: 150,
                            margin: 1,
                            color: {
                              dark: '#000000',
                              light: '#ffffff'
                            }
                          }).then((dataUrl) => {
                            const img = document.createElement('img');
                            img.src = dataUrl;
                            img.style.width = '50px';
                            img.style.height = '50px';
                            qrContainer.appendChild(img);
                          }).catch((err) => {
                            console.error('Failed to generate bulk print QR:', err);
                          });
                        }
                      });

                      const handleAfterPrint = () => {
                        element.innerHTML = '';
                        window.removeEventListener('afterprint', handleAfterPrint);
                      };
                      window.addEventListener('afterprint', handleAfterPrint);

                      setTimeout(() => {
                        window.focus();
                        window.print();
                      }, 250);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-xl text-xs shadow-md shadow-blue-100 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-white" />
                  Print Sheet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {photoCrop && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="photo-crop-title">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 id="photo-crop-title" className="text-sm font-bold text-slate-900">Center Student Photo</h3>
                <p className="mt-1 text-xs text-slate-500">Drag to place the face in the circle, then adjust the zoom.</p>
              </div>
              <button onClick={() => setPhotoCrop(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Cancel photo crop">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              <div
                className="relative mx-auto overflow-hidden rounded-full bg-slate-100 shadow-inner touch-none cursor-move"
                style={{ width: cropSize, height: cropSize }}
                onPointerDown={(event) => {
                  photoDragStart.current = { x: event.clientX, y: event.clientY, offsetX: photoCrop.offsetX, offsetY: photoCrop.offsetY };
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (!photoDragStart.current) return;
                  const start = photoDragStart.current;
                  setPhotoCrop((current) => current && {
                    ...current,
                    offsetX: start.offsetX + event.clientX - start.x,
                    offsetY: start.offsetY + event.clientY - start.y
                  });
                }}
                onPointerUp={() => { photoDragStart.current = null; }}
                onPointerCancel={() => { photoDragStart.current = null; }}
              >
                <img
                  src={photoCrop.src}
                  className="h-full w-full object-cover select-none pointer-events-none"
                  style={{ transform: `translate(${photoCrop.offsetX}px, ${photoCrop.offsetY}px) scale(${photoCrop.zoom})` }}
                  alt="Crop preview"
                />
              </div>

              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <label htmlFor="photo-zoom">Zoom</label>
                  <button onClick={() => setPhotoCrop((current) => current && { ...current, zoom: 1, offsetX: 0, offsetY: 0 })} className="text-blue-600 hover:text-blue-700">Recenter</button>
                </div>
                <input
                  id="photo-zoom"
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={photoCrop.zoom}
                  onChange={(event) => setPhotoCrop((current) => current && { ...current, zoom: Number(event.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
              <button onClick={() => setPhotoCrop(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={saveCroppedPhoto} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700">Use Photo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
