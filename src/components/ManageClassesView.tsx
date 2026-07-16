/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ClassSession } from '../types';
import { School, Plus, Edit2, Trash2, Check, ArrowRight, BookOpen, GraduationCap, Users, Coins, Upload } from 'lucide-react';

interface ManageClassesViewProps {
  classes: ClassSession[];
  activeClassId: string;
  onSelectClass: (id: string) => void;
  onCreateClass: (name: string, grade?: string, subject?: string, schoolName?: string) => void;
  onDeleteClass: (id: string) => void;
  onUpdateClass: (id: string, updates: Partial<ClassSession>) => void;
  onTabChange: (tab: any) => void;
}

export default function ManageClassesView({
  classes,
  activeClassId,
  onSelectClass,
  onCreateClass,
  onDeleteClass,
  onUpdateClass,
  onTabChange
}: ManageClassesViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newSchoolName, setNewSchoolName] = useState('');

  // Editing states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editSchoolName, setEditSchoolName] = useState('');
  const [editSchoolLogoUrl, setEditSchoolLogoUrl] = useState<string | undefined>();
  const [editIdCardTitle, setEditIdCardTitle] = useState('Member ID Card');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    onCreateClass(newClassName.trim(), newGrade.trim() || undefined, newSubject.trim() || undefined, newSchoolName.trim() || undefined);
    setNewClassName('');
    setNewGrade('');
    setNewSubject('');
    setNewSchoolName('');
    setIsAdding(false);
  };

  const startEditing = (cls: ClassSession) => {
    setEditingId(cls.id);
    setEditName(cls.name);
    setEditGrade(cls.grade || '');
    setEditSubject(cls.subject || '');
    setEditSchoolName(cls.schoolName || '');
    setEditSchoolLogoUrl(cls.schoolLogoUrl);
    setEditIdCardTitle(cls.idCardTitle || 'Member ID Card');
  };

  const handleSchoolLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setEditSchoolLogoUrl(reader.result as string);
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return;
    onUpdateClass(id, {
      name: editName.trim(),
      grade: editGrade.trim() || undefined,
      subject: editSubject.trim() || undefined,
      schoolName: editSchoolName.trim() || undefined,
      schoolLogoUrl: editSchoolLogoUrl,
      idCardTitle: editIdCardTitle.trim() || 'Member ID Card'
    });
    setEditingId(null);
  };

  // Helper to read statistics per class from localStorage dynamically
  const getClassStats = (classId: string) => {
    try {
      const studentsStr = localStorage.getItem(`class_scanner_${classId}_students`);
      if (studentsStr) {
        const parsed = JSON.parse(studentsStr);
        if (Array.isArray(parsed)) {
          const studentCount = parsed.length;
          const totalPoints = parsed.reduce((sum, s) => sum + (s.points || 0), 0);
          return { studentCount, totalPoints };
        }
      }
    } catch (e) {
      console.error('Error loading stats for class ' + classId, e);
    }
    return { studentCount: 0, totalPoints: 0 };
  };

  return (
    <div className="space-y-6" id="manage-classes-container">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <School className="w-5.5 h-5.5 text-blue-600" />
            Classroom Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Create, configure, and switch between your separate class sessions. Roster, assignments, and store data are fully isolated.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          Create New Class
        </button>
      </div>

      {/* Add Class Inline Panel */}
      {isAdding && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-md border border-slate-800">
          <h3 className="text-sm font-bold flex items-center gap-2 text-white mb-4">
            <Plus className="w-4 h-4 text-blue-400" />
            Create a New Classroom
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Class Name *</label>
              <input
                type="text"
                required
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="e.g. 5th Grade Science, Period 4 Math"
                className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Grade Level (Optional)</label>
              <input
                type="text"
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                placeholder="e.g. 5th Grade, Kindergarten"
                className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Primary Subject (Optional)</label>
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="e.g. Science, Mathematics, Reading"
                className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">School Name (Optional)</label>
              <input
                type="text"
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
                placeholder="e.g. Lincoln Elementary"
                className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Create Classroom
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Classrooms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => {
          const isActive = cls.id === activeClassId;
          const isEditing = cls.id === editingId;
          const stats = getClassStats(cls.id);

          return (
            <div
              key={cls.id}
              className={`bg-white rounded-2xl border transition-all relative ${
                isActive
                  ? 'border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                  : 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {/* Active Badge indicator */}
              {isActive && (
                <span className="absolute top-4 right-4 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Active
                </span>
              )}

              <div className="p-6 space-y-4">
                {/* Editable / Normal Header */}
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Class Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Grade</label>
                        <input
                          type="text"
                          value={editGrade}
                          onChange={(e) => setEditGrade(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Subject</label>
                        <input
                          type="text"
                          value={editSubject}
                          onChange={(e) => setEditSubject(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">School Name</label>
                      <input
                        type="text"
                        value={editSchoolName}
                        onChange={(e) => setEditSchoolName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID Card Top-Right Title</label>
                      <input
                        type="text"
                        value={editIdCardTitle}
                        onChange={(e) => setEditIdCardTitle(e.target.value)}
                        placeholder="Member ID Card"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">School Logo</label>
                      <div className="flex items-center gap-2">
                        {editSchoolLogoUrl ? (
                          <img src={editSchoolLogoUrl} alt="School logo preview" className="h-8 w-8 rounded-md border border-slate-200 object-contain p-0.5" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                            <School className="h-4 w-4" />
                          </div>
                        )}
                        <label className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100">
                          <Upload className="h-3 w-3" /> Upload logo
                          <input type="file" accept="image/*" onChange={handleSchoolLogoUpload} className="hidden" />
                        </label>
                        {editSchoolLogoUrl && (
                          <button type="button" onClick={() => setEditSchoolLogoUrl(undefined)} className="text-[10px] font-bold text-rose-600 hover:text-rose-700">Remove</button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdate(cls.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Grade & Subject info */}
                    <div className="flex items-center gap-2 mb-1.5">
                      {cls.grade && (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {cls.grade}
                        </span>
                      )}
                      {cls.subject && (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          {cls.subject}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 tracking-tight pr-14 leading-tight">
                      {cls.name}
                    </h4>
                  </div>
                )}

                {/* Class Stats indicators */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block">Students</span>
                    <span className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-400" />
                      {stats.studentCount}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block">Class Points</span>
                    <span className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-500" />
                      {stats.totalPoints}
                    </span>
                  </div>
                </div>

                {/* Action Controls footer */}
                {!isEditing && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditing(cls)}
                        className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                        title="Edit Class Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteClass(cls.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Class"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {isActive ? (
                      <button
                        onClick={() => onTabChange('Dashboard')}
                        className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        Go to Dashboard <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onSelectClass(cls.id);
                          onTabChange('Dashboard');
                        }}
                        className="bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        Switch Class
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
