/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import {
  TrendingUp,
  FileDown,
  Printer,
  BarChart3,
  LineChart,
  Sparkles,
  Calendar,
  Layers,
  Coins,
  CheckSquare,
  Search,
  Filter,
  AlertTriangle,
  ChevronRight,
  GraduationCap,
  Clock,
  BookOpen,
  BookMarked,
  Copy,
  Check,
  XSquare,
  ArrowUpRight,
  ShoppingBag,
  Award,
  Activity,
  FileText,
  ReceiptText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, Assignment, AssignmentSubmission, StoreItem, Transaction } from '../types';

interface ReportsViewProps {
  students: Student[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  storeItems: StoreItem[];
  transactions: Transaction[];
  subjects?: string[];
  onAddSubject?: (name: string) => boolean;
  onDeleteSubject?: (name: string) => boolean;
}

interface StudentPerformanceAnalysis {
  student: Student;
  rank: number;
  overallCompleted: number;
  overallTotal: number;
  overallPercent: number;
  overallLetter: string;
  
  homeworkCompleted: number;
  homeworkTotal: number;
  homeworkPercent: number;
  homeworkLetter: string;
  
  classworkCompleted: number;
  classworkTotal: number;
  classworkPercent: number;
  
  projectCompleted: number;
  projectTotal: number;
  projectPercent: number;
  
  quizCompleted: number;
  quizTotal: number;
  quizPercent: number;
  
  subjectStats: {
    [subject: string]: {
      assigned: number;
      completed: number;
      skipped: number;
      percent: number;
    }
  };
  skippedList: Assignment[];
}

interface SalesReceipt {
  id: string;
  student: Student | undefined;
  timestamp: string;
  transactions: Transaction[];
  total: number;
}

// Helper to determine letter grade based on percentage
function getLetterGrade(percent: number): string {
  if (percent >= 97) return 'A+';
  if (percent >= 93) return 'A';
  if (percent >= 90) return 'A-';
  if (percent >= 87) return 'B+';
  if (percent >= 83) return 'B';
  if (percent >= 80) return 'B-';
  if (percent >= 77) return 'C+';
  if (percent >= 73) return 'C';
  if (percent >= 70) return 'C-';
  if (percent >= 67) return 'D+';
  if (percent >= 63) return 'D';
  if (percent >= 60) return 'D-';
  return 'F';
}

// Helper to get grade styling classes
function getGradeBadgeStyle(percent: number): string {
  if (percent >= 90) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (percent >= 80) return 'bg-teal-50 text-teal-700 border-teal-200';
  if (percent >= 70) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (percent >= 60) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-rose-50 text-rose-700 border-rose-200';
}

// Backwards-compatible utility to find the subject of an assignment
function getSubject(asm: Assignment): string {
  if (asm.subject) return asm.subject;
  const n = asm.name.toLowerCase();
  if (n.includes('math') || n.includes('fraction') || n.includes(' worksheet') || n.includes('number') || n.includes('arithmetic') || n.includes('algebra') || n.includes('geometry') || n.includes('multiplication') || n.includes('division')) return 'Math';
  if (n.includes('reading') || n.includes('read') || n.includes('book') || n.includes('literature') || n.includes('english') || n.includes('novel')) return 'Reading';
  if (n.includes('science') || n.includes('volcano') || n.includes('tectonic') || n.includes('weather') || n.includes('space') || n.includes('plant') || n.includes('biology') || n.includes('chemical')) return 'Science';
  if (n.includes('spelling') || n.includes('vocab') || n.includes('word') || n.includes('bee') || n.includes('grammar') || n.includes('writing') || n.includes('write')) return 'Spelling';
  if (n.includes('history') || n.includes('social') || n.includes('geography') || n.includes('map') || n.includes('civics') || n.includes('america') || n.includes('culture')) return 'Social Studies';
  return 'Other';
}

export default function ReportsView({
  students,
  assignments,
  submissions,
  storeItems,
  transactions,
  subjects = [],
  onAddSubject,
  onDeleteSubject
}: ReportsViewProps) {

  // Search, Filter and Selection States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Exemplary' | 'Needs Support' | 'At Risk Math' | 'At Risk Spelling'>('All');
  const [selectedStudentAnalysis, setSelectedStudentAnalysis] = useState<StudentPerformanceAnalysis | null>(null);
  const [activeReportTab, setActiveReportTab] = useState<'grades' | 'skipped' | 'comment' | 'economy'>('grades');
  const [copiedComment, setCopiedComment] = useState(false);
  const [customCommentText, setCustomCommentText] = useState('');
  const [salesSearch, setSalesSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<SalesReceipt | null>(null);

  // Subject Focused Studio States
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjectViewType, setSubjectViewType] = useState<'gradebook' | 'graph'>('gradebook');

  const activeSubjectsForSelect = subjects && subjects.length > 0 ? subjects : ['Math', 'Reading', 'Science', 'Spelling', 'Social Studies', 'Other'];

  React.useEffect(() => {
    if (activeSubjectsForSelect.length > 0 && (!selectedSubject || !activeSubjectsForSelect.includes(selectedSubject))) {
      setSelectedSubject(activeSubjectsForSelect[0]);
    }
  }, [subjects, selectedSubject]);

  // 1. Point Distribution stats
  const totalStudentsCount = students.length;
  const totalAssignmentsCount = assignments.length;
  const totalTransactionsCount = transactions.length;
  const totalPointsAwarded = students.reduce((acc, curr) => acc + curr.points, 0);
  const avgPoints = totalStudentsCount > 0 ? Math.round(totalPointsAwarded / totalStudentsCount) : 0;
  
  // Find top earner
  const sortedByPoints = [...students].sort((a, b) => b.points - a.points);
  const topStudent = sortedByPoints[0] || null;

  // Most popular store item purchased
  const itemPurchaseCounts: { [key: string]: number } = {};
  transactions.forEach((tx) => {
    itemPurchaseCounts[tx.itemId] = (itemPurchaseCounts[tx.itemId] || 0) + 1;
  });
  let mostPopularItem: StoreItem | null = null;
  let maxPurchases = 0;
  Object.keys(itemPurchaseCounts).forEach((itemId) => {
    if (itemPurchaseCounts[itemId] > maxPurchases) {
      maxPurchases = itemPurchaseCounts[itemId];
      mostPopularItem = storeItems.find((item) => item.id === itemId) || null;
    }
  });

  const salesReceipts = Object.values(transactions.reduce<Record<string, Transaction[]>>((grouped, transaction) => {
    const receiptKey = transaction.receiptId || `${transaction.studentId}-${transaction.timestamp}`;
    grouped[receiptKey] = [...(grouped[receiptKey] || []), transaction];
    return grouped;
  }, {})).map((receiptTransactions) => ({
    id: receiptTransactions[0].receiptId || receiptTransactions[0].id,
    student: students.find((student) => student.id === receiptTransactions[0].studentId),
    timestamp: receiptTransactions[0].timestamp,
    transactions: receiptTransactions,
    total: receiptTransactions.reduce((sum, transaction) => sum + transaction.pointsCost, 0)
  })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredSalesReceipts = salesReceipts.filter((receipt) => {
    const query = salesSearch.trim().toLowerCase();
    if (!query) return true;
    const itemNames = receipt.transactions.map((transaction) => storeItems.find((item) => item.id === transaction.itemId)?.name || 'Unknown item').join(' ');
    return `${receipt.id} ${receipt.student?.name || ''} ${itemNames}`.toLowerCase().includes(query);
  });

  // Calculate full roster analytics
  const studentAnalyses: StudentPerformanceAnalysis[] = students.map((student) => {
    const studentSubmissions = submissions.filter((sub) => sub.studentId === student.id);
    const completedIds = new Set(studentSubmissions.filter((sub) => sub.completed).map((sub) => sub.assignmentId));

    // Category stats
    const filterCategory = (cat: Assignment['category']) => {
      const filtered = assignments.filter((a) => a.category === cat);
      const completed = filtered.filter((a) => completedIds.has(a.id)).length;
      const total = filtered.length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 100;
      return { completed, total, percent };
    };

    const hw = filterCategory('Homework');
    const cw = filterCategory('Classwork');
    const prj = filterCategory('Project');
    const qz = filterCategory('Quiz');

    // Overall stats
    const overallCompleted = studentSubmissions.filter((sub) => sub.completed).length;
    const overallTotal = assignments.length;
    const overallPercent = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 100;

    // Subject stats
    const activeSubjectsList = subjects && subjects.length > 0 ? subjects : ['Math', 'Reading', 'Science', 'Spelling', 'Social Studies', 'Other'];

    const subjectStats = {} as any;
    activeSubjectsList.forEach((subj) => {
      const filtered = assignments.filter((a) => getSubject(a) === subj);
      const completed = filtered.filter((a) => completedIds.has(a.id)).length;
      const total = filtered.length;
      const skipped = total - completed;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 100;
      subjectStats[subj] = { assigned: total, completed, skipped, percent };
    });

    // Skipped list of assignments
    const skippedList = assignments.filter((a) => !completedIds.has(a.id));

    return {
      student,
      rank: 0, // Fill later
      overallCompleted,
      overallTotal,
      overallPercent,
      overallLetter: getLetterGrade(overallPercent),
      
      homeworkCompleted: hw.completed,
      homeworkTotal: hw.total,
      homeworkPercent: hw.percent,
      homeworkLetter: getLetterGrade(hw.percent),
      
      classworkCompleted: cw.completed,
      classworkTotal: cw.total,
      classworkPercent: cw.percent,
      
      projectCompleted: prj.completed,
      projectTotal: prj.total,
      projectPercent: prj.percent,
      
      quizCompleted: qz.completed,
      quizTotal: qz.total,
      quizPercent: qz.percent,
      
      subjectStats,
      skippedList
    };
  });

  // Calculate ranks based on overall points
  const sortedByPointsAnalyzed = [...studentAnalyses].sort((a, b) => b.student.points - a.student.points);
  sortedByPointsAnalyzed.forEach((item, index) => {
    item.rank = index + 1;
  });

  const rankMap = new Map(sortedByPointsAnalyzed.map(item => [item.student.id, item.rank]));
  studentAnalyses.forEach(item => {
    item.rank = rankMap.get(item.student.id) || 1;
  });

  // 2. Class Subject Averages
  const activeSubjectsList = subjects && subjects.length > 0 ? subjects : ['Math', 'Reading', 'Science', 'Spelling', 'Social Studies', 'Other'];

  const classSubjectAverages = activeSubjectsList.map((subj) => {
    const subjectAssignments = assignments.filter(a => getSubject(a) === subj);
    const totalExpectedSubmissions = subjectAssignments.length * students.length;
    let completedSubmissions = 0;
    
    subjectAssignments.forEach(asm => {
      completedSubmissions += submissions.filter(sub => sub.assignmentId === asm.id && sub.completed).length;
    });

    const completionRate = totalExpectedSubmissions > 0 
      ? Math.round((completedSubmissions / totalExpectedSubmissions) * 100) 
      : 100;
    
    const skippedCount = totalExpectedSubmissions - completedSubmissions;

    return {
      subject: subj,
      assignmentsCount: subjectAssignments.length,
      completionRate,
      skippedCount
    };
  });

  // Lowest completed assignment
  const assignmentCompletionStats = assignments.map((asm) => {
    const totalExpected = students.length;
    const completedCount = submissions.filter(
      (sub) => sub.assignmentId === asm.id && sub.completed
    ).length;
    const ratePercent = totalExpected > 0 ? Math.round((completedCount / totalExpected) * 100) : 0;
    return {
      ...asm,
      completedCount,
      ratePercent
    };
  });
  const sortedByCompletion = [...assignmentCompletionStats].sort((a, b) => a.ratePercent - b.ratePercent);
  const toughestAssignment = sortedByCompletion[0] || null;

  // Grade Distribution Counts
  const gradeDistributionCount = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  studentAnalyses.forEach(analysis => {
    const letter = analysis.overallLetter[0];
    if (letter === 'A') gradeDistributionCount.A++;
    else if (letter === 'B') gradeDistributionCount.B++;
    else if (letter === 'C') gradeDistributionCount.C++;
    else if (letter === 'D') gradeDistributionCount.D++;
    else gradeDistributionCount.F++;
  });

  // Homework Specific skipped alerts
  const homeworkAssignments = assignments.filter(a => a.category === 'Homework');
  const classHomeworkSubmissionExpected = homeworkAssignments.length * students.length;
  let classHomeworkSubmissionsDone = 0;
  homeworkAssignments.forEach(asm => {
    classHomeworkSubmissionsDone += submissions.filter(sub => sub.assignmentId === asm.id && sub.completed).length;
  });
  const classHwCompletionRate = classHomeworkSubmissionExpected > 0
    ? Math.round((classHomeworkSubmissionsDone / classHomeworkSubmissionExpected) * 100)
    : 100;

  // Roster Filtering logic
  const filteredRoster = studentAnalyses.filter((item) => {
    const matchesSearch = item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.student.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (filterStatus) {
      case 'Exemplary':
        return item.overallPercent >= 90;
      case 'Needs Support':
        return item.overallPercent < 60;
      case 'At Risk Math':
        return (item.subjectStats.Math?.skipped || 0) > 0;
      case 'At Risk Spelling':
        return (item.subjectStats.Spelling?.skipped || 0) > 0;
      default:
        return true;
    }
  });

  // Report Card Comment Generator
  const generateCommentDraft = (analysis: StudentPerformanceAnalysis) => {
    const name = analysis.student.name;
    const firstName = name.split(' ')[0];
    const overallPct = analysis.overallPercent;
    const hwPct = analysis.homeworkPercent;
    const points = analysis.student.points;
    
    let academicStrengths: string[] = [];
    let academicWeaknesses: string[] = [];
    
    Object.entries(analysis.subjectStats).forEach(([subject, stats]: [string, any]) => {
      if (stats.assigned > 0) {
        if (stats.percent >= 90) {
          academicStrengths.push(subject);
        } else if (stats.percent < 60) {
          academicWeaknesses.push(subject);
        }
      }
    });

    let draft = `${name} has shown a commendable effort this term. `;
    
    if (overallPct >= 90) {
      draft += `${firstName} is currently an exemplary student in Grade 5A, maintaining an outstanding overall assignment completion rate of ${overallPct}% (${analysis.overallLetter}). `;
    } else if (overallPct >= 70) {
      draft += `${firstName} has maintained a solid academic standing in Grade 5A, completing ${overallPct}% (${analysis.overallLetter}) of assigned work. `;
    } else {
      draft += `${firstName} is currently finding some assignments challenging and would benefit from additional support. Their overall completion rate is currently ${overallPct}% (${analysis.overallLetter}). `;
    }

    if (academicStrengths.length > 0) {
      draft += `They have demonstrated excellent academic strength and high task compliance in ${academicStrengths.join(' and ')}, completing all tasks diligently. `;
    }

    if (academicWeaknesses.length > 0) {
      draft += `On the other hand, ${firstName} has missed several milestones in ${academicWeaknesses.join(' and ')} and would benefit from structured homework routines. `;
    } else if (analysis.skippedList.length > 0) {
      draft += `With only ${analysis.skippedList.length} total pending assignment(s), ${firstName} is close to a perfect completion record. `;
    } else {
      draft += `They have a perfect homework submission record across all academic subjects! `;
    }

    if (points >= 150) {
      draft += `${firstName} is also an exceptional leader in our classroom economy, having accumulated a total of ${points} incentive points through positive behavior and helpfulness.`;
    } else if (points >= 80) {
      draft += `${firstName} participates actively in our class reward system, with a healthy balance of ${points} points.`;
    } else {
      draft += `They have accumulated ${points} points in our classroom economy and are encouraged to seek positive reinforcement opportunities.`;
    }

    return draft;
  };

  // Trigger report card modal open
  const openReportCardModal = (analysis: StudentPerformanceAnalysis) => {
    setSelectedStudentAnalysis(analysis);
    setActiveReportTab('grades');
    setCopiedComment(false);
    setCustomCommentText(generateCommentDraft(analysis));
  };

  const handleCopyComment = () => {
    navigator.clipboard.writeText(customCommentText);
    setCopiedComment(true);
    setTimeout(() => setCopiedComment(false), 2000);
  };

  // EXPORT UTILITIES (UPDATED WITH DETAILED GRADEBOOK METRICS)

  // A. Export to Excel (.xlsx)
  const handleExportExcel = async () => {
    if (students.length === 0) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Class Gradebook');

      // Add a styled title row
      worksheet.mergeCells('A1:N1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'OAKRIDGE ACADEMY - CLASSROOM GRADEBOOK REPORT';
      titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' } // Deep Navy Blue
      };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(1).height = 40;

      // Add subtitle with date & summary metrics
      worksheet.mergeCells('A2:N2');
      const subtitleCell = worksheet.getCell('A2');
      subtitleCell.value = `Exported: ${new Date().toLocaleDateString()} | Total Students: ${totalStudentsCount} | Class Average Economy: ${avgPoints} pts | Homework Completion: ${classHwCompletionRate}%`;
      subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
      subtitleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' } // Light slate gray
      };
      subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(2).height = 24;

      // Add an empty spacer row
      worksheet.getRow(3).height = 12;

      // Define columns
      const columns = [
        { header: 'Rank', key: 'rank', width: 8 },
        { header: 'Student Name', key: 'name', width: 22 },
        { header: 'Student ID', key: 'id', width: 15 },
        { header: 'Class Grade', key: 'grade', width: 12 },
        { header: 'Economy Points', key: 'points', width: 16 },
        { header: 'Homework Completed', key: 'hw_completed', width: 20 },
        { header: 'Homework Rate', key: 'hw_percent', width: 16 },
        { header: 'Homework Letter', key: 'hw_letter', width: 16 },
        { header: 'Overall Completed', key: 'overall_completed', width: 18 },
        { header: 'Overall Rate', key: 'overall_percent', width: 15 },
        { header: 'Overall Letter', key: 'overall_letter', width: 15 },
        { header: 'Math Skipped', key: 'math_skipped', width: 14 },
        { header: 'Spelling Skipped', key: 'spelling_skipped', width: 15 },
        { header: 'Total Skipped', key: 'total_skipped', width: 14 }
      ];

      // Add headers row
      const headerRow = worksheet.addRow(columns.map(col => col.header));
      headerRow.height = 28;
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF3B82F6' } // Blue-500
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
      });

      // Add student rows
      studentAnalyses.forEach((item, index) => {
        const mathSkipped = item.subjectStats.Math?.skipped || 0;
        const spellingSkipped = item.subjectStats.Spelling?.skipped || 0;
        const totalSkipped = item.skippedList.length;

        const rowData = [
          item.rank,
          item.student.name,
          item.student.id,
          item.student.grade,
          item.student.points,
          `${item.homeworkCompleted}/${item.homeworkTotal}`,
          `${item.homeworkPercent}%`,
          item.homeworkLetter,
          `${item.overallCompleted}/${item.overallTotal}`,
          `${item.overallPercent}%`,
          item.overallLetter,
          mathSkipped,
          spellingSkipped,
          totalSkipped
        ];

        const row = worksheet.addRow(rowData);
        row.height = 22;

        // Apply row alternating colors (zebra striping) and styling
        const isEven = index % 2 === 0;
        const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC'; // Alternating white and light slate-50

        row.eachCell((cell, colNumber) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: rowBg }
          };
          cell.font = { name: 'Arial', size: 10, color: { argb: 'FF1E293B' } };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };

          // Alignment logic
          if (colNumber === 2) {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
            cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E293B' } };
          } else if (colNumber === 5) {
            // Points
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFB45309' } }; // Amber-700
          } else if (colNumber === 7 || colNumber === 10) {
            // Rates
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF2563EB' } }; // Blue-600
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }

          // Highlights for high/low overall completion
          if (colNumber === 10) {
            const val = item.overallPercent;
            if (val >= 90) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'D1FAE5' } // Green-100
              };
              cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF065F46' } }; // Green-800
            } else if (val < 60) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FEE2E2' } // Red-100
              };
              cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF991B1B' } }; // Red-800
            }
          }
        });
      });

      // Adjust column widths automatically to fit contents neatly
      columns.forEach((col, i) => {
        const column = worksheet.getColumn(i + 1);
        let maxLen = col.header.length;
        column.eachCell((cell) => {
          const valStr = cell.value ? cell.value.toString() : '';
          if (valStr.length > maxLen) {
            maxLen = valStr.length;
          }
        });
        column.width = Math.max(maxLen + 4, col.width);
      });

      // Write and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ClassScanner_Class_Roster_Gradebook_Report.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating Excel file:', err);
    }
  };

  // B. Export to Word (formatted Rich HTML)
  const handleExportWord = () => {
    const dateStr = new Date().toLocaleDateString();
    
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Classroom Performance & Gradebook Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #1e293b; }
          h1 { color: #2563eb; font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
          h2 { color: #334155; font-size: 18px; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f1f5f9; padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; text-align: left; font-size: 11px; text-transform: uppercase; }
          td { padding: 10px; border: 1px solid #cbd5e1; font-size: 11px; }
          .highlight { background: #f8fafc; font-weight: bold; }
          .badge { background: #ecfdf5; color: #047857; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; }
        </style>
      </head>
      <body>
        <h1>CLASS GRADEBOOK & PERFORMANCE REPORT</h1>
        <p><strong>Generated Date:</strong> ${dateStr}</p>
        <p><strong>School Name:</strong> Oakridge Elementary Academy</p>
        <p><strong>Classroom / Grade:</strong> Grade 5A</p>
        
        <h2>Classroom Statistics Summary</h2>
        <table>
          <tr>
            <th>Total Students</th>
            <td>${totalStudentsCount}</td>
            <th>Created Assignments</th>
            <td>${totalAssignmentsCount}</td>
            <th>Homeworks Completion Rate</th>
            <td>${classHwCompletionRate}%</td>
          </tr>
          <tr>
            <th>Average Points Balance</th>
            <td>${avgPoints} pts</td>
            <th>Total Store Transactions</th>
            <td>${totalTransactionsCount} sales</td>
            <th>Class Leader</th>
            <td>${topStudent ? topStudent.name : 'N/A'}</td>
          </tr>
        </table>

        <h2>Roster Gradebook Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Student Name</th>
              <th>Student ID</th>
              <th>Economy pts</th>
              <th>Homework Comp.</th>
              <th>Homework Grade</th>
              <th>Overall Comp.</th>
              <th>Overall Grade</th>
              <th>Math Skipped</th>
              <th>Total Skipped</th>
            </tr>
          </thead>
          <tbody>
            ${studentAnalyses.map(s => `
              <tr>
                <td>${s.rank}</td>
                <td><strong>${s.student.name}</strong></td>
                <td>${s.student.id}</td>
                <td class="highlight">${s.student.points} pts</td>
                <td>${s.homeworkCompleted} / ${s.homeworkTotal}</td>
                <td><strong>${s.homeworkPercent}% (${s.homeworkLetter})</strong></td>
                <td>${s.overallCompleted} / ${s.overallTotal}</td>
                <td style="color: #2563eb; font-weight: bold;">${s.overallPercent}% (${s.overallLetter})</td>
                <td style="color: ${(s.subjectStats.Math?.skipped || 0) > 0 ? '#ef4444' : '#1e293b'}">${s.subjectStats.Math?.skipped || 0}</td>
                <td style="color: ${s.skippedList.length > 0 ? '#f97316' : '#1e293b'}">${s.skippedList.length}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Assignment Completion Statistics</h2>
        <table>
          <thead>
            <tr>
              <th>Assignment Name</th>
              <th>Category</th>
              <th>Subject</th>
              <th>Reward points</th>
              <th>Due Date</th>
              <th>Completion Rate</th>
            </tr>
          </thead>
          <tbody>
            ${assignmentCompletionStats.map(asm => `
              <tr>
                <td>${asm.name}</td>
                <td>${asm.category}</td>
                <td>${getSubject(asm)}</td>
                <td>${asm.pointsValue} pts</td>
                <td>${asm.dueDate}</td>
                <td class="highlight">${asm.ratePercent}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <br/><br/>
        <p><em>Instructor Authorization Signature: __________________________________</em></p>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ClassScanner_Roster_Gradebook.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // C. Export to PDF (browser print)
  const handleExportPDF = () => {
    const element = document.getElementById('print-area-wrapper');
    if (element) {
      const dateStr = new Date().toLocaleDateString();
      const rowsHtml = studentAnalyses.map((s) => {
        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 10px; font-size: 11px; font-weight: bold; text-align: center;">${s.rank}</td>
            <td style="padding: 8px 10px; font-size: 11px; font-weight: bold;">${s.student.name}</td>
            <td style="padding: 8px 10px; font-size: 10px; font-family: monospace; color: #475569;">${s.student.id}</td>
            <td style="padding: 8px 10px; font-size: 11px; text-align: center; font-weight: bold; color: #b45309;">${s.student.points} pts</td>
            <td style="padding: 8px 10px; font-size: 11px; text-align: center;">${s.homeworkCompleted}/${s.homeworkTotal} (${s.homeworkPercent}% ${s.homeworkLetter})</td>
            <td style="padding: 8px 10px; font-size: 11px; text-align: center; font-weight: bold; color: #2563eb;">${s.overallPercent}% (${s.overallLetter})</td>
            <td style="padding: 8px 10px; font-size: 11px; text-align: center; color: ${(s.subjectStats.Math?.skipped || 0) > 0 ? '#ef4444' : '#475569'};">${s.subjectStats.Math?.skipped || 0}</td>
            <td style="padding: 8px 10px; font-size: 11px; text-align: center; font-weight: bold; color: ${s.skippedList.length > 0 ? '#f97316' : '#1e293b'}">${s.skippedList.length}</td>
          </tr>
        `;
      }).join('');

      element.innerHTML = `
        <div style="font-family: sans-serif; padding: 30px; color: #0f172a; max-width: 800px; margin: 0 auto; background: white;">
          <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <h1 style="font-size: 21px; margin: 0; color: #0f172a; font-weight: 800; letter-spacing: -0.5px;">OAKRIDGE ACADEMY CLASSROOM GRADEBOOK SUMMARY</h1>
              <p style="font-size: 11px; margin: 4px 0 0 0; color: #64748b; font-weight: bold; uppercase tracking-wider;">Roster progress, Homework Grades & Subject Completion • Grade 5A</p>
            </div>
            <p style="font-size: 10px; margin: 0; color: #64748b; font-weight: bold; font-family: monospace;">Printed: ${dateStr}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 30px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; font-size: 9px; color: #64748b; font-weight: bold;">
                <th style="padding: 10px; text-align: center;">Rank</th>
                <th style="padding: 10px;">Student Roster Name</th>
                <th style="padding: 10px; font-family: monospace;">Student ID</th>
                <th style="padding: 10px; text-align: center;">Economy</th>
                <th style="padding: 10px; text-align: center;">Homework Grade</th>
                <th style="padding: 10px; text-align: center;">Overall Grade</th>
                <th style="padding: 10px; text-align: center;">Math Skipped</th>
                <th style="padding: 10px; text-align: center;">Total Skipped</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #cbd5e1; padding-top: 15px; font-size: 10px; color: #64748b; font-weight: bold;">
            <span>Oakridge Primary School Board of Instructors</span>
            <span>Teacher Signature: __________________________________</span>
          </div>
        </div>
      `;

      const handleAfterPrint = () => {
        element.innerHTML = '';
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      window.addEventListener('afterprint', handleAfterPrint);

      setTimeout(() => {
        window.print();
      }, 150);
    }
  };

  const getSubjectGradebookHtml = () => {
    const subAssignments = assignments.filter(a => getSubject(a) === selectedSubject);
    let html = `
      <table style="border-collapse: collapse; width: 100%; font-family: sans-serif; margin-top: 15px;">
        <thead>
          <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569;">
            <th style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; width: 180px;">Student Name</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; width: 100px;">Student ID</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; width: 140px;">Completed Rate</th>
            ${subAssignments.map(asm => `<th style="padding: 10px; border: 1px solid #cbd5e1; font-size: 10px; text-align: center; font-weight: bold;">${asm.name}</th>`).join('')}
          </tr>
        </thead>
        <tbody style="font-size: 12px; color: #1e293b;">
    `;
    
    students.forEach(student => {
      const studentSubmissions = submissions.filter(sub => sub.studentId === student.id);
      const completedIds = new Set(studentSubmissions.filter(sub => sub.completed).map(sub => sub.assignmentId));
      
      const completedCount = subAssignments.filter(a => completedIds.has(a.id)).length;
      const totalCount = subAssignments.length;
      const ratePercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;
      
      html += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">${student.name}</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; font-family: monospace; color: #64748b;">${student.id}</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: ${ratePercent >= 90 ? '#10b981' : ratePercent < 60 ? '#ef4444' : '#2563eb'};">
            ${completedCount}/${totalCount} (${ratePercent}%)
          </td>
          ${subAssignments.map(asm => {
            const done = completedIds.has(asm.id);
            return `<td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: ${done ? '#10b981' : '#ef4444'};">${done ? '✓ Completed' : '✗ Missing'}</td>`;
          }).join('')}
        </tr>
      `;
    });
    
    html += `
        </tbody>
      </table>
    `;
    return html;
  };

  const getSubjectGraphHtml = () => {
    const subAssignments = assignments.filter(a => getSubject(a) === selectedSubject);
    let html = `
      <div style="font-family: sans-serif; margin-top: 15px; width: 100%;">
        <h3 style="color: #475569; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; font-size: 14px; font-weight: bold; margin-bottom: 15px;">Completion Rates Comparing Students</h3>
        <table style="width: 100%; max-width: 650px; border-collapse: collapse; font-family: sans-serif;">
          <tbody>
    `;
    
    students.forEach(student => {
      const studentSubmissions = submissions.filter(sub => sub.studentId === student.id);
      const completedIds = new Set(studentSubmissions.filter(sub => sub.completed).map(sub => sub.assignmentId));
      
      const completedCount = subAssignments.filter(a => completedIds.has(a.id)).length;
      const totalCount = subAssignments.length;
      const ratePercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;
      const barColor = ratePercent >= 90 ? '#10b981' : ratePercent < 60 ? '#ef4444' : '#3b82f6';
      
      const filledWidth = Math.round(ratePercent * 3);
      const emptyWidth = Math.round((100 - ratePercent) * 3);
      
      html += `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; width: 150px; font-weight: bold; font-size: 11px; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${student.name}
          </td>
          <td style="padding: 10px 15px; width: 320px;">
            <table width="300" style="width: 300px; height: 16px; border: 1px solid #cbd5e1; background-color: #f1f5f9; border-collapse: collapse; margin: 0; font-size: 1px; line-height: 1px;">
              <tr>
                ${ratePercent > 0 ? `<td width="${filledWidth}" bgcolor="${barColor}" style="width: ${filledWidth}px; background-color: ${barColor}; height: 16px; padding: 0; font-size: 1px; line-height: 1px;">&nbsp;</td>` : ''}
                ${ratePercent < 100 ? `<td width="${emptyWidth}" bgcolor="#f1f5f9" style="width: ${emptyWidth}px; background-color: #f1f5f9; height: 16px; padding: 0; font-size: 1px; line-height: 1px;">&nbsp;</td>` : ''}
              </tr>
            </table>
          </td>
          <td style="padding: 10px 0; width: 100px; text-align: right; font-size: 11px; font-weight: bold; color: #475569; font-family: monospace;">
            ${completedCount}/${totalCount} (${ratePercent}%)
          </td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
    `;
    return html;
  };

  const handleExportSubjectWord = () => {
    const contentHtml = subjectViewType === 'gradebook' ? getSubjectGradebookHtml() : getSubjectGraphHtml();
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${selectedSubject} - Subject Performance Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #333333; }
          h2 { color: #1e3a8a; border-bottom: 2px solid #2563eb; padding-bottom: 6px; }
          .meta-info { margin-bottom: 20px; color: #555555; font-size: 12px; }
        </style>
      </head>
      <body>
        <h2>Subject Performance Report: ${selectedSubject}</h2>
        <div class="meta-info">
          <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Total Subject Assignments:</strong> ${assignments.filter(a => getSubject(a) === selectedSubject).length}</p>
          <p><strong>Class Size:</strong> ${students.length} students</p>
        </div>
        ${contentHtml}
      </body>
      </html>
    `;
    
    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSubject.replace(/\s+/g, '_')}_Performance_Report.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportSubjectExcel = async () => {
    const subAssignments = assignments.filter(a => getSubject(a) === selectedSubject);
    if (students.length === 0) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`${selectedSubject} Gradebook`);

      // Add a styled title row
      const mergeCols = 3 + subAssignments.length;
      const colLetter = String.fromCharCode(64 + Math.min(mergeCols, 26)); // Safe single-letter columns mapping
      const rangeStr = `A1:${colLetter}1`;
      worksheet.mergeCells(rangeStr);
      
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `SUBJECT GRADEBOOK REPORT: ${selectedSubject.toUpperCase()}`;
      titleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' } // Indigo-600
      };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(1).height = 36;

      // Subtitle
      const subRangeStr = `A2:${colLetter}2`;
      worksheet.mergeCells(subRangeStr);
      const subtitleCell = worksheet.getCell('A2');
      subtitleCell.value = `Generated: ${new Date().toLocaleDateString()} | Total Assignments: ${subAssignments.length} | Active Students: ${students.length}`;
      subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
      subtitleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' }
      };
      subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(2).height = 22;

      // Spacer row
      worksheet.getRow(3).height = 12;

      // Define headers list
      const headers = ['Student Name', 'Student ID', 'Completed Rate %'];
      subAssignments.forEach(asm => {
        headers.push(asm.name);
      });

      // Add headers row
      const headerRow = worksheet.addRow(headers);
      headerRow.height = 26;
      headerRow.eachCell((cell, colNum) => {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colNum <= 3 ? 'FF6366F1' : 'FF4B5563' } // Indigo for student info, Slate/Gray for assignments
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'medium', color: { argb: 'FF4F46E5' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
      });

      // Add student data rows
      students.forEach((student, index) => {
        const studentSubmissions = submissions.filter(sub => sub.studentId === student.id);
        const completedIds = new Set(studentSubmissions.filter(sub => sub.completed).map(sub => sub.assignmentId));
        
        const completedCount = subAssignments.filter(a => completedIds.has(a.id)).length;
        const totalCount = subAssignments.length;
        const ratePercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

        const rowData = [
          student.name,
          student.id,
          `${completedCount}/${totalCount} (${ratePercent}%)`
        ];

        subAssignments.forEach(asm => {
          const done = completedIds.has(asm.id);
          rowData.push(done ? 'Completed' : 'Missing');
        });

        const row = worksheet.addRow(rowData);
        row.height = 20;

        const isEven = index % 2 === 0;
        const rowBg = isEven ? 'FFFFFFFF' : 'FFF9FAFB';

        row.eachCell((cell, colNum) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: rowBg }
          };
          cell.font = { name: 'Arial', size: 10, color: { argb: 'FF1E293B' } };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };

          if (colNum === 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
            cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E293B' } };
          } else if (colNum === 3) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.font = { name: 'Arial', size: 10, bold: true };
            if (ratePercent >= 90) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1FAE5' } };
              cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF065F46' } };
            } else if (ratePercent < 60) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
              cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF991B1B' } };
            }
          } else if (colNum > 3) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            const isCompleted = cell.value === 'Completed';
            cell.font = { name: 'Arial', size: 9, bold: true };
            if (isCompleted) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6F4EA' } }; // Subtle green
              cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF137333' } };
            } else {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FCE8E6' } }; // Subtle red
              cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFC5221F' } };
            }
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
        });
      });

      // Auto width columns
      headers.forEach((h, i) => {
        const column = worksheet.getColumn(i + 1);
        let maxLen = h.length;
        column.eachCell((cell) => {
          const valStr = cell.value ? cell.value.toString() : '';
          if (valStr.length > maxLen) {
            maxLen = valStr.length;
          }
        });
        column.width = Math.max(maxLen + 4, i < 3 ? 15 : 12);
      });

      // Write buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedSubject.replace(/\s+/g, '_')}_Gradebook_Report.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting subject Excel:', err);
    }
  };

  const handlePrintOrPdfSubject = () => {
    const element = document.getElementById('print-area-wrapper');
    if (element) {
      const subAssignments = assignments.filter(a => getSubject(a) === selectedSubject);
      const contentHtml = subjectViewType === 'gradebook' ? getSubjectGradebookHtml() : getSubjectGraphHtml();
      
      element.innerHTML = `
        <div style="font-family: sans-serif; padding: 30px; color: #0f172a; max-width: 800px; margin: 0 auto; background: white;">
          <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <h1 style="font-size: 21px; margin: 0; color: #0f172a; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase;">Oakridge Academy Student Progress</h1>
              <p style="font-size: 11px; margin: 4px 0 0 0; color: #64748b; font-weight: bold; text-transform: uppercase;">Subject Focused Report: ${selectedSubject} • ${subAssignments.length} Assignments</p>
            </div>
            <p style="font-size: 10px; margin: 0; color: #64748b; font-weight: bold; font-family: monospace;">Printed: ${new Date().toLocaleDateString()}</p>
          </div>

          ${contentHtml}
          
          <div style="margin-top: 30px; display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #cbd5e1; padding-top: 15px; font-size: 10px; color: #64748b; font-weight: bold;">
            <span>Oakridge Primary School Board of Instructors</span>
            <span>Teacher Signature: __________________________________</span>
          </div>
        </div>
      `;

      const handleAfterPrint = () => {
        element.innerHTML = '';
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      window.addEventListener('afterprint', handleAfterPrint);

      setTimeout(() => {
        window.print();
      }, 150);
    }
  };

  const printReceipt = (receipt: SalesReceipt) => {
    const element = document.getElementById('print-area-wrapper');
    if (!element) return;
    const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] || character));
    const lines = receipt.transactions.map((transaction) => {
      const item = storeItems.find((candidate) => candidate.id === transaction.itemId);
      return `<tr><td>${escapeHtml(item?.name || 'Unknown item')}</td><td style="text-align:right">${transaction.quantity || 1}</td><td style="text-align:right">${transaction.pointsCost.toLocaleString()} pts</td></tr>`;
    }).join('');
    element.innerHTML = `<div style="font-family:Arial,sans-serif;color:#0f172a;padding:28px;max-width:420px;margin:0 auto"><div style="display:flex;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:12px"><strong style="font-size:18px">CLASS STORE RECEIPT</strong><span style="font-size:11px">${escapeHtml(receipt.id)}</span></div><p style="font-size:12px;line-height:1.6"><strong>Student:</strong> ${escapeHtml(receipt.student?.name || 'Former student')}<br><strong>Date:</strong> ${new Date(receipt.timestamp).toLocaleString()}</p><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="border-bottom:1px solid #cbd5e1"><th style="text-align:left;padding:6px 0">Item</th><th style="text-align:right">Qty</th><th style="text-align:right">Points</th></tr></thead><tbody>${lines}</tbody></table><div style="margin-top:16px;padding-top:12px;border-top:2px solid #0f172a;text-align:right;font-size:16px"><strong>Total: ${receipt.total.toLocaleString()} points</strong></div></div>`;
    const clearPrintArea = () => {
      element.innerHTML = '';
      window.removeEventListener('afterprint', clearPrintArea);
    };
    window.addEventListener('afterprint', clearPrintArea);
    window.setTimeout(() => window.print(), 100);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gradebook & Analytics Reports</h2>
          <p className="text-xs text-slate-500 font-medium">Export detailed grades, inspect math & reading homework skip frequencies, and generate customized report card summaries</p>
        </div>

        {/* Export Suite Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3.5 rounded-xl text-xs shadow-md shadow-emerald-50 transition-all cursor-pointer hover:scale-[1.02]"
            title="Download detailed gradebook as CSV"
          >
            <FileDown className="w-3.5 h-3.5" />
            Excel Gradebook (.csv)
          </button>
          
          <button
            onClick={handleExportWord}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3.5 rounded-xl text-xs shadow-md shadow-blue-50 transition-all cursor-pointer hover:scale-[1.02]"
            title="Download formatted DOC for MS Word"
          >
            <FileDown className="w-3.5 h-3.5" />
            Word Summary (.doc)
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-3.5 rounded-xl text-xs shadow-md shadow-slate-100 transition-all cursor-pointer hover:scale-[1.02]"
            title="Print Report roster to PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            Print Gradebook
          </button>
        </div>
      </div>

      {/* Highlights Dashboard Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Class Leader */}
        <div className="bg-white p-5 border border-slate-200/60 shadow-sm rounded-2xl flex items-center gap-4">
          <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl">
            <Coins className="w-5 h-5 animate-pulse text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Class Leader (Economy)</span>
            <span className="text-sm font-bold text-slate-800 block leading-tight mt-1 truncate max-w-[150px]">
              {topStudent ? topStudent.name : 'No student yet'}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold block mt-1">
              Rank #1 • {topStudent ? `${topStudent.points} pts accumulated` : '0 pts'}
            </span>
          </div>
        </div>

        {/* Metric 2: Tough Homework */}
        <div className="bg-white p-5 border border-slate-200/85 shadow-sm rounded-2xl flex items-center gap-4">
          <div className="bg-rose-50 text-rose-600 p-3 rounded-2xl">
            <CheckSquare className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lowest Submission Rate</span>
            <span className="text-sm font-bold text-slate-800 block leading-tight mt-1 truncate max-w-[150px]">
              {toughestAssignment ? toughestAssignment.name : 'N/A'}
            </span>
            <span className="text-[10px] text-rose-600 font-bold block mt-1 bg-rose-50/50 py-0.5 px-1.5 rounded inline-block">
              {toughestAssignment ? `${toughestAssignment.ratePercent}% submission` : '—'}
            </span>
          </div>
        </div>

        {/* Metric 3: Homework completion average */}
        <div className="bg-white p-5 border border-slate-200/60 shadow-sm rounded-2xl flex items-center gap-4">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
            <BookMarked className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Homework Submissions</span>
            <span className="text-sm font-bold text-slate-800 block leading-tight mt-1">
              {classHwCompletionRate}% Completion
            </span>
            <span className="text-[10px] text-blue-600 font-bold block mt-1 bg-blue-50/50 py-0.5 px-1.5 rounded inline-block">
              Total assigned: {homeworkAssignments.length}
            </span>
          </div>
        </div>

        {/* Metric 4: Economy Flow */}
        <div className="bg-white p-5 border border-slate-200/60 shadow-sm rounded-2xl flex items-center gap-4">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Store Transaction Volume</span>
            <span className="text-sm font-bold text-slate-800 block leading-tight mt-1">
              {totalTransactionsCount} Purchases
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
              {mostPopularItem ? `Top: ${mostPopularItem.name}` : 'No claims redeemed'}
            </span>
          </div>
        </div>
      </div>

      <section className="border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-800"><ReceiptText className="h-4 w-4 text-emerald-600" /> Sales & Receipts</h3>
            <p className="mt-1 text-[11px] font-medium text-slate-500">Every Class Store purchase, including completed Cashier Mode carts.</p>
          </div>
          <div className="relative w-full md:w-64"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={salesSearch} onChange={(event) => setSalesSearch(event.target.value)} placeholder="Search buyer, item, or receipt" className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500" /></div>
        </div>
        {filteredSalesReceipts.length === 0 ? (
          <div className="p-10 text-center"><ShoppingBag className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-2 text-xs font-bold text-slate-600">No sales found</p><p className="mt-1 text-[11px] text-slate-400">Completed purchases will appear here automatically.</p></div>
        ) : (
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {filteredSalesReceipts.map((receipt) => {
              const itemSummary = receipt.transactions.map((transaction) => storeItems.find((item) => item.id === transaction.itemId)?.name || 'Unknown item').join(', ');
              return <div key={receipt.id} className="flex items-center gap-3 p-4 hover:bg-slate-50/70">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><ReceiptText className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-800">{receipt.student?.name || 'Former student'}</p><p className="truncate text-[10px] font-medium text-slate-500">{itemSummary}</p><p className="mt-0.5 text-[9px] font-semibold text-slate-400">{receipt.id} · {new Date(receipt.timestamp).toLocaleString()}</p></div>
                <div className="text-right"><p className="text-xs font-extrabold text-slate-800">{receipt.total.toLocaleString()} pts</p><button type="button" onClick={() => setSelectedReceipt(receipt)} className="mt-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-900">View receipt</button></div>
              </div>;
            })}
          </div>
        )}
      </section>

      {/* Visual Diagnostic Roster: Who is doing well vs. who needs support */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Needs Work / Academic Risk warning list */}
        <div className="bg-white border border-slate-200/85 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-500" /> Attention Needed
              </h3>
              <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                Action Required
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Students struggling with low homework submission grades or multiple skipped math assignments.
            </p>
          </div>

          <div className="space-y-2.5 pt-1.5 flex-1 flex flex-col justify-center">
            {studentAnalyses.filter(item => item.overallPercent < 75 || (item.subjectStats.Math?.skipped || 0) > 0 || item.homeworkPercent < 70).length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-[11px]">
                🎉 Excellent! No students are currently in the academic alert range.
              </div>
            ) : (
              studentAnalyses
                .filter(item => item.overallPercent < 75 || (item.subjectStats.Math?.skipped || 0) > 0 || item.homeworkPercent < 70)
                .sort((a, b) => (b.skippedList.length + (b.subjectStats.Math?.skipped || 0)) - (a.skippedList.length + (a.subjectStats.Math?.skipped || 0)))
                .slice(0, 4)
                .map((item) => {
                  const mathSkipped = item.subjectStats.Math?.skipped || 0;
                  return (
                    <div
                      key={item.student.id}
                      onClick={() => openReportCardModal(item)}
                      className="flex items-center justify-between p-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 font-extrabold text-[10px] flex items-center justify-center">
                          {item.student.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block leading-tight truncate max-w-[110px]">{item.student.name}</span>
                          <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                            ID: {item.student.id} • HW: <span className="text-rose-600 font-bold">{item.homeworkPercent}%</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="text-[10px] text-rose-600 font-extrabold block">
                          {mathSkipped > 0 ? `${mathSkipped} Math Skipped` : `${item.skippedList.length} Skipped`}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">
                          {item.homeworkCompleted}/{item.homeworkTotal} HW done
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Card 2: Doing Exceptionally Well (Honor Roll) */}
        <div className="bg-white border border-slate-200/85 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Award className="w-4.5 h-4.5 text-amber-500" /> Academic Honor Roll
              </h3>
              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                Top Performers
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              High achievers with an overall assignment completion rate of 90% or higher.
            </p>
          </div>

          <div className="space-y-2.5 pt-1.5 flex-1 flex flex-col justify-center">
            {studentAnalyses.filter(item => item.overallPercent >= 90).length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-[11px]">
                Aim high! No students have crossed the 90% completion mark yet this term.
              </div>
            ) : (
              studentAnalyses
                .filter(item => item.overallPercent >= 90)
                .sort((a, b) => b.overallPercent - a.overallPercent)
                .slice(0, 4)
                .map((item) => (
                  <div
                    key={item.student.id}
                    onClick={() => openReportCardModal(item)}
                    className="flex items-center justify-between p-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 font-extrabold text-[10px] flex items-center justify-center">
                        {item.student.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block leading-tight truncate max-w-[110px]">{item.student.name}</span>
                        <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                          ID: {item.student.id} • Class Rank: <span className="text-amber-600 font-bold">#{item.rank}</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[10px] text-emerald-600 font-extrabold block">
                        {item.overallPercent}% ({item.overallLetter})
                      </span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">
                        {item.student.points} economy pts
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Card 3: Class Subject Diagnostics & Warning Alert */}
        <div className="bg-white border border-slate-200/85 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Activity className="w-4.5 h-4.5 text-blue-500" /> Class Subject Frequencies
              </h3>
              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Course Diagnostic
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Subject-by-subject assessment highlighting total skipped assignments and classroom velocity.
            </p>
          </div>

          <div className="space-y-3.5 pt-1.5 flex-1 flex flex-col justify-center">
            {assignments.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-[11px]">
                Create assignments to see class-wide subject health metrics.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {classSubjectAverages.slice(0, 4).map((sub) => (
                    <div key={sub.subject} className="p-2.5 border border-slate-100 bg-slate-50/50 rounded-xl">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider truncate">
                        {sub.subject}
                      </span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-sm font-extrabold text-slate-800">
                          {sub.completionRate}%
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase">Done</span>
                      </div>
                      <span className={`text-[8px] font-extrabold mt-1 block ${sub.skippedCount > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {sub.skippedCount} skipped tasks
                      </span>
                    </div>
                  ))}
                </div>

                {toughestAssignment && (
                  <div className="bg-rose-50/40 border border-rose-100/60 p-2.5 rounded-xl flex items-start gap-2">
                    <span className="text-xs">⚠️</span>
                    <div className="leading-tight">
                      <span className="text-[9px] font-bold text-rose-700 uppercase tracking-wide">
                        Teacher Focus Area: {toughestAssignment.category}
                      </span>
                      <p className="text-[10px] text-slate-600 mt-0.5 font-medium leading-normal">
                        "{toughestAssignment.name}" has the lowest submission rate (<span className="font-bold text-rose-600">{toughestAssignment.ratePercent}%</span>). Class review recommended.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {/* Advanced Classroom Bento Insights (Data & Charts Row) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Academic Subject Mastery Analytics (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 border border-slate-200/85 shadow-sm rounded-3xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <GraduationCap className="w-4.5 h-4.5 text-blue-500" /> Class Subject Performance
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject Mastery</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">Completion rate velocity and class-wide skipped count broken down by subject</p>
          </div>

          {assignments.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">Create assignments to generate subject analytics.</div>
          ) : (
            <div className="space-y-3 pt-2">
              {classSubjectAverages.map((avg) => {
                const getSubjectBarColor = (subj: string) => {
                  switch (subj) {
                    case 'Math': return 'bg-blue-500';
                    case 'Reading': return 'bg-emerald-500';
                    case 'Science': return 'bg-indigo-500';
                    case 'Spelling': return 'bg-amber-500';
                    case 'Social Studies': return 'bg-violet-500';
                    default: return 'bg-slate-400';
                  }
                };

                return (
                  <div key={avg.subject} className="space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: avg.subject === 'Math' ? '#3b82f6' : avg.subject === 'Reading' ? '#10b981' : avg.subject === 'Science' ? '#6366f1' : avg.subject === 'Spelling' ? '#f59e0b' : avg.subject === 'Social Studies' ? '#8b5cf6' : '#94a3b8' }} />
                        <span>{avg.subject}</span>
                        <span className="text-[10px] font-medium text-slate-400">({avg.assignmentsCount} assignments)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${avg.skippedCount > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                          {avg.skippedCount} skipped class-wide
                        </span>
                        <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">{avg.completionRate}% Done</span>
                      </div>
                    </div>
                    {/* Track */}
                    <div className="bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${avg.completionRate}%` }}
                        className={`h-full rounded-full transition-all duration-700 ${getSubjectBarColor(avg.subject)}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Grade Distribution & Class Health Alerts (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 border border-slate-200/85 shadow-sm rounded-3xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <BarChart3 className="w-4.5 h-4.5 text-blue-500" /> Grade Distribution & Health
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Brackets showing student counts by overall grade levels</p>
          </div>

          <div className="grid grid-cols-5 gap-2 pt-2">
            {[
              { grade: 'A', label: 'Exemplary', count: gradeDistributionCount.A, color: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
              { grade: 'B', label: 'Proficient', count: gradeDistributionCount.B, color: 'bg-teal-500', bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700' },
              { grade: 'C', label: 'Passing', count: gradeDistributionCount.C, color: 'bg-blue-500', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
              { grade: 'D', label: 'Passing', count: gradeDistributionCount.D, color: 'bg-amber-500', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
              { grade: 'F', label: 'Support Need', count: gradeDistributionCount.F, color: 'bg-rose-500', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' }
            ].map((bracket) => {
              const maxCount = Math.max(gradeDistributionCount.A, gradeDistributionCount.B, gradeDistributionCount.C, gradeDistributionCount.D, gradeDistributionCount.F, 1);
              const barHeight = (bracket.count / maxCount) * 100;
              return (
                <div key={bracket.grade} className="flex flex-col items-center gap-2">
                  <div className="h-[100px] w-full bg-slate-50/50 rounded-xl border border-slate-100 flex items-end p-1 relative group">
                    <div className="absolute top-1 left-0 right-0 text-center text-[10px] font-extrabold text-slate-500 z-10">
                      {bracket.count}
                    </div>
                    <div
                      style={{ height: `${barHeight}%` }}
                      className={`w-full ${bracket.color} rounded-lg opacity-85 group-hover:opacity-100 transition-all`}
                    />
                  </div>
                  <div className={`w-full py-1 px-1.5 rounded-lg border text-center ${bracket.bg} ${bracket.text}`}>
                    <span className="font-extrabold text-xs block">{bracket.grade}</span>
                    <span className="text-[7px] font-bold block uppercase tracking-tighter leading-none mt-0.5">{bracket.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* At-Risk alerts box */}
          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex flex-col justify-center space-y-1.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Teacher Gradebook Actions
            </h4>
            <div className="text-[11px] text-slate-600 font-medium leading-relaxed">
              {studentAnalyses.filter(a => a.overallPercent < 60).length > 0 ? (
                <span className="text-rose-600 font-semibold block">
                  ⚠️ {studentAnalyses.filter(a => a.overallPercent < 60).length} students have overall grades below 60% (F) and need support.
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold block">
                  ✓ Class health is excellent! Every student is currently passing Grade 5A.
                </span>
              )}
              {studentAnalyses.filter(a => (a.subjectStats.Math?.skipped || 0) > 0).length > 0 && (
                <span className="text-slate-500 block mt-1">
                  💡 {studentAnalyses.filter(a => (a.subjectStats.Math?.skipped || 0) > 0).length} students have skipped Math assignments. Click a student below to print their skipped checklist.
                </span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Subject Focused Performance Studio */}
      <div className="bg-white border border-slate-200/85 shadow-sm rounded-3xl overflow-hidden flex flex-col p-6 space-y-4 mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between border-b border-slate-100 pb-4 gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <BookOpen className="w-4.5 h-4.5 text-blue-500" /> Subject Focused Performance Studio
            </h3>
            <p className="text-xs text-slate-500 font-medium font-sans">Focus on specific subjects, view student progress gradebooks, and compare student statistics with visual charts</p>
          </div>

          {/* Controls: Subject & View Selector */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Subject Selector */}
            <div className="flex flex-col space-y-1 min-w-[150px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Subject</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-slate-100/85 border border-slate-200/80 py-2 px-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-bold w-full cursor-pointer"
              >
                {activeSubjectsForSelect.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* View Selector */}
            <div className="flex flex-col space-y-1 min-w-[180px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Report View</span>
              <select
                value={subjectViewType}
                onChange={(e) => setSubjectViewType(e.target.value as 'gradebook' | 'graph')}
                className="bg-slate-100/85 border border-slate-200/80 py-2 px-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-bold w-full cursor-pointer"
              >
                <option value="gradebook">Gradebook Style Chart (Table)</option>
                <option value="graph">Bar Graph Comparing Students</option>
              </select>
            </div>

            {/* Export Actions Panel */}
            <div className="flex flex-col space-y-1 pt-2 sm:pt-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">&nbsp;</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleExportSubjectWord}
                  title="Export Report to Microsoft Word (.doc)"
                  className="flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer border border-blue-100"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Word</span>
                </button>
                <button
                  onClick={handleExportSubjectExcel}
                  title="Export Gradebook to Microsoft Excel (.csv)"
                  className="flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer border border-emerald-100"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={handlePrintOrPdfSubject}
                  title="Print Report or Save as PDF"
                  className="flex items-center justify-center gap-1 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer border border-violet-100"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>PDF / Print</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Reporting Canvas */}
        <div className="overflow-x-auto">
          {assignments.filter(a => getSubject(a) === selectedSubject).length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border border-slate-100 rounded-2xl">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-500">No Assignments Registered</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">There are currently no classroom assignments assigned to the subject "${selectedSubject}". Navigate to the Assignments tab to record dynamic tasks.</p>
            </div>
          ) : (
            <>
              {subjectViewType === 'gradebook' ? (
                /* Dynamic gradebook style grid table */
                <table className="w-full text-left text-sm text-slate-700 border-collapse border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4 border border-slate-200 bg-slate-50/50">Student Name</th>
                      <th className="py-3.5 px-4 border border-slate-200 bg-slate-50/50 font-mono">Student ID</th>
                      <th className="py-3.5 px-4 text-center border border-slate-200 bg-slate-50/50">Completed Rate</th>
                      {assignments
                        .filter(a => getSubject(a) === selectedSubject)
                        .map(asm => (
                          <th key={asm.id} className="py-3.5 px-4 text-center border border-slate-200 bg-slate-50/50 font-semibold text-slate-600 normal-case min-w-[120px]">
                            {asm.name}
                          </th>
                        ))
                      }
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-xs text-slate-800 bg-white">
                    {students.map((student) => {
                      const studentSubmissions = submissions.filter(sub => sub.studentId === student.id);
                      const completedIds = new Set(studentSubmissions.filter(sub => sub.completed).map(sub => sub.assignmentId));
                      
                      const subAssignments = assignments.filter(a => getSubject(a) === selectedSubject);
                      const completedCount = subAssignments.filter(a => completedIds.has(a.id)).length;
                      const totalCount = subAssignments.length;
                      const ratePercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/35 transition-colors">
                          <td className="py-3 px-4 border border-slate-100 font-bold text-slate-800">{student.name}</td>
                          <td className="py-3 px-4 border border-slate-100 font-mono text-[10px] text-slate-400">{student.id}</td>
                          <td className="py-3 px-4 text-center border border-slate-100">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${ratePercent >= 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : ratePercent < 60 ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                              {completedCount}/{totalCount} ({ratePercent}%)
                            </span>
                          </td>
                          {subAssignments.map(asm => {
                            const isCompleted = completedIds.has(asm.id);
                            return (
                              <td key={asm.id} className="py-3 px-4 text-center border border-slate-100">
                                {isCompleted ? (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 py-1 px-2 rounded-full border border-emerald-100 text-[10px] font-bold">
                                    ✓ Done
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 py-1 px-2 rounded-full border border-rose-100 text-[10px] font-bold">
                                    Missing
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                /* Bar graph comparing students */
                <div className="space-y-4 bg-slate-50/30 p-5 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Student Name</span>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Completion Rate %</span>
                  </div>
                  <div className="space-y-3">
                    {students.map((student) => {
                      const studentSubmissions = submissions.filter(sub => sub.studentId === student.id);
                      const completedIds = new Set(studentSubmissions.filter(sub => sub.completed).map(sub => sub.assignmentId));
                      
                      const subAssignments = assignments.filter(a => getSubject(a) === selectedSubject);
                      const completedCount = subAssignments.filter(a => completedIds.has(a.id)).length;
                      const totalCount = subAssignments.length;
                      const ratePercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

                      return (
                        <div key={student.id} className="flex items-center justify-between text-xs font-semibold">
                          <div className="w-1/4 truncate font-bold text-slate-700" title={student.name}>
                            {student.name}
                          </div>
                          
                          {/* Animated Track and Bar */}
                          <div className="flex-1 mx-4 bg-slate-100 rounded-xl h-4 overflow-hidden relative border border-slate-200/40">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${ratePercent}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                              className={`h-full rounded-xl ${ratePercent >= 90 ? 'bg-emerald-500' : ratePercent < 60 ? 'bg-rose-500' : 'bg-blue-500'}`}
                            />
                          </div>

                          <div className="w-20 text-right font-mono font-extrabold text-slate-600">
                            {completedCount}/{totalCount} ({ratePercent}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Class Gradebook & Report Card Helper Hub */}
      <div className="bg-white border border-slate-200/85 shadow-sm rounded-3xl overflow-hidden flex flex-col">
        
        {/* Hub Header & Controls */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <FileText className="w-4.5 h-4.5 text-blue-500" /> Gradebook & Roster Progress Tracker
            </h3>
            <p className="text-xs text-slate-500 font-medium">Analyze individual student grades, ranks, and skipped task checklists for report cards</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100/80 border border-slate-200/80 py-2 pl-9 pr-4 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-medium"
              />
            </div>

            {/* Filter Selector */}
            <div className="relative w-full sm:w-52">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full bg-slate-100/80 border border-slate-200/80 py-2 pl-8.5 pr-4 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-bold"
              >
                <option value="All">All Students</option>
                <option value="Exemplary">High Achievers (≥ 90%)</option>
                <option value="Needs Support">Needs Support (&lt; 60%)</option>
                <option value="At Risk Math">Skipped Math Work</option>
                <option value="At Risk Spelling">Skipped Spelling Work</option>
              </select>
            </div>
          </div>
        </div>

        {/* Gradebook Table Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-5 text-center">Rank</th>
                <th className="py-3.5 px-5">Student Roster Name</th>
                <th className="py-3.5 px-4 font-mono">Student ID</th>
                <th className="py-3.5 px-4 text-center">Points</th>
                <th className="py-3.5 px-4 text-center">Overall Grade</th>
                <th className="py-3.5 px-4 text-center">Homework Grade</th>
                <th className="py-3.5 px-4 text-center text-rose-600">Math Skipped</th>
                <th className="py-3.5 px-4 text-center">Total Skipped</th>
                <th className="py-3.5 px-4 text-center">Roster Status</th>
                <th className="py-3.5 px-5 text-right">Report Cards</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-xs">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No student results found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((item) => {
                  const mathSkipped = item.subjectStats.Math?.skipped || 0;
                  const spellingSkipped = item.subjectStats.Spelling?.skipped || 0;
                  const totalSkipped = item.skippedList.length;

                  let diagnosticBadge = '';
                  let diagnosticColor = '';
                  if (item.overallPercent >= 90) {
                    diagnosticBadge = 'Exemplary';
                    diagnosticColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                  } else if (item.overallPercent >= 60) {
                    diagnosticBadge = 'Satisfactory';
                    diagnosticColor = 'bg-blue-50 text-blue-700 border-blue-100';
                  } else {
                    diagnosticBadge = 'Needs Action';
                    diagnosticColor = 'bg-rose-50 text-rose-700 border-rose-100';
                  }

                  return (
                    <tr
                      key={item.student.id}
                      className="hover:bg-slate-50/40 transition-colors group cursor-pointer"
                      onClick={() => openReportCardModal(item)}
                    >
                      {/* Class Points Rank */}
                      <td className="py-3.5 px-5 text-center">
                        <span className={`inline-flex items-center justify-center w-5.5 h-5.5 rounded-full font-extrabold text-[10px] ${
                          item.rank === 1 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          item.rank === 2 ? 'bg-slate-200 text-slate-800' :
                          item.rank === 3 ? 'bg-amber-50 text-amber-900/80' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          #{item.rank}
                        </span>
                      </td>

                      {/* Name Card */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-[11px] flex items-center justify-center">
                            {item.student.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-800 block leading-tight">{item.student.name}</span>
                            <span className="text-[9px] text-slate-400 font-medium uppercase mt-0.5 block">Grade {item.student.grade}</span>
                          </div>
                        </div>
                      </td>

                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                        {item.student.id}
                      </td>

                      {/* Points Balance */}
                      <td className="py-3.5 px-4 text-center font-bold text-amber-700">
                        {item.student.points} pts
                      </td>

                      {/* Overall Progress */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-2 py-0.5 rounded-md border text-[11px] font-extrabold ${getGradeBadgeStyle(item.overallPercent)}`}>
                            {item.overallPercent}% ({item.overallLetter})
                          </span>
                          <span className="text-[8px] text-slate-400 mt-0.5 font-bold">{item.overallCompleted}/{item.overallTotal} Assignments</span>
                        </div>
                      </td>

                      {/* Homework Grade */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-2 py-0.5 rounded-md border text-[11px] font-extrabold ${getGradeBadgeStyle(item.homeworkPercent)}`}>
                            {item.homeworkPercent}% ({item.homeworkLetter})
                          </span>
                          <span className="text-[8px] text-slate-400 mt-0.5 font-bold">{item.homeworkCompleted}/{item.homeworkTotal} Done</span>
                        </div>
                      </td>

                      {/* Skipped Math */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-extrabold text-sm ${mathSkipped > 0 ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100' : 'text-slate-400'}`}>
                          {mathSkipped}
                        </span>
                      </td>

                      {/* Total Skipped */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-extrabold text-sm ${totalSkipped > 0 ? 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100' : 'text-slate-400'}`}>
                          {totalSkipped}
                        </span>
                      </td>

                      {/* Diagnostic Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold tracking-wider uppercase ${diagnosticColor}`}>
                          {diagnosticBadge}
                        </span>
                      </td>

                      {/* View Button */}
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openReportCardModal(item);
                          }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 justify-end ml-auto cursor-pointer"
                        >
                          Report Card
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 5. INTERACTIVE INDIVIDUAL REPORT CARD MODAL OVERLAY */}
      <AnimatePresence>
        {selectedStudentAnalysis && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-base shadow-md shadow-blue-100">
                    {selectedStudentAnalysis.student.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">{selectedStudentAnalysis.student.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-200/50 border border-slate-200/30 px-1.5 py-0.5 rounded">
                        ID: {selectedStudentAnalysis.student.id}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        Class Rank: <span className="text-amber-700">#{selectedStudentAnalysis.rank}</span> of {students.length}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        Points: <span className="text-blue-600">{selectedStudentAnalysis.student.points} pts</span>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStudentAnalysis(null)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Modal Tabs Navigation */}
              <div className="flex border-b border-slate-100 bg-slate-50/20 px-6">
                {[
                  { id: 'grades', label: 'Academic Grades', icon: GraduationCap },
                  { id: 'skipped', label: 'Skipped Work Checklist', icon: XSquare, alert: selectedStudentAnalysis.skippedList.length > 0 },
                  { id: 'comment', label: 'Smart Report Commentary', icon: Sparkles },
                  { id: 'economy', label: 'Class Economy History', icon: ShoppingBag }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeReportTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveReportTab(tab.id as any);
                        if (tab.id === 'comment') {
                          setCustomCommentText(generateCommentDraft(selectedStudentAnalysis));
                        }
                      }}
                      className={`flex items-center gap-1.5 py-3.5 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                        isActive
                          ? 'border-blue-600 text-blue-600 font-extrabold'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      {tab.label}
                      {tab.alert && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-sm shadow-rose-300" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto p-6 flex-1 max-h-[50vh] bg-slate-50/10">
                <AnimatePresence mode="wait">
                  
                  {/* Tab 1: Grades Summary */}
                  {activeReportTab === 'grades' && (
                    <motion.div
                      key="grades"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { category: 'Homework', stat: selectedStudentAnalysis.homeworkCompleted, total: selectedStudentAnalysis.homeworkTotal, pct: selectedStudentAnalysis.homeworkPercent, letter: selectedStudentAnalysis.homeworkLetter },
                          { category: 'Classwork', stat: selectedStudentAnalysis.classworkCompleted, total: selectedStudentAnalysis.classworkTotal, pct: selectedStudentAnalysis.classworkPercent, letter: getLetterGrade(selectedStudentAnalysis.classworkPercent) },
                          { category: 'Projects', stat: selectedStudentAnalysis.projectCompleted, total: selectedStudentAnalysis.projectTotal, pct: selectedStudentAnalysis.projectPercent, letter: getLetterGrade(selectedStudentAnalysis.projectPercent) },
                          { category: 'Quizzes', stat: selectedStudentAnalysis.quizCompleted, total: selectedStudentAnalysis.quizTotal, pct: selectedStudentAnalysis.quizPercent, letter: getLetterGrade(selectedStudentAnalysis.quizPercent) }
                        ].map((cat) => (
                          <div key={cat.category} className="bg-white border border-slate-100 p-3.5 rounded-2xl shadow-sm text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{cat.category}</span>
                            <span className="text-xl font-black text-slate-800 block mt-1.5">{cat.pct}%</span>
                            <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">{cat.stat} of {cat.total} assignments done</span>
                            <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-2 uppercase ${getGradeBadgeStyle(cat.pct)}`}>
                              Grade: {cat.letter}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Academic Subjects Scorecard</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Completion Rate</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {Object.entries(selectedStudentAnalysis.subjectStats).map(([subj, stats]: [string, any]) => {
                            if (stats.assigned === 0) return null;
                            return (
                              <div key={subj} className="p-4 flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <span className="text-xs font-bold text-slate-800">{subj}</span>
                                  <span className="text-[9px] text-slate-400 font-semibold block">
                                    Completed {stats.completed} of {stats.assigned} tasks ({stats.skipped} skipped)
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getGradeBadgeStyle(stats.percent)}`}>
                                    {stats.percent}% ({getLetterGrade(stats.percent)})
                                  </span>
                                  {/* Progress bar micro */}
                                  <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div
                                      style={{ width: `${stats.percent}%` }}
                                      className="bg-blue-500 h-full rounded-full"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Tab 2: Skipped Work Checklist */}
                  {activeReportTab === 'skipped' && (
                    <motion.div
                      key="skipped"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-4"
                    >
                      <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-start gap-3">
                        <div className="p-2 bg-blue-950 border border-blue-800 text-blue-200 rounded-lg">
                          <Printer className="w-4 h-4" />
                        </div>
                        <div className="leading-tight">
                          <h4 className="font-extrabold text-xs uppercase tracking-wider text-blue-100">Missing Homework Assignment Slip</h4>
                          <p className="text-[10px] text-blue-200 leading-relaxed mt-1 font-medium">
                            Use this list to print out an active completion slip or speak directly with the student regarding missing milestones.
                          </p>
                        </div>
                      </div>

                      {selectedStudentAnalysis.skippedList.length === 0 ? (
                        <div className="bg-white border border-slate-100 p-8 rounded-2xl text-center space-y-1">
                          <span className="text-3xl">🎉</span>
                          <h4 className="font-bold text-slate-800 text-xs mt-2">Perfect Submission Record!</h4>
                          <p className="text-[10px] text-slate-400">This student has submitted all assigned classroom milestones.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pl-1">
                            Pending Tasks Checklist ({selectedStudentAnalysis.skippedList.length})
                          </span>
                          <div className="space-y-2">
                            {selectedStudentAnalysis.skippedList.map((asm) => (
                              <div key={asm.id} className="bg-white border border-slate-100 p-3.5 rounded-xl shadow-sm flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-800">{asm.name}</span>
                                    <span className="px-1.5 py-0.2 bg-slate-50 border border-slate-200 text-slate-500 text-[8px] font-bold uppercase rounded">
                                      {getSubject(asm)}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium block leading-normal mt-0.5">
                                    {asm.category} • Worth +{asm.pointsValue} incentive pts
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[9px] text-rose-500 bg-rose-50 px-2 py-0.5 border border-rose-100 rounded-md font-bold block">
                                    Due: {asm.dueDate}
                                  </span>
                                  <span className="text-[8px] text-slate-400 font-medium block mt-1 uppercase">MISSING</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Tab 3: AI Comment Draft */}
                  {activeReportTab === 'comment' && (
                    <motion.div
                      key="comment"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-4"
                    >
                      <div className="p-4 bg-blue-50 border border-blue-100 text-blue-900 rounded-2xl flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="leading-tight">
                          <h4 className="font-extrabold text-xs uppercase tracking-wider text-blue-800">Smart Report Card Commentary</h4>
                          <p className="text-[10px] text-blue-600 leading-relaxed mt-1 font-semibold">
                            Auto-compiled draft based on overall progress letter grades, subject strengths/weaknesses, and active classroom economic leadership points.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pl-1">Editable Draft Summary</label>
                        <textarea
                          rows={6}
                          value={customCommentText}
                          onChange={(e) => setCustomCommentText(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-xs text-slate-700 leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                        />
                      </div>

                      <button
                        onClick={handleCopyComment}
                        className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          copiedComment
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {copiedComment ? (
                          <>
                            <Check className="w-4 h-4" /> Copied Draft to Clipboard!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" /> Copy Comment Draft
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}

                  {/* Tab 4: Classroom Economy Activity */}
                  {activeReportTab === 'economy' && (
                    <motion.div
                      key="economy"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-4"
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pl-1">Reward Purchases History</span>

                      {transactions.filter(t => t.studentId === selectedStudentAnalysis.student.id).length === 0 ? (
                        <div className="bg-white border border-slate-100 p-8 rounded-2xl text-center space-y-1">
                          <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto opacity-50" />
                          <h4 className="font-bold text-slate-800 text-xs mt-2">No purchases yet</h4>
                          <p className="text-[10px] text-slate-400">This student has not checked out any items from the Class Store yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {transactions
                            .filter(t => t.studentId === selectedStudentAnalysis.student.id)
                            .map((tx) => {
                              const item = storeItems.find((i) => i.id === tx.itemId);
                              return (
                                <div key={tx.id} className="bg-white border border-slate-100 p-3.5 rounded-xl shadow-sm flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <span className="text-xs font-bold text-slate-800">{item ? item.name : 'Unknown Item'}</span>
                                    <span className="text-[9px] text-slate-400 font-semibold block">
                                      Redeemed on {new Date(tx.timestamp).toLocaleDateString()} at {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs text-rose-600 font-extrabold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                                      -{tx.pointsCost} pts
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
                <button
                  onClick={() => setSelectedStudentAnalysis(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs cursor-pointer transition-all"
                >
                  Close Progress Card
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedReceipt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setSelectedReceipt(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between border-b border-slate-100 p-5"><div><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Class Store Receipt</p><h3 className="mt-1 text-base font-extrabold text-slate-800">{selectedReceipt.student?.name || 'Former student'}</h3><p className="mt-1 text-[10px] font-semibold text-slate-400">{selectedReceipt.id} · {new Date(selectedReceipt.timestamp).toLocaleString()}</p></div><button type="button" onClick={() => setSelectedReceipt(null)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Close receipt"><XSquare className="h-5 w-5" /></button></div>
              <div className="max-h-[45vh] divide-y divide-slate-100 overflow-y-auto px-5">{selectedReceipt.transactions.map((transaction) => { const item = storeItems.find((candidate) => candidate.id === transaction.itemId); return <div key={transaction.id} className="flex items-center justify-between py-3"><div><p className="text-xs font-bold text-slate-800">{item?.name || 'Unknown item'}</p><p className="text-[10px] font-semibold text-slate-400">Quantity {transaction.quantity || 1}</p></div><span className="text-xs font-extrabold text-slate-700">{transaction.pointsCost.toLocaleString()} pts</span></div>; })}</div>
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 p-5"><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p><p className="text-lg font-black text-slate-900">{selectedReceipt.total.toLocaleString()} pts</p></div><button type="button" onClick={() => printReceipt(selectedReceipt)} className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"><Printer className="h-3.5 w-3.5" /> Print receipt</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
