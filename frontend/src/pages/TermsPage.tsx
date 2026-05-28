export default function TermsPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ color: '#FF5F03', fontSize: 28, marginBottom: 20 }}>Kullanım Koşulları</h1>
      <p style={{ marginBottom: 16, lineHeight: 1.8 }}>
        Bu kullanım koşulları, Unysol platformunu kullanımınıza ilişkin şartları belirler.
        Platformu kullanarak bu koşulları kabul etmiş sayılırsınız.
      </p>
      <h2 style={{ fontSize: 20, marginTop: 24, marginBottom: 12 }}>1. Hizmet Tanımı</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.8 }}>
        Unysol, nakliye firmaları için yük bulma, takip ve fatura yönetimi platformudur.
      </p>
      <h2 style={{ fontSize: 20, marginTop: 24, marginBottom: 12 }}>2. Hesap Sorumluluğu</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.8 }}>
        Hesap bilgilerinizin güvenliğinden siz sorumlusunuz. Yetkisiz erişim durumunda
        derhal bildirim yapmalısınız.
      </p>
      <h2 style={{ fontSize: 20, marginTop: 24, marginBottom: 12 }}>3. Ödeme Koşulları</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.8 }}>
        Pro ve Premium planlar aylık veya yıllık olarak faturalandırılır.
        Ödemeler Stripe üzerinden güvenli şekilde işlenir.
      </p>
      <h2 style={{ fontSize: 20, marginTop: 24, marginBottom: 12 }}>4. Fesih</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.8 }}>
        Taraflar 30 gün önceden bildirimde bulunarak sözleşmeyi feshedebilir.
      </p>
    </div>
  );
}
