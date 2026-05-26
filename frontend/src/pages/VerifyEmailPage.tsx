import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, Truck } from 'lucide-react';
import api from '@/lib/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('E-posta adresiniz doğrulanıyor...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Doğrulama kodu bulunamadı.');
      return;
    }

    api.get(`/api/verify?token=${token}`)
      .then(res => {
        setStatus('success');
        setMessage(res.data.message || 'E-posta adresiniz başarıyla doğrulandı!');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err?.response?.data?.error || 'Doğrulama başarısız oldu. Lütfen tekrar deneyin.');
      });
  }, [searchParams]);

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
                onClick={() => navigate('/login')}
                className="w-full bg-[#FF5F03] hover:bg-[#E55600] text-white px-4 py-2.5 rounded-md font-[510] text-[14px] transition-colors"
              >
                Giriş Yap
              </button>
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
