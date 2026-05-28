export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ color: '#FF5F03', fontSize: 28, marginBottom: 20 }}>Gizlilik Politikası</h1>
      <p style={{ marginBottom: 16, lineHeight: 1.8 }}>
        Unysol olarak gizliliğinize önem veriyoruz. Bu politika, kişisel verilerinizin
        nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.
      </p>
      <h2 style={{ fontSize: 20, marginTop: 24, marginBottom: 12 }}>Veri Toplama</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.8 }}>
        Kayıt sırasında ad-soyad, e-posta, telefon ve firma bilgilerinizi toplarız.
        Platform kullanımı sırasında seyahat, araç ve fatura verileriniz işlenir.
      </p>
      <h2 style={{ fontSize: 20, marginTop: 24, marginBottom: 12 }}>Veri Kullanımı</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.8 }}>
        Verileriniz yalnızca hizmet sunumu, fatura düzenleme ve platform iyileştirme
        amaçlarıyla kullanılır. Üçüncü taraflarla paylaşılmaz.
      </p>
      <h2 style={{ fontSize: 20, marginTop: 24, marginBottom: 12 }}>Veri Güvenliği</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.8 }}>
        Verileriniz AWS altyapısında şifrelenmiş olarak saklanır.
        Tüm iletişim HTTPS üzerinden güvenli şekilde gerçekleşir.
      </p>
      <h2 style={{ fontSize: 20, marginTop: 24, marginBottom: 12 }}>Çerezler</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.8 }}>
        Oturum yönetimi ve kullanıcı deneyimini iyileştirmek için zorunlu çerezler kullanırız.
        Tercihlerinizi tarayıcı ayarlarından yönetebilirsiniz.
      </p>
    </div>
  );
}
