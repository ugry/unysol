import { useNavigate } from 'react-router-dom';
import {
  Truck, MapPin, Users, FileText, DollarSign, UserCheck,
  TrendingUp, CreditCard, Package, Settings, LayoutDashboard,
  LogOut, Globe, ChevronDown, ArrowRight, Play,
} from 'lucide-react';

const modules = [
  {
    icon: LayoutDashboard, title: 'Ana Panel (Dashboard)',
    desc: 'Sisteme giriş yaptığınızda sizi karşılayan ana ekrandır. Filonuzun genel durumunu tek ekranda görürsünüz.',
    steps: [
      'Aktif Kamyon: Sisteminizde kayıtlı aktif kamyon sayısı',
      'Bugünkü Kazanç: Bugün tamamlanan seferlerden elde edilen toplam gelir',
      'Bu Ay Kâr: Bu ayki gelir-gider farkı',
      'Bekleyen Tahsilat: Henüz ödenmemiş fatura toplamı',
      'Aylık Gelir Grafiği: Son 12 ayın gelir-gider karşılaştırması',
      'Yük Panosu: Yük panosundaki aktif ilan sayısı',
    ],
  },
  {
    icon: Truck, title: 'Kamyonlar',
    desc: 'Filonuzdaki tüm kamyonları buradan yönetirsiniz.',
    steps: [
      'Kamyon Ekle: "Kamyon Ekle" butonuna tıklayın. Plaka, marka, model ve yıl bilgilerini girin.',
      'Takip Yöntemi: Telefon GPS (PHONE), ESP32 LTE cihaz, ticari araç takip cihazı veya manuel seçeneklerinden birini seçin.',
      'Düzenle: Listeden bir kamyona tıklayıp bilgilerini güncelleyebilirsiniz.',
      'Sil: Kullanılmayan kamyonları silebilirsiniz.',
      'Arama: Plaka veya marka ile kamyon arayabilirsiniz.',
      'Dışa Aktar: Kamyon listenizi CSV, Excel veya PDF olarak indirebilirsiniz.',
    ],
  },
  {
    icon: MapPin, title: 'Seferler (Yeni Sefer Oluşturma)',
    desc: 'Sefer kayıtlarınızı buradan oluşturur ve takip edersiniz.',
    steps: [
      'Yeni Sefer: "Yeni Sefer" butonuna tıklayın.',
      'Plaka Seçimi: Açılan listeden kamyonu seçin. Listeniz boşsa "+ Yeni Kamyon Ekle" seçeneğinden hızlıca kamyon ekleyebilirsiniz.',
      'Şoför Seçimi: Kayıtlı şoförlerden birini seçin veya "+ Yeni Şoför Ekle" ile hızlıca ekleyin.',
      'Müşteri Seçimi: Müşteriyi listeden seçin veya "+ Yeni Müşteri Ekle" ile hızlıca ekleyin.',
      'Yükleme/Teslimat: Kalkış ve varış adreslerini girin.',
      'Ücret: Sefer ücretini TL cinsinden girin.',
      'Ödeme Şekli: Havale, nakit, kredi kartı, açık hesap, çek veya senet.',
      'Durum: AKTIF (devam eden), TAMAMLANDI, IPTAL.',
      'Otomatik Fatura: Sefer tamamlandığında otomatik fatura oluşturma seçeneği.',
    ],
  },
  {
    icon: Package, title: 'Yük Panosu',
    desc: 'Tüm nakliyecilerin yük ilanlarını gördüğü ortak pano. Yük arayanlar ve yükü olanlar burada buluşur.',
    steps: [
      'Yeni İlan: "Yeni İlan" butonuna tıklayın.',
      'İlan Türü: Yük Var (yükünüz var, nakliyeci arıyorsunuz) veya Yük Ara (boş aracınız var, yük arıyorsunuz).',
      'Kalkış/Varış: Şehir ve ilçe seçin. 81 ilin tüm ilçeleri dropdown\'da mevcuttur.',
      'Tarih: Yükün taşınacağı tarihi seçin.',
      'Ağırlık ve Araç Tipi: Yükün ağırlığı ve gereken araç tipi (TIR, Kamyon, Kırkayak, Kamyonet).',
      'Fiyat: Taşıma ücretini girin.',
      'Gelişmiş Filtreler: Fiyat aralığı, ağırlık aralığı ve araç tipine göre filtreleyin.',
      'İlgileniyorum: Başka bir nakliyecinin ilanına kalp ikonuyla ilgi gösterin. İlan sahibine bildirim gider.',
      'WhatsApp Paylaş: Yeşil WhatsApp ikonuyla ilanı WhatsApp\'ta paylaşın.',
      'İlan Süresi: Her ilan 7 gün aktiftir. Süre sayacı ilanda görünür.',
      'İlan Silme: Sadece kendi ilanlarınızı silebilirsiniz. Silme öncesi onay istenir.',
    ],
  },
  {
    icon: Users, title: 'Müşteriler',
    desc: 'Müşteri kayıtlarınızı burada tutarsınız.',
    steps: [
      'Müşteri Ekle: "Müşteri Ekle" butonuna tıklayın. Firma ünvanı, yetkili adı ve telefon girin.',
      'Düzenle: Mevcut müşteri bilgilerini güncelleyin.',
      'Arama: Firma adı veya yetkili adıyla arama yapın.',
      'Dışa Aktar: Müşteri listenizi dışa aktarın.',
    ],
  },
  {
    icon: FileText, title: 'Faturalar',
    desc: 'Müşterilerinize kestiğiniz faturaları buradan yönetirsiniz.',
    steps: [
      'Fatura Ekle: Müşteri seçin, fatura ve vade tarihini girin, hizmet kalemlerini ekleyin.',
      'KDV Hesaplama: Sistem KDV\'yi otomatik hesaplar (ara toplam, KDV, genel toplam).',
      'Durum Takibi: Taslak, Onayda, Onaylandı, Gönderildi, Ödendi, İptal.',
      'Fatura Ödeme: Faturaya ödeme kaydı girin.',
      'PDF İndir: Faturayı PDF olarak indirin.',
      'e-Fatura: PRO ve PREMIUM kullanıcılar e-Fatura olarak gönderebilir.',
    ],
  },
  {
    icon: CreditCard, title: 'Çek / Senet',
    desc: 'Aldığınız çek ve senetleri buradan takip edersiniz.',
    steps: [
      'Yeni Kayıt: Çek veya senet türünü seçin, banka, tutar ve vade bilgilerini girin.',
      'Durum Takibi: Bekliyor, Tahsil Edildi, İade.',
      'Portföy Özeti: Vadesi gelen ve geciken çek/senetleri görün.',
    ],
  },
  {
    icon: DollarSign, title: 'Giderler',
    desc: 'Tüm operasyonel giderlerinizi buradan kaydedersiniz.',
    steps: [
      'Gider Ekle: Kategori seçin (YAKIT, BAKIM, LASTIK, TAMIR, SIGORTA vb. 21 kategori).',
      'Tutar ve Açıklama: Gider tutarını ve açıklamasını girin.',
      'Kategori Özeti: Kategori bazında toplam giderleri görün.',
      'Aylık Takip: Aylara göre gider dağılımı.',
    ],
  },
  {
    icon: UserCheck, title: 'Personel',
    desc: 'Şoför ve ofis personeli kayıtlarınızı burada tutarsınız.',
    steps: [
      'Personel Ekle: Ad soyad, rol (DRIVER, OFFICE, ACCOUNTANT), telefon girin.',
      'Şoför Bilgileri: Ehliyet bitiş tarihi, SRC belgesi bitiş tarihi.',
      'Performans: Şoför bazında tamamlanan sefer sayısı ve toplam gelir.',
      'İzin Takibi: Şoför izin kayıtlarını girin ve takip edin.',
    ],
  },
  {
    icon: TrendingUp, title: 'Tahminler',
    desc: 'Geçmiş verilerinize dayanarak gelecek 12 ay için gelir, gider ve kâr tahmini yapar.',
    steps: [
      '12 Aylık Tahmin: Geçmiş sefer ve gider verilerinizden otomatik hesaplanır.',
      'Yeniden Hesapla: "Yeniden Hesapla" butonu ile tahmini güncelleyin.',
      'Bayram/Sezon Etkisi: Sistem mevsimsel değişimleri otomatik hesaba katar.',
    ],
  },
  {
    icon: Settings, title: 'Ayarlar',
    desc: 'Firma bilgilerinizi ve sistem tercihlerinizi buradan yönetirsiniz.',
    steps: [
      'Firma Bilgileri: Firma ünvanı, vergi dairesi, vergi numarası.',
      'İletişim: E-posta ve telefon bilgilerinizi güncelleyin.',
      'Dil Seçimi: Türkçe / English dil değişimi.',
    ],
  },
];

export default function HelpPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#08090a] text-[#d0d6e0]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#08090a]/90 border-b border-[rgba(255,255,255,0.05)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3.5">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#FF5F03] rounded flex items-center justify-center">
              <Truck size={16} className="text-white" />
            </div>
            <span className="text-base font-[590] tracking-tight text-[#f7f8f8]">Unysol</span>
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-[14px] bg-[#FF5F03] hover:bg-[#E55600] text-white px-4 py-2 rounded-md font-[510] transition-colors">
              Hemen Başla
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-12 px-6 text-center">
        <h1 className="text-[36px] md:text-[48px] font-[590] tracking-[-0.96px] text-[#f7f8f8] mb-4">
          Unysol Kullanım Kılavuzu
        </h1>
        <p className="text-[16px] text-[#8a8f98] max-w-2xl mx-auto">
          Aşağıda her modülün ne işe yaradığını, hangi butonların ne yaptığını ve sistemi nasıl kullanacağınızı detaylıca bulabilirsiniz.
        </p>
      </section>

      {/* Quick Nav */}
      <section className="max-w-5xl mx-auto px-6 pb-10">
        <div className="flex flex-wrap gap-2 justify-center">
          {modules.map((m) => (
            <a key={m.title} href={`#${m.title.replace(/\s+/g, '-')}`}
              className="text-[13px] px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#8a8f98] hover:text-[#d0d6e0] hover:border-[#FF5F03]/30 transition-colors no-underline">
              {m.title}
            </a>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section className="max-w-4xl mx-auto px-6 pb-20 space-y-10">
        {modules.map((m, idx) => (
          <div key={m.title} id={m.title.replace(/\s+/g, '-')} className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,0.04)] flex items-center justify-center">
                <m.icon size={22} className="text-[#FF5F03]" />
              </div>
              <div>
                <h2 className="text-[20px] font-[590] text-[#f7f8f8]">{idx + 1}. {m.title}</h2>
                <p className="text-[14px] text-[#8a8f98]">{m.desc}</p>
              </div>
            </div>
            <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-lg p-5">
              <h4 className="text-[13px] font-[510] text-[#8a8f98] mb-3 uppercase tracking-wider">Nasıl Kullanılır</h4>
              <ul className="space-y-2.5">
                {m.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[14px] text-[#d0d6e0] leading-relaxed">
                    <span className="text-[#FF5F03] font-[510] shrink-0 mt-0.5">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-[24px] font-[590] text-[#f7f8f8] mb-6 text-center">Sık Sorulan Sorular</h2>
        <div className="space-y-3">
          {[
            { q: 'Sisteme nasıl kayıt olurum?', a: 'https://unysolar.com/login adresine gidin, "Hesap Oluştur" butonuna tıklayın. Firma ünvanı, e-posta ve şifrenizi girerek kaydolun. E-posta adresinize gelen doğrulama linkine tıklayarak hesabınızı aktifleştirin. Alternatif olarak Google hesabınızla da giriş yapabilirsiniz.' },
            { q: 'FREE ve PRO arasındaki fark nedir?', a: 'FREE paket 5 kamyona kadar ücretsizdir. PRO paket 10 kamyon ve tüm özellikleri içerir (yıllık 2.000 TL). PREMIUM paket sınırsız kamyon ve öncelikli destek sunar.' },
            { q: 'Telefonumdan kullanabilir miyim?', a: 'Evet, Unysol mobil uyumludur. Telefonunuzun tarayıcısından giriş yapabilir, sefer oluşturabilir ve takip edebilirsiniz. Menü sol üstteki hamburger ikonu ile açılır.' },
            { q: 'Yük Panosu herkese açık mı?', a: 'Evet, Yük Panosu tüm Unysol kullanıcılarının görebildiği ortak bir panodur. Sadece kendi ilanlarınızı silebilirsiniz. Başkalarının ilanlarına "İlgileniyorum" butonu ile iletişime geçebilirsiniz.' },
            { q: 'İlanlar ne kadar süre aktif kalır?', a: 'Yük Panosu ilanları 7 gün boyunca aktif kalır. Süre dolduğunda otomatik olarak kapanır. Her ilanda kalan gün sayısını görebilirsiniz.' },
            { q: 'Şifremi unuttum, ne yapmalıyım?', a: 'Şu anda şifre sıfırlama özelliği geliştirilme aşamasındadır. Google ile giriş yapmışsanız şifresiz giriş yapabilirsiniz. E-posta ile kaydolduysanız info@unysolar.com adresine yazabilirsiniz.' },
          ].map((faq, i) => (
            <details key={i} className="group bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-lg">
              <summary className="flex items-center justify-between p-4 cursor-pointer text-[14px] font-[510] text-[#f7f8f8] list-none">
                {faq.q}
                <ChevronDown size={16} className="text-[#8a8f98] group-open:rotate-180 transition-transform" />
              </summary>
              <p className="px-4 pb-4 text-[14px] text-[#8a8f98] leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#08090a] border-t border-[rgba(255,255,255,0.05)] py-8 px-6 text-center">
        <p className="text-[13px] text-[#62666d]">© 2026 Unysol — Kamyoncular için yük bulma, takip ve fatura platformu</p>
      </footer>
    </div>
  );
}
