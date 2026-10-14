import React, { useState } from 'react';
import {
  BookOpenCheck,
  Plus,
  Search,
  Download,
  Copy,
  Trash2,
  Edit3,
  Eye,
  Sparkles,
  BookOpen,
  CheckCircle,
  FileDown,
  Layers,
  X,
  PlusCircle,
  Clock,
  Compass
} from 'lucide-react';
import { LessonPlan, GradeLevel, LessonActivity } from '../types';
import { exportUtils } from '../utils/exportUtils';
import { geminiService } from '../services/geminiService';

interface LessonsViewProps {
  lessons: LessonPlan[];
  onSaveLesson: (lesson: LessonPlan) => void;
  onDeleteLesson: (id: string) => void;
  onLog: (action: string, module: string, detail: string) => void;
}

export const LessonsView: React.FC<LessonsViewProps> = ({
  lessons,
  onSaveLesson,
  onDeleteLesson,
  onLog
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [textbookFilter, setTextbookFilter] = useState<string>('all');

  // Modals
  const [selectedLesson, setSelectedLesson] = useState<LessonPlan | null>(null);
  const [isViewing, setIsViewing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // AI Generator state
  const [aiTitle, setAiTitle] = useState('Định luật vạn vật hấp dẫn và Trọng lực');
  const [aiGrade, setAiGrade] = useState<GradeLevel>(10);
  const [aiChapter, setAiChapter] = useState('Chương 3: Động lực học');
  const [aiTextbook, setAiTextbook] = useState<'Kết nối tri thức' | 'Cánh diều' | 'Chân trời sáng tạo'>('Kết nối tri thức');
  const [aiDuration, setAiDuration] = useState(2);
  const [aiGoals, setAiGoals] = useState('Tập trung vào thí nghiệm ảo đo lực hấp dẫn và hiện tượng thủy triều');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<any>(null);

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<LessonPlan>>({});

  // Filter lessons
  const filteredLessons = lessons.filter((lp) => {
    const matchSearch =
      lp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lp.chapter.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGrade = gradeFilter === 'all' || lp.grade.toString() === gradeFilter;
    const matchTextbook = textbookFilter === 'all' || lp.textbook === textbookFilter;
    return matchSearch && matchGrade && matchTextbook;
  });

  const handleOpenAdd = () => {
    const newLp: LessonPlan = {
      id: 'lp-' + Date.now(),
      code: `GA-${Date.now().toString().slice(-4)}`,
      title: 'Kế hoạch bài dạy mới',
      grade: 10,
      chapter: 'Chương 1',
      textbook: 'Kết nối tri thức',
      durationPeriods: 2,
      semester: 1,
      objectives: {
        knowledge: ['Nêu được khái niệm chính...'],
        competencies: ['Vận dụng giải bài tập thực tiễn...'],
        qualities: ['Cẩn thận, chính xác trong tính toán...']
      },
      keyKnowledge: ['Kiến thức trọng tâm bài học...'],
      teachingTools: ['Máy chiếu, phiếu học tập số 1'],
      activities: [],
      assessmentMethod: 'Đánh giá qua phiếu học tập và câu hỏi trắc nghiệm',
      references: ['SGK Vật lý 10'],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setEditForm(newLp);
    setIsEditing(true);
  };

  const handleOpenEdit = (lp: LessonPlan) => {
    setEditForm(JSON.parse(JSON.stringify(lp)));
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editForm.title || !editForm.code) {
      alert('Vui lòng nhập đầy đủ Mã và Tên bài học!');
      return;
    }
    const toSave: LessonPlan = {
      ...(editForm as LessonPlan),
      updatedAt: new Date().toISOString().split('T')[0]
    };
    onSaveLesson(toSave);
    onLog('Cập nhật giáo án', 'Giáo án', `Lưu giáo án: ${toSave.title} (${toSave.code})`);
    setIsEditing(false);
  };

  const handleDuplicate = (lp: LessonPlan) => {
    const duplicated: LessonPlan = {
      ...JSON.parse(JSON.stringify(lp)),
      id: 'lp-' + Date.now(),
      code: `${lp.code}-BAN-SAO`,
      title: `${lp.title} (Bản sao tái sử dụng)`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    onSaveLesson(duplicated);
    onLog('Nhân bản giáo án', 'Giáo án', `Sao chép giáo án mã: ${lp.code}`);
  };

  const handleGenerateAI = async () => {
    setAiLoading(true);
    setAiPreview(null);
    try {
      const result = await geminiService.generateLessonPlan({
        title: aiTitle,
        grade: aiGrade,
        chapter: aiChapter,
        textbook: aiTextbook,
        durationPeriods: aiDuration,
        customGoals: aiGoals
      });
      setAiPreview(result);
    } catch (err: any) {
      alert(`Lỗi AI: ${err.message || 'Không thể tạo giáo án'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApproveAILesson = () => {
    if (!aiPreview) return;
    const newLp: LessonPlan = {
      id: 'lp-ai-' + Date.now(),
      code: `GA-${aiGrade}-AI-${Date.now().toString().slice(-4)}`,
      title: aiPreview.title || aiTitle,
      grade: aiGrade,
      chapter: aiPreview.chapter || aiChapter,
      textbook: aiTextbook,
      durationPeriods: aiPreview.durationPeriods || aiDuration,
      semester: 1,
      objectives: aiPreview.objectives || {
        knowledge: ['Nắm vững kiến thức trọng tâm'],
        competencies: ['Phát triển năng lực vật lý'],
        qualities: ['Chăm chỉ, trách nhiệm']
      },
      keyKnowledge: aiPreview.keyKnowledge || [],
      teachingTools: aiPreview.teachingTools || ['Phiếu học tập, máy chiếu'],
      activities: (aiPreview.activities || []).map((a: any, i: number) => ({
        id: a.id || `act-ai-${i + 1}`,
        name: a.name || `Hoạt động ${i + 1}`,
        durationMinutes: a.durationMinutes || 10,
        goal: a.goal || '',
        content: a.content || '',
        teacherAction: a.teacherAction || '',
        studentAction: a.studentAction || '',
        output: a.output || ''
      })),
      assessmentMethod: aiPreview.assessmentMethod || 'Đánh giá qua phiếu học tập',
      references: aiPreview.references || [`SGK Vật lý ${aiGrade}`],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    onSaveLesson(newLp);
    onLog('Tạo giáo án AI', 'Giáo án', `Soạn giáo án AI: ${newLp.title}`);
    setShowAIModal(false);
    setAiPreview(null);
    alert('Đã phê duyệt và lưu giáo án AI thành công!');
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
              placeholder="Tìm theo tên bài học, mã giáo án..."
              className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

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

          <select
            value={textbookFilter}
            onChange={(e) => setTextbookFilter(e.target.value)}
            className="text-xs md:text-sm px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="all">Tất cả bộ SGK</option>
            <option value="Kết nối tri thức">Kết nối tri thức</option>
            <option value="Cánh diều">Cánh diều</option>
            <option value="Chân trời sáng tạo">Chân trời sáng tạo</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAIModal(true)}
            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs md:text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            AI Soạn giáo án 5512
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs md:text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tạo giáo án mới
          </button>
        </div>
      </div>

      {/* Lesson Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLessons.map((lp) => (
          <div
            key={lp.id}
            className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
          >
            <div className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono">
                  {lp.code}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Lớp {lp.grade} • {lp.durationPeriods} tiết
                </span>
              </div>

              <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors line-clamp-2">
                {lp.title}
              </h4>

              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">{lp.chapter}</span>
              </p>

              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-medium border border-teal-200">
                  {lp.textbook}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                  {lp.activities.length} hoạt động
                </span>
              </div>

              {lp.objectives.knowledge.length > 0 && (
                <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                  &ldquo;{lp.objectives.knowledge[0]}&rdquo;
                </p>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400">Cập nhật: {lp.updatedAt}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setSelectedLesson(lp);
                    setIsViewing(true);
                  }}
                  className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-white rounded transition-colors"
                  title="Xem giáo án chi tiết"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => exportUtils.exportLessonPlanToDoc(lp)}
                  className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-white rounded transition-colors"
                  title="Xuất giáo án ra Word (Công văn 5512)"
                >
                  <FileDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDuplicate(lp)}
                  className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-white rounded transition-colors"
                  title="Sao chép giáo án"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenEdit(lp)}
                  className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-white rounded transition-colors"
                  title="Chỉnh sửa giáo án"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Bạn có chắc muốn xóa giáo án "${lp.title}"?`)) {
                      onDeleteLesson(lp.id);
                      onLog('Xóa giáo án', 'Giáo án', `Xóa giáo án: ${lp.code}`);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-colors"
                  title="Xóa giáo án"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* VIEW LESSON PLAN MODAL */}
      {isViewing && selectedLesson && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 bg-teal-950 text-white flex items-center justify-between">
              <div>
                <span className="text-xs px-2 py-0.5 bg-teal-700 rounded font-semibold font-mono">
                  {selectedLesson.code}
                </span>
                <h3 className="text-lg md:text-xl font-bold mt-1">{selectedLesson.title}</h3>
                <p className="text-xs text-teal-300">
                  Lớp {selectedLesson.grade} • Bộ sách {selectedLesson.textbook} • Thời lượng: {selectedLesson.durationPeriods} tiết
                </p>
              </div>
              <button
                onClick={() => setIsViewing(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs md:text-sm">
              <div className="flex justify-end gap-2 pb-2 border-b border-slate-100">
                <button
                  onClick={() => exportUtils.exportLessonPlanToDoc(selectedLesson)}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Xuất Kế hoạch bài dạy Word (CV 5512)
                </button>
              </div>

              {/* Objectives */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 text-sm uppercase text-blue-900">
                  I. Mục tiêu bài học (GDPT 2018)
                </h4>
                <div>
                  <p className="font-semibold text-slate-700">1. Kiến thức:</p>
                  <ul className="list-disc pl-5 text-slate-600 space-y-0.5">
                    {selectedLesson.objectives.knowledge.map((k, i) => (
                      <li key={i}>{k}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">2. Năng lực:</p>
                  <ul className="list-disc pl-5 text-slate-600 space-y-0.5">
                    {selectedLesson.objectives.competencies.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">3. Phẩm chất:</p>
                  <ul className="list-disc pl-5 text-slate-600 space-y-0.5">
                    {selectedLesson.objectives.qualities.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Teaching Tools */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 text-sm uppercase text-blue-900 mb-2">
                  II. Thiết bị dạy học và học liệu
                </h4>
                <ul className="list-disc pl-5 text-slate-600 space-y-0.5">
                  {selectedLesson.teachingTools.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>

              {/* Activities */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm uppercase text-blue-900 mb-3">
                  III. Tiến trình tổ chức hoạt động học (CV 5512)
                </h4>
                <div className="space-y-3">
                  {selectedLesson.activities.map((act) => (
                    <div key={act.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <span className="font-bold text-teal-800">{act.name}</span>
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-600">
                          {act.durationMinutes} phút
                        </span>
                      </div>
                      <p><strong>a) Mục tiêu:</strong> <span className="text-slate-600">{act.goal}</span></p>
                      <p><strong>b) Nội dung:</strong> <span className="text-slate-600">{act.content}</span></p>
                      <p><strong>c) Tổ chức thực hiện:</strong></p>
                      <div className="pl-4 border-l-2 border-teal-500 space-y-1 text-slate-600">
                        <p>• <em>Giáo viên chuyển giao nhiệm vụ:</em> {act.teacherAction}</p>
                        <p>• <em>Học sinh thực hiện nhiệm vụ:</em> {act.studentAction}</p>
                      </div>
                      <p><strong>d) Sản phẩm học tập:</strong> <span className="text-emerald-700 font-medium">{act.output}</span></p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assessment */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 text-sm uppercase text-blue-900 mb-1">
                  IV. Đánh giá và hướng dẫn về nhà
                </h4>
                <p className="text-slate-600">{selectedLesson.assessmentMethod}</p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsViewing(false)}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-blue-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editForm.id ? 'Chỉnh sửa kế hoạch bài dạy' : 'Tạo giáo án mới'}
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
                  <label className="block font-semibold text-slate-700 mb-1">Mã giáo án *</label>
                  <input
                    type="text"
                    value={editForm.code || ''}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khối lớp *</label>
                  <select
                    value={editForm.grade || 10}
                    onChange={(e) => setEditForm({ ...editForm, grade: Number(e.target.value) as GradeLevel })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value={10}>Khối 10</option>
                    <option value={11}>Khối 11</option>
                    <option value={12}>Khối 12</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên bài học *</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chương / Chủ đề</label>
                  <input
                    type="text"
                    value={editForm.chapter || ''}
                    onChange={(e) => setEditForm({ ...editForm, chapter: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bộ sách giáo khoa</label>
                  <select
                    value={editForm.textbook || 'Kết nối tri thức'}
                    onChange={(e) => setEditForm({ ...editForm, textbook: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="Kết nối tri thức">Kết nối tri thức</option>
                    <option value="Cánh diều">Cánh diều</option>
                    <option value="Chân trời sáng tạo">Chân trời sáng tạo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thời lượng (Số tiết học)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={editForm.durationPeriods || 2}
                  onChange={(e) => setEditForm({ ...editForm, durationPeriods: Number(e.target.value) })}
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
                Lưu giáo án
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI LESSON PLAN GENERATOR MODAL */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-teal-900 to-blue-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base md:text-lg">
                  Trợ lý AI Soạn Kế Hoạch Bài Dạy (CV 5512)
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Tên bài học</label>
                  <input
                    type="text"
                    value={aiTitle}
                    onChange={(e) => setAiTitle(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
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
                  <label className="block font-semibold text-slate-700 mb-1">Thời lượng</label>
                  <select
                    value={aiDuration}
                    onChange={(e) => setAiDuration(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value={1}>1 tiết (45p)</option>
                    <option value={2}>2 tiết (90p)</option>
                    <option value={3}>3 tiết (135p)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bộ SGK</label>
                  <select
                    value={aiTextbook}
                    onChange={(e) => setAiTextbook(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="Kết nối tri thức">Kết nối tri thức</option>
                    <option value="Cánh diều">Cánh diều</option>
                    <option value="Chân trời sáng tạo">Chân trời sáng tạo</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chương</label>
                  <input
                    type="text"
                    value={aiChapter}
                    onChange={(e) => setAiChapter(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Yêu cầu sư phạm bổ sung (Tình huống thực tế, thí nghiệm, hoạt động nhóm...)
                </label>
                <textarea
                  rows={2}
                  value={aiGoals}
                  onChange={(e) => setAiGoals(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleGenerateAI}
                  disabled={aiLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-700 to-blue-700 hover:from-teal-600 hover:to-blue-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  {aiLoading ? 'AI Đang soạn kế hoạch 5512...' : 'Soạn Kế hoạch bài dạy ngay'}
                </button>
              </div>

              {/* Preview */}
              {aiPreview && (
                <div className="mt-4 p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">
                      Bản thảo giáo án AI: {aiPreview.title}
                    </span>
                    <span className="text-xs bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded">
                      {(aiPreview.activities || []).length} hoạt động học
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-2 text-xs">
                    <p><strong>Mục tiêu kiến thức:</strong> {(aiPreview.objectives?.knowledge || []).join('; ')}</p>
                    <p><strong>Thiết bị:</strong> {(aiPreview.teachingTools || []).join(', ')}</p>
                    {(aiPreview.activities || []).map((a: any, i: number) => (
                      <div key={i} className="p-2 bg-white rounded border border-teal-100">
                        <p className="font-semibold text-teal-900">{a.name} ({a.durationMinutes}p)</p>
                        <p className="text-slate-600">Nội dung: {a.content}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-teal-200">
                    <button
                      onClick={() => setAiPreview(null)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-white"
                    >
                      Bỏ qua
                    </button>
                    <button
                      onClick={handleApproveAILesson}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Phê duyệt &amp; Lưu vào Kho giáo án
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
