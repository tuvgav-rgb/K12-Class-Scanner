/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClassSession, Student, Assignment, AssignmentSubmission, StoreItem, Transaction, ScanLog, RewardItem } from '../types';
import trophyImage from '../assets/rewards/trophy.jpg';
import effortImage from '../assets/rewards/effort.jpg';
import bonusImage from '../assets/rewards/bonus.jpg';

const DEFAULT_CLASSES: ClassSession[] = [
  { id: 'default_class', name: 'My Classroom' }
];

export const DEFAULT_STORE_ITEMS: StoreItem[] = [
  {
    id: 'ITM101',
    name: "Teacher's Assistant for a Day",
    cost: 150,
    description: 'Help the teacher run activities, lead line transitions, and manage tasks.',
    stock: 2,
    category: 'Privileges',
    iconName: 'Crown',
    archived: true,
    wasArchived: true
  },
  {
    id: 'ITM103',
    name: 'Homework Pass (1 Night)',
    cost: 200,
    description: 'Skip one regular night homework assignment of your choice.',
    stock: 5,
    category: 'Privileges',
    iconName: 'FileBadge',
    archived: true,
    wasArchived: true
  },
  {
    id: 'ITM104',
    name: 'Sparkly Mechanical Pencil',
    cost: 40,
    description: 'Premium glitter mechanical pencil with a tube of 0.7mm lead refills.',
    stock: 12,
    category: 'Supplies',
    iconName: 'Pencil',
    archived: true,
    wasArchived: true
  },
  {
    id: 'ITM105',
    name: 'Team Captain at Recess',
    cost: 60,
    description: 'Choose your team and lead the games during recess.',
    stock: 3,
    category: 'Privileges',
    iconName: 'Users',
    archived: true,
    wasArchived: true
  },
  {
    id: 'ITM106',
    name: 'Fun-size Fruit Snacks',
    cost: 25,
    description: 'A packet of organic, natural fruit chew snacks.',
    stock: 20,
    category: 'Snacks',
    iconName: 'Cookie',
    archived: true,
    wasArchived: true
  },
  {
    id: 'ITM107',
    name: 'Lunch with the Teacher',
    cost: 180,
    description: 'Eat your lunch with the teacher inside the classroom and bring 1 friend!',
    stock: 4,
    category: 'Privileges',
    iconName: 'Coffee',
    archived: true,
    wasArchived: true
  },
  {
    id: 'ITM108',
    name: 'Sticker Pack (Choose 5)',
    cost: 15,
    description: 'A selection of 5 premium vinyl stickers for laptops or notebooks.',
    stock: 35,
    category: 'Prizes',
    iconName: 'Sparkles',
    archived: true,
    wasArchived: true
  }
];

export const DEFAULT_REWARDS: RewardItem[] = [
  {
    id: 'REW101',
    name: 'Star Participation',
    pointsValue: 10,
    type: 'points',
    imageUrl: trophyImage,
    description: 'Awarded for excellent participation, answering questions, or leading a team.',
    awardedCount: 0,
    archived: true,
    wasArchived: true
  },
  {
    id: 'REW102',
    name: 'Superb Effort Award',
    pointsValue: 25,
    type: 'points',
    imageUrl: effortImage,
    description: 'For going above and beyond on assignments, projects, or classwork.',
    awardedCount: 0,
    archived: true,
    wasArchived: true
  },
  {
    id: 'REW103',
    name: 'Bonus Points',
    pointsValue: 5,
    type: 'points',
    imageUrl: bonusImage,
    description: 'Awards additional points to the scanned student.',
    awardedCount: 0,
    archived: true,
    wasArchived: true
  }
];

export interface AppState {
  students: Student[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  storeItems: StoreItem[];
  transactions: Transaction[];
  scanLogs: ScanLog[];
}

export function getClassKeys(classId: string) {
  return {
    STUDENTS: `class_scanner_${classId}_students`,
    ASSIGNMENTS: `class_scanner_${classId}_assignments`,
    SUBMISSIONS: `class_scanner_${classId}_submissions`,
    STORE_ITEMS: `class_scanner_${classId}_store_items`,
    TRANSACTIONS: `class_scanner_${classId}_transactions`,
    SCAN_LOGS: `class_scanner_${classId}_scan_logs`,
    SUBJECTS: `class_scanner_${classId}_subjects`,
    REWARDS: `class_scanner_${classId}_rewards`,
    ACTIVE_REWARD_ID: `class_scanner_${classId}_active_reward_id`
  };
}

// Get all classes
export function getClasses(): ClassSession[] {
  const classesStr = localStorage.getItem('class_scanner_classes');
  if (classesStr) {
    try {
      return JSON.parse(classesStr);
    } catch (e) {
      console.error('Error parsing classes:', e);
    }
  }

  // Check if there is existing data under the old default keys
  const oldStudents = localStorage.getItem('class_scanner_students');
  if (oldStudents) {
    const migratedClasses: ClassSession[] = [
      { id: 'default_class', name: 'My Classroom' }
    ];
    localStorage.setItem('class_scanner_classes', JSON.stringify(migratedClasses));
    localStorage.setItem('class_scanner_active_class_id', 'default_class');

    // Copy old data to default_class keys
    const oldKeys = {
      STUDENTS: 'class_scanner_students',
      ASSIGNMENTS: 'class_scanner_assignments',
      SUBMISSIONS: 'class_scanner_submissions',
      STORE_ITEMS: 'class_scanner_store_items',
      TRANSACTIONS: 'class_scanner_transactions',
      SCAN_LOGS: 'class_scanner_scan_logs',
      SUBJECTS: 'class_scanner_subjects',
      REWARDS: 'class_scanner_rewards',
      ACTIVE_REWARD_ID: 'class_scanner_active_reward_id'
    };
    const newKeys = getClassKeys('default_class');

    Object.keys(oldKeys).forEach((k) => {
      const val = localStorage.getItem(oldKeys[k as keyof typeof oldKeys]);
      if (val) {
        localStorage.setItem(newKeys[k as keyof typeof newKeys], val);
      }
    });

    return migratedClasses;
  }

  // Create default classes
  const defaultClasses = DEFAULT_CLASSES;
  localStorage.setItem('class_scanner_classes', JSON.stringify(defaultClasses));
  localStorage.setItem('class_scanner_active_class_id', 'default_class');

  initializeClassData('default_class');

  return defaultClasses;
}

export function saveClasses(classes: ClassSession[]) {
  localStorage.setItem('class_scanner_classes', JSON.stringify(classes));
}

export function getActiveClassId(): string {
  const activeId = localStorage.getItem('class_scanner_active_class_id');
  if (activeId) return activeId;
  const classes = getClasses();
  return classes[0]?.id || 'default_class';
}

export function saveActiveClassId(id: string) {
  localStorage.setItem('class_scanner_active_class_id', id);
}

export function initializeClassData(classId: string) {
  const keys = getClassKeys(classId);
  localStorage.setItem(keys.STUDENTS, JSON.stringify([]));
  localStorage.setItem(keys.ASSIGNMENTS, JSON.stringify([]));
  localStorage.setItem(keys.SUBMISSIONS, JSON.stringify([]));
  localStorage.setItem(keys.STORE_ITEMS, JSON.stringify(DEFAULT_STORE_ITEMS));
  localStorage.setItem(keys.TRANSACTIONS, JSON.stringify([]));
  localStorage.setItem(keys.SCAN_LOGS, JSON.stringify([]));
  localStorage.setItem(keys.SUBJECTS, JSON.stringify(['Math', 'Reading', 'Science', 'Spelling', 'Social Studies', 'Other']));

  localStorage.setItem(keys.REWARDS, JSON.stringify(DEFAULT_REWARDS));
  localStorage.setItem(keys.ACTIVE_REWARD_ID, DEFAULT_REWARDS[0].id);
}

function loadList<T>(value: string | null, defaultValues: T[] = []): T[] {
  if (!value) return defaultValues;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : defaultValues;
  } catch {
    return defaultValues;
  }
}

function normalizeStoreItems(items: StoreItem[]): StoreItem[] {
  const defaultIds = new Set(DEFAULT_STORE_ITEMS.map((item) => item.id));
  return items.map((item) => {
    if (defaultIds.has(item.id)) {
      return { ...item, archived: true, wasArchived: true };
    }
    return {
      ...item,
      archived: item.archived ?? false,
      wasArchived: item.wasArchived ?? Boolean(item.archived)
    };
  });
}

// Load the saved state, treating missing or invalid records as empty lists.
export function loadState(classId: string): AppState {
  const keys = getClassKeys(classId);
  const storedItems = loadList<StoreItem>(localStorage.getItem(keys.STORE_ITEMS), DEFAULT_STORE_ITEMS);
  const storeItems = normalizeStoreItems(storedItems);
  if (storeItems.some((item, index) => item !== storedItems[index])) {
    localStorage.setItem(keys.STORE_ITEMS, JSON.stringify(storeItems));
  }

  return {
    students: loadList<Student>(localStorage.getItem(keys.STUDENTS)),
    assignments: loadList<Assignment>(localStorage.getItem(keys.ASSIGNMENTS)),
    submissions: loadList<AssignmentSubmission>(localStorage.getItem(keys.SUBMISSIONS)),
    storeItems,
    transactions: loadList<Transaction>(localStorage.getItem(keys.TRANSACTIONS)),
    scanLogs: loadList<ScanLog>(localStorage.getItem(keys.SCAN_LOGS))
  };
}

// Save specific tables to localStorage
export function saveStudents(classId: string, students: Student[]) {
  const keys = getClassKeys(classId);
  localStorage.setItem(keys.STUDENTS, JSON.stringify(students));
}

export function saveAssignments(classId: string, assignments: Assignment[]) {
  const keys = getClassKeys(classId);
  localStorage.setItem(keys.ASSIGNMENTS, JSON.stringify(assignments));
}

export function saveSubmissions(classId: string, submissions: AssignmentSubmission[]) {
  const keys = getClassKeys(classId);
  localStorage.setItem(keys.SUBMISSIONS, JSON.stringify(submissions));
}

export function saveStoreItems(classId: string, items: StoreItem[]) {
  const keys = getClassKeys(classId);
  localStorage.setItem(keys.STORE_ITEMS, JSON.stringify(items));
}

export function saveTransactions(classId: string, transactions: Transaction[]) {
  const keys = getClassKeys(classId);
  localStorage.setItem(keys.TRANSACTIONS, JSON.stringify(transactions));
}

export function saveScanLogs(classId: string, scanLogs: ScanLog[]) {
  const keys = getClassKeys(classId);
  localStorage.setItem(keys.SCAN_LOGS, JSON.stringify(scanLogs));
}

