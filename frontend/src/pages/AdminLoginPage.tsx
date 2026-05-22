import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '@/lib/adminAuth';
import { Loader2, Eye, EyeOff, Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await adminLogin(email, password);
      navigate('/admin', { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-[#FF5F03] rounded-lg flex items-center justify-center">
              <Shield size={22} className="text-white" />
            </div>
            <span className="text-[#f7f8f8] font-bold text-2xl tracking-tight">
              Logisol <span className="text-[#FF5F03]">Admin</span>
            </span>
          </div>
        </div>

        <div className="bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg p-8">
          <h2 className="text-xl font-semibold text-[#f7f8f8] mb-1 text-center">
            Yetkili Girişi
          </h2>
          <p className="text-sm text-[#8a8f98] mb-6 text-center">
            Platform yönetim paneline erişim
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#8a8f98] mb-1.5">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@logisol.com"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#08090a] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8a8f98] mb-1.5">
                Şifre
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#08090a] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/20 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#62666d] hover:text-[#8a8f98] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Giriş Yap
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-sm text-[#555]">
          Bu sayfa sadece platform yöneticileri içindir
        </p>
      </div>
    </div>
  );
}
