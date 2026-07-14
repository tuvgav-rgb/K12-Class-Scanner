/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Store,
  BarChart3,
  Menu,
  X,
  Scan,
  Coins,
  Settings2,
  HelpCircle,
  Sparkles,
  School,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useClassState } from './hooks/useClassState';

// Views
import ScannerHeader from './components/ScannerHeader';
import DashboardView from './components/DashboardView';
import RosterView from './components/RosterView';
import AssignmentsView from './components/AssignmentsView';
import StoreView from './components/StoreView';
import ReportsView from './components/ReportsView';
import RewardsView from './components/RewardsView';
import ManageClassesView from './components/ManageClassesView';
import CelebrationOverlay from './components/CelebrationOverlay';
// @ts-ignore
import k12Logo from './k12 - color logo 3 - with the word CHINUCH - Perfected - no background - no glow.png';

type TabType = 'Dashboard' | 'Roster & Codes' | 'Assignments' | 'Class Store' | 'Reports' | 'Rewards Menu' | 'Manage Classes';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Expose entire state engine
  const {
    classes,
    activeClassId,
    setActiveClassId,
    createClass,
    deleteClass,
    updateClass,

    students,
    assignments,
    submissions,
    storeItems,
    transactions,
    scanLogs,
    subjects,
    activeStudentId,
    setActiveStudentId,
    activeAssignmentId,
    setActiveAssignmentId,
    loadedSessionAssignmentId,
    setLoadedSessionAssignmentId,
    toasts,
    removeToast,
    adjustStudentPoints,
    addStudent,
    deleteStudent,
    updateStudent,
    addAssignment,
    deleteAssignment,
    toggleSubmission,
    addStoreItem,
    archiveStoreItem,
    restoreStoreItem,
    deleteStoreItem,
    permanentlyDeleteStoreItem,
    checkoutStoreItemDirectly,
    triggerScan,
    addSubject,
    deleteSubject,
    
    // Rewards Menu extensions
    rewards,
    activeRewardId,
    setActiveRewardId,
    lastAwardedInfo,
    setLastAwardedInfo,
    addReward,
    deleteReward,
    archiveReward,
    restoreReward,
    permanentlyDeleteReward,
    updateReward,
    awardRewardToStudent
  } = useClassState();

  const activeStudent = students.find((s) => s.id === activeStudentId) || null;

  const activeClass = classes.find((c) => c.id === activeClassId);
  const activeClassName = activeClass ? `${activeClass.name}${activeClass.grade ? ` (${activeClass.grade})` : ''}` : '';

  // Calculate dynamic font size for active class dropdown to ensure it always fits the sidebar
  let selectFontSizeClass = 'text-sm';
  if (activeClassName.length > 25) {
    selectFontSizeClass = 'text-[10px]';
  } else if (activeClassName.length > 18) {
    selectFontSizeClass = 'text-xs';
  }

  const navigationItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Roster & Codes', icon: Users },
    { name: 'Assignments', icon: ClipboardList },
    { name: 'Class Store', icon: Store },
    { name: 'Rewards Menu', icon: Sparkles },
    { name: 'Reports', icon: BarChart3 },
    { name: 'Manage Classes', icon: School }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans antialiased">
      
      {/* 2. Collapsible Responsive Left Sidebar */}
      {/* Mobile background backdrop overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white text-slate-800 border-r border-slate-200 flex flex-col justify-between z-40 transform transition-transform duration-300 ease-out shrink-0 lg:translate-x-0 lg:static lg:h-screen ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header branding */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-4.5">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Scan className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="leading-none">
              <span className="text-lg font-bold text-slate-800 tracking-tight block">K12 ClassScanner</span>
              {activeClass?.schoolName && (
                <span className="text-[11px] text-slate-400 font-semibold block mt-1">{activeClass.schoolName}</span>
              )}
            </div>
          </div>

          {/* Premium Class Selector */}
          <div className="space-y-1.5" id="active-class-dropdown-wrapper">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">Active Class</label>
            <select
              value={activeClassId}
              onChange={(e) => setActiveClassId(e.target.value)}
              className={`w-full bg-slate-50 border border-slate-200 ${selectFontSizeClass} font-semibold text-slate-700 rounded-xl px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer`}
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.grade ? `(${cls.grade})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto flex flex-col">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block pl-3 mb-2">Main Menu</span>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setCurrentTab(item.name as TabType);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer relative group ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {item.name}

                  {/* Blue pill accent */}
                  {isActive && (
                    <span className="absolute right-3.5 w-1.5 h-1.5 rounded-full bg-blue-600 shadow-sm shadow-blue-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Centered Logo under menu */}
          <div className="mt-5 pt-5 pb-1 flex flex-col items-center justify-center border-t border-slate-100/60">
            <img 
              src={k12Logo} 
              alt="K12 Chinuch Logo" 
              className="max-w-[220px] max-h-32 w-auto object-contain" 
              referrerPolicy="no-referrer"
            />
          </div>
        </nav>

        {/* Sidebar footer settings & credits */}
        <div className="p-4 mt-auto border-t border-slate-100 space-y-4">
          {/* Scanner Status Box */}
          <div className="bg-slate-900 rounded-xl p-4 text-white">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Scanner Status</p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm font-semibold">HID USB Connected</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pl-1 font-semibold">
            <span>v1.0.0 (WebView2)</span>
            <span className="hover:text-slate-700 cursor-pointer flex items-center gap-0.5 transition-colors">
              <Settings2 className="w-4 h-4" /> Settings
            </span>
          </div>
        </div>
      </aside>

      {/* 3. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-hidden relative">
        
        {/* Mobile Top Appbar */}
        <header className="bg-white text-slate-800 border-b border-slate-200 py-3.5 px-6 flex items-center justify-between lg:hidden shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-slate-500 hover:text-slate-800 p-1"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Scan className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-extrabold tracking-wider uppercase text-slate-800">K12 ClassScanner</span>
            </div>
          </div>

          {/* Quick stats on mobile bar */}
          <div className="flex items-center gap-1.5 bg-slate-100 py-1 px-2 rounded-lg text-[10px] font-bold text-amber-700 border border-slate-200 shadow-sm">
            <Coins className="w-3 h-3 text-amber-500" />
            {students.reduce((acc, curr) => acc + curr.points, 0)} pts total
          </div>
        </header>

        {/* Global Prominent Scan Console header */}
        <ScannerHeader
          onScan={(code) => triggerScan(code, currentTab)}
          activeStudentName={activeStudent?.name}
          activeStudentPoints={activeStudent?.points}
          onClearActiveStudent={() => setActiveStudentId(null)}
          currentTab={currentTab}
          students={students}
          assignments={assignments}
          storeItems={storeItems}
        />

        {/* Scrollable View Canvas Stage */}
        <main className="flex-1 overflow-y-auto px-6 py-6 focus:outline-none relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="max-w-7xl mx-auto h-full"
            >
              {currentTab === 'Dashboard' && (
                <DashboardView
                  students={students}
                  assignments={assignments}
                  submissions={submissions}
                  storeItems={storeItems}
                  scanLogs={scanLogs}
                  onTabChange={(tab) => setCurrentTab(tab as TabType)}
                  onSelectStudent={(id) => {
                    setActiveStudentId(id);
                    setCurrentTab('Roster & Codes');
                  }}
                />
              )}

              {currentTab === 'Roster & Codes' && (
                <RosterView
                  students={students}
                  onAddStudent={addStudent}
                  onDeleteStudent={deleteStudent}
                  onUpdateStudent={updateStudent}
                  onAdjustPoints={adjustStudentPoints}
                  selectedStudentId={activeStudentId}
                  onSelectStudent={setActiveStudentId}
                />
              )}

              {currentTab === 'Assignments' && (
                <AssignmentsView
                  students={students}
                  assignments={assignments}
                  submissions={submissions}
                  activeAssignmentId={activeAssignmentId}
                  onSelectAssignment={setActiveAssignmentId}
                  onAddAssignment={addAssignment}
                  onDeleteAssignment={deleteAssignment}
                  onToggleSubmission={toggleSubmission}
                  subjects={subjects}
                  onAddSubject={addSubject}
                  onDeleteSubject={deleteSubject}
                  loadedSessionAssignmentId={loadedSessionAssignmentId}
                  setLoadedSessionAssignmentId={setLoadedSessionAssignmentId}
                />
              )}

              {currentTab === 'Class Store' && (
                <StoreView
                  students={students}
                  storeItems={storeItems}
                  activeStudentId={activeStudentId}
                  onSelectStudent={setActiveStudentId}
                  onAddStoreItem={addStoreItem}
                  onArchiveStoreItem={archiveStoreItem}
                  onRestoreStoreItem={restoreStoreItem}
                  onDeleteStoreItem={deleteStoreItem}
                  onPermanentlyDeleteStoreItem={permanentlyDeleteStoreItem}
                  onCheckout={checkoutStoreItemDirectly}
                />
              )}

              {currentTab === 'Reports' && (
                <ReportsView
                  students={students}
                  assignments={assignments}
                  submissions={submissions}
                  storeItems={storeItems}
                  transactions={transactions}
                  subjects={subjects}
                />
              )}

              {currentTab === 'Rewards Menu' && (
                <RewardsView
                  students={students}
                  rewards={rewards}
                  activeRewardId={activeRewardId}
                  onSelectActiveReward={setActiveRewardId}
                  onAddReward={addReward}
                  onDeleteReward={deleteReward}
                  onArchiveReward={archiveReward}
                  onRestoreReward={restoreReward}
                  onPermanentlyDeleteReward={permanentlyDeleteReward}
                  onUpdateReward={updateReward}
                  onAwardReward={awardRewardToStudent}
                  scanLogs={scanLogs}
                />
              )}

              {currentTab === 'Manage Classes' && (
                <ManageClassesView
                  classes={classes}
                  activeClassId={activeClassId}
                  onSelectClass={setActiveClassId}
                  onCreateClass={createClass}
                  onDeleteClass={deleteClass}
                  onUpdateClass={updateClass}
                  onTabChange={(tab) => setCurrentTab(tab)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* 5. Full-Screen Animated Celebration Screen Overlay */}
      <CelebrationOverlay
        info={lastAwardedInfo}
        onClose={() => setLastAwardedInfo(null)}
      />

      {/* 4. Sliding Floating Toast Notification Engine (Bottom-Right corner) */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2.5 z-50 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            const isError = toast.type === 'error';
            const isWarning = toast.type === 'warning';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3.5 pointer-events-auto w-full ${
                  isSuccess
                    ? 'bg-slate-900 border-emerald-500/20 text-slate-100'
                    : isError
                    ? 'bg-rose-950 border-rose-500/25 text-rose-50'
                    : isWarning
                    ? 'bg-amber-950 border-amber-500/20 text-amber-50'
                    : 'bg-slate-900 border-indigo-500/20 text-slate-100'
                }`}
              >
                {/* Visual Accent Bar */}
                <div className={`w-1 h-8 rounded-full shrink-0 ${
                  isSuccess ? 'bg-emerald-500' :
                  isError ? 'bg-rose-500' :
                  isWarning ? 'bg-amber-500' : 'bg-indigo-500'
                }`} />

                {/* Toast Message */}
                <div className="flex-1 text-xs font-semibold leading-relaxed">
                  {toast.message}
                </div>

                {/* Dismiss button */}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-slate-200 shrink-0 p-0.5"
                >
                  ✕
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

    </div>
  );
}
