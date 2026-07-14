/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
}

export function Barcode({
  value,
  width = 1.8,
  height = 42,
  displayValue = true
}: BarcodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue,
          fontSize: 10,
          margin: 6,
          lineColor: '#0f172a', // slate-900
          background: 'transparent'
        });
      } catch (err) {
        console.error('JsBarcode rendering error:', err);
      }
    }
  }, [value, width, height, displayValue]);

  return (
    <div className="flex items-center justify-center bg-white p-1.5 rounded-lg border border-slate-100">
      <svg ref={svgRef} className="barcode-svg max-w-full h-auto" />
    </div>
  );
}

interface QRCodeProps {
  value: string;
  size?: number;
}

export function QRCodeImage({ value, size = 100 }: QRCodeProps) {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    if (value) {
      QRCode.toDataURL(value, {
        width: size,
        margin: 1,
        color: {
          dark: '#0f172a', // slate-900
          light: '#ffffff'
        }
      })
        .then(setSrc)
        .catch((err) => console.error('QRCode generation error:', err));
    }
  }, [value, size]);

  return (
    <div className="flex items-center justify-center bg-white p-1.5 rounded-lg border border-slate-100 shrink-0">
      {src ? (
        <img
          src={src}
          alt={`QR Code for ${value}`}
          style={{ width: size, height: size }}
          className="qr-code-img object-contain"
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="bg-slate-100 animate-pulse rounded-md"
        />
      )}
    </div>
  );
}
