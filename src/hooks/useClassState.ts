/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ClassSession, Student, Assignment, AssignmentSubmission, StoreItem, Transaction, ScanLog, RewardItem } from '../types';
import {
  loadState,
  saveStudents,
  saveAssignments,
  saveSubmissions,
  saveStoreItems,
  saveTransactions,
  saveScanLogs,
  getClasses,
  saveClasses,
  getActiveClassId,
  saveActiveClassId,
  initializeClassData,
  getClassKeys,
  DEFAULT_REWARDS
} from '../utils/db';
import { scannerAudio } from '../utils/audio';
import trophyImage from '../assets/rewards/trophy.jpg';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export interface StoreScanResult {
  item: StoreItem;
  student?: Student;
  status: 'success' | 'error' | 'warning' | 'price-check';
  message: string;
  timestamp: number;
}

export interface CashierCartLine {
  itemId: string;
  quantity: number;
  price: number;
}

interface ScanSnapshot {
  students: Student[];
  submissions: AssignmentSubmission[];
  storeItems: StoreItem[];
  transactions: Transaction[];
  scanLogs: ScanLog[];
  rewards: RewardItem[];
  activeStudentId: string | null;
  activeAssignmentId: string | null;
  loadedSessionAssignmentId: string | null;
}

function inferSubject(name: string): Assignment['subject'] {
  const n = name.toLowerCase();
  if (n.includes('math') || n.includes('fraction') || n.includes(' worksheet') || n.includes('number') || n.includes('arithmetic') || n.includes('algebra') || n.includes('geometry') || n.includes('multiplication') || n.includes('division')) return 'Math';
  if (n.includes('reading') || n.includes('read') || n.includes('book') || n.includes('literature') || n.includes('english') || n.includes('novel')) return 'Reading';
  if (n.includes('science') || n.includes('volcano') || n.includes('tectonic') || n.includes('weather') || n.includes('space') || n.includes('plant') || n.includes('biology') || n.includes('chemical')) return 'Science';
  if (n.includes('spelling') || n.includes('vocab') || n.includes('word') || n.includes('bee') || n.includes('grammar') || n.includes('writing') || n.includes('write')) return 'Spelling';
  if (n.includes('history') || n.includes('social') || n.includes('geography') || n.includes('map') || n.includes('civics') || n.includes('america') || n.includes('culture')) return 'Social Studies';
  return 'Other';
}

export function useClassState() {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [activeClassId, setActiveClassId] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [continuousStorePoints, setContinuousStorePoints] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [activeRewardId, setActiveRewardId] = useState<string | null>(null);
  const [lastAwardedInfo, setLastAwardedInfo] = useState<{ student: Student; reward: RewardItem; timestamp: number } | null>(null);

  // Selection states
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  
  // Continuous Scan Mode assignment buffer
  const [loadedSessionAssignmentId, setLoadedSessionAssignmentId] = useState<string | null>(null);

  // Auto-clear assignment buffer when leaving continuous scan mode
  useEffect(() => {
    if (activeAssignmentId !== 'ASM_VARIOUS') {
      setLoadedSessionAssignmentId(null);
    }
  }, [activeAssignmentId]);
  
  // Custom toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [storeScanResult, setStoreScanResult] = useState<StoreScanResult | null>(null);
  const [undoStack, setUndoStack] = useState<ScanSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<ScanSnapshot[]>([]);

  // Load classes and active class ID on mount
  useEffect(() => {
    const loadedClasses = getClasses();
    const loadedActiveId = getActiveClassId();
    setClasses(loadedClasses);
    setActiveClassId(loadedActiveId);
    setIsInitialized(true);
  }, []);

  // Reload data whenever activeClassId changes
  useEffect(() => {
    if (!activeClassId) return;

    setUndoStack([]);
    setRedoStack([]);

    // Persist active class ID selection
    saveActiveClassId(activeClassId);

    // Load active class data
    const initialState = loadState(activeClassId);
    setStudents(initialState.students);
    
    // Filter out "Various Assignments" if it was previously saved as a real assignment
    const loadedAssignments = initialState.assignments.filter(a => a.id !== 'ASM_VARIOUS');
    saveAssignments(activeClassId, loadedAssignments);
    setAssignments(loadedAssignments);

    setSubmissions(initialState.submissions);
    setStoreItems(initialState.storeItems);
    setContinuousStorePoints(localStorage.getItem(getClassKeys(activeClassId).CONTINUOUS_STORE_POINTS) === 'true');
    setTransactions(initialState.transactions);
    setScanLogs(initialState.scanLogs);

    // Load subjects for this class
    const keys = getClassKeys(activeClassId);
    const savedSubjects = localStorage.getItem(keys.SUBJECTS);
    if (savedSubjects) {
      try {
        setSubjects(JSON.parse(savedSubjects));
      } catch (e) {
        const defaultSubjects = ['Math', 'Reading', 'Science', 'Spelling', 'Social Studies', 'Other'];
        setSubjects(defaultSubjects);
        localStorage.setItem(keys.SUBJECTS, JSON.stringify(defaultSubjects));
      }
    } else {
      const defaultSubjects = ['Math', 'Reading', 'Science', 'Spelling', 'Social Studies', 'Other'];
      setSubjects(defaultSubjects);
      localStorage.setItem(keys.SUBJECTS, JSON.stringify(defaultSubjects));
    }

    // Default active assignment selection
    if (loadedAssignments.length > 0) {
      setActiveAssignmentId(loadedAssignments[0].id);
    } else {
      setActiveAssignmentId('ASM_VARIOUS');
    }

    // Clear active student selection on class switch
    setActiveStudentId(null);

    // Load rewards for this class
    const savedRewards = localStorage.getItem(keys.REWARDS);
    let loadedRewards: RewardItem[] = [];
    if (savedRewards) {
      try {
        loadedRewards = JSON.parse(savedRewards);
      } catch (e) {
        loadedRewards = DEFAULT_REWARDS;
        localStorage.setItem(keys.REWARDS, JSON.stringify(loadedRewards));
      }
    } else {
      loadedRewards = DEFAULT_REWARDS;
      localStorage.setItem(keys.REWARDS, JSON.stringify(loadedRewards));
    }
    const defaultRewardIds = new Set(DEFAULT_REWARDS.map((reward) => reward.id));
    const normalizedRewards = loadedRewards.map((reward) => {
      if (defaultRewardIds.has(reward.id)) {
        return { ...reward, archived: true, wasArchived: true };
      }
      return {
        ...reward,
        archived: reward.archived ?? false,
        wasArchived: reward.wasArchived ?? Boolean(reward.archived)
      };
    });
    if (normalizedRewards.some((reward, index) => reward !== loadedRewards[index])) {
      localStorage.setItem(keys.REWARDS, JSON.stringify(normalizedRewards));
    }
    loadedRewards = normalizedRewards;
    setRewards(loadedRewards);

    // Load active reward ID selection
    const savedActiveRewardId = localStorage.getItem(keys.ACTIVE_REWARD_ID);
    const activeRewards = loadedRewards.filter((reward) => !reward.archived);
    if (savedActiveRewardId && activeRewards.some((reward) => reward.id === savedActiveRewardId)) {
      setActiveRewardId(savedActiveRewardId);
    } else if (activeRewards.length > 0) {
      setActiveRewardId(activeRewards[0].id);
      localStorage.setItem(keys.ACTIVE_REWARD_ID, activeRewards[0].id);
    } else {
      setActiveRewardId(null);
    }
  }, [activeClassId]);

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // State manipulation triggers (with automatic save)
  const updateStudentsState = (newStudents: Student[]) => {
    setStudents(newStudents);
    if (activeClassId) {
      saveStudents(activeClassId, newStudents);
    }
  };

  const updateAssignmentsState = (newAssignments: Assignment[]) => {
    setAssignments(newAssignments);
    if (activeClassId) {
      saveAssignments(activeClassId, newAssignments);
    }
  };

  const updateSubmissionsState = (newSubmissions: AssignmentSubmission[]) => {
    setSubmissions(newSubmissions);
    if (activeClassId) {
      saveSubmissions(activeClassId, newSubmissions);
    }
  };

  const updateStoreItemsState = (newItems: StoreItem[]) => {
    setStoreItems(newItems);
    if (activeClassId) {
      saveStoreItems(activeClassId, newItems);
    }
  };

  const updateTransactionsState = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    if (activeClassId) {
      saveTransactions(activeClassId, newTransactions);
    }
  };

  const updateRewardsState = (newRewards: RewardItem[]) => {
    setRewards(newRewards);
    if (activeClassId) {
      const keys = getClassKeys(activeClassId);
      localStorage.setItem(keys.REWARDS, JSON.stringify(newRewards));
    }
  };

  const captureScanSnapshot = (): ScanSnapshot => ({
    students,
    submissions,
    storeItems,
    transactions,
    scanLogs,
    rewards,
    activeStudentId,
    activeAssignmentId,
    loadedSessionAssignmentId
  });

  const restoreScanSnapshot = (snapshot: ScanSnapshot) => {
    updateStudentsState(snapshot.students);
    updateSubmissionsState(snapshot.submissions);
    updateStoreItemsState(snapshot.storeItems);
    updateTransactionsState(snapshot.transactions);
    updateRewardsState(snapshot.rewards);
    setScanLogs(snapshot.scanLogs);
    if (activeClassId) {
      saveScanLogs(activeClassId, snapshot.scanLogs);
    }
    setActiveStudentId(snapshot.activeStudentId);
    setActiveAssignmentId(snapshot.activeAssignmentId);
    setLoadedSessionAssignmentId(snapshot.loadedSessionAssignmentId);
    setStoreScanResult(null);
  };

  const undoLastScan = () => {
    const previous = undoStack[undoStack.length - 1];
    if (!previous) return;

    const current = captureScanSnapshot();
    setUndoStack((history) => history.slice(0, -1));
    setRedoStack((history) => [...history, current].slice(-25));
    restoreScanSnapshot(previous);
    addToast('Undid the last scan.', 'info');
  };

  const redoLastScan = () => {
    const next = redoStack[redoStack.length - 1];
    if (!next) return;

    const current = captureScanSnapshot();
    setRedoStack((history) => history.slice(0, -1));
    setUndoStack((history) => [...history, current].slice(-25));
    restoreScanSnapshot(next);
    addToast('Redid the last scan.', 'info');
  };

  const selectActiveReward = (id: string | null) => {
    setActiveRewardId(id);
    if (activeClassId) {
      const keys = getClassKeys(activeClassId);
      if (id) {
        localStorage.setItem(keys.ACTIVE_REWARD_ID, id);
      } else {
        localStorage.removeItem(keys.ACTIVE_REWARD_ID);
      }
    }
  };

  const addReward = (name: string, pointsValue: number, type: RewardItem['type'], imageUrl?: string, description?: string) => {
    const newId = 'REW' + Date.now().toString().slice(-6);
    const newReward: RewardItem = {
      id: newId,
      name: name.trim(),
      pointsValue,
      type,
      imageUrl: imageUrl || trophyImage,
      description: (description || '').trim(),
      awardedCount: 0,
      archived: false,
      wasArchived: false
    };
    const updated = [...rewards, newReward];
    updateRewardsState(updated);
    if (!activeRewardId) {
      selectActiveReward(newId);
    }
    addToast(`Added reward: ${newReward.name}`, 'success');
    return newId;
  };

  const deleteReward = (rewardId: string) => {
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward) return;

    if (reward.wasArchived) {
      const updated = rewards.map((item) => item.id === rewardId ? { ...item, archived: true } : item);
      updateRewardsState(updated);
      if (activeRewardId === rewardId) {
        selectActiveReward(updated.find((item) => !item.archived)?.id || null);
      }
      addToast(`Moved "${reward.name}" back to the rewards library.`, 'info');
      return;
    }

    if (confirm(`Are you sure you want to delete reward "${reward.name}"?`)) {
      const updated = rewards.filter((r) => r.id !== rewardId);
      updateRewardsState(updated);
      addToast(`Deleted reward "${reward.name}"`, 'warning');
      if (activeRewardId === rewardId) {
        selectActiveReward(updated[0]?.id || null);
      }
    }
  };

  const archiveReward = (rewardId: string) => {
    const reward = rewards.find((item) => item.id === rewardId);
    if (!reward) return;

    const updated = rewards.map((item) => item.id === rewardId ? { ...item, archived: true, wasArchived: true } : item);
    updateRewardsState(updated);
    if (activeRewardId === rewardId) {
      selectActiveReward(updated.find((item) => !item.archived)?.id || null);
    }
    addToast(`Saved "${reward.name}" to the rewards library.`, 'info');
  };

  const restoreReward = (rewardId: string) => {
    const reward = rewards.find((item) => item.id === rewardId);
    if (!reward) return;

    const updated = rewards.map((item) => item.id === rewardId ? { ...item, archived: false, wasArchived: true } : item);
    updateRewardsState(updated);
    if (!activeRewardId) {
      selectActiveReward(rewardId);
    }
    addToast(`Added "${reward.name}" to the active rewards catalog.`, 'success');
  };

  const permanentlyDeleteReward = (rewardId: string) => {
    const reward = rewards.find((item) => item.id === rewardId);
    if (!reward) return;

    if (confirm(`Are you sure you want to permanently delete "${reward.name}" from the rewards library?`)) {
      const updated = rewards.filter((item) => item.id !== rewardId);
      updateRewardsState(updated);
      if (activeRewardId === rewardId) {
        selectActiveReward(updated.find((item) => !item.archived)?.id || null);
      }
      addToast(`Permanently deleted "${reward.name}" from the rewards library.`, 'warning');
    }
  };

  const updateReward = (rewardId: string, fields: Partial<RewardItem>) => {
    const updated = rewards.map((r) => {
      if (r.id === rewardId) {
        return {
          ...r,
          ...fields,
          name: fields.name !== undefined ? fields.name.trim() : r.name,
          description: fields.description !== undefined ? fields.description.trim() : r.description,
        };
      }
      return r;
    });
    updateRewardsState(updated);
    addToast(`Successfully updated reward details!`, 'success');
  };

  const awardRewardToStudent = (studentId: string, rewardId: string) => {
    const student = students.find((s) => s.id === studentId);
    const reward = rewards.find((r) => r.id === rewardId);

    if (!student || !reward) {
      scannerAudio.playError();
      addToast('Invalid award transaction elements.', 'error');
      return;
    }

    // 1. Update Student Points
    const updatedStudents = students.map((s) => {
      if (s.id === studentId) {
        const nextPoints = Math.max(0, s.points + reward.pointsValue);
        const nextTotalPoints = Math.max(0, s.totalPoints + reward.pointsValue);
        return { ...s, points: nextPoints, totalPoints: nextTotalPoints };
      }
      return s;
    });
    setStudents(updatedStudents);
    if (activeClassId) {
      saveStudents(activeClassId, updatedStudents);
    }

    // 2. Update Reward Awarded Count
    const updatedRewards = rewards.map((r) => {
      if (r.id === rewardId) {
        return { ...r, awardedCount: r.awardedCount + 1 };
      }
      return r;
    });
    setRewards(updatedRewards);
    if (activeClassId) {
      const keys = getClassKeys(activeClassId);
      localStorage.setItem(keys.REWARDS, JSON.stringify(updatedRewards));
    }

    // 3. Play Chime
    scannerAudio.playSuccess();

    // 4. Create Scan Log
    const pointsText = reward.pointsValue === 0 ? '' : ` (${reward.pointsValue > 0 ? '+' : ''}${reward.pointsValue} pts)`;
    const actionText = reward.type === 'behavior'
      ? `${reward.pointsValue < 0 ? 'Recorded negative' : 'Recorded positive'} behavior "${reward.name}" for ${student.name}${pointsText}`
      : `Awarded "${reward.name}" to ${student.name}${pointsText}`;
    addScanLog(
      rewardId,
      'RewardAwarded',
      actionText,
      reward.pointsValue < 0 ? 'warning' : 'success'
    );

    // 5. Trigger Overlay popup for beautiful ceremony!
    // Construct updated student with correct points to show in overlay
    const updatedStudent = updatedStudents.find(s => s.id === studentId) || student;
    setLastAwardedInfo({
      student: updatedStudent,
      reward,
      timestamp: Date.now()
    });

    addToast(
      reward.type === 'behavior'
        ? `${student.name}: ${reward.name}${pointsText}`
        : `Awarded: ${student.name} received "${reward.name}"!${pointsText}`,
      reward.pointsValue < 0 ? 'warning' : 'success'
    );
  };

  const addScanLog = (rawCode: string, actionType: ScanLog['actionType'], message: string, status: ScanLog['status']) => {
    const newLog: ScanLog = {
      id: 'LOG' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 10),
      timestamp: new Date().toISOString(),
      rawCode,
      actionType,
      message,
      status
    };
    const updatedLogs = [newLog, ...scanLogs].slice(0, 50); // Keep last 50 logs
    setScanLogs(updatedLogs);
    if (activeClassId) {
      saveScanLogs(activeClassId, updatedLogs);
    }
  };

  // Helper actions
  const adjustStudentPoints = (studentId: string, amount: number) => {
    const updated = students.map((s) => {
      if (s.id === studentId) {
        const nextPoints = Math.max(0, s.points + amount);
        const nextTotalPoints = Math.max(0, s.totalPoints + amount);
        addToast(`Points adjusted for ${s.name}: ${amount > 0 ? '+' : ''}${amount} pts (Now: ${nextPoints} pts)`, amount > 0 ? 'success' : 'info');
        return { ...s, points: nextPoints, totalPoints: nextTotalPoints };
      }
      return s;
    });
    updateStudentsState(updated);
  };

  const toggleContinuousStorePoints = () => {
    const nextMode = !continuousStorePoints;
    setContinuousStorePoints(nextMode);
    if (activeClassId) {
      localStorage.setItem(getClassKeys(activeClassId).CONTINUOUS_STORE_POINTS, String(nextMode));
    }
    addToast(
      nextMode
        ? 'Continuous Points enabled: purchases will be recorded without subtracting points.'
        : 'Standard store points enabled: purchases will subtract from student balances.',
      'info'
    );
  };

  const getAssignedStudentIds = (excludedCurrentStudentId?: string) => {
    const excludedId = excludedCurrentStudentId?.trim().toUpperCase();
    const assignedIds = new Set<string>();

    classes.forEach((classSession) => {
      const classStudents = classSession.id === activeClassId
        ? students
        : (() => {
            try {
              const storedStudents = localStorage.getItem(getClassKeys(classSession.id).STUDENTS);
              const parsedStudents = storedStudents ? JSON.parse(storedStudents) : [];
              return Array.isArray(parsedStudents) ? parsedStudents as Student[] : [];
            } catch {
              return [] as Student[];
            }
          })();

      classStudents.forEach((student) => {
        const id = student.id.trim().toUpperCase();
        if (id && !(classSession.id === activeClassId && id === excludedId)) {
          assignedIds.add(id);
        }
      });
    });

    return assignedIds;
  };

  const addStudent = (id: string, name: string, grade: string) => {
    const cleanId = id.trim().toUpperCase();
    if (!cleanId) {
      addToast('Student ID is required.', 'error');
      return false;
    }
    if (getAssignedStudentIds().has(cleanId)) {
      addToast(`Student ID ${cleanId} is already assigned in another class or this roster.`, 'error');
      return false;
    }
    const newStudent: Student = {
      id: cleanId,
      name: name.trim(),
      points: 50, // Start with 50 onboarding points!
      totalPoints: 50,
      grade: grade.trim() || '5A'
    };
    updateStudentsState([...students, newStudent]);
    addToast(`Onboarded ${newStudent.name} with +50 points!`, 'success');
    return true;
  };

  const importStudents = (entries: Array<{ id?: string; name: string; points?: number }>, grade = '') => {
    const validEntries = entries.filter((entry) => entry.name.trim());
    if (!activeClassId || validEntries.length === 0) return false;

    const existingIds = getAssignedStudentIds();
    const importedIds = new Set<string>();
    for (const entry of validEntries) {
      const id = entry.id?.trim().toUpperCase();
      if (!id) continue;
      if (existingIds.has(id) || importedIds.has(id)) {
        addToast(`Student ID ${id} is already assigned in another class, this roster, or repeated in this import.`, 'error');
        return false;
      }
      importedIds.add(id);
    }

    let nextNumber = 1001 + students.length;
    const importedStudents = validEntries.map((entry) => {
      let id = entry.id?.trim().toUpperCase() || '';
      if (!id) {
        id = `STU${nextNumber}`;
        while (existingIds.has(id) || importedIds.has(id)) {
          nextNumber += 1;
          id = `STU${nextNumber}`;
        }
        nextNumber += 1;
      }
      existingIds.add(id);
      const points = Number.isFinite(entry.points) ? Math.max(0, Math.round(entry.points as number)) : 50;
      return {
        id,
        name: entry.name.trim(),
        points,
        totalPoints: points,
        grade: grade.trim() || 'Class Roster'
      };
    });

    updateStudentsState([...students, ...importedStudents]);
    addToast(`Imported ${importedStudents.length} students into the roster.`, 'success');
    return true;
  };

  const deleteStudent = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    
    if (confirm(`Are you sure you want to remove ${student.name} from the roster?`)) {
      updateStudentsState(students.filter((s) => s.id !== studentId));
      updateSubmissionsState(submissions.filter((sub) => sub.studentId !== studentId));
      updateTransactionsState(transactions.filter((tx) => tx.studentId !== studentId));
      addToast(`Removed student ${student.name} and their history.`, 'warning');
      if (activeStudentId === studentId) setActiveStudentId(null);
    }
  };

  const updateStudent = (oldId: string, updatedFields: Partial<Student> & { id?: string }) => {
    const cleanNewId = updatedFields.id?.trim().toUpperCase();
    
    // Check if ID is changing and if the new ID already exists
    if (cleanNewId && cleanNewId !== oldId) {
      if (getAssignedStudentIds(oldId).has(cleanNewId)) {
        addToast(`Student ID ${cleanNewId} is already assigned in another class or this roster.`, 'error');
        return false;
      }
    }

    const updatedStudents = students.map((s) => {
      if (s.id === oldId) {
        return {
          ...s,
          ...updatedFields,
          id: cleanNewId || s.id,
          name: updatedFields.name !== undefined ? updatedFields.name.trim() : s.name,
          grade: updatedFields.grade !== undefined ? updatedFields.grade.trim() : s.grade,
        };
      }
      return s;
    });

    updateStudentsState(updatedStudents);

    // If ID changed, propagate to submissions, transactions, and active student selection
    if (cleanNewId && cleanNewId !== oldId) {
      const updatedSubmissions = submissions.map((sub) => {
        if (sub.studentId === oldId) {
          return {
            ...sub,
            studentId: cleanNewId,
            id: `${cleanNewId}_${sub.assignmentId}`
          };
        }
        return sub;
      });
      updateSubmissionsState(updatedSubmissions);

      const updatedTransactions = transactions.map((tx) => {
        if (tx.studentId === oldId) {
          return { ...tx, studentId: cleanNewId };
        }
        return tx;
      });
      updateTransactionsState(updatedTransactions);

      if (activeStudentId === oldId) {
        setActiveStudentId(cleanNewId);
      }
    }

    addToast(`Successfully updated student details!`, 'success');
    return true;
  };

  const addAssignment = (name: string, description: string, category: Assignment['category'], pointsValue: number, dueDate: string, subject?: Assignment['subject']) => {
    const newId = 'ASM' + (1001 + assignments.length);
    const newAssignment: Assignment = {
      id: newId,
      name: name.trim(),
      description: description.trim(),
      category,
      pointsValue,
      dueDate,
      subject: subject || inferSubject(name)
    };
    updateAssignmentsState([...assignments, newAssignment]);
    setActiveAssignmentId(newId);
    addToast(`Created assignment: ${newAssignment.name}`, 'success');
    return newId;
  };

  const deleteAssignment = (assignmentId: string) => {
    if (assignmentId === 'ASM_VARIOUS') {
      addToast('Cannot delete the "Various Assignments" safety option.', 'error');
      return;
    }
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) return;

    if (confirm(`Are you sure you want to delete assignment "${assignment.name}"?`)) {
      updateAssignmentsState(assignments.filter((a) => a.id !== assignmentId));
      updateSubmissionsState(submissions.filter((sub) => sub.assignmentId !== assignmentId));
      addToast(`Deleted assignment "${assignment.name}"`, 'warning');
      if (activeAssignmentId === assignmentId) {
        setActiveAssignmentId(assignments[0]?.id || null);
      }
    }
  };

  const toggleSubmission = (studentId: string, assignmentId: string) => {
    const submissionId = `${studentId}_${assignmentId}`;
    const existing = submissions.find((sub) => sub.id === submissionId);
    const student = students.find((s) => s.id === studentId);
    const assignment = assignments.find((a) => a.id === assignmentId);

    if (!student || !assignment) return;

    let updatedSubmissions: AssignmentSubmission[];
    if (existing) {
      if (existing.completed) {
        // Mark incomplete: deduct points awarded
        updatedSubmissions = submissions.map((sub) => 
          sub.id === submissionId ? { ...sub, completed: false, completedAt: undefined } : sub
        );
        adjustStudentPoints(studentId, -assignment.pointsValue);
        addToast(`Incomplete: ${student.name}'s "${assignment.name}"`, 'info');
      } else {
        // Mark complete: award points
        updatedSubmissions = submissions.map((sub) => 
          sub.id === submissionId ? { ...sub, completed: true, completedAt: new Date().toISOString() } : sub
        );
        adjustStudentPoints(studentId, assignment.pointsValue);
        addToast(`Completed: ${student.name}'s "${assignment.name}" (+${assignment.pointsValue} pts)`, 'success');
      }
    } else {
      // Create new submission: mark complete
      const newSub: AssignmentSubmission = {
        id: submissionId,
        studentId,
        assignmentId,
        completed: true,
        completedAt: new Date().toISOString()
      };
      updatedSubmissions = [...submissions, newSub];
      adjustStudentPoints(studentId, assignment.pointsValue);
      addToast(`Completed: ${student.name}'s "${assignment.name}" (+${assignment.pointsValue} pts)`, 'success');
    }
    updateSubmissionsState(updatedSubmissions);
  };

  const addStoreItem = (name: string, cost: number, description: string, stock: number, category: StoreItem['category'], iconName: string, imageUrl?: string, packageBarcode?: string) => {
    const newId = `ITM${Date.now().toString().slice(-8)}`;
    const normalizedBarcode = packageBarcode?.trim().toUpperCase();
    if (normalizedBarcode && storeItems.some((item) => item.id.toUpperCase() === normalizedBarcode || item.packageBarcode?.toUpperCase() === normalizedBarcode)) {
      addToast(`Barcode ${normalizedBarcode} is already assigned to another store item.`, 'error');
      return false;
    }
    const newItem: StoreItem = {
      id: newId,
      name: name.trim(),
      cost,
      description: description.trim(),
      stock,
      category,
      iconName,
      imageUrl,
      packageBarcode: normalizedBarcode || undefined,
      archived: false
    };
    updateStoreItemsState([...storeItems, newItem]);
    addToast(`Added store item: ${newItem.name}`, 'success');
    return true;
  };

  const updateStoreItem = (itemId: string, updates: Pick<StoreItem, 'name' | 'cost' | 'description' | 'stock' | 'category' | 'iconName'> & { imageUrl?: string; packageBarcode?: string }) => {
    const item = storeItems.find((storeItem) => storeItem.id === itemId);
    if (!item) return false;

    const normalizedBarcode = updates.packageBarcode?.trim().toUpperCase();
    if (normalizedBarcode && storeItems.some((storeItem) =>
      storeItem.id !== itemId && (
        storeItem.id.toUpperCase() === normalizedBarcode ||
        storeItem.packageBarcode?.toUpperCase() === normalizedBarcode
      )
    )) {
      addToast(`Barcode ${normalizedBarcode} is already assigned to another store item.`, 'error');
      return false;
    }

    const updatedItem = {
      ...item,
      ...updates,
      name: updates.name.trim(),
      description: updates.description.trim(),
      packageBarcode: normalizedBarcode || undefined
    };
    updateStoreItemsState(storeItems.map((storeItem) => storeItem.id === itemId ? updatedItem : storeItem));
    addToast(`Updated store item: ${updatedItem.name}`, 'success');
    return true;
  };

  const archiveStoreItem = (itemId: string) => {
    const item = storeItems.find((i) => i.id === itemId);
    if (!item) return;

    const updated = storeItems.map((itm) =>
      itm.id === itemId ? { ...itm, archived: true, wasArchived: true } : itm
    );
    updateStoreItemsState(updated);
    addToast(`Saved "${item.name}" for later (Archived)`, 'info');
  };

  const restoreStoreItem = (itemId: string) => {
    const item = storeItems.find((i) => i.id === itemId);
    if (!item) return;

    const updated = storeItems.map((itm) =>
      itm.id === itemId ? { ...itm, archived: false, wasArchived: true } : itm
    );
    updateStoreItemsState(updated);
    addToast(`Restored "${item.name}" to classroom store`, 'success');
  };

  const deleteStoreItem = (itemId: string) => {
    const item = storeItems.find((i) => i.id === itemId);
    if (!item) return;

    if (item.wasArchived) {
      archiveStoreItem(itemId);
      return;
    }

    if (confirm(`Are you sure you want to PERMANENTLY delete "${item.name}"? This cannot be undone.`)) {
      updateStoreItemsState(storeItems.filter((i) => i.id !== itemId));
      addToast(`Permanently deleted "${item.name}"`, 'warning');
    }
  };

  const permanentlyDeleteStoreItem = (itemId: string) => {
    const item = storeItems.find((i) => i.id === itemId);
    if (!item) return;

    if (confirm(`Are you sure you want to permanently delete "${item.name}" from the library? This cannot be undone.`)) {
      updateStoreItemsState(storeItems.filter((i) => i.id !== itemId));
      addToast(`Permanently deleted "${item.name}" from the library.`, 'warning');
    }
  };

  const checkoutStoreItemDirectly = (studentId: string, itemId: string, fromScan = false) => {
    const student = students.find((s) => s.id === studentId);
    const item = storeItems.find((i) => i.id === itemId);

    if (!student || !item) {
      scannerAudio.playError();
      addToast('Invalid checkout transaction elements.', 'error');
      return false;
    }

    if (item.stock <= 0) {
      scannerAudio.playError();
      const message = `"${item.name}" is out of stock!`;
      addToast(message, 'error');
      if (fromScan) {
        setStoreScanResult({ item, student, status: 'error', message, timestamp: Date.now() });
      }
      return false;
    }

    if (student.points < item.cost) {
      scannerAudio.playError();
      const message = `Insufficient points! ${student.name} needs ${item.cost} pts but only has ${student.points} pts.`;
      addToast(message, 'error');
      if (fromScan) {
        setStoreScanResult({ item, student, status: 'error', message, timestamp: Date.now() });
      }
      return false;
    }

    const nextPoints = continuousStorePoints ? student.points : student.points - item.cost;
    const updatedStudents = students.map((s) => 
      s.id === studentId ? { ...s, points: nextPoints } : s
    );
    updateStudentsState(updatedStudents);

    // Deduct stock
    const updatedItems = storeItems.map((i) => 
      i.id === itemId ? { ...i, stock: i.stock - 1 } : i
    );
    updateStoreItemsState(updatedItems);

    // Create transaction log
    const receiptId = `RCT${Date.now().toString().slice(-8)}`;
    const newTx: Transaction = {
      id: 'TX' + Date.now().toString().slice(-6),
      receiptId,
      studentId,
      itemId,
      timestamp: new Date().toISOString(),
      quantity: 1,
      pointsCost: item.cost
    };
    updateTransactionsState([newTx, ...transactions]);

    // Play chime
    scannerAudio.playCheckout();
    
    // Add scan log
    addScanLog(
      itemId,
      'ItemPurchased',
      `${student.name} purchased ${item.name} for ${item.cost} points`,
      'success'
    );

    const message = continuousStorePoints
      ? `Checkout successful! ${student.name} bought "${item.name}". Balance unchanged in Continuous Points mode.`
      : `Checkout successful! ${student.name} bought "${item.name}" (-${item.cost} pts)`;
    addToast(message, 'success');
    if (fromScan) {
      setStoreScanResult({
        item,
        student: { ...student, points: nextPoints },
        status: 'success',
        message,
        timestamp: Date.now()
      });
    }
    return true;
  };

  const checkoutCashierCart = (studentId: string, lines: CashierCartLine[]) => {
    const student = students.find((candidate) => candidate.id === studentId);
    const validLines = lines.filter((line) => line.quantity > 0 && Number.isFinite(line.price) && line.price >= 0);

    if (!student || validLines.length === 0) {
      scannerAudio.playError();
      addToast('Select a student and add at least one item before confirming the cart.', 'error');
      return false;
    }

    const cartItems = validLines.map((line) => ({ line, item: storeItems.find((item) => item.id === line.itemId) }));
    if (cartItems.some(({ item }) => !item)) {
      scannerAudio.playError();
      addToast('One or more items in this cart are no longer available.', 'error');
      return false;
    }

    const unavailable = cartItems.find(({ line, item }) => (item?.stock || 0) < line.quantity);
    if (unavailable?.item) {
      scannerAudio.playError();
      addToast(`Not enough stock for "${unavailable.item.name}".`, 'error');
      return false;
    }

    const total = validLines.reduce((sum, line) => sum + line.price * line.quantity, 0);
    if (student.points < total) {
      scannerAudio.playError();
      addToast(`${student.name} needs ${total.toLocaleString()} points but only has ${student.points.toLocaleString()}.`, 'error');
      return false;
    }

    if (!continuousStorePoints) {
      updateStudentsState(students.map((candidate) => candidate.id === studentId
        ? { ...candidate, points: candidate.points - total }
        : candidate
      ));
    }
    updateStoreItemsState(storeItems.map((item) => {
      const line = validLines.find((candidate) => candidate.itemId === item.id);
      return line ? { ...item, stock: item.stock - line.quantity } : item;
    }));

    const timestamp = new Date().toISOString();
    const receiptId = `RCT${Date.now().toString().slice(-8)}`;
    const cartTransactions: Transaction[] = validLines.map((line, index) => ({
      id: `TX${Date.now().toString().slice(-6)}${index}`,
      receiptId,
      studentId,
      itemId: line.itemId,
      timestamp,
      quantity: line.quantity,
      pointsCost: line.price * line.quantity
    }));
    updateTransactionsState([...cartTransactions, ...transactions]);
    scannerAudio.playCheckout();
    addScanLog('CASHIER_CART', 'ItemPurchased', `${student.name} purchased ${validLines.length} cart item${validLines.length === 1 ? '' : 's'} for ${total} points`, 'success');
    addToast(
      continuousStorePoints
        ? `Cashier checkout complete: ${student.name}'s purchase was recorded with no points deducted.`
        : `Cashier checkout complete: ${student.name} spent ${total.toLocaleString()} points.`,
      'success'
    );
    return true;
  };

  // Global scanned input parser (routing logic)
  const triggerScan = (rawCode: string, currentTab: string, isPriceCheck = false) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;

    setUndoStack((history) => [...history, captureScanSnapshot()].slice(-25));
    setRedoStack([]);

    // 0. Check if the code is a combined student + assignment ID code (e.g. STU101_ASM101)
    const separators = ['_', '-', ':'];
    for (const sep of separators) {
      if (code.includes(sep)) {
        const parts = code.split(sep);
        if (parts.length === 2) {
          const partA = parts[0].trim().toUpperCase();
          const partB = parts[1].trim().toUpperCase();

          const studentA = students.find((s) => s.id.toUpperCase() === partA);
          const assignmentB = assignments.find((a) => a.id.toUpperCase() === partB);

          const studentB = students.find((s) => s.id.toUpperCase() === partB);
          const assignmentA = assignments.find((a) => a.id.toUpperCase() === partA);

          let matchedStudent;
          let matchedAssignment;

          if (studentA && assignmentB) {
            matchedStudent = studentA;
            matchedAssignment = assignmentB;
          } else if (studentB && assignmentA) {
            matchedStudent = studentB;
            matchedAssignment = assignmentA;
          }

          if (matchedStudent && matchedAssignment) {
            const submissionId = `${matchedStudent.id}_${matchedAssignment.id}`;
            const sub = submissions.find((s) => s.id === submissionId);

            if (sub?.completed) {
              scannerAudio.playSuccess();
              addScanLog(rawCode, 'SystemLog', `${matchedStudent.name} already completed "${matchedAssignment.name}"`, 'info');
              addToast(`${matchedStudent.name} already completed "${matchedAssignment.name}"`, 'info');
            } else {
              toggleSubmission(matchedStudent.id, matchedAssignment.id);
              addScanLog(rawCode, 'AssignmentCompleted', `Marked "${matchedAssignment.name}" complete for ${matchedStudent.name} via combined scan`, 'success');
              addToast(`Recorded: ${matchedStudent.name} completed "${matchedAssignment.name}"! (+${matchedAssignment.pointsValue} pts)`, 'success');
            }
            return;
          }
        }
      }
    }

    // 1. Check if the code is a student ID
    const student = students.find((s) => s.id.trim().toUpperCase() === code);
    if (student) {
      // We scanned a student!
      setActiveStudentId(student.id);

      // Context check
      if (currentTab === 'Assignments') {
        // Assignments tab action:
        if (activeAssignmentId) {
          if (activeAssignmentId === 'ASM_VARIOUS') {
            // Continuous Scan Mode!
            if (loadedSessionAssignmentId) {
              const sessionAssignment = assignments.find(a => a.id.trim().toUpperCase() === loadedSessionAssignmentId.trim().toUpperCase());
              if (sessionAssignment) {
                const submissionId = `${student.id}_${sessionAssignment.id}`;
                const sub = submissions.find((s) => s.id === submissionId);
                if (sub?.completed) {
                  scannerAudio.playSuccess();
                  addScanLog(code, 'SystemLog', `${student.name} already completed "${sessionAssignment.name}"`, 'info');
                  addToast(`${student.name} already completed "${sessionAssignment.name}"`, 'info');
                } else {
                  scannerAudio.playSuccess();
                  toggleSubmission(student.id, sessionAssignment.id);
                  addScanLog(code, 'AssignmentCompleted', `Marked "${sessionAssignment.name}" complete for ${student.name} via Continuous scan`, 'success');
                }
              } else {
                scannerAudio.playError();
                addToast(`Error: Loaded assignment not found. Please scan an assignment barcode first.`, 'error');
                setLoadedSessionAssignmentId(null);
              }
            } else {
              scannerAudio.playError();
              addScanLog(code, 'SystemLog', `Scanned student ${student.name} but no assignment is loaded.`, 'warning');
              addToast(`No active assignment loaded! Scan an ASSIGNMENT barcode first, then scan student cards.`, 'warning');
            }
          } else {
            const assignment = assignments.find((a) => a.id.trim().toUpperCase() === activeAssignmentId.trim().toUpperCase());
            if (assignment) {
              const submissionId = `${student.id}_${assignment.id}`;
              const sub = submissions.find((s) => s.id === submissionId);
              if (sub?.completed) {
                // Already completed
                scannerAudio.playSuccess(); // Standard chime still play, but warn
                addScanLog(code, 'SystemLog', `${student.name} has already submitted "${assignment.name}"`, 'info');
                addToast(`${student.name} already completed "${assignment.name}"`, 'info');
              } else {
                // Toggle completed!
                toggleSubmission(student.id, assignment.id);
                addScanLog(code, 'AssignmentCompleted', `Marked "${assignment.name}" complete for ${student.name}`, 'success');
              }
            }
          }
        } else {
          // No active assignment selected
          scannerAudio.playSuccess();
          addScanLog(code, 'StudentSelected', `Scanned student ${student.name}`, 'success');
          addToast(`Scanned student ${student.name}. Select an assignment to mark completed!`, 'info');
        }
      } else if (currentTab === 'Class Store') {
        // Store tab action: Set as active buyer
        scannerAudio.playSuccess();
        addScanLog(code, 'StudentSelected', `Selected student ${student.name} for store checkout`, 'success');
        addToast(`Store Buyer Selected: ${student.name} (${student.points} pts available). Scan item barcode next!`, 'success');
      } else if (currentTab === 'Rewards Menu') {
        // Rewards Menu action: award the active reward!
        if (activeRewardId) {
          awardRewardToStudent(student.id, activeRewardId);
        } else {
          scannerAudio.playSuccess();
          addScanLog(code, 'StudentSelected', `Scanned student ${student.name}`, 'success');
          addToast(`Scanned student ${student.name}. Select a reward to award next scan!`, 'info');
        }
      } else {
        // Other tabs action: Just select student
        scannerAudio.playSuccess();
        addScanLog(code, 'StudentSelected', `Scanned student ${student.name}`, 'success');
        addToast(`Student Details: ${student.name} (ID: ${student.id}, ${student.points} pts)`, 'info');
      }
      return;
    }

    // 2. Check for the app's item ID or the package barcode assigned to an item.
    const item = storeItems.find((i) =>
      i.id.trim().toUpperCase() === code || i.packageBarcode?.trim().toUpperCase() === code
    );
    if (item) {
      if (isPriceCheck) {
        const message = `${item.name} costs ${item.cost.toLocaleString()} points.`;
        scannerAudio.playSuccess();
        addScanLog(code, 'SystemLog', `Price check: ${item.name} costs ${item.cost} points`, 'info');
        addToast(message, 'info');
        setStoreScanResult({ item, status: 'price-check', message, timestamp: Date.now() });
        return;
      }

      // We scanned an item!
      if (activeStudentId) {
        // Student is selected, perform checkout!
        checkoutStoreItemDirectly(activeStudentId, item.id, true);
      } else {
        // No student selected
        scannerAudio.playError();
        addScanLog(code, 'InvalidCode', `Scanned store item "${item.name}" but no student is active for purchase.`, 'warning');
        const message = `Item scanned: "${item.name}" (${item.cost} pts). Select or scan a student first to checkout!`;
        addToast(message, 'warning');
        setStoreScanResult({ item, status: 'warning', message, timestamp: Date.now() });
      }
      return;
    }

    // 3. Check if the code is an assignment ID
    const assignment = assignments.find((a) => a.id.trim().toUpperCase() === code);
    if (assignment) {
      if (activeAssignmentId === 'ASM_VARIOUS') {
        setLoadedSessionAssignmentId(assignment.id);
        scannerAudio.playSuccess();
        addScanLog(code, 'SystemLog', `Loaded assignment "${assignment.name}" for continuous scanning`, 'success');
        addToast(`Continuous Scan: Loaded assignment "${assignment.name}" (+${assignment.pointsValue} pts). Now scan student cards!`, 'success');
      } else {
        // Select assignment normally
        setActiveAssignmentId(assignment.id);
        scannerAudio.playSuccess();
        addScanLog(code, 'SystemLog', `Selected assignment "${assignment.name}" via scan`, 'success');
        addToast(`Selected assignment: "${assignment.name}"`, 'success');
      }
      return;
    }

    // 4. On the Rewards Menu, scanning a reward sheet code selects that reward as the next scan target.
    const reward = rewards.find((candidate) => !candidate.archived && candidate.id.trim().toUpperCase() === code);
    if (reward && currentTab === 'Rewards Menu') {
      selectActiveReward(reward.id);
      scannerAudio.playSuccess();
      const pointsText = reward.type === 'custom' ? 'prize' : `${reward.pointsValue > 0 ? '+' : ''}${reward.pointsValue} points`;
      addScanLog(code, 'SystemLog', `Selected reward "${reward.name}" (${pointsText}) via quick-scan sheet`, 'success');
      addToast(`Reward selected: ${reward.name} (${pointsText}). Now scan a student.`, 'success');
      return;
    }

    // 5. Invalid code scanned
    scannerAudio.playError();
    addScanLog(code, 'InvalidCode', `Scanned unrecognized code: "${rawCode}"`, 'error');
    addToast(`Unrecognized scan code: "${rawCode}"`, 'error');
  };

  const addSubject = (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return false;
    if (subjects.some(sub => sub.toLowerCase() === cleanName.toLowerCase())) {
      addToast(`Subject "${cleanName}" already exists!`, 'error');
      return false;
    }
    const nextSubjects = [...subjects, cleanName];
    setSubjects(nextSubjects);
    if (activeClassId) {
      const keys = getClassKeys(activeClassId);
      localStorage.setItem(keys.SUBJECTS, JSON.stringify(nextSubjects));
    }
    addToast(`Added custom subject: ${cleanName}`, 'success');
    return true;
  };

  const deleteSubject = (name: string) => {
    if (subjects.length <= 1) {
      addToast(`You must have at least one subject.`, 'error');
      return false;
    }
    const nextSubjects = subjects.filter(sub => sub !== name);
    setSubjects(nextSubjects);
    if (activeClassId) {
      const keys = getClassKeys(activeClassId);
      localStorage.setItem(keys.SUBJECTS, JSON.stringify(nextSubjects));
    }
    const fallbackSubject = nextSubjects[0] || 'General';
    const updatedAssignments = assignments.map(asm => {
      if (asm.subject === name) {
        return { ...asm, subject: fallbackSubject };
      }
      return asm;
    });
    updateAssignmentsState(updatedAssignments);
    addToast(`Subject "${name}" deleted. Linked assignments moved to "${fallbackSubject}".`, 'warning');
    return true;
  };

  // Multi-Class Management Actions
  const createClass = (name: string, grade?: string, subject?: string, schoolName?: string) => {
    const newId = 'class_' + Date.now().toString() + '_' + Math.random().toString().slice(2, 6);
    const newClass: ClassSession = { id: newId, name: name.trim(), grade, subject, schoolName };
    const updated = [...classes, newClass];
    setClasses(updated);
    saveClasses(updated);
    initializeClassData(newId);
    setActiveClassId(newId);
    addToast(`Successfully created class: "${newClass.name}"!`, 'success');
    return newClass;
  };

  const deleteClass = (classId: string) => {
    const classToDelete = classes.find((c) => c.id === classId);
    if (!classToDelete) return;
    if (confirm(`Are you sure you want to delete class "${classToDelete.name}"? This will permanently delete all students, roster details, submissions, transactions, and settings for this class.`)) {
      const updated = classes.filter((c) => c.id !== classId);
      setClasses(updated);
      saveClasses(updated);
      
      // Clean up localStorage keys for this class
      const keys = getClassKeys(classId);
      Object.values(keys).forEach((key) => localStorage.removeItem(key));
      localStorage.removeItem(`class_scanner_store_migrated_v4_${classId}`);

      // Switch active class if possible; otherwise return to first-run setup.
      if (activeClassId === classId) {
        const nextActiveClassId = updated[0]?.id || '';
        setActiveClassId(nextActiveClassId);
        if (nextActiveClassId) {
          saveActiveClassId(nextActiveClassId);
        } else {
          localStorage.removeItem('class_scanner_active_class_id');
        }
      }
      addToast(updated.length === 0 ? 'All classes removed. Start fresh by creating a new class.' : `Deleted class "${classToDelete.name}"`, 'warning');
    }
  };

  const updateClass = (classId: string, updates: Partial<ClassSession>) => {
    const updated = classes.map((c) => {
      if (c.id === classId) {
        return { ...c, ...updates };
      }
      return c;
    });
    setClasses(updated);
    saveClasses(updated);
    addToast(`Successfully updated class settings.`, 'success');
  };

  return {
    classes,
    activeClassId,
    isInitialized,
    setActiveClassId,
    createClass,
    deleteClass,
    updateClass,

    students,
    assignments,
    submissions,
    storeItems,
    continuousStorePoints,
    toggleContinuousStorePoints,
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
    addToast,
    removeToast,
    storeScanResult,
    setStoreScanResult,
    canUndoScan: undoStack.length > 0,
    canRedoScan: redoStack.length > 0,
    undoLastScan,
    redoLastScan,
    adjustStudentPoints,
    addStudent,
    importStudents,
    deleteStudent,
    updateStudent,
    addAssignment,
    deleteAssignment,
    toggleSubmission,
    addStoreItem,
    updateStoreItem,
    archiveStoreItem,
    restoreStoreItem,
    deleteStoreItem,
    permanentlyDeleteStoreItem,
    checkoutStoreItemDirectly,
    checkoutCashierCart,
    triggerScan,
    addSubject,
    deleteSubject,
    // Rewards Menu extensions
    rewards,
    activeRewardId,
    setActiveRewardId: selectActiveReward,
    lastAwardedInfo,
    setLastAwardedInfo,
    addReward,
    deleteReward,
    archiveReward,
    restoreReward,
    permanentlyDeleteReward,
    updateReward,
    awardRewardToStudent
  };
}
