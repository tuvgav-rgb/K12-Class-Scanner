/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { Student, StoreItem } from '../types';
import { Barcode, QRCodeImage } from './BarcodeComponents';
import { jsPDF } from 'jspdf';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

interface StoreViewProps {
  students: Student[];
  storeItems: StoreItem[];
  activeStudentId: string | null;
  onSelectStudent: (studentId: string | null) => void;
  onAddStoreItem: (name: string, cost: number, description: string, stock: number, category: StoreItem['category'], iconName: string, imageUrl?: string) => void;
  onArchiveStoreItem: (itemId: string) => void;
  onRestoreStoreItem: (itemId: string) => void;
  onDeleteStoreItem: (itemId: string) => void;
  onPermanentlyDeleteStoreItem: (itemId: string) => void;
  onCheckout: (studentId: string, itemId: string) => boolean;
}

export default function StoreView({
  students,
  storeItems,
  activeStudentId,
  onSelectStudent,
  onAddStoreItem,
  onArchiveStoreItem,
  onRestoreStoreItem,
  onDeleteStoreItem,
  onPermanentlyDeleteStoreItem,
  onCheckout
}: StoreViewProps) {
  // UI states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCost, setNewItemCost] = useState(50);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemStock, setNewItemStock] = useState(10);
  const [newItemCategory, setNewItemCategory] = useState<StoreItem['category']>('Privileges');
  const [newItemIcon, setNewItemIcon] = useState('Gift');
  const [newItemImage, setNewItemImage] = useState('');
  const [storeCodeDisplayOption, setStoreCodeDisplayOption] = useState<'both' | 'barcode' | 'qr'>('both');
  const [selectedZoomItem, setSelectedZoomItem] = useState<StoreItem | null>(null);

  const activeStoreItems = storeItems.filter((item) => !item.archived);
  const archivedStoreItems = storeItems.filter((item) => item.archived);

  const handleItemImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItemImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const activeStudent = students.find((s) => s.id === activeStudentId) || null;

  const downloadQRCode = (item: StoreItem) => {
    QRCode.toDataURL(item.id, { width: 400, margin: 1 })
      .then((url) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `QR_Store_${item.id}_${item.name.replace(/\s+/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch((err) => console.error('Error downloading QR Code:', err));
  };

  const copyStoreCode = (id: string) => {
    navigator.clipboard.writeText(id);
    alert(`Store Item ID "${id}" copied to clipboard!`);
  };

  const handlePrintPrize = async (item: StoreItem) => {
    const element = document.getElementById('print-area-wrapper');
    if (element) {
      // Generate QR Code dynamic URL
      const qrUrl = await QRCode.toDataURL(item.id, { width: 150, margin: 1 });
      
      const barcodeHtml = (storeCodeDisplayOption === 'both' || storeCodeDisplayOption === 'barcode')
        ? `<div style="display: flex; flex-direction: column; align-items: center; width: 100%; margin-top: 8px;"><svg id="print-bc-svg" style="width: 250px; height: 60px;"></svg></div>`
        : '';

      const qrHtml = (storeCodeDisplayOption === 'both' || storeCodeDisplayOption === 'qr')
        ? `<div style="display: flex; flex-direction: column; align-items: center; margin-top: 8px;"><img src="${qrUrl}" style="width: 100px; height: 100px; object-fit: contain;" /></div>`
        : '';

      const imgHtml = item.imageUrl
        ? `<div style="display: flex; justify-content: center; margin: 4px 0;"><img src="${item.imageUrl}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 12px; border: 1.5px solid #0f172a;" /></div>`
        : '';

      element.innerHTML = `
        <div class="print-voucher" style="padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff;">
          <div style="font-family: system-ui, -apple-system, sans-serif; border: 3px solid #0f172a; border-radius: 20px; padding: 24px; width: 450px; background: #ffffff; color: #0f172a; box-sizing: border-box; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: center; justify-content: space-between; border-b: 2px solid #0f172a; padding-bottom: 12px;">
              <div style="font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #2563eb;">OAKRIDGE CLASSSTORE</div>
              <div style="font-size: 10px; font-weight: bold; background: #f1f5f9; padding: 4px 8px; border-radius: 6px;">${item.category}</div>
            </div>
            
            ${imgHtml}

            <div style="text-align: center; margin: 4px 0;">
              <div style="font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">${item.name}</div>
              <div style="font-size: 12px; color: #64748b; line-height: 1.4;">${item.description || 'Classroom prize reward item'}</div>
            </div>

            <div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin: 4px 0;">
              <span style="font-size: 16px; font-weight: 900; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; padding: 6px 16px; border-radius: 12px;">
                Cost: ${item.cost} points
              </span>
              <span style="font-size: 11px; color: #64748b; font-weight: bold; font-family: monospace;">
                ID: ${item.id}
              </span>
            </div>

            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; border-top: 1.5px dashed #cbd5e1; padding-top: 14px; margin-top: 4px;">
              <div style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Scan to Redeem / Checkout</div>
              ${barcodeHtml}
              ${qrHtml}
            </div>
            
            <div style="text-align: center; font-size: 9px; color: #94a3b8; font-weight: 500; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 4px;">
              Oakridge Academy Economy System • Generated on ${new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      `;

      // Render barcode if needed
      if (storeCodeDisplayOption === 'both' || storeCodeDisplayOption === 'barcode') {
        const svgElement = document.getElementById('print-bc-svg');
        if (svgElement) {
          JsBarcode(svgElement, item.id, {
            format: 'CODE128',
            width: 1.5,
            height: 50,
            displayValue: true
          });
        }
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
  };

  const handlePrintCatalog = async () => {
    const element = document.getElementById('print-area-wrapper');
    if (!element) return;

    if (!activeStoreItems || activeStoreItems.length === 0) {
      alert('There are no active reward items in your store to print!');
      return;
    }

    let itemsHtml = '';
    // Generate QR codes sequentially to avoid racing
    for (const item of activeStoreItems) {
      let qrUrl = '';
      try {
        qrUrl = await QRCode.toDataURL(item.id || 'N/A', { width: 100, margin: 1 });
      } catch (err) {
        console.error('Error generating QR for catalog item:', item.id, err);
      }
      
      const barcodeHtml = (storeCodeDisplayOption === 'both' || storeCodeDisplayOption === 'barcode')
        ? `<div style="display: flex; justify-content: center;"><svg id="catalog-bc-svg-${item.id}" style="height: 32px; width: 130px;"></svg></div>`
        : '';
        
      const qrHtml = (storeCodeDisplayOption === 'both' || storeCodeDisplayOption === 'qr')
        ? `<div style="display: flex; justify-content: center;"><img src="${qrUrl}" style="width: 44px; height: 44px; object-fit: contain;" /></div>`
        : '';

      const imgHtml = item.imageUrl
        ? `<img src="${item.imageUrl}" style="width: 55px; height: 55px; object-fit: cover; border-radius: 8px; border: 1.5px solid #0f172a; margin-right: 4px;" />`
        : `<div style="width: 55px; height: 55px; border-radius: 8px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; border: 1px solid #cbd5e1; margin-right: 4px; color: #475569;"><svg style="width: 24px; height: 24px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg></div>`;

      itemsHtml += `
        <div style="border: 1.5px solid #0f172a; border-radius: 12px; padding: 12px; background: #fff; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; page-break-inside: avoid; height: 185px;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 8px; font-weight: 800; background: #e2e8f0; border: 1px solid #cbd5e1; padding: 1.5px 5px; border-radius: 4px; text-transform: uppercase;">${item.category}</span>
              <span style="font-size: 9px; font-family: monospace; font-weight: bold; color: #64748b;">${item.id}</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: start;">
              ${imgHtml}
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 11.5px; font-weight: 800; color: #0f172a; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.name}</div>
                <div style="font-size: 8.5px; color: #475569; margin-top: 3px; line-height: 1.25; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${item.description || 'Classroom prize reward item'}</div>
              </div>
            </div>
          </div>
          
          <div style="margin-top: auto; padding-top: 6px; border-top: 1px dashed #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              ${barcodeHtml}
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              ${qrHtml}
              <div style="font-size: 10px; font-weight: 900; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; padding: 3px 8px; border-radius: 6px; white-space: nowrap;">
                ${item.cost} pts
              </div>
            </div>
          </div>
        </div>
      `;
    }

    element.innerHTML = `
      <div class="print-catalog" style="padding: 24px; background: #fff; font-family: system-ui, -apple-system, sans-serif;">
        <div style="border-bottom: 3px solid #0f172a; padding-bottom: 8px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <h1 style="font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Oakridge Academy</h1>
            <p style="font-size: 10px; color: #475569; margin: 3px 0 0 0; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Classroom Reward System • Prizes Catalog</p>
          </div>
          <div style="text-align: right; font-size: 9px; color: #94a3b8; font-weight: bold;">
            Total items: ${activeStoreItems.length} • Generated on ${new Date().toLocaleDateString()}
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          ${itemsHtml}
        </div>
      </div>
    `;

    // Render barcodes for each item
    if (storeCodeDisplayOption === 'both' || storeCodeDisplayOption === 'barcode') {
      activeStoreItems.forEach((item) => {
        const svgElement = document.getElementById(`catalog-bc-svg-${item.id}`);
        if (svgElement) {
          JsBarcode(svgElement, item.id, {
            format: 'CODE128',
            width: 1.1,
            height: 25,
            displayValue: false,
            margin: 0
          });
        }
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
    }, 300);
  };

  const downloadBarcode = (item: StoreItem) => {
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, item.id, {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 12,
        lineColor: '#0f172a',
        background: '#ffffff'
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Barcode_Store_${item.id}_${item.name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading barcode:', err);
      alert('Failed to generate barcode for download.');
    }
  };

  const exportToWord = async (item: StoreItem) => {
    // Generate QR code Data URL
    let qrUrl = '';
    try {
      qrUrl = await QRCode.toDataURL(item.id, { width: 150, margin: 1 });
    } catch (e) {
      console.error('Error generating QR URL for Word:', e);
    }

    // Generate Barcode Data URL
    let barcodeUrl = '';
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, item.id, {
        format: 'CODE128',
        width: 1.5,
        height: 50,
        displayValue: true,
        fontSize: 10,
        lineColor: '#0f172a',
        background: '#ffffff'
      });
      barcodeUrl = canvas.toDataURL('image/png');
    } catch (e) {
      console.error('Error generating Barcode URL for Word:', e);
    }

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>${item.name}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background-color: #f8fafc; }
        .card { border: 2px solid #0f172a; border-radius: 16px; padding: 30px; max-width: 500px; margin: auto; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; text-align: center; }
        .school { font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 1.5px; }
        .category { font-size: 10px; font-weight: bold; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px; }
        .title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 15px 0 10px 0; }
        .description { font-size: 13px; color: #475569; line-height: 1.5; margin-bottom: 20px; }
        .footer-info { display: table; width: 100%; border-top: 1.5px dashed #cbd5e1; padding-top: 15px; margin-top: 20px; }
        .cost-box { font-size: 16px; font-weight: bold; color: #b45309; background-color: #fef3c7; border: 1px solid #fde68a; padding: 8px 16px; border-radius: 8px; text-align: center; }
        .id-box { font-size: 11px; font-family: monospace; color: #64748b; font-weight: bold; text-align: center; margin-top: 8px; }
      </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="school">OAKRIDGE CLASSSTORE</div>
            <div class="category">${item.category}</div>
          </div>
          <div style="text-align: center;">
            ${item.imageUrl ? `<img src="${item.imageUrl}" style="width: 150px; height: 150px; object-fit: cover; border-radius: 12px; margin-bottom: 15px;" />` : ''}
            <div class="title">${item.name}</div>
            <p class="description">${item.description || 'Classroom prize reward item'}</p>
            <div class="cost-box">Cost: ${item.cost} Points</div>
            <div class="id-box">Item Reference: ${item.id}</div>
            
            <div style="margin-top: 20px; border-top: 1px dashed #cbd5e1; padding-top: 15px;">
              <div style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Scannable Codes</div>
              <table style="margin: auto; border-collapse: collapse;">
                <tr>
                  ${barcodeUrl ? `<td style="padding: 10px; text-align: center;"><img src="${barcodeUrl}" style="width: 200px; height: 60px;" /></td>` : ''}
                  ${qrUrl ? `<td style="padding: 10px; text-align: center;"><img src="${qrUrl}" style="width: 80px; height: 80px;" /></td>` : ''}
                </tr>
              </table>
            </div>
          </div>
          <div class="footer-info">
            <p style="font-size: 10px; color: #94a3b8; text-align: center; margin: 10px 0 0 0;">
              Oakridge Academy Economy System • Voucher Export
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${item.name.replace(/\s+/g, '_')}_Prize_Voucher.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async (item: StoreItem) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Draw background card container (fill only, no border yet)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 15, 180, 130, 4, 4, 'F');

    // Accent Header Banner (with rounded top corners matching the container ticket card, and sharp bottom corners)
    doc.setFillColor(37, 99, 235); // blue-600
    doc.roundedRect(15.1, 15.1, 179.8, 18, 4, 4, 'F');
    doc.rect(15.1, 23, 179.8, 10, 'F'); // covers the rounded bottom corners of the header banner to make them flat

    // Draw ticket container border on top of everything!
    doc.setDrawColor(15, 23, 42); // slate-900
    doc.setLineWidth(1.2);
    doc.roundedRect(15, 15, 180, 130, 4, 4, 'S');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('OAKRIDGE CLASSSTORE PRIZE VOUCHER', 22, 26);

    // Badge Category
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(145, 20, 42, 8, 1.5, 1.5, 'F');
    doc.setTextColor(37, 99, 235); // blue-600
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(item.category.toUpperCase(), 148, 25.5);

    // Item Title
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(item.name, 22, 48);

    // Item Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105); // slate-600
    const splitDesc = doc.splitTextToSize(item.description || 'Classroom prize reward item', 115);
    doc.text(splitDesc, 22, 58);

    // Cost box
    doc.setFillColor(254, 243, 199); // amber-100
    doc.roundedRect(22, 85, 55, 12, 2, 2, 'F');
    doc.setTextColor(180, 83, 9); // amber-700
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Cost: ${item.cost} points`, 26, 92.5);

    // Item ID
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.text(`ID Reference: ${item.id}`, 22, 108);

    // Render image if exists
    if (item.imageUrl) {
      try {
        doc.addImage(item.imageUrl, 'PNG', 142, 45, 45, 45);
      } catch (err) {
        console.error('Failed to embed custom image in PDF:', err);
      }
    }

    // Embed Barcode (Higher resolution for pixel-perfect print quality)
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, item.id, {
        format: 'CODE128',
        width: 8, // Super high resolution bars (8 pixels per bar)
        height: 200, // Taller barcode image (200 pixels)
        displayValue: true,
        fontSize: 16,
        lineColor: '#000000', // Solid crisp black lines
        background: '#ffffff'
      });
      const barcodeUrl = canvas.toDataURL('image/png');
      doc.addImage(barcodeUrl, 'PNG', 22, 113, 65, 14, undefined, 'FAST');
    } catch (err) {
      console.error('Failed to add Barcode to PDF:', err);
    }

    // Embed QR Code (Higher resolution for pristine print quality)
    try {
      const qrUrl = await QRCode.toDataURL(item.id, { width: 400, margin: 1 });
      doc.addImage(qrUrl, 'PNG', 95, 113, 14, 14);
    } catch (err) {
      console.error('Failed to add QR Code to PDF:', err);
    }

    // Dash Line Divider
    doc.setDrawColor(203, 213, 225); // slate-200
    doc.setLineDashPattern([2, 2], 0);
    doc.line(15, 133, 195, 133);
    doc.setLineDashPattern([], 0); // Reset dash

    // Footer copyright
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Generated on ${new Date().toLocaleDateString()} • Oakridge Academy Economy System`, 22, 140);

    doc.save(`${item.name.replace(/\s+/g, '_')}_Prize_Voucher.pdf`);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    onAddStoreItem(
      newItemName,
      newItemCost,
      newItemDesc,
      newItemStock,
      newItemCategory,
      newItemIcon,
      newItemImage || undefined
    );

    setNewItemName('');
    setNewItemDesc('');
    setNewItemCost(50);
    setNewItemStock(10);
    setNewItemImage('');
    setShowAddForm(false);
  };

  // Dynamically resolve lucide icons
  const renderItemIcon = (iconName: string, className = "w-5 h-5") => {
    const IconComponent = (Icons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
    return <Icons.Gift className={className} />; // fallback
  };

  // Category Theme Mapper
  const getCategoryTheme = (category: StoreItem['category']) => {
    switch (category) {
      case 'Privileges': return { bg: 'bg-blue-50 border-blue-100', text: 'text-blue-700', textLight: 'text-blue-400' };
      case 'Supplies': return { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', textLight: 'text-emerald-400' };
      case 'Snacks': return { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', textLight: 'text-amber-400' };
      case 'Prizes': return { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-700', textLight: 'text-rose-400' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Classroom Store & Economy</h2>
          <p className="text-xs text-slate-500 font-medium">Redeem student performance points for privileges, school supplies, snacks, and prizes</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handlePrintCatalog()}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold py-2.5 px-4 rounded-xl text-xs shadow-sm transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Icons.Printer className="w-4 h-4 text-slate-500" />
            Print Prizes Catalog
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-blue-100 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Icons.PlusCircle className="w-4 h-4" />
            {showAddForm ? 'Hide Form' : 'Add Store Item'}
          </button>
        </div>
      </div>

      {/* Add Store Item Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddItem}
          className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm space-y-4 max-w-2xl"
        >
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
            <Icons.ShoppingBag className="w-4 h-4 text-blue-500" /> Create Reward Item
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Item Name</label>
              <input
                type="text"
                placeholder="e.g. Free Draw Time (15m)"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category</label>
              <select
                value={newItemCategory}
                onChange={e => setNewItemCategory(e.target.value as StoreItem['category'])}
                className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-semibold"
              >
                <option value="Privileges">Privileges</option>
                <option value="Supplies">Supplies</option>
                <option value="Snacks">Snacks</option>
                <option value="Prizes">Prizes</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Points Cost</label>
              <input
                type="number"
                min="5"
                max="500"
                value={newItemCost}
                onChange={e => setNewItemCost(parseInt(e.target.value) || 20)}
                required
                className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stock Level (Inventory)</label>
              <input
                type="number"
                min="0"
                value={newItemStock}
                onChange={e => setNewItemStock(parseInt(e.target.value) || 0)}
                required
                className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Visual Icon representation</label>
              <select
                value={newItemIcon}
                onChange={e => setNewItemIcon(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-semibold"
              >
                <option value="Crown">Crown (Privileges)</option>
                <option value="Pencil">Pencil (Supplies)</option>
                <option value="FileText">FilePass (Passes)</option>
                <option value="Cookie">Cookie (Snacks)</option>
                <option value="Sparkles">Sparkles (Stickers / Toys)</option>
                <option value="Coffee">Coffee (Teacher Lunch / Cocoa)</option>
                <option value="Users">Users (Team Captain)</option>
                <option value="BookOpen">BookOpen (Library Reward)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reward Image (Optional)</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleItemImageUpload}
                  className="hidden"
                  id="store-item-image-upload"
                />
                <label
                  htmlFor="store-item-image-upload"
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 py-2 px-3 rounded-xl text-xs focus:outline-none text-slate-600 font-semibold text-center cursor-pointer flex items-center justify-center gap-1.5 transition-colors border-dashed truncate"
                >
                  <Icons.Upload className="w-3.5 h-3.5 text-slate-400" />
                  {newItemImage ? 'Image Selected ✓' : 'Upload Image'}
                </label>
                {newItemImage && (
                  <button
                    type="button"
                    onClick={() => setNewItemImage('')}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 px-1 shrink-0"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Item Description</label>
            <textarea
              placeholder="Detail what exactly this reward entitles the student to."
              value={newItemDesc}
              onChange={e => setNewItemDesc(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewItemName('');
                setNewItemDesc('');
              }}
              className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-xl text-xs shadow-md shadow-blue-100 transition-all cursor-pointer"
            >
              Onboard Store Item
            </button>
          </div>
        </form>
      )}

      {/* Main Layout: Catalog Left, Checkout Console Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Catalog Items Grid (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pl-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Rewards Catalog</span>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200/50">
              <span className="text-[9px] text-slate-400 font-bold px-2 uppercase tracking-wide">Show:</span>
              <button
                type="button"
                onClick={() => setStoreCodeDisplayOption('both')}
                className={`text-[9px] font-extrabold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  storeCodeDisplayOption === 'both' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Both
              </button>
              <button
                type="button"
                onClick={() => setStoreCodeDisplayOption('barcode')}
                className={`text-[9px] font-extrabold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  storeCodeDisplayOption === 'barcode' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Barcode Only
              </button>
              <button
                type="button"
                onClick={() => setStoreCodeDisplayOption('qr')}
                className={`text-[9px] font-extrabold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  storeCodeDisplayOption === 'qr' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                QR Only
              </button>
            </div>
          </div>
          
          {activeStoreItems.length === 0 ? (
            <div className="bg-white border border-slate-200/85 p-12 rounded-3xl text-center text-slate-400 shadow-sm flex flex-col items-center justify-center">
              <Icons.ShoppingBag className="w-12 h-12 opacity-30 mb-2" />
              <p className="font-semibold text-slate-600 text-xs">Catalog is Empty</p>
              <p className="text-[10px] mt-1 max-w-[200px]">Click "Add Store Item" to create point rewards for your classroom.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeStoreItems.map((item) => {
                const isOutOfStock = item.stock <= 0;
                const theme = getCategoryTheme(item.category);
                
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedZoomItem(item)}
                    className={`bg-white border rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-3 relative transition-all duration-200 group border-slate-200/85 hover:border-slate-300 hover:-translate-y-0.5 cursor-pointer ${
                      isOutOfStock ? 'opacity-65' : ''
                    }`}
                  >
                    {/* Header tags */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold tracking-wider uppercase ${theme.bg} ${theme.text}`}>
                        {item.category}
                      </span>
                      <span className="font-mono text-[9px] font-bold text-slate-400 uppercase bg-slate-50 border border-slate-200/50 px-1.5 py-0.5 rounded">
                        {item.id}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex items-start gap-3.5 mt-1">
                      {/* Round visual icon or Custom Image */}
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-slate-200/60 shadow-sm"
                        />
                      ) : (
                        <div className={`p-3 rounded-2xl shrink-0 shadow-sm ${theme.bg} ${theme.text}`}>
                          {renderItemIcon(item.iconName, "w-6.5 h-6.5")}
                        </div>
                      )}

                      {/* Title & description */}
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors truncate">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 leading-normal font-medium line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Footer barcode and buy details */}
                    <div className="border-t border-slate-100/80 pt-3.5 mt-1.5 flex items-center justify-between gap-2.5">
                      {/* Small codes that are scan-compliant! */}
                      <div className="flex items-center gap-2">
                        {(storeCodeDisplayOption === 'both' || storeCodeDisplayOption === 'barcode') && (
                          <div className="w-[85px] hover:scale-105 transition-all">
                            <Barcode value={item.id} displayValue={false} height={14} width={1.0} />
                          </div>
                        )}
                        {(storeCodeDisplayOption === 'both' || storeCodeDisplayOption === 'qr') && (
                          <div className="w-[28px] h-[28px] hover:scale-105 transition-all shrink-0">
                            <QRCodeImage value={item.id} size={28} />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-0.5 font-bold shrink-0">
                        <span className="bg-amber-50 text-amber-800 border border-amber-100 py-0.5 px-2 rounded-lg text-xs flex items-center gap-1 shadow-sm">
                          {item.cost} <span className="text-[9px] font-medium text-amber-500">pts</span>
                        </span>
                        
                        <span className={`text-[9px] font-semibold ${isOutOfStock ? 'text-rose-500' : 'text-slate-400'}`}>
                          {isOutOfStock ? 'Out of stock' : `${item.stock} left`}
                        </span>
                      </div>
                    </div>

                    {/* Hover controls for save/delete */}
                    <div className="absolute right-3.5 top-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchiveStoreItem(item.id);
                        }}
                        className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                        title="Save for Later (Archive)"
                      >
                        <Icons.Archive className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteStoreItem(item.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                        title={item.wasArchived ? 'Remove from Store' : 'Delete Permanently'}
                      >
                        <Icons.Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Saved for Later Section */}
          <div className="mt-8 pt-6 border-t border-slate-200/60">
            <button
              type="button"
              onClick={() => setShowArchive(!showArchive)}
              className="flex items-center justify-between w-full p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-250 rounded-2xl transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Icons.Archive className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Saved for Later / Reusable Library
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {archivedStoreItems.length} items archived for next school year or future reuse
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span>{showArchive ? 'Hide' : 'Show Library'}</span>
                <Icons.ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showArchive ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {showArchive && (
              <div className="mt-4 bg-white border border-slate-200/85 rounded-2xl p-4 space-y-3.5 animate-fade-in shadow-sm">
                {archivedStoreItems.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-[11px] font-medium flex flex-col items-center justify-center gap-1.5">
                    <Icons.ArchiveRestore className="w-8 h-8 opacity-30" />
                    <span>No archived items in your library yet.</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Click the Archive icon on any active item to save it for later.
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {archivedStoreItems.map((item) => {
                      const theme = getCategoryTheme(item.category);
                      return (
                        <div
                          key={item.id}
                          className="border border-slate-150 rounded-xl p-3 flex flex-col justify-between gap-3 bg-slate-50/40 relative group"
                        >
                          <div className="flex items-center justify-between">
                            <span className={`px-1.5 py-0.5 rounded border text-[8px] font-bold tracking-wider uppercase ${theme.bg} ${theme.text}`}>
                              {item.category}
                            </span>
                            <span className="font-mono text-[8px] font-bold text-slate-400 bg-white border px-1.5 py-0.5 rounded">
                              {item.id}
                            </span>
                          </div>

                          <div className="flex items-start gap-2.5">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                              />
                            ) : (
                              <div className={`p-2 rounded-xl ${theme.bg} ${theme.text}`}>
                                {renderItemIcon(item.iconName, "w-5 h-5")}
                              </div>
                            )}
                            <div className="space-y-0.5 min-w-0">
                              <h5 className="text-[11px] font-bold text-slate-700 leading-tight truncate">
                                {item.name}
                              </h5>
                              <p className="text-[9px] text-slate-400 line-clamp-1 leading-normal font-medium">
                                {item.description}
                              </p>
                              <div className="text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-1.5 py-0.5 inline-block mt-1">
                                Cost: {item.cost} pts
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 border-t border-slate-100 pt-2 mt-0.5">
                            <button
                              type="button"
                              onClick={() => onRestoreStoreItem(item.id)}
                              className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2.5 rounded-lg text-[10px] transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                            >
                              <Icons.Plus className="w-3 h-3" />
                              Add to Store
                            </button>
                            <button
                              type="button"
                              onClick={() => onPermanentlyDeleteStoreItem(item.id)}
                              className="bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 p-1.5 rounded-lg transition-all cursor-pointer"
                              title="Delete Permanently"
                            >
                              <Icons.Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Checkout Console Panel (1 Col) */}
        <div className="space-y-4">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider pl-1">POS Checkout</span>
          
          <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Icons.QrCode className="w-4.5 h-4.5 text-blue-500" /> Active Transaction
            </h3>

            {/* Buyer status box */}
            {activeStudent ? (
              <div className="space-y-4 animate-fade-in">
                {/* Visual badge card */}
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3.5 relative overflow-hidden shadow-inner">
                  {/* Avatar initials */}
                  <div className="w-9.5 h-9.5 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {activeStudent.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-blue-900 block leading-tight">{activeStudent.name}</span>
                    <span className="text-[10px] text-blue-600 block font-semibold mt-0.5">Active Buyer Selected</span>
                  </div>
                  
                  {/* Floating balance badge */}
                  <div className="ml-auto flex flex-col items-end shrink-0 font-bold">
                    <span className="text-xs text-blue-900">{activeStudent.points}</span>
                    <span className="text-[8px] uppercase tracking-wider text-blue-400">Pts</span>
                  </div>

                  <button
                    onClick={() => onSelectStudent(null)}
                    className="absolute right-2 top-2 text-blue-300 hover:text-blue-600 text-xs font-bold"
                    title="Cancel active buyer"
                  >
                    ✕
                  </button>
                </div>

                {/* State: Awaiting item swipe banner */}
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-center space-y-3.5 shadow-sm border-dashed">
                  <div className="mx-auto w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 animate-pulse">
                    <Icons.ScanLine className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Awaiting Item Scan</h4>
                    <p className="text-[10px] text-slate-400 leading-normal max-w-[200px] mx-auto font-medium">
                      Aim your physical scanner gun at any item's barcode in the catalog to redeem points!
                    </p>
                  </div>
                </div>

                {/* Direct Checkout Catalog Clicks (Alternate Click fallback for prototype) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider pl-0.5">Manual Purchase click</span>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto divide-y divide-slate-50 border border-slate-100 rounded-xl p-1.5">
                    {activeStoreItems.map((item) => {
                      const disabled = item.stock <= 0 || activeStudent.points < item.cost;
                      return (
                        <div key={item.id} className="flex items-center justify-between py-1.5 px-2 text-xs font-medium">
                          <span className="truncate max-w-[120px] text-slate-700 font-semibold">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 shrink-0">{item.cost} pts</span>
                            <button
                              onClick={() => onCheckout(activeStudent.id, item.id)}
                              disabled={disabled}
                              className={`py-1 px-3 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                                disabled
                                  ? 'bg-slate-100 text-slate-300 border border-slate-200 pointer-events-none'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                                Buy Direct
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center py-8">
                <Icons.UserCircle2 className="w-12 h-12 text-slate-300 mx-auto opacity-70 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Swipe Student Card</h4>
                  <p className="text-[10px] text-slate-400 leading-normal max-w-[200px] mx-auto font-medium">
                    Redeem a reward. Scan any student's member card to make them the active buyer.
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-4 text-left space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider pl-1.5">Or Choose Student manually</span>
                  <select
                    onChange={(e) => onSelectStudent(e.target.value || null)}
                    className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-semibold"
                    defaultValue=""
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.points} pts)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Zoomed Lightbox Modal for Prize Card */}
      {selectedZoomItem && (
        <div 
          className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
          onClick={() => setSelectedZoomItem(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative border border-slate-100 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header backdrop color match category */}
            <div className={`p-6 pb-4 flex items-center justify-between border-b border-slate-100 ${getCategoryTheme(selectedZoomItem.category).bg}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-white shadow-sm ${getCategoryTheme(selectedZoomItem.category).text}`}>
                  {renderItemIcon(selectedZoomItem.iconName, "w-6 h-6")}
                </div>
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${getCategoryTheme(selectedZoomItem.category).text}`}>
                    {selectedZoomItem.category}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-800 leading-tight">
                    {selectedZoomItem.name}
                  </h3>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedZoomItem(null)}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-sm shadow-sm transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Render custom reward image if uploaded */}
              {selectedZoomItem.imageUrl && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200/60 shadow-sm max-h-[160px] flex items-center justify-center bg-slate-50 shrink-0">
                  <img
                    src={selectedZoomItem.imageUrl}
                    alt={selectedZoomItem.name}
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Description</span>
                <p className="text-xs text-slate-500 leading-relaxed font-medium bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                  {selectedZoomItem.description || "No description provided for this classroom prize reward item."}
                </p>
              </div>

              {/* Price and Stock Row */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-amber-50/60 border border-amber-100/80 rounded-2xl p-3 text-center">
                  <span className="text-[9px] uppercase font-bold text-amber-500 block tracking-wider mb-0.5">Redeem Value</span>
                  <div className="text-lg font-black text-amber-800 flex items-center justify-center gap-1">
                    {selectedZoomItem.cost} <span className="text-xs font-semibold text-amber-600">Points</span>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-3 text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider mb-0.5">Availability</span>
                  <div className="text-lg font-black text-slate-700">
                    {selectedZoomItem.stock <= 0 ? (
                      <span className="text-rose-600">Sold Out</span>
                    ) : (
                      <span>{selectedZoomItem.stock} <span className="text-xs font-semibold text-slate-500">left</span></span>
                    )}
                  </div>
                </div>
              </div>

              {/* Large Code Scanning Zone */}
              <div className="border border-slate-100 bg-slate-50/50 rounded-3xl p-4 text-center space-y-3.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Scanning Code</span>
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-white border px-2 py-0.5 rounded-md shadow-sm">
                    {selectedZoomItem.id}
                  </span>
                </div>

                {/* Main Code Layouts */}
                <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-inner">
                  {storeCodeDisplayOption === 'both' && (
                    <div className="grid grid-cols-5 gap-4 items-center">
                      {/* Barcode section (3 cols) */}
                      <div id="zoom-barcode" className="col-span-3 flex flex-col items-center justify-center border-r border-slate-100 pr-2">
                        <Barcode value={selectedZoomItem.id} displayValue={true} height={50} width={1.8} />
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Barcode Scanner</span>
                      </div>

                      {/* QR Code section (2 cols) */}
                      <div id="zoom-qr-code" className="col-span-2 flex flex-col items-center justify-center">
                        <QRCodeImage value={selectedZoomItem.id} size={90} />
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">QR Code</span>
                      </div>
                    </div>
                  )}

                  {storeCodeDisplayOption === 'barcode' && (
                    <div id="zoom-barcode" className="flex flex-col items-center justify-center py-2">
                      <Barcode value={selectedZoomItem.id} displayValue={true} height={60} width={2.0} />
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Barcode Scanner</span>
                    </div>
                  )}

                  {storeCodeDisplayOption === 'qr' && (
                    <div id="zoom-qr-code" className="flex flex-col items-center justify-center py-2">
                      <QRCodeImage value={selectedZoomItem.id} size={110} />
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">QR Code</span>
                    </div>
                  )}
                </div>

                <p className="text-[9px] text-slate-400 leading-normal font-semibold max-w-[280px] mx-auto">
                  Hold this zoomed prize up to your webcam or scan directly from screen to trigger point POS checkout.
                </p>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => exportToWord(selectedZoomItem)}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                title="Export Voucher to Word Document"
              >
                <Icons.FileText className="w-3.5 h-3.5 text-blue-500" /> Word
              </button>
              <button
                type="button"
                onClick={() => exportToPDF(selectedZoomItem)}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                title="Export Voucher to PDF"
              >
                <Icons.FileDown className="w-3.5 h-3.5 text-rose-500" /> PDF
              </button>
              <button
                type="button"
                onClick={() => copyStoreCode(selectedZoomItem.id)}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <Icons.Copy className="w-3.5 h-3.5 text-slate-400" /> Copy ID
              </button>
              <button
                type="button"
                onClick={() => downloadQRCode(selectedZoomItem)}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <Icons.Download className="w-3.5 h-3.5 text-slate-400" /> Download QR
              </button>
              <button
                type="button"
                onClick={() => downloadBarcode(selectedZoomItem)}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                title="Download high-res barcode label"
              >
                <Icons.Download className="w-3.5 h-3.5 text-slate-400" /> Download BC
              </button>
              <button
                type="button"
                onClick={() => handlePrintPrize(selectedZoomItem)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <Icons.Printer className="w-3.5 h-3.5" /> Print Coupon
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
