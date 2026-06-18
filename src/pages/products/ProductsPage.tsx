import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import api from '@/lib/api';
import type { Product, ProductsResponse } from '@/types';

export default function ProductsPage() {
  const qc = useQueryClient();
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  let debounceTimer: ReturnType<typeof setTimeout>;
  function handleSearch(v: string) {
    setSearch(v);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { setDebouncedSearch(v); setPage(1); }, 400);
  }

  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: ['admin-products', page, debouncedSearch],
    queryFn: () =>
      api.get('/admin/products', { params: { page, limit: 20, search: debouncedSearch || undefined } })
        .then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  function confirmDelete(product: Product) {
    if (window.confirm(`Hapus produk "${product.name}"? Tindakan ini tidak bisa dibatalkan.`)) {
      deleteMutation.mutate(product.id);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-700 text-2xl text-gray-900">Produk</h1>
        <Button asChild>
          <Link to="/products/new">
            <Plus className="h-4 w-4 mr-2" /> Tambah Produk
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Cari produk…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Produk</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Kategori</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Harga</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Stok</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.data.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0 overflow-hidden">
                          {product.images[0]
                            ? <img src={product.images[0].url} alt="" className="h-10 w-10 object-cover" />
                            : <span className="text-lg">📦</span>
                          }
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.sku ?? product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{product.category.name}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-gray-900">{formatPrice(product.price)}</span>
                      {product.comparePrice && (
                        <span className="text-xs text-gray-400 line-through ml-1">
                          {formatPrice(product.comparePrice)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={product.stock <= product.minStock ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {product.isActive
                          ? <Badge variant="success">Aktif</Badge>
                          : <Badge variant="secondary">Nonaktif</Badge>
                        }
                        {product.isFeatured && <Badge>Unggulan</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/products/${product.id}/edit`}>
                            <Pencil className="h-4 w-4 text-gray-500" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(product)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      Tidak ada produk ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {data.meta.total} produk total
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Sebelumnya
              </Button>
              <span className="text-sm text-gray-500">
                {page} / {data.meta.totalPages}
              </span>
              <Button
                variant="outline" size="sm"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Berikutnya →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
