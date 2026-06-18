import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  DollarSign, ShoppingBag, Clock, AlertTriangle,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import api from '@/lib/api';
import type { DashboardStats } from '@/types';

function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 truncate">{label}</p>
          <p className="text-xl sm:text-2xl font-display font-semibold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function formatChartDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 sm:h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 sm:h-72 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display font-semibold text-xl sm:text-2xl text-gray-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={formatPrice(stats?.totalRevenue ?? 0)}
          sub="Semua waktu"
          color="bg-red-500"
        />
        <StatCard
          icon={ShoppingBag}
          label="Pesanan Hari Ini"
          value={stats?.ordersToday ?? 0}
          color="bg-blue-500"
        />
        <StatCard
          icon={Clock}
          label="Pesanan Pending"
          value={stats?.pendingOrders ?? 0}
          sub="Perlu diproses"
          color="bg-yellow-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="Stok Menipis"
          value={stats?.lowStockCount ?? 0}
          sub="Di bawah minStok"
          color="bg-orange-500"
        />
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
        <h2 className="font-semibold text-gray-900 mb-4 sm:mb-6 text-sm sm:text-base">
          Revenue 7 Hari Terakhir
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats?.revenueByDay ?? []} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
            <XAxis
              dataKey="date"
              tickFormatter={formatChartDate}
              tick={{ fontSize: 11, fill: '#71717A' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `$${v}`}
              tick={{ fontSize: 11, fill: '#71717A' }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              formatter={(value: number) => [formatPrice(value), 'Revenue']}
              labelFormatter={formatChartDate}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #E4E4E7',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="revenue" fill="#E86363" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top products */}
      {stats && stats.topProducts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">
            Top 5 Produk (Revenue)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Produk</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Terjual</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.topProducts.map((p, i) => (
                  <tr key={i}>
                    <td className="py-3 text-gray-900 pr-4">{p.productName}</td>
                    <td className="py-3 text-right text-gray-600">{p.qty}</td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      {formatPrice(p.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
