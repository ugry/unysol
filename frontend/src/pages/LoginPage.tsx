import { useState, useEffect, useRef, useMemo, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { SignupPayload } from '@/types';
import api from '@/lib/api';
import { Loader2, Eye, EyeOff, Truck, Mail, ArrowLeft, Check, X as XIcon } from 'lucide-react';

const RECAPTCHA_SITE_KEY = '6LdgDQwtAAAAAKxF1RJeI7bbIEtQ_7IjRqNYBo8u';

function passwordStrength(pw: string): { score: number; label: string; color: string; checks: { label: string; ok: boolean }[] } {
  const checks = [
    { label: 'En az 8 karakter', ok: pw.length >= 8 },
    { label: 'Büyük harf (A-Z)', ok: /[A-Z]/.test(pw) },
    { label: 'Küçük harf (a-z)', ok: /[a-z]/.test(pw) },
    { label: 'Rakam (0-9)', ok: /[0-9]/.test(pw) },
    { label: 'Özel karakter (!@#$%^&*)', ok: /[^A-Za-z0-9]/.test(pw) },
  ];
  const passed = checks.filter(c => c.ok).length;
  const colors = ['#DC2626', '#DC2626', '#F59E0B', '#F59E0B', '#16A34A', '#16A34A'];
  const labels = ['Çok zayıf', 'Zayıf', 'Orta', 'İyi', 'Güçlü', 'Çok güçlü'];
  return { score: passed, label: labels[passed] || 'Çok güçlü', color: colors[passed] || '#16A34A', checks };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [firmaUnvani, setFirmaUnvani] = useState('');
  const [telefon, setTelefon] = useState('');
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const pwStrength = useMemo(() => passwordStrength(password), [password]);

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotConfirm, setForgotConfirm] = useState('');
  const [forgotStep, setForgotStep] = useState<'email'|'code'>('email');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotResendCooldown, setForgotResendCooldown] = useState(0);

  const [verificationEmail, setVerificationEmail] = useState('');
  const [showVerification, setShowVerification] = useState(false);

  const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || '';
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    if (forgotResendCooldown <= 0) return;
    const timer = setInterval(() => setForgotResendCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [forgotResendCooldown]);

  // reCAPTCHA v3 — load script and expose executor
  const [grecaptchaReady, setGrecaptchaReady] = useState(false);
  useEffect(() => {
    const scriptId = 'recaptcha-script';
    if (document.getElementById(scriptId)) { setGrecaptchaReady(true); return; }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.onload = () => setGrecaptchaReady(true);
    document.head.appendChild(script);
  }, []);

  const getRecaptchaToken = useCallback(async (action: string): Promise<string> => {
    if (!grecaptchaReady) return '';
    try {
      const w = window as any;
      if (!w.grecaptcha) return '';
      return await w.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
    } catch { return ''; }
  }, [grecaptchaReady]);

  const handleGoogleToken = async (idToken: string) => {
    try {
      setError('');
      setLoading(true);
      const res = await api.post('/api/auth/google', { id_token: idToken });
      localStorage.setItem('unysol_token', res.data.access_token);
      localStorage.setItem('unysol_user', JSON.stringify({
        id: res.data.user_id, email: res.data.email,
        tenant_id: res.data.tenant_id, role: res.data.role,
      }));
      navigateRef.current('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Google girişi başarısız');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const checkGoogle = setInterval(() => {
      const g = (window as any).google;
      if (g && g.accounts && googleBtnRef.current) {
        clearInterval(checkGoogle);
        g.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: any) => handleGoogleToken(response.credential),
        });
        g.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline', size: 'large', text: 'signin_with',
          shape: 'rectangular', width: googleBtnRef.current.offsetWidth || 360,
        });
      }
    }, 100);
    return () => clearInterval(checkGoogle);
  }, [GOOGLE_CLIENT_ID]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trimmedEmail = email.trim();
    const recaptchaToken = await getRecaptchaToken(isSignup ? 'signup' : 'login');

    try {
      if (isSignup) {
        if (!firmaUnvani.trim()) { setError('Firma ünvanı zorunludur'); setLoading(false); return; }
        if (firmaUnvani.trim().length < 2) { setError('Firma ünvanı en az 2 karakter olmalıdır'); setLoading(false); return; }
        if (password !== passwordConfirm) { setError('Şifreler eşleşmiyor'); setLoading(false); return; }
        if (!kvkkAccepted || !termsAccepted) { setError('Devam etmek için KVKK ve Kullanım Sözleşmesini kabul etmelisiniz'); setLoading(false); return; }
        if (telefon && !/^\+?[0-9]{7,15}$/.test(telefon.replace(/\s/g, ''))) { setError('Geçerli bir telefon numarası girin'); setLoading(false); return; }

        const payload: SignupPayload = {
          firma_unvani: firmaUnvani.trim(),
          email: trimmedEmail,
          password,
          telefon: telefon.trim() || undefined,
        };
        const result = await signup(payload, recaptchaToken);
        if ('requires_verification' in result && result.requires_verification) {
          setVerificationEmail(result.email);
          setShowVerification(true);
          setLoading(false);
          return;
        }
      } else {
        await login(trimmedEmail, password, recaptchaToken);
      }
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      let msg = 'Bir hata oluştu. Lütfen tekrar deneyin.';
      if (err instanceof Error) msg = err.message;
      const axiosErr = err as { response?: { data?: { error?: string; message?: string; requires_verification?: boolean; email?: string } } };
      if (axiosErr?.response?.data?.error) msg = axiosErr.response.data.error;
      else if (axiosErr?.response?.data?.message) msg = axiosErr.response.data.message;
      if (axiosErr?.response?.data?.requires_verification) {
        setVerificationEmail(axiosErr.response.data.email || trimmedEmail);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSend = async () => {
    if (!forgotEmail.trim()) return;
    setForgotSending(true); setForgotMsg('');
    const recaptchaToken = await getRecaptchaToken('forgot_password');
    try {
      const r = await api.post('/api/auth/forgot-password', { email: forgotEmail.trim() },
        { headers: { 'X-Recaptcha-Token': recaptchaToken } });
      setForgotMsg(r.data?.message || 'Kod gönderildi.');
      setForgotStep('code');
      setForgotResendCooldown(60);
    } catch { setForgotMsg('Bir hata oluştu. Lütfen tekrar deneyin.'); }
    finally { setForgotSending(false); }
  };

  const handleForgotResend = async () => {
    if (forgotResendCooldown > 0) return;
    setForgotSending(true); setForgotMsg('');
    try {
      await api.post('/api/auth/forgot-password', { email: forgotEmail.trim() });
      setForgotMsg('Yeni kod gönderildi.');
      setForgotResendCooldown(60);
    } catch { setForgotMsg('Kod gönderilemedi. Lütfen tekrar deneyin.'); }
    finally { setForgotSending(false); }
  };

  const handleForgotReset = async () => {
    if (!forgotCode || !forgotPassword) return;
    if (forgotPassword !== forgotConfirm) { setForgotMsg('Şifreler eşleşmiyor'); return; }
    setForgotSending(true); setForgotMsg('');
    try {
      const r = await api.post('/api/auth/reset-password', { email: forgotEmail.trim(), code: forgotCode, password: forgotPassword });
      setForgotMsg(r.data?.message || 'Şifre güncellendi.');
      setTimeout(() => {
        setForgotMode(false); setForgotStep('email');
        setForgotEmail(''); setForgotCode(''); setForgotPassword(''); setForgotConfirm(''); setForgotMsg('');
      }, 1500);
    } catch (err: any) {
      setForgotMsg(err?.response?.data?.error || 'Geçersiz kod veya şifre.');
    } finally { setForgotSending(false); }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError(''); setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#08090a] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-8">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#FF5F03] rounded flex items-center justify-center">
              <Truck size={20} className="text-white" />
            </div>
            <span className="text-[#f7f8f8] font-[590] text-xl tracking-tight">Unysol</span>
          </button>
        </div>

        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg p-6">
          {showVerification ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-[#16A34A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-[#16A34A]" />
              </div>
              <h2 className="text-[16px] font-[590] text-[#f7f8f8] mb-2">E-postanızı Kontrol Edin</h2>
              <p className="text-[14px] text-[#8a8f98] mb-3">
                <strong className="text-[#d0d6e0]">{verificationEmail}</strong> adresine 6 haneli doğrulama kodu gönderdik.
              </p>
              <p className="text-[13px] text-[#62666d] mb-6">Gelen kutunuzu ve spam klasörünü kontrol edin.</p>
              <button
                onClick={() => { setShowVerification(false); setEmail(''); setPassword(''); setFirmaUnvani(''); setTelefon(''); }}
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#d0d6e0] px-4 py-2 rounded-md font-[510] text-[14px] hover:bg-[rgba(255,255,255,0.06)] transition-colors">
                Giriş Sayfasına Dön
              </button>
            </div>
          ) : (
          <>
          <h2 className="text-[16px] font-[590] text-[#f7f8f8] mb-0.5 text-center">
            {isSignup ? 'Hesap Oluştur' : 'Hoş Geldiniz'}
          </h2>
          <p className="text-[14px] text-[#8a8f98] mb-5 text-center">
            {isSignup ? 'Unysol ailesine katılın' : 'Hesabınıza giriş yaparak devam edin'}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-[#DC2626]/10 border border-danger/20 text-[#DC2626] text-[13px]">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignup && (
              <div>
                <label className="block text-[13px] font-[510] text-[#d0d6e0] mb-1.5">Firma Ünvanı</label>
                <input type="text" value={firmaUnvani} onChange={e => setFirmaUnvani(e.target.value)}
                  required autoComplete="organization" minLength={2} maxLength={250}
                  placeholder="Unysol Lojistik A.Ş."
                  className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40 focus:ring-1 focus:ring-[#FF5F03]/20 transition-colors" />
              </div>
            )}

            <div>
              <label className="block text-[13px] font-[510] text-[#d0d6e0] mb-1.5">E-posta</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email"
                placeholder="ornek@firma.com"
                className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40 focus:ring-1 focus:ring-[#FF5F03]/20 transition-colors" />
            </div>

            <div>
              <label className="block text-[13px] font-[510] text-[#d0d6e0] mb-1.5">Şifre</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  required autoComplete={isSignup ? 'new-password' : 'current-password'}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40 focus:ring-1 focus:ring-[#FF5F03]/20 transition-colors pr-9" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a8f98] hover:text-[#d0d6e0] transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength + policy (signup only) */}
              {isSignup && password.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[0,1,2,3,4].map(i => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-colors"
                        style={{ backgroundColor: i < pwStrength.score ? pwStrength.color : 'rgba(255,255,255,0.08)' }} />
                    ))}
                  </div>
                  <p className="text-[11px]" style={{ color: pwStrength.color }}>{pwStrength.label}</p>
                  <div className="space-y-0.5">
                    {pwStrength.checks.map((c, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px]" style={{ color: c.ok ? '#16A34A' : '#62666d' }}>
                        {c.ok ? <Check size={10} /> : <XIcon size={10} />}
                        {c.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Password confirmation (signup only) */}
            {isSignup && (
              <div>
                <label className="block text-[13px] font-[510] text-[#d0d6e0] mb-1.5">Şifre Tekrar</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}
                    required autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40 focus:ring-1 focus:ring-[#FF5F03]/20 transition-colors pr-9" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a8f98] hover:text-[#d0d6e0] transition-colors">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordConfirm.length > 0 && password !== passwordConfirm && (
                  <p className="text-[11px] text-[#DC2626] mt-1">Şifreler eşleşmiyor</p>
                )}
              </div>
            )}

            {/* Forgot password link */}
            {!isSignup && (
              <button type="button" onClick={() => { setForgotMode(true); setForgotStep('email'); setForgotMsg(''); }}
                className="text-[13px] text-[#FF5F03] hover:text-[#E55600] transition-colors text-right">
                Şifrenizi mi unuttunuz?
              </button>
            )}

            {/* Phone (signup only) */}
            {isSignup && (
              <div>
                <label className="block text-[13px] font-[510] text-[#d0d6e0] mb-1.5">
                  Telefon <span className="text-[#62666d] ml-1">(isteğe bağlı)</span>
                </label>
                <input type="tel" value={telefon} onChange={e => setTelefon(e.target.value)}
                  autoComplete="tel"
                  placeholder="+90 555 123 4567"
                  className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40 focus:ring-1 focus:ring-[#FF5F03]/20 transition-colors" />
              </div>
            )}

            {/* KVKK + Terms checkboxes (signup only) */}
            {isSignup && (
              <div className="space-y-2 pt-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={kvkkAccepted} onChange={e => setKvkkAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[rgba(255,255,255,0.2)] bg-transparent accent-[#FF5F03]" />
                  <span className="text-[12px] text-[#8a8f98] leading-relaxed">
                    <a href="/kvkk" target="_blank" className="text-[#FF5F03] hover:underline">KVKK Aydınlatma Metni</a>'ni okudum, kişisel verilerimin işlenmesini kabul ediyorum.
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[rgba(255,255,255,0.2)] bg-transparent accent-[#FF5F03]" />
                  <span className="text-[12px] text-[#8a8f98] leading-relaxed">
                    <a href="/kullanim-kosullari" target="_blank" className="text-[#FF5F03] hover:underline">Kullanım Koşulları</a> ve <a href="/gizlilik-politikasi" target="_blank" className="text-[#FF5F03] hover:underline">Gizlilik Politikası</a>'nı okudum, kabul ediyorum.
                  </span>
                </label>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2 rounded-md bg-[#FF5F03] hover:bg-[#FF5F03]-hover text-white font-[510] text-[14px] transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
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

        <button type="button" onClick={toggleMode}
          className="w-full mt-3 py-2 rounded-md bg-[#16A34A] hover:bg-[#15803D] text-white font-[510] text-[14px] transition-colors duration-150">
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
                  autoComplete="email" placeholder="E-posta adresiniz"
                  className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none mb-3" />
                <button onClick={handleForgotSend} disabled={forgotSending}
                  className="w-full py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm disabled:opacity-60">
                  {forgotSending ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Kod Gönder'}
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">Yeni Şifre</h3>
                <p className="text-sm text-[#8a8f98] mb-2">{forgotEmail} adresine kod gönderildi.</p>
                <input type="text" value={forgotCode} onChange={e => setForgotCode(e.target.value)}
                  placeholder="6 haneli kod" maxLength={6} inputMode="numeric" autoComplete="one-time-code"
                  className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none mb-3 tracking-[8px] text-center text-xl" />
                <input type="password" value={forgotPassword} onChange={e => setForgotPassword(e.target.value)}
                  placeholder="Yeni şifre" autoComplete="new-password"
                  className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none mb-2" />
                <input type="password" value={forgotConfirm} onChange={e => setForgotConfirm(e.target.value)}
                  placeholder="Yeni şifre (tekrar)" autoComplete="new-password"
                  className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none mb-3" />

                {forgotPassword.length > 0 && (
                  <div className="mb-3 text-[11px] text-[#62666d] space-y-0.5">
                    <p>Şifre en az 8 karakter, büyük/küçük harf, rakam ve özel karakter içermelidir.</p>
                  </div>
                )}

                <button onClick={handleForgotReset} disabled={forgotSending}
                  className="w-full py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm disabled:opacity-60">
                  {forgotSending ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Şifreyi Güncelle'}
                </button>

                <button onClick={handleForgotResend} disabled={forgotResendCooldown > 0}
                  className="w-full mt-2 text-[13px] text-center text-[#8a8f98] hover:text-[#d0d6e0] disabled:text-[#62666d] transition-colors">
                  {forgotResendCooldown > 0 ? `Kodu tekrar gönder (${forgotResendCooldown}s)` : 'Kodu almadınız mı? Tekrar gönder'}
                </button>
              </>
            )}

            {forgotMsg && (
              <p className={`mt-3 text-sm text-center ${forgotMsg.includes('gönderildi') || forgotMsg.includes('güncellendi') ? 'text-green-500' : 'text-red-400'}`}>
                {forgotMsg}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
