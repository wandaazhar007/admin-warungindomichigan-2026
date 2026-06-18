import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { slugify } from '@/lib/utils';
import api from '@/lib/api';
import type { Category } from '@/types';

const schema = z.object({
  name:        z.string().min(2, 'Nama minimal 2 karakter'),
  slug:        z.string().min(2, 'Slug minimal 2 karakter'),
  icon:        z.string().optional().default(''),
  description: z.string().optional().default(''),
  sortOrder:   z.coerce.number().int().min(0).default(0),
  isActive:    z.boolean().default(true),
});
type FormValues = z.infer<typeof schema>;

function CategoryForm({
  initial, onSave, onCancel, isPending,
}: {
  initial?: Category;
  onSave: (data: FormValues) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: initial
        ? { name: initial.name, slug: initial.slug, icon: initial.icon ?? '', description: initial.description ?? '', sortOrder: initial.sortOrder, isActive: initial.isActive }
        : {},
    });

  const nameValue = watch('name');
  if (!initial && nameValue) setValue('slug', slugify(nameValue));

  return (
    <form onSubmit={handleSubmit(onSave)} className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 space-y-4">
      <h3 className="font-semibold text-gray-900">{initial ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama *</label>
          <Input placeholder="Mie & Bubur" {...register('name')} />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug *</label>
          <Input placeholder="mie-bubur" {...register('slug')} />
          {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Icon (emoji)</label>
          <Input placeholder="🍜" {...register('icon')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Urutan Tampil</label>
          <Input type="number" min="0" placeholder="0" {...register('sortOrder')} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
          <Input placeholder="Deskripsi singkat kategori…" {...register('description')} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" {...register('isActive')} className="accent-red-500" id="cat-active" />
          <label htmlFor="cat-active" className="text-sm text-gray-700 cursor-pointer">Aktif</label>
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Batal</Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Menyimpan…</> : 'Simpan'}
        </Button>
      </div>
    </form>
  );
}

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Category | null>(null);

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['admin-categories-all'],
    queryFn: () => api.get('/admin/categories').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => api.post('/admin/categories', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories-all'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormValues }) => api.put(`/admin/categories/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories-all'] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories-all'] }),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      alert(msg ?? 'Gagal hapus kategori.');
    },
  });

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-semibold text-xl sm:text-2xl text-gray-900">Kategori</h1>
        {!showForm && !editing && (
          <Button onClick={() => setShowForm(true)} size="sm" className="sm:size-auto">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Tambah Kategori</span>
          </Button>
        )}
      </div>

      {showForm && (
        <CategoryForm
          onSave={(d) => createMutation.mutate(d)}
          onCancel={() => setShowForm(false)}
          isPending={createMutation.isPending}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-2">
          {categories?.map((cat) =>
            editing?.id === cat.id ? (
              <CategoryForm
                key={cat.id}
                initial={cat}
                onSave={(d) => updateMutation.mutate({ id: cat.id, data: d })}
                onCancel={() => setEditing(null)}
                isPending={updateMutation.isPending}
              />
            ) : (
              <div key={cat.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 sm:p-4">
                <span className="text-2xl shrink-0">{cat.icon ?? '📦'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{cat.name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {cat.slug} · {cat._count?.products ?? 0} produk
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {cat.isActive
                    ? <span className="hidden sm:inline text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Aktif</span>
                    : <span className="hidden sm:inline text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Nonaktif</span>
                  }
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(cat); setShowForm(false); }}>
                    <Pencil className="h-4 w-4 text-gray-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (window.confirm(`Hapus kategori "${cat.name}"?`)) deleteMutation.mutate(cat.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </div>
            )
          )}
          {categories?.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">Belum ada kategori.</p>
          )}
        </div>
      )}
    </div>
  );
}
