/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ClassSession {
  id: string;
  name: string;
  grade?: string;
  subject?: string;
  schoolName?: string;
}

export interface Student {
  id: string;
  name: string;
  points: number;
  grade: string;
  photoUrl?: string; // Base64 profile picture or image url
  schoolName?: string; // Custom school name
  schoolLogoUrl?: string; // Base64 school logo
  qrCodeOption?: 'id_only' | 'id_and_name'; // QR includes name or just ID
  barcodeOption?: 'barcode_only' | 'qr_only' | 'both'; // Code visual style
  cardTheme?: string; // Theme identifier
  printColorMode?: 'color' | 'bw'; // Print styling (Full-Color or Ink-Saver B&W)
}

export interface Assignment {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  pointsValue: number;
  category: 'Homework' | 'Classwork' | 'Project' | 'Quiz';
  subject?: string;
}

export interface AssignmentSubmission {
  id: string; // studentId_assignmentId
  studentId: string;
  assignmentId: string;
  completed: boolean;
  completedAt?: string; // ISO date string
}

export interface StoreItem {
  id: string;
  name: string;
  cost: number;
  description: string;
  stock: number;
  category: 'Privileges' | 'Supplies' | 'Snacks' | 'Prizes';
  iconName: string; // Lucide icon name
  imageUrl?: string; // Optional image url or Base64 encoded image
  archived?: boolean; // Is it archived/saved for later?
  wasArchived?: boolean; // Returns to the library when removed from the active catalog
}

export interface Transaction {
  id: string;
  studentId: string;
  itemId: string;
  timestamp: string;
  pointsCost: number;
}

export interface ScanLog {
  id: string;
  timestamp: string;
  rawCode: string;
  actionType: 'StudentSelected' | 'AssignmentCompleted' | 'ItemPurchased' | 'RewardAwarded' | 'InvalidCode' | 'SystemLog';
  message: string;
  status: 'success' | 'error' | 'warning' | 'info';
}

export interface RewardItem {
  id: string;
  name: string;
  pointsValue: number;
  type: 'points' | 'custom';
  imageUrl?: string; // base64 photo or image URL
  description?: string;
  awardedCount: number;
  archived?: boolean;
  wasArchived?: boolean;
}
