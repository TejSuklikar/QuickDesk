import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home,
  Users, 
  FolderOpen, 
  FileText, 
  Receipt, 
  Mail, 
  FileImage,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  ChevronRight
} from 'lucide-react';

const Layout = ({ children, user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const mainNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, description: 'Overview & activity' },
    { name: 'Inbox', href: '/inbox', icon: Mail, description: 'Process client emails', highlight: true },
    { name: 'Projects', href: '/projects', icon: FolderOpen, description: 'Manage your work' },
    { name: 'Clients', href: '/clients', icon: Users, description: 'Client contacts' },
  ];

  const workflowNavigation = [
    { name: 'Contracts', href: '/contracts', icon: FileText, description: 'Agreements & signatures' },
    { name: 'Invoices', href: '/invoices', icon: Receipt, description: 'Billing & payments' },
  ];

  const settingsNavigation = [
    { name: 'Templates', href: '/templates', icon: FileImage, description: 'Document templates' },
    { name: 'Settings', href: '/settings', icon: Settings, description: 'Preferences & integrations' },
  ];

  const isActive = (href) => location.pathname === href;

  const NavSection = ({ title, items, showTitle = true }) => (
    <div className="mb-6">
      {showTitle && (
        <div className="px-3 mb-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </h3>
        </div>
      )}
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`
                group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${active 
                  ? 'bg-blue-50 text-blue-700 shadow-sm' 
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'}`} />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-slate-500 group-hover:text-slate-600">
                    {item.description}
                  </div>
                </div>
              </div>
              
              {active && (
                <ChevronRight className="w-4 h-4 text-blue-600" />
              )}
              
              {item.highlight && !active && (
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 shadow-lg
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        transition-transform duration-300 ease-in-out
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">FF</span>
              </div>
              <div>
                <span className="text-xl font-bold text-slate-900">FreeFlow</span>
                <div className="text-xs text-slate-500">AI Workflow</div>
              </div>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <NavSection items={mainNavigation} showTitle={false} />
            <NavSection title="Workflow" items={workflowNavigation} />
            <NavSection title="Manage" items={settingsNavigation} />
          </nav>

          {/* User Profile & Status */}
          <div className="border-t border-slate-200 p-4">
            {/* AI Status */}
            <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-800">AI Agents Active</span>
              </div>
              <div className="text-xs text-green-600 mt-1">
                Intake • Contract • Billing
              </div>
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.name || 'Demo User'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email || 'demo@freeflow.ai'}
                </p>
              </div>
            </div>
            
            {/* Sign Out */}
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 w-full px-3 py-2 mt-3 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div>
                <h1 className="text-xl font-semibold text-slate-900 capitalize">
                  {location.pathname.split('/')[1] || 'Dashboard'}
                </h1>
                <p className="text-sm text-slate-500">
                  {location.pathname === '/dashboard' && 'Monitor your AI workflow automation'}
                  {location.pathname === '/inbox' && 'Process client emails with AI'}
                  {location.pathname === '/projects' && 'Manage your client projects'}
                  {location.pathname === '/clients' && 'Your client relationships'}
                  {location.pathname === '/contracts' && 'Agreements and signatures'}
                  {location.pathname === '/invoices' && 'Billing and payments'}
                  {location.pathname === '/templates' && 'Document templates'}
                  {location.pathname === '/settings' && 'App preferences'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Quick Action Button */}
              <Link 
                to="/inbox"
                className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm font-medium">Process Email</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;