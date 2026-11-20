import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { Users, LayoutDashboard, Receipt, Bell, LogOut, UserPlus, Menu, X, School, PlusCircle, UserCog, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { useAuthStore } from './store/auth.store';
import { useSettingsStore } from './store/settings.store';

import Login from './features/auth/Login';
// import Profile from './features/auth/Profile'; // 🔥 Abhi ke liye Profile import band kar diya hai
import StudentList from './features/students/StudentList';
import StudentForm from './features/students/StudentForm';
import FeeCollection from './features/fees/FeeCollection';
import ClassList from './features/classes/ClassList';
import ClassForm from './features/classes/ClassForm';
import TeacherList from './features/teachers/TeacherList';
import TeacherForm from './features/teachers/TeacherForm';
import Reports from './features/reports/Reports';
import Dashboard from './features/dashboard/Dashboard';
import SettingsPage from './features/settings/SettingsPage';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 p-3 rounded-lg transition-all ${
      isActive 
        ? 'bg-emerald-800 font-semibold shadow-inner text-white' 
        : 'hover:bg-emerald-800/50 text-emerald-100'
    }`;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-urdu relative overflow-x-hidden">
      
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeSidebar} />
      )}

      <aside className={`w-72 bg-emerald-950 text-white shadow-2xl flex flex-col fixed h-full z-50 right-0 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}>
        <div className="p-6 text-center border-b border-emerald-800 bg-emerald-900 relative">
          <button onClick={closeSidebar} className="absolute top-4 left-4 md:hidden text-emerald-300 hover:text-white">
            <X size={28} />
          </button>
          <h1 className="text-2xl font-bold">{settings?.madarsaName || 'مدرسہ فیض القرآن'}</h1>
          <p className="text-emerald-400 text-sm mt-2">فیس مینجمنٹ سسٹم</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-2 overflow-y-auto">
          <NavLink to="/" onClick={closeSidebar} className={navLinkClass}>
            <LayoutDashboard size={22} />
            <span className="text-lg">ڈیش بورڈ</span>
          </NavLink>
          
          <NavLink to="/students" onClick={closeSidebar} className={navLinkClass}>
            <Users size={22} />
            <span className="text-lg">طلباء کی فہرست</span>
          </NavLink>

          {(user.role === 'admin' || user.permissions?.canRegisterStudent) && (
            <NavLink to="/students/new" onClick={closeSidebar} className={navLinkClass}>
              <UserPlus size={22} />
              <span className="text-lg">نیا داخلہ فارم</span>
            </NavLink>
          )}
          
          {(user.role === 'admin' || user.permissions?.canCollectFee) && (
            <NavLink to="/fees" onClick={closeSidebar} className={navLinkClass}>
              <Receipt size={22} />
              <span className="text-lg">فیس وصولی</span>
            </NavLink>
          )}

          {(user.role === 'admin' || user.permissions?.canManageClasses) && (
            <>
              <div className="border-t border-emerald-800 my-4"></div>
              <NavLink to="/classes" onClick={closeSidebar} className={navLinkClass}>
                <School size={22} />
                <span className="text-lg">کلاسز اور فیس</span>
              </NavLink>
              <NavLink to="/classes/new" onClick={closeSidebar} className={navLinkClass}>
                <PlusCircle size={22} />
                <span className="text-lg">نئی کلاس بنائیں</span>
              </NavLink>
            </>
          )}

          {user.role === 'admin' && (
            <>
              <div className="border-t border-emerald-800 my-4"></div>
              <NavLink to="/reports" onClick={closeSidebar} className={navLinkClass}>
                <BarChart3 size={22} />
                <span className="text-lg">رپورٹس</span>
              </NavLink>
              <NavLink to="/teachers" onClick={closeSidebar} className={navLinkClass}>
                <UserCog size={22} />
                <span className="text-lg">اساتذہ (Teachers)</span>
              </NavLink>
              <NavLink to="/settings" onClick={closeSidebar} className={navLinkClass}>
                <SettingsIcon size={22} />
                <span className="text-lg">سیٹنگز (Settings)</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-emerald-800">
          <button onClick={handleLogout} className="flex items-center gap-3 p-3 w-full rounded-lg hover:bg-red-600 transition-colors text-red-200 hover:text-white">
            <LogOut size={22} />
            <span className="text-lg">لاگ آؤٹ</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 md:mr-72 flex flex-col min-h-screen w-full transition-all duration-300">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 border-b border-gray-200 w-full">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-md">
              <Menu size={26} />
            </button>
            <div className="text-gray-600 font-semibold text-sm md:text-lg hidden sm:block">
              خوش آمدید، {user.name} ({user.role === 'admin' ? 'منتظم' : 'استاد'})
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <button className="p-2 rounded-full hover:bg-gray-100 relative text-gray-600">
              <Bell size={22} />
              <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            {/* 🔥 Avatar ab clickable nahi hai (onClick hata diya hai) */}
            <div 
              className="w-9 h-9 md:w-10 md:h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg select-none"
            >
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 flex-1 w-full overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            {/* <Route path="/profile" element={<Profile />} /> 🔥 Profile Route Comment Out */}
            <Route path="/students" element={<StudentList />} />
            <Route path="/students/new" element={<StudentForm />} />
            <Route path="/students/edit/:id" element={<StudentForm />} />
            <Route path="/fees" element={<FeeCollection />} />
            <Route path="/classes" element={<ClassList />} />
            <Route path="/classes/new" element={<ClassForm />} />
            <Route path="/classes/edit/:id" element={<ClassForm />} />
            <Route path="/teachers" element={<TeacherList />} />
            <Route path="/teachers/new" element={<TeacherForm />} />
            <Route path="/teachers/edit/:id" element={<TeacherForm />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}