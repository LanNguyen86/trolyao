import React, { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  Database,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  History,
  Save,
  Server
} from 'lucide-react';
import { UserProfile, GradingScheme, AuditLog } from '../types';
import { storage } from '../services/storage';

interface SettingsViewProps {
  user: UserProfile;
  gradingScheme: GradingScheme;
  logs: AuditLog[];
  onUpdateUser: (user: UserProfile) => void;
  onUpdateScheme: (scheme: GradingScheme) => void;
  onResetAllData: () => void;
  onLog: (action: string, module: string, detail: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  gradingScheme,
  logs,
  onUpdateUser,
  onUpdateScheme,
  onResetAllData,
  onLog
}) => {
  const [profileForm, setProfileForm] = useState<UserProfile>(user);
  const [schemeForm, setSchemeForm] = useState<GradingScheme>(gradingScheme);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveProfile = () => {
    onUpdateUser(profileForm);
    onLog('Cập nhật hồ sơ', 'Cài đặt', 'Cập nhật thông tin giảng viên');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSaveScheme = () => {
    onUpdateScheme(schemeForm);
    onLog('Cập nhật hệ số điểm', 'Cài đặt', 'Lưu thay đổi trọng số tính điểm GDPT');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Export full JSON backup
  const handleExportBackup = () => {
    const backupData = {
      user: storage.getUser(),
      classes: storage.getClasses(),
      students: storage.getStudents(),
      exams: storage.getExams(),
      lessons: storage.getLessons(),
      slides: storage.getSlides(),
      assignments: storage.getAssignments(),
      submissions: storage.getSubmissions(),
      grades: storage.getGrades(),
      scheme: storage.getGradingScheme(),
      backupAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Physics_Assistant_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onLog('Sao lưu dữ liệu', 'Hệ thống', 'Xuất file sao lưu dữ liệu toàn bộ hệ thống');
  };

  // Restore backup
  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.classes && parsed.exams) {
          storage.saveClasses(parsed.classes);
          storage.saveStudents(parsed.students || []);
          storage.saveExams(parsed.exams);
          storage.saveLessons(parsed.lessons || []);
          storage.saveSlides(parsed.slides || []);
          storage.saveAssignments(parsed.assignments || []);
          storage.saveSubmissions(parsed.submissions || []);
          storage.saveGrades(parsed.grades || []);
          if (parsed.scheme) storage.saveGradingScheme(parsed.scheme);
          if (parsed.user) storage.setUser(parsed.user);

          alert('Khôi phục dữ liệu sao lưu thành công! Trang sẽ tải lại...');
          window.location.reload();
        } else {
          alert('Tệp sao lưu không đúng định dạng!');
        }
      } catch (err: any) {
        alert('Lỗi đọc tệp sao lưu: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Teacher Profile Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-700" />
            <h3 className="text-base font-bold text-slate-800">Thông tin Giảng viên / Tài khoản</h3>
          </div>
          {isSaved && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Đã lưu thành công
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Họ và tên giảng viên</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email công tác</label>
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Chức danh / Vai trò</label>
            <input
              type="text"
              value={profileForm.title}
              onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Đơn vị trường học</label>
            <input
              type="text"
              value={profileForm.school}
              onChange={(e) => setProfileForm({ ...profileForm, school: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveProfile}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs md:text-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            Lưu hồ sơ giảng viên
          </button>
        </div>
      </div>

      {/* Grading Weights Scheme */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Shield className="w-5 h-5 text-indigo-700" />
          <h3 className="text-base font-bold text-slate-800">
            Cấu hình Trọng số Tính Điểm &amp; Xếp loại Học tập
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs md:text-sm">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block font-semibold text-slate-700 mb-1">Hệ số Thường xuyên (TX)</label>
            <input
              type="number"
              value={schemeForm.txWeight}
              onChange={(e) => setSchemeForm({ ...schemeForm, txWeight: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded-lg text-center font-bold"
            />
            <p className="text-[11px] text-slate-500 mt-1">Đầu điểm 15p, bài tập, thực hành</p>
          </div>

          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
            <label className="block font-semibold text-blue-900 mb-1">Hệ số Giữa kỳ (GK)</label>
            <input
              type="number"
              value={schemeForm.gkWeight}
              onChange={(e) => setSchemeForm({ ...schemeForm, gkWeight: Number(e.target.value) })}
              className="w-full p-2 border border-blue-300 rounded-lg text-center font-bold text-blue-800"
            />
            <p className="text-[11px] text-slate-500 mt-1">Theo Thông tư 22: Hệ số 2</p>
          </div>

          <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200">
            <label className="block font-semibold text-purple-900 mb-1">Hệ số Cuối kỳ (CK)</label>
            <input
              type="number"
              value={schemeForm.ckWeight}
              onChange={(e) => setSchemeForm({ ...schemeForm, ckWeight: Number(e.target.value) })}
              className="w-full p-2 border border-purple-300 rounded-lg text-center font-bold text-purple-800"
            />
            <p className="text-[11px] text-slate-500 mt-1">Theo Thông tư 22: Hệ số 3</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveScheme}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-lg text-xs md:text-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            Cập nhật quy tắc tính điểm
          </button>
        </div>
      </div>

      {/* Cloud & Local Data Management */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Database className="w-5 h-5 text-emerald-700" />
          <h3 className="text-base font-bold text-slate-800">Quản trị Lưu trữ &amp; Dữ liệu</h3>
        </div>

        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs md:text-sm text-emerald-950 flex items-start gap-3">
          <Server className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Trạng thái Cơ sở dữ liệu: Hoạt động cục bộ &amp; Sẵn sàng Cloud</p>
            <p className="text-slate-600 mt-1">
              Toàn bộ dữ liệu lớp học, học sinh, đề thi, giáo án, slide bài giảng, bài tập và điểm số được lưu trữ an toàn trong LocalStorage trình duyệt của Thầy/Cô. Khi cấu hình dịch vụ Firebase Cloud Firestore, hệ thống sẽ tự động đồng bộ lên đám mây.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportBackup}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs md:text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600" />
            Sao lưu dữ liệu ra JSON
          </button>

          <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs md:text-sm flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-600" />
            Khôi phục từ tệp JSON
            <input type="file" accept=".json" onChange={handleRestoreBackup} className="hidden" />
          </label>

          <button
            onClick={() => {
              if (
                confirm(
                  'CẢNH BÁO: Hành động này sẽ đặt lại toàn bộ hệ thống về dữ liệu mẫu THPT ban đầu (3 lớp, 24 học sinh, 10 đề thi, 10 giáo án, 10 slide, 15 bài tập). Tiếp tục?'
                )
              ) {
                onResetAllData();
              }
            }}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-lg text-xs md:text-sm flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <RefreshCw className="w-4 h-4 text-rose-600" />
            Khôi phục dữ liệu mẫu ban đầu
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-600" />
          <h3 className="font-bold text-slate-800 text-sm">Nhật ký kiểm tra (Audit Logs)</h3>
        </div>

        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                <th className="py-2.5 px-3 w-36">Thời gian</th>
                <th className="py-2.5 px-3 w-28">Phân hệ</th>
                <th className="py-2.5 px-3 w-32">Thao tác</th>
                <th className="py-2.5 px-3">Chi tiết thực hiện</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-slate-500">{log.timestamp}</td>
                  <td className="py-2.5 px-3 font-semibold text-blue-700">{log.module}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">{log.action}</td>
                  <td className="py-2.5 px-3 text-slate-600">{log.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
