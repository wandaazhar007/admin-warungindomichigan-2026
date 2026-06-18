import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, ShoppingBag, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOutAdmin } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/products',   icon: Package,         label: 'Produk'     },
  { to: '/categories', icon: Tag,             label: 'Kategori'   },
  { to: '/orders',     icon: ShoppingBag,     label: 'Pesanan'    },
];

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);

  async function handleSignOut() {
    await signOutAdmin();
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-200 flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="font-display font-700 text-gray-900 text-sm leading-tight">
          Warung Indo Michigan
        </p>
        <p className="text-xs text-red-500 font-medium mt-0.5">Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-red-50 text-red-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + signout */}
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 truncate mb-2">{user?.email}</p>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
