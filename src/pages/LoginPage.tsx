import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signInAdmin } from '@/lib/auth';

const STORAGE_KEY = 'wim_admin_email';

const schema = z.object({
  email:    z.string().min(1, 'Wajib diisi').email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError]         = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  // Load persisted email on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setValue('email', saved);
  }, [setValue]);

  async function onSubmit(data: FormValues) {
    setError('');
    // Persist email regardless of outcome
    localStorage.setItem(STORAGE_KEY, data.email);
    try {
      await signInAdmin(data.email, data.password);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as Error).message;
      if (msg.includes('tidak memiliki akses admin')) {
        setError(msg);
      } else if (msg.includes('invalid-credential') || msg.includes('wrong-password')) {
        setError('Email atau password salah.');
      } else {
        setError('Login gagal. Coba lagi.');
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-red-500 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <img
              src="/logo-icon-warungindomichigan.png"
              alt="WIM"
              className="h-10 w-10 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-white text-2xl">🏪</span>';
              }}
            />
          </div>
          <h1 className="font-display font-semibold text-2xl text-gray-900">Admin Login</h1>
          <p className="text-gray-500 text-sm mt-1">Warung IndoMi</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <Input
                type="email"
                placeholder="admin@warungindomichigan.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Masuk…</>
                : 'Masuk'
              }
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Hanya untuk admin Warung IndoMi
        </p>
      </div>
    </div>
  );
}
