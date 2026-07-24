/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RewardItem } from '../types';
import {
  Sparkles,
  Trophy,
  Coins,
  Gift,
  BookOpen,
  Award,
  Flame,
  Star,
  Lightbulb,
  Users
} from 'lucide-react';

interface SafeRewardImageProps {
  src?: string;
  alt: string;
  name: string;
  type: RewardItem['type'];
  className?: string;
  iconClassName?: string;
}

export function getRewardFallback(name: string, type: RewardItem['type']) {
  const n = name.toLowerCase();

  if (n.includes('star') || n.includes('participation')) {
    return {
      Icon: Star,
      bgGradient: 'from-amber-400 to-yellow-500',
      iconColor: 'text-white'
    };
  }
  if (n.includes('effort') || n.includes('trophy') || n.includes('superb') || n.includes('award') || n.includes('prize')) {
    return {
      Icon: Trophy,
      bgGradient: 'from-blue-500 to-indigo-600',
      iconColor: 'text-white'
    };
  }
  if (n.includes('bonus') || n.includes('point') || n.includes('coins')) {
    return {
      Icon: Coins,
      bgGradient: 'from-emerald-400 to-teal-500',
      iconColor: 'text-white'
    };
  }
  if (n.includes('pizza') || n.includes('cookie') || n.includes('sweet') || n.includes('food') || n.includes('party')) {
    return {
      Icon: Flame,
      bgGradient: 'from-orange-400 to-rose-500',
      iconColor: 'text-white'
    };
  }
  if (n.includes('pencil') || n.includes('desk') || n.includes('school') || n.includes('paper')) {
    return {
      Icon: Lightbulb,
      bgGradient: 'from-purple-400 to-indigo-500',
      iconColor: 'text-white'
    };
  }
  if (n.includes('reading') || n.includes('book') || n.includes('adventure')) {
    return {
      Icon: BookOpen,
      bgGradient: 'from-cyan-400 to-blue-500',
      iconColor: 'text-white'
    };
  }
  if (n.includes('treasure') || n.includes('box') || n.includes('toy')) {
    return {
      Icon: Gift,
      bgGradient: 'from-pink-500 to-rose-600',
      iconColor: 'text-white'
    };
  }
  if (n.includes('captain') || n.includes('leader') || n.includes('team')) {
    return {
      Icon: Users,
      bgGradient: 'from-violet-500 to-purple-600',
      iconColor: 'text-white'
    };
  }

  // Default fallbacks based on type
  if (type === 'points') {
    return {
      Icon: Award,
      bgGradient: 'from-emerald-500 to-teal-600',
      iconColor: 'text-white'
    };
  }
  return {
    Icon: Gift,
    bgGradient: 'from-indigo-500 to-blue-600',
    iconColor: 'text-white'
  };
}

export default function SafeRewardImage({
  src,
  alt,
  name,
  type,
  className = 'w-full h-full object-cover',
  iconClassName = 'w-6 h-6'
}: SafeRewardImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    const { Icon, bgGradient, iconColor } = getRewardFallback(name, type);
    return (
      <div className={`w-full h-full bg-gradient-to-br ${bgGradient} flex items-center justify-center shadow-inner`}>
        <Icon className={`${iconClassName} ${iconColor} drop-shadow-md`} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
}
