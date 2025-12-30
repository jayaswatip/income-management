import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowUpDown, 
  Target, 
  BarChart3, 
  Settings 
} from 'lucide-react';

const Sidebar = () => {
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: ArrowUpDown },
    { name: 'Budgets', href: '/budgets', icon: Target },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Profile', href: '/profile', icon: Settings },
  ];

  return (
    <div className="fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg border-r border-gray-200 pt-16">
      <div className="flex flex-col h-full">
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Finance Tracker v1.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
