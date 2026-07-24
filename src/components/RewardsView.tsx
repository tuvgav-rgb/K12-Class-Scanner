/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Plus,
  Trash2,
  Award,
  Image as ImageIcon,
  Upload,
  Trophy,
  Coins,
  History,
  CheckCircle,
  UserCheck,
  Check,
  X,
  PlusCircle,
  MinusCircle,
  Archive,
  ArchiveRestore,
  ThumbsDown,
  ThumbsUp,
  Printer
} from 'lucide-react';
import { Student, RewardItem, ScanLog } from '../types';
import SafeRewardImage from './SafeRewardImage';
import RewardQuickScanSheet from './RewardQuickScanSheet';
import trophyImage from '../assets/rewards/trophy.jpg';
import couponImage from '../assets/rewards/coupon.jpg';
import pizzaImage from '../assets/rewards/pizza.jpg';
import pencilImage from '../assets/rewards/pencil.jpg';
import cookieImage from '../assets/rewards/cookie.jpg';
import readingImage from '../assets/rewards/reading.jpg';
import treasureImage from '../assets/rewards/treasure.jpg';
import deskImage from '../assets/rewards/desk.jpg';

interface RewardsViewProps {
  students: Student[];
  rewards: RewardItem[];
  classId: string;
  className: string;
  schoolName?: string;
  activeRewardId: string | null;
  onSelectActiveReward: (id: string | null) => void;
  onAddReward: (name: string, pointsValue: number, type: RewardItem['type'], imageUrl?: string, description?: string) => string;
  onDeleteReward: (id: string) => void;
  onArchiveReward: (id: string) => void;
  onRestoreReward: (id: string) => void;
  onPermanentlyDeleteReward: (id: string) => void;
  onUpdateReward: (id: string, fields: Partial<RewardItem>) => void;
  onAwardReward: (studentId: string, rewardId: string) => void;
  scanLogs: ScanLog[];
}

const ILLUSTRATION_PRESETS = [
  {
    name: '🏆 Gold Trophy',
    url: trophyImage
  },
  {
    name: '🎟️ Homework Coupon',
    url: couponImage
  },
  {
    name: '🍕 Pizza Slice',
    url: pizzaImage
  },
  {
    name: '✏️ mechanical Pencil',
    url: pencilImage
  },
  {
    name: '🍪 Sweet Cookie',
    url: cookieImage
  },
  {
    name: '📚 Reading Adventure',
    url: readingImage
  },
  {
    name: '🧸 Treasure Box',
    url: treasureImage
  },
  {
    name: '🪑 Desk Swap',
    url: deskImage
  }
];

export default function RewardsView({
  students,
  rewards,
  classId,
  className,
  schoolName,
  activeRewardId,
  onSelectActiveReward,
  onAddReward,
  onDeleteReward,
  onArchiveReward,
  onRestoreReward,
  onPermanentlyDeleteReward,
  onUpdateReward,
  onAwardReward,
  scanLogs
}: RewardsViewProps) {
  // New reward form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardPoints, setNewRewardPoints] = useState<number>(0);
  const [newRewardType, setNewRewardType] = useState<RewardItem['type']>('points');
  const [behaviorPolarity, setBehaviorPolarity] = useState<'positive' | 'negative'>('positive');
  const [newRewardDescription, setNewRewardDescription] = useState('');
  const [newRewardImage, setNewRewardImage] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [showQuickScanSheet, setShowQuickScanSheet] = useState(false);

  // Simulated Scanning state
  const [simStudentId, setSimStudentId] = useState('');

  // Image upload reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeRewards = rewards.filter((reward) => !reward.archived);
  const archivedRewards = rewards.filter((reward) => reward.archived);
  const activeReward = activeRewards.find((reward) => reward.id === activeRewardId) || null;

  // Handle local image file uploads and convert to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewRewardImage(reader.result as string);
        setSelectedPreset(null); // clear preset selection
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (idx: number, url: string) => {
    setSelectedPreset(idx);
    setNewRewardImage(url);
  };

  const handleSubmitReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRewardName.trim()) return;

    const pointsValue = newRewardType === 'behavior' && behaviorPolarity === 'negative'
      ? -Math.abs(newRewardPoints)
      : Math.abs(newRewardPoints);
    onAddReward(
      newRewardName,
      newRewardType === 'custom' ? 0 : pointsValue,
      newRewardType,
      newRewardImage,
      newRewardDescription
    );

    // Reset Form
    setNewRewardName('');
    setNewRewardPoints(0);
    setNewRewardType('points');
    setBehaviorPolarity('positive');
    setNewRewardDescription('');
    setNewRewardImage('');
    setSelectedPreset(null);
    setShowAddForm(false);
  };

  // Filter scan logs for reward scan completions
  const rewardLogs = scanLogs.filter((log) => log.actionType === 'RewardAwarded');

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        {/* Abstract rings */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 right-10 w-44 h-44 bg-blue-500/15 rounded-full blur-xl translate-y-1/3" />

        <div className="relative max-w-2xl space-y-2">
          <span className="bg-blue-500/30 text-blue-100 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider inline-block">
            Classroom Gamification Mode
          </span>
          <h1 className="text-3xl font-black tracking-tight leading-none">Rewards Hub</h1>
          <p className="text-xs text-blue-100/90 font-medium leading-relaxed">
            Select an active reward, then scan student IDs to grant instant points or custom prizes! 
            Create visual rewards, edit point stamps, or simulate scanning to motivate your class with beautiful celebrations.
          </p>
        </div>
      </div>

      {/* 2. Selection of Active Reward on Scan Panel */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" /> Active Scanner Target
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              The chosen reward will be awarded to students when their cards are scanned.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeReward ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm">
                <CheckCircle className="w-4 h-4 text-amber-600" />
                Selected: <span className="underline">{activeReward.name}</span> 
                {activeReward.pointsValue !== 0 && ` (${activeReward.pointsValue > 0 ? '+' : ''}${activeReward.pointsValue} pts)`}
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2">
                ⚠️ No Active Target Chosen (Scan will only log selection)
              </div>
            )}
          </div>
        </div>

        {/* Dynamic scan alert */}
        <div className="bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm animate-pulse">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-950">Scan-to-Reward Loop Active!</p>
              <p className="text-[11px] text-indigo-700/90 font-medium">
                Scanning any student card barcode (e.g. <code className="bg-indigo-100/80 px-1 rounded font-mono font-bold">STU1001</code>) while on this tab awards them the active prize.
              </p>
            </div>
          </div>

          {/* Simulated Scanner Sandbox trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={simStudentId}
              onChange={(e) => setSimStudentId(e.target.value)}
              className="py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Student --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id})
                </option>
              ))}
            </select>
            <button
              disabled={!simStudentId || !activeRewardId}
              onClick={() => {
                if (simStudentId && activeRewardId) {
                  onAwardReward(simStudentId, activeRewardId);
                  setSimStudentId('');
                }
              }}
              className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" /> Award Selected Student
            </button>
          </div>
        </div>
      </div>

      {/* 3. Grid of Rewards (Teacher Point Stamps & Custom Prizes) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="leading-tight">
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Reward Catalog</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Edit point rewards or manage custom prizes with pictures below.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQuickScanSheet(true)}
                disabled={activeRewards.length === 0}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <Printer className="h-4 w-4" /> Quick-Scan Sheet
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showAddForm ? 'Cancel Creation' : 'Create New Prize'}
              </button>
            </div>
          </div>

          {/* Form to create a custom reward */}
          {showAddForm && (
            <motion.form
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmitReward}
              className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <span className="font-extrabold text-slate-800 text-sm">Add Reward, Prize, or Behavior</span>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Option Type</label>
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
                  {([
                    { value: 'points', label: 'Point Reward' },
                    { value: 'custom', label: 'Prize' },
                    { value: 'behavior', label: 'Behavior' }
                  ] as const).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setNewRewardType(option.value);
                        if (option.value === 'custom') setNewRewardPoints(0);
                      }}
                      className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${newRewardType === option.value ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Reward Name *</label>
                  <input
                    type="text"
                    required
                    value={newRewardName}
                    onChange={(e) => setNewRewardName(e.target.value)}
                    placeholder="e.g. Popcorn Party Pass, Star Sticker"
                    className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    {newRewardType === 'behavior' ? 'Behavior Points' : 'Points Value Bonus'}
                  </label>
                  {newRewardType === 'behavior' && (
                    <div className="mb-2 flex gap-2">
                      <button type="button" onClick={() => setBehaviorPolarity('positive')} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[10px] font-bold ${behaviorPolarity === 'positive' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'}`}>
                        <ThumbsUp className="h-3.5 w-3.5" /> Positive
                      </button>
                      <button type="button" onClick={() => setBehaviorPolarity('negative')} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[10px] font-bold ${behaviorPolarity === 'negative' ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-500'}`}>
                        <ThumbsDown className="h-3.5 w-3.5" /> Negative
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={newRewardPoints}
                      onChange={(e) => setNewRewardPoints(parseInt(e.target.value) || 0)}
                      disabled={newRewardType === 'custom'}
                      className="w-24 py-2.5 px-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[11px] text-slate-400 font-medium">
                      {newRewardType === 'behavior'
                        ? `${behaviorPolarity === 'positive' ? 'Add to' : 'Take from'} the student's balance`
                        : newRewardType === 'custom' ? 'Prizes do not change points' : 'Points to add to the student balance'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Description</label>
                <input
                  type="text"
                  value={newRewardDescription}
                  onChange={(e) => setNewRewardDescription(e.target.value)}
                  placeholder="Describe how the student earns this prize or what it allows."
                  className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Picture Configuration */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Reward Picture (Choose Preset or Upload)</label>
                
                {/* Scrollable preset illustrations */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {ILLUSTRATION_PRESETS.map((preset, idx) => (
                    <button
                      type="button"
                      key={preset.name}
                      onClick={() => handleSelectPreset(idx, preset.url)}
                      className={`px-3 py-2 border rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        selectedPreset === idx
                          ? 'border-blue-500 bg-blue-50/70 text-blue-800 ring-2 ring-blue-100'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt=""
                        className="w-4 h-4 rounded-md object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {preset.name.split(' ')[1]}
                    </button>
                  ))}
                </div>

                {/* Upload own picture */}
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 p-3 rounded-xl">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload File (JPG/PNG)
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="flex-1 text-[11px] text-slate-400 font-medium">
                    {newRewardImage ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Image attached successfully!
                      </span>
                    ) : (
                      'No custom image uploaded (will fall back to default trophy)'
                    )}
                  </div>

                  {newRewardImage && (
                    <div className="w-10 h-10 border border-slate-200 rounded-lg overflow-hidden shrink-0 bg-white shadow-sm">
                      <img
                        src={newRewardImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit button */}
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="py-2 px-4 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100 cursor-pointer"
                >
                  Save Reward
                </button>
              </div>
            </motion.form>
          )}

          {/* Cards Grid */}
          {activeRewards.length === 0 ? (
            <div className="border border-dashed border-slate-300 p-8 text-center text-slate-500 rounded-xl">
              <Archive className="w-7 h-7 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold">No active rewards</p>
              <p className="text-[11px] mt-1">Add a new prize or restore one from the rewards library.</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeRewards.map((reward) => {
              const isActive = reward.id === activeRewardId;
              
              return (
                <div
                  key={reward.id}
                  className={`bg-white border rounded-2xl p-4.5 shadow-sm transition-all flex flex-col justify-between relative overflow-hidden group ${
                    isActive
                      ? 'border-amber-400 ring-4 ring-amber-50 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Active target sash overlay */}
                  {isActive && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-400 text-white text-[9px] font-extrabold uppercase px-3 py-1 rounded-bl-xl shadow-sm z-10 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-white fill-white animate-spin" /> ACTIVE TARGET
                    </div>
                  )}

                  {/* Top card block */}
                  <div className="space-y-3.5">
                    {/* Picture and Header info */}
                    <div className="flex gap-3">
                      <div className="w-14 h-14 rounded-xl border border-slate-200 shrink-0 overflow-hidden bg-slate-50 flex items-center justify-center relative shadow-sm">
                        <SafeRewardImage
                          src={reward.imageUrl}
                          alt={reward.name}
                          name={reward.name}
                          type={reward.type}
                          className="w-full h-full object-cover"
                          iconClassName="w-6 h-6"
                        />
                        <span className={`absolute bottom-0 inset-x-0 text-[8px] uppercase font-black text-white text-center py-0.5 ${
                          reward.type === 'behavior' ? (reward.pointsValue < 0 ? 'bg-rose-500' : 'bg-sky-600') : reward.type === 'points' ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`}>
                          {reward.type === 'behavior' ? 'Behavior' : reward.type === 'points' ? 'Stamp' : 'Prize'}
                        </span>
                      </div>

                      <div className="flex-1 space-y-0.5 leading-snug">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">{reward.id}</span>
                        <h3 className="font-extrabold text-slate-800 text-sm leading-snug group-hover:text-blue-600 transition-colors">
                          {reward.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 leading-snug font-medium line-clamp-2 mt-0.5">
                          {reward.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>

                    {/* Adjustable Point Value Control (editable by teacher!) */}
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Coins className="w-4 h-4 text-amber-500" />
                        <span className="text-[11px] font-bold text-slate-600">Scan Points:</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const val = Math.max(reward.type === 'behavior' ? -1000 : 0, reward.pointsValue - 5);
                            onUpdateReward(reward.id, { pointsValue: val });
                          }}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Deduct 5 points"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>
                        
                        <input
                          type="number"
                          min={reward.type === 'behavior' ? -1000 : 0}
                          max="1000"
                          value={reward.pointsValue}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            onUpdateReward(reward.id, { pointsValue: reward.type === 'behavior' ? Math.max(-1000, Math.min(1000, val)) : Math.max(0, val) });
                          }}
                          className="w-12 bg-white text-center py-1.5 border border-slate-200 rounded-lg text-xs font-black text-slate-800 focus:outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            const val = Math.min(1000, reward.pointsValue + 5);
                            onUpdateReward(reward.id, { pointsValue: val });
                          }}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Add 5 points"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer block */}
                  <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold">
                      Awarded: <strong className="text-slate-700">{reward.awardedCount} times</strong>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onArchiveReward(reward.id)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Move to Rewards Library"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      {/* Delete reward button */}
                      <button
                        onClick={() => onDeleteReward(reward.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title={reward.wasArchived ? 'Remove from Active Rewards' : 'Delete Prize'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Select as active scanner target */}
                      <button
                        onClick={() => onSelectActiveReward(isActive ? null : reward.id)}
                        className={`py-1.5 px-3.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          isActive
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isActive ? 'Target Active' : 'Select Target'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200/60">
            <button
              type="button"
              onClick={() => setShowArchive(!showArchive)}
              className="flex items-center justify-between w-full p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Archive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Rewards Library</h3>
                  <p className="text-[10px] text-slate-400 font-medium">{archivedRewards.length} archived rewards available to restore</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500">{showArchive ? 'Hide' : 'Show Library'}</span>
            </button>

            {showArchive && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {archivedRewards.length === 0 ? (
                  <p className="col-span-full text-center text-xs text-slate-400 py-5">No rewards are archived.</p>
                ) : archivedRewards.map((reward) => (
                  <div key={reward.id} className="border border-slate-200 rounded-xl p-3 flex items-center gap-3 bg-white">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 shrink-0">
                      <SafeRewardImage src={reward.imageUrl} alt={reward.name} name={reward.name} type={reward.type} className="w-full h-full object-cover" iconClassName="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-700 truncate">{reward.name}</p>
                      <p className={`text-[10px] font-semibold ${reward.pointsValue < 0 ? 'text-rose-500' : 'text-slate-400'}`}>{reward.pointsValue > 0 ? '+' : ''}{reward.pointsValue} pts</p>
                    </div>
                    <button onClick={() => onRestoreReward(reward.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Add to Active Rewards">
                      <ArchiveRestore className="w-4 h-4" />
                    </button>
                    <button onClick={() => onPermanentlyDeleteReward(reward.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg" title="Delete Permanently from Library">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4. Sidebar Stats & History Feed */}
        <div className="space-y-6">
          {/* Stats Summary */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Trophy className="w-4 h-4 text-amber-500" /> Reward Leaderboard
            </h3>

            <div className="space-y-3.5">
              {rewards
                .sort((a, b) => b.awardedCount - a.awardedCount)
                .slice(0, 4)
                .map((r, idx) => (
                  <div key={r.id} className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-400 w-4">{idx + 1}.</span>
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 shrink-0 flex items-center justify-center">
                      <SafeRewardImage
                        src={r.imageUrl}
                        alt={r.name}
                        name={r.name}
                        type={r.type}
                        className="w-full h-full object-cover"
                        iconClassName="w-4 h-4"
                      />
                    </div>
                    <div className="flex-1 leading-tight min-w-0">
                      <span className="text-xs font-bold text-slate-800 block truncate">{r.name}</span>
                      <span className={`text-[10px] font-semibold block ${r.pointsValue < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {r.type === 'custom' ? 'Prize Item' : `${r.pointsValue > 0 ? '+' : ''}${r.pointsValue} pts`}
                      </span>
                    </div>
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-black shrink-0">
                      {r.awardedCount}x
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Activity Logs */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <History className="w-4 h-4 text-blue-500" /> Recent Rewards Logs
            </h3>

            {rewardLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <Award className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-[11px] font-medium leading-normal">
                  No rewards scanned yet.
                  <br />Select a target reward and scan a student!
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {rewardLogs.slice(0, 8).map((log) => {
                  const rewardObj = rewards.find((r) => r.id === log.rawCode);
                  return (
                    <div key={log.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 relative">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center shrink-0">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                        </div>
                        <div className="flex-1 leading-tight min-w-0">
                          <span className="text-[11px] font-black text-slate-800 block truncate">
                            {log.message.replace('Awarded "', '').split('" to ')[1] || 'Student'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold block">
                            Awarded: {rewardObj?.name || 'Classroom Prize'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold border-t border-slate-100 pt-1.5">
                        <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {rewardObj && rewardObj.pointsValue > 0 && (
                          <span className="text-emerald-600 font-black">+{rewardObj.pointsValue} pts</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showQuickScanSheet && (
        <RewardQuickScanSheet
          classId={classId}
          className={className}
          schoolName={schoolName}
          rewards={rewards}
          onClose={() => setShowQuickScanSheet(false)}
        />
      )}
    </div>
  );
}
