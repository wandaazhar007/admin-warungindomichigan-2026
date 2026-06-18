import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDateTime } from '@/lib/utils';
import api from '@/lib/api';
import type { Order, OrdersResponse, OrderStatus, PaymentStatus } from '@/types';

function orderStatusVariant(s: OrderStatus): 'default' | 'secondary' | 'success' | 'warning' | 'outline' {
  if (s === 'CONFIRMED' || s === 'DELIVERED') return 'success';
  if (s === 'CANCELLED' || s === 'REFUNDED') return 'secondary';
  if (s === 'PENDING') return 'warning';
  return 'default';
}

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING:    'Menunggu', CONFIRMED: 'Dikonfirmasi', PROCESSING: 'Diproses',
  SHIPPED:    'Dikirim',  DELIVERED: 'Terkirim',
  CANCELLED:  'Batal',   REFUNDED:  'Refund',
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: 'Belum Bayar', PAID: 'Lunas',
  PARTIALLY_REFUNDED: 'Sebagian Refund', REFUNDED: 'Refund', FAILED: 'Gagal',
};

export default function OrdersPage() {
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDB]    = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [paymentFilter, setPayment] = useState('');

  let timer: ReturnType<typeof setTimeout>;
  function handleSearch(v: string) {
    setSearch(v);
    clearTimeout(timer);
    timer = setTimeout(() => { setDB(v); setPage(1); }, 400);
  }

  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ['admin-orders', page, debouncedSearch, statusFilter, paymentFilter],
    queryFn: () =>
      api.get('/admin/orders', {
        params: {
          page, limit: 20,
          search:        debouncedSearch || undefined,
          status:        statusFilter || undefined,
          paymentStatus: paymentFilter || undefined,
        },
      }).then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display font-700 text-2xl text-gray-900">Pesanan</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari nomor / email…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 w-56"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="w-44"
        >
          <option value="">Semua Status</option>
          {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
          ))}
        </Select>
        <Select
          value={paymentFilter}
          onChange={(e) => { setPayment(e.target.value); setPage(1); }}
          className="w-44"
        >
          <option value="">Semua Pembayaran</option>
          {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((s) => (
            <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</option>
          ))}
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Nomor Pesanan</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Tanggal</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Pembayaran</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Total</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(data?.data as Order[]).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{order.orderNumber}</p>
                      {order.isGuestOrder && (
                        <span className="text-xs text-gray-400">Guest</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800">{order.email}</p>
                      <p className="text-xs text-gray-400">
                        {order.shipFirstName} {order.shipLastName}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={orderStatusVariant(order.status)}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={order.paymentStatus === 'PAID' ? 'success' : order.paymentStatus === 'FAILED' ? 'destructive' : 'warning'}>
                        {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatPrice(parseFloat(order.total))}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/orders/${order.orderNumber}`}
                        className="flex items-center justify-center"
                      >
                        <ChevronRight className="h-4 w-4 text-gray-400 hover:text-red-500 transition-colors" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      Tidak ada pesanan ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">{data.meta.total} pesanan total</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← Sebelumnya
              </Button>
              <span className="text-sm text-gray-500">{page} / {data.meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                Berikutnya →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
