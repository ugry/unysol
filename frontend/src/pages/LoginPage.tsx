import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { SignupPayload } from '@/types';
import api from '@/lib/api';
import { Loader2, Eye, EyeOff, Truck, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'email'|'code'>('email');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotSending, setForgotSending] = useState(false);

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
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const handleGoogleToken = async (idToken: string) => {
    try {
      setError('');
      setLoading(true);
      const res = await api.post('/api/auth/google', { id_token: idToken });
      localStorage.setItem('unysol_token', res.data.access_token);
      localStorage.setItem('unysol_user', JSON.stringify({
        id: res.data.user_id,
        email: res.data.email,
        tenant_id: res.data.tenant_id,
        role: res.data.role,
      }));
      navigateRef.current('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Google girişi başarısız');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const checkGoogle = setInterval(() => {
      const g = (window as any).google;
      if (g && g.accounts && googleBtnRef.current) {
        clearInterval(checkGoogle);
        g.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            handleGoogleToken(response.credential);
          },
        });
        g.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: googleBtnRef.current.offsetWidth || 360,
        });
      }
    }, 100);
    return () => clearInterval(checkGoogle);
  }, [GOOGLE_CLIENT_ID]);

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

  const handleForgotSend = async () => {
    if (!forgotEmail) return;
    setForgotSending(true); setForgotMsg('');
    try {
      const r = await api.post('/api/auth/forgot-password', { email: forgotEmail });
      setForgotMsg(r.data?.message || 'Kod gönderildi.');
      setForgotStep('code');
    } catch { setForgotMsg('Bir hata oluştu. Lütfen tekrar deneyin.'); }
    finally { setForgotSending(false); }
  };

  const handleForgotReset = async () => {
    if (!forgotCode || !forgotPassword) return;
    setForgotSending(true); setForgotMsg('');
    try {
      const r = await api.post('/api/auth/reset-password', { email: forgotEmail, code: forgotCode, password: forgotPassword });
      setForgotMsg(r.data?.message || 'Şifre güncellendi.');
      setForgotMode(false);
      setForgotStep('email');
      setForgotEmail(''); setForgotCode(''); setForgotPassword('');
    } catch (err: any) {
      setForgotMsg(err?.response?.data?.error || 'Geçersiz kod veya şifre.');
    } finally { setForgotSending(false); }
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

            {!isSignup && (
              <button type="button" onClick={() => { setForgotMode(true); setForgotStep('email'); setForgotMsg(''); }}
                className="text-[13px] text-[#FF5F03] hover:text-[#E55600] transition-colors text-right">
                Şifrenizi mi unuttunuz?
              </button>
            )}

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
              <div ref={googleBtnRef} className="flex justify-center" />
            </div>
          )}
          </>
          )}
        </div>

        <button
          type="button"
          onClick={toggleMode}
          className="w-full mt-3 py-2 rounded-md bg-[#16A34A] hover:bg-[#15803D] text-white font-[510] text-[14px] transition-colors duration-150"
        >
          {isSignup ? 'Giriş Yap' : 'Hesap Oluştur'}
        </button>
      </div>

      {/* Forgot Password Modal */}
      {forgotMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setForgotMode(false)}>
          <div className="bg-[#0f1011] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => setForgotMode(false)} className="absolute top-4 right-4 text-[#8a8f98] hover:text-[#f7f8f8]"><ArrowLeft size={18} /></button>

            {forgotStep === 'email' ? (
              <>
                <h3 className="text-lg font-semibold mb-2">Şifre Sıfırlama</h3>
                <p className="text-sm text-[#8a8f98] mb-4">E-posta adresinizi girin, size şifre sıfırlama kodu gönderelim.</p>
                <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                  placeholder="E-posta adresiniz" className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none mb-3" />
                <button onClick={handleForgotSend} disabled={forgotSending}
                  className="w-full py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm disabled:opacity-60">
                  {forgotSending ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Kod Gönder'}
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">Yeni Şifre</h3>
                <p className="text-sm text-[#8a8f98] mb-4">{forgotEmail} adresine kod gönderildi.</p>
                <input type="text" value={forgotCode} onChange={e => setForgotCode(e.target.value)}
                  placeholder="6 haneli kod" maxLength={6}
                  className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none mb-3 tracking-[8px] text-center text-xl" />
                <input type="password" value={forgotPassword} onChange={e => setForgotPassword(e.target.value)}
                  placeholder="Yeni şifre (en az 8 karakter)"
                  className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none mb-3" />
                <button onClick={handleForgotReset} disabled={forgotSending}
                  className="w-full py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm disabled:opacity-60">
                  {forgotSending ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Şifreyi Güncelle'}
                </button>
              </>
            )}

            {forgotMsg && (
              <p className={`mt-3 text-sm text-center ${forgotMsg.includes('gönderildi')||forgotMsg.includes('güncellendi') ? 'text-green-500' : 'text-red-400'}`}>
                {forgotMsg}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

