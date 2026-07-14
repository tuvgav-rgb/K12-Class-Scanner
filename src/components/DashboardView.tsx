/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Coins,
  FileSpreadsheet,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { Student, Assignment, AssignmentSubmission, StoreItem, ScanLog } from '../types';

interface DashboardViewProps {
  students: Student[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  storeItems: StoreItem[];
  scanLogs: ScanLog[];
  onTabChange: (tabName: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export default function DashboardView({
  students,
  assignments,
  submissions,
  storeItems,
  scanLogs,
  onTabChange,
  onSelectStudent
}: DashboardViewProps) {
  const [logFilter, setLogFilter] = useState<'all' | 'success' | 'error'>('all');

  // Calculate high-level stats
  const totalStudents = students.length;
  
  const avgPoints = totalStudents > 0 
    ? Math.round(students.reduce((acc, curr) => acc + curr.points, 0) / totalStudents) 
    : 0;
  
  const totalAssignments = assignments.length;

  // Homework Completion Rate
  // Calculate across all assignments and all students (excluding projects unless due)
  const relevantSubmissions = submissions.filter(sub => 
    assignments.some(a => a.id === sub.assignmentId) &&
    students.some(s => s.id === sub.studentId)
  );
  
  const completedSubmissionsCount = relevantSubmissions.filter(sub => sub.completed).length;
  const totalExpectedSubmissions = totalStudents * totalAssignments;
  
  const completionRate = totalExpectedSubmissions > 0
    ? Math.round((completedSubmissionsCount / totalExpectedSubmissions) * 100)
    : 0;

  // Store inventory details
  const storeInventoryCount = storeItems.length;
  const totalStockLeft = storeItems.reduce((acc, curr) => acc + curr.stock, 0);

  // Filter scan logs
  const filteredLogs = scanLogs.filter(log => {
    if (logFilter === 'all') return true;
    if (logFilter === 'success') return log.status === 'success';
    if (logFilter === 'error') return log.status === 'error';
    return true;
  });

  // Top 5 earning students for leaderboards
  const topStudents = [...students]
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  const maxStudentPoints = topStudents.length > 0 ? topStudents[0].points : 100;

  // Donut chart math
  const radius = 35;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius; // ~219.9
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Top Banner / Classroom Overview */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        {/* Abstract background blobs for premium Apple-like aesthetics */}
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="bg-blue-500/20 border border-blue-400/30 text-blue-200 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase">
              Teacher Hub Console
            </span>
            <h1 className="text-2xl md:text-3.5xl font-bold tracking-tight">
              Welcome back to K12 ClassScanner
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Your physical barcode integration is live. Monitor homework completion, distribute points, and execute store rewards instantly by scanning student badges.
            </p>
          </div>

        </div>
      </div>

      {/* Grid of Key Stats Card */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Students */}
        <div
          onClick={() => onTabChange('Roster & Codes')}
          className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-sm flex items-start gap-4 hover:border-blue-300 hover:ring-4 hover:ring-blue-50/50 cursor-pointer transition-all duration-200"
        >
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Students</span>
            <span className="text-2xl font-bold text-slate-800 block mt-0.5">{totalStudents}</span>
            <span className="text-[10px] text-slate-500 font-medium mt-1 inline-block">Manage roster & codes</span>
          </div>
        </div>

        {/* Card 2: Average Points */}
        <div
          onClick={() => onTabChange('Class Store')}
          className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-sm flex items-start gap-4 hover:border-blue-300 hover:ring-4 hover:ring-blue-50/50 cursor-pointer transition-all duration-200"
        >
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
            <Coins className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Avg Points</span>
            <span className="text-2xl font-bold text-slate-800 block mt-0.5">{avgPoints} <span className="text-sm font-medium text-slate-400">pts</span></span>
            <span className="text-[10px] text-slate-500 font-medium mt-1 inline-block">Click to visit Class Store</span>
          </div>
        </div>

        {/* Card 3: Active Assignments */}
        <div
          onClick={() => onTabChange('Assignments')}
          className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-sm flex items-start gap-4 hover:border-blue-300 hover:ring-4 hover:ring-blue-50/50 cursor-pointer transition-all duration-200"
        >
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Assignments</span>
            <span className="text-2xl font-bold text-slate-800 block mt-0.5">{totalAssignments}</span>
            <span className="text-[10px] text-slate-500 font-medium mt-1 inline-block">Track & submit homework</span>
          </div>
        </div>

        {/* Card 4: Store Inventory */}
        <div
          onClick={() => onTabChange('Class Store')}
          className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-sm flex items-start gap-4 hover:border-blue-300 hover:ring-4 hover:ring-blue-50/50 cursor-pointer transition-all duration-200"
        >
          <div className="bg-rose-50 text-rose-600 p-3 rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Store Items</span>
            <span className="text-2xl font-bold text-slate-800 block mt-0.5">{storeInventoryCount}</span>
            <span className="text-[10px] text-slate-500 font-medium mt-1 inline-block">{totalStockLeft} rewards left in stock</span>
          </div>
        </div>
      </div>

      {/* Analytics Visualizers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* HW Completion rate Donut (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/85 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Classroom Performance</h3>
              <p className="text-xs text-slate-500 font-medium">Overall Assignment Completion</p>
            </div>
            <div className="bg-blue-50 text-blue-600 py-1 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Healthy
            </div>
          </div>

          {/* Custom SVG Donut Chart */}
          <div className="flex items-center justify-center py-6 relative">
            <svg width="180" height="180" viewBox="0 0 100 100" className="-rotate-90">
              <defs>
                <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" /> {/* Blue-600 */}
                  <stop offset="100%" stopColor="#10b981" /> {/* Emerald-500 */}
                </linearGradient>
              </defs>
              {/* Track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth={strokeWidth}
              />
              {/* Fill arc */}
              {completionRate > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="url(#donutGradient)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              )}
            </svg>

            {/* Inner Content Text */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{completionRate}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Completed</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-2 grid grid-cols-2 text-center text-xs font-semibold text-slate-500">
            <div className="border-r border-slate-100">
              <span className="block text-slate-400 font-medium">Done Submissions</span>
              <span className="block text-base font-bold text-emerald-600 mt-1">{completedSubmissionsCount}</span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Expected Total</span>
              <span className="block text-base font-bold text-slate-700 mt-1">{totalExpectedSubmissions}</span>
            </div>
          </div>
        </div>

        {/* Point Leaderboard Bar Graph (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/85 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Points Leaderboard</h3>
            <p className="text-xs text-slate-500 font-medium mb-4">Top 5 students in Points Classroom Economy</p>
          </div>

          {totalStudents === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Users className="w-8 h-8 opacity-40 mb-2" />
              <p className="text-xs">No student data to display</p>
            </div>
          ) : (
            <div className="space-y-4 my-2 flex-1 flex flex-col justify-center">
              {topStudents.map((student, idx) => {
                const widthPercent = maxStudentPoints > 0 
                  ? Math.max(8, (student.points / maxStudentPoints) * 100) 
                  : 10;
                
                // Color grades based on position
                const colors = [
                  'bg-gradient-to-r from-amber-400 to-amber-500 shadow-amber-100', // Gold
                  'bg-gradient-to-r from-slate-400 to-slate-500 shadow-slate-100', // Silver
                  'bg-gradient-to-r from-orange-400 to-orange-500 shadow-orange-100', // Bronze
                  'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-50',
                  'bg-gradient-to-r from-slate-600 to-slate-700 shadow-slate-50'
                ];

                return (
                  <div
                    key={student.id}
                    onClick={() => onSelectStudent(student.id)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    {/* Position circle */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0 ${idx < 3 ? colors[idx] : 'bg-slate-200 text-slate-600'}`}>
                      {idx + 1}
                    </div>

                    {/* Name */}
                    <span className="w-28 text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors truncate">
                      {student.name}
                    </span>

                    {/* Progress Track */}
                    <div className="flex-1 bg-slate-50 rounded-lg h-3 relative overflow-hidden border border-slate-100/50">
                      <div
                        style={{ width: `${widthPercent}%` }}
                        className={`h-full rounded-lg transition-all duration-1000 ${
                          idx === 0 
                            ? 'bg-gradient-to-r from-blue-500 to-emerald-500' 
                            : 'bg-blue-500/85 group-hover:bg-blue-600'
                        }`}
                      />
                    </div>

                    {/* Points value */}
                    <span className="w-16 text-right text-xs font-bold text-slate-800">
                      {student.points} <span className="text-[10px] text-slate-400 font-medium">pts</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-slate-100 pt-4 mt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              💡 Tip: Click any student's name to view their barcodes & member card.
            </span>
            <button
              onClick={() => onTabChange('Roster & Codes')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
            >
              Full Roster &rarr;
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Section: Scan Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Scan Log (12 Cols) */}
        <div className="lg:col-span-12 bg-white p-6 rounded-3xl border border-slate-200/85 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Live Scanner Logs</h3>
                <p className="text-xs text-slate-500 font-medium">Real-time status of physical scanner activity</p>
              </div>

              {/* Log Filter Tabs */}
              <div className="flex bg-slate-50 border border-slate-200/85 p-1 rounded-xl text-xs font-medium text-slate-600 self-start md:self-auto shadow-inner">
                <button
                  onClick={() => setLogFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${logFilter === 'all' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'hover:text-slate-900'}`}
                >
                  All Logs
                </button>
                <button
                  onClick={() => setLogFilter('success')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${logFilter === 'success' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'hover:text-emerald-700'}`}
                >
                  Success
                </button>
                <button
                  onClick={() => setLogFilter('error')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${logFilter === 'error' ? 'bg-white text-red-700 shadow-sm font-bold' : 'hover:text-red-700'}`}
                >
                  Errors
                </button>
              </div>
            </div>

            {/* Scrollable feed list */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[320px] overflow-y-auto divide-y divide-slate-100 shadow-inner bg-slate-50/20">
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center">
                  <Clock className="w-8 h-8 opacity-40 mb-2" />
                  <p className="text-xs font-medium">No recent logs matches filter</p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const isSuccess = log.status === 'success';
                  const isError = log.status === 'error';
                  const isWarning = log.status === 'warning';

                  return (
                    <div key={log.id} className="p-3.5 flex items-start gap-3.5 hover:bg-slate-50 transition-all">
                      {/* Icon status */}
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 shadow-sm ${
                        isSuccess ? 'bg-emerald-50 text-emerald-600' :
                        isError ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                        isWarning ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {isError ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </div>

                      {/* Log Message content */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-xs font-semibold text-slate-800 leading-normal">
                          {log.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-slate-400 font-medium">
                          <span className="bg-slate-100 text-slate-500 font-mono px-1.5 py-0.5 rounded border border-slate-200/50">
                            Code: {log.rawCode}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-300" />
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span>•</span>
                          <span className="capitalize text-slate-500">{log.actionType.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-medium mt-3 flex items-center gap-1.5 pl-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
            </span>
            Logs automatically update in real-time as the teacher scans.
          </div>
        </div>

      </div>
    </div>
  );
}
