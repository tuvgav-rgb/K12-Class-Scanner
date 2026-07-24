import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react';
import ExcelJS from 'exceljs';
import { ArrowLeft, ArrowRight, CheckCircle2, FileSpreadsheet, ImagePlus, Plus, School, Upload, UsersRound, X } from 'lucide-react';
import { ClassSession } from '../types';

type SetupStep = 'welcome' | 'class' | 'roster';
type NameMode = 'full' | 'split';

interface SpreadsheetData {
  headers: string[];
  rows: string[][];
}

interface FirstRunWelcomeProps {
  onCreateClass: (name: string, grade?: string, subject?: string, schoolName?: string) => ClassSession;
  onAddStudent: (id: string, name: string, grade: string, photoUrl?: string) => boolean;
  onImportStudents: (entries: Array<{ id?: string; name: string; points?: number }>) => boolean;
  onComplete: () => void;
}

const normalizeHeader = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const findColumn = (headers: string[], names: string[]) => {
  const normalizedNames = names.map(normalizeHeader);
  return headers.findIndex((header) => normalizedNames.includes(normalizeHeader(header)));
};

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let value = '';
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      insideQuotes = !insideQuotes;
    } else if (character === ',' && !insideQuotes) {
      values.push(value.trim());
      value = '';
    } else {
      value += character;
    }
  }
  values.push(value.trim());
  return values;
};

const valueAt = (row: string[], column: number) => row[column]?.trim() || '';

export default function FirstRunWelcome({ onCreateClass, onAddStudent, onImportStudents, onComplete }: FirstRunWelcomeProps) {
  const [step, setStep] = useState<SetupStep>('welcome');
  const [className, setClassName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [manualStudentName, setManualStudentName] = useState('');
  const [manualAddedStudents, setManualAddedStudents] = useState<Array<{ name: string; photoUrl?: string }>>([]);
  const [manualStudentPhoto, setManualStudentPhoto] = useState<string | undefined>();
  const [photoCrop, setPhotoCrop] = useState<{ src: string; zoom: number; offsetX: number; offsetY: number } | null>(null);
  const photoDragStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const cropSize = 288;
  const [spreadsheet, setSpreadsheet] = useState<SpreadsheetData | null>(null);
  const [nameMode, setNameMode] = useState<NameMode>('full');
  const [nameColumn, setNameColumn] = useState(-1);
  const [firstNameColumn, setFirstNameColumn] = useState(-1);
  const [lastNameColumn, setLastNameColumn] = useState(-1);
  const [hasStudentIds, setHasStudentIds] = useState(false);
  const [studentIdColumn, setStudentIdColumn] = useState(-1);
  const [hasPoints, setHasPoints] = useState(false);
  const [pointsColumn, setPointsColumn] = useState(-1);
  const [mappingConfirmed, setMappingConfirmed] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [uploadError, setUploadError] = useState('');

  const previewNames = useMemo(() => {
    if (!spreadsheet) return [];
    return spreadsheet.rows
      .map((row) => nameMode === 'full'
        ? valueAt(row, nameColumn)
        : [valueAt(row, firstNameColumn), valueAt(row, lastNameColumn)].filter(Boolean).join(' ')
      )
      .filter(Boolean)
      .slice(0, 5);
  }, [spreadsheet, nameMode, nameColumn, firstNameColumn, lastNameColumn]);

  const hasValidNameMapping = nameMode === 'full'
    ? nameColumn >= 0
    : firstNameColumn >= 0 && lastNameColumn >= 0;

  const handleCreateClass = (event: FormEvent) => {
    event.preventDefault();
    if (!className.trim() || !schoolName.trim()) return;
    onCreateClass(className.trim(), undefined, undefined, schoolName.trim());
    setStep('roster');
  };

  const handleManualStudent = (event: FormEvent) => {
    event.preventDefault();
    if (!manualStudentName.trim()) return;
    const id = `STU${Date.now().toString().slice(-7)}`;
    const name = manualStudentName.trim();
    if (onAddStudent(id, name, '', manualStudentPhoto)) {
      setManualStudentName('');
      setManualStudentPhoto(undefined);
      setManualAddedStudents((students) => [...students, { name, photoUrl: manualStudentPhoto }]);
    }
  };

  const handleManualPhotoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPhotoCrop({ src: reader.result as string, zoom: 1, offsetX: 0, offsetY: 0 });
    reader.readAsDataURL(file);
  };

  const saveCroppedPhoto = () => {
    if (!photoCrop) return;

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
      setManualStudentPhoto(canvas.toDataURL('image/jpeg', 0.88));
      setPhotoCrop(null);
    };
    image.src = photoCrop.src;
  };

  const applyDetectedColumns = (data: SpreadsheetData) => {
    const fullName = findColumn(data.headers, ['name', 'student name', 'full name', 'student']);
    const firstName = findColumn(data.headers, ['first name', 'firstname', 'given name']);
    const lastName = findColumn(data.headers, ['last name', 'lastname', 'surname', 'family name']);
    const studentId = findColumn(data.headers, ['student id', 'studentid', 'id', 'student number', 'student number id', 'member id', 'barcode id']);
    const points = findColumn(data.headers, ['points', 'point balance', 'economy points', 'reward points']);

    if (fullName >= 0) {
      setNameMode('full');
      setNameColumn(fullName);
    } else if (firstName >= 0 && lastName >= 0) {
      setNameMode('split');
      setFirstNameColumn(firstName);
      setLastNameColumn(lastName);
    }
    if (points >= 0) {
      setHasPoints(true);
      setPointsColumn(points);
    }
    if (studentId >= 0) {
      setHasStudentIds(true);
      setStudentIdColumn(studentId);
    }
  };

  const handleSpreadsheetUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setUploadError('');
      let sheetRows: string[][] = [];
      if (file.name.toLowerCase().endsWith('.csv')) {
        sheetRows = (await file.text())
          .split(/\r?\n/)
          .map(parseCsvLine)
          .filter((row) => row.some((value) => value));
      } else {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const worksheet = workbook.worksheets[0];
        if (!worksheet) throw new Error('No worksheet was found in this file.');
        for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
          const row = worksheet.getRow(rowNumber);
          const values = Array.from({ length: worksheet.columnCount }, (_, index) => row.getCell(index + 1).text.trim());
          if (values.some(Boolean)) sheetRows.push(values);
        }
      }

      if (sheetRows.length < 2) throw new Error('Use a spreadsheet with a header row and at least one student.');
      const data = { headers: sheetRows[0], rows: sheetRows.slice(1) };
      setSpreadsheet(data);
      setNameColumn(-1);
      setFirstNameColumn(-1);
      setLastNameColumn(-1);
      setStudentIdColumn(-1);
      setHasStudentIds(false);
      setPointsColumn(-1);
      setHasPoints(false);
      setMappingConfirmed(false);
      applyDetectedColumns(data);
    } catch (error) {
      setSpreadsheet(null);
      setUploadError(error instanceof Error ? error.message : 'The spreadsheet could not be read. Use an .xlsx or .csv file.');
    }
  };

  const handleImport = () => {
    if (!spreadsheet || !hasValidNameMapping || !mappingConfirmed || (hasStudentIds && studentIdColumn < 0) || (hasPoints && pointsColumn < 0)) return;
    const students = spreadsheet.rows
      .map((row) => {
        const name = nameMode === 'full'
          ? valueAt(row, nameColumn)
          : [valueAt(row, firstNameColumn), valueAt(row, lastNameColumn)].filter(Boolean).join(' ');
        const id = hasStudentIds ? valueAt(row, studentIdColumn) : undefined;
        const pointsValue = hasPoints ? Number(valueAt(row, pointsColumn).replace(/[^0-9.-]/g, '')) : undefined;
        return { id, name, points: Number.isFinite(pointsValue) ? pointsValue : undefined };
      })
      .filter((student) => student.name);

    if (onImportStudents(students)) {
      setImportedCount((count) => count + students.length);
      setSpreadsheet(null);
      setMappingConfirmed(false);
    }
  };

  const columnOptions = spreadsheet?.headers.map((header, index) => ({ label: header || `Column ${index + 1}`, value: index })) || [];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-8 flex items-center justify-center">
      <section className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 bg-slate-900 px-6 py-5 text-white sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500"><School className="h-5 w-5" /></div>
            <div>
              <p className="text-xs font-semibold text-blue-200">K12 ClassScanner</p>
              <h1 className="text-lg font-bold">Set up your classroom</h1>
            </div>
          </div>
        </div>

        {step === 'welcome' && (
          <div className="px-6 py-10 sm:px-10">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Welcome</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">Your classroom is ready to take shape.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Create your first class, add the school name, and build a roster before you begin scanning cards and awarding points.</p>
              <button onClick={() => setStep('class')} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                Create your first class <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'class' && (
          <form onSubmit={handleCreateClass} className="space-y-5 px-6 py-8 sm:px-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Step 1 of 2</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Name your class and school</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-semibold text-slate-700">Class name
                <input autoFocus required value={className} onChange={(event) => setClassName(event.target.value)} placeholder="e.g. 5th Grade Homeroom" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white" />
              </label>
              <label className="space-y-1.5 text-xs font-semibold text-slate-700">School name
                <input required value={schoolName} onChange={(event) => setSchoolName(event.target.value)} placeholder="e.g. Lincoln Elementary" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white" />
              </label>
            </div>
            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setStep('welcome')} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" /> Back</button>
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700">Set up roster <ArrowRight className="h-4 w-4" /></button>
            </div>
          </form>
        )}

        {step === 'roster' && (
          <div className="space-y-6 px-6 py-8 sm:px-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Step 2 of 2</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Build your first roster</h2>
              <p className="mt-1 text-sm text-slate-600">Add students one at a time or import a spreadsheet. You can always add more later.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <form onSubmit={handleManualStudent} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800"><UsersRound className="h-4 w-4 text-blue-600" /> Add a student</div>
                <input value={manualStudentName} onChange={(event) => setManualStudentName(event.target.value)} placeholder="Student full name" className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white" />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    <ImagePlus className="h-3.5 w-3.5" /> Add optional photo
                    <input type="file" accept="image/*" onChange={handleManualPhotoUpload} className="hidden" />
                  </label>
                  <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"><Plus className="h-3.5 w-3.5" /> Add to roster</button>
                </div>
                {manualStudentPhoto && <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2"><img src={manualStudentPhoto} alt="Selected student" className="h-9 w-9 rounded-full object-cover" /><span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-600">Photo ready to add</span><button type="button" onClick={() => setManualStudentPhoto(undefined)} className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700" title="Remove selected photo"><X className="h-3.5 w-3.5" /></button></div>}
                <p className="mt-3 text-xs leading-5 text-slate-500">A photo is optional and can also be added later from the Roster &amp; Codes menu.</p>
                {manualAddedStudents.length > 0 && <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3"><p className="text-xs font-semibold text-emerald-800">Added students ({manualAddedStudents.length})</p><ul className="mt-2 space-y-1.5">{manualAddedStudents.map((student, index) => <li key={`${student.name}-${index}`} className="flex items-center gap-2 text-xs font-medium text-emerald-900">{student.photoUrl ? <img src={student.photoUrl} alt="" className="h-5 w-5 rounded-full object-cover" /> : <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-200 text-[9px] font-bold">{student.name.charAt(0).toUpperCase()}</span>}<span>{student.name}</span></li>)}</ul></div>}
              </form>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800"><FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Import a class list</div>
                <p className="mt-2 text-xs leading-5 text-slate-500">Upload an Excel `.xlsx` or `.csv` file with a header row. We will suggest name, existing student ID, and points columns for you to confirm.</p>
                <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                  <Upload className="h-4 w-4" /> Choose spreadsheet
                  <input type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleSpreadsheetUpload} className="hidden" />
                </label>
                {uploadError && <p className="mt-3 text-xs font-medium text-rose-600">{uploadError}</p>}
                {importedCount > 0 && <p className="mt-3 text-xs font-medium text-emerald-700">{importedCount} student{importedCount === 1 ? '' : 's'} imported here.</p>}
              </div>
            </div>

            {spreadsheet && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Confirm spreadsheet columns</h3>
                    <p className="mt-1 text-xs text-slate-600">{spreadsheet.rows.length} rows found. Check the selected columns before importing.</p>
                  </div>
                  <FileSpreadsheet className="h-5 w-5 shrink-0 text-blue-600" />
                </div>

                <div className="mt-4 flex gap-2 text-xs font-semibold text-slate-700">
                  <button type="button" onClick={() => { setNameMode('full'); setMappingConfirmed(false); }} className={`rounded-lg px-3 py-1.5 ${nameMode === 'full' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200'}`}>One name column</button>
                  <button type="button" onClick={() => { setNameMode('split'); setMappingConfirmed(false); }} className={`rounded-lg px-3 py-1.5 ${nameMode === 'split' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200'}`}>First and last name columns</button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {nameMode === 'full' ? (
                    <label className="text-xs font-semibold text-slate-700">Student name column
                      <select value={nameColumn} onChange={(event) => { setNameColumn(Number(event.target.value)); setMappingConfirmed(false); }} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm">
                        <option value={-1}>Choose a column</option>
                        {columnOptions.map((column) => <option key={column.value} value={column.value}>{column.label}</option>)}
                      </select>
                    </label>
                  ) : (
                    <>
                      <label className="text-xs font-semibold text-slate-700">First name column
                        <select value={firstNameColumn} onChange={(event) => { setFirstNameColumn(Number(event.target.value)); setMappingConfirmed(false); }} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm"><option value={-1}>Choose a column</option>{columnOptions.map((column) => <option key={column.value} value={column.value}>{column.label}</option>)}</select>
                      </label>
                      <label className="text-xs font-semibold text-slate-700">Last name column
                        <select value={lastNameColumn} onChange={(event) => { setLastNameColumn(Number(event.target.value)); setMappingConfirmed(false); }} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm"><option value={-1}>Choose a column</option>{columnOptions.map((column) => <option key={column.value} value={column.value}>{column.label}</option>)}</select>
                      </label>
                    </>
                  )}
                  <label className="flex items-center gap-2 self-end pb-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={hasStudentIds} onChange={(event) => { setHasStudentIds(event.target.checked); setMappingConfirmed(false); }} className="h-4 w-4 accent-blue-600" /> This spreadsheet has existing student IDs</label>
                  {hasStudentIds && <label className="text-xs font-semibold text-slate-700">Student ID column
                    <select value={studentIdColumn} onChange={(event) => { setStudentIdColumn(Number(event.target.value)); setMappingConfirmed(false); }} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm"><option value={-1}>Choose a column</option>{columnOptions.map((column) => <option key={column.value} value={column.value}>{column.label}</option>)}</select>
                  </label>}
                  <label className="flex items-center gap-2 self-end pb-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={hasPoints} onChange={(event) => { setHasPoints(event.target.checked); setMappingConfirmed(false); }} className="h-4 w-4 accent-blue-600" /> This spreadsheet has points recorded</label>
                  {hasPoints && <label className="text-xs font-semibold text-slate-700">Points column
                    <select value={pointsColumn} onChange={(event) => { setPointsColumn(Number(event.target.value)); setMappingConfirmed(false); }} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm"><option value={-1}>Choose a column</option>{columnOptions.map((column) => <option key={column.value} value={column.value}>{column.label}</option>)}</select>
                  </label>}
                </div>

                <div className="mt-4 rounded-lg border border-blue-100 bg-white p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Roster preview</p>
                  <p className="mt-1.5 text-xs text-slate-600">{previewNames.length ? previewNames.join(' · ') : 'Choose the student name column to preview records.'}</p>
                </div>
                <label className="mt-4 flex items-start gap-2 text-xs font-medium text-slate-700"><input type="checkbox" checked={mappingConfirmed} onChange={(event) => setMappingConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-blue-600" /> I confirm these are the correct columns for this roster.</label>
                <button type="button" disabled={!hasValidNameMapping || !mappingConfirmed || (hasStudentIds && studentIdColumn < 0) || (hasPoints && pointsColumn < 0)} onClick={handleImport} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm enabled:hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"><CheckCircle2 className="h-4 w-4" /> Import roster</button>
              </div>
            )}

            <div className="flex justify-end border-t border-slate-100 pt-5">
              <button onClick={onComplete} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800">Finish setup <ArrowRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </section>
      {photoCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="photo-crop-title">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 id="photo-crop-title" className="text-sm font-bold text-slate-900">Center Student Photo</h3>
                <p className="mt-1 text-xs text-slate-500">Drag to place the face in the circle, then adjust the zoom.</p>
              </div>
              <button onClick={() => setPhotoCrop(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Cancel photo crop"><X className="h-5 w-5" /></button>
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
                  setPhotoCrop((current) => current && { ...current, offsetX: start.offsetX + event.clientX - start.x, offsetY: start.offsetY + event.clientY - start.y });
                }}
                onPointerUp={() => { photoDragStart.current = null; }}
                onPointerCancel={() => { photoDragStart.current = null; }}
              >
                <img src={photoCrop.src} className="h-full w-full object-cover select-none pointer-events-none" style={{ transform: `translate(${photoCrop.offsetX}px, ${photoCrop.offsetY}px) scale(${photoCrop.zoom})` }} alt="Crop preview" />
              </div>
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <label htmlFor="setup-photo-zoom">Zoom</label>
                  <button onClick={() => setPhotoCrop((current) => current && { ...current, zoom: 1, offsetX: 0, offsetY: 0 })} className="text-blue-600 hover:text-blue-700">Recenter</button>
                </div>
                <input id="setup-photo-zoom" type="range" min="1" max="3" step="0.05" value={photoCrop.zoom} onChange={(event) => setPhotoCrop((current) => current && { ...current, zoom: Number(event.target.value) })} className="w-full accent-blue-600" />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
              <button onClick={() => setPhotoCrop(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={saveCroppedPhoto} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700">Use Photo</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}