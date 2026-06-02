import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, Truck, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'input' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('E-posta adresiniz doğrulanıyor...');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [emailForResend, setEmailForResend] = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const token = searchParams.get('token');
    const urlCode = searchParams.get('code');

    if (token) {
      // Auto-verify from email link
      const queryCode = urlCode || '';
      api.get(`/api/verify?token=${token}&code=${queryCode}`)
        .then(res => {
          setStatus('success');
          setMessage(res.data.message || 'E-posta adresiniz başarıyla doğrulandı!');
          if (res.data.access_token) {
            localStorage.setItem('unysol_token', res.data.access_token);
            const user = JSON.stringify({
              id: res.data.user_id,
              email: res.data.email,
              role: res.data.role,
              tenant_id: res.data.tenant_id,
            });
            localStorage.setItem('unysol_user', user);
          }
        })
        .catch(err => {
          setStatus('input');
          setMessage(err?.response?.data?.error || 'Link geçersiz. Lütfen kodu elle girin.');
        });
    } else {
      setStatus('input');
    }
  }, [searchParams]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || '';
    }
    setCode(newCode);
    if (pasted.length === 6) inputs.current[5]?.focus();
  };

  const handleSubmit = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;
    setSubmitting(true);
    try {
      const res = await api.post('/api/auth/verify-code', { code: fullCode });
      setStatus('success');
      setMessage(res.data.message || 'E-posta adresiniz başarıyla doğrulandı!');
      if (res.data.access_token) {
        localStorage.setItem('unysol_token', res.data.access_token);
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err: any) {
      setMessage(err?.response?.data?.error || 'Doğrulama başarısız. Lütfen tekrar deneyin.');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!emailForResend) return;
    setResending(true);
    try {
      await api.post('/api/auth/resend-code', { email: emailForResend });
      setMessage('Yeni doğrulama kodu e-posta adresinize gönderildi.');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch (err: any) {
      setMessage(err?.response?.data?.error || 'Kod gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (status === 'input') inputs.current[0]?.focus();
  }, [status]);

  return (
    <div className="min-h-screen bg-[#08090a] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] text-center">
        <div className="flex justify-center mb-8">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#FF5F03] rounded flex items-center justify-center">
              <Truck size={20} className="text-white" />
            </div>
            <span className="text-[#f7f8f8] font-[590] text-xl tracking-tight">Unysol</span>
          </button>
        </div>

        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg p-8">
          {status === 'loading' && (
            <>
              <Loader2 size={40} className="animate-spin text-[#FF5F03] mx-auto mb-4" />
              <p className="text-[#d0d6e0] text-[14px]">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-[#16A34A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-[#16A34A]" />
              </div>
              <h2 className="text-[18px] font-[590] text-[#f7f8f8] mb-2">Doğrulandı!</h2>
              <p className="text-[14px] text-[#8a8f98] mb-6">{message}</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-[#FF5F03] hover:bg-[#E55600] text-white px-4 py-2.5 rounded-md font-[510] text-[14px] transition-colors"
              >
                Panele Git
              </button>
            </>
          )}

          {status === 'input' && (
            <>
              <h2 className="text-[18px] font-[590] text-[#f7f8f8] mb-2">E-posta Doğrulama</h2>
              <p className="text-[14px] text-[#8a8f98] mb-1">
                E-posta adresinize gönderilen 6 haneli kodu girin
              </p>
              <p className="text-[12px] text-[#8a8f98] mb-6">{message}</p>

              <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleCodeChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-bold rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-[#f7f8f8] focus:border-[#FF5F03] focus:outline-none transition-colors"
                  />
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={code.join('').length !== 6 || submitting}
                className="w-full bg-[#FF5F03] hover:bg-[#E55600] disabled:opacity-50 text-white px-4 py-2.5 rounded-md font-[510] text-[14px] transition-colors mb-4"
              >
                {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Doğrula'}
              </button>

              <div className="text-[13px] text-[#8a8f98]">
                Kodu almadınız mı?{' '}
                <input
                  type="email"
                  placeholder="E-posta adresiniz"
                  value={emailForResend}
                  onChange={e => setEmailForResend(e.target.value)}
                  className="bg-transparent border-b border-[rgba(255,255,255,0.12)] text-[#d0d6e0] text-[13px] px-1 py-0.5 w-48 focus:outline-none focus:border-[#FF5F03]"
                />
                {' '}
                <button
                  onClick={handleResend}
                  disabled={!emailForResend || resending}
                  className="text-[#FF5F03] hover:text-[#E55600] disabled:opacity-50 inline-flex items-center gap-1"
                >
                  {resending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  Gönder
                </button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-[#DC2626]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle size={32} className="text-[#DC2626]" />
              </div>
              <h2 className="text-[18px] font-[590] text-[#f7f8f8] mb-2">Doğrulama Başarısız</h2>
              <p className="text-[14px] text-[#8a8f98] mb-6">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#d0d6e0] px-4 py-2.5 rounded-md font-[510] text-[14px] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
              >
                Giriş Sayfasına Dön
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
