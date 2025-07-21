import React, { useState, useEffect } from 'react';
import {
  Building2,
  LogOut,
  ShoppingCart,
  DollarSign,
  Package,
  Truck,
  Users,
  FileText,
  Search,
  BarChart3,
  Menu,
  X,
  Bell,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  Volume2,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle
} from 'lucide-react';
import { User, Business, Permission } from '../types';
import { getUserBusinessByEmail, hasPermission } from '../utils/businessUtils';
import OrderSection from './sections/OrderSection';
import RateSection from './sections/RateSection';
import InventorySection from './sections/InventorySection';
import SupplierSection from './sections/SupplierSection';
import StaffSection from './sections/StaffSection';
import StaffManagement from './StaffManagement';
import FindSection from './sections/FindSection';
import AccountSection from './sections/AccountSection';
import ReportsSection from './sections/ReportsSection';
import { UserDataProvider } from './UserDataProvider';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

type Section = 'orders' | 'rates' | 'inventory' | 'suppliers' | 'staff' | 'staff-management' | 'accounts' | 'find' | 'reports';

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState<Section>('orders');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    createdAt: string;
  }>>([]);

  useEffect(() => {
    // Set default preferences (no localStorage)
    const savedTheme = 'light' as 'light' | 'dark';
    const savedNotifications = false;
    const savedLanguage = 'en';
    const savedAlerts: any[] = [];

    setTheme(savedTheme);
    setNotifications(savedNotifications);
    setLanguage(savedLanguage);
    setAlerts(savedAlerts);

    // Apply theme to document
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');

    // Load business and user permissions
    const userBusiness = getUserBusinessByEmail(user.email);
    setBusiness(userBusiness);

    if (userBusiness) {
      // Check if user is business owner by email (more reliable than user.isBusinessOwner)
      const isBusinessOwner = userBusiness.ownerEmail === user.email;

      if (isBusinessOwner) {
        // Business owner has all permissions
        setUserPermissions([
          { module: 'dashboard', actions: ['read', 'create', 'update', 'delete'] },
          { module: 'orders', actions: ['read', 'create', 'update', 'delete'] },
          { module: 'inventory', actions: ['read', 'create', 'update', 'delete'] },
          { module: 'staff', actions: ['read', 'create', 'update', 'delete'] },
          { module: 'rates', actions: ['read', 'create', 'update', 'delete'] },
          { module: 'suppliers', actions: ['read', 'create', 'update', 'delete'] },
          { module: 'customers', actions: ['read', 'create', 'update', 'delete'] }
        ]);
      } else {
        // Staff member - get permissions from their role
        const staffMember = userBusiness.staff.find(s => s.email === user.email);
        if (staffMember) {
          setUserPermissions(staffMember.permissions);
        }
      }
    }
  }, [user.email]);

  const savePreferences = () => {
    // Preferences saved in memory only
    document.documentElement.classList.toggle('dark', theme === 'dark');
  };

  const addAlert = (type: 'info' | 'warning' | 'error' | 'success', title: string, message: string) => {
    const newAlert = {
      id: Date.now().toString(),
      type,
      title,
      message,
      createdAt: new Date().toISOString()
    };
    const updatedAlerts = [newAlert, ...alerts].slice(0, 50); // Keep only last 50 alerts
    setAlerts(updatedAlerts);
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  // Filter menu items based on user permissions
  const getAllMenuItems = () => [
    { id: 'orders', label: 'Orders', icon: ShoppingCart, module: 'orders' as const },
    { id: 'rates', label: 'Rates', icon: DollarSign, module: 'rates' as const },
    { id: 'inventory', label: 'Inventory', icon: Package, module: 'inventory' as const },
    { id: 'suppliers', label: 'Suppliers', icon: Truck, module: 'suppliers' as const },
    { id: 'staff', label: 'Staff', icon: Users, module: 'staff' as const },
    { id: 'staff-management', label: 'Team Management', icon: Shield, module: 'staff' as const, ownerOnly: true },
    { id: 'accounts', label: 'Account Of', icon: FileText, module: 'customers' as const },
    { id: 'find', label: 'Find', icon: Search, module: 'dashboard' as const },
    { id: 'reports', label: 'Reports', icon: BarChart3, module: 'dashboard' as const },
  ];

  const menuItems = getAllMenuItems().filter(item => {
    // Check if user is business owner by email
    const isBusinessOwner = business?.ownerEmail === user.email;

    // Show all items to business owner
    if (isBusinessOwner) return true;

    // Hide owner-only items from staff
    if (item.ownerOnly && !isBusinessOwner) return false;

    // Check if user has read permission for this module
    return hasPermission(userPermissions, item.module, 'read');
  });

  const renderSection = () => {
    switch (activeSection) {
      case 'orders':
        return <OrderSection user={user} userPermissions={userPermissions} />;
      case 'rates':
        return <RateSection user={user} userPermissions={userPermissions} />;
      case 'inventory':
        return <InventorySection user={user} userPermissions={userPermissions} />;
      case 'suppliers':
        return <SupplierSection user={user} />;
      case 'staff':
        return <StaffSection user={user} />;
      case 'staff-management':
        return <StaffManagement user={user} />;
      case 'accounts':
        return <AccountSection user={user} />;
      case 'find':
        return <FindSection user={user} />;
      case 'reports':
        return <ReportsSection user={user} />;
      default:
        return <OrderSection user={user} userPermissions={userPermissions} />;
    }
  };

  return (
    <UserDataProvider user={user}>
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50'} flex transition-colors duration-300`}>
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 ${theme === 'dark' ? 'bg-gray-800' : 'glass-cream'} shadow-elegant transform transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}>
          <div className={`flex items-center justify-between h-20 px-6 border-b ${theme === 'dark' ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-amber-200/50 bg-gradient-to-r from-amber-500 to-orange-600'}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-white to-amber-50 rounded-xl flex items-center justify-center shadow-warm">
                <Building2 className="h-6 w-6 text-amber-600" />
              </div>
              <span className="text-2xl font-display font-bold text-white">Vyapaal</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className={`px-6 py-6 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-amber-200/50 bg-white/30'}`}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-warm">
                <span className="text-white font-bold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{user.name}</p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{user.email}</p>
                {business && (
                  <p className={`text-xs font-bold ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'} mt-1`}>
                    {business.businessName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Navigation */}
          <div className="flex-1 flex flex-col min-h-0">
            <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-transparent">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id as Section);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-4 px-4 py-4 text-left rounded-2xl transition-elegant mb-3 group ${activeSection === item.id
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-warm transform scale-105'
                      : theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-700 hover:bg-white/60 hover:shadow-warm'
                      }`}
                  >
                    <Icon className={`h-6 w-6 transition-transform group-hover:scale-110 ${activeSection === item.id ? 'text-white' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                    <span className="font-medium text-base">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Logout Button - Fixed at bottom */}
            <div className={`p-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-amber-200/50'} flex-shrink-0`}>
              <button
                onClick={onLogout}
                className={`w-full flex items-center space-x-4 px-4 py-4 rounded-2xl transition-elegant group ${theme === 'dark'
                  ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300'
                  : 'text-red-600 hover:bg-red-50 hover:shadow-warm'
                  }`}
              >
                <LogOut className="h-6 w-6 transition-transform group-hover:scale-110" />
                <span className="font-medium text-base">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          {/* Header */}
          <header className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'glass-cream border-amber-200/50'} shadow-elegant border-b sticky top-0 z-30`}>
            <div className="flex items-center justify-between h-20 px-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className={`lg:hidden p-3 rounded-xl transition-colors ${theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-amber-700 hover:bg-white/60'
                    }`}
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div>
                  <h1 className={`text-3xl font-display font-bold ${theme === 'dark' ? 'text-white' : 'gradient-text-warm'} capitalize`}>
                    {activeSection === 'accounts' ? 'Account Of' : activeSection}
                  </h1>
                  <p className={`text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Manage your business efficiently</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowAlertsModal(true)}
                  className={`relative p-3 rounded-xl transition-elegant ${theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-amber-700 hover:bg-white/60 hover:shadow-warm'
                    }`}
                >
                  <Bell className="h-6 w-6" />
                  {alerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {alerts.length > 9 ? '9+' : alerts.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowHelpModal(true)}
                  className={`p-3 rounded-xl transition-elegant ${theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-amber-700 hover:bg-white/60 hover:shadow-warm'
                    }`}
                >
                  <HelpCircle className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className={`p-3 rounded-xl transition-elegant ${theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-amber-700 hover:bg-white/60 hover:shadow-warm'
                    }`}
                >
                  <Settings className="h-6 w-6" />
                </button>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-medium`}>
                  {new Date().toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className={`p-8 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-orange-50/50 via-amber-50/50 to-yellow-50/50'} min-h-screen`}>
            {renderSection()}
          </main>
        </div>

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-8 w-full max-w-md shadow-elegant`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-2xl font-display font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Settings</h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Theme Setting */}
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                    Theme
                  </label>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-elegant ${theme === 'light'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-warm'
                        : theme === 'dark'
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      <Sun className="h-5 w-5" />
                      <span>Light</span>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-elegant ${theme === 'dark'
                        ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-warm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      <Moon className="h-5 w-5" />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>

                {/* Notifications Setting */}
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                    Notifications
                  </label>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-elegant ${notifications
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-warm'
                      : theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Volume2 className="h-5 w-5" />
                      <span>Push Notifications</span>
                    </div>
                    <span className="text-sm">{notifications ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                {/* Language Setting */}
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border transition-elegant ${theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700'
                      } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी</option>
                    <option value="mr">मराठी</option>
                    <option value="gu">ગુજરાતી</option>
                  </select>
                </div>

                {/* Save Button */}
                <button
                  onClick={() => {
                    savePreferences();
                    setShowSettingsModal(false);
                    addAlert('success', 'Settings Saved', 'Your preferences have been updated successfully.');
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-4 rounded-xl font-semibold transition-elegant shadow-warm"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alerts Modal */}
        {showAlertsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-8 w-full max-w-lg shadow-elegant max-h-[80vh] overflow-hidden`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-2xl font-display font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  Alerts & Notifications
                </h3>
                <div className="flex items-center space-x-2">
                  {alerts.length > 0 && (
                    <button
                      onClick={clearAlerts}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setShowAlertsModal(false)}
                    className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-96">
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className={`h-16 w-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} />
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No alerts yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-2xl border-l-4 ${alert.type === 'success' ? 'border-green-500 bg-green-50' :
                          alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                            alert.type === 'error' ? 'border-red-500 bg-red-50' :
                              'border-blue-500 bg-blue-50'
                          } ${theme === 'dark' ? 'bg-opacity-10' : ''}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {alert.type === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
                            {alert.type === 'warning' && <AlertTriangle className="h-6 w-6 text-yellow-500" />}
                            {alert.type === 'error' && <XCircle className="h-6 w-6 text-red-500" />}
                            {alert.type === 'info' && <Info className="h-6 w-6 text-blue-500" />}
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                              {alert.title}
                            </h4>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                              {alert.message}
                            </p>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                              {new Date(alert.createdAt).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Help Modal */}
        {showHelpModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-8 w-full max-w-lg shadow-elegant`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-2xl font-display font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  Help & Support
                </h3>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Quick Help</h4>
                  <div className="space-y-3">
                    {[
                      { title: 'How to add a new order?', desc: 'Click the "Add Order" button in the Orders section' },
                      { title: 'How to track payments?', desc: 'Use the Account Of section to view customer payment history' },
                      { title: 'How to manage inventory?', desc: 'Go to Inventory section to add/update stock levels' },
                      { title: 'How to generate reports?', desc: 'Visit the Reports section for detailed analytics' }
                    ].map((item, index) => (
                      <div key={index} className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h5 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{item.title}</h5>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1`}>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-center`}>
                    Need more help? Contact us at{' '}
                    <a href="mailto:support@vyapaal.com" className="text-amber-600 hover:text-amber-700 font-medium">
                      support@vyapaal.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserDataProvider>
  );
};

export default Dashboard;