import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  FileCheck2,
  BookOpenCheck,
  Presentation,
  CheckSquare,
  Award,
  Sparkles,
  BarChart3,
  Settings,
  Atom,
  ChevronRight,
  UserCheck,
  ArrowLeftRight,
  BookOpen,
  X
} from 'lucide-react';
import { UserRole } from '../types';

export type NavTab =
  | 'dashboard'
  | 'classes'
  | 'students'
  | 'exams'
  | 'lessons'
  | 'slides'
  | 'assignments'
  | 'gradebook'
  | 'ai-assistant'
  | 'analytics'
  | 'settings'
  | 'student-portal';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  badgeCounts: {
    exams: number;
    lessons: number;
    slides: number;
    assignments: number;
    students: number;
  };
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  badgeCounts,
  activeRole,
  onRoleChange,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const teacherNavItems = [
    { id: 'dashboard' as NavTab, label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'classes' as NavTab, label: 'Quản lý lớp học', icon: GraduationCap },
    { id: 'students' as NavTab, label: 'Quản lý học sinh', icon: Users, badge: badgeCounts.students },
    { id: 'exams' as NavTab, label: 'Quản lý đề thi', icon: FileCheck2, badge: badgeCounts.exams },
    { id: 'lessons' as NavTab, label: 'Quản lý giáo án', icon: BookOpenCheck, badge: badgeCounts.lessons },
    { id: 'slides' as NavTab, label: 'Slide bài giảng', icon: Presentation, badge: badgeCounts.slides },
    { id: 'assignments' as NavTab, label: 'Quản lý bài tập', icon: CheckSquare, badge: badgeCounts.assignments },
    { id: 'gradebook' as NavTab, label: 'Quản lý điểm', icon: Award },
    { id: 'ai-assistant' as NavTab, label: 'Trợ lý AI Vật lý', icon: Sparkles, isHighlight: true },
    { id: 'analytics' as NavTab, label: 'Báo cáo thống kê', icon: BarChart3 },
    { id: 'settings' as NavTab, label: 'Cài đặt hệ thống', icon: Settings },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleRoleToggle = () => {
    const nextRole = activeRole === 'teacher' ? 'student' : 'teacher';
    onRoleChange(nextRole);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderNavContent = (isMobileView: boolean, isCollapsed: boolean) => (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800 justify-between shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Atom className="w-5 h-5 text-white" />
          </div>
          {(!isCollapsed || isMobileView) && (
            <div className="truncate">
              <span className="font-bold text-sm tracking-wide text-white block">PHYSICS ASSISTANT</span>
              <span className="text-[10px] text-sky-400 font-medium block">
                {activeRole === 'student' ? 'Cổng Học Sinh THPT' : 'Trợ lý Giáo viên THPT'}
              </span>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        {isMobileView && (
          <button
            onClick={onCloseMobile}
            className="p-2 -mr-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role Indicator Banner */}
      {(!isCollapsed || isMobileView) && (
        <div className="px-3 py-2.5 mx-3 my-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{activeRole === 'teacher' ? '👨‍🏫' : '👨‍🎓'}</span>
            <div>
              <p className="font-bold text-white text-[12px]">
                {activeRole === 'teacher' ? 'Quyền Giảng viên' : 'Quyền Học sinh'}
              </p>
              <p className="text-[10px] text-slate-400">
                {activeRole === 'teacher' ? 'Quản trị dạy học & chấm điểm' : 'Nộp bài & xem điểm cá nhân'}
              </p>
            </div>
          </div>
          <button
            onClick={handleRoleToggle}
            className="p-1.5 hover:bg-slate-700 text-sky-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Đổi vai trò Giảng viên / Học sinh"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-2 px-2.5 space-y-1">
        {activeRole === 'teacher' ? (
          teacherNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed && !isMobileView ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all cursor-pointer min-h-[42px] ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : item.isHighlight
                    ? 'text-amber-300 hover:bg-slate-800/80 hover:text-amber-200'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? 'text-white'
                      : item.isHighlight
                      ? 'text-amber-400 animate-pulse'
                      : 'text-slate-400'
                  }`}
                />
                {(!isCollapsed || isMobileView) && (
                  <span className="flex-1 text-left truncate flex items-center justify-between">
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.isHighlight && !isActive && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 rounded uppercase tracking-wider font-semibold">
                        AI
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })
        ) : (
          <div className="space-y-1.5">
            <button
              onClick={() => handleNavClick('student-portal')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer bg-blue-600 text-white shadow-md`}
            >
              <CheckSquare className="w-4 h-4 text-white shrink-0" />
              {(!isCollapsed || isMobileView) && <span>Cổng học tập &amp; Nộp bài</span>}
            </button>
          </div>
        )}
      </nav>

      {/* Switch role bottom button */}
      <div className="p-3 border-t border-slate-800 space-y-2 shrink-0">
        {activeRole === 'teacher' ? (
          <button
            onClick={() => {
              onRoleChange('student');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-700/30 to-indigo-700/30 hover:from-blue-700/50 hover:to-indigo-700/50 border border-blue-500/40 text-sky-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isCollapsed && !isMobileView ? 'px-0' : ''
            }`}
            title="Đóng vai Học sinh nộp bài tập"
          >
            <span className="text-sm">👨‍🎓</span>
            {(!isCollapsed || isMobileView) && <span>Xem cổng Học sinh nộp bài</span>}
          </button>
        ) : (
          <button
            onClick={() => {
              onRoleChange('teacher');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isCollapsed && !isMobileView ? 'px-0' : ''
            }`}
            title="Quay lại quyền Giảng viên"
          >
            <UserCheck className="w-4 h-4 text-sky-400" />
            {(!isCollapsed || isMobileView) && <span>Quay lại Giảng viên</span>}
          </button>
        )}

        {/* Desktop Collapse Sidebar Button */}
        {!isMobileView && (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center py-1.5 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-300 ${
                isCollapsed ? '' : 'rotate-180'
              }`}
            />
            {!isCollapsed && <span className="ml-1">Thu gọn menu</span>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR (hidden on mobile, visible md and up) */}
      <aside
        className={`hidden md:flex bg-slate-900 text-slate-200 transition-all duration-300 flex-col shrink-0 border-r border-slate-800 select-none ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {renderNavContent(false, collapsed)}
      </aside>

      {/* MOBILE DRAWER (overlay for screens < md) */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Offcanvas Drawer panel */}
          <aside
            className="relative w-72 max-w-[85vw] h-full bg-slate-900 text-slate-200 flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-250 border-r border-slate-800 select-none"
          >
            {renderNavContent(true, false)}
          </aside>
        </div>
      )}
    </>
  );
};
