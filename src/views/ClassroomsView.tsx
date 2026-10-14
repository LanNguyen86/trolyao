import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Plus,
  Search,
  Edit3,
  Trash2,
  Mail,
  Phone,
  BookOpen,
  X,
  UserPlus,
  School,
  Building,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Filter
} from 'lucide-react';
import { Classroom, Student, GradeLevel } from '../types';

interface ClassroomsViewProps {
  classes: Classroom[];
  students: Student[];
  onSaveClass: (c: Classroom) => void;
  onDeleteClass: (id: string) => void;
  onSaveStudent: (s: Student) => void;
  onDeleteStudent: (id: string) => void;
  onLog: (action: string, module: string, detail: string) => void;
}

export const ClassroomsView: React.FC<ClassroomsViewProps> = ({
  classes,
  students,
  onSaveClass,
  onDeleteClass,
  onSaveStudent,
  onDeleteStudent,
  onLog
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [isNewClass, setIsNewClass] = useState(false);
  const [editClassForm, setEditClassForm] = useState<Partial<Classroom>>({});
  const [classFormError, setClassFormError] = useState<string>('');

  // Class filtering & search
  const [gradeFilter, setGradeFilter] = useState<number | 'all'>('all');
  const [classSearch, setClassSearch] = useState('');

  // Student modal
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [studentForm, setStudentForm] = useState<Partial<Student>>({});

  // Student search within class
  const [studentSearch, setStudentSearch] = useState('');

  // Keep selectedClassId valid
  useEffect(() => {
    if (classes.length > 0) {
      const exists = classes.some((c) => c.id === selectedClassId);
      if (!exists) {
        setSelectedClassId(classes[0].id);
      }
    }
  }, [classes, selectedClassId]);

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const classStudents = students.filter((s) => s.classId === selectedClass?.id);
  const filteredStudents = classStudents.filter((s) => {
    if (!studentSearch) return true;
    const q = studentSearch.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.studentCode.toLowerCase().includes(q) ||
      (s.parentPhone && s.parentPhone.includes(q))
    );
  });

  // Filter classes list
  const filteredClasses = classes.filter((c) => {
    const matchesGrade = gradeFilter === 'all' || c.grade === gradeFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(classSearch.toLowerCase()) ||
      c.code.toLowerCase().includes(classSearch.toLowerCase()) ||
      (c.roomNumber && c.roomNumber.toLowerCase().includes(classSearch.toLowerCase()));
    return matchesGrade && matchesSearch;
  });

  // Open "Thêm lớp mới" modal
  const handleOpenAddClass = (defaultGrade: GradeLevel = 10) => {
    const countInGrade = classes.filter((c) => c.grade === defaultGrade).length;
    const suggestedCode = `${defaultGrade}A${countInGrade + 1}`;
    
    setEditClassForm({
      id: 'cls-' + Date.now(),
      code: suggestedCode,
      name: `Lớp ${suggestedCode} - Tự nhiên`,
      grade: defaultGrade,
      schoolYear: '2026-2027',
      studentCount: 0,
      homeroomTeacher: 'Nguyễn Văn Hùng',
      physicsTeacher: 'Nguyễn Văn Hùng',
      roomNumber: `P.${defaultGrade}0${countInGrade + 1}`
    });
    setClassFormError('');
    setIsNewClass(true);
    setIsEditingClass(true);
  };

  // Open "Sửa lớp" modal
  const handleOpenEditClass = (cls: Classroom) => {
    setEditClassForm(JSON.parse(JSON.stringify(cls)));
    setClassFormError('');
    setIsNewClass(false);
    setIsEditingClass(true);
  };

  // Change grade in add/edit modal with smart auto-naming
  const handleGradeChange = (newGrade: GradeLevel) => {
    if (!editClassForm) return;
    if (isNewClass) {
      const countInGrade = classes.filter((c) => c.grade === newGrade).length;
      const suggestedCode = `${newGrade}A${countInGrade + 1}`;
      setEditClassForm({
        ...editClassForm,
        grade: newGrade,
        code: suggestedCode,
        name: `Lớp ${suggestedCode} - Tự nhiên`,
        roomNumber: `P.${newGrade}0${countInGrade + 1}`
      });
    } else {
      setEditClassForm({
        ...editClassForm,
        grade: newGrade
      });
    }
  };

  // Quick preset name tags
  const applyPresetName = (suffix: string) => {
    const code = editClassForm.code || '10A1';
    setEditClassForm({
      ...editClassForm,
      name: `Lớp ${code} - ${suffix}`
    });
  };

  // Save class (create or update)
  const handleSaveClass = () => {
    if (!editClassForm.code?.trim() || !editClassForm.name?.trim()) {
      setClassFormError('Vui lòng điền đầy đủ Mã lớp và Tên lớp!');
      return;
    }

    const trimmedCode = editClassForm.code.trim().toUpperCase();

    // Check duplicate code (excluding current class if editing)
    const isDuplicate = classes.some(
      (c) => c.id !== editClassForm.id && c.code.toLowerCase() === trimmedCode.toLowerCase()
    );
    if (isDuplicate) {
      setClassFormError(`Mã lớp "${trimmedCode}" đã tồn tại trên hệ thống. Vui lòng chọn mã khác!`);
      return;
    }

    const toSave: Classroom = {
      id: editClassForm.id || 'cls-' + Date.now(),
      code: trimmedCode,
      name: editClassForm.name.trim(),
      grade: (editClassForm.grade || 10) as GradeLevel,
      schoolYear: editClassForm.schoolYear || '2026-2027',
      studentCount: classStudents.length || 0,
      homeroomTeacher: editClassForm.homeroomTeacher?.trim() || 'Chưa phân công',
      physicsTeacher: editClassForm.physicsTeacher?.trim() || 'Nguyễn Văn Hùng',
      roomNumber: editClassForm.roomNumber?.trim() || 'P.101'
    };

    onSaveClass(toSave);
    setSelectedClassId(toSave.id);
    setIsEditingClass(false);

    if (isNewClass) {
      onLog('Thêm lớp học mới', 'Lớp học', `Tạo lớp mới: ${toSave.name} (${toSave.code})`);
    } else {
      onLog('Cập nhật lớp học', 'Lớp học', `Cập nhật thông tin lớp: ${toSave.name}`);
    }
  };

  // Delete class with confirmation
  const handleDeleteClassPrompt = (cls: Classroom) => {
    const studentsInClass = students.filter((s) => s.classId === cls.id);
    const count = studentsInClass.length;

    const message = count > 0
      ? `Lớp "${cls.name}" (${cls.code}) hiện có ${count} học sinh. Bạn có chắc chắn muốn xóa lớp này không? (Học sinh trong lớp sẽ không còn lớp liên kết)`
      : `Bạn có chắc chắn muốn xóa lớp "${cls.name}" (${cls.code})?`;

    if (window.confirm(message)) {
      onDeleteClass(cls.id);
      onLog('Xóa lớp học', 'Lớp học', `Đã xóa lớp: ${cls.name} (${cls.code})`);
      // Select another class if available
      const remaining = classes.filter((c) => c.id !== cls.id);
      if (remaining.length > 0) {
        setSelectedClassId(remaining[0].id);
      }
    }
  };

  const handleOpenAddStudent = () => {
    if (!selectedClass) return;
    setStudentForm({
      id: 'std-' + Date.now(),
      studentCode: `HS${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: '',
      classId: selectedClass.id,
      className: selectedClass.code,
      grade: selectedClass.grade,
      gender: 'Nam',
      dob: '2010-05-15',
      status: 'Đang học',
      notes: ''
    });
    setIsEditingStudent(true);
  };

  const handleSaveStudent = () => {
    if (!studentForm.fullName?.trim() || !studentForm.studentCode?.trim()) {
      alert('Vui lòng nhập họ tên và mã học sinh!');
      return;
    }
    const toSave: Student = {
      ...(studentForm as Student),
      classId: selectedClass.id,
      className: selectedClass.code,
      grade: selectedClass.grade
    };
    onSaveStudent(toSave);
    setIsEditingStudent(false);
    onLog('Lưu học sinh', 'Học sinh', `Lưu học sinh: ${toSave.fullName} (${toSave.studentCode}) - Lớp ${selectedClass.code}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-800">
                Quản lý Lớp học & Danh sách Học sinh
              </h2>
              <p className="text-xs text-slate-500">
                Quản lý {classes.length} lớp giảng dạy Vật lý • Tổng số {students.length} học sinh
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Quick grade selector for adding */}
          <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <span className="px-2 text-slate-500">Tạo nhanh:</span>
            <button
              onClick={() => handleOpenAddClass(10)}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              + Khối 10
            </button>
            <button
              onClick={() => handleOpenAddClass(11)}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg shadow-2xs transition-all cursor-pointer mx-1"
            >
              + Khối 11
            </button>
            <button
              onClick={() => handleOpenAddClass(12)}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              + Khối 12
            </button>
          </div>

          {/* Primary Add Class Button */}
          <button
            onClick={() => handleOpenAddClass(10)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 active:scale-95 text-white font-bold text-xs md:text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Thêm lớp mới
          </button>
        </div>
      </div>

      {/* Filter and Search Bar for Classes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Grade filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Lọc:
          </span>
          <button
            onClick={() => setGradeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              gradeFilter === 'all'
                ? 'bg-blue-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tất cả ({classes.length})
          </button>
          {[10, 11, 12].map((g) => {
            const count = classes.filter((c) => c.grade === g).length;
            return (
              <button
                key={g}
                onClick={() => setGradeFilter(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  gradeFilter === g
                    ? 'bg-blue-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Khối {g} ({count})
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={classSearch}
            onChange={(e) => setClassSearch(e.target.value)}
            placeholder="Tìm theo tên, mã lớp, phòng..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Class Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredClasses.map((cls) => {
          const isSelected = cls.id === selectedClass?.id;
          const count = students.filter((s) => s.classId === cls.id).length;

          return (
            <div
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between group ${
                isSelected
                  ? 'bg-gradient-to-tr from-blue-900 via-indigo-900 to-blue-950 text-white border-blue-700 shadow-md ring-2 ring-blue-500/50 scale-[1.01]'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isSelected
                        ? 'bg-white/20 text-sky-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {cls.code} • Khối {cls.grade}
                  </span>
                  <span
                    className={`text-[11px] ${
                      isSelected ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {cls.schoolYear}
                  </span>
                </div>

                <h3 className="font-bold text-sm leading-snug line-clamp-1">{cls.name}</h3>

                <p className={`text-xs mt-1.5 flex items-center gap-1.5 ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                  <Building className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span>Phòng {cls.roomNumber || 'P.101'}</span>
                </p>
                <p className={`text-xs mt-0.5 flex items-center gap-1.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  <School className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span className="truncate">GVCN: {cls.homeroomTeacher || 'Chưa phân công'}</span>
                </p>
              </div>

              <div className="mt-3.5 pt-3 border-t border-slate-100/20 flex items-center justify-between text-xs">
                <span className={`flex items-center gap-1 font-medium ${isSelected ? 'text-slate-200' : 'text-slate-600'}`}>
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <strong>{count}</strong> học sinh
                </span>

                <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditClass(cls);
                    }}
                    className={`p-1 rounded-md transition-colors ${
                      isSelected
                        ? 'hover:bg-white/20 text-white'
                        : 'hover:bg-slate-100 text-slate-500 hover:text-blue-700'
                    }`}
                    title="Chỉnh sửa thông tin lớp"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClassPrompt(cls);
                    }}
                    className={`p-1 rounded-md transition-colors ${
                      isSelected
                        ? 'hover:bg-rose-500/30 text-rose-300'
                        : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                    }`}
                    title="Xóa lớp học"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Dashed Add Class Card */}
        <button
          onClick={() => handleOpenAddClass(10)}
          className="border-2 border-dashed border-slate-300 hover:border-blue-600 hover:bg-blue-50/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-2 transition-all group min-h-[140px] cursor-pointer bg-white/50"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <p className="font-bold text-slate-800 group-hover:text-blue-700 text-sm">
              Thêm lớp học mới
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Tạo lớp khối 10, 11 hoặc 12
            </p>
          </div>
        </button>
      </div>

      {/* Class Detail & Student Roster */}
      {selectedClass ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-md font-bold font-mono">
                  {selectedClass.code}
                </span>
                <h3 className="text-lg font-bold text-slate-800">{selectedClass.name}</h3>
                <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold">
                  Khối {selectedClass.grade} • Năm học {selectedClass.schoolYear}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-3 flex-wrap">
                <span>GV Chủ nhiệm: <strong className="text-slate-700">{selectedClass.homeroomTeacher}</strong></span>
                <span>•</span>
                <span>GV Vật lý: <strong className="text-blue-700">{selectedClass.physicsTeacher}</strong></span>
                <span>•</span>
                <span>Phòng học: <strong className="text-slate-700">{selectedClass.roomNumber}</strong></span>
                <span>•</span>
                <span>Sĩ số: <strong className="text-slate-800">{classStudents.length} học sinh</strong></span>
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleOpenEditClass(selectedClass)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-slate-500" />
                Sửa thông tin lớp
              </button>
              <button
                onClick={() => handleDeleteClassPrompt(selectedClass)}
                className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Xóa lớp
              </button>
              <button
                onClick={handleOpenAddStudent}
                className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs md:text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                Thêm học sinh
              </button>
            </div>
          </div>

          {/* Student Filter & Stats bar */}
          <div className="px-5 py-3 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700">Danh sách học sinh lớp {selectedClass.code}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">{filteredStudents.length} học sinh hiển thị</span>
            </div>
            <div className="relative sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Tìm tên, mã HS, SĐT..."
                className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Student Roster Table */}
          {filteredStudents.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">Chưa có học sinh nào trong lớp {selectedClass.code}</p>
              <p className="text-xs text-slate-400 mt-1">
                Thầy/Cô có thể bấm nút &quot;Thêm học sinh&quot; ở trên để bắt đầu thêm học sinh vào danh sách lớp.
              </p>
              <button
                onClick={handleOpenAddStudent}
                className="mt-3 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Thêm học sinh ngay
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-3 w-28">Mã HS</th>
                    <th className="py-3 px-4">Họ và tên</th>
                    <th className="py-3 px-3 text-center">Giới tính</th>
                    <th className="py-3 px-3">Ngày sinh</th>
                    <th className="py-3 px-3">Điện thoại PH</th>
                    <th className="py-3 px-3">Trạng thái</th>
                    <th className="py-3 px-3">Ghi chú sư phạm</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((std, idx) => (
                    <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{std.studentCode}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{std.fullName}</td>
                      <td className="py-3 px-3 text-center text-slate-600">{std.gender}</td>
                      <td className="py-3 px-3 text-slate-500">{std.dob}</td>
                      <td className="py-3 px-3 text-slate-600">{std.parentPhone || '-'}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                            std.status === 'Đang học'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : std.status === 'Cần hỗ trợ'
                              ? 'bg-amber-50 text-amber-700 font-bold border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {std.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{std.notes || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setStudentForm(JSON.parse(JSON.stringify(std)));
                              setIsEditingStudent(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Sửa học sinh"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa học sinh "${std.fullName}" khỏi lớp?`)) {
                                onDeleteStudent(std.id);
                                onLog('Xóa học sinh', 'Học sinh', `Xóa: ${std.fullName} khỏi lớp ${selectedClass.code}`);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa học sinh"
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
          )}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Chưa có lớp học nào được chọn</h3>
          <p className="text-xs text-slate-400 mt-1">Bấm nút bên dưới để tạo lớp học đầu tiên</p>
          <button
            onClick={() => handleOpenAddClass(10)}
            className="mt-4 px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-semibold hover:bg-blue-800"
          >
            + Thêm lớp học mới ngay
          </button>
        </div>
      )}

      {/* ADD / EDIT CLASS MODAL */}
      {isEditingClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-4 sm:p-6 space-y-4 text-xs md:text-sm my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  {isNewClass ? <Plus className="w-5 h-5 stroke-[2.5]" /> : <Edit3 className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {isNewClass ? 'Thêm lớp học mới' : `Chỉnh sửa lớp ${editClassForm.code}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isNewClass ? 'Thiết lập thông tin lớp học và phân công giảng dạy Vật lý' : 'Cập nhật thông tin chi tiết lớp học'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingClass(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {classFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{classFormError}</span>
              </div>
            )}

            <div className="space-y-3.5">
              {/* Grade Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Khối lớp giảng dạy <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 11, 12].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleGradeChange(g as GradeLevel)}
                      className={`py-2 text-center rounded-xl font-bold border transition-all cursor-pointer ${
                        editClassForm.grade === g
                          ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Khối {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Code & School Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mã lớp học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editClassForm.code || ''}
                    onChange={(e) => {
                      setEditClassForm({ ...editClassForm, code: e.target.value });
                      if (classFormError) setClassFormError('');
                    }}
                    placeholder="VD: 10A1, 11B2..."
                    className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-600 rounded-xl outline-none font-bold uppercase transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Mã định danh duy nhất</p>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Năm học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editClassForm.schoolYear || '2026-2027'}
                    onChange={(e) => setEditClassForm({ ...editClassForm, schoolYear: e.target.value })}
                    placeholder="2026-2027"
                    className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-600 rounded-xl outline-none transition-all"
                  />
                </div>
              </div>

              {/* Class Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên lớp học đầy đủ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editClassForm.name || ''}
                  onChange={(e) => {
                    setEditClassForm({ ...editClassForm, name: e.target.value });
                    if (classFormError) setClassFormError('');
                  }}
                  placeholder="VD: Lớp 10A1 - Ban Tự nhiên KHTN"
                  className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-600 rounded-xl outline-none transition-all font-medium"
                />

                {/* Preset quick buttons */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[11px] text-slate-400">Gợi ý phân ban:</span>
                  {['Tự nhiên', 'Cơ bản', 'Lớp chọn', 'Chuyên Lý'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => applyPresetName(tag)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 rounded-md text-[11px] font-medium transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Room & Physics Teacher */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phòng học</label>
                  <input
                    type="text"
                    value={editClassForm.roomNumber || ''}
                    onChange={(e) => setEditClassForm({ ...editClassForm, roomNumber: e.target.value })}
                    placeholder="VD: P.201, P.Thực hành Lý..."
                    className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-600 rounded-xl outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GV môn Vật lý</label>
                  <input
                    type="text"
                    value={editClassForm.physicsTeacher || 'Nguyễn Văn Hùng'}
                    onChange={(e) => setEditClassForm({ ...editClassForm, physicsTeacher: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-600 rounded-xl outline-none transition-all"
                  />
                </div>
              </div>

              {/* Homeroom Teacher */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Giáo viên chủ nhiệm</label>
                <input
                  type="text"
                  value={editClassForm.homeroomTeacher || ''}
                  onChange={(e) => setEditClassForm({ ...editClassForm, homeroomTeacher: e.target.value })}
                  placeholder="Họ và tên giáo viên chủ nhiệm..."
                  className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-600 rounded-xl outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditingClass(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveClass}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isNewClass ? 'Tạo lớp học' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {isEditingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl p-4 sm:p-6 space-y-4 text-xs md:text-sm my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {studentForm.fullName ? `Chỉnh sửa: ${studentForm.fullName}` : `Thêm học sinh mới vào lớp ${selectedClass?.code}`}
              </h3>
              <button
                onClick={() => setIsEditingStudent(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã học sinh *</label>
                  <input
                    type="text"
                    value={studentForm.studentCode || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, studentCode: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={studentForm.gender || 'Nam'}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  value={studentForm.fullName || ''}
                  onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                  placeholder="VD: Nguyễn Thành Nam"
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={studentForm.dob || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, dob: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng thái</label>
                  <select
                    value={studentForm.status || 'Đang học'}
                    onChange={(e) => setStudentForm({ ...studentForm, status: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="Đang học">Đang học</option>
                    <option value="Cần hỗ trợ">Cần hỗ trợ</option>
                    <option value="Nghỉ học">Nghỉ học</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">SĐT Phụ huynh</label>
                <input
                  type="text"
                  value={studentForm.parentPhone || ''}
                  onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
                  placeholder="0912 345 678"
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú năng lực / hỗ trợ</label>
                <textarea
                  rows={2}
                  value={studentForm.notes || ''}
                  onChange={(e) => setStudentForm({ ...studentForm, notes: e.target.value })}
                  placeholder="Ghi chú điểm mạnh, năng lực Vật lý hoặc cần bồi dưỡng..."
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditingStudent(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveStudent}
                className="px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800"
              >
                Lưu học sinh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
