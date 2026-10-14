export type GradeLevel = 10 | 11 | 12;
export type Semester = 1 | 2;

export type CognitiveLevel = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';

export type ExamType = 'Thường xuyên' | 'Giữa kỳ' | 'Cuối kỳ' | 'Ôn tập' | 'Thi thử';
export type ExamStatus = 'Bản nháp' | 'Đã hoàn thiện' | 'Đã sử dụng';

export interface Question {
  id: string;
  code: string;
  content: string;
  type: QuestionType;
  level: CognitiveLevel;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
  topic: string;
}

export interface Exam {
  id: string;
  code: string;
  title: string;
  grade: GradeLevel;
  semester: Semester;
  topic: string;
  type: ExamType;
  durationMinutes: number;
  totalPoints: number;
  createdAt: string;
  status: ExamStatus;
  questions: Question[];
  notes?: string;
  attachmentName?: string;
}

export interface LessonActivity {
  id: string;
  name: string; // e.g., "Hoạt động 1: Khởi động", "Hoạt động 2: Hình thành kiến thức"
  durationMinutes: number;
  goal: string;
  content: string;
  teacherAction: string;
  studentAction: string;
  output: string;
}

export interface LessonPlan {
  id: string;
  code: string;
  title: string;
  grade: GradeLevel;
  chapter: string;
  textbook: 'Kết nối tri thức' | 'Cánh diều' | 'Chân trời sáng tạo';
  durationPeriods: number; // số tiết (1, 2, 3...)
  semester: Semester;
  objectives: {
    knowledge: string[];
    competencies: string[]; // năng lực
    qualities: string[]; // phẩm chất
  };
  keyKnowledge: string[];
  teachingTools: string[];
  activities: LessonActivity[];
  assessmentMethod: string;
  references: string[];
  createdAt: string;
  updatedAt: string;
  attachmentName?: string;
}

export interface SlideSlideItem {
  slideNumber: number;
  title: string;
  bullets: string[];
  teacherNotes: string;
  diagramIdea?: string;
  interactiveQuestion?: string;
}

export interface SlideDeck {
  id: string;
  code: string;
  title: string;
  grade: GradeLevel;
  chapter: string;
  topic: string;
  description: string;
  fileFormat: 'PPTX' | 'PDF';
  fileSize: string;
  previewUrl?: string;
  slideCount: number;
  relatedLessonId?: string;
  slides: SlideSlideItem[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  code: string;
  title: string;
  classIds: string[];
  grade: GradeLevel;
  topic: string;
  description: string;
  instructions: string;
  totalPoints: number;
  assignedDate: string;
  dueDate: string;
  status: 'Đang mở' | 'Sắp hết hạn' | 'Đã hết hạn';
  questions: Question[];
  sampleTeacherSolution: string;
  submissionsCount?: number;
  gradedCount?: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  classId: string;
  submittedAt: string;
  status: 'Đã nộp' | 'Chưa nộp' | 'Nộp muộn' | 'Đã chấm';
  score?: number;
  feedback?: string;
  studentAnswerText?: string;
  attachmentName?: string;
  attachmentSize?: string;
  answers?: Record<string, string>;
}

export type UserRole = 'teacher' | 'student';

export interface Student {
  id: string;
  studentCode: string;
  fullName: string;
  classId: string;
  className: string;
  grade: GradeLevel;
  gender: 'Nam' | 'Nữ';
  dob: string;
  phone?: string;
  parentPhone?: string;
  email?: string;
  status: 'Đang học' | 'Nghỉ học' | 'Cần hỗ trợ';
  notes?: string;
}

export interface Classroom {
  id: string;
  code: string;
  name: string;
  grade: GradeLevel;
  schoolYear: string;
  studentCount: number;
  homeroomTeacher: string;
  physicsTeacher: string;
  roomNumber: string;
}

export interface GradeScores {
  tx1?: number; // Thường xuyên 1
  tx2?: number; // Thường xuyên 2
  tx3?: number; // Thường xuyên 3
  tx4?: number; // Thường xuyên 4
  gk?: number;  // Giữa kỳ (hệ số 2)
  ck?: number;  // Cuối kỳ (hệ số 3)
  bt?: number;  // Bài tập (thường xuyên)
  th?: number;  // Thực hành
}

export interface StudentGrade {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  classId: string;
  grade: GradeLevel;
  semester: Semester;
  scores: GradeScores;
  averageScore?: number;
  academicRating?: 'Xuất sắc' | 'Giỏi' | 'Khá' | 'Đạt' | 'Chưa đạt';
  notes?: string;
  updatedAt: string;
}

export interface GradingScheme {
  txWeight: number; // Default 1
  gkWeight: number; // Default 2
  ckWeight: number; // Default 3
  passThreshold: number; // 5.0
  goodThreshold: number; // 6.5
  excellentThreshold: number; // 8.0
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'admin' | 'student';
  title: string;
  school: string;
  avatarUrl?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  module: string;
  user: string;
  detail: string;
}
