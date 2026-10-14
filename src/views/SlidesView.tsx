import React, { useState } from 'react';
import {
  Presentation,
  Plus,
  Search,
  Download,
  Trash2,
  Edit3,
  Eye,
  Sparkles,
  FileText,
  CheckCircle,
  FileDown,
  Layers,
  X,
  PlusCircle,
  Clock,
  HelpCircle,
  LayoutGrid,
  List,
  Tag
} from 'lucide-react';
import { SlideDeck, GradeLevel, SlideSlideItem } from '../types';
import { exportUtils } from '../utils/exportUtils';
import { geminiService } from '../services/geminiService';

interface SlidesViewProps {
  slides: SlideDeck[];
  onSaveSlide: (slide: SlideDeck) => void;
  onDeleteSlide: (id: string) => void;
  onLog: (action: string, module: string, detail: string) => void;
}

export const SlidesView: React.FC<SlidesViewProps> = ({
  slides,
  onSaveSlide,
  onDeleteSlide,
  onLog
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals
  const [selectedSlide, setSelectedSlide] = useState<SlideDeck | null>(null);
  const [isViewing, setIsViewing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // AI Generator state
  const [aiTitle, setAiTitle] = useState('Định luật I và II Nhiệt động lực học');
  const [aiGrade, setAiGrade] = useState<GradeLevel>(12);
  const [aiChapter, setAiChapter] = useState('Chương 1: Vật lý nhiệt');
  const [aiTopic, setAiTopic] = useState('Biến thiên nội năng, Nguyên lý động cơ nhiệt và máy lạnh');
  const [aiSlideCount, setAiSlideCount] = useState(10);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<any>(null);

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<SlideDeck>>({});

  const filteredSlides = slides.filter((s) => {
    const matchSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchGrade = gradeFilter === 'all' || s.grade.toString() === gradeFilter;
    return matchSearch && matchGrade;
  });

  const handleOpenAdd = () => {
    const newSlide: SlideDeck = {
      id: 'sld-' + Date.now(),
      code: `SLD-${Date.now().toString().slice(-4)}`,
      title: 'Bộ slide bài giảng mới',
      grade: 10,
      chapter: 'Chương 1',
      topic: 'Kiến thức bài học',
      description: 'Slide trình chiếu đa phương tiện',
      fileFormat: 'PPTX',
      fileSize: '5.2 MB',
      slideCount: 15,
      slides: [
        {
          slideNumber: 1,
          title: 'Tiêu đề bài học',
          bullets: ['Mục tiêu chính', 'Nội dung trọng tâm'],
          teacherNotes: 'Ghi chú cho giáo viên mở bài'
        }
      ],
      tags: ['Vật lý'],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setEditForm(newSlide);
    setIsEditing(true);
  };

  const handleOpenEdit = (deck: SlideDeck) => {
    setEditForm(JSON.parse(JSON.stringify(deck)));
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editForm.title || !editForm.code) {
      alert('Vui lòng nhập đầy đủ Mã và Tên bài giảng!');
      return;
    }
    const toSave: SlideDeck = {
      ...(editForm as SlideDeck),
      updatedAt: new Date().toISOString().split('T')[0]
    };
    onSaveSlide(toSave);
    onLog('Cập nhật slide', 'Slide bài giảng', `Lưu slide: ${toSave.title} (${toSave.code})`);
    setIsEditing(false);
  };

  const handleGenerateAI = async () => {
    setAiLoading(true);
    setAiPreview(null);
    try {
      const result = await geminiService.generateSlides({
        title: aiTitle,
        grade: aiGrade,
        chapter: aiChapter,
        topic: aiTopic,
        slideCount: aiSlideCount
      });
      setAiPreview(result);
    } catch (err: any) {
      alert(`Lỗi AI: ${err.message || 'Không thể tạo slide'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApproveAISlides = () => {
    if (!aiPreview) return;
    const newDeck: SlideDeck = {
      id: 'sld-ai-' + Date.now(),
      code: `SLD-${aiGrade}-AI-${Date.now().toString().slice(-4)}`,
      title: aiPreview.title || aiTitle,
      grade: aiGrade,
      chapter: aiPreview.chapter || aiChapter,
      topic: aiTopic,
      description: `Bộ slide do Trợ lý AI Gemini 3.8 Flash hỗ trợ thiết kế gồm ${aiPreview.slideCount || aiSlideCount} slide.`,
      fileFormat: 'PPTX',
      fileSize: '12.4 MB',
      slideCount: aiPreview.slideCount || (aiPreview.slides || []).length || 10,
      slides: (aiPreview.slides || []).map((s: any, idx: number) => ({
        slideNumber: s.slideNumber || idx + 1,
        title: s.title || `Slide ${idx + 1}`,
        bullets: s.bullets || [],
        teacherNotes: s.teacherNotes || '',
        diagramIdea: s.diagramIdea,
        interactiveQuestion: s.interactiveQuestion
      })),
      tags: ['AI Thiết kế', `Lớp ${aiGrade}`, aiTopic.split(' ')[0]],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    onSaveSlide(newDeck);
    onLog('Tạo slide AI', 'Slide bài giảng', `Soạn dàn ý slide: ${newDeck.title}`);
    setShowAIModal(false);
    setAiPreview(null);
    alert('Đã phê duyệt và lưu bộ slide AI thành công!');
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
              placeholder="Tìm theo tên bài giảng, chủ đề..."
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

          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
              title="Xem dạng lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
              title="Xem dạng danh sách"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAIModal(true)}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs md:text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            AI Tạo Dàn Ý Slide
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs md:text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Thêm Slide bài giảng
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSlides.map((deck) => (
            <div
              key={deck.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="h-28 bg-gradient-to-tr from-slate-900 via-blue-900 to-indigo-800 p-4 text-white flex flex-col justify-between relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 backdrop-blur font-bold font-mono">
                    {deck.code}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400 text-slate-900 font-bold">
                    {deck.fileFormat} • {deck.slideCount} slides
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-sky-300 font-semibold block">{deck.chapter}</span>
                  <span className="text-xs font-bold line-clamp-1">{deck.title}</span>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <p className="text-xs text-slate-600 line-clamp-2">{deck.description}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                    Khối {deck.grade}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    {deck.fileSize}
                  </span>
                  {deck.tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-50 text-slate-500 border border-slate-200">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">{deck.createdAt}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedSlide(deck);
                      setIsViewing(true);
                    }}
                    className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-white rounded transition-colors"
                    title="Xem chi tiết nội dung slide"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => exportUtils.exportSlideOutline(deck)}
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-white rounded transition-colors"
                    title="Tải dàn ý & Ghi chú thuyết trình"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(deck)}
                    className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-white rounded transition-colors"
                    title="Chỉnh sửa slide"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Bạn có chắc muốn xóa bộ slide "${deck.title}"?`)) {
                        onDeleteSlide(deck.id);
                        onLog('Xóa slide', 'Slide bài giảng', `Xóa slide: ${deck.code}`);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-colors"
                    title="Xóa slide"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Tên bài giảng</th>
                <th className="py-3 px-3">Khối</th>
                <th className="py-3 px-3">Chương</th>
                <th className="py-3 px-3 text-center">Định dạng</th>
                <th className="py-3 px-3 text-center">Số slide</th>
                <th className="py-3 px-3 text-center">Dung lượng</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSlides.map((deck) => (
                <tr key={deck.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-800">{deck.title}</p>
                    <span className="text-[11px] text-blue-700 font-mono font-semibold">{deck.code}</span>
                  </td>
                  <td className="py-3 px-3">Lớp {deck.grade}</td>
                  <td className="py-3 px-3 text-slate-600">{deck.chapter}</td>
                  <td className="py-3 px-3 text-center font-bold text-amber-700">{deck.fileFormat}</td>
                  <td className="py-3 px-3 text-center font-bold">{deck.slideCount}</td>
                  <td className="py-3 px-3 text-center text-slate-500">{deck.fileSize}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setSelectedSlide(deck);
                          setIsViewing(true);
                        }}
                        className="p-1.5 text-slate-600 hover:text-blue-700"
                        title="Xem slide"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => exportUtils.exportSlideOutline(deck)}
                        className="p-1.5 text-slate-600 hover:text-emerald-700"
                        title="Tải dàn ý"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(deck)}
                        className="p-1.5 text-slate-600 hover:text-amber-700"
                        title="Sửa"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Xóa bộ slide "${deck.title}"?`)) {
                            onDeleteSlide(deck.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                        title="Xóa"
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
        </div>
      )}

      {/* VIEW SLIDE DECK MODAL */}
      {isViewing && selectedSlide && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs px-2 py-0.5 bg-blue-600 rounded font-semibold font-mono">
                  {selectedSlide.code}
                </span>
                <h3 className="text-lg md:text-xl font-bold mt-1">{selectedSlide.title}</h3>
                <p className="text-xs text-slate-300">
                  Lớp {selectedSlide.grade} • {selectedSlide.chapter} • {selectedSlide.slideCount} slide • {selectedSlide.fileFormat} ({selectedSlide.fileSize})
                </p>
              </div>
              <button
                onClick={() => setIsViewing(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs md:text-sm">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-600">
                  <strong>Chủ đề:</strong> {selectedSlide.topic}
                </span>
                <button
                  onClick={() => exportUtils.exportSlideOutline(selectedSlide)}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Xuất Dàn Ý &amp; Ghi Chú Giảng Dạy (.txt)
                </button>
              </div>

              {/* Slide items list */}
              <div className="space-y-4">
                {selectedSlide.slides.map((s) => (
                  <div key={s.slideNumber} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-900 text-sm">
                        Slide {s.slideNumber}: {s.title}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <p className="font-semibold text-slate-700 mb-1">Nội dung trình chiếu:</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-600">
                        {s.bullets.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>

                    {s.diagramIdea && (
                      <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                        <strong>Gợi ý sơ đồ / Hình ảnh 3D:</strong> {s.diagramIdea}
                      </div>
                    )}

                    {s.interactiveQuestion && (
                      <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-200 text-purple-900">
                        <strong>Câu hỏi tương tác nhanh:</strong> {s.interactiveQuestion}
                      </div>
                    )}

                    <div className="p-2.5 bg-slate-100 rounded-lg text-slate-700">
                      <strong>Ghi chú giáo viên thuyết trình:</strong> {s.teacherNotes}
                    </div>
                  </div>
                ))}
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
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-blue-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editForm.id ? 'Chỉnh sửa bộ slide bài giảng' : 'Thêm slide mới'}
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
                  <label className="block font-semibold text-slate-700 mb-1">Mã slide *</label>
                  <input
                    type="text"
                    value={editForm.code || ''}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khối lớp</label>
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
                <label className="block font-semibold text-slate-700 mb-1">Tên bài giảng *</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chương</label>
                  <input
                    type="text"
                    value={editForm.chapter || ''}
                    onChange={(e) => setEditForm({ ...editForm, chapter: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chủ đề trọng tâm</label>
                  <input
                    type="text"
                    value={editForm.topic || ''}
                    onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Định dạng file</label>
                  <select
                    value={editForm.fileFormat || 'PPTX'}
                    onChange={(e) => setEditForm({ ...editForm, fileFormat: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="PPTX">PowerPoint (.pptx)</option>
                    <option value="PDF">PDF (.pdf)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số lượng slide</label>
                  <input
                    type="number"
                    value={editForm.slideCount || 10}
                    onChange={(e) => setEditForm({ ...editForm, slideCount: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả bài giảng</label>
                <textarea
                  rows={2}
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
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
                Lưu slide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI SLIDE OUTLINE GENERATOR MODAL */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-indigo-900 to-blue-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base md:text-lg">
                  Trợ lý AI Thiết Kế Dàn Ý Slide PowerPoint
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
                  <label className="block font-semibold text-slate-700 mb-1">Tên bài giảng</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Số slide</label>
                  <input
                    type="number"
                    min={5}
                    max={25}
                    value={aiSlideCount}
                    onChange={(e) => setAiSlideCount(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chủ đề trọng tâm &amp; Yêu cầu minh họa
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
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-700 to-blue-700 hover:from-indigo-600 hover:to-blue-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  {aiLoading ? 'AI Đang lên dàn ý slide...' : 'Tạo dàn ý slide ngay'}
                </button>
              </div>

              {/* Preview */}
              {aiPreview && (
                <div className="mt-4 p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">
                      Dàn ý bài giảng: {aiPreview.title}
                    </span>
                    <span className="text-xs bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded">
                      {(aiPreview.slides || []).length} slide
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-2 text-xs">
                    {(aiPreview.slides || []).map((s: any) => (
                      <div key={s.slideNumber} className="p-2.5 bg-white rounded border border-indigo-100">
                        <p className="font-semibold text-indigo-950">
                          Slide {s.slideNumber}: {s.title}
                        </p>
                        <p className="text-slate-600">Ý chính: {(s.bullets || []).join('; ')}</p>
                        {s.teacherNotes && (
                          <p className="text-amber-800 italic mt-0.5">Ghi chú: {s.teacherNotes}</p>
                        )}
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
                      onClick={handleApproveAISlides}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Phê duyệt &amp; Lưu vào Kho slide
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
