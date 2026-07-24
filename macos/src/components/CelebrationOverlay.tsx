/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Sparkles, Star, Trophy, CheckCircle, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Student, RewardItem } from '../types';
import SafeRewardImage from './SafeRewardImage';

interface CelebrationOverlayProps {
  info: {
    student: Student;
    reward: RewardItem;
    timestamp: number;
  } | null;
  onClose: () => void;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  angle: number;
}

export default function CelebrationOverlay({ info, onClose }: CelebrationOverlayProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!info) return;

    // Generate random confetti pieces
    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4'];
    const pieces: ConfettiPiece[] = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage width
      y: -10 - Math.random() * 20, // start above viewport
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 6,
      delay: Math.random() * 0.5,
      duration: Math.random() * 2.5 + 1.5,
      angle: Math.random() * 360
    }));
    setConfetti(pieces);

    const timer = setTimeout(() => {
      onClose();
    }, 4500);

    return () => clearTimeout(timer);
  }, [info, onClose]);

  if (!info) return null;

  const { student, reward } = info;
  const isNegativeBehavior = reward.type === 'behavior' && reward.pointsValue < 0;
  const isBehavior = reward.type === 'behavior';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop blur overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
        />

        {/* Confetti rain */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {!isNegativeBehavior && confetti.map((p) => (
            <motion.div
              key={p.id}
              initial={{ y: `${p.y}vh`, x: `${p.x}vw`, rotate: 0, opacity: 1 }}
              animate={{
                y: '105vh',
                x: `${p.x + (Math.random() * 20 - 10)}vw`,
                rotate: p.angle + 720,
                opacity: [1, 1, 0.8, 0]
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: 'easeOut',
                repeat: 0
              }}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                zIndex: 60
              }}
            />
          ))}
        </div>

        {/* Core Splash Card */}
        <motion.div
          initial={{ scale: 0.85, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: -20, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative bg-white border border-slate-100 rounded-3xl p-6 md:p-8 max-w-lg w-full text-center shadow-2xl z-10 flex flex-col items-center overflow-hidden"
        >
          {/* Sparkly Ambient Background Glow */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Golden Badge Accent */}
          <div className="relative flex items-center justify-center mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 w-20 h-20 rounded-full border-2 border-dashed border-amber-400 opacity-60"
            />
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-full flex items-center justify-center shadow-lg text-white">
              {isNegativeBehavior ? <ThumbsDown className="w-8 h-8 text-white" /> : isBehavior ? <ThumbsUp className="w-8 h-8 text-white" /> : <Trophy className="w-8 h-8 text-white drop-shadow-sm" />}
            </div>
            {/* Sparkling stars */}
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-500 animate-bounce" />
            <Star className="absolute -bottom-1 -left-3 w-5 h-5 text-amber-500 fill-amber-400 animate-pulse" />
          </div>

          {/* Heading */}
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600 block mb-1">
            {isBehavior ? 'Student Behavior Recorded' : 'Student Reward Scan'}
          </span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-4">
            {isNegativeBehavior ? `Behavior recorded for ${student.name}` : `Congratulations, ${student.name}!`}
          </h2>

          {/* Winner Image Box */}
          <div className="relative w-44 h-44 rounded-2xl overflow-hidden border-4 border-amber-100 shadow-inner mb-5 group bg-slate-50 flex items-center justify-center">
            <SafeRewardImage
              src={reward.imageUrl}
              alt={reward.name}
              name={reward.name}
              type={reward.type}
              className="w-full h-full object-cover"
              iconClassName="w-16 h-16"
            />
            <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-sm text-[10px] text-white font-bold py-1 px-2.5 rounded-lg">
              {isBehavior ? (isNegativeBehavior ? 'Points Deduction' : 'Positive Behavior') : reward.type === 'points' ? 'Points Bonus' : 'Classroom Prize'}
            </div>
          </div>

          {/* Reward specifics */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 w-full mb-6">
            <h3 className="font-bold text-slate-900 text-lg leading-snug">
              {reward.name}
            </h3>
            {reward.description && (
              <p className="text-xs text-slate-500 font-medium mt-1">
                {reward.description}
              </p>
            )}
            
            {reward.pointsValue !== 0 && (
              <div className={`mt-3 inline-flex items-center gap-1.5 font-bold px-3 py-1 rounded-full text-sm shadow-sm ${reward.pointsValue < 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {reward.pointsValue < 0 ? <ThumbsDown className="w-4 h-4 text-rose-600" /> : <CheckCircle className="w-4 h-4 text-emerald-600" />}
                {reward.pointsValue > 0 ? '+' : ''}{reward.pointsValue} Points {reward.pointsValue < 0 ? 'Removed' : 'Awarded'}
              </div>
            )}
          </div>

          {/* Student details and total points */}
          <div className="flex items-center gap-3 bg-slate-900 text-slate-100 px-5 py-3 rounded-2xl w-full mb-6 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              {student.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left flex-1 leading-tight">
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Scanned Student</span>
              <span className="text-xs font-bold block text-white">{student.name} ({student.grade})</span>
            </div>
            <div className="text-right leading-tight">
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">New Balance</span>
              <span className="text-sm font-black block text-amber-400">{student.points} pts</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2.5 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-200 hover:shadow-blue-300 cursor-pointer"
            >
              Okay, Keep Scanning
            </button>
          </div>

          <div className="text-[10px] text-slate-400 mt-4.5 font-semibold">
            Auto-dismissing in 4s...
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
