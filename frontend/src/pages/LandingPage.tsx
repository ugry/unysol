import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Truck, MapPin, FileText, BarChart3, UserCheck,
  Smartphone, ArrowRight, Check, Zap, Play,
  ChevronDown, ChevronUp, Phone, Mail, MapIcon,
  Sparkles,
} from 'lucide-react';
import api from '@/lib/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [pricing] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactPlan, setContactPlan] = useState('PREMIUM');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [cookiesAccepted, setCookiesAccepted] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    { icon: MapPin, title: 'Canlı Takip', desc: 'Hangi kamyon nerede, kaç km hızla gidiyor — canlı haritada. Şoförü aramana gerek yok.' },
    { icon: FileText, title: 'Otomatik Fatura', desc: 'Sefer bitince fatura hazır. WhatsApp\'la müşterine 1 tıkta gönder.' },
    { icon: Truck, title: 'Yük Panosu', desc: 'Yük ara, yük ver. Nakliyeciler arası yük paylaşım platformu.' },
    { icon: BarChart3, title: 'Kazanç Tahmini', desc: 'Gelecek 12 ay ne kadar kazanacaksın? Geçmişinden hesaplar, bayram/sezon etkisini bilir.' },
    { icon: UserCheck, title: 'Şoför Takibi', desc: 'Ehliyet, SRC, izin tarihleri — otomatik uyarı gelir, cezaya girme.' },
    { icon: Smartphone, title: 'Telefonda Çalışır', desc: 'Sefer başlat/bitir, fatura kes. Şoförün için 2 butonlu basit panel.' },
  ];

  const plans = [
    {
      name: 'FREE', monthly: 0, yearly: 0, trucks: 3,
      features: ['3 Kamyon', 'GPS Takip', 'Yük Panosu', 'Temel Dashboard', 'Manuel Fatura'],
      popular: false,
      cta: 'Ücretsiz Başla',
    },
    {
      name: 'PRO', monthly: 0, yearly: 0, trucks: 10,
      features: ['10 Kamyon', 'Tüm Özellikler', 'e-Fatura / e-Arşiv', 'CRM + Personel + Gider', 'Tahmin Motoru', 'E-posta + Telefon Desteği'],
      popular: true,
      note: 'İlk 12 ay ücretsiz · Sonra 2.000 TL/yıl',
      cta: 'Ücretsiz Başla',
    },
    {
      name: 'PREMIUM', monthly: -1, yearly: -1, trucks: 'Sınırsız',
      features: ['Sınırsız Kamyon', 'Tüm Özellikler', 'API Erişimi', 'Beyaz Etiket', 'Öncelikli Destek', 'Veri Dışa Aktarım'],
      popular: false,
      note: 'Özel fiyatlandırma için',
      cta: 'Satış ile İletişime Geç',
    },
  ];

  const faqs = [
    { q: 'Cihaz taktırmak zorunlu mu?', a: 'Hayır. Şoförün telefonundaki GPS ile ücretsiz takip yapabilirsiniz. İsterseniz ESP32 LTE cihaz (600 TL) veya profesyonel cihaz (1.500 TL) ile OBD verilerini de alabilirsiniz.' },
    { q: 'Verilerim güvende mi?', a: 'Evet. Tüm verileriniz SSL şifreli olarak iletilir. PostgreSQL Row-Level Security ile her firma sadece kendi verisini görür. KVKK uyumluyuz. İsteyen firmalar için On-Premise kurulum da mevcut.' },
    { q: 'Ücretsiz paket gerçekten ücretsiz mi?', a: 'Evet. FREE paket 3 kamyon için süresiz ücretsizdir. PRO paket ilk 12 ay ücretsizdir. Hiçbir ödeme bilgisi istenmez.' },
    { q: 'Mevcut verilerimi aktarabilir miyim?', a: 'Evet. CSV dosyası ile toplu olarak müşteri, kamyon ve şoför verilerinizi içe aktarabilirsiniz. Ayrıca FiloMetrik, Lojisoft gibi sistemlerden geçiş için özel import araçlarımız var.' },
    { q: 'e-Fatura kesebilir miyim?', a: 'Evet. PRO ve PREMIUM paketlerde e-Fatura ve e-Arşiv entegrasyonu mevcuttur. Gelir İdaresi Başkanlığı (GİB) onaylı entegratörler üzerinden faturalarınızı yasal olarak iletebilirsiniz.' },
    { q: 'Kaç kullanıcı giriş yapabilir?', a: 'Sınırsız. Firma sahibi, operasyon sorumlusu, muhasebeci ve şoför olmak üzere 4 farklı rol tanımlayabilir, her role farklı yetkiler verebilirsiniz.' },
  ];

  return (
    <div className="min-h-screen bg-[#0f1011] text-[#d0d6e0]">
      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#08090a]/90 border-b border-[rgba(255,255,255,0.05)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#FF5F03] rounded flex items-center justify-center">
              <Truck size={16} className="text-white" />
            </div>
            <span className="text-base font-[590] tracking-tight text-[#f7f8f8]">Unysol</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[14px] text-[#8a8f98] font-[510]">
            <button onClick={() => scrollTo('features')} className="hover:text-[#f7f8f8] transition-colors">{t('landing.features')}</button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-[#f7f8f8] transition-colors">{t('landing.pricing')}</button>
            <button onClick={() => scrollTo('faq')} className="hover:text-[#f7f8f8] transition-colors">{t('landing.faq')}</button>
            <button onClick={() => scrollTo('contact')} className="hover:text-[#f7f8f8] transition-colors">İletişim</button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-[14px] text-[#8a8f98] hover:text-[#d0d6e0] font-[510] transition-colors">{t('landing.cta_login')}</button>
            <button onClick={() => navigate('/login')} className="text-[14px] bg-[#FF5F03] hover:bg-[#FF5F03]-hover text-white px-4 py-2 rounded-md font-[510] transition-colors">
              Ücretsiz Başla
            </button>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#FF5F03]-bg border border-[#FF5F03]/20 rounded-full px-3.5 py-1 text-[13px] text-[#FF5F03] font-[510] mb-6">
            <Zap size={13} />
            Türkiye'nin Kamyoncu Platformu
          </div>
          <h1 className="text-[40px] md:text-[56px] font-[590] leading-[1.05] tracking-[-0.96px] text-[#f7f8f8] mb-5">
            {t('landing.hero_title_1')}<br />
            <span className="text-[#FF5F03]">{t('landing.hero_title_2')}</span> {t('landing.hero_title_3')}
          </h1>
          <p className="text-[16px] md:text-[18px] text-[#8a8f98] max-w-xl mx-auto mb-8 leading-relaxed">
            {t('landing.hero_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <button
              onClick={() => navigate('/login')}
              className="bg-[#FF5F03] hover:bg-[#FF5F03]-hover text-white px-6 py-2.5 rounded-md text-[16px] font-[510] transition-colors flex items-center gap-2"
            >
              {t('landing.cta_free')}
              <ArrowRight size={18} />
            </button>
            <button
              onClick={async () => {
                try {
                  const res = await api.post('/api/demo/create');
                  if (res.data?.email) {
                    const loginRes = await api.post('/api/auth/login', {
                      email: res.data.email,
                      password: res.data.password || 'Demo1234!',
                    });
                    if (loginRes.data?.access_token) {
                      localStorage.setItem('logisol_token', loginRes.data.access_token);
                      navigate('/dashboard');
                      return;
                    }
                  }
                } catch {}
                navigate('/login');
              }}
              className="bg-[#2a2a2a] hover:bg-[#333333] text-[#f7f8f8] border border-[#FF5F03]/30 px-6 py-2.5 rounded-md text-[16px] font-[510] transition-colors flex items-center gap-2"
            >
              <Sparkles size={18} />
              {t('landing.cta_demo')}
            </button>
            <button
              onClick={() => scrollTo('pricing')}
              className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] px-6 py-2.5 rounded-md text-[16px] font-[510] transition-colors hover:border-[rgba(255,255,255,0.15)] flex items-center gap-2"
            >
              <Play size={16} />
              Fiyatları Gör
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <button
              onClick={() => {
                const shareText = 'Unysol — Kamyoncular için yük bulma, takip ve fatura platformu. Ücretsiz başla: https://unysol.app';
                window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
              }}
              className="text-[13px] text-[#25D366] hover:text-[#20bd5a] font-[510] flex items-center gap-1 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp'ta Paylaş
            </button>
          </div>
          <p className="text-[13px] text-[#62666d]">FREE süresiz · PRO 12 ay ücretsiz · Kredi kartı gerekmez</p>
        </div>

        {/* Stats */}
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-8 mt-12">
          {[
            { value: '3 Kamyon', label: 'Ücretsiz Paket' },
            { value: '1 dk', label: 'Kayıt Süresi' },
            { value: 'Telefondan', label: 'Her Yerden Erişim' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-[28px] md:text-[32px] font-[590] text-[#FF5F03]">{s.value}</div>
              <div className="text-[13px] text-[#8a8f98] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-20 px-6 bg-[#08090a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-[#FF5F03]-bg border border-[#FF5F03]/20 rounded-full px-3.5 py-1 text-[13px] text-[#FF5F03] font-[510] mb-4">
              <Truck size={13} /> Her Şey Dahil
            </div>
            <h2 className="text-[28px] md:text-[36px] font-[590] tracking-[-0.64px] text-[#f7f8f8] mb-3">İhtiyacınız Olan Her Şey</h2>
            <p className="text-[#8a8f98] text-[16px] max-w-lg mx-auto">Yük bul, takip et, fatura kes — tek platformda.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-lg p-5 hover:border-[#FF5F03]/30 transition-colors group">
                <div className="w-10 h-10 rounded-md bg-[#FF5F03]-bg flex items-center justify-center mb-4">
                  <f.icon size={20} className="text-[#FF5F03]" />
                </div>
                <h3 className="text-[16px] font-[590] text-[#f7f8f8] mb-2">{f.title}</h3>
                <p className="text-[14px] text-[#8a8f98] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 px-6 bg-[#0f1011]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-[28px] md:text-[36px] font-[590] tracking-[-0.64px] text-[#f7f8f8] mb-3">Nasıl Çalışır?</h2>
            <p className="text-[#8a8f98] text-[16px]">4 adımda filonuz dijitalleşir.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-5">
            {[
              { step: '1', title: 'Kayıt Olun', desc: '1 dakikada ücretsiz hesap oluşturun. Kredi kartı gerekmez.' },
              { step: '2', title: 'Kamyon Ekleyin', desc: 'Plaka, marka, model girin. Telefon GPS\'i ile hemen takibe başlayın.' },
              { step: '3', title: 'Sefer Oluşturun', desc: 'Şoför, müşteri ve yük bilgisini girin. Sistem rotayı kaydeder.' },
              { step: '4', title: 'Takip Edin, Kazanın', desc: 'Canlı haritada izleyin, faturayı otomatik kesin, tahminlerle büyüyün.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-md bg-[#FF5F03] text-white flex items-center justify-center text-[18px] font-[590] mx-auto mb-3">
                  {s.step}
                </div>
                <h3 className="text-[16px] font-[590] text-[#f7f8f8] mb-1.5">{s.title}</h3>
                <p className="text-[14px] text-[#8a8f98]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-20 px-6 bg-[#0f1011]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[28px] md:text-[36px] font-[590] tracking-[-0.64px] text-[#f7f8f8] mb-3">Basit Fiyatlandırma</h2>
            <p className="text-[#8a8f98] text-[16px]">FREE süresiz · PRO ilk 12 ay ücretsiz · Sonra 2.000 TL/yıl</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {plans.map((p) => {
              const price = pricing === 'monthly' ? p.monthly : p.yearly;
              const period = pricing === 'monthly' ? 'ay' : 'yıl';
              return (
                <div
                  key={p.name}
                  className={`relative bg-[rgba(255,255,255,0.02)] rounded-lg p-6 border transition-colors ${
                    p.popular
                      ? 'border-[#FF5F03]/40'
                      : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)]'
                  }`}
                >
                  {p.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#FF5F03] text-white text-[12px] font-[510] px-3 py-0.5 rounded-full">
                      En Popüler
                    </div>
                  )}
                  <div className="text-[13px] text-[#8a8f98] font-[510] mb-1.5">{p.name}</div>
                  <div className="mb-3">
                    <span className="text-[32px] font-[590] text-[#f7f8f8]">
                      {price === -1 ? 'Özel Fiyat' : price === 0 ? 'Ücretsiz' : `₺${price.toLocaleString('tr')}`}
                    </span>
                    {price > 0 && <span className="text-[#8a8f98] text-[14px]">/{period}</span>}
                  </div>
                  <div className="text-[13px] text-[#8a8f98] mb-3">
                    {typeof p.trucks === 'number' ? `${p.trucks} kamyon` : p.trucks}
                  </div>
                  {p.note && (
                    <div className="text-[12px] text-[#FF5F03] font-[510] mb-4">{p.note}</div>
                  )}
                  <button
                    onClick={() => { scrollTo('contact'); }}
                    className={`w-full py-2 rounded-md font-[510] text-[14px] transition-colors ${
                      p.name === 'PREMIUM'
                        ? 'bg-[rgba(255,255,255,0.04)] text-[#d0d6e0] hover:bg-[rgba(255,255,255,0.06)]'
                        : p.popular
                        ? 'bg-[#FF5F03] hover:bg-[#FF5F03]-hover text-white'
                        : 'bg-[rgba(255,255,255,0.04)] text-[#d0d6e0] hover:bg-[rgba(255,255,255,0.06)]'
                    }`}
                  >
                    {p.cta || (price === 0 ? 'Ücretsiz Başla' : 'Hemen Başla')}
                  </button>
                  <ul className="mt-5 space-y-2.5">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-[#8a8f98]">
                        <Check size={14} className="text-[#FF5F03] shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="py-20 px-6 bg-[#08090a]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[28px] md:text-[36px] font-[590] tracking-[-0.64px] text-[#f7f8f8] text-center mb-3">Sık Sorulan Sorular</h2>
          <p className="text-[#8a8f98] text-center mb-12">Merak ettikleriniz.</p>
          <div className="space-y-2.5">
            {faqs.map((f, i) => (
              <div key={i} className="border border-[rgba(255,255,255,0.08)] rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                >
                  <span className="text-[14px] font-[510] text-[#f7f8f8]">{f.q}</span>
                  {openFaq === i ? <ChevronUp size={16} className="text-[#8a8f98] shrink-0" /> : <ChevronDown size={16} className="text-[#8a8f98] shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-[14px] text-[#d0d6e0] leading-relaxed border-t border-[rgba(255,255,255,0.05)] pt-3.5">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section className="py-20 px-6 bg-[#0f1011]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[28px] md:text-[36px] font-[590] tracking-[-0.64px] text-[#f7f8f8] text-center mb-3">Bize Ulaşın</h2>
          <p className="text-[#8a8f98] text-center mb-12">Sorularınız için buradayız.</p>
          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-4">
                {[
                  { icon: Phone, text: '+90 212 555 00 00' },
                  { icon: Mail, text: 'info@unysol.app' },
                  { icon: MapIcon, text: 'İstanbul, Türkiye' },
              ].map((c) => (
                <div key={c.text} className="flex items-center gap-3 text-[#d0d6e0]">
                  <c.icon size={18} className="text-[#FF5F03]" />
                  {c.icon === Phone ? (
                    <a href="tel:+902125550000" className="text-[14px] hover:text-[#FF5F03] transition-colors">{c.text}</a>
                  ) : c.icon === Mail ? (
                    <a href="mailto:info@unysol.app" className="text-[14px] hover:text-[#FF5F03] transition-colors">{c.text}</a>
                  ) : (
                    <span className="text-[14px]">{c.text}</span>
                  )}
                </div>
              ))}
            </div>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); setContactSent(true); }}>
              <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Ad Soyad" className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40 focus:ring-1 focus:ring-[#FF5F03]/20 transition-colors" />
              <div className="grid grid-cols-2 gap-3">
                <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="E-posta" className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40 focus:ring-1 focus:ring-[#FF5F03]/20 transition-colors" />
                <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="Telefon" className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40 focus:ring-1 focus:ring-[#FF5F03]/20 transition-colors" />
              </div>
              <select value={contactPlan} onChange={e => setContactPlan(e.target.value)} className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-[14px] outline-none focus:border-[#FF5F03]/40 focus:ring-1 focus:ring-[#FF5F03]/20 transition-colors appearance-none cursor-pointer">
                <option value="PREMIUM">PREMIUM — Sınırsız Kamyon</option>
                <option value="PRO">PRO — 10 Kamyon</option>
                <option value="FREE">FREE — 3 Kamyon</option>
                <option value="DIGER">Diğer / Genel Soru</option>
              </select>
              <textarea value={contactMsg} onChange={e => setContactMsg(e.target.value)} placeholder="Filo büyüklüğünüz ve ihtiyaçlarınız..." rows={3} className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40 focus:ring-1 focus:ring-[#FF5F03]/20 transition-colors resize-none" />
              {contactSent ? (
                <div className="bg-[#16A34A]/10 border border-[#16A34A]/20 text-[#16A34A] px-4 py-2 rounded-md text-[14px]">Mesajınız iletildi! 24 saat içinde dönüş yapacağız.</div>
              ) : (
                <button type="submit" className="bg-[#FF5F03] hover:bg-[#E55600] text-white px-5 py-2 rounded-md font-[510] text-[14px] transition-colors w-full">Gönder</button>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* ===== REFERRAL ===== */}
      <section className="py-20 px-6 bg-[#0f1011]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[28px] md:text-[36px] font-[590] tracking-[-0.64px] text-[#f7f8f8] mb-3">Arkadaşına Öner, İkiniz de Kazanın</h2>
          <p className="text-[#8a8f98] text-[16px] mb-7">Tanıdığın bir kamyoncu Unysol'e kayıt olursa ikinize de 1 yıl PRO hediyemiz var.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                const shareText = 'Kamyoncular için yük bulma, takip ve fatura platformu Unysol\'e ücretsiz kayıt ol. Bu linkle gelene 1 yıl PRO bedava: https://unysol.app';
                window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
              }}
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-2.5 rounded-md text-[16px] font-[510] transition-colors inline-flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp'tan Davet Et
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] px-6 py-2.5 rounded-md text-[16px] font-[510] hover:border-[rgba(255,255,255,0.15)] transition-colors"
            >
              Kayıt Ol, Davet Kodunu Al
            </button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER CTA ===== */}
      <section className="bg-[#FF5F03] py-16 px-6 text-center">
        <h2 className="text-[28px] md:text-[36px] font-[590] text-white mb-3">Filonuzu Bugün Dijitalleştirin</h2>
        <p className="text-white/70 text-[16px] mb-7 max-w-lg mx-auto">1 dakikada kayıt olun, 5 dakikada ilk kamyonunuzu ekleyin. Tamamen ücretsiz başlayın.</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-white text-[#FF5F03] px-6 py-2.5 rounded-md text-[16px] font-[590] hover:bg-white/90 transition-colors inline-flex items-center gap-2"
        >
          Hemen Başla
          <ArrowRight size={18} />
        </button>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#08090a] text-[#8a8f98] py-14 px-6 border-t border-[rgba(255,255,255,0.05)]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3.5">
              <div className="w-7 h-7 rounded bg-[#FF5F03] flex items-center justify-center">
                <Truck size={14} className="text-white" />
              </div>
              <span className="text-base font-[590] text-[#f7f8f8]">Unysol</span>
            </div>
            <p className="text-[13px] leading-relaxed">Türkiye'nin akıllı lojistik otomasyon platformu. Küçük ve orta ölçekli nakliye firmaları için tasarlandı.</p>
          </div>
          <div>
            <h4 className="text-[14px] font-[590] text-[#f7f8f8] mb-3">Ürün</h4>
            <div className="space-y-2 text-[13px]">
              <div><button onClick={() => scrollTo('features')} className="hover:text-[#d0d6e0] transition-colors">Özellikler</button></div>
              <div><button onClick={() => scrollTo('pricing')} className="hover:text-[#d0d6e0] transition-colors">Fiyatlar</button></div>
              <div><button onClick={() => navigate('/login')} className="hover:text-[#d0d6e0] transition-colors">Demo Hesap</button></div>
              <div><button onClick={() => scrollTo('faq')} className="hover:text-[#d0d6e0] transition-colors">SSS</button></div>
            </div>
          </div>
          <div>
            <h4 className="text-[14px] font-[590] text-[#f7f8f8] mb-3">Destek</h4>
            <div className="space-y-2 text-[13px]">
              <div><button onClick={() => scrollTo('faq')} className="hover:text-[#d0d6e0] transition-colors">SSS</button></div>
              <div><button onClick={() => scrollTo('contact')} className="hover:text-[#d0d6e0] transition-colors">İletişim</button></div>
              <div><button onClick={() => navigate('/login')} className="hover:text-[#d0d6e0] transition-colors">Dokümantasyon</button></div>
              <div><button onClick={() => scrollTo('features')} className="hover:text-[#d0d6e0] transition-colors">API Referansı</button></div>
            </div>
          </div>
          <div>
            <h4 className="text-[14px] font-[590] text-[#f7f8f8] mb-3">Yasal</h4>
            <div className="space-y-2 text-[13px]">
              <div><button onClick={() => scrollTo('faq')} className="hover:text-[#d0d6e0] transition-colors">KVKK</button></div>
              <div><button onClick={() => navigate('/login')} className="hover:text-[#d0d6e0] transition-colors">Kullanım Koşulları</button></div>
              <div><button onClick={() => navigate('/login')} className="hover:text-[#d0d6e0] transition-colors">Gizlilik Politikası</button></div>
              <div><button onClick={() => scrollTo('faq')} className="hover:text-[#d0d6e0] transition-colors">Çerez Politikası</button></div>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto border-t border-[rgba(255,255,255,0.05)] mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-[12px] text-[#62666d]">© 2026 Unysol. Tüm hakları saklıdır.</div>
          <div className="flex items-center gap-4 text-[11px] text-[#62666d]">
            <span className="hover:text-[#8a8f98] cursor-pointer">3D Secure</span>
            <span className="hover:text-[#8a8f98] cursor-pointer">256-bit SSL</span>
          </div>
        </div>
      </footer>

      {/* ===== COOKIE BANNER ===== */}
      {!cookiesAccepted && (
      <div className="fixed bottom-0 left-0 right-0 bg-[#0f1011] border-t border-[rgba(255,255,255,0.08)] shadow-lg z-50 p-3.5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-[13px] text-[#8a8f98] max-w-2xl">
            Size daha iyi hizmet sunabilmek için çerezler kullanıyoruz.
            <span className="text-[#FF5F03] cursor-pointer hover:text-[#FF5F03]-hover ml-1" onClick={() => scrollTo('faq')}>Çerez Politikası</span>
          </p>
          <div className="flex items-center gap-2.5 shrink-0">
            <button onClick={() => setCookiesAccepted(true)} className="text-[13px] text-[#8a8f98] hover:text-[#d0d6e0] px-3 py-1.5 rounded-md border border-[rgba(255,255,255,0.08)] transition-colors font-[510]">Sadece Zorunlu</button>
            <button onClick={() => setCookiesAccepted(true)} className="text-[13px] bg-[#FF5F03] hover:bg-[#E55600] text-white px-3 py-1.5 rounded-md font-[510] transition-colors">Tümünü Kabul Et</button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
