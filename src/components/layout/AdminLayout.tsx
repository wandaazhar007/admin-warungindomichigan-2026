import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="font-display font-semibold text-gray-900 text-sm leading-tight">Warung IndoMi</p>
          <p className="text-xs text-red-500 font-medium leading-none">Admin Panel</p>
        </div>
      </header>

      {/* Sidebar overlay backdrop on mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-60 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
