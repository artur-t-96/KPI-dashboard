import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Users, TrendingUp, Briefcase, Settings, LogOut, Menu, X,
  ChevronDown, Sun, Moon
} from 'lucide-react';

const navigation = [
  { name: 'Body Leasing', href: '/', icon: Users, color: 'text-blue-600' },
  { name: 'Sprzedaż', href: '/sales', icon: TrendingUp, color: 'text-green-600' },
  { name: 'Rada Nadzorcza', href: '/board', icon: Briefcase, color: 'text-slate-600' },
];

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 64 64" className="text-white">
                    <rect x="12" y="10" width="40" height="36" rx="8" fill="currentColor" />
                    <rect x="16" y="14" width="32" height="28" rx="4" fill="white" opacity="0.9" />
                    <rect x="20" y="48" width="24" height="8" rx="2" fill="currentColor" />
                  </svg>
                </div>
                <div className="hidden sm:block">
                  <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>KPI Dashboard</h1>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>B2B Network</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? isDark ? 'bg-blue-900 text-blue-400' : 'bg-blue-50 text-blue-600'
                        : isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? item.color : ''}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-700 text-yellow-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title={isDark ? 'Tryb dzienny' : 'Tryb nocny'}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {isAuthenticated && user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/admin'
                      ? isDark ? 'bg-purple-900 text-purple-400' : 'bg-purple-50 text-purple-600'
                      : isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Admin
                </Link>
              )}

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className={`hidden sm:block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {user?.username}
                    </span>
                    <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-20 ${
                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                        <div className={`p-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.username}</p>
                          <p className={`text-xs capitalize ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user?.role}</p>
                        </div>
                        {user?.role === 'admin' && (
                          <Link
                            to="/admin"
                            className={`flex items-center gap-2 px-3 py-2 text-sm sm:hidden ${
                              isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Settings className="w-4 h-4" />
                            Panel admina
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className={`flex items-center gap-2 w-full px-3 py-2 text-sm ${
                            isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <LogOut className="w-4 h-4" />
                          Wyloguj się
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Zaloguj się
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                {mobileMenuOpen ? (
                  <X className={`w-6 h-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                ) : (
                  <Menu className={`w-6 h-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-t ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="px-4 py-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                      isActive
                        ? isDark ? 'bg-blue-900 text-blue-400' : 'bg-blue-50 text-blue-600'
                        : isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? item.color : ''}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t mt-auto`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className={`flex flex-col sm:flex-row justify-between items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>© 2025 B2B Network S.A. Wszystkie prawa zastrzeżone.</p>
            <p className="flex items-center gap-1">
              Powered by <span className="font-semibold text-blue-600">Mindy AI</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
