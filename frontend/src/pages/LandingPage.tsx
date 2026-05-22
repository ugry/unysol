import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, MapPin, FileText, Users, BarChart3, UserCheck,
  Smartphone, ArrowRight, Check, Zap, Play,
  ChevronDown, ChevronUp, Phone, Mail, MapIcon,
  Monitor, Clock, HardDrive, Wifi, Shield,
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [pricing, setPricing] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    { icon: MapPin, title: 'Canlı GPS Takip', desc: 'Hangi kamyon nerede, kaç km/h hızla gidiyor, ne kadar yakıt var — hepsi canlı haritada. Şoförü aramanıza gerek kalmaz.' },
    { icon: FileText, title: 'Otomatik Fatura', desc: 'Sefer bittiğinde fatura kendiliğinden hazırlanır. e-Fatura ve e-Arşiv uyumlu. WhatsApp ile tek tıkta müşteriye gönderin.' },
    { icon: Users, title: 'Müşteri Yönetimi', desc: 'Tüm müşterileriniz, geçmiş seferleri, ödeme risk skoru ve iletişim günlüğü tek ekranda. Kim ne zaman ödemiş, hemen görün.' },
    { icon: BarChart3, title: 'Tahmin Motoru', desc: 'Geçmiş verilerinizden 12 aylık gelir, gider ve kâr tahmini yapar. Bayram ve sezon etkilerini otomatik hesaba katar.' },
    { icon: UserCheck, title: 'Personel Takibi', desc: 'Şoför performansı, izin takvimi, maaş bordrosu, ehliyet ve SRC belgesi bitiş tarihleri — hepsi otomatik uyarı sistemiyle.' },
    { icon: Smartphone, title: 'Mobil Uyumlu', desc: 'Telefondan sefer başlat/bitir, fatura kes, WhatsApp\'ta paylaş. Şoförleriniz için özel basit panel — sadece 2 buton.' },
  ];

  const plans = [
    {
      name: 'FREE', monthly: 0, yearly: 0, trucks: 1, storage: '3 Ay',
      features: ['1 Kamyon', 'GPS Takip', 'Temel Dashboard', 'Manuel Fatura', 'Topluluk Desteği'],
      popular: false,
    },
    {
      name: 'PRO', monthly: 200, yearly: 2000, trucks: 5, storage: '1 Yıl',
      features: ['5 Kamyon', 'Tüm Özellikler', 'e-Fatura / e-Arşiv', 'CRM + Personel + Gider', 'Tahmin Motoru', 'E-posta Desteği'],
      popular: true,
    },
    {
      name: 'PREMIUM', monthly: 500, yearly: 5000, trucks: 'Sınırsız', storage: 'Sınırsız',
      features: ['Sınırsız Kamyon', 'Tüm Özellikler', 'API Erişimi', 'Beyaz Etiket', 'Öncelikli Destek', 'Veri Dışa Aktarım'],
      popular: false,
    },
  ];

  const faqs = [
    { q: 'Cihaz taktırmak zorunlu mu?', a: 'Hayır. Şoförün telefonundaki GPS ile ücretsiz takip yapabilirsiniz. İsterseniz ESP32 LTE cihaz (600 TL) veya profesyonel cihaz (1.500 TL) ile OBD verilerini de alabilirsiniz.' },
    { q: 'Verilerim güvende mi?', a: 'Evet. Tüm verileriniz SSL şifreli olarak iletilir. PostgreSQL Row-Level Security ile her firma sadece kendi verisini görür. KVKK uyumluyuz. İsteyen firmalar için On-Premise kurulum da mevcut.' },
    { q: 'Ücretsiz paket gerçekten ücretsiz mi?', a: 'Evet. FREE paket 1 kamyon için süresiz ücretsizdir. Hiçbir ödeme bilgisi istenmez. İhtiyacınız büyüdükçe PRO veya PREMIUM pakete geçebilirsiniz.' },
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
            <span className="text-base font-[590] tracking-tight text-[#f7f8f8]">Logisol</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[14px] text-[#8a8f98] font-[510]">
            <button onClick={() => scrollTo('features')} className="hover:text-[#f7f8f8] transition-colors">Özellikler</button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-[#f7f8f8] transition-colors">Fiyatlar</button>
            <button onClick={() => scrollTo('faq')} className="hover:text-[#f7f8f8] transition-colors">SSS</button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-[14px] text-[#8a8f98] hover:text-[#d0d6e0] font-[510] transition-colors">Giriş Yap</button>
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
            Türkiye'nin Yeni Lojistik Otomasyonu
          </div>
          <h1 className="text-[40px] md:text-[56px] font-[590] leading-[1.05] tracking-[-0.96px] text-[#f7f8f8] mb-5">
            Filonuzu<br />
            <span className="text-[#FF5F03]">Tek Ekrandan</span> Yönetin
          </h1>
          <p className="text-[16px] md:text-[18px] text-[#8a8f98] max-w-xl mx-auto mb-8 leading-relaxed">
            GPS takip, fatura, CRM, personel ve tahmin — hepsi Logisol'de.
            Donanım şart değil, telefonunuzla başlayın.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <button
              onClick={() => navigate('/login')}
              className="bg-[#FF5F03] hover:bg-[#FF5F03]-hover text-white px-6 py-2.5 rounded-md text-[16px] font-[510] transition-colors flex items-center gap-2"
            >
              Ücretsiz Başla
              <ArrowRight size={18} />
            </button>
            <a
              href="https://demo.logisol.app"
              target="_blank" rel="noopener"
              className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] px-6 py-2.5 rounded-md text-[16px] font-[510] transition-colors hover:border-[rgba(255,255,255,0.15)] flex items-center gap-2"
            >
              <Play size={16} />
              Canlı Demo
            </a>
          </div>
          <p className="text-[13px] text-[#62666d]">7 gün ücretsiz · Kredi kartı gerekmez · İptal istediğiniz zaman</p>
        </div>

        {/* Stats */}
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-8 mt-12">
          {[
            { value: '5.000+', label: 'Aktif Kamyon' },
            { value: '120+', label: 'Kayıtlı Firma' },
            { value: '99.9%', label: 'Uptime' },
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
              <Shield size={13} /> Her Şey Dahil
            </div>
            <h2 className="text-[28px] md:text-[36px] font-[590] tracking-[-0.64px] text-[#f7f8f8] mb-3">İhtiyacınız Olan Her Şey</h2>
            <p className="text-[#8a8f98] text-[16px] max-w-lg mx-auto">GPS'ten bordroya, faturadan tahmine — tek platformda.</p>
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

      {/* ===== SCREENSHOTS ===== */}
      <section className="py-20 px-6 bg-[#08090a]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-[28px] md:text-[36px] font-[590] tracking-[-0.64px] text-[#f7f8f8] mb-3">Profesyonel Arayüz</h2>
          <p className="text-[#8a8f98] text-[16px] mb-12">Gerçek ekran görüntüleri — görmek inanmaktır.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: 'Dashboard', desc: 'Tüm operasyonunuz tek ekranda: KPI\'lar, canlı harita, yaklaşan uyarılar.', icon: Monitor },
              { title: 'Sefer Yönetimi', desc: 'Sefer oluşturma, durum takibi, rota görüntüleme, otomatik fatura.', icon: MapPin },
              { title: 'Filo Takip', desc: 'Canlı GPS, yakıt seviyesi, RPM, arıza kodları — hepsi gerçek zamanlı.', icon: Truck },
            ].map((s) => (
              <div key={s.title} className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-lg p-6">
                <s.icon size={28} className="text-[#FF5F03] mb-3 mx-auto" />
                <h3 className="text-[16px] font-[590] text-[#f7f8f8] mb-1.5">{s.title}</h3>
                <p className="text-[14px] text-[#8a8f98]">{s.desc}</p>
              </div>
            ))}
          </div>
          <a
            href="https://demo.logisol.app"
            target="_blank" rel="noopener"
            className="inline-flex items-center gap-1.5 mt-8 text-[#FF5F03] text-[14px] font-[510] hover:text-[#FF5F03]-hover transition-colors"
          >
            <Play size={16} />
            Canlı Demo'yu Deneyin
          </a>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-20 px-6 bg-[#0f1011]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[28px] md:text-[36px] font-[590] tracking-[-0.64px] text-[#f7f8f8] mb-3">Basit Fiyatlandırma</h2>
            <p className="text-[#8a8f98] text-[16px] mb-5">Tüm özellikler tüm paketlerde açık. Büyüdükçe yükseltin.</p>
            <div className="inline-flex bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-md p-0.5">
              <button
                onClick={() => setPricing('monthly')}
                className={`px-4 py-1.5 rounded text-[14px] font-[510] transition-colors ${pricing === 'monthly' ? 'bg-[#FF5F03] text-white' : 'text-[#8a8f98] hover:text-[#d0d6e0]'}`}
              >
                Aylık
              </button>
              <button
                onClick={() => setPricing('yearly')}
                className={`px-4 py-1.5 rounded text-[14px] font-[510] transition-colors ${pricing === 'yearly' ? 'bg-[#FF5F03] text-white' : 'text-[#8a8f98] hover:text-[#d0d6e0]'}`}
              >
                Yıllık <span className="text-[11px] ml-1 bg-[#FF5F03]-bg text-[#FF5F03] px-1.5 py-0.5 rounded-full">%17 tasarruf</span>
              </button>
            </div>
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
                      {price === 0 ? 'Ücretsiz' : `₺${price.toLocaleString('tr')}`}
                    </span>
                    {price > 0 && <span className="text-[#8a8f98] text-[14px]">/{period}</span>}
                  </div>
                  <div className="text-[13px] text-[#8a8f98] mb-5">
                    {typeof p.trucks === 'number' ? `${p.trucks} kamyon` : p.trucks} · {p.storage} veri
                  </div>
                  <button
                    onClick={() => navigate('/login')}
                    className={`w-full py-2 rounded-md font-[510] text-[14px] transition-colors ${
                      p.popular
                        ? 'bg-[#FF5F03] hover:bg-[#FF5F03]-hover text-white'
                        : 'bg-[rgba(255,255,255,0.04)] text-[#d0d6e0] hover:bg-[rgba(255,255,255,0.06)]'
                    }`}
                  >
                    {price === 0 ? 'Ücretsiz Başla' : 'Hemen Başla'}
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

      {/* ===== TECH SPECS ===== */}
      <section className="py-16 px-6 bg-[#08090a] border-y border-[rgba(255,255,255,0.05)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[24px] font-[590] text-[#f7f8f8] text-center mb-8">Sistem Gereksinimleri</h2>
          <div className="grid md:grid-cols-4 gap-5">
            {[
              { icon: Monitor, title: 'Web Tarayıcı', desc: 'Chrome, Firefox, Safari, Edge — son 2 sürüm' },
              { icon: Smartphone, title: 'Mobil', desc: 'iOS 15+ ve Android 10+ cihazlarda tam uyumlu' },
              { icon: Wifi, title: 'İnternet', desc: '2 Mbps bağlantı yeterli. Çevrimdışı modda veri SD karta yazılır.' },
              { icon: HardDrive, title: 'Cihaz', desc: 'ESP32 LTE Cat-1 (600 TL) veya mevcut telefon GPS\'i (ücretsiz)' },
            ].map((s) => (
              <div key={s.title} className="text-center">
                <s.icon size={24} className="text-[#FF5F03] mb-2.5 mx-auto" />
                <h3 className="text-[14px] font-[590] text-[#f7f8f8] mb-1">{s.title}</h3>
                <p className="text-[13px] text-[#8a8f98]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20 px-6 bg-[#0f1011]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-[28px] md:text-[36px] font-[590] tracking-[-0.64px] text-[#f7f8f8] mb-3">Nakliyeciler Ne Diyor?</h2>
          <p className="text-[#8a8f98] text-[16px] mb-12">Gerçek kullanıcı yorumları.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { quote: 'Logisol ile şoförlerimi arayıp "neredesin" diye sormayı bıraktım. Ayda 200 TL verip 5.000 TL mazot ve ceza tasarrufu yapıyorum.', author: 'Ahmet Y.', company: 'Çelik Nakliyat, İstanbul' },
              { quote: 'Fatura işi kabusumdu. Şimdi sefer bitince sistem faturayı hazırlıyor, ben WhatsApp\'tan müşteriye atıyorum. İnanılmaz zaman kazandım.', author: 'Mehmet K.', company: 'Anadolu Lojistik, Ankara' },
              { quote: 'Telefonumdan takip edebilmek harika. ESP32 cihaz bile almadım, Free paketle başladım. 3 ay sonra PRO\'ya geçtim, şimdi 5 kamyonum var.', author: 'Ayşe S.', company: 'Ege Transport, İzmir' },
            ].map((t) => (
              <div key={t.author} className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 text-left">
                <p className="text-[14px] text-[#d0d6e0] leading-relaxed mb-4">"{t.quote}"</p>
                <div className="border-t border-[rgba(255,255,255,0.05)] pt-3.5">
                  <div className="text-[14px] font-[590] text-[#f7f8f8]">{t.author}</div>
                  <div className="text-[12px] text-[#62666d] mt-0.5">{t.company}</div>
                </div>
              </div>
            ))}
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
                { icon: Mail, text: 'info@logisol.app' },
                { icon: MapIcon, text: 'İstanbul, Türkiye' },
              ].map((c) => (
                <div key={c.text} className="flex items-center gap-3 text-[#d0d6e0]">
                  <c.icon size={18} className="text-[#FF5F03]" />
                  <span className="text-[14px]">{c.text}</span>
                </div>
              ))}
            </div>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <input type="text" placeholder="Ad Soyad" className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40 focus:ring-1 focus:ring-[#FF5F03]/20 transition-colors" />
              <input type="email" placeholder="E-posta" className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40 focus:ring-1 focus:ring-[#FF5F03]/20 transition-colors" />
              <textarea placeholder="Mesajınız" rows={4} className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40 focus:ring-1 focus:ring-[#FF5F03]/20 transition-colors resize-none" />
              <button type="submit" className="bg-[#FF5F03] hover:bg-[#FF5F03]-hover text-white px-5 py-2 rounded-md font-[510] text-[14px] transition-colors w-full">Gönder</button>
            </form>
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
              <span className="text-base font-[590] text-[#f7f8f8]">Logisol</span>
            </div>
            <p className="text-[13px] leading-relaxed">Türkiye'nin akıllı lojistik otomasyon platformu. Küçük ve orta ölçekli nakliye firmaları için tasarlandı.</p>
          </div>
          <div>
            <h4 className="text-[14px] font-[590] text-[#f7f8f8] mb-3">Ürün</h4>
            <div className="space-y-2 text-[13px]">
              <div><button onClick={() => scrollTo('features')} className="hover:text-[#d0d6e0] transition-colors">Özellikler</button></div>
              <div><button onClick={() => scrollTo('pricing')} className="hover:text-[#d0d6e0] transition-colors">Fiyatlar</button></div>
              <div><a href="https://demo.logisol.app" target="_blank" rel="noopener" className="hover:text-[#d0d6e0] transition-colors">Canlı Demo</a></div>
              <div><span className="hover:text-[#d0d6e0] transition-colors cursor-pointer">Güncellemeler</span></div>
            </div>
          </div>
          <div>
            <h4 className="text-[14px] font-[590] text-[#f7f8f8] mb-3">Destek</h4>
            <div className="space-y-2 text-[13px]">
              <div><button onClick={() => scrollTo('faq')} className="hover:text-[#d0d6e0] transition-colors">SSS</button></div>
              <div><span className="hover:text-[#d0d6e0] transition-colors cursor-pointer">Dokümantasyon</span></div>
              <div><span className="hover:text-[#d0d6e0] transition-colors cursor-pointer">İletişim</span></div>
              <div><span className="hover:text-[#d0d6e0] transition-colors cursor-pointer">API Referansı</span></div>
            </div>
          </div>
          <div>
            <h4 className="text-[14px] font-[590] text-[#f7f8f8] mb-3">Yasal</h4>
            <div className="space-y-2 text-[13px]">
              <div><span className="hover:text-[#d0d6e0] transition-colors cursor-pointer">KVKK</span></div>
              <div><span className="hover:text-[#d0d6e0] transition-colors cursor-pointer">Kullanım Koşulları</span></div>
              <div><span className="hover:text-[#d0d6e0] transition-colors cursor-pointer">Gizlilik Politikası</span></div>
              <div><span className="hover:text-[#d0d6e0] transition-colors cursor-pointer">Çerez Politikası</span></div>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto border-t border-[rgba(255,255,255,0.05)] mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-[12px] text-[#62666d]">© 2026 Logisol. Tüm hakları saklıdır.</div>
          <div className="flex items-center gap-4 text-[11px] text-[#62666d]">
            <span className="hover:text-[#8a8f98] cursor-pointer">3D Secure</span>
            <span className="hover:text-[#8a8f98] cursor-pointer">256-bit SSL</span>
          </div>
        </div>
      </footer>

      {/* ===== COOKIE BANNER ===== */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0f1011] border-t border-[rgba(255,255,255,0.08)] shadow-lg z-50 p-3.5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-[13px] text-[#8a8f98] max-w-2xl">
            6698 sayılı KVKK kapsamında, size daha iyi hizmet sunabilmek için çerezler kullanıyoruz.
            <span className="text-[#FF5F03] cursor-pointer hover:text-[#FF5F03]-hover ml-1">Çerez Politikası</span>
          </p>
          <div className="flex items-center gap-2.5 shrink-0">
            <button className="text-[13px] text-[#8a8f98] hover:text-[#d0d6e0] px-3 py-1.5 rounded-md border border-[rgba(255,255,255,0.08)] transition-colors font-[510]">Sadece Zorunlu</button>
            <button className="text-[13px] bg-[#FF5F03] hover:bg-[#FF5F03]-hover text-white px-3 py-1.5 rounded-md font-[510] transition-colors">Tümünü Kabul Et</button>
          </div>
        </div>
      </div>
    </div>
  );
}
