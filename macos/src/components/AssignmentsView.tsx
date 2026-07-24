/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FilePlus,
  BookOpen,
  Calendar,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  ChevronRight,
  ClipboardList,
  Scan,
  Printer,
  X,
  Tag,
  Plus,
  Minus,
  Download,
  QrCode,
  FileText
} from 'lucide-react';
import { Student, Assignment, AssignmentSubmission } from '../types';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

interface AssignmentsViewProps {
  students: Student[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  activeAssignmentId: string | null;
  onSelectAssignment: (id: string) => void;
  onAddAssignment: (name: string, description: string, category: Assignment['category'], pointsValue: number, dueDate: string, subject?: Assignment['subject']) => string;
  onDeleteAssignment: (id: string) => void;
  onToggleSubmission: (studentId: string, assignmentId: string) => void;
  subjects: string[];
  onAddSubject: (name: string) => boolean;
  onDeleteSubject: (name: string) => boolean;
  loadedSessionAssignmentId?: string | null;
  setLoadedSessionAssignmentId?: (id: string | null) => void;
}

interface LabelTheme {
  id: string;
  name: string;
  bgClass: string;
  textClass: string;
  badgeClass: string;
  borderClass: string;
  printBg: string;
  printText: string;
  printBorder: string;
  printBadgeBg: string;
  printBadgeText: string;
}

const LABEL_THEMES: LabelTheme[] = [
  {
    id: 'blue',
    name: 'Royal Blue',
    bgClass: 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white',
    textClass: 'text-blue-100',
    badgeClass: 'bg-white/15 text-white border-white/20',
    borderClass: 'border-blue-500/30',
    printBg: 'linear-gradient(135deg, #1e40af, #3b82f6)',
    printText: '#ffffff',
    printBorder: 'rgba(255, 255, 255, 0.2)',
    printBadgeBg: 'rgba(255, 255, 255, 0.15)',
    printBadgeText: '#ffffff'
  },
  {
    id: 'emerald',
    name: 'Forest Emerald',
    bgClass: 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white',
    textClass: 'text-emerald-100',
    badgeClass: 'bg-white/15 text-white border-white/20',
    borderClass: 'border-emerald-500/30',
    printBg: 'linear-gradient(135deg, #065f46, #10b981)',
    printText: '#ffffff',
    printBorder: 'rgba(255, 255, 255, 0.2)',
    printBadgeBg: 'rgba(255, 255, 255, 0.15)',
    printBadgeText: '#ffffff'
  },
  {
    id: 'violet',
    name: 'Cosmic Violet',
    bgClass: 'bg-gradient-to-br from-violet-600 to-fuchsia-700 text-white',
    textClass: 'text-violet-100',
    badgeClass: 'bg-white/15 text-white border-white/20',
    borderClass: 'border-violet-500/30',
    printBg: 'linear-gradient(135deg, #5b21b6, #8b5cf6)',
    printText: '#ffffff',
    printBorder: 'rgba(255, 255, 255, 0.2)',
    printBadgeBg: 'rgba(255, 255, 255, 0.15)',
    printBadgeText: '#ffffff'
  },
  {
    id: 'slate',
    name: 'Ink Saver (White)',
    bgClass: 'bg-white border border-slate-200 text-slate-800',
    textClass: 'text-slate-500',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    borderClass: 'border-slate-200',
    printBg: '#ffffff',
    printText: '#0f172a',
    printBorder: '#e2e8f0',
    printBadgeBg: '#f1f5f9',
    printBadgeText: '#334155'
  }
];

export default function AssignmentsView({
  students,
  assignments,
  submissions,
  activeAssignmentId,
  onSelectAssignment,
  onAddAssignment,
  onDeleteAssignment,
  onToggleSubmission,
  subjects,
  onAddSubject,
  onDeleteSubject,
  loadedSessionAssignmentId,
  setLoadedSessionAssignmentId
}: AssignmentsViewProps) {
  const activeAsm = assignments.find((a) => a.id === activeAssignmentId) || null;

  // UI states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSubjectManager, setShowSubjectManager] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newAsmName, setNewAsmName] = useState('');
  const [newAsmDesc, setNewAsmDesc] = useState('');
  const [newAsmCategory, setNewAsmCategory] = useState<Assignment['category']>('Homework');
  const [newAsmSubject, setNewAsmSubject] = useState('');

  React.useEffect(() => {
    if (subjects.length > 0 && (!newAsmSubject || !subjects.includes(newAsmSubject))) {
      setNewAsmSubject(subjects[0]);
    }
  }, [subjects, newAsmSubject]);

  const [newAsmPoints, setNewAsmPoints] = useState(10);
  const [newAsmDueDate, setNewAsmDueDate] = useState('2026-07-20');

  // Print settings states
  const [showPrintBadges, setShowPrintBadges] = useState(false);
  const [bulkThemeId, setBulkThemeId] = useState('blue');
  const [bulkPrintColorMode, setBulkPrintColorMode] = useState<'color' | 'mono'>('color');
  const [bulkBarcodeOption, setBulkBarcodeOption] = useState<'both' | 'barcode_only' | 'qr_only'>('both');
  const [bulkSeparator, setBulkSeparator] = useState<'_' | '-' | ':'>('_');

  const [showAsmBarcodeModal, setShowAsmBarcodeModal] = useState(false);
  const [activeStudentMenuId, setActiveStudentMenuId] = useState<string | null>(null);

  // Render barcode/QR inside modal dynamically
  React.useEffect(() => {
    if (showAsmBarcodeModal && activeAsm) {
      setTimeout(() => {
        const bcCanvas = document.getElementById('standalone-asm-barcode') as HTMLCanvasElement | null;
        if (bcCanvas) {
          try {
            JsBarcode(bcCanvas, activeAsm.id, {
              format: 'CODE128',
              width: 1.8,
              height: 50,
              displayValue: true,
              fontSize: 10,
              font: 'monospace',
              margin: 4,
              background: '#ffffff',
              lineColor: '#000000'
            });
          } catch (err) {
            console.error('Failed to render standalone assignment barcode:', err);
          }
        }

        const qrCanvas = document.getElementById('standalone-asm-qrcode') as HTMLCanvasElement | null;
        if (qrCanvas) {
          QRCode.toCanvas(qrCanvas, activeAsm.id, {
            width: 120,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          }, (err) => {
            if (err) console.error('Failed to render standalone assignment QR code:', err);
          });
        }
      }, 50);
    }
  }, [showAsmBarcodeModal, activeAsm]);

  // Helper to download single barcode image
  const downloadBarcodeImage = (value: string, label: string) => {
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, value, {
        format: 'CODE128',
        width: 2,
        height: 70,
        displayValue: true,
        fontSize: 14,
        font: 'monospace',
        textMargin: 4,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000'
      });
      
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${label.replace(/\s+/g, '_')}_barcode.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download barcode image:', err);
    }
  };

  // Helper to download single QR code image
  const downloadQrImage = async (value: string, label: string) => {
    try {
      const url = await QRCode.toDataURL(value, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      const a = document.createElement('a');
      a.href = url;
      a.download = `${label.replace(/\s+/g, '_')}_qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download QR image:', err);
    }
  };

  // Generate Base64 for Word document integration
  const generateBarcodeBase64 = (value: string): string => {
    const canvas = document.createElement('canvas');
    try {
      JsBarcode(canvas, value, {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 12,
        font: 'monospace',
        textMargin: 3,
        margin: 8,
        background: '#ffffff',
        lineColor: '#000000'
      });
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.error('Error generating barcode base64:', err);
      return '';
    }
  };

  const generateQrBase64 = async (value: string): Promise<string> => {
    try {
      return await QRCode.toDataURL(value, {
        width: 150,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    } catch (err) {
      console.error('Error generating QR base64:', err);
      return '';
    }
  };

  // Export class barcodes as Microsoft Word file (.doc MHTML format)
  const handleExportWordBarcodes = async () => {
    if (!activeAsm) return;
    
    try {
      const boundary = '----=_NextPart_01D1E3F5.A36069E0';
      const attachments: { cid: string; base64: string }[] = [];
      let tableRowsHtml = '';
      
      for (const student of students) {
        const idBarcodeData = generateBarcodeBase64(student.id);
        const combinedVal = `${student.id}${bulkSeparator}${activeAsm.id}`;
        const combinedBarcodeData = activeAsm.id !== 'ASM_VARIOUS' ? generateBarcodeBase64(combinedVal) : '';
        const qrCodeData = await generateQrBase64(activeAsm.id === 'ASM_VARIOUS' ? student.id : combinedVal);
        
        const idBcCid = `id_bc_${student.id}`;
        const combBcCid = `comb_bc_${student.id}`;
        const qrCid = `qr_${student.id}`;
        
        if (idBarcodeData) {
          attachments.push({
            cid: idBcCid,
            base64: idBarcodeData.split(',')[1] || ''
          });
        }
        if (combinedBarcodeData) {
          attachments.push({
            cid: combBcCid,
            base64: combinedBarcodeData.split(',')[1] || ''
          });
        }
        if (qrCodeData) {
          attachments.push({
            cid: qrCid,
            base64: qrCodeData.split(',')[1] || ''
          });
        }
        
        tableRowsHtml += '<tr>';
        tableRowsHtml += '<td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; vertical-align: middle;"><span class="student-name" style="font-weight: bold; color: #0f172a; font-size: 9pt;">' + student.name + '</span></td>';
        tableRowsHtml += '<td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; vertical-align: middle;"><span class="student-id" style="font-family: \'Courier New\', monospace; color: #475569; font-size: 8.5pt;">' + student.id + '</span></td>';
        
        // ID Barcode Only
        tableRowsHtml += '<td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; vertical-align: middle;">';
        if (idBarcodeData) {
          tableRowsHtml += `<img src="cid:${idBcCid}" height="22" width="105" style="width: 105px; height: 22px; display: block; border: 0;" align="left" />`;
        } else {
          tableRowsHtml += '<span style="color: #94a3b8; font-size: 8pt;">N/A</span>';
        }
        tableRowsHtml += '</td>';
        
        // Combined Barcode
        if (activeAsm.id !== 'ASM_VARIOUS') {
          tableRowsHtml += '<td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; vertical-align: middle;">';
          if (combinedBarcodeData) {
            tableRowsHtml += `<img src="cid:${combBcCid}" height="22" width="125" style="width: 125px; height: 22px; display: block; border: 0;" align="left" />`;
          } else {
            tableRowsHtml += '<span style="color: #94a3b8; font-size: 8pt;">N/A</span>';
          }
          tableRowsHtml += '</td>';
        }
        
        // QR Code
        tableRowsHtml += '<td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; vertical-align: middle;">';
        if (qrCodeData) {
          tableRowsHtml += `<img src="cid:${qrCid}" height="22" width="22" style="width: 22px; height: 22px; display: block; border: 0;" align="left" />`;
        } else {
          tableRowsHtml += '<span style="color: #94a3b8; font-size: 8pt;">N/A</span>';
        }
        tableRowsHtml += '</td>';
        
        tableRowsHtml += '</tr>';
      }

      let tableHeaderHtml = '';
      if (activeAsm.id !== 'ASM_VARIOUS') {
        tableHeaderHtml += '<th style="width: 25%; border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; font-weight: bold; text-align: left;">Student Name</th>';
        tableHeaderHtml += '<th style="width: 15%; border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; font-weight: bold; text-align: left;">Student ID</th>';
        tableHeaderHtml += '<th style="width: 25%; border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; font-weight: bold; text-align: left;">ID Barcode</th>';
        tableHeaderHtml += '<th style="width: 25%; border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; font-weight: bold; text-align: left;">Combined Barcode</th>';
        tableHeaderHtml += '<th style="width: 10%; border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; font-weight: bold; text-align: left;">QR Code</th>';
      } else {
        tableHeaderHtml += '<th style="width: 35%; border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; font-weight: bold; text-align: left;">Student Name</th>';
        tableHeaderHtml += '<th style="width: 20%; border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; font-weight: bold; text-align: left;">Student ID</th>';
        tableHeaderHtml += '<th style="width: 35%; border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; font-weight: bold; text-align: left;">ID Barcode</th>';
        tableHeaderHtml += '<th style="width: 10%; border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; font-weight: bold; text-align: left;">QR Code</th>';
      }
      
      const mainHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>${activeAsm.name} - Class Barcodes</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              color: #1e293b;
              margin: 20px;
            }
            h2 {
              color: #4f46e5;
              font-size: 14pt;
              border-bottom: 2px solid #cbd5e1;
              padding-bottom: 6px;
              margin-bottom: 4px;
            }
            .subtitle {
              font-size: 9.5pt;
              color: #64748b;
              margin-bottom: 15px;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin-top: 15px;
              table-layout: fixed;
            }
            th {
              background-color: #f8fafc;
              border: 1px solid #cbd5e1;
              padding: 6px 8px;
              font-size: 9.5pt;
              font-weight: bold;
              text-align: left;
            }
            td {
              border: 1px solid #cbd5e1;
              padding: 4px 6px;
              font-size: 9pt;
              vertical-align: middle;
              text-align: left;
            }
            .student-name {
              font-weight: bold;
              color: #0f172a;
            }
            .student-id {
              font-family: 'Courier New', monospace;
              color: #475569;
            }
          </style>
        </head>
        <body>
          <h2>CLASS BARCODES: ${activeAsm.name.toUpperCase()}</h2>
          <div class="subtitle">
            Category: <strong>${activeAsm.category}</strong> | 
            Subject: <strong>${activeAsm.subject || 'General'}</strong> | 
            Points: <strong>${activeAsm.pointsValue} pts</strong> | 
            Generated: <strong>${new Date().toLocaleDateString()}</strong>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-family: Arial, sans-serif; table-layout: fixed;">
            <thead>
              <tr style="background-color: #f8fafc;">
                ${tableHeaderHtml}
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      let mhtml = 'MIME-Version: 1.0\r\n';
      mhtml += `Content-Type: multipart/related; boundary="${boundary}"\r\n\r\n`;
      
      mhtml += `--${boundary}\r\n`;
      mhtml += 'Content-Type: text/html; charset="utf-8"\r\n';
      mhtml += 'Content-Transfer-Encoding: 8bit\r\n\r\n';
      mhtml += mainHtml + '\r\n\r\n';
      
      for (const att of attachments) {
        mhtml += `--${boundary}\r\n`;
        mhtml += 'Content-Type: image/png\r\n';
        mhtml += 'Content-Transfer-Encoding: base64\r\n';
        mhtml += `Content-ID: <${att.cid}>\r\n`;
        mhtml += `Content-Location: ${att.cid}\r\n\r\n`;
        mhtml += att.base64 + '\r\n\r\n';
      }
      
      mhtml += `--${boundary}--`;
      
      const blob = new Blob([mhtml], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeAsm.name.replace(/\s+/g, '_')}_Class_Barcodes.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export class barcodes to Word:', err);
    }
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsmName.trim()) return;

    const createdId = onAddAssignment(
      newAsmName,
      newAsmDesc,
      newAsmCategory,
      newAsmPoints,
      newAsmDueDate,
      newAsmSubject
    );

    if (createdId) {
      setNewAsmName('');
      setNewAsmDesc('');
      setNewAsmPoints(10);
      setShowCreateForm(false);
    }
  };

  // Category Colors
  const getCategoryColor = (category: Assignment['category']) => {
    switch (category) {
      case 'Homework': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Classwork': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Project': return 'bg-violet-50 text-violet-700 border-violet-100';
      case 'Quiz': return 'bg-rose-50 text-rose-700 border-rose-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Assignment Tracking</h2>
          <p className="text-xs text-slate-500 font-medium">Record reading logs, worksheets, and classroom tasks with rapid barcode scanning</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setShowSubjectManager(!showSubjectManager);
              setShowCreateForm(false);
            }}
            className={`flex items-center gap-2 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer hover:scale-[1.02] self-start md:self-auto border ${
              showSubjectManager 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm' 
                : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <Tag className="w-4 h-4 text-slate-500" />
            {showSubjectManager ? 'Hide Subjects' : 'Manage Subjects'}
          </button>

          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setShowSubjectManager(false);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-blue-100 transition-all cursor-pointer hover:scale-[1.02] self-start md:self-auto"
          >
            <FilePlus className="w-4 h-4" />
            {showCreateForm ? 'Hide Form' : 'New Assignment'}
          </button>
        </div>
      </div>

      {/* Subject Manager panel dropdown */}
      {showSubjectManager && (
        <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm space-y-4 max-w-2xl">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-500" /> Manage Subjects
            </h3>
            <button
              onClick={() => setShowSubjectManager(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Create custom subject input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Physics, Creative Writing, History..."
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 font-medium"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newSubjectName.trim()) {
                    onAddSubject(newSubjectName.trim());
                    setNewSubjectName('');
                  }
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (newSubjectName.trim()) {
                  onAddSubject(newSubjectName.trim());
                  setNewSubjectName('');
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {/* Current subjects list */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Existing Custom Subjects</span>
            <div className="flex flex-wrap gap-1.5">
              {subjects.map(sub => {
                const isCore = ['Math', 'Reading', 'Science', 'Spelling', 'Social Studies', 'Other'].includes(sub);
                return (
                  <div
                    key={sub}
                    className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold border transition-colors ${
                      isCore 
                        ? 'bg-slate-50 text-slate-400 border-slate-100/80' 
                        : 'bg-indigo-50/70 text-indigo-700 border-indigo-100'
                    }`}
                  >
                    <span>{sub}</span>
                    {!isCore && (
                      <button
                        type="button"
                        onClick={() => onDeleteSubject(sub)}
                        className="text-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer p-0.5 rounded-full hover:bg-indigo-100"
                        title={`Delete custom subject "${sub}"`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Creation form dropdown */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateAssignment}
          className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm space-y-4 max-w-2xl"
        >
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
            <ClipboardList className="w-4 h-4 text-blue-500" /> Create Assignment
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assignment Title</label>
              <input
                type="text"
                placeholder="e.g. Spelling Words Unit 5"
                value={newAsmName}
                onChange={e => setNewAsmName(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category</label>
              <select
                value={newAsmCategory}
                onChange={e => setNewAsmCategory(e.target.value as Assignment['category'])}
                className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-semibold"
              >
                <option value="Homework">Homework</option>
                <option value="Classwork">Classwork</option>
                <option value="Project">Project</option>
                <option value="Quiz">Quiz</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Academic Subject</label>
              <select
                value={newAsmSubject}
                onChange={e => setNewAsmSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-semibold cursor-pointer"
              >
                {subjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Points Awarded</label>
              <input
                type="number"
                min="1"
                max="200"
                value={newAsmPoints}
                onChange={e => setNewAsmPoints(parseInt(e.target.value) || 10)}
                required
                className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Due Date</label>
              <input
                type="date"
                value={newAsmDueDate}
                onChange={e => setNewAsmDueDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Instructional Description</label>
            <textarea
              placeholder="What are the completion criteria for this assignment?"
              value={newAsmDesc}
              onChange={e => setNewAsmDesc(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setNewAsmName('');
                setNewAsmDesc('');
              }}
              className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-xl text-xs shadow-md shadow-blue-100 transition-all cursor-pointer"
            >
              Create Assignment
            </button>
          </div>
        </form>
      )}

      {/* Main Grid: Assignments List and Submissions Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Assignments Sidebar selector (1 Col) */}
        <div className="space-y-3">
          
          {/* Continuous Multi-Scan Mode (Various Assignments) Selector */}
          <div
            onClick={() => onSelectAssignment('ASM_VARIOUS')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col gap-1.5 relative overflow-hidden group ${
              activeAssignmentId === 'ASM_VARIOUS'
                ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/15'
                : 'bg-white border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50/40'
            }`}
          >
            <div className="absolute -right-6 -bottom-6 w-14 h-14 bg-indigo-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform" />

            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black tracking-wider uppercase ${
                activeAssignmentId === 'ASM_VARIOUS'
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-indigo-50 border-indigo-100 text-indigo-700'
              }`}>
                SYSTEM MODE
              </span>
              <Sparkles className={`w-4 h-4 ${
                activeAssignmentId === 'ASM_VARIOUS' ? 'text-indigo-600 animate-spin-slow' : 'text-indigo-400'
              }`} />
            </div>

            <h4 className={`text-xs font-black leading-tight ${
              activeAssignmentId === 'ASM_VARIOUS' ? 'text-indigo-950 font-black' : 'text-slate-800'
            }`}>
              ⚡ Various Assignments Mode
            </h4>
            
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
              Scan an assignment barcode first, then scan student cards to record completions continuously without clicking!
            </p>
          </div>

          <div className="border-t border-slate-100/60 my-1" />

          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider pl-1">Active Tasks</span>
          
          {assignments.length === 0 ? (
            <div className="bg-white border border-slate-200/85 p-6 rounded-3xl text-center text-slate-400 shadow-sm">
              <BookOpen className="w-8 h-8 opacity-40 mx-auto mb-2" />
              No active assignments created. Click "New Assignment" to start.
            </div>
          ) : (
            assignments.map((asm) => {
              const isActive = asm.id === activeAssignmentId;
              
              // Count submissions for this assignment
              const completedCount = submissions.filter(
                (sub) => sub.assignmentId === asm.id && sub.completed
              ).length;
              const totalNeeded = students.length;
              const ratePercent = totalNeeded > 0 ? Math.round((completedCount / totalNeeded) * 100) : 0;

              return (
                <div
                  key={asm.id}
                  onClick={() => onSelectAssignment(asm.id)}
                  className={`p-4 bg-white border rounded-2xl shadow-sm cursor-pointer transition-all duration-200 flex flex-col gap-2 relative overflow-hidden group ${
                    isActive
                      ? 'border-blue-500 ring-2 ring-blue-500/10'
                      : 'border-slate-200/85 hover:border-slate-300 hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold tracking-wider uppercase ${getCategoryColor(asm.category)}`}>
                        {asm.category}
                      </span>
                      {asm.subject && (
                        <span className="px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-slate-600 text-[9px] font-semibold">
                          {asm.subject}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[9px] font-bold text-slate-400 uppercase bg-slate-100 border border-slate-200/50 px-1.5 py-0.5 rounded">
                      {asm.id}
                    </span>
                  </div>

                  <h4 className={`text-xs font-bold leading-tight ${isActive ? 'text-blue-600' : 'text-slate-800'}`}>
                    {asm.name}
                  </h4>

                  <div className="flex items-center gap-3.5 text-[10px] text-slate-400 font-semibold mt-1">
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-slate-300" />
                      Due: {asm.dueDate}
                    </span>
                    <span className="flex items-center gap-1 shrink-0 bg-amber-50/50 text-amber-700 py-0.5 px-1.5 rounded">
                      +{asm.pointsValue} pts
                    </span>
                  </div>

                  {/* Submission Rate Mini Bar */}
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold">
                      <span>Rate: {ratePercent}%</span>
                      <span>{completedCount} / {totalNeeded} Done</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100/50 h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${ratePercent}%` }}
                        className={`h-full rounded-full transition-all duration-700 ${
                          ratePercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Absolute chevron indicator on hover */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Assignment Submissions List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          {activeAssignmentId === 'ASM_VARIOUS' ? (
            <div className="bg-white border border-indigo-200/80 shadow-md shadow-indigo-100/50 rounded-3xl overflow-hidden flex flex-col">
              
              {/* Continuous Scanner Header */}
              <div className="p-6 border-b border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 max-w-md">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 text-[9px] font-black tracking-wider uppercase">
                      SYSTEM MODE ACTIVE
                    </span>
                    <span className="font-mono text-[9px] font-bold text-indigo-500 bg-indigo-50/50 border border-indigo-100 px-1.5 py-0.5 rounded">
                      ID: ASM_VARIOUS
                    </span>
                  </div>
                  
                  <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                    <span>⚡ Various Assignments Mode</span>
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    This continuous mode lets you scan classroom assignments and record student credits seamlessly. To record work, first scan an **Assignment's barcode** (from your worksheet or printed sheet below), then scan **Student ID barcodes**.
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-1.5 shrink-0 text-left sm:text-right">
                  <span className="text-[10px] text-indigo-500 font-extrabold tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 uppercase inline-block">
                    Continuous Scan Active
                  </span>
                </div>
              </div>

              {/* Scan Status Display Card */}
              <div className="p-6 border-b border-slate-100/80">
                {loadedSessionAssignmentId ? (() => {
                  const currentSessionAsm = assignments.find(a => a.id === loadedSessionAssignmentId);
                  if (!currentSessionAsm) return null;
                  return (
                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-500 text-white rounded-xl">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="leading-tight text-left">
                          <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">Locked-in Assignment</span>
                          <h4 className="font-bold text-sm text-emerald-950 mt-0.5">{currentSessionAsm.name}</h4>
                          <span className="text-[10px] text-emerald-600/90 font-bold mt-1 inline-flex gap-2">
                            <span>Category: {currentSessionAsm.category}</span>
                            <span>•</span>
                            <span>Reward: +{currentSessionAsm.pointsValue} pts</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold py-1 px-3 rounded-xl border border-emerald-200">
                          Ready to scan Student Cards!
                        </span>
                        <button
                          onClick={() => setLoadedSessionAssignmentId?.(null)}
                          className="p-1.5 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-800 rounded-full transition-colors"
                          title="Reset current session assignment"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-200/80 border-dashed flex flex-col items-center text-center space-y-2.5">
                    <Scan className="w-8 h-8 text-amber-500 animate-pulse" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wider">WAITING FOR ASSIGNMENT BARCODE</h4>
                      <p className="text-[10px] text-amber-700/90 max-w-[420px] font-semibold leading-relaxed">
                        To start recording completions, focus the scan box and scan any assignment barcode. You can copy/view barcodes for your assignments in the utility section below!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Utility Section: Barcodes of All Assignments */}
              <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Quick Reference: Assignment Barcodes</h4>
                  <span className="text-[9px] text-slate-400 font-bold">Print these or scan from screen</span>
                </div>
                
                {assignments.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2 text-center">No assignments created yet. Create an assignment to use this mode!</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {assignments.map((asm) => {
                      const isLoaded = asm.id === loadedSessionAssignmentId;
                      return (
                        <div
                          key={asm.id}
                          onClick={() => setLoadedSessionAssignmentId?.(asm.id)}
                          className={`p-3 rounded-xl border bg-white flex items-center justify-between gap-2 cursor-pointer transition-all ${
                            isLoaded 
                              ? 'border-emerald-400 ring-2 ring-emerald-500/10' 
                              : 'border-slate-200/70 hover:border-indigo-200'
                          }`}
                        >
                          <div className="text-left space-y-0.5">
                            <span className="text-[9px] font-extrabold text-slate-400 tracking-wider font-mono bg-slate-50 border border-slate-100 px-1 py-0.2 rounded uppercase">
                              {asm.id}
                            </span>
                            <h5 className="font-bold text-xs text-slate-800 line-clamp-1">{asm.name}</h5>
                            <p className="text-[9px] text-slate-400 font-semibold">{asm.category} • +{asm.pointsValue} pts</p>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadBarcodeImage(asm.id, asm.name);
                              }}
                              className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-md border border-slate-200/60 shadow-sm"
                              title="Download Barcode"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectAssignment(asm.id);
                              }}
                              className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-md border border-slate-200/60 shadow-sm"
                              title="Go to single assignment view"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submissions List for Current Locked-in Assignment */}
              {loadedSessionAssignmentId && (() => {
                const currentSessionAsm = assignments.find(a => a.id === loadedSessionAssignmentId);
                if (!currentSessionAsm) return null;

                // Calculate counts
                const completedCount = submissions.filter(
                  (sub) => sub.assignmentId === currentSessionAsm.id && sub.completed
                ).length;
                const totalNeeded = students.length;
                const ratePercent = totalNeeded > 0 ? Math.round((completedCount / totalNeeded) * 100) : 0;

                return (
                  <div className="flex-1 flex flex-col">
                    {/* Submission rate bar */}
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 font-bold text-[10px]">
                      <div className="flex items-center gap-2">
                        <span>Completion Rate: <span className="text-slate-800 font-black">{ratePercent}%</span></span>
                        <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden inline-block">
                          <div style={{ width: `${ratePercent}%` }} className="h-full bg-emerald-500 rounded-full" />
                        </div>
                      </div>
                      <span>{completedCount} / {totalNeeded} Students Done</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-700">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                            <th className="py-3 px-5">Student Name</th>
                            <th className="py-3 px-4 font-mono">ID</th>
                            <th className="py-3 px-4 text-center">Completion Status</th>
                            <th className="py-3 px-5 text-right">Logged Date / Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {students.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-slate-400">
                                No students found. Add them in Roster view.
                              </td>
                            </tr>
                          ) : (
                            students.map((student) => {
                              const subId = `${student.id}_${currentSessionAsm.id}`;
                              const sub = submissions.find((s) => s.id === subId);
                              const isDone = sub ? sub.completed : false;

                              return (
                                <tr
                                  key={student.id}
                                  className={`transition-all duration-300 ${
                                    isDone ? 'bg-emerald-50/10 hover:bg-emerald-50/20' : 'hover:bg-slate-50/50'
                                  }`}
                                >
                                  <td className="py-3 px-5">
                                    <span className="font-semibold text-xs text-slate-800 block">
                                      {student.name}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-mono text-[10px] text-slate-500 font-semibold uppercase">
                                    {student.id}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <button
                                      onClick={() => onToggleSubmission(student.id, currentSessionAsm.id)}
                                      className={`inline-flex items-center justify-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-bold border transition-all cursor-pointer shadow-sm ${
                                        isDone
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                          : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600'
                                      }`}
                                    >
                                      {isDone ? (
                                        <>
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100/10" /> Done (+{currentSessionAsm.pointsValue} pts)
                                        </>
                                      ) : (
                                        <>
                                          <XCircle className="w-3.5 h-3.5" /> Pending
                                        </>
                                      )}
                                    </button>
                                  </td>
                                  <td className="py-3 px-5 text-right font-mono text-[10px] text-slate-400 font-medium">
                                    {isDone && sub?.completedAt ? (
                                      <span className="flex items-center gap-1 justify-end text-emerald-600 font-semibold bg-emerald-50/50 py-0.5 px-2 rounded-md border border-emerald-100/30 inline-flex">
                                        <Clock className="w-3.5 h-3.5 shrink-0" />
                                        {new Date(sub.completedAt).toLocaleDateString()} {new Date(sub.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
              
            </div>
          ) : activeAsm ? (
            <div className="bg-white border border-slate-200/85 shadow-sm rounded-3xl overflow-hidden flex flex-col">
              
              {/* Assignment Title Area */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 max-w-md">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-md border text-[9px] font-bold tracking-wider uppercase ${getCategoryColor(activeAsm.category)}`}>
                      {activeAsm.category}
                    </span>
                    {activeAsm.subject && (
                      <span className="px-2.5 py-0.5 rounded-md border border-slate-200 bg-white text-slate-600 text-[9px] font-bold">
                        Subject: {activeAsm.subject}
                      </span>
                    )}
                    <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200/50 px-1.5 py-0.5 rounded">
                      ID: {activeAsm.id}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-slate-800 text-base">{activeAsm.name}</h3>
                  {activeAsm.description && (
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      {activeAsm.description}
                    </p>
                  )}

                  {/* Export Options Row */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleExportWordBarcodes}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer bg-slate-50 hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-slate-200/80 hover:border-blue-200 shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-500" />
                      <span>Export Word Barcodes</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowAsmBarcodeModal(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer bg-slate-50 hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-slate-200/80 hover:border-indigo-200 shadow-sm"
                    >
                      <Tag className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-500" />
                      <span>Assignment Barcode</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-1.5 shrink-0 text-left sm:text-right">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1 justify-end">
                    Reward: <span className="bg-amber-50 text-amber-700 py-1 px-2.5 border border-amber-100 rounded-lg font-extrabold">{activeAsm.pointsValue} pts</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 justify-end mt-0.5">
                    <Calendar className="w-3.5 h-3.5" /> Due By: {activeAsm.dueDate}
                  </span>
                  
                  {/* Delete Assignment trigger */}
                  <button
                    onClick={() => onDeleteAssignment(activeAsm.id)}
                    className="mt-2 text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 justify-end cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Assignment
                  </button>
                </div>
              </div>

              {/* Physical Scanning Action banner */}
              <div className="bg-slate-900 text-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-950 shadow-inner">
                <div className="flex items-center gap-3.5 flex-1">
                  <div className="p-2.5 bg-blue-950 border border-blue-800 text-blue-200 rounded-xl animate-pulse">
                    <Scan className="w-5 h-5" />
                  </div>
                  <div className="leading-tight flex-1">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-blue-100">Scan Student Card to Check Off</h4>
                    <p className="text-[10px] text-blue-200/90 leading-relaxed mt-0.5 font-medium">
                      Focus the global top scan input. Simply scan any student's member card. The system automatically marks them "Completed", plays a sound, and awards points!
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrintBadges(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shrink-0 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-950 hover:scale-[1.03] active:scale-[0.98]"
                >
                  <Printer className="w-4 h-4 text-blue-100" />
                  Print Sheets/Labels
                </button>
              </div>

              {/* Students Submissions List */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-5">Student Name</th>
                      <th className="py-3 px-4 font-mono">ID</th>
                      <th className="py-3 px-4 text-center">Completion Status</th>
                      <th className="py-3 px-5 text-right">Logged Date / Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-400">
                          Add students to the class roster first to track assignment completions.
                        </td>
                      </tr>
                    ) : (
                      students.map((student) => {
                        const subId = `${student.id}_${activeAsm.id}`;
                        const sub = submissions.find((s) => s.id === subId);
                        const isDone = sub ? sub.completed : false;

                        return (
                          <tr
                            key={student.id}
                            className={`transition-all duration-300 ${
                              isDone ? 'bg-emerald-50/10 hover:bg-emerald-50/20' : 'hover:bg-slate-50/50'
                            }`}
                          >
                            {/* Student Info */}
                            <td className="py-3 px-5">
                              <span className="font-semibold text-xs text-slate-800 block">
                                {student.name}
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider block mt-0.5">
                                Current: <span className="font-bold text-slate-500">{student.points} pts</span>
                              </span>
                            </td>

                            {/* Student ID */}
                            <td className="py-3 px-4 font-mono font-bold text-slate-500 text-xs">
                              <div className="flex items-center gap-2 relative">
                                <span>{student.id}</span>
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setActiveStudentMenuId(activeStudentMenuId === student.id ? null : student.id)}
                                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all cursor-pointer inline-flex items-center"
                                    title="Export Options"
                                  >
                                    <Download className="w-3 h-3" />
                                  </button>
                                  
                                  {activeStudentMenuId === student.id && (
                                    <>
                                      {/* Clear backdrop to register outside clicks */}
                                      <div className="fixed inset-0 z-30" onClick={() => setActiveStudentMenuId(null)} />
                                      <div className="absolute left-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100/80 py-1.5 z-40 text-left font-sans normal-case tracking-normal">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            downloadBarcodeImage(student.id, `${student.name}_ID`);
                                            setActiveStudentMenuId(null);
                                          }}
                                          className="w-full text-left px-3 py-1.5 text-[10px] text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-bold flex items-center gap-2 cursor-pointer"
                                        >
                                          <Scan className="w-3 h-3 text-blue-500" />
                                          <span>Save ID Barcode</span>
                                        </button>
                                        
                                        {activeAsm.id !== 'ASM_VARIOUS' && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              downloadBarcodeImage(`${student.id}${bulkSeparator}${activeAsm.id}`, `${student.name}_${activeAsm.name}`);
                                              setActiveStudentMenuId(null);
                                            }}
                                            className="w-full text-left px-3 py-1.5 text-[10px] text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-bold flex items-center gap-2 cursor-pointer"
                                          >
                                            <Scan className="w-3 h-3 text-indigo-500" />
                                            <span>Save Combined</span>
                                          </button>
                                        )}
                                        
                                        <button
                                          type="button"
                                          onClick={() => {
                                            downloadQrImage(activeAsm.id === 'ASM_VARIOUS' ? student.id : `${student.id}${bulkSeparator}${activeAsm.id}`, `${student.name}_QR`);
                                            setActiveStudentMenuId(null);
                                          }}
                                          className="w-full text-left px-3 py-1.5 text-[10px] text-slate-600 hover:bg-slate-50 hover:text-emerald-600 font-bold flex items-center gap-2 cursor-pointer"
                                        >
                                          <QrCode className="w-3 h-3 text-emerald-500" />
                                          <span>Save QR Code</span>
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Toggle Switch Check */}
                            <td className="py-3 px-4 text-center">
                              {activeAsm.id === 'ASM_VARIOUS' ? (
                                <span className="inline-flex items-center gap-1 py-1 px-3 rounded-full text-[9px] font-extrabold uppercase border bg-slate-50 text-slate-400 border-slate-200">
                                  🛡️ Standby Mode
                                </span>
                              ) : (
                                <button
                                  onClick={() => onToggleSubmission(student.id, activeAsm.id)}
                                  className={`inline-flex items-center justify-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-bold border transition-all cursor-pointer shadow-sm ${
                                    isDone
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                      : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600'
                                  }`}
                                >
                                  {isDone ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100/10" /> Done (+{activeAsm.pointsValue} pts)
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3.5 h-3.5" /> Pending
                                    </>
                                  )}
                                </button>
                              )}
                            </td>

                            {/* Date/Time stamp */}
                            <td className="py-3 px-5 text-right font-mono text-[10px] text-slate-400 font-medium">
                              {isDone && sub?.completedAt ? (
                                <span className="flex items-center gap-1 justify-end text-emerald-600 font-semibold bg-emerald-50/50 py-0.5 px-2 rounded-md border border-emerald-100/30 inline-flex">
                                  <Clock className="w-3.5 h-3.5 shrink-0" />
                                  {new Date(sub.completedAt).toLocaleDateString()} {new Date(sub.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200/85 p-12 rounded-3xl text-center text-slate-400 shadow-sm flex flex-col items-center justify-center space-y-3">
              <ClipboardList className="w-12 h-12 opacity-30" />
              <div>
                <p className="font-semibold text-slate-600 text-xs">No Active Assignment</p>
                <p className="text-[10px] max-w-[250px] mx-auto mt-1 leading-normal">
                  Select an assignment from the sidebar on the left to display its completion matrix and start scanning student cards.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {showPrintBadges && activeAsm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Print Student Assignment Barcodes</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    For assignment: <span className="text-blue-600 font-extrabold">{activeAsm.name}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintBadges(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body & Customization Tray */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Left Side: Settings Panel */}
                <div className="md:col-span-1 space-y-4 bg-slate-50 border border-slate-100 p-4.5 rounded-2xl h-fit">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Badge Style Settings</h4>
                  
                  {/* Theme Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Color Theme</label>
                    <select
                      value={bulkThemeId}
                      onChange={(e) => setBulkThemeId(e.target.value)}
                      className="w-full bg-white border border-slate-200 py-2 px-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-700 cursor-pointer"
                    >
                      {LABEL_THEMES.map((theme) => (
                        <option key={theme.id} value={theme.id}>
                          {theme.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Print Mode */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Print Mode</label>
                    <select
                      value={bulkPrintColorMode}
                      onChange={(e) => setBulkPrintColorMode(e.target.value as 'color' | 'mono')}
                      className="w-full bg-white border border-slate-200 py-2 px-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-700 cursor-pointer"
                    >
                      <option value="color">Full Color Style</option>
                      <option value="mono">Black &amp; White (Ink Saver)</option>
                    </select>
                  </div>

                  {/* Barcode Option */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Code Formats</label>
                    <select
                      value={bulkBarcodeOption}
                      onChange={(e) => setBulkBarcodeOption(e.target.value as 'both' | 'barcode_only' | 'qr_only')}
                      className="w-full bg-white border border-slate-200 py-2 px-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-700 cursor-pointer"
                    >
                      <option value="both">Barcode &amp; QR Code</option>
                      <option value="barcode_only">Barcode Only (1D)</option>
                      <option value="qr_only">QR Code Only (2D)</option>
                    </select>
                  </div>

                  {/* Separator Option */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Code Separator</label>
                    <select
                      value={bulkSeparator}
                      onChange={(e) => setBulkSeparator(e.target.value as '_' | '-' | ':')}
                      className="w-full bg-white border border-slate-200 py-2 px-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-700 cursor-pointer"
                    >
                      <option value="_">Underscore ( _ )</option>
                      <option value="-">Dash ( - )</option>
                      <option value=":">Colon ( : )</option>
                    </select>
                  </div>

                  <div className="text-[10px] text-slate-400 font-medium leading-relaxed bg-white border border-slate-100 p-3 rounded-xl">
                    <span className="font-bold text-slate-500 block mb-1">💡 Scan workflow:</span>
                    Print these labels, paste/place them on the assignments, and scan. The system will read both student ID and assignment ID, and mark completion instantly from any tab!
                  </div>
                </div>

                {/* Right Side: Preview Grid of Label Badges */}
                <div className="md:col-span-3 space-y-3 flex flex-col h-full min-h-[400px]">
                  <div className="flex items-center justify-between pl-1">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Print Preview Sheet ({students.length} students)</h4>
                    <span className="text-[9px] text-slate-400 font-extrabold tracking-wider bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 uppercase">WYSIWYG Print Match</span>
                  </div>
                  
                  <div className="bg-slate-100 border border-slate-200 p-4 rounded-2xl flex-1 max-h-[55vh] overflow-y-auto shadow-inner flex justify-center">
                    {students.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs font-semibold self-center">
                        No students in class roster to generate barcodes for.
                      </div>
                    ) : (
                      /* Virtual Sheet simulates actual Letter paper sheets in portrait */
                      <div className="space-y-8 w-full flex flex-col items-center py-4">
                        {(() => {
                          // Chunk students into pages of 12 (6 rows of 2 columns)
                          const pageSize = 12;
                          const pages: Student[][] = [];
                          for (let i = 0; i < students.length; i += pageSize) {
                            pages.push(students.slice(i, i + pageSize));
                          }
                          
                          return pages.map((pageStudents, pageIdx) => (
                            <div 
                              key={pageIdx} 
                              className="bg-white border border-slate-300 shadow-lg p-5 rounded-md w-[584px] h-[980px] relative text-left flex flex-col justify-between shrink-0" 
                              style={{ boxSizing: 'border-box' }}
                            >
                              <div>
                                <div className="border-b border-dashed border-slate-200 pb-1.5 mb-3 flex items-center justify-between text-[8px] text-slate-400 uppercase tracking-wider select-none font-bold">
                                  <span className="text-indigo-600 flex items-center gap-1">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                    Virtual Sheet {pageIdx + 1} (Letter 8.5" x 11")
                                  </span>
                                  <span>{pageStudents.length} Labels on Page</span>
                                </div>
                                
                                <div className="clearfix">
                                  {pageStudents.map((student) => (
                                    <PrintBadgeCardPreview
                                      key={student.id}
                                      student={student}
                                      activeAsm={activeAsm}
                                      bulkThemeId={bulkThemeId}
                                      bulkPrintColorMode={bulkPrintColorMode}
                                      bulkBarcodeOption={bulkBarcodeOption}
                                      bulkSeparator={bulkSeparator}
                                    />
                                  ))}
                                </div>
                              </div>
                              
                              <div className="text-[8px] text-center font-bold text-slate-300 border-t border-slate-100 pt-2 uppercase tracking-wider select-none">
                                Page {pageIdx + 1} of {pages.length}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowPrintBadges(false)}
                className="py-2.5 px-5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={students.length === 0}
                onClick={() => {
                  const element = document.getElementById('print-area-wrapper');
                  if (element) {
                    const printHtml = students.map((student) => {
                      const currentTheme = LABEL_THEMES.find((t) => t.id === bulkThemeId) || LABEL_THEMES[0];
                      const isColor = bulkPrintColorMode === 'color';
                      
                      const cardBgColor = isColor ? currentTheme.printBg : '#ffffff';
                      const cardTextColor = isColor ? currentTheme.printText : '#0f172a';
                      const cardBorderColor = isColor ? currentTheme.printBorder : '#0f172a';
                      const cardBorder = isColor ? `1.5px solid ${cardBorderColor}` : '2.5px solid #0f172a';
                      const badgeBgStyle = isColor 
                        ? `background: ${currentTheme.printBadgeBg}; color: ${currentTheme.printBadgeText}; border: 1.5px solid rgba(255,255,255,0.1);`
                        : 'background: #f1f5f9; color: #334155; border: 1.5px solid #cbd5e1;';
                      
                      const dashedBorderColor = isColor ? 'rgba(255,255,255,0.2)' : '#cbd5e1';

                      const codeVal = `${student.id}${bulkSeparator}${activeAsm.id}`;

                      const barcodeHtml = (bulkBarcodeOption === 'both' || bulkBarcodeOption === 'barcode_only')
                        ? `<div id="asm-print-bc-${student.id}" style="flex: 1; max-width: 160px; height: 42px; display: flex; flex-direction: column; align-items: center; justify-content: center; ${isColor ? 'background: #ffffff; border-radius: 6px; padding: 3px; box-sizing: border-box;' : ''}"></div>`
                        : ``;

                      const qrHtml = (bulkBarcodeOption === 'both' || bulkBarcodeOption === 'qr_only')
                        ? `<div id="asm-print-qr-${student.id}" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; ${isColor ? 'background: #ffffff; border-radius: 6px; padding: 2px; box-sizing: border-box;' : ''}"></div>`
                        : ``;

                      return `
                        <div style="font-family: system-ui, -apple-system, sans-serif; border: ${cardBorder}; border-radius: 12px; padding: 12px; width: 260px; height: 140px; background: ${cardBgColor}; color: ${cardTextColor}; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; position: relative; overflow: hidden; page-break-inside: avoid; box-shadow: 0 2px 6px rgba(0,0,0,0.05); float: left; margin: 7px;">
                          <!-- Header: Category & Points -->
                          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.95;">
                            <span>${activeAsm.category} • ${activeAsm.subject || 'GENERAL'}</span>
                            <span style="${badgeBgStyle} padding: 1.5px 5px; border-radius: 4px; font-weight: 800;">+${activeAsm.pointsValue} PTS</span>
                          </div>
                          
                          <!-- Assignment Title -->
                          <div style="line-height: 1.1; margin-top: 4px; flex-grow: 1;">
                            <div style="font-size: 11px; font-weight: 800; max-height: 24px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${activeAsm.name}</div>
                            <div style="font-size: 9px; font-weight: 700; margin-top: 4px; color: ${isColor ? '#e2e8f0' : '#475569'};">${student.name}</div>
                          </div>

                          <!-- Barcode / QR Codes -->
                          <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; margin-top: auto; border-top: 1px dashed ${dashedBorderColor}; padding-top: 6px; min-height: 42px;">
                            ${barcodeHtml}
                            ${qrHtml}
                          </div>
                        </div>
                      `;
                    }).join('');

                    element.innerHTML = `
                      <div style="display: block; background: #fff; min-height: 100vh; box-sizing: border-box; padding: 10px;">
                        ${printHtml}
                        <div style="clear: both;"></div>
                      </div>
                    `;

                    // Generate barcodes and QRs directly (high quality)
                    students.forEach((student) => {
                      const codeVal = `${student.id}${bulkSeparator}${activeAsm.id}`;

                      const bcContainer = document.getElementById(`asm-print-bc-${student.id}`);
                      if (bcContainer) {
                        try {
                          const bcSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                          bcSvg.setAttribute('class', 'barcode-svg mx-auto');
                          bcSvg.style.width = '100%';
                          bcSvg.style.height = '36px';
                          bcContainer.appendChild(bcSvg);
                          JsBarcode(bcSvg, codeVal, {
                            format: 'CODE128',
                            width: 1.2,
                            height: 36,
                            displayValue: true,
                            fontSize: 7,
                            font: 'monospace',
                            margin: 0,
                            lineColor: '#000000',
                            background: 'transparent'
                          });
                        } catch (err) {
                          console.error('Failed to generate bulk print barcode:', err);
                        }
                      }

                      const qrContainer = document.getElementById(`asm-print-qr-${student.id}`);
                      if (qrContainer) {
                        QRCode.toDataURL(codeVal, {
                          width: 150,
                          margin: 1,
                          color: {
                            dark: '#000000',
                            light: '#ffffff'
                          }
                        }).then((dataUrl) => {
                          const img = document.createElement('img');
                          img.src = dataUrl;
                          img.style.width = '40px';
                          img.style.height = '40px';
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
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl text-xs shadow-md shadow-blue-100 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Printer className="w-4 h-4 text-white" />
                Print Labels Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Assignment Barcode Modal */}
      {showAsmBarcodeModal && activeAsm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200/85 shadow-2xl w-full max-w-md p-6 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Standalone Assignment Code</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    Independent of Student IDs
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAsmBarcodeModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-center">
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                This barcode represents the assignment itself. Scan this code first to activate/select this assignment, then scan any student's member card to log completion!
              </p>

              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col items-center justify-center space-y-4">
                <h4 className="font-bold text-xs text-slate-700">{activeAsm.name}</h4>
                
                {/* Real Barcode & QR Code */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm w-full space-y-5">
                  {/* Barcode Section */}
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Barcode Only (CODE128)</span>
                    <div className="bg-white p-2 rounded-lg border border-slate-100 flex items-center justify-center">
                      <canvas id="standalone-asm-barcode" className="max-w-full h-16"></canvas>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadBarcodeImage(activeAsm.id, `Assignment_${activeAsm.name}`)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      Save Barcode Only
                    </button>
                  </div>

                  <div className="border-t border-slate-100 w-full" />

                  {/* QR Code Section */}
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">QR Code Only</span>
                    <div className="bg-white p-2 rounded-lg border border-slate-100 flex items-center justify-center">
                      <canvas id="standalone-asm-qrcode" className="w-24 h-24"></canvas>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadQrImage(activeAsm.id, `Assignment_${activeAsm.name}_QR`)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      Save QR Code Only
                    </button>
                  </div>
                </div>
                
                <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-200/60 border border-slate-300/40 px-2.5 py-1 rounded-md uppercase">
                  CODE: {activeAsm.id}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowAsmBarcodeModal(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadBarcodeImage(activeAsm.id, `Assignment_${activeAsm.name}`);
                  downloadQrImage(activeAsm.id, `Assignment_${activeAsm.name}_QR`);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4 text-slate-200" />
                Download Both
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

interface PrintBadgeCardPreviewProps {
  key?: string | number;
  student: Student;
  activeAsm: Assignment;
  bulkThemeId: string;
  bulkPrintColorMode: 'color' | 'mono';
  bulkBarcodeOption: 'both' | 'barcode_only' | 'qr_only';
  bulkSeparator: string;
}

function PrintBadgeCardPreview({
  student,
  activeAsm,
  bulkThemeId,
  bulkPrintColorMode,
  bulkBarcodeOption,
  bulkSeparator
}: PrintBadgeCardPreviewProps) {
  const [barcodeUrl, setBarcodeUrl] = useState<string>('');
  const [qrUrl, setQrUrl] = useState<string>('');

  React.useEffect(() => {
    let active = true;
    const value = `${student.id}${bulkSeparator}${activeAsm.id}`;
    
    // Generate Barcode
    if (bulkBarcodeOption === 'both' || bulkBarcodeOption === 'barcode_only') {
      try {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, value, {
          format: 'CODE128',
          width: 1.2,
          height: 36,
          displayValue: true,
          fontSize: 7,
          font: 'monospace',
          margin: 0,
          background: 'transparent',
          lineColor: '#000000'
        });
        if (active) {
          setBarcodeUrl(canvas.toDataURL('image/png'));
        }
      } catch (err) {
        console.error('Failed to render preview barcode:', err);
      }
    } else {
      setBarcodeUrl('');
    }

    // Generate QR Code
    if (bulkBarcodeOption === 'both' || bulkBarcodeOption === 'qr_only') {
      QRCode.toDataURL(value, {
        width: 150,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }).then((url) => {
        if (active) setQrUrl(url);
      }).catch((err) => {
        console.error('Failed to render preview QR:', err);
      });
    } else {
      setQrUrl('');
    }

    return () => {
      active = false;
    };
  }, [student.id, activeAsm.id, bulkSeparator, bulkBarcodeOption]);

  const currentTheme = LABEL_THEMES.find((t) => t.id === bulkThemeId) || LABEL_THEMES[0];
  const isColor = bulkPrintColorMode === 'color';

  const cardBgStyle = isColor ? currentTheme.printBg : '#ffffff';
  const cardTextColor = isColor ? currentTheme.printText : '#0f172a';
  const cardBorderColor = isColor ? currentTheme.printBorder : '#0f172a';
  const cardBorder = isColor ? `1.5px solid ${cardBorderColor}` : '2.5px solid #0f172a';
  const badgeBgStyle = isColor 
    ? { background: currentTheme.printBadgeBg, color: currentTheme.printBadgeText, border: '1.5px solid rgba(255,255,255,0.1)' }
    : { background: '#f1f5f9', color: '#334155', border: '1.5px solid #cbd5e1' };
  
  const dashedBorderColor = isColor ? 'rgba(255,255,255,0.2)' : '#cbd5e1';

  return (
    <div 
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        border: cardBorder,
        borderRadius: '12px',
        padding: '12px',
        width: '260px',
        height: '140px',
        background: cardBgStyle,
        color: cardTextColor,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        float: 'left',
        margin: '7px'
      }}
      className="shrink-0 text-left"
    >
      {/* Header: Category & Points */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.95 }}>
        <span>{activeAsm.category} • {activeAsm.subject || 'GENERAL'}</span>
        <span style={{ ...badgeBgStyle, padding: '1.5px 5px', borderRadius: '4px', fontWeight: 800 }}>+{activeAsm.pointsValue} PTS</span>
      </div>
      
      {/* Assignment Title */}
      <div style={{ lineHeight: 1.1, marginTop: '4px', flexGrow: 1 }}>
        <div style={{ fontSize: '11px', fontWeight: 800, maxHeight: '24px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeAsm.name}</div>
        <div style={{ fontSize: '9px', fontWeight: 700, marginTop: '4px', color: isColor ? '#e2e8f0' : '#475569' }}>{student.name}</div>
      </div>

      {/* Barcode / QR Codes */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', marginTop: 'auto', borderTop: `1px dashed ${dashedBorderColor}`, paddingTop: '6px', minHeight: '42px' }}>
        {(bulkBarcodeOption === 'both' || bulkBarcodeOption === 'barcode_only') && (
          <div style={{ 
            flex: 1, 
            maxWidth: '160px', 
            height: '42px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: isColor ? '#ffffff' : 'transparent', 
            borderRadius: isColor ? '6px' : '0px', 
            padding: isColor ? '3px' : '0px', 
            boxSizing: 'border-box' 
          }}>
            {barcodeUrl ? (
              <img src={barcodeUrl} alt="Barcode" style={{ maxHeight: '36px', width: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{ color: '#cbd5e1', fontSize: '8px' }}>Generating...</span>
            )}
          </div>
        )}
        {(bulkBarcodeOption === 'both' || bulkBarcodeOption === 'qr_only') && (
          <div style={{ 
            width: '44px', 
            height: '44px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: isColor ? '#ffffff' : 'transparent', 
            borderRadius: isColor ? '6px' : '0px', 
            padding: isColor ? '2px' : '0px', 
            boxSizing: 'border-box' 
          }}>
            {qrUrl ? (
              <img src={qrUrl} alt="QR Code" style={{ width: '40px', height: '40px' }} />
            ) : (
              <span style={{ color: '#cbd5e1', fontSize: '8px' }}>QR</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
