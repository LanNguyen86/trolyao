import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  FileCheck2,
  Download,
  Copy,
  Trash2,
  Edit3,
  Shuffle,
  Eye,
  Sparkles,
  BookOpen,
  CheckCircle,
  FileText,
  Clock,
  Layers,
  HelpCircle,
  ChevronDown,
  X,
  FileDown
} from 'lucide-react';
import { Exam, Question, GradeLevel, CognitiveLevel, QuestionType, ExamType } from '../types';
import { exportUtils } from '../utils/exportUtils';
import { geminiService } from '../services/geminiService';

interface ExamsViewProps {
  exams: Exam[];
  onSaveExam: (exam: Exam) => void;
  onDeleteExam: (id: string) => void;
  onLog: (action: string, module: string, detail: string) => void;
}

export const ExamsView: React.FC<ExamsViewProps> = ({
  exams,
  onSaveExam,
  onDeleteExam,
  onLog
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showShuffleModal, setShowShuffleModal] = useState(false);

  // AI Generator state
  const [aiGrade, setAiGrade] = useState<GradeLevel>(10);
  const [aiTopic, setAiTopic] = useState('Động học chất điểm - Chuyển động biến đổi đều và rơi tự do');
  const [aiExamType, setAiExamType] = useState('Giữa kỳ');
  const [aiCount, setAiCount] = useState(10);
  const [aiEssayCount, setAiEssayCount] = useState(2);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<any>(null);

  // Form edit state
  const [editForm, setEditForm] = useState<Partial<Exam>>({});

  // Filter logic
  const filteredExams = exams.filter((ex) => {
    const matchSearch =
      ex.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGrade = gradeFilter === 'all' || ex.grade.toString() === gradeFilter;
    const matchType = typeFilter === 'all' || ex.type === typeFilter;
    const matchStatus = statusFilter === 'all' || ex.status === statusFilter;
    return matchSearch && matchGrade && matchType && matchStatus;
  });

  // Handle open add / edit
  const handleOpenAdd = () => {
    const newExam: Exam = {
      id: 'ex-' + Date.now(),
      code: `DE-${Date.now().toString().slice(-4)}`,
      title: 'Đề kiểm tra Vật lý mới',
      grade: 10,
      semester: 1,
      topic: 'Động học chất điểm',
      type: 'Thường xuyên',
      durationMinutes: 45,
      totalPoints: 10,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Bản nháp',
      questions: []
    };
    setEditForm(newExam);
    setIsEditing(true);
  };

  const handleOpenEdit = (exam: Exam) => {
    setEditForm(JSON.parse(JSON.stringify(exam)));
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editForm.title || !editForm.code) {
      alert('Vui lòng nhập đầy đủ Mã đề và Tên đề thi!');
      return;
    }
    onSaveExam(editForm as Exam);
    onLog('Cập nhật đề thi', 'Đề thi', `Lưu đề: ${editForm.title} (${editForm.code})`);
    setIsEditing(false);
  };

  // Duplicate exam
  const handleDuplicate = (exam: Exam) => {
    const duplicated: Exam = {
      ...JSON.parse(JSON.stringify(exam)),
      id: 'ex-' + Date.now(),
      code: `${exam.code}-COPY`,
      title: `${exam.title} (Bản sao)`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Bản nháp'
    };
    onSaveExam(duplicated);
    onLog('Nhân bản đề thi', 'Đề thi', `Nhân bản từ mã đề: ${exam.code}`);
  };

  // Shuffle questions & generate test variant codes
  const handleShuffle = (exam: Exam) => {
    const shuffled = [...exam.questions].sort(() => Math.random() - 0.5);
    const variantCode = `${exam.code.split('-V')[0]}-V${Math.floor(100 + Math.random() * 900)}`;
    const newVariant: Exam = {
      ...JSON.parse(JSON.stringify(exam)),
      id: 'ex-' + Date.now(),
      code: variantCode,
      title: `${exam.title} [Mã đề ${variantCode}]`,
      questions: shuffled,
      createdAt: new Date().toISOString().split('T')[0],
      notes: `Được tạo tự động bằng thuật toán xáo trộn câu hỏi từ đề gốc ${exam.code}`
    };
    onSaveExam(newVariant);
    onLog('Trộn đề thi', 'Đề thi', `Sinh mã đề hoán vị: ${variantCode}`);
    alert(`Đã trộn và tạo thành công mã đề mới: ${variantCode}!`);
  };

  // Trigger AI generation
  const handleGenerateAI = async () => {
    setAiLoading(true);
    setAiPreview(null);
    try {
      const result = await geminiService.generateExam({
        grade: aiGrade,
        topic: aiTopic,
        examType: aiExamType,
        questionCount: aiCount,
        essayCount: aiEssayCount
      });
      setAiPreview(result);
    } catch (err: any) {
      alert(`Lỗi AI: ${err.message || 'Không thể tạo đề thi'}`);
    } finally {
      setAiLoading(false);
    }
  };

  // Approve AI generated exam
  const handleApproveAIExam = () => {
    if (!aiPreview) return;
    const newExam: Exam = {
      id: 'ex-ai-' + Date.now(),
      code: `DE-${aiGrade}-AI-${Date.now().toString().slice(-4)}`,
      title: aiPreview.examTitle || `Đề kiểm tra ${aiTopic}`,
      grade: aiGrade,
      semester: 1,
      topic: aiTopic,
      type: aiExamType as ExamType,
      durationMinutes: aiPreview.durationMinutes || 45,
      totalPoints: 10,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Đã hoàn thiện',
      notes: 'Được biên soạn bởi Trợ lý AI Gemini 3.8 Flash và được giáo viên kiểm duyệt.',
      questions: (aiPreview.questions || []).map((q: any, idx: number) => ({
        id: `q-ai-${idx + 1}`,
        code: q.code || `Q${idx + 1}`,
        content: q.content,
        type: q.type || 'multiple_choice',
        level: q.level || 'Thông hiểu',
        options: q.options || [],
        correctAnswer: q.correctAnswer || 'A',
        explanation: q.explanation || '',
        points: q.points || 0.5,
        topic: aiTopic
      }))
    };

    onSaveExam(newExam);
    onLog('Tạo đề thi AI', 'Đề thi', `Tạo và phê duyệt đề thi AI: ${newExam.title}`);
    setShowAIModal(false);
    setAiPreview(null);
    alert('Đã phê duyệt và lưu đề thi AI vào ngân hàng đề thi thành công!');
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Actions Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, mã đề, chủ đề..."
              className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Grade filter */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="text-xs md:text-sm px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="all">Tất cả khối lớp</option>
            <option value="10">Khối 10</option>
            <option value="11">Khối 11</option>
            <option value="12">Khối 12</option>
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs md:text-sm px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="all">Tất cả loại đề</option>
            <option value="Thường xuyên">Thường xuyên (15p)</option>
            <option value="Giữa kỳ">Giữa kỳ</option>
            <option value="Cuối kỳ">Cuối kỳ</option>
            <option value="Ôn tập">Ôn tập</option>
            <option value="Thi thử">Thi thử</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs md:text-sm px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Đã hoàn thiện">Đã hoàn thiện</option>
            <option value="Đã sử dụng">Đã sử dụng</option>
            <option value="Bản nháp">Bản nháp</option>
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAIModal(true)}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs md:text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            AI Soạn đề tự động
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs md:text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tạo đề thi mới
          </button>
        </div>
      </div>

      {/* Exam List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Mã &amp; Tên đề thi</th>
                <th className="py-3 px-3">Khối</th>
                <th className="py-3 px-3">Loại đề</th>
                <th className="py-3 px-3">Chủ đề kiến thức</th>
                <th className="py-3 px-3 text-center">Thời gian</th>
                <th className="py-3 px-3 text-center">Số câu</th>
                <th className="py-3 px-3">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExams.map((exam) => (
                <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-bold text-slate-800">{exam.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.2 rounded">
                          {exam.code}
                        </span>
                        <span className="text-[11px] text-slate-400">{exam.createdAt}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      Lớp {exam.grade}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs font-medium text-slate-700">{exam.type}</span>
                  </td>
                  <td className="py-3 px-3 max-w-xs truncate text-slate-600" title={exam.topic}>
                    {exam.topic}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-700 font-medium">
                    {exam.durationMinutes} phút
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                      {exam.questions.length}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        exam.status === 'Đã hoàn thiện'
                          ? 'bg-emerald-50 text-emerald-700'
                          : exam.status === 'Đã sử dụng'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {exam.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View details */}
                      <button
                        onClick={() => {
                          setSelectedExam(exam);
                          setIsViewing(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Xem chi tiết đề thi và câu hỏi"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Shuffle questions */}
                      <button
                        onClick={() => handleShuffle(exam)}
                        className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Trộn câu hỏi và sinh mã đề hoán vị"
                      >
                        <Shuffle className="w-4 h-4" />
                      </button>

                      {/* Export Word */}
                      <button
                        onClick={() => exportUtils.exportExamToDoc(exam, false)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Xuất đề thi ra Word (DOCX)"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>

                      {/* Export Answer key */}
                      <button
                        onClick={() => exportUtils.exportAnswerKeyDoc(exam)}
                        className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Xuất riêng tài liệu Đáp án & Lời giải"
                      >
                        <FileCheck2 className="w-4 h-4" />
                      </button>

                      {/* Duplicate */}
                      <button
                        onClick={() => handleDuplicate(exam)}
                        className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Nhân bản đề thi"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEdit(exam)}
                        className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Chỉnh sửa đề thi"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc chắn muốn xóa đề thi "${exam.title}"?`)) {
                            onDeleteExam(exam.id);
                            onLog('Xóa đề thi', 'Đề thi', `Xóa mã đề: ${exam.code}`);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa đề thi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredExams.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <HelpCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-sm">Không tìm thấy đề thi phù hợp</p>
            <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc tạo đề thi mới</p>
          </div>
        )}
      </div>

      {/* VIEW EXAM DETAILS MODAL */}
      {isViewing && selectedExam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 md:p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs px-2 py-0.5 bg-blue-600 rounded font-semibold">
                  Mã đề: {selectedExam.code}
                </span>
                <h3 className="text-lg md:text-xl font-bold mt-1">{selectedExam.title}</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Vật lý {selectedExam.grade} • {selectedExam.type} • {selectedExam.durationMinutes} phút • {selectedExam.questions.length} câu hỏi
                </p>
              </div>
              <button
                onClick={() => setIsViewing(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex flex-wrap gap-2 justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-700">
                  Chủ đề: <span className="text-blue-700">{selectedExam.topic}</span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportUtils.exportExamToDoc(selectedExam, false)}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Xuất Đề (DOCX)
                  </button>
                  <button
                    onClick={() => exportUtils.exportAnswerKeyDoc(selectedExam)}
                    className="px-2.5 py-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" /> Xuất Đáp Án Riêng
                  </button>
                </div>
              </div>

              {selectedExam.questions.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">
                      Câu {idx + 1} ({q.points} điểm):
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        q.level === 'Nhận biết'
                          ? 'bg-emerald-100 text-emerald-800'
                          : q.level === 'Thông hiểu'
                          ? 'bg-sky-100 text-sky-800'
                          : q.level === 'Vận dụng'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {q.level}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{q.content}</p>

                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`text-xs p-2 rounded-lg border ${
                            opt.startsWith(q.correctAnswer) || opt.includes(q.correctAnswer)
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs mt-2">
                    <p className="font-bold text-blue-900">
                      Đáp án chính xác: <span className="text-emerald-700">{q.correctAnswer}</span>
                    </p>
                    <p className="text-slate-600 mt-1">
                      <strong>Lời giải chi tiết:</strong> {q.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsViewing(false)}
                className="px-4 py-2 bg-slate-700 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT EXAM MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 md:p-5 bg-blue-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base md:text-lg">
                {editForm.id ? 'Chỉnh sửa thông tin đề thi' : 'Tạo đề thi mới'}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-blue-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs md:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã đề thi *</label>
                  <input
                    type="text"
                    value={editForm.code || ''}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khối lớp *</label>
                  <select
                    value={editForm.grade || 10}
                    onChange={(e) => setEditForm({ ...editForm, grade: Number(e.target.value) as GradeLevel })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-blue-600 outline-none"
                  >
                    <option value={10}>Khối 10</option>
                    <option value={11}>Khối 11</option>
                    <option value={12}>Khối 12</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên đề thi *</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chủ đề kiến thức</label>
                <input
                  type="text"
                  value={editForm.topic || ''}
                  onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:border-blue-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại đề</label>
                  <select
                    value={editForm.type || 'Thường xuyên'}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value as ExamType })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-blue-600 outline-none"
                  >
                    <option value="Thường xuyên">Thường xuyên</option>
                    <option value="Giữa kỳ">Giữa kỳ</option>
                    <option value="Cuối kỳ">Cuối kỳ</option>
                    <option value="Ôn tập">Ôn tập</option>
                    <option value="Thi thử">Thi thử</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thời gian (phút)</label>
                  <input
                    type="number"
                    value={editForm.durationMinutes || 45}
                    onChange={(e) => setEditForm({ ...editForm, durationMinutes: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng thái</label>
                  <select
                    value={editForm.status || 'Bản nháp'}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-blue-600 outline-none"
                  >
                    <option value="Bản nháp">Bản nháp</option>
                    <option value="Đã hoàn thiện">Đã hoàn thiện</option>
                    <option value="Đã sử dụng">Đã sử dụng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú sư phạm</label>
                <textarea
                  rows={2}
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:border-blue-600 outline-none"
                  placeholder="Ghi chú ma trận đề, lưu ý học sinh..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 font-semibold"
              >
                Lưu đề thi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI EXAM GENERATOR MODAL */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 md:p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base md:text-lg">
                  Trợ lý AI Biên Soạn Đề Thi Vật Lý THPT
                </h3>
              </div>
              <button
                onClick={() => setShowAIModal(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs md:text-sm">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Cơ chế bảo đảm tính chính xác:</strong> AI sẽ tạo bản nháp đề thi gồm câu hỏi, đáp án và lời giải chi tiết. Thầy/Cô được xem trước, chỉnh sửa câu chữ và phê duyệt trước khi lưu vào ngân hàng đề.
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khối lớp</label>
                  <select
                    value={aiGrade}
                    onChange={(e) => setAiGrade(Number(e.target.value) as GradeLevel)}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600"
                  >
                    <option value={10}>Khối 10 (Động học, Năng lượng)</option>
                    <option value={11}>Khối 11 (Dao động, Sóng, Điện)</option>
                    <option value={12}>Khối 12 (Nhiệt, Khí, Hạt nhân)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại đề</label>
                  <select
                    value={aiExamType}
                    onChange={(e) => setAiExamType(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600"
                  >
                    <option value="Thường xuyên">Kiểm tra 15 phút</option>
                    <option value="Giữa kỳ">Kiểm tra Giữa kỳ (45p)</option>
                    <option value="Cuối kỳ">Kiểm tra Cuối kỳ</option>
                    <option value="Ôn tập">Ôn tập chuyên đề</option>
                    <option value="Thi thử">Thi thử Tốt nghiệp THPT</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số câu trắc nghiệm</label>
                  <input
                    type="number"
                    min={4}
                    max={40}
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chủ đề kiến thức &amp; Yêu cầu cụ thể
                </label>
                <textarea
                  rows={2}
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Ví dụ: Tạo đề kiểm tra Vật lý lớp 10 gồm 10 câu trắc nghiệm và 2 câu tự luận về động học, có đáp án và lời giải, phân bổ từ nhận biết đến vận dụng cao..."
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleGenerateAI}
                  disabled={aiLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  {aiLoading ? 'AI Đang sinh câu hỏi...' : 'Tạo bản nháp đề thi ngay'}
                </button>
              </div>

              {/* AI Result Preview */}
              {aiPreview && (
                <div className="mt-4 p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">
                      Bản nháp đề do AI tạo: {aiPreview.examTitle}
                    </span>
                    <span className="text-xs bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded">
                      {(aiPreview.questions || []).length} câu hỏi
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-indigo-100 space-y-2 pr-1">
                    {(aiPreview.questions || []).map((q: any, idx: number) => (
                      <div key={idx} className="pt-2 text-xs">
                        <p className="font-semibold text-slate-800">
                          Câu {idx + 1} [{q.level}]: {q.content}
                        </p>
                        {q.options && q.options.length > 0 && (
                          <p className="text-slate-600 italic mt-0.5">Lựa chọn: {q.options.join(' | ')}</p>
                        )}
                        <p className="text-emerald-700 font-medium mt-0.5">
                          Đáp án: {q.correctAnswer} - {q.explanation}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-indigo-200">
                    <button
                      onClick={() => setAiPreview(null)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-white"
                    >
                      Bỏ qua
                    </button>
                    <button
                      onClick={handleApproveAIExam}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Phê duyệt &amp; Lưu vào Ngân hàng đề
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
