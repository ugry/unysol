import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { SignupPayload } from '@/types';
import api from '@/lib/api';
import { Loader2, Eye, EyeOff, Truck, Mail } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firmaUnvani, setFirmaUnvani] = useState('');
  const [telefon, setTelefon] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFirmaUnvani('');
    setTelefon('');
    setError('');
    setLoading(false);
  };

  const [verificationEmail, setVerificationEmail] = useState('');
  const [showVerification, setShowVerification] = useState(false);

  const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || '';

  useEffect(() => {
    if (GOOGLE_CLIENT_ID && (window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
      });
    }
  }, []);

  const handleGoogleResponse = async (response: any) => {
    try {
      setError('');
      setLoading(true);
      const res = await api.post('/api/auth/google', { id_token: response.credential });
      localStorage.setItem('unysol_token', res.data.access_token);
      localStorage.setItem('unysol_user', JSON.stringify({
        id: res.data.user_id,
        email: res.data.email,
        tenant_id: res.data.tenant_id,
        role: res.data.role,
      }));
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Google girişi başarısız';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google girişi henüz yapılandırılmadı.');
      return;
    }
    (window as any).google.accounts.id.prompt();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        const payload: SignupPayload = {
          firma_unvani: firmaUnvani,
          email,
          password,
          telefon: telefon || undefined,
        };
        const result = await signup(payload);
        if ('requires_verification' in result && result.requires_verification) {
          setVerificationEmail(result.email);
          setShowVerification(true);
          setLoading(false);
          return;
        }
      } else {
        await login(email, password);
      }
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      let msg = 'Bir hata oluştu. Lütfen tekrar deneyin.';
      if (err instanceof Error) {
        msg = err.message;
      }
      const axiosErr = err as { response?: { data?: { error?: string; message?: string; requires_verification?: boolean; email?: string } } };
      if (axiosErr?.response?.data?.error) {
        msg = axiosErr.response.data.error;
      } else if (axiosErr?.response?.data?.message) {
        msg = axiosErr.response.data.message;
      }
      // If login returns requires_verification, show the message with option to resend
      if (axiosErr?.response?.data?.requires_verification) {
        setVerificationEmail(axiosErr.response.data.email || email);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-[#08090a] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#FF5F03] rounded flex items-center justify-center">
              <Truck size={20} className="text-white" />
            </div>
            <span className="text-[#f7f8f8] font-[590] text-xl tracking-tight">
              Unysol
            </span>
          </button>
        </div>

        {/* Card */}
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg p-6">
          {showVerification ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-[#16A34A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-[#16A34A]" />
              </div>
              <h2 className="text-[16px] font-[590] text-[#f7f8f8] mb-2">E-postanızı Kontrol Edin</h2>
              <p className="text-[14px] text-[#8a8f98] mb-3">
                <strong className="text-[#d0d6e0]">{verificationEmail}</strong> adresine bir doğrulama linki gönderdik.
              </p>
              <p className="text-[13px] text-[#62666d] mb-6">
                Gelen kutunuzu ve spam klasörünü kontrol edin. Linke tıklayarak hesabınızı aktifleştirebilirsiniz.
              </p>
              <button
                onClick={() => { setShowVerification(false); resetForm(); }}
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#d0d6e0] px-4 py-2 rounded-md font-[510] text-[14px] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
              >
                Giriş Sayfasına Dön
              </button>
            </div>
          ) : (
          <>
          <h2 className="text-[16px] font-[590] text-[#f7f8f8] mb-0.5 text-center">
            {isSignup ? 'Hesap Oluştur' : 'Hoş Geldiniz'}
          </h2>
          <p className="text-[14px] text-[#8a8f98] mb-5 text-center">
            {isSignup
              ? 'Unysol ailesine katılın'
              : 'Hesabınıza giriş yaparak devam edin'}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-[#DC2626]/10 border border-danger/20 text-[#DC2626] text-[13px]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignup && (
              <div>
                <label className="block text-[13px] font-[510] text-[#d0d6e0] mb-1.5">
                  Firma Ünvanı
                </label>
                <input
                  type="text"
                  value={firmaUnvani}
                  onChange={(e) => setFirmaUnvani(e.target.value)}
                  required
                  placeholder="Unysol Lojistik A.Ş."
                  className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40 focus:ring-1 focus:ring-[#FF5F03]/20 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-[13px] font-[510] text-[#d0d6e0] mb-1.5">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ornek@firma.com"
                className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40 focus:ring-1 focus:ring-[#FF5F03]/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[13px] font-[510] text-[#d0d6e0] mb-1.5">
                Şifre
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40 focus:ring-1 focus:ring-[#FF5F03]/20 transition-colors pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a8f98] hover:text-[#d0d6e0] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {isSignup && (
              <div>
                <label className="block text-[13px] font-[510] text-[#d0d6e0] mb-1.5">
                  Telefon
                  <span className="text-[#62666d] ml-1">(isteğe bağlı)</span>
                </label>
                <input
                  type="tel"
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  placeholder="+90 555 123 4567"
                  className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40 focus:ring-1 focus:ring-[#FF5F03]/20 transition-colors"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-md bg-[#FF5F03] hover:bg-[#FF5F03]-hover text-white font-[510] text-[14px] transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {isSignup ? 'Hesap Oluştur' : 'Giriş Yap'}
            </button>
          </form>

          {!isSignup && (
            <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
                <span className="text-[12px] text-[#62666d]">veya</span>
                <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-2 rounded-md bg-white hover:bg-gray-100 text-gray-700 font-[510] text-[14px] transition-colors flex items-center justify-center gap-2 border border-gray-300"
              >
                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google ile Giriş Yap
              </button>
            </div>
          )}
          </>
          )}
        </div>

        <p className="text-center mt-4 text-[13px] text-[#8a8f98]">
          {isSignup ? 'Zaten hesabınız var mı?' : 'Henüz hesabınız yok mu?'}{' '}
          <button
            onClick={toggleMode}
            className="text-[#FF5F03] hover:text-[#FF5F03]-hover font-[510] transition-colors"
          >
            {isSignup ? 'Giriş Yap' : 'Hesap Oluştur'}
          </button>
        </p>
      </div>
    </div>
  );
}
