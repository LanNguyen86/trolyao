import {
  Classroom,
  Student,
  Exam,
  LessonPlan,
  SlideDeck,
  Assignment,
  Submission,
  StudentGrade,
  GradingScheme,
  UserProfile,
  AuditLog,
  UserRole
} from '../types';
import {
  initialClasses,
  initialStudents,
  initialExams,
  initialLessonPlans,
  initialSlides,
  initialAssignments,
  initialSubmissions,
  initialStudentGrades,
  defaultGradingScheme,
  initialCurrentUser,
  initialAuditLogs
} from '../data/mockData';

const KEYS = {
  CLASSES: 'pta_classes',
  STUDENTS: 'pta_students',
  EXAMS: 'pta_exams',
  LESSONS: 'pta_lessons',
  SLIDES: 'pta_slides',
  ASSIGNMENTS: 'pta_assignments',
  SUBMISSIONS: 'pta_submissions',
  GRADES: 'pta_grades',
  SCHEME: 'pta_grading_scheme',
  USER: 'pta_current_user',
  LOGS: 'pta_audit_logs',
  SEEDED: 'pta_data_seeded_v1'
};

export const storage = {
  init() {
    if (!localStorage.getItem(KEYS.SEEDED)) {
      this.resetAll();
    }
  },

  resetAll() {
    localStorage.setItem(KEYS.CLASSES, JSON.stringify(initialClasses));
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(initialStudents));
    localStorage.setItem(KEYS.EXAMS, JSON.stringify(initialExams));
    localStorage.setItem(KEYS.LESSONS, JSON.stringify(initialLessonPlans));
    localStorage.setItem(KEYS.SLIDES, JSON.stringify(initialSlides));
    localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(initialAssignments));
    localStorage.setItem(KEYS.SUBMISSIONS, JSON.stringify(initialSubmissions));
    localStorage.setItem(KEYS.GRADES, JSON.stringify(initialStudentGrades));
    localStorage.setItem(KEYS.SCHEME, JSON.stringify(defaultGradingScheme));
    localStorage.setItem(KEYS.USER, JSON.stringify(initialCurrentUser));
    localStorage.setItem(KEYS.LOGS, JSON.stringify(initialAuditLogs));
    localStorage.setItem(KEYS.SEEDED, 'true');
    window.dispatchEvent(new Event('pta_data_changed'));
  },

  log(action: string, module: string, detail: string) {
    const logs = this.getLogs();
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleString('vi-VN'),
      action,
      module,
      user: this.getUser().name,
      detail
    };
    logs.unshift(newLog);
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs.slice(0, 50)));
    window.dispatchEvent(new Event('pta_data_changed'));
  },

  getLogs(): AuditLog[] {
    try {
      const data = localStorage.getItem(KEYS.LOGS);
      return data ? JSON.parse(data) : initialAuditLogs;
    } catch {
      return initialAuditLogs;
    }
  },

  getUser(): UserProfile {
    try {
      const data = localStorage.getItem(KEYS.USER);
      return data ? JSON.parse(data) : initialCurrentUser;
    } catch {
      return initialCurrentUser;
    }
  },

  setUser(user: UserProfile) {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
    window.dispatchEvent(new Event('pta_data_changed'));
  },

  getClasses(): Classroom[] {
    try {
      const data = localStorage.getItem(KEYS.CLASSES);
      return data ? JSON.parse(data) : initialClasses;
    } catch {
      return initialClasses;
    }
  },

  saveClasses(classes: Classroom[]) {
    localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));
    window.dispatchEvent(new Event('pta_data_changed'));
  },

  getStudents(): Student[] {
    try {
      const data = localStorage.getItem(KEYS.STUDENTS);
      return data ? JSON.parse(data) : initialStudents;
    } catch {
      return initialStudents;
    }
  },

  saveStudents(students: Student[]) {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
    window.dispatchEvent(new Event('pta_data_changed'));
  },

  getExams(): Exam[] {
    try {
      const data = localStorage.getItem(KEYS.EXAMS);
      return data ? JSON.parse(data) : initialExams;
    } catch {
      return initialExams;
    }
  },

  saveExams(exams: Exam[]) {
    localStorage.setItem(KEYS.EXAMS, JSON.stringify(exams));
    window.dispatchEvent(new Event('pta_data_changed'));
  },

  getLessons(): LessonPlan[] {
    try {
      const data = localStorage.getItem(KEYS.LESSONS);
      return data ? JSON.parse(data) : initialLessonPlans;
    } catch {
      return initialLessonPlans;
    }
  },

  saveLessons(lessons: LessonPlan[]) {
    localStorage.setItem(KEYS.LESSONS, JSON.stringify(lessons));
    window.dispatchEvent(new Event('pta_data_changed'));
  },

  getSlides(): SlideDeck[] {
    try {
      const data = localStorage.getItem(KEYS.SLIDES);
      return data ? JSON.parse(data) : initialSlides;
    } catch {
      return initialSlides;
    }
  },

  saveSlides(slides: SlideDeck[]) {
    localStorage.setItem(KEYS.SLIDES, JSON.stringify(slides));
    window.dispatchEvent(new Event('pta_data_changed'));
  },

  getAssignments(): Assignment[] {
    try {
      const data = localStorage.getItem(KEYS.ASSIGNMENTS);
      return data ? JSON.parse(data) : initialAssignments;
    } catch {
      return initialAssignments;
    }
  },

  saveAssignments(assignments: Assignment[]) {
    localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(assignments));
    window.dispatchEvent(new Event('pta_data_changed'));
  },

  getSubmissions(): Submission[] {
    try {
      const data = localStorage.getItem(KEYS.SUBMISSIONS);
      return data ? JSON.parse(data) : initialSubmissions;
    } catch {
      return initialSubmissions;
    }
  },

  saveSubmissions(submissions: Submission[]) {
    localStorage.setItem(KEYS.SUBMISSIONS, JSON.stringify(submissions));
    window.dispatchEvent(new Event('pta_data_changed'));
  },

  getGrades(): StudentGrade[] {
    try {
      const data = localStorage.getItem(KEYS.GRADES);
      return data ? JSON.parse(data) : initialStudentGrades;
    } catch {
      return initialStudentGrades;
    }
  },

  saveGrades(grades: StudentGrade[]) {
    localStorage.setItem(KEYS.GRADES, JSON.stringify(grades));
    window.dispatchEvent(new Event('pta_data_changed'));
  },

  getGradingScheme(): GradingScheme {
    try {
      const data = localStorage.getItem(KEYS.SCHEME);
      return data ? JSON.parse(data) : defaultGradingScheme;
    } catch {
      return defaultGradingScheme;
    }
  },

  saveGradingScheme(scheme: GradingScheme) {
    localStorage.setItem(KEYS.SCHEME, JSON.stringify(scheme));
    window.dispatchEvent(new Event('pta_data_changed'));
  },

  calculateAverage(scores: StudentGrade['scores'], scheme: GradingScheme): number | undefined {
    let sumWeight = 0;
    let sumScore = 0;

    const txScores = [scores.tx1, scores.tx2, scores.tx3, scores.tx4, scores.bt, scores.th].filter((s): s is number => typeof s === 'number');
    if (txScores.length > 0) {
      const avgTx = txScores.reduce((a, b) => a + b, 0) / txScores.length;
      sumScore += avgTx * scheme.txWeight;
      sumWeight += scheme.txWeight;
    }

    if (typeof scores.gk === 'number') {
      sumScore += scores.gk * scheme.gkWeight;
      sumWeight += scheme.gkWeight;
    }

    if (typeof scores.ck === 'number') {
      sumScore += scores.ck * scheme.ckWeight;
      sumWeight += scheme.ckWeight;
    }

    if (sumWeight === 0) return undefined;
    return Math.round((sumScore / sumWeight) * 10) / 10;
  },

  determineAcademicRating(avg: number | undefined, scheme: GradingScheme): StudentGrade['academicRating'] {
    if (avg === undefined) return undefined;
    if (avg >= 9.0) return 'Xuất sắc';
    if (avg >= scheme.excellentThreshold) return 'Giỏi';
    if (avg >= scheme.goodThreshold) return 'Khá';
    if (avg >= scheme.passThreshold) return 'Đạt';
    return 'Chưa đạt';
  },

  getActiveRole(): UserRole {
    try {
      const data = localStorage.getItem('pta_active_role');
      return data === 'student' ? 'student' : 'teacher';
    } catch {
      return 'teacher';
    }
  },

  setActiveRole(role: UserRole) {
    localStorage.setItem('pta_active_role', role);
    window.dispatchEvent(new Event('pta_data_changed'));
  },

  getActiveStudentId(): string {
    try {
      const data = localStorage.getItem('pta_active_student_id');
      return data || 'std-1';
    } catch {
      return 'std-1';
    }
  },

  setActiveStudentId(id: string) {
    localStorage.setItem('pta_active_student_id', id);
    window.dispatchEvent(new Event('pta_data_changed'));
  }
};
