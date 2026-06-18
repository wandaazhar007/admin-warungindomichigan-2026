import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 ml-60 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
