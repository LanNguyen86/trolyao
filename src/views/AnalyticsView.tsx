import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  AlertTriangle,
  CheckCircle2,
  Users,
  Award,
  Sparkles,
  FileSpreadsheet,
  HelpCircle,
  Clock
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
  Cell,
  LineChart,
  Line
} from 'recharts';
import * as XLSX from 'xlsx';
import { Classroom, Student, StudentGrade, Assignment, Submission, Semester } from '../types';
import { geminiService } from '../services/geminiService';

interface AnalyticsViewProps {
  classes: Classroom[];
  students: Student[];
  grades: StudentGrade[];
  assignments: Assignment[];
  submissions: Submission[];
  onLog: (action: string, module: string, detail: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  classes,
  students,
  grades,
  assignments,
  submissions,
  onLog
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<Semester>(1);
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);

  // Filter grades
  const filteredGrades = grades.filter((g) => {
    const matchClass = selectedClassId === 'all' || g.classId === selectedClassId;
    const matchSemester = g.semester === selectedSemester;
    return matchClass && matchSemester;
  });

  const validGrades = filteredGrades.filter((g) => typeof g.averageScore === 'number');

  // Metrics
  const avgScore =
    validGrades.length > 0
      ? Number((validGrades.reduce((sum, g) => sum + (g.averageScore || 0), 0) / validGrades.length).toFixed(1))
      : 0;

  let passCount = 0;
  let failCount = 0;
  let under5 = 0;
  let from5to65 = 0;
  let from65to8 = 0;
  let from8plus = 0;

  validGrades.forEach((g) => {
    const s = g.averageScore || 0;
    if (s >= 5.0) passCount++;
    else failCount++;

    if (s < 5.0) under5++;
    else if (s < 6.5) from5to65++;
    else if (s < 8.0) from65to8++;
    else from8plus++;
  });

  const passRate = validGrades.length > 0 ? Math.round((passCount / validGrades.length) * 100) : 0;

  const distributionData = [
    { name: 'Dưới 5.0 (Chưa đạt)', count: under5, color: '#ef4444' },
    { name: '5.0 - 6.4 (Đạt)', count: from5to65, color: '#f59e0b' },
    { name: '6.5 - 7.9 (Khá)', count: from65to8, color: '#3b82f6' },
    { name: 'Từ 8.0 trở lên (Giỏi/XS)', count: from8plus, color: '#10b981' }
  ];

  // Class comparison data
  const classComparisonData = classes.map((c) => {
    const cGrades = grades.filter((g) => g.classId === c.id && g.semester === selectedSemester && typeof g.averageScore === 'number');
    const cAvg =
      cGrades.length > 0
        ? Number((cGrades.reduce((acc, cur) => acc + (cur.averageScore || 0), 0) / cGrades.length).toFixed(1))
        : 0;

    const txScores = cGrades.map((g) => g.scores.tx1).filter((v): v is number => typeof v === 'number');
    const gkScores = cGrades.map((g) => g.scores.gk).filter((v): v is number => typeof v === 'number');
    const ckScores = cGrades.map((g) => g.scores.ck).filter((v): v is number => typeof v === 'number');

    const avgTX = txScores.length > 0 ? Number((txScores.reduce((a, b) => a + b, 0) / txScores.length).toFixed(1)) : 0;
    const avgGK = gkScores.length > 0 ? Number((gkScores.reduce((a, b) => a + b, 0) / gkScores.length).toFixed(1)) : 0;
    const avgCK = ckScores.length > 0 ? Number((ckScores.reduce((a, b) => a + b, 0) / ckScores.length).toFixed(1)) : 0;

    return {
      name: c.code,
      fullName: c.name,
      'Điểm TB': cAvg,
      'Thường xuyên': avgTX,
      'Giữa kỳ': avgGK,
      'Cuối kỳ': avgCK
    };
  });

  // Students requiring assistance
  const atRiskStudents = filteredGrades.filter(
    (g) => (g.averageScore !== undefined && g.averageScore < 6.0) || g.academicRating === 'Chưa đạt'
  );

  // Trigger AI Performance Analysis
  const handleRunAIAnalysis = async () => {
    setAiReportLoading(true);
    setAiAnalysisResult(null);

    const activeClassName =
      selectedClassId === 'all'
        ? 'Toàn bộ các khối lớp THPT'
        : classes.find((c) => c.id === selectedClassId)?.name || 'Lớp học';

    try {
      const result = await geminiService.analyzeClassPerformance({
        className: activeClassName,
        studentCount: validGrades.length,
        averageScore: avgScore,
        lowCount: under5,
        midCount: from5to65,
        highCount: from8plus,
        atRiskStudents: atRiskStudents.map((s) => ({
          name: s.studentName,
          code: s.studentCode,
          score: s.averageScore,
          notes: s.notes
        }))
      });
      setAiAnalysisResult(result);
      onLog('AI Phân tích kết quả', 'Báo cáo', `Phân tích dữ liệu học tập: ${activeClassName}`);
    } catch (err: any) {
      alert(`Lỗi AI: ${err.message || 'Không thể tạo phân tích'}`);
    } finally {
      setAiReportLoading(false);
    }
  };

  // Export full report to Excel
  const handleExportFullReport = () => {
    const data = filteredGrades.map((g, idx) => ({
      'STT': idx + 1,
      'Mã HS': g.studentCode,
      'Họ và tên': g.studentName,
      'Điểm TB': g.averageScore ?? '',
      'Xếp loại': g.academicRating ?? '',
      'Tình trạng': (g.averageScore || 0) >= 5.0 ? 'Đạt' : 'Chưa đạt (Cần hỗ trợ)',
      'Ghi chú': g.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bao_Cao_Hoc_Tap');
    XLSX.writeFile(wb, `BaoCao_ThongKe_VatLy_HK${selectedSemester}.xlsx`);
    onLog('Xuất báo cáo Excel', 'Báo cáo', `Xuất file Excel thống kê học kỳ ${selectedSemester}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="text-xs md:text-sm px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:border-blue-600 outline-none"
          >
            <option value="all">Tất cả các lớp (10A1, 11B2, 12A3)</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex border border-slate-200 rounded-lg overflow-hidden text-xs md:text-sm font-semibold">
            <button
              onClick={() => setSelectedSemester(1)}
              className={`px-3 py-1.5 ${
                selectedSemester === 1
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Học kỳ I
            </button>
            <button
              onClick={() => setSelectedSemester(2)}
              className={`px-3 py-1.5 ${
                selectedSemester === 2
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Học kỳ II
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAIAnalysis}
            disabled={aiReportLoading}
            className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-700 to-blue-700 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold text-xs md:text-sm rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            {aiReportLoading ? 'AI Đang phân tích...' : 'AI Đánh giá sư phạm'}
          </button>

          <button
            onClick={handleExportFullReport}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs md:text-sm font-semibold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Xuất Báo Cáo (.xlsx)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Điểm trung bình</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{avgScore} <span className="text-xs font-normal text-slate-400">/ 10</span></p>
          <span className="text-[11px] text-blue-600 font-medium">Học kỳ {selectedSemester}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Tỷ lệ học sinh Đạt</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{passRate}%</p>
          <span className="text-[11px] text-slate-500">{passCount} / {validGrades.length} học sinh</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Học sinh giỏi / XS</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-700">{from8plus}</p>
          <span className="text-[11px] text-slate-500">Đạt từ 8.0 trở lên</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Học sinh cần hỗ trợ</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-600">{atRiskStudents.length}</p>
          <span className="text-[11px] text-rose-600 font-medium">Cần phụ đạo thêm</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: So sánh điểm các bài kiểm tra theo lớp */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="font-bold text-slate-800 text-sm mb-1">
            So sánh điểm TX, Giữa kỳ &amp; Cuối kỳ
          </h3>
          <p className="text-xs text-slate-500 mb-4">Mức độ tương quan giữa kiểm tra định kỳ và thường xuyên</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Thường xuyên" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Giữa kỳ" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Cuối kỳ" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Phân bố điểm số */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="font-bold text-slate-800 text-sm mb-1">
            Cơ cấu thang điểm toàn khối
          </h3>
          <p className="text-xs text-slate-500 mb-4">Tỷ lệ theo 4 mức đánh giá kết quả rèn luyện</p>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} học sinh`, name]}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Pedagogical Analysis Box */}
      {aiAnalysisResult && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-700" />
            <h3 className="font-bold text-slate-800 text-base">
              Báo Cáo Đánh Giá Sư Phạm Chuyên Sâu từ AI
            </h3>
          </div>

          <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
            {aiAnalysisResult.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
            <div className="bg-white/80 p-4 rounded-xl border border-indigo-100 space-y-2">
              <h4 className="font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Điểm mạnh của lớp học:
              </h4>
              <ul className="list-disc pl-5 text-slate-600 space-y-1">
                {(aiAnalysisResult.strengths || []).map((s: string, idx: number) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white/80 p-4 rounded-xl border border-indigo-100 space-y-2">
              <h4 className="font-bold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Kế hoạch can thiệp 2-3 tuần tới:
              </h4>
              <ul className="list-disc pl-5 text-slate-600 space-y-1">
                {(aiAnalysisResult.actionPlan || []).map((a: string, idx: number) => (
                  <li key={idx}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Students Needing Support List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              Danh sách học sinh cần hỗ trợ &amp; Phụ đạo chuyên đề
            </h3>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full">
            {atRiskStudents.length} học sinh
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-4 w-28">Mã HS</th>
                <th className="py-2.5 px-4">Họ và tên</th>
                <th className="py-2.5 px-3">Lớp</th>
                <th className="py-2.5 px-3 text-center">Điểm TB</th>
                <th className="py-2.5 px-3">Xếp loại</th>
                <th className="py-2.5 px-4">Đánh giá &amp; Kế hoạch hỗ trợ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {atRiskStudents.map((std) => (
                <tr key={std.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{std.studentCode}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-800">{std.studentName}</td>
                  <td className="py-2.5 px-3 font-semibold text-blue-700">Lớp {std.grade}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-rose-600">
                    {std.averageScore?.toFixed(1) || '-'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                      {std.academicRating || 'Cần hỗ trợ'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 italic">
                    {std.notes || 'Cần kiểm tra lại kiến thức động học và công thức lực'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
