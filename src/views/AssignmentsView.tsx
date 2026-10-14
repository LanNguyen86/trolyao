import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Download,
  Trash2,
  Edit3,
  Eye,
  Send,
  X,
  UserCheck,
  ChevronRight,
  FileDown,
  Paperclip
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Assignment, Submission, Classroom, Student, GradeLevel } from '../types';
import { geminiService } from '../services/geminiService';

interface AssignmentsViewProps {
  assignments: Assignment[];
  submissions: Submission[];
  classes: Classroom[];
  students: Student[];
  onSaveAssignment: (asg: Assignment) => void;
  onDeleteAssignment: (id: string) => void;
  onSaveSubmission: (sub: Submission) => void;
  onLog: (action: string, module: string, detail: string) => void;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  assignments,
  submissions,
  classes,
  students,
  onSaveAssignment,
  onDeleteAssignment,
  onSaveSubmission,
  onLog
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [selectedAsg, setSelectedAsg] = useState<Assignment | null>(null);
  const [isViewingSubmissions, setIsViewingSubmissions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // Grade student modal
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(10);
  const [gradingFeedback, setGradingFeedback] = useState<string>('');

  // AI Generator state
  const [aiGrade, setAiGrade] = useState<GradeLevel>(11);
  const [aiTopic, setAiTopic] = useState('Dao động điều hòa và Sóng cơ');
  const [aiDifficulty, setAiDifficulty] = useState('Phân hóa: 2 câu cơ bản + 2 câu nâng cao');
  const [aiCount, setAiCount] = useState(4);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<any>(null);

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<Assignment>>({});

  const filteredAssignments = assignments.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = classFilter === 'all' || a.classIds.includes(classFilter);
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchClass && matchStatus;
  });

  const handleOpenAdd = () => {
    const newAsg: Assignment = {
      id: 'asg-' + Date.now(),
      code: `BT-${Date.now().toString().slice(-4)}`,
      title: 'Bài tập Vật lý mới',
      classIds: [classes[0]?.id || 'cls-10a1'],
      grade: classes[0]?.grade || 10,
      topic: 'Kiến thức trọng tâm',
      description: 'Luyện tập kỹ năng giải bài tập định tính và định lượng',
      instructions: 'Làm bài cẩn thận, ghi rõ đơn vị SI và các bước biến đổi',
      totalPoints: 10,
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'Đang mở',
      questions: [],
      sampleTeacherSolution: 'Đáp án chi tiết dành riêng cho giáo viên đối chiếu khi chấm',
      submissionsCount: 0,
      gradedCount: 0
    };
    setEditForm(newAsg);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editForm.title || !editForm.code) {
      alert('Vui lòng nhập đầy đủ Mã và Tên bài tập!');
      return;
    }
    onSaveAssignment(editForm as Assignment);
    onLog('Cập nhật bài tập', 'Bài tập', `Lưu bài tập: ${editForm.title} (${editForm.code})`);
    setIsEditing(false);
  };

  const handleOpenGradeModal = (sub: Submission) => {
    setActiveSubmission(sub);
    setGradingScore(sub.score ?? 8.5);
    setGradingFeedback(sub.feedback ?? 'Bài làm tốt, trình bày rõ ràng.');
  };

  const handleSaveGrading = () => {
    if (!activeSubmission) return;
    const updated: Submission = {
      ...activeSubmission,
      score: gradingScore,
      feedback: gradingFeedback,
      status: 'Đã chấm'
    };
    onSaveSubmission(updated);
    onLog('Chấm bài tập', 'Bài tập', `Chấm bài cho học sinh: ${activeSubmission.studentName} (${gradingScore} điểm)`);
    setActiveSubmission(null);
  };

  // AI suggest feedback
  const handleAISuggestFeedback = () => {
    if (!activeSubmission) return;
    const score = gradingScore;
    if (score >= 9) {
      setGradingFeedback('Xuất sắc! Lời giải logic, chặt chẽ, sử dụng đơn vị SI chuẩn mực. Khuyến khích tiếp tục phát huy!');
    } else if (score >= 7) {
      setGradingFeedback('Bài làm khá tốt, nắm chắc công thức cơ bản. Cần lưu ý bước biến đổi đại số và giải thích các giả thiết vật lý rõ hơn.');
    } else {
      setGradingFeedback('Còn nhầm lẫn trong việc chọn chiều dương và áp dụng công thức. Đề nghị xem lại bài giảng và làm lại các câu chưa đạt.');
    }
  };

  // Export results to Excel
  const handleExportAssignmentResults = (asg: Assignment) => {
    const asgSubs = submissions.filter((s) => s.assignmentId === asg.id);
    const data = asgSubs.map((s, idx) => ({
      'STT': idx + 1,
      'Mã bài tập': asg.code,
      'Tên bài tập': asg.title,
      'Họ và tên học sinh': s.studentName,
      'Thời gian nộp': s.submittedAt,
      'Trạng thái': s.status,
      'Điểm số': s.score ?? 'Chưa chấm',
      'Nhận xét của giáo viên': s.feedback ?? '',
      'Câu trả lời của HS': s.studentAnswerText ?? ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ket_Qua_Bai_Tap');
    XLSX.writeFile(wb, `KetQua_${asg.code}_${asg.title.slice(0, 20)}.xlsx`);
  };

  // AI Generator
  const handleGenerateAI = async () => {
    setAiLoading(true);
    setAiPreview(null);
    try {
      const result = await geminiService.generateAssignment({
        grade: aiGrade,
        topic: aiTopic,
        difficultyLevel: aiDifficulty,
        questionCount: aiCount
      });
      setAiPreview(result);
    } catch (err: any) {
      alert(`Lỗi AI: ${err.message || 'Không thể tạo bài tập'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApproveAIAssignment = () => {
    if (!aiPreview) return;
    const newAsg: Assignment = {
      id: 'asg-ai-' + Date.now(),
      code: `BT-${aiGrade}-AI-${Date.now().toString().slice(-4)}`,
      title: aiPreview.title || `Bài tập ${aiTopic}`,
      classIds: [classes[0]?.id || 'cls-10a1'],
      grade: aiGrade,
      topic: aiTopic,
      description: aiPreview.description || 'Bài tập do Trợ lý AI tạo',
      instructions: aiPreview.instructions || 'Làm bài cẩn thận vào vở',
      totalPoints: 10,
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'Đang mở',
      sampleTeacherSolution: aiPreview.sampleTeacherSolution || 'Lời giải chi tiết',
      questions: aiPreview.questions || [],
      submissionsCount: 0,
      gradedCount: 0
    };

    onSaveAssignment(newAsg);
    onLog('Tạo bài tập AI', 'Bài tập', `Giao bài tập AI: ${newAsg.title}`);
    setShowAIModal(false);
    setAiPreview(null);
    alert('Đã phê duyệt và lưu bài tập AI thành công!');
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên bài tập, mã, chủ đề..."
              className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="text-xs md:text-sm px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="all">Tất cả lớp được giao</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs md:text-sm px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Đang mở">Đang mở</option>
            <option value="Sắp hết hạn">Sắp hết hạn</option>
            <option value="Đã hết hạn">Đã hết hạn</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAIModal(true)}
            className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 text-xs md:text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            AI Tạo bài tập phân hóa
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs md:text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Giao bài tập mới
          </button>
        </div>
      </div>

      {/* Assignment List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Bài tập &amp; Chủ đề</th>
                <th className="py-3 px-3">Lớp áp dụng</th>
                <th className="py-3 px-3">Ngày giao</th>
                <th className="py-3 px-3">Hạn nộp</th>
                <th className="py-3 px-3 text-center">Tiến độ nộp</th>
                <th className="py-3 px-3">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssignments.map((asg) => {
                const asgSubs = submissions.filter((s) => s.assignmentId === asg.id);
                const submittedCount = asgSubs.length;
                const gradedCount = asgSubs.filter((s) => s.status === 'Đã chấm').length;

                return (
                  <tr key={asg.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-slate-800">{asg.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{asg.topic}</p>
                        <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-semibold">
                          {asg.code}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {asg.classIds.map((cid) => {
                          const cls = classes.find((c) => c.id === cid);
                          return (
                            <span key={cid} className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                              {cls ? cls.code : 'Lớp ' + asg.grade}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{asg.assignedDate}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-amber-700">{asg.dueDate}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="inline-block text-left">
                        <span className="font-bold text-blue-700">{submittedCount}</span> đã nộp •{' '}
                        <span className="font-bold text-emerald-700">{gradedCount}</span> đã chấm
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          asg.status === 'Đang mở'
                            ? 'bg-blue-50 text-blue-700'
                            : asg.status === 'Sắp hết hạn'
                            ? 'bg-amber-50 text-amber-700 animate-pulse'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {asg.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedAsg(asg);
                            setIsViewingSubmissions(true);
                          }}
                          className="px-2.5 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors cursor-pointer"
                          title="Xem danh sách bài nộp và chấm điểm"
                        >
                          Chấm bài ({asgSubs.length})
                        </button>
                        <button
                          onClick={() => handleExportAssignmentResults(asg)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Xuất kết quả bài làm ra Excel"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditForm(JSON.parse(JSON.stringify(asg)));
                            setIsEditing(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa bài tập"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa bài tập "${asg.title}"?`)) {
                              onDeleteAssignment(asg.id);
                              onLog('Xóa bài tập', 'Bài tập', `Xóa mã: ${asg.code}`);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa bài tập"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUBMISSIONS LIST & GRADING MODAL */}
      {isViewingSubmissions && selectedAsg && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs px-2 py-0.5 bg-blue-600 rounded font-semibold font-mono">
                  {selectedAsg.code}
                </span>
                <h3 className="text-lg md:text-xl font-bold mt-1">
                  Bài làm của học sinh: {selectedAsg.title}
                </h3>
                <p className="text-xs text-slate-300">
                  Hạn nộp: {selectedAsg.dueDate} • Tổng điểm: {selectedAsg.totalPoints}
                </p>
              </div>
              <button
                onClick={() => setIsViewingSubmissions(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs md:text-sm">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                <strong>Đáp án tham khảo (Dành riêng cho giáo viên):</strong>{' '}
                {selectedAsg.sampleTeacherSolution}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3">Học sinh</th>
                      <th className="py-2.5 px-3">Thời gian nộp</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3 text-center">Điểm</th>
                      <th className="py-2.5 px-3">Nhận xét của Thầy/Cô</th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissions
                      .filter((s) => s.assignmentId === selectedAsg.id)
                      .map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {sub.studentName}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{sub.submittedAt}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                sub.status === 'Đã chấm'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-base text-blue-700">
                            {sub.score !== undefined ? sub.score : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                            {sub.feedback || 'Chưa có nhận xét'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleOpenGradeModal(sub)}
                              className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium text-xs cursor-pointer"
                            >
                              Chấm / Sửa điểm
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsViewingSubmissions(false)}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRADING SUBMISSION MODAL */}
      {activeSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-4 bg-blue-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                Chấm điểm bài làm: {activeSubmission.studentName}
              </h3>
              <button
                onClick={() => setActiveSubmission(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs md:text-sm">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs border-b border-slate-200/80 pb-1.5">
                  <span className="font-semibold text-slate-700">Nội dung bài làm của học sinh:</span>
                  <span className="text-[11px] text-slate-500">Nộp lúc: {activeSubmission.submittedAt}</span>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
                  {activeSubmission.studentAnswerText || 'Không có văn bản tự luận.'}
                </p>

                {activeSubmission.answers && Object.keys(activeSubmission.answers).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60">
                    <p className="font-semibold text-blue-900 text-[11px] mb-1">Đáp án trắc nghiệm đã chọn:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(activeSubmission.answers).map(([qid, ans], i) => (
                        <span key={qid} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[11px]">
                          Câu {i + 1}: {ans}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {activeSubmission.attachmentName && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-2 text-xs text-blue-700 bg-blue-50/60 p-2 rounded-lg">
                    <Paperclip className="w-4 h-4 shrink-0" />
                    <span>Tệp đính kèm: <strong>{activeSubmission.attachmentName}</strong> ({activeSubmission.attachmentSize || 'Ảnh chụp bài giải'})</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Điểm số (Thang điểm 10) *
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={gradingScore}
                  onChange={(e) => setGradingScore(Number(e.target.value))}
                  className="w-full p-2 text-base font-bold text-blue-700 border border-slate-300 rounded-lg outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Lời nhận xét &amp; Hướng dẫn sửa lỗi</label>
                  <button
                    onClick={handleAISuggestFeedback}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    AI Gợi ý nhận xét
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={gradingFeedback}
                  onChange={(e) => setGradingFeedback(e.target.value)}
                  placeholder="Nhập nhận xét chi tiết cho học sinh..."
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveSubmission(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveGrading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
              >
                Lưu điểm &amp; Trả bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ASSIGNMENT MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-blue-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editForm.id ? 'Chỉnh sửa bài tập' : 'Giao bài tập mới'}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 text-xs md:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã bài tập *</label>
                  <input
                    type="text"
                    value={editForm.code || ''}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lớp giao bài</label>
                  <select
                    value={editForm.classIds?.[0] || classes[0]?.id}
                    onChange={(e) => setEditForm({ ...editForm, classIds: [e.target.value] })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên bài tập *</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chủ đề kiến thức</label>
                <input
                  type="text"
                  value={editForm.topic || ''}
                  onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hạn nộp bài</label>
                  <input
                    type="date"
                    value={editForm.dueDate || ''}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng thái</label>
                  <select
                    value={editForm.status || 'Đang mở'}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="Đang mở">Đang mở</option>
                    <option value="Sắp hết hạn">Sắp hết hạn</option>
                    <option value="Đã hết hạn">Đã hết hạn</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hướng dẫn làm bài</label>
                <textarea
                  rows={2}
                  value={editForm.instructions || ''}
                  onChange={(e) => setEditForm({ ...editForm, instructions: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg"
              >
                Lưu bài tập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI ASSIGNMENT GENERATOR MODAL */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-violet-900 to-blue-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base md:text-lg">
                  Trợ lý AI Sinh Bài Tập Vật Lý Phân Hóa
                </h3>
              </div>
              <button
                onClick={() => setShowAIModal(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs md:text-sm">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khối lớp</label>
                  <select
                    value={aiGrade}
                    onChange={(e) => setAiGrade(Number(e.target.value) as GradeLevel)}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value={10}>Khối 10</option>
                    <option value={11}>Khối 11</option>
                    <option value={12}>Khối 12</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mức độ phân hóa</label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="Cơ bản (Cho học sinh cần củng cố)">Cơ bản (Củng cố)</option>
                    <option value="Phân hóa từ cơ bản đến nâng cao">Phân hóa (Cơ bản đến nâng cao)</option>
                    <option value="Nâng cao & Vận dụng thực tế">Nâng cao & Vận dụng cao</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số câu bài tập</label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chủ đề bài tập
                </label>
                <textarea
                  rows={2}
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleGenerateAI}
                  disabled={aiLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-700 to-blue-700 hover:from-violet-600 hover:to-blue-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  {aiLoading ? 'AI Đang sinh bài tập...' : 'Tạo bài tập ngay'}
                </button>
              </div>

              {/* Preview */}
              {aiPreview && (
                <div className="mt-4 p-4 rounded-xl border border-violet-200 bg-violet-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">
                      Bản thảo bài tập: {aiPreview.title}
                    </span>
                    <span className="text-xs bg-violet-100 text-violet-800 font-semibold px-2 py-0.5 rounded">
                      {(aiPreview.questions || []).length} câu hỏi
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-2 text-xs">
                    {(aiPreview.questions || []).map((q: any, i: number) => (
                      <div key={i} className="p-2.5 bg-white rounded border border-violet-100">
                        <p className="font-semibold text-violet-950">
                          Câu {i + 1} [{q.level}]: {q.content}
                        </p>
                        <p className="text-emerald-700 font-medium mt-0.5">
                          Đáp án &amp; Lời giải: {q.correctAnswer} - {q.explanation}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-violet-200">
                    <button
                      onClick={() => setAiPreview(null)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-white"
                    >
                      Bỏ qua
                    </button>
                    <button
                      onClick={handleApproveAIAssignment}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Phê duyệt &amp; Giao cho học sinh
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
