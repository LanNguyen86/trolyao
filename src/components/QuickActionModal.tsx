import React from 'react';
import {
  FileCheck2,
  BookOpenCheck,
  Presentation,
  CheckSquare,
  Award,
  Sparkles,
  GraduationCap,
  X
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  if (!isOpen) return null;

  const actions = [
    {
      title: 'Tạo đề thi mới',
      desc: 'Ngân hàng câu hỏi trắc nghiệm, tự luận và xuất file Word',
      icon: FileCheck2,
      color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      tab: 'exams' as NavTab
    },
    {
      title: 'Soạn giáo án 5512',
      desc: 'Kế hoạch bài dạy chuẩn Bộ GD&ĐT 4 hoạt động học tập',
      icon: BookOpenCheck,
      color: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
      tab: 'lessons' as NavTab
    },
    {
      title: 'Tạo slide bài giảng',
      desc: 'Dàn ý slide trình chiếu, hình ảnh minh họa và câu hỏi kiểm tra',
      icon: Presentation,
      color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
      tab: 'slides' as NavTab
    },
    {
      title: 'Giao bài tập về nhà',
      desc: 'Giao bài tập phân hóa cho các lớp và quản lý nộp bài',
      icon: CheckSquare,
      color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
      tab: 'assignments' as NavTab
    },
    {
      title: 'Nhập điểm học sinh',
      desc: 'Mở sổ điểm điện tử, tính điểm trung bình tự động',
      icon: Award,
      color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
      tab: 'gradebook' as NavTab
    },
    {
      title: 'Thêm lớp học mới',
      desc: 'Tạo lớp mới cho khối 10, 11, 12, phân công GV và sĩ số',
      icon: GraduationCap,
      color: 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100',
      tab: 'classes' as NavTab
    },
    {
      title: 'Hỏi Trợ lý AI Vật lý',
      desc: 'Giải bài tập mẫu, kiểm tra đơn vị SI, gợi ý thí nghiệm',
      icon: Sparkles,
      color: 'bg-gradient-to-r from-blue-900 to-indigo-900 text-amber-300 border-indigo-700 hover:from-blue-800 hover:to-indigo-800',
      tab: 'ai-assistant' as NavTab
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6 space-y-4 text-slate-800 my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">Thao tác nhanh</h3>
            <p className="text-xs text-slate-500">Chọn tác vụ Thầy/Cô muốn thực hiện ngay</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((act, idx) => {
            const Icon = act.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  onNavigate(act.tab);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${act.color}`}
              >
                <div className="p-2 rounded-lg bg-white/80 shadow-2xs shrink-0 mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs md:text-sm">{act.title}</h4>
                  <p className="text-[11px] opacity-80 mt-0.5 leading-snug">{act.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
