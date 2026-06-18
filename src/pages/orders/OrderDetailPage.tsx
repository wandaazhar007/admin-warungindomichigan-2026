import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, ExternalLink, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDateTime } from '@/lib/utils';
import api from '@/lib/api';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

const STATUS_OPTIONS: OrderStatus[] = [
  'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED',
];
const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Menunggu Pembayaran', CONFIRMED: 'Dikonfirmasi', PROCESSING: 'Sedang Diproses',
  SHIPPED: 'Dalam Pengiriman', DELIVERED: 'Terkirim', CANCELLED: 'Dibatalkan', REFUNDED: 'Direfund',
};
const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  UNPAID: 'Belum Dibayar', PAID: 'Lunas',
  PARTIALLY_REFUNDED: 'Sebagian Refund', REFUNDED: 'Direfund', FAILED: 'Gagal',
};

function statusVariant(s: OrderStatus): 'default' | 'secondary' | 'success' | 'warning' {
  if (s === 'CONFIRMED' || s === 'DELIVERED') return 'success';
  if (s === 'CANCELLED' || s === 'REFUNDED') return 'secondary';
  if (s === 'PENDING') return 'warning';
  return 'default';
}

export default function OrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [newStatus, setNewStatus]       = useState('');
  const [statusNote, setStatusNote]     = useState('');
  const [trackingNum, setTrackingNum]   = useState('');
  const [trackingUrl, setTrackingUrl]   = useState('');
  const [adminNote, setAdminNote]       = useState('');
  const [actionError, setActionError]   = useState('');

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['admin-order', orderNumber],
    queryFn: () => api.get(`/admin/orders/${orderNumber}`).then((r) => r.data),
    enabled: !!orderNumber,
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['admin-order', orderNumber] });
    qc.invalidateQueries({ queryKey: ['admin-orders'] });
  }

  const statusMutation = useMutation({
    mutationFn: () => api.put(`/admin/orders/${orderNumber}/status`, { status: newStatus, note: statusNote || undefined }),
    onSuccess: () => { invalidate(); setNewStatus(''); setStatusNote(''); setActionError(''); },
    onError: (e: unknown) => setActionError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal update status.'),
  });

  const trackingMutation = useMutation({
    mutationFn: () => api.put(`/admin/orders/${orderNumber}/tracking`, { trackingNumber: trackingNum, trackingUrl: trackingUrl || undefined }),
    onSuccess: () => { invalidate(); setTrackingNum(''); setTrackingUrl(''); setActionError(''); },
    onError: (e: unknown) => setActionError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal update tracking.'),
  });

  const noteMutation = useMutation({
    mutationFn: () => api.put(`/admin/orders/${orderNumber}/note`, { adminNote }),
    onSuccess: () => { invalidate(); setActionError(''); },
    onError: (e: unknown) => setActionError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal simpan catatan.'),
  });

  const refundMutation = useMutation({
    mutationFn: () => api.post(`/admin/orders/${orderNumber}/refund`),
    onSuccess: () => { invalidate(); setActionError(''); },
    onError: (e: unknown) => setActionError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal proses refund.'),
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-gray-400" /></div>;
  }

  if (!order) {
    return <div className="text-center py-20 text-gray-500">Pesanan tidak ditemukan.</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/orders')} className="text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display font-700 text-2xl text-gray-900">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge variant={statusVariant(order.status)}>{STATUS_LABELS[order.status]}</Badge>
          <Badge variant={order.paymentStatus === 'PAID' ? 'success' : order.paymentStatus === 'FAILED' ? 'destructive' : 'warning'}>
            {PAYMENT_LABELS[order.paymentStatus]}
          </Badge>
          {order.isGuestOrder && <Badge variant="outline">Guest</Badge>}
        </div>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />{actionError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — order items + totals */}
        <div className="lg:col-span-2 space-y-5">

          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-600 text-gray-900 mb-4">Item Pesanan</h2>
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left pb-2 text-gray-500 font-medium">Produk</th>
                  <th className="text-right pb-2 text-gray-500 font-medium">Qty</th>
                  <th className="text-right pb-2 text-gray-500 font-medium">Harga</th>
                  <th className="text-right pb-2 text-gray-500 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3">
                      <p className="text-gray-900">{item.productName}</p>
                      {item.productSku && <p className="text-xs text-gray-400">{item.productSku}</p>}
                    </td>
                    <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-600">{formatPrice(parseFloat(item.unitPrice))}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{formatPrice(parseFloat(item.subtotal))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-gray-100 mt-4 pt-4 space-y-1.5">
              {[
                ['Subtotal', order.subtotal],
                ['Ongkos Kirim', order.shippingCost],
                ...(parseFloat(order.tax) > 0 ? [['Pajak', order.tax] as [string, string]] : []),
                ...(parseFloat(order.discount) > 0 ? [['Diskon', `-${order.discount}`] as [string, string]] : []),
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-700">{val.startsWith('-') ? `-${formatPrice(parseFloat(val.slice(1)))}` : formatPrice(parseFloat(val))}</span>
                </div>
              ))}
              <div className="flex justify-between font-700 text-base pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-red-500">{formatPrice(parseFloat(order.total))}</span>
              </div>
            </div>
          </div>

          {/* Update status */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-600 text-gray-900 mb-4">Update Status</h2>
            <div className="grid grid-cols-2 gap-3">
              <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="">Pilih status baru</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </Select>
              <Input
                placeholder="Catatan (opsional)"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
            </div>
            <Button
              className="mt-3"
              onClick={() => statusMutation.mutate()}
              disabled={!newStatus || statusMutation.isPending}
            >
              {statusMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyimpan…</> : 'Update Status'}
            </Button>
          </div>

          {/* Tracking */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-600 text-gray-900 mb-4">Tracking Pengiriman</h2>
            {order.trackingNumber && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
                <p className="font-medium text-blue-800">No. Resi: {order.trackingNumber}</p>
                {order.trackingUrl && (
                  <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 underline flex items-center gap-1 mt-1">
                    Lacak Paket <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Nomor resi"
                value={trackingNum}
                onChange={(e) => setTrackingNum(e.target.value)}
              />
              <Input
                placeholder="URL tracking (opsional)"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => trackingMutation.mutate()}
              disabled={!trackingNum || trackingMutation.isPending}
            >
              {trackingMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyimpan…</> : 'Simpan Tracking'}
            </Button>
          </div>

          {/* Status history */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-600 text-gray-900 mb-4">Riwayat Status</h2>
            <ol className="relative border-l-2 border-gray-200 ml-3 space-y-4">
              {order.statusHistory.map((h) => (
                <li key={h.id} className="ml-5">
                  <span className="absolute -left-2 w-4 h-4 bg-red-400 rounded-full ring-2 ring-white" />
                  <p className="text-sm font-medium text-gray-900">{STATUS_LABELS[h.status]}</p>
                  {h.note && <p className="text-xs text-gray-500">{h.note}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(h.createdAt)}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">

          {/* Customer info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-600 text-gray-900 text-sm mb-3">Customer</h2>
            <p className="text-sm text-gray-700">{order.shipFirstName} {order.shipLastName}</p>
            <p className="text-sm text-gray-500">{order.email}</p>
            <p className="text-sm text-gray-500">{order.phone}</p>
          </div>

          {/* Shipping address */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-600 text-gray-900 text-sm mb-3">Alamat Pengiriman</h2>
            <address className="not-italic text-sm text-gray-600 leading-relaxed">
              {order.shipStreet1}
              {order.shipStreet2 && <>, {order.shipStreet2}</>}<br />
              {order.shipCity}, {order.shipState} {order.shipZip}<br />
              {order.shipCountry}
            </address>
            {order.shippingCarrier && (
              <p className="text-xs text-gray-400 mt-2">
                {order.shippingCarrier} · {order.shippingService}
              </p>
            )}
            {order.selectedBoxSize && (
              <p className="text-xs text-gray-400">Box: {order.selectedBoxSize}</p>
            )}
          </div>

          {/* Admin note */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-600 text-gray-900 text-sm mb-3">Catatan Admin</h2>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              placeholder="Tambah catatan internal…"
              defaultValue={order.adminNote ?? ''}
              onChange={(e) => setAdminNote(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={() => noteMutation.mutate()}
              disabled={noteMutation.isPending}
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {noteMutation.isPending ? 'Menyimpan…' : 'Simpan Catatan'}
            </Button>
          </div>

          {/* Refund */}
          {order.paymentStatus === 'PAID' && (
            <div className="bg-white rounded-xl border border-red-100 p-5">
              <h2 className="font-600 text-gray-900 text-sm mb-2">Proses Refund</h2>
              <p className="text-xs text-gray-500 mb-3">
                Refund penuh ke kartu customer via Stripe.
                Tindakan ini tidak bisa dibatalkan.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => {
                  if (window.confirm(`Refund ${formatPrice(parseFloat(order.total))} ke customer ini?`))
                    refundMutation.mutate();
                }}
                disabled={refundMutation.isPending}
              >
                {refundMutation.isPending
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memproses…</>
                  : `Refund ${formatPrice(parseFloat(order.total))}`
                }
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
