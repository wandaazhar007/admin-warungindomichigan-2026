import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Upload, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { slugify, uploadToCloudinary } from '@/lib/utils';
import api from '@/lib/api';
import type { Product, Category } from '@/types';

const schema = z.object({
  name:         z.string().min(2, 'Nama minimal 2 karakter'),
  slug:         z.string().min(2, 'Slug minimal 2 karakter'),
  description:  z.string().optional().default(''),
  price:        z.string().min(1, 'Wajib diisi'),
  comparePrice: z.string().optional().default(''),
  unit:         z.string().min(1, 'Wajib diisi'),
  stock:        z.coerce.number().int().min(0, 'Stok tidak boleh negatif'),
  minStock:     z.coerce.number().int().min(0, 'Min stok tidak boleh negatif'),
  sku:          z.string().optional().default(''),
  weightGrams:  z.coerce.number().min(1, 'Berat harus lebih dari 0'),
  categoryId:   z.string().min(1, 'Wajib pilih kategori'),
  isActive:     z.boolean().default(true),
  isFeatured:   z.boolean().default(false),
  tags:         z.string().optional().default(''),
});
type FormValues = z.infer<typeof schema>;

interface ImageItem {
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
  id?: string;
  uploading?: boolean;
}

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit  = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [images, setImages]           = useState<ImageItem[]>([]);
  const [uploadingAny, setUploadingAny] = useState(false);
  const [serverError, setServerError] = useState('');

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['admin-categories-all'],
    queryFn: () => api.get('/admin/categories').then((r) => r.data),
  });

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['admin-product', id],
    queryFn: () => api.get(`/admin/products/${id}`).then((r) => r.data),
    enabled: isEdit,
  });

  const {
    register, handleSubmit, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const nameValue = watch('name');

  useEffect(() => {
    if (!isEdit && nameValue) setValue('slug', slugify(nameValue));
  }, [nameValue, isEdit, setValue]);

  useEffect(() => {
    if (!product) return;
    setValue('name',         product.name);
    setValue('slug',         product.slug);
    setValue('description',  product.description ?? '');
    setValue('price',        product.price);
    setValue('comparePrice', product.comparePrice ?? '');
    setValue('unit',         product.unit);
    setValue('stock',        product.stock);
    setValue('minStock',     product.minStock);
    setValue('sku',          product.sku ?? '');
    setValue('weightGrams',  product.weightGrams);
    setValue('categoryId',   product.categoryId);
    setValue('isActive',     product.isActive);
    setValue('isFeatured',   product.isFeatured);
    setValue('tags',         product.tags.join(', '));
    setImages(product.images.map((img) => ({
      url:       img.url,
      altText:   img.altText ?? '',
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
      id:        img.id,
    })));
  }, [product, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload = {
        ...data,
        price:        parseFloat(data.price),
        comparePrice: data.comparePrice ? parseFloat(data.comparePrice) : null,
        sku:          data.sku || null,
        description:  data.description || null,
        tags:         data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        images:       images.map((img, idx) => ({
          url:       img.url,
          altText:   img.altText || null,
          isPrimary: idx === 0,
          sortOrder: idx,
        })),
      };
      return isEdit
        ? api.put(`/admin/products/${id}`, payload)
        : api.post('/admin/products', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      navigate('/products');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Gagal menyimpan produk.';
      setServerError(msg);
    },
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingAny(true);
    try {
      for (const file of files) {
        const placeholder: ImageItem = { url: '', altText: '', isPrimary: false, sortOrder: images.length, uploading: true };
        setImages((prev) => [...prev, placeholder]);
        const url = await uploadToCloudinary(file);
        setImages((prev) => {
          const next = [...prev];
          const idx  = next.findIndex((img) => img.uploading);
          if (idx !== -1) next[idx] = { url, altText: '', isPrimary: false, sortOrder: idx };
          return next;
        });
      }
    } finally {
      setUploadingAny(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function setPrimary(idx: number) {
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === idx })));
  }

  if (isEdit && isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/products')}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display font-semibold text-xl sm:text-2xl text-gray-900">
          {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
        </h1>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
        {/* Basic info */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Informasi Dasar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Produk *</label>
              <Input placeholder="Indomie Goreng Original" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug *</label>
              <Input placeholder="indomie-goreng-original" {...register('slug')} />
              {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">SKU</label>
              <Input placeholder="IMI-001" {...register('sku')} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
              <textarea
                {...register('description')}
                rows={3}
                className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 resize-none"
                placeholder="Deskripsi produk…"
              />
            </div>
          </div>
        </div>

        {/* Pricing & inventory */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Harga & Stok</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Harga Jual (USD) *</label>
              <Input type="number" step="0.01" min="0" placeholder="3.99" {...register('price')} />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Harga Coret</label>
              <Input type="number" step="0.01" min="0" placeholder="4.99" {...register('comparePrice')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Satuan *</label>
              <Input placeholder="pcs / pack / kg" {...register('unit')} />
              {errors.unit && <p className="text-xs text-red-500 mt-1">{errors.unit.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Berat (gram) *</label>
              <Input type="number" min="1" placeholder="400" {...register('weightGrams')} />
              {errors.weightGrams && <p className="text-xs text-red-500 mt-1">{errors.weightGrams.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Stok *</label>
              <Input type="number" min="0" placeholder="100" {...register('stock')} />
              {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Stok *</label>
              <Input type="number" min="0" placeholder="5" {...register('minStock')} />
              {errors.minStock && <p className="text-xs text-red-500 mt-1">{errors.minStock.message}</p>}
            </div>
          </div>
        </div>

        {/* Category & tags */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Kategori & Tags</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori *</label>
              <Select {...register('categoryId')}>
                <option value="">Pilih kategori</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </Select>
              {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags (pisah koma)</label>
              <Input placeholder="halal, new, bestseller" {...register('tags')} />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('isActive')} className="accent-red-500" />
                <span className="text-sm text-gray-700">Aktif</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('isFeatured')} className="accent-red-500" />
                <span className="text-sm text-gray-700">Unggulan</span>
              </label>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Foto Produk</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Foto pertama otomatis jadi foto utama. Tap ⭐ untuk ganti foto utama.
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative group aspect-square">
                {img.uploading ? (
                  <div className="h-full rounded-lg bg-gray-100 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    <img
                      src={img.url}
                      alt={img.altText}
                      className="h-full w-full object-cover rounded-lg border border-gray-200"
                    />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                        Utama
                      </span>
                    )}
                    {/* Touch-friendly buttons always visible on mobile */}
                    <div className="absolute inset-0 bg-black/40 rounded-lg sm:opacity-0 sm:group-hover:opacity-100 opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => setPrimary(idx)}
                          className="p-1.5 bg-white rounded-full shadow"
                          title="Jadikan foto utama"
                        >
                          <Star className="h-3.5 w-3.5 text-yellow-500" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="p-1.5 bg-white rounded-full shadow"
                        title="Hapus foto"
                      >
                        <X className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAny}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-red-400 transition-colors disabled:opacity-50 active:bg-gray-50"
            >
              <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <span className="text-[10px] sm:text-xs text-gray-400">Upload</span>
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <div className="flex gap-3 pb-4">
          <Button type="button" variant="outline" onClick={() => navigate('/products')}>
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending || uploadingAny}>
            {(isSubmitting || mutation.isPending)
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyimpan…</>
              : isEdit ? 'Simpan Perubahan' : 'Tambah Produk'
            }
          </Button>
        </div>
      </form>
    </div>
  );
}
