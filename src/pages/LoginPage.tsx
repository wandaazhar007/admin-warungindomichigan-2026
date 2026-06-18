import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signInAdmin } from '@/lib/auth';

const schema = z.object({
  email:    z.string().min(1, 'Wajib diisi').email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormValues) {
    setError('');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-red-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🏪</span>
          </div>
          <h1 className="font-display font-700 text-2xl text-gray-900">Admin Login</h1>
          <p className="text-gray-500 text-sm mt-1">Warung Indo Michigan</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <Input type="email" placeholder="admin@warungindomichigan.com" {...register('email')} />
              {errors.email && <p className="text-xs text-error mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <Input type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="text-xs text-error mt-1">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Masuk…</> : 'Masuk'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
