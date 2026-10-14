import React, { useState } from 'react';
import {
  Award,
  Search,
  Filter,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  FileSpreadsheet,
  Settings2,
  RefreshCw,
  Save
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Classroom, StudentGrade, Student, GradingScheme, Semester } from '../types';
import { exportUtils } from '../utils/exportUtils';
import { storage } from '../services/storage';

interface GradebookViewProps {
  classes: Classroom[];
  students: Student[];
  grades: StudentGrade[];
  gradingScheme: GradingScheme;
  onSaveGrades: (updatedGrades: StudentGrade[]) => void;
  onUpdateScheme: (scheme: GradingScheme) => void;
  onLog: (action: string, module: string, detail: string) => void;
}

export const GradebookView: React.FC<GradebookViewProps> = ({
  classes,
  students,
  grades,
  gradingScheme,
  onSaveGrades,
  onUpdateScheme,
  onLog
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'cls-10a1');
  const [selectedSemester, setSelectedSemester] = useState<Semester>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Local grid copy for fast inline editing
  const [localGrades, setLocalGrades] = useState<StudentGrade[]>(() => JSON.parse(JSON.stringify(grades)));

  // Current active class object
  const currentClass = classes.find((c) => c.id === selectedClassId);

  // Filtered grades for current view
  const currentGrades = localGrades.filter((g) => {
    const matchClass = g.classId === selectedClassId;
    const matchSemester = g.semester === selectedSemester;
    const matchSearch =
      g.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.studentCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchClass && matchSemester && matchSearch;
  });

  // Handle cell edit
  const handleScoreChange = (
    gradeId: string,
    field: keyof StudentGrade['scores'],
    valueStr: string
  ) => {
    const numValue = valueStr === '' ? undefined : parseFloat(valueStr);

    if (numValue !== undefined && (isNaN(numValue) || numValue < 0 || numValue > 10)) {
      alert('Cảnh báo: Điểm số phải nằm trong thang điểm từ 0 đến 10!');
      return;
    }

    setLocalGrades((prev) =>
      prev.map((g) => {
        if (g.id !== gradeId) return g;
        const newScores = { ...g.scores, [field]: numValue };
        const newAvg = storage.calculateAverage(newScores, gradingScheme);
        const newRating = storage.determineAcademicRating(newAvg, gradingScheme);

        return {
          ...g,
          scores: newScores,
          averageScore: newAvg,
          academicRating: newRating,
          updatedAt: new Date().toISOString().split('T')[0]
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  // Save all changes
  const handleSaveAll = () => {
    onSaveGrades(localGrades);
    setHasUnsavedChanges(false);
    onLog('Lưu sổ điểm', 'Sổ điểm', `Lưu điểm lớp ${currentClass?.code || ''} học kỳ ${selectedSemester}`);
    alert('Đã lưu dữ liệu bảng điểm thành công!');
  };

  // Export to Excel
  const handleExportExcel = () => {
    exportUtils.exportGradebookToExcel(currentGrades, currentClass);
    onLog('Xuất sổ điểm Excel', 'Sổ điểm', `Xuất bảng điểm lớp ${currentClass?.code}`);
  };

  // Import from Excel / CSV
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        const errors: string[] = [];
        let updatedCount = 0;

        const updated = [...localGrades];

        data.forEach((row, rowIdx) => {
          const code = row['Mã học sinh'] || row['MaHS'];
          if (!code) {
            errors.push(`Dòng ${rowIdx + 2}: Thiếu cột Mã học sinh`);
            return;
          }

          const existingIdx = updated.findIndex((g) => g.studentCode === code && g.semester === selectedSemester);
          if (existingIdx !== -1) {
            const parseVal = (v: any) => {
              const parsed = parseFloat(v);
              return !isNaN(parsed) && parsed >= 0 && parsed <= 10 ? parsed : undefined;
            };

            const tx1 = parseVal(row['TX 1'] ?? row['TX1']);
            const tx2 = parseVal(row['TX 2'] ?? row['TX2']);
            const tx3 = parseVal(row['TX 3'] ?? row['TX3']);
            const bt = parseVal(row['Bài tập'] ?? row['BT']);
            const gk = parseVal(row['Giữa kỳ (GK)'] ?? row['GK']);
            const ck = parseVal(row['Cuối kỳ (CK)'] ?? row['CK']);

            const target = updated[existingIdx];
            const newScores = {
              ...target.scores,
              ...(tx1 !== undefined && { tx1 }),
              ...(tx2 !== undefined && { tx2 }),
              ...(tx3 !== undefined && { tx3 }),
              ...(bt !== undefined && { bt }),
              ...(gk !== undefined && { gk }),
              ...(ck !== undefined && { ck })
            };

            const avg = storage.calculateAverage(newScores, gradingScheme);
            const rating = storage.determineAcademicRating(avg, gradingScheme);

            updated[existingIdx] = {
              ...target,
              scores: newScores,
              averageScore: avg,
              academicRating: rating,
              updatedAt: new Date().toISOString().split('T')[0]
            };
            updatedCount++;
          }
        });

        if (errors.length > 0) {
          setImportErrors(errors);
        } else {
          setLocalGrades(updated);
          onSaveGrades(updated);
          onLog('Nhập điểm từ Excel', 'Sổ điểm', `Nhập thành công ${updatedCount} học sinh lớp ${currentClass?.code}`);
          alert(`Nhập điểm thành công cho ${updatedCount} học sinh từ tệp Excel!`);
        }
      } catch (err: any) {
        alert(`Lỗi đọc tệp Excel: ${err.message}`);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Class Select */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="text-xs md:text-sm px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:border-blue-600 outline-none"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.studentCount} HS)
              </option>
            ))}
          </select>

          {/* Semester Toggle */}
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

          {/* Search */}
          <div className="relative min-w-[180px] flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã hoặc họ tên..."
              className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {hasUnsavedChanges && (
            <button
              onClick={handleSaveAll}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm rounded-lg shadow-xs flex items-center gap-1.5 animate-bounce"
            >
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </button>
          )}

          <button
            onClick={() => setShowConfigModal(true)}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs md:text-sm font-medium rounded-lg flex items-center gap-1.5"
            title="Cấu hình hệ số tính điểm"
          >
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">Hệ số điểm</span>
          </button>

          <label className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs md:text-sm font-medium rounded-lg flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Nhập Excel</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportExcel}
              className="hidden"
            />
          </label>

          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs md:text-sm font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Xuất Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Info banner about formula */}
      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-700" />
          <span>
            <strong>Quy tắc tính điểm trung bình môn Vật lý:</strong> TB = [Tổng điểm TX + (GK × {gradingScheme.gkWeight}) + (CK × {gradingScheme.ckWeight})] / [Số đầu điểm TX + {gradingScheme.gkWeight} + {gradingScheme.ckWeight}].
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-blue-700">
          <span>Ngưỡng Đạt: ≥ {gradingScheme.passThreshold} | Khá: ≥ {gradingScheme.goodThreshold} | Giỏi: ≥ {gradingScheme.excellentThreshold}</span>
          <span className="sm:hidden text-slate-400 font-normal ml-auto">(Vuốt ngang để xem đủ điểm)</span>
        </div>
      </div>

      {/* Excel-like Gradebook Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm min-w-[780px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-3 w-28">Mã HS</th>
                <th className="py-3 px-4 min-w-[180px]">Họ và tên</th>
                <th className="py-3 px-2 text-center w-20 bg-blue-50/50">TX 1</th>
                <th className="py-3 px-2 text-center w-20 bg-blue-50/50">TX 2</th>
                <th className="py-3 px-2 text-center w-20 bg-blue-50/50">TX 3</th>
                <th className="py-3 px-2 text-center w-20 bg-blue-50/50">Bài tập</th>
                <th className="py-3 px-2 text-center w-24 bg-indigo-50/50">Giữa kỳ (x{gradingScheme.gkWeight})</th>
                <th className="py-3 px-2 text-center w-24 bg-purple-50/50">Cuối kỳ (x{gradingScheme.ckWeight})</th>
                <th className="py-3 px-3 text-center w-24 bg-amber-50/50">Điểm TB</th>
                <th className="py-3 px-3 text-center w-28">Xếp loại</th>
                <th className="py-3 px-3">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {currentGrades.map((g, index) => {
                const isUnder5 = (g.averageScore || 0) < 5.0 && g.averageScore !== undefined;

                return (
                  <tr
                    key={g.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isUnder5 ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center font-sans text-slate-500 font-medium">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      {g.studentCode}
                    </td>
                    <td className="py-2.5 px-4 font-sans font-bold text-slate-800">
                      {g.studentName}
                    </td>

                    {/* TX 1 */}
                    <td className="py-2 px-1 text-center bg-blue-50/30">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.1}
                        value={g.scores.tx1 !== undefined ? g.scores.tx1 : ''}
                        onChange={(e) => handleScoreChange(g.id, 'tx1', e.target.value)}
                        className="w-16 py-1 px-1 text-center border border-slate-200 rounded focus:border-blue-600 focus:bg-white outline-none font-semibold text-slate-800"
                      />
                    </td>

                    {/* TX 2 */}
                    <td className="py-2 px-1 text-center bg-blue-50/30">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.1}
                        value={g.scores.tx2 !== undefined ? g.scores.tx2 : ''}
                        onChange={(e) => handleScoreChange(g.id, 'tx2', e.target.value)}
                        className="w-16 py-1 px-1 text-center border border-slate-200 rounded focus:border-blue-600 focus:bg-white outline-none font-semibold text-slate-800"
                      />
                    </td>

                    {/* TX 3 */}
                    <td className="py-2 px-1 text-center bg-blue-50/30">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.1}
                        value={g.scores.tx3 !== undefined ? g.scores.tx3 : ''}
                        onChange={(e) => handleScoreChange(g.id, 'tx3', e.target.value)}
                        className="w-16 py-1 px-1 text-center border border-slate-200 rounded focus:border-blue-600 focus:bg-white outline-none font-semibold text-slate-800"
                      />
                    </td>

                    {/* Bài tập */}
                    <td className="py-2 px-1 text-center bg-blue-50/30">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.1}
                        value={g.scores.bt !== undefined ? g.scores.bt : ''}
                        onChange={(e) => handleScoreChange(g.id, 'bt', e.target.value)}
                        className="w-16 py-1 px-1 text-center border border-slate-200 rounded focus:border-blue-600 focus:bg-white outline-none font-semibold text-slate-800"
                      />
                    </td>

                    {/* Giữa kỳ */}
                    <td className="py-2 px-1 text-center bg-indigo-50/30">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.1}
                        value={g.scores.gk !== undefined ? g.scores.gk : ''}
                        onChange={(e) => handleScoreChange(g.id, 'gk', e.target.value)}
                        className="w-16 py-1 px-1 text-center font-bold text-indigo-900 border border-indigo-200 bg-white rounded focus:border-indigo-600 outline-none"
                      />
                    </td>

                    {/* Cuối kỳ */}
                    <td className="py-2 px-1 text-center bg-purple-50/30">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.1}
                        value={g.scores.ck !== undefined ? g.scores.ck : ''}
                        onChange={(e) => handleScoreChange(g.id, 'ck', e.target.value)}
                        className="w-16 py-1 px-1 text-center font-bold text-purple-900 border border-purple-200 bg-white rounded focus:border-purple-600 outline-none"
                      />
                    </td>

                    {/* Điểm TB */}
                    <td className="py-2.5 px-3 text-center bg-amber-50/30">
                      <span
                        className={`text-sm font-bold ${
                          g.averageScore === undefined
                            ? 'text-slate-400'
                            : g.averageScore >= 8.0
                            ? 'text-emerald-700 font-extrabold'
                            : g.averageScore >= 6.5
                            ? 'text-blue-700'
                            : g.averageScore >= 5.0
                            ? 'text-amber-700'
                            : 'text-rose-600 font-extrabold'
                        }`}
                      >
                        {g.averageScore !== undefined ? g.averageScore.toFixed(1) : '-'}
                      </span>
                    </td>

                    {/* Xếp loại */}
                    <td className="py-2.5 px-3 text-center font-sans">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          g.academicRating === 'Xuất sắc'
                            ? 'bg-emerald-100 text-emerald-800'
                            : g.academicRating === 'Giỏi'
                            ? 'bg-blue-100 text-blue-800'
                            : g.academicRating === 'Khá'
                            ? 'bg-sky-100 text-sky-800'
                            : g.academicRating === 'Đạt'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {g.academicRating || 'Chưa xếp'}
                      </span>
                    </td>

                    {/* Ghi chú */}
                    <td className="py-2.5 px-3 font-sans text-xs text-slate-500">
                      {g.notes || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GRADING SCHEME CONFIG MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 text-xs md:text-sm">
            <h3 className="text-base font-bold text-slate-800 pb-2 border-b border-slate-100">
              Cấu hình trọng số và ngưỡng xếp loại
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Hệ số TX</label>
                  <input
                    type="number"
                    value={gradingScheme.txWeight}
                    onChange={(e) => onUpdateScheme({ ...gradingScheme, txWeight: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Hệ số GK</label>
                  <input
                    type="number"
                    value={gradingScheme.gkWeight}
                    onChange={(e) => onUpdateScheme({ ...gradingScheme, gkWeight: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-center font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Hệ số CK</label>
                  <input
                    type="number"
                    value={gradingScheme.ckWeight}
                    onChange={(e) => onUpdateScheme({ ...gradingScheme, ckWeight: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-center font-bold text-purple-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ngưỡng Đạt</label>
                  <input
                    type="number"
                    step={0.1}
                    value={gradingScheme.passThreshold}
                    onChange={(e) => onUpdateScheme({ ...gradingScheme, passThreshold: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ngưỡng Khá</label>
                  <input
                    type="number"
                    step={0.1}
                    value={gradingScheme.goodThreshold}
                    onChange={(e) => onUpdateScheme({ ...gradingScheme, goodThreshold: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ngưỡng Giỏi</label>
                  <input
                    type="number"
                    step={0.1}
                    value={gradingScheme.excellentThreshold}
                    onChange={(e) => onUpdateScheme({ ...gradingScheme, excellentThreshold: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-center"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  onLog('Cập nhật hệ số điểm', 'Cài đặt', 'Cập nhật trọng số tính điểm trung bình');
                }}
                className="px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
