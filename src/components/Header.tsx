import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Plus,
  Atom,
  CheckCircle2,
  X,
  UserCheck
} from 'lucide-react';
import { UserProfile, AuditLog, UserRole, Student } from '../types';

interface HeaderProps {
  activeTabTitle: string;
  user: UserProfile;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onQuickAction: () => void;
  recentLogs: AuditLog[];
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeStudent?: Student;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTabTitle,
  user,
  searchQuery,
  onSearchChange,
  onQuickAction,
  recentLogs,
  activeRole,
  onRoleChange,
  activeStudent,
  onToggleMobileMenu
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 flex items-center justify-between shadow-2xs gap-2">
      {/* Left section: Hamburger (mobile), Logo (desktop), Tab Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile menu toggle button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 -ml-1 text-slate-700 hover:text-blue-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
          aria-label="Mở menu danh mục"
          title="Mở menu danh mục"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop brand logo */}
        <div className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg bg-blue-900 text-white font-bold shadow-xs shrink-0">
          <Atom className="w-5 h-5 animate-spin-slow text-sky-400" />
        </div>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 tracking-tight truncate max-w-[150px] sm:max-w-xs md:max-w-none">
            {activeTabTitle}
          </h1>
          <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block truncate">
            {activeRole === 'student'
              ? `Cổng nộp bài học sinh • ${activeStudent?.fullName || 'Học sinh'} (${activeStudent?.studentCode || 'HS'})`
              : 'GDPT 2018 • Khối 10, 11, 12 • Học kỳ I'}
          </p>
        </div>
      </div>

      {/* Center: Role Switcher Pill */}
      <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0">
        <button
          onClick={() => onRoleChange('teacher')}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
            activeRole === 'teacher'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Chuyển sang vai trò Giảng viên"
        >
          <span>👨‍🏫</span>
          <span className="hidden sm:inline">Giảng viên</span>
          <span className="sm:hidden text-[11px]">GV</span>
        </button>

        <button
          onClick={() => onRoleChange('student')}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
            activeRole === 'student'
              ? 'bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Chuyển sang vai trò Học sinh (Nộp bài tập về nhà)"
        >
          <span>👨‍🎓</span>
          <span className="hidden sm:inline">Học sinh (Nộp bài)</span>
          <span className="sm:hidden text-[11px]">Học sinh</span>
          {activeRole !== 'student' && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse hidden sm:inline-block" />
          )}
        </button>
      </div>

      {/* Global Search Bar (Only shown for teacher mode on large screens) */}
      {activeRole === 'teacher' && (
        <div className="flex-1 max-w-xs mx-3 hidden xl:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm nhanh..."
              className="w-full pl-8 pr-7 py-1 text-xs bg-slate-100 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-lg outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Right side: Quick Add Button, Notifications, User profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
        {/* Quick Add Button (For teacher) */}
        {activeRole === 'teacher' ? (
          <button
            onClick={onQuickAction}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-700 hover:bg-blue-800 active:scale-95 text-white text-xs md:text-sm font-medium rounded-lg shadow-sm transition-all cursor-pointer"
            title="Thao tác nhanh"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Thêm nhanh</span>
          </button>
        ) : (
          <button
            onClick={() => onRoleChange('teacher')}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-blue-800 text-xs font-bold rounded-lg border border-slate-200 transition-all cursor-pointer"
            title="Quay về vai trò Giảng viên"
          >
            <UserCheck className="w-4 h-4 text-blue-700" />
            <span className="hidden md:inline">Về Giảng viên</span>
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 sm:p-2 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Thông báo hoạt động"
            aria-label="Xem thông báo"
          >
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
            {recentLogs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="fixed left-3 right-3 sm:left-auto sm:right-0 top-14 sm:top-full mt-2 w-auto sm:w-80 md:w-96 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-3.5 text-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-xs sm:text-sm">Nhật ký hoạt động hệ thống</span>
                <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                  {recentLogs.length} ghi nhận
                </span>
              </div>
              <div className="max-h-64 sm:max-h-72 overflow-y-auto divide-y divide-slate-100 mt-2 text-xs">
                {recentLogs.slice(0, 6).map((log) => (
                  <div key={log.id} className="py-2 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-blue-700 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{log.action}: <span className="text-slate-600 font-normal">{log.detail}</span></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{log.timestamp} • {log.module}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User / Student Profile Avatar */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200">
          {activeRole === 'teacher' ? (
            <>
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                alt={user.name}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-blue-700/20"
              />
              <div className="hidden xl:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
                <p className="text-[10px] text-slate-500 leading-tight">{user.title}</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-900 font-bold flex items-center justify-center text-xs shadow-2xs">
                {activeStudent?.fullName.charAt(0) || 'H'}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {activeStudent?.fullName || 'Học sinh'}
                </p>
                <p className="text-[10px] text-blue-700 font-semibold leading-tight">
                  Lớp {activeStudent?.className || '10A1'} • {activeStudent?.studentCode}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
