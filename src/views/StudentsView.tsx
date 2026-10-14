import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Edit3,
  Trash2,
  AlertCircle,
  GraduationCap,
  Award,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { Student, StudentGrade, Classroom } from '../types';

interface StudentsViewProps {
  students: Student[];
  classes: Classroom[];
  grades: StudentGrade[];
  onSaveStudent: (s: Student) => void;
  onDeleteStudent: (id: string) => void;
  onLog: (action: string, module: string, detail: string) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  classes,
  grades,
  onSaveStudent,
  onDeleteStudent,
  onLog
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.className.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGrade = gradeFilter === 'all' || s.grade.toString() === gradeFilter;
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchGrade && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo họ tên, mã học sinh..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs md:text-sm px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Đang học">Đang học</option>
            <option value="Cần hỗ trợ">Cần hỗ trợ</option>
            <option value="Nghỉ học">Nghỉ học</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Hiển thị <strong>{filteredStudents.length}</strong> / {students.length} học sinh
        </div>
      </div>

      {/* Grid of Student Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((std) => {
          const studentGrades = grades.find((g) => g.studentId === std.id && g.semester === 1);
          const avg = studentGrades?.averageScore;

          return (
            <div
              key={std.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    {std.studentCode}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      std.status === 'Đang học'
                        ? 'bg-emerald-50 text-emerald-700'
                        : std.status === 'Cần hỗ trợ'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {std.status}
                  </span>
                </div>

                <h4 className="font-bold text-slate-800 text-base mt-2">{std.fullName}</h4>
                <p className="text-xs text-slate-500">
                  Lớp: <strong className="text-slate-700">{std.className}</strong> (Khối {std.grade}) • {std.gender}
                </p>

                {std.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2 line-clamp-2 italic">
                    &ldquo;{std.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Student Academic preview */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Điểm TB Vật lý HK1:</span>
                  <span
                    className={`font-bold text-sm ${
                      avg === undefined
                        ? 'text-slate-400'
                        : avg >= 8
                        ? 'text-emerald-700'
                        : avg >= 6.5
                        ? 'text-blue-700'
                        : avg >= 5
                        ? 'text-amber-700'
                        : 'text-rose-600'
                    }`}
                  >
                    {avg !== undefined ? `${avg.toFixed(1)} / 10` : 'Chưa có'}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Xếp loại:</span>
                  <span className="font-semibold text-slate-700">
                    {studentGrades?.academicRating || 'Chưa xét'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
