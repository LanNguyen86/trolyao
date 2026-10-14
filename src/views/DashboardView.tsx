import React from 'react';
import {
  GraduationCap,
  Users,
  FileCheck2,
  BookOpenCheck,
  Presentation,
  CheckSquare,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  PlusCircle,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Classroom,
  Student,
  Exam,
  LessonPlan,
  SlideDeck,
  Assignment,
  StudentGrade,
  AuditLog
} from '../types';
import { NavTab } from '../components/Sidebar';

interface DashboardViewProps {
  classes: Classroom[];
  students: Student[];
  exams: Exam[];
  lessons: LessonPlan[];
  slides: SlideDeck[];
  assignments: Assignment[];
  grades: StudentGrade[];
  logs: AuditLog[];
  onNavigate: (tab: NavTab) => void;
  onOpenQuickAction: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  classes,
  students,
  exams,
  lessons,
  slides,
  assignments,
  grades,
  logs,
  onNavigate,
  onOpenQuickAction
}) => {
  // Compute overall average
  const validGrades = grades.filter((g) => typeof g.averageScore === 'number');
  const overallAvg =
    validGrades.length > 0
      ? (validGrades.reduce((acc, g) => acc + (g.averageScore || 0), 0) / validGrades.length).toFixed(1)
      : '0.0';

  // Compute grade distribution
  let below5 = 0;
  let from5to65 = 0;
  let from65to8 = 0;
  let from8plus = 0;

  validGrades.forEach((g) => {
    const score = g.averageScore || 0;
    if (score < 5.0) below5++;
    else if (score < 6.5) from5to65++;
    else if (score < 8.0) from65to8++;
    else from8plus++;
  });

  const gradeDistData = [
    { name: '< 5 (Chưa đạt)', count: below5, color: '#ef4444' },
    { name: '5.0 - 6.4 (Đạt)', count: from5to65, color: '#f59e0b' },
    { name: '6.5 - 7.9 (Khá)', count: from65to8, color: '#3b82f6' },
    { name: '≥ 8.0 (Giỏi/XS)', count: from8plus, color: '#10b981' }
  ];

  // Compute average by class
  const classAvgData = classes.map((c) => {
    const classGrades = grades.filter((g) => g.classId === c.id && typeof g.averageScore === 'number');
    const avg =
      classGrades.length > 0
        ? Number((classGrades.reduce((sum, g) => sum + (g.averageScore || 0), 0) / classGrades.length).toFixed(1))
        : 0;
    return {
      className: c.code,
      name: c.name,
      diemTB: avg
    };
  });

  // Material distribution
  const materialData = [
    { name: 'Đề thi', value: exams.length, color: '#2563eb' },
    { name: 'Giáo án', value: lessons.length, color: '#10b981' },
    { name: 'Slide bài giảng', value: slides.length, color: '#f59e0b' },
    { name: 'Bài tập', value: assignments.length, color: '#8b5cf6' }
  ];

  // Due assignments soon
  const pendingAssignments = assignments
    .filter((a) => a.status === 'Đang mở' || a.status === 'Sắp hết hạn')
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-sky-300 text-xs font-semibold mb-2 border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Nền tảng Quản trị & Trợ lý Giảng viên Vật lý THPT GDPT 2018
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Chào mừng Thầy/Cô trở lại làm việc
            </h2>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl">
              Hệ thống đã cập nhật đầy đủ ngân hàng đề thi 3 khối (10, 11, 12), kế hoạch bài dạy chuẩn 5512, slide trình chiếu và sổ điểm điện tử tự động tính điểm theo quy định mới.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={onOpenQuickAction}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-medium text-xs md:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Thao tác nhanh
            </button>
            <button
              onClick={() => onNavigate('ai-assistant')}
              className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-amber-300 border border-amber-400/30 font-medium text-xs md:text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Hỏi Trợ lý AI
            </button>
          </div>
        </div>
      </div>

      {/* 7 Core Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div
          onClick={() => onNavigate('classes')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <GraduationCap className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-medium text-slate-500">Lớp giảng dạy</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{classes.length}</p>
          <span className="text-[10px] text-blue-600 font-medium">Khối 10, 11, 12</span>
        </div>

        <div
          onClick={() => onNavigate('students')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Users className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-medium text-slate-500">Tổng học sinh</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{students.length}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Đang theo học</span>
        </div>

        <div
          onClick={() => onNavigate('exams')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-medium text-slate-500">Kho đề thi</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{exams.length}</p>
          <span className="text-[10px] text-indigo-600 font-medium">Có ma trận &amp; đáp án</span>
        </div>

        <div
          onClick={() => onNavigate('lessons')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-teal-400 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <BookOpenCheck className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-medium text-slate-500">Kho giáo án</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{lessons.length}</p>
          <span className="text-[10px] text-teal-600 font-medium">Chuẩn mẫu 5512</span>
        </div>

        <div
          onClick={() => onNavigate('slides')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Presentation className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-medium text-slate-500">Slide bài giảng</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{slides.length}</p>
          <span className="text-[10px] text-amber-600 font-medium">PowerPoint &amp; PDF</span>
        </div>

        <div
          onClick={() => onNavigate('assignments')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-violet-400 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <CheckSquare className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-medium text-slate-500">Tổng bài tập</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{assignments.length}</p>
          <span className="text-[10px] text-violet-600 font-medium">Đã giao các lớp</span>
        </div>

        <div
          onClick={() => onNavigate('gradebook')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-rose-400 transition-all cursor-pointer group col-span-2 sm:col-span-1"
        >
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-medium text-slate-500">Điểm TB toàn khối</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{overallAvg}</p>
          <span className="text-[10px] text-rose-600 font-medium">Hệ số chuẩn Bộ</span>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Phân bố điểm học sinh */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Phân bố điểm học sinh</h3>
              <p className="text-xs text-slate-500">Theo 4 mức thang điểm quy chuẩn</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
              {validGrades.length} học sinh
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: any) => [`${value} học sinh`, 'Số lượng']}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {gradeDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Điểm trung bình theo từng lớp */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Điểm TB theo lớp</h3>
              <p className="text-xs text-slate-500">So sánh chất lượng giữa 10A1, 11B2, 12A3</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
              Thang 10
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classAvgData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="className" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: any) => [`${value} / 10.0`, 'Điểm TB']}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                />
                <Bar dataKey="diemTB" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Cơ cấu tài liệu học liệu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Cơ cấu học liệu Vật lý</h3>
              <p className="text-xs text-slate-500">Đề thi, giáo án, slide và bài tập</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">
              {exams.length + lessons.length + slides.length + assignments.length} tệp
            </span>
          </div>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={materialData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {materialData.map((entry, index) => (
                    <Cell key={`cell-mat-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} tài liệu`, name]}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Due Assignments & Recent Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Due Assignments Box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-800 text-sm">Bài tập đang mở &amp; Sắp đến hạn</h3>
            </div>
            <button
              onClick={() => onNavigate('assignments')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              Xem tất cả ({assignments.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {pendingAssignments.map((asg) => (
              <div key={asg.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{asg.title}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-blue-100 text-blue-700">
                      Lớp {asg.grade}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hạn nộp: <span className="text-amber-700 font-medium">{asg.dueDate}</span> • Đã nộp: {asg.submissionsCount || 0} học sinh
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('assignments')}
                  className="px-2.5 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Chấm bài
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Audit Activity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm">Công việc &amp; Cập nhật gần đây</h3>
            </div>
            <button
              onClick={() => onNavigate('settings')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              Lịch sử thao tác
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2 text-xs">
            {logs.slice(0, 5).map((log) => (
              <div key={log.id} className="py-2.5 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-700 mt-0.5">
                  <BookOpenCheck className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800">{log.action}</p>
                    <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{log.detail}</p>
                  <span className="inline-block mt-1 text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                    {log.module}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
