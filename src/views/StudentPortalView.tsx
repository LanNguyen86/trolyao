import React, { useState } from 'react';
import {
  CheckSquare,
  Award,
  BookOpen,
  Sparkles,
  Upload,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Calendar,
  Send,
  X,
  Paperclip,
  Image as ImageIcon,
  UserCheck,
  ChevronRight,
  TrendingUp,
  HelpCircle,
  Eye,
  RefreshCw,
  Search,
  BookOpenCheck,
  GraduationCap
} from 'lucide-react';
import {
  Student,
  Classroom,
  Assignment,
  Submission,
  StudentGrade,
  Exam,
  SlideDeck,
  GradeLevel
} from '../types';
import { geminiService } from '../services/geminiService';

interface StudentPortalViewProps {
  students: Student[];
  classes: Classroom[];
  assignments: Assignment[];
  submissions: Submission[];
  grades: StudentGrade[];
  exams: Exam[];
  slides: SlideDeck[];
  activeStudentId: string;
  onSelectStudent: (studentId: string) => void;
  onSaveSubmission: (sub: Submission) => void;
  onSwitchToTeacher: () => void;
  onLog: (action: string, module: string, detail: string) => void;
  activeSubTab?: 'assignments' | 'grades' | 'materials' | 'tutor';
  onSubTabChange?: (tab: 'assignments' | 'grades' | 'materials' | 'tutor') => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  students,
  classes,
  assignments,
  submissions,
  grades,
  exams,
  slides,
  activeStudentId,
  onSelectStudent,
  onSaveSubmission,
  onSwitchToTeacher,
  onLog,
  activeSubTab,
  onSubTabChange
}) => {
  const [internalSubTab, setInternalSubTab] = useState<'assignments' | 'grades' | 'materials' | 'tutor'>('assignments');
  const subTab = activeSubTab || internalSubTab;
  const setSubTab = (tab: 'assignments' | 'grades' | 'materials' | 'tutor') => {
    setInternalSubTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
  };
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [searchHomework, setSearchHomework] = useState('');

  // Homework Submission Modal
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [attachedFileName, setAttachedFileName] = useState<string>('');
  const [attachedFileSize, setAttachedFileSize] = useState<string>('');
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string>('');

  // AI Tutor state
  const [tutorQuery, setTutorQuery] = useState('');
  const [tutorMessages, setTutorMessages] = useState<Array<{ sender: 'student' | 'tutor'; text: string }>>([
    {
      sender: 'tutor',
      text: 'Chào em! Thầy là Gia sư AI Vật lý THPT. Em đang gặp khó khăn ở bài tập nào, cần giải thích công thức hay hướng dẫn phương pháp giải hiện tượng nào cứ nhắn Thầy nhé!'
    }
  ]);
  const [tutorLoading, setTutorLoading] = useState(false);

  // Active student object
  const currentStudent = students.find((s) => s.id === activeStudentId) || students[0];
  const currentClass = classes.find((c) => c.id === currentStudent?.classId);
  const studentGradeRecord = grades.find((g) => g.studentId === currentStudent?.id);

  // Assignments assigned to this student's class
  const studentAssignments = assignments.filter((a) => {
    if (!currentStudent) return false;
    return a.classIds.includes(currentStudent.classId);
  });

  // Calculate homework stats
  const studentSubmissions = submissions.filter((s) => s.studentId === currentStudent?.id);
  const submittedAssignmentIds = new Set(studentSubmissions.map((s) => s.assignmentId));

  const totalAssigned = studentAssignments.length;
  const totalCompleted = studentAssignments.filter((a) => submittedAssignmentIds.has(a.id)).length;
  const pendingCount = Math.max(0, totalAssigned - totalCompleted);

  // Filtered assignments
  const displayedAssignments = studentAssignments.filter((a) => {
    const sub = studentSubmissions.find((s) => s.assignmentId === a.id);
    const hasSubmitted = !!sub;
    const isGraded = sub?.status === 'Đã chấm';

    if (assignmentFilter === 'pending' && hasSubmitted) return false;
    if (assignmentFilter === 'submitted' && (!hasSubmitted || isGraded)) return false;
    if (assignmentFilter === 'graded' && !isGraded) return false;

    if (searchHomework) {
      const q = searchHomework.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.topic.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Open Submit Homework Modal
  const handleOpenSubmit = (asg: Assignment) => {
    setActiveAssignment(asg);
    const existingSub = studentSubmissions.find((s) => s.assignmentId === asg.id);

    if (existingSub) {
      setAnswerText(existingSub.studentAnswerText || '');
      setAttachedFileName(existingSub.attachmentName || '');
      setAttachedFileSize(existingSub.attachmentSize || '');
      setQuestionAnswers(existingSub.answers || {});
    } else {
      setAnswerText('');
      setAttachedFileName('');
      setAttachedFileSize('');
      setQuestionAnswers({});
    }
    setSubmitSuccessMsg('');
    setIsSubmitModalOpen(true);
  };

  // Insert physics formula/symbol helper
  const insertSymbol = (sym: string) => {
    setAnswerText((prev) => prev + sym);
  };

  // Submit Homework Action
  const handleSubmitHomework = () => {
    if (!activeAssignment || !currentStudent) return;

    if (!answerText.trim() && !attachedFileName && Object.keys(questionAnswers).length === 0) {
      alert('Vui lòng nhập câu trả lời hoặc đính kèm tệp bài làm!');
      return;
    }

    const existingSub = studentSubmissions.find((s) => s.assignmentId === activeAssignment.id);
    const now = new Date();
    const isOverdue = new Date(activeAssignment.dueDate) < now;

    const submissionToSave: Submission = {
      id: existingSub?.id || 'sub-' + Date.now(),
      assignmentId: activeAssignment.id,
      studentId: currentStudent.id,
      studentName: currentStudent.fullName,
      classId: currentStudent.classId,
      submittedAt: now.toLocaleString('vi-VN'),
      status: existingSub?.status === 'Đã chấm' ? 'Đã chấm' : isOverdue ? 'Nộp muộn' : 'Đã nộp',
      score: existingSub?.score,
      feedback: existingSub?.feedback,
      studentAnswerText: answerText.trim(),
      attachmentName: attachedFileName || undefined,
      attachmentSize: attachedFileSize || undefined,
      answers: questionAnswers
    };

    onSaveSubmission(submissionToSave);
    onLog(
      'Học sinh nộp bài',
      'Bài tập',
      `Học sinh ${currentStudent.fullName} (${currentStudent.studentCode}) nộp bài tập: ${activeAssignment.title}`
    );

    setSubmitSuccessMsg('Nộp bài tập thành công! Bài làm của em đã được gửi đến Thầy Nguyễn Văn Hùng.');
    setTimeout(() => {
      setIsSubmitModalOpen(false);
      setSubmitSuccessMsg('');
    }, 1400);
  };

  // Simulate file upload or pick a sample photo
  const handleSimulateAttach = (sampleName: string, size: string) => {
    setAttachedFileName(sampleName);
    setAttachedFileSize(size);
  };

  // Handle actual file upload from input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setAttachedFileName(file.name);
      setAttachedFileSize(`${sizeMb} MB`);
    }
  };

  // Ask AI Tutor
  const handleSendTutor = async () => {
    if (!tutorQuery.trim() || tutorLoading) return;
    const q = tutorQuery.trim();
    setTutorMessages((prev) => [...prev, { sender: 'student', text: q }]);
    setTutorQuery('');
    setTutorLoading(true);

    try {
      const prompt = `Em là học sinh lớp ${currentClass?.grade || 10} (${currentStudent.fullName}) đang học môn Vật lý THPT Việt Nam (Chương trình GDPT 2018). Thầy hãy giải thích câu hỏi hoặc hướng dẫn phương pháp giải bài tập sau đây một cách sư phạm, dễ hiểu, có ví dụ minh họa và công thức rõ ràng:\n"${q}"`;
      const response = await geminiService.sendChatMessage(prompt, []);
      setTutorMessages((prev) => [...prev, { sender: 'tutor', text: response.text }]);
    } catch {
      setTutorMessages((prev) => [
        ...prev,
        {
          sender: 'tutor',
          text: 'Về câu hỏi của em: Để giải dạng bài này, em cần chú ý xác định các đại lượng đã biết, đổi về đơn vị chuẩn SI (m, s, kg, N, J), sau đó áp dụng công thức định luật bảo toàn hoặc định luật Newton tương ứng. Em hãy kiểm tra lại các bước biến đổi nhé!'
        }
      ]);
    } finally {
      setTutorLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Banner & Quick Profile Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-sky-950 rounded-2xl p-5 md:p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 flex items-center justify-center font-bold text-xl shadow-md shrink-0">
              {currentStudent?.fullName.charAt(0) || 'H'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
                  CỔNG HỌC SINH
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-sky-200 text-xs font-mono font-semibold">
                  Mã HS: {currentStudent?.studentCode}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/30 text-white text-xs font-bold">
                  {currentClass?.name || 'Lớp 10A1'}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight mt-1">
                {currentStudent?.fullName || 'Học sinh'}
              </h2>
              <p className="text-xs text-sky-200/80 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>GV Bộ môn Vật lý: <strong>{currentClass?.physicsTeacher || 'Thầy Nguyễn Văn Hùng'}</strong></span>
                <span>•</span>
                <span>Phòng học: {currentClass?.roomNumber || 'P.301'}</span>
              </p>
            </div>
          </div>

          {/* Switch Student selector & Switch to Teacher button */}
          <div className="flex items-center flex-wrap gap-2.5 bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/15">
            <div className="text-xs">
              <label className="block text-slate-300 text-[11px] mb-1 font-medium">
                Chọn học sinh mô phỏng:
              </label>
              <select
                value={activeStudentId}
                onChange={(e) => onSelectStudent(e.target.value)}
                className="bg-slate-800 text-white border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 outline-none font-medium"
              >
                {classes.map((cls) => {
                  const classStds = students.filter((s) => s.classId === cls.id);
                  return (
                    <optgroup key={cls.id} label={`Lớp ${cls.code} (${cls.name})`}>
                      {classStds.map((std) => (
                        <option key={std.id} value={std.id}>
                          {std.fullName} - {std.studentCode} ({cls.code})
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            <button
              onClick={onSwitchToTeacher}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-blue-900 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer mt-auto"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-700" />
              Đổi sang Giảng viên
            </button>
          </div>
        </div>

        {/* 4 Quick Stat Cards for Student */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/15">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <p className="text-[11px] text-sky-200">Bài tập đã giao</p>
            <p className="text-xl font-bold mt-0.5">{totalAssigned} bài</p>
            <span className="text-[10px] text-slate-300">Theo kế hoạch lớp</span>
          </div>

          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <p className="text-[11px] text-amber-200">Bài tập cần nộp</p>
            <p className="text-xl font-bold text-amber-300 mt-0.5">{pendingCount} bài</p>
            <span className="text-[10px] text-amber-200/80">Chưa nộp bài giải</span>
          </div>

          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <p className="text-[11px] text-emerald-200">Đã hoàn thành</p>
            <p className="text-xl font-bold text-emerald-300 mt-0.5">{totalCompleted} bài</p>
            <span className="text-[10px] text-emerald-200/80">Đã nộp cho Thầy</span>
          </div>

          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <p className="text-[11px] text-sky-200">Điểm TB môn Vật lý</p>
            <p className="text-xl font-bold text-white mt-0.5">
              {studentGradeRecord?.averageScore ? `${studentGradeRecord.averageScore}/10` : 'Đang cập nhật'}
            </p>
            <span className="text-[10px] text-sky-200 font-semibold">
              {studentGradeRecord?.academicRating || 'Học lực Khá/Giỏi'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSubTab('assignments')}
          className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
            subTab === 'assignments'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Bài tập về nhà &amp; Nộp bài
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded-full text-[11px] font-extrabold">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('grades')}
          className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
            subTab === 'grades'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          Bảng điểm cá nhân
        </button>

        <button
          onClick={() => setSubTab('materials')}
          className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
            subTab === 'materials'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Kho học liệu &amp; Đề ôn tập
        </button>

        <button
          onClick={() => setSubTab('tutor')}
          className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
            subTab === 'tutor'
              ? 'bg-gradient-to-r from-blue-900 to-indigo-900 text-amber-300 shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          Gia sư AI Vật lý
        </button>
      </div>

      {/* SUB-TAB 1: ASSIGNMENTS & HOMEWORK SUBMISSION */}
      {subTab === 'assignments' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setAssignmentFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  assignmentFilter === 'all'
                    ? 'bg-blue-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({studentAssignments.length})
              </button>
              <button
                onClick={() => setAssignmentFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  assignmentFilter === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Chưa nộp ({pendingCount})
              </button>
              <button
                onClick={() => setAssignmentFilter('submitted')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  assignmentFilter === 'submitted'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Đã nộp (Chờ chấm)
              </button>
              <button
                onClick={() => setAssignmentFilter('graded')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  assignmentFilter === 'graded'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Đã chấm điểm
              </button>
            </div>

            <div className="relative sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchHomework}
                onChange={(e) => setSearchHomework(e.target.value)}
                placeholder="Tìm kiếm bài tập..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
          </div>

          {/* Assignments List */}
          {displayedAssignments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">Không tìm thấy bài tập nào trong mục này</p>
              <p className="text-xs text-slate-400 mt-1">
                Tất cả bài tập đã được lọc hoặc Thầy/Cô chưa giao thêm bài tập mới cho lớp {currentClass?.code}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedAssignments.map((asg) => {
                const sub = studentSubmissions.find((s) => s.assignmentId === asg.id);
                const hasSubmitted = !!sub;
                const isGraded = sub?.status === 'Đã chấm';
                const isOverdue = new Date(asg.dueDate) < new Date();

                return (
                  <div
                    key={asg.id}
                    className={`bg-white rounded-2xl border p-5 transition-all flex flex-col justify-between shadow-2xs hover:shadow-sm ${
                      isGraded
                        ? 'border-emerald-200 hover:border-emerald-400'
                        : hasSubmitted
                        ? 'border-blue-200 hover:border-blue-400'
                        : isOverdue
                        ? 'border-rose-200 hover:border-rose-400'
                        : 'border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {asg.code}
                        </span>

                        {/* Status Badge */}
                        {isGraded ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã chấm: {sub?.score}/10 điểm
                          </span>
                        ) : hasSubmitted ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Đã nộp bài
                          </span>
                        ) : isOverdue ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Quá hạn nộp
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Chưa nộp
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-base text-slate-800 leading-snug">{asg.title}</h3>
                      <p className="text-xs text-blue-700 font-medium mt-1">Chủ đề: {asg.topic}</p>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {asg.description}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Hạn nộp: <strong className={isOverdue && !hasSubmitted ? 'text-rose-600' : 'text-slate-700'}>{asg.dueDate}</strong>
                        </span>
                        <span>{asg.questions?.length || 0} câu hỏi</span>
                      </div>

                      {/* If Graded: Show teacher feedback */}
                      {isGraded && sub?.feedback && (
                        <div className="mt-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs">
                          <p className="font-semibold text-emerald-800 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            Nhận xét của Thầy cô:
                          </p>
                          <p className="text-slate-700 italic mt-0.5">&quot;{sub.feedback}&quot;</p>
                        </div>
                      )}

                      {/* If Submitted: Show attachment indicator */}
                      {hasSubmitted && sub?.attachmentName && (
                        <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                          <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                          <span>File đính kèm: <strong>{sub.attachmentName}</strong> ({sub.attachmentSize || 'Ảnh bài giải'})</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Thang điểm: <strong>{asg.totalPoints || 10}đ</strong>
                      </span>

                      <button
                        onClick={() => handleOpenSubmit(asg)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                          isGraded
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            : hasSubmitted
                            ? 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                            : 'bg-blue-700 hover:bg-blue-800 text-white'
                        }`}
                      >
                        {isGraded ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            Xem lại bài làm
                          </>
                        ) : hasSubmitted ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Cập nhật bài nộp
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            Làm &amp; Nộp bài
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: MY GRADES */}
      {subTab === 'grades' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base md:text-lg font-bold text-slate-800">
                Sổ điểm cá nhân môn Vật lý • {currentClass?.name}
              </h3>
              <p className="text-xs text-slate-500">
                Học sinh: <strong>{currentStudent?.fullName}</strong> ({currentStudent?.studentCode}) • Năm học {currentClass?.schoolYear}
              </p>
            </div>
            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-right">
              <span className="text-[11px] text-blue-600 block font-medium">Điểm trung bình học kỳ</span>
              <span className="text-2xl font-black text-blue-900 leading-tight">
                {studentGradeRecord?.averageScore ?? '--'}
              </span>
            </div>
          </div>

          {/* Scores Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">TX 1 (HS 1)</span>
              <span className="text-lg font-bold text-slate-800 block mt-1">
                {studentGradeRecord?.scores.tx1 ?? '-'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">TX 2 (HS 1)</span>
              <span className="text-lg font-bold text-slate-800 block mt-1">
                {studentGradeRecord?.scores.tx2 ?? '-'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">TX 3 (HS 1)</span>
              <span className="text-lg font-bold text-slate-800 block mt-1">
                {studentGradeRecord?.scores.tx3 ?? '-'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Bài tập về nhà</span>
              <span className="text-lg font-bold text-slate-800 block mt-1">
                {studentGradeRecord?.scores.bt ?? '-'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Thực hành</span>
              <span className="text-lg font-bold text-slate-800 block mt-1">
                {studentGradeRecord?.scores.th ?? '-'}
              </span>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
              <span className="text-[11px] text-indigo-700 font-bold block">Giữa kỳ (HS 2)</span>
              <span className="text-lg font-black text-indigo-900 block mt-1">
                {studentGradeRecord?.scores.gk ?? '-'}
              </span>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
              <span className="text-[11px] text-blue-700 font-bold block">Cuối kỳ (HS 3)</span>
              <span className="text-lg font-black text-blue-900 block mt-1">
                {studentGradeRecord?.scores.ck ?? '-'}
              </span>
            </div>
          </div>

          {/* Academic Rating & Pedagogical Note */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-slate-700">Xếp loại học lực môn Vật lý:</p>
              <span className="text-sm font-extrabold text-emerald-700 mt-0.5 inline-block">
                {studentGradeRecord?.academicRating || 'Đạt tiêu chuẩn'}
              </span>
            </div>
            <div className="md:text-right">
              <p className="font-semibold text-slate-500">Ghi chú sư phạm:</p>
              <p className="text-slate-700 italic mt-0.5">
                {studentGradeRecord?.notes || 'Học sinh chăm chỉ, nắm vững kiến thức định luật và giải bài tập cẩn thận.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: STUDY MATERIALS & PRACTICE */}
      {subTab === 'materials' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <h3 className="text-base font-bold text-slate-800 mb-2">Đề thi ôn luyện tự học</h3>
            <p className="text-xs text-slate-500 mb-4">
              Các đề thi ôn tập và kiểm tra định kỳ khối {currentClass?.grade || 10} để học sinh tự luyện kiến thức
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exams
                .filter((e) => e.grade === (currentClass?.grade || 10))
                .slice(0, 4)
                .map((exam) => (
                  <div key={exam.id} className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold font-mono">
                        {exam.code}
                      </span>
                      <h4 className="font-bold text-sm text-slate-800 mt-1">{exam.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {exam.type} • {exam.durationMinutes} phút • {exam.questions?.length || 0} câu hỏi
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-blue-700 px-3 py-1 bg-white border border-blue-200 rounded-lg shadow-2xs">
                      Tự ôn luyện
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <h3 className="text-base font-bold text-slate-800 mb-2">Slide bài giảng tóm tắt</h3>
            <p className="text-xs text-slate-500 mb-4">
              Slide tóm tắt kiến thức lý thuyết trọng tâm của các chương
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {slides
                .filter((s) => s.grade === (currentClass?.grade || 10))
                .slice(0, 3)
                .map((slide) => (
                  <div key={slide.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">
                      {slide.chapter}
                    </span>
                    <h4 className="font-bold text-sm text-slate-800 mt-2">{slide.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{slide.description}</p>
                    <div className="mt-3 text-xs text-blue-700 font-medium">
                      {slide.slideCount} slide trình chiếu
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: AI PHYSICS TUTOR */}
      {subTab === 'tutor' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 text-amber-300 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Gia sư AI Vật lý THPT</h3>
              <p className="text-xs text-slate-500">
                Hỏi đáp lý thuyết, giải thích hiện tượng và hướng dẫn phương pháp giải bài tập Vật lý khối {currentClass?.grade || 10}
              </p>
            </div>
          </div>

          {/* Quick Prompt Chips */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-400 text-[11px]">Gợi ý câu hỏi:</span>
            {[
              'Hướng dẫn cách giải bài toán con lắc lò xo',
              'Định luật bảo toàn cơ năng khi nào áp dụng?',
              'Cách đổi đơn vị vận tốc km/h sang m/s',
              'Giải thích hiện tượng khúc xạ ánh sáng'
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => setTutorQuery(chip)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 rounded-lg text-xs transition-colors cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat message history */}
          <div className="h-80 overflow-y-auto space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs md:text-sm">
            {tutorMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed shadow-2xs ${
                    msg.sender === 'student'
                      ? 'bg-blue-700 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  <p className="font-semibold text-[11px] mb-1 opacity-80">
                    {msg.sender === 'student' ? currentStudent.fullName : 'Thầy Gia sư AI'}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {tutorLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-500 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  Thầy đang suy nghĩ và chuẩn bị lời giải thích cho em...
                </div>
              </div>
            )}
          </div>

          {/* Input field */}
          <div className="flex gap-2">
            <input
              type="text"
              value={tutorQuery}
              onChange={(e) => setTutorQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendTutor()}
              placeholder="Nhập câu hỏi Vật lý em cần trợ giúp..."
              className="flex-1 p-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-xl text-xs md:text-sm outline-none"
            />
            <button
              onClick={handleSendTutor}
              disabled={tutorLoading || !tutorQuery.trim()}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs md:text-sm transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Gửi câu hỏi
            </button>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT HOMEWORK (NỘP BÀI TẬP VỀ NHÀ) */}
      {isSubmitModalOpen && activeAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-4 sm:p-6 space-y-4 text-xs md:text-sm my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">
                  {activeAssignment.code}
                </span>
                <h3 className="text-base md:text-lg font-bold text-slate-800 mt-1">
                  Nộp bài: {activeAssignment.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Học sinh: <strong>{currentStudent.fullName}</strong> ({currentStudent.studentCode}) • Hạn nộp: <strong className="text-blue-700">{activeAssignment.dueDate}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{submitSuccessMsg}</span>
              </div>
            )}

            {/* Assignment Instructions / Questions */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1.5">
              <p className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                <BookOpenCheck className="w-4 h-4 text-blue-700" />
                Yêu cầu của Thầy cô:
              </p>
              <p className="text-slate-700 text-xs leading-relaxed">{activeAssignment.description}</p>
              {activeAssignment.instructions && (
                <p className="text-slate-500 text-[11px] italic">
                  Hướng dẫn: {activeAssignment.instructions}
                </p>
              )}
            </div>

            {/* Questions list if any */}
            {activeAssignment.questions && activeAssignment.questions.length > 0 && (
              <div className="space-y-3 pt-1">
                <h4 className="font-bold text-slate-800 text-xs">Danh sách câu hỏi bài tập:</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {activeAssignment.questions.map((q, idx) => (
                    <div key={q.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900">Câu {idx + 1}:</span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-medium">
                          {q.level} • {q.points || 1}đ
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium">{q.content}</p>

                      {/* Multiple choice options */}
                      {q.options && q.options.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {q.options.map((opt, optIdx) => {
                            const optionKey = ['A', 'B', 'C', 'D'][optIdx] || `${optIdx + 1}`;
                            const isSelected = questionAnswers[q.id] === optionKey;
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() =>
                                  setQuestionAnswers({
                                    ...questionAnswers,
                                    [q.id]: optionKey
                                  })
                                }
                                className={`p-2 rounded-lg text-left border text-xs transition-all flex items-center gap-2 cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-700 text-white border-blue-700 font-bold'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                  isSelected ? 'bg-white text-blue-800' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {optionKey}
                                </span>
                                <span className="truncate">{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div>
                          <input
                            type="text"
                            placeholder="Nhập câu trả lời ngắn cho câu này..."
                            value={questionAnswers[q.id] || ''}
                            onChange={(e) =>
                              setQuestionAnswers({
                                ...questionAnswers,
                                [q.id]: e.target.value
                              })
                            }
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Written Solution Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 text-xs">
                  Nội dung bài làm / Lời giải chi tiết:
                </label>
                {/* Symbol helper */}
                <div className="flex items-center gap-1 overflow-x-auto text-[10px]">
                  <span className="text-slate-400">Ký hiệu Vật lý:</span>
                  {['Ω', 'λ', 'α', 'Δ', 'μ', 'π', 'ω', 'm/s²', 'N', 'J'].map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => insertSymbol(sym)}
                      className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 text-slate-700 rounded font-mono font-bold"
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={4}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Ghi lời giải chi tiết, tóm tắt các đại lượng, công thức và kết quả tính toán..."
                className="w-full p-3 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-600 rounded-xl outline-none font-sans text-xs leading-relaxed"
              />
            </div>

            {/* File Attachment Section */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 text-xs block">
                Đính kèm tệp bài làm (Ảnh chụp bài giải viết tay, file PDF hoặc Word):
              </label>

              {attachedFileName ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-blue-700 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800 text-xs">{attachedFileName}</p>
                      <p className="text-[10px] text-slate-500">{attachedFileSize || '1.8 MB'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachedFileName('');
                      setAttachedFileSize('');
                    }}
                    className="p-1 hover:bg-rose-100 text-rose-600 rounded-lg text-xs"
                    title="Xóa tệp đính kèm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors text-slate-600 text-xs font-semibold">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>Chọn tệp từ máy tính / điện thoại</span>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    />
                  </label>

                  {/* Sample Attachment Buttons for quick demo */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>Hoặc đính kèm nhanh mẫu bài làm:</span>
                    <button
                      type="button"
                      onClick={() => handleSimulateAttach('Bai_lam_vat_ly_trang_1.jpg', '2.4 MB')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-blue-100 text-blue-700 rounded-md font-medium"
                    >
                      + Ảnh bài làm viết tay (.jpg)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateAttach('Bai_giai_chi_tiet_HS1001.pdf', '1.2 MB')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-blue-100 text-blue-700 rounded-md font-medium"
                    >
                      + File PDF lời giải
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-medium"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSubmitHomework}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Xác nhận nộp bài tập
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
