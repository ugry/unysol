package models

import (
	"encoding/json"
	"time"
)

// ============================================================
// Tenant
// ============================================================
type Tenant struct {
	ID          int     `json:"id"`
	Slug        string  `json:"slug"`
	FirmaUnvani string  `json:"firma_unvani"`
	Plan        string  `json:"plan"`
	Locale      *string `json:"locale,omitempty"`
	CountryCode *string `json:"country_code,omitempty"`
	Durum       string  `json:"durum"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateTenantRequest struct {
	Slug        string `json:"slug" validate:"required"`
	FirmaUnvani string `json:"firma_unvani" validate:"required"`
	Plan        string `json:"plan"`
	Locale      string `json:"locale"`
	CountryCode string `json:"country_code"`
}

type UpdateTenantRequest struct {
	Slug        *string `json:"slug,omitempty"`
	FirmaUnvani *string `json:"firma_unvani,omitempty"`
	Plan        *string `json:"plan,omitempty"`
	Locale      *string `json:"locale,omitempty"`
	CountryCode *string `json:"country_code,omitempty"`
	Durum       *string `json:"durum,omitempty"`
}

// ============================================================
// User
// ============================================================
type User struct {
	ID           int     `json:"id"`
	TenantID     int     `json:"tenant_id"`
	Email        string  `json:"email"`
	PasswordHash string  `json:"-"`
	AdSoyad      string  `json:"ad_soyad"`
	Rol          string  `json:"rol"`
	Telefon      *string `json:"telefon,omitempty"`
	Aktif        bool    `json:"aktif"`
	LastLogin    *string `json:"last_login,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateUserRequest struct {
	TenantID int    `json:"tenant_id" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
	AdSoyad  string `json:"ad_soyad" validate:"required"`
	Rol      string `json:"rol"`
	Telefon  string `json:"telefon"`
}

type UpdateUserRequest struct {
	Email   *string `json:"email,omitempty"`
	AdSoyad *string `json:"ad_soyad,omitempty"`
	Rol     *string `json:"rol,omitempty"`
	Telefon *string `json:"telefon,omitempty"`
	Aktif   *bool   `json:"aktif,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	Token     string `json:"token"`
	User      User   `json:"user"`
	Tenant    Tenant `json:"tenant"`
	ExpiresAt string `json:"expires_at"`
}

type ResetPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type ChangePasswordRequest struct {
	Token    string `json:"token" validate:"required"`
	Password string `json:"password" validate:"required,min=6"`
}

// ============================================================
// Truck
// ============================================================
type Truck struct {
	ID                int     `json:"id"`
	TenantID          int     `json:"tenant_id"`
	Plaka             string  `json:"plaka"`
	Marka             *string `json:"marka,omitempty"`
	Model             *string `json:"model,omitempty"`
	Yil               *int    `json:"yil,omitempty"`
	YakitTipi         *string `json:"yakit_tipi,omitempty"`
	TrackingSource    *string `json:"tracking_source,omitempty"`
	KmSayacBaslangic  *int    `json:"km_sayac_baslangic,omitempty"`
	KmSayacGuncel     *int    `json:"km_sayac_guncel,omitempty"`
	MuayeneBitis      *string `json:"muayene_bitis,omitempty"`
	Aktif             bool    `json:"aktif"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   *time.Time `json:"updated_at,omitempty"`
}

type TruckCreate = CreateTruckRequest

type CreateTruckRequest struct {
	TenantID       int    `json:"tenant_id" validate:"required"`
	Plaka          string `json:"plaka" validate:"required"`
	Marka          string `json:"marka"`
	Model          string `json:"model"`
	Yil            int    `json:"yil"`
	YakitTipi      string `json:"yakit_tipi"`
	TrackingSource string `json:"tracking_source"`
}

type UpdateTruckRequest struct {
	Plaka          *string `json:"plaka,omitempty"`
	Marka          *string `json:"marka,omitempty"`
	Model          *string `json:"model,omitempty"`
	Yil            *int    `json:"yil,omitempty"`
	YakitTipi      *string `json:"yakit_tipi,omitempty"`
	TrackingSource *string `json:"tracking_source,omitempty"`
	KmSayacGuncel  *int    `json:"km_sayac_guncel,omitempty"`
	MuayeneBitis   *string `json:"muayene_bitis,omitempty"`
	Aktif          *bool   `json:"aktif,omitempty"`
}

// ============================================================
// Trailer
// ============================================================
type Trailer struct {
	ID            int     `json:"id"`
	TenantID      int     `json:"tenant_id"`
	Plaka         string  `json:"plaka"`
	Marka         *string `json:"marka,omitempty"`
	Model         *string `json:"model,omitempty"`
	Yil           *int    `json:"yil,omitempty"`
	Tip           *string `json:"tip,omitempty"`
	BagliCekiciID *int    `json:"bagli_cekici_id,omitempty"`
	MuayeneBitis  *string `json:"muayene_bitis,omitempty"`
	Aktif         bool    `json:"aktif"`
	CreatedAt   time.Time `json:"created_at"`
}

type Trip struct {
	ID            int        `json:"id"`
	TenantID      int        `json:"tenant_id"`
	TruckID       *int       `json:"truck_id,omitempty"`
	CustomerID    *int       `json:"customer_id,omitempty"`
	Baslangic     *string    `json:"baslangic,omitempty"`
	Bitis         *string    `json:"bitis,omitempty"`
	Durum         *string    `json:"durum,omitempty"`
	Ucret         *float64   `json:"ucret,omitempty"`
	PaymentMethod *string    `json:"payment_method,omitempty"`
	InvoiceID     *int       `json:"invoice_id,omitempty"`
	Sofor         *string    `json:"sofor,omitempty"`
	Yukleme       *string    `json:"yukleme,omitempty"`
	Teslimat      *string    `json:"teslimat,omitempty"`
	Musteri       *string    `json:"musteri,omitempty"`
	TruckPlaka    string     `json:"truck_plaka"`
	CreatedAt     time.Time  `json:"created_at"`
}

type TripCreate struct {
	TruckID       int     `json:"truck_id"`
	Sofor         string  `json:"sofor"`
	CustomerID    int     `json:"customer_id"`
	Yukleme       string  `json:"yukleme"`
	Teslimat      string  `json:"teslimat"`
	Ucret         float64 `json:"ucret"`
	PaymentMethod string  `json:"payment_method"`
	InvoiceID     *int    `json:"invoice_id,omitempty"`
	Aciklama      string  `json:"aciklama"`
	Durum         string  `json:"durum"`
}

type TripStatusUpdate struct {
	Durum   string `json:"durum"`
	BitisKM *int   `json:"bitis_km,omitempty"`
}

type CreateTripRequest struct {
	TenantID       int     `json:"tenant_id" validate:"required"`
	TruckID        int     `json:"truck_id"`
	Plaka          string  `json:"plaka"`
	Sofor          string  `json:"sofor"`
	Musteri        string  `json:"musteri"`
	Yukleme        string  `json:"yukleme"`
	Teslimat       string  `json:"teslimat"`
	Ucret          float64 `json:"ucret"`
	Irsaliye       string  `json:"irsaliye"`
	BaslangicTarih string  `json:"baslangic_tarih"`
	BitisTarih     string  `json:"bitis_tarih"`
}

type UpdateTripRequest struct {
	Plaka          *string  `json:"plaka,omitempty"`
	Sofor          *string  `json:"sofor,omitempty"`
	Musteri        *string  `json:"musteri,omitempty"`
	Yukleme        *string  `json:"yukleme,omitempty"`
	Teslimat       *string  `json:"teslimat,omitempty"`
	Ucret          *float64 `json:"ucret,omitempty"`
	Durum          *string  `json:"durum,omitempty"`
	Km             *float64 `json:"km,omitempty"`
	Yakit          *float64 `json:"yakit,omitempty"`
	Irsaliye       *string  `json:"irsaliye,omitempty"`
	BaslangicTarih *string  `json:"baslangic_tarih,omitempty"`
	BitisTarih     *string  `json:"bitis_tarih,omitempty"`
	OdemeDurumu    *string  `json:"odeme_durumu,omitempty"`
}

// ============================================================
// Customer
// ============================================================
type Customer struct {
	ID              int              `json:"id"`
	TenantID        int              `json:"tenant_id"`
	FirmaUnvani     string           `json:"firma_unvani"`
	Yetkili         *string          `json:"yetkili,omitempty"`
	Telefon         *string          `json:"telefon,omitempty"`
	Email           *string          `json:"email,omitempty"`
	Adres           *string          `json:"adres,omitempty"`
	FaturaAdresi    *string          `json:"fatura_adresi,omitempty"`
	VergiDairesi    *string          `json:"vergi_dairesi,omitempty"`
	VergiNo         *string          `json:"vergi_no,omitempty"`
	Kategori        *string          `json:"kategori,omitempty"`
	Bakiye          *float64         `json:"bakiye,omitempty"`
	AcikHesapLimiti *float64         `json:"acik_hesap_limiti,omitempty"`
	RiskSkoru       *string          `json:"risk_skoru,omitempty"`
	VadeGun         *int             `json:"vade_gun,omitempty"`
	DepoAdresleri   *json.RawMessage `json:"depo_adresleri,omitempty"`
	FiyatKatalogu   *json.RawMessage `json:"fiyat_katalogu,omitempty"`
	SozlesmeUrl     *string          `json:"sozlesme_url,omitempty"`
	MusteriTemsilcisi *string        `json:"musteri_temsilcisi,omitempty"`
	Notlar          *string          `json:"notlar,omitempty"`
	Durum           *string          `json:"durum,omitempty"`
	CreatedAt       time.Time        `json:"created_at"`
}

type CustomerCreate struct {
	Ad      string `json:"ad"`
	Soyad   string `json:"soyad"`
	Firma   string `json:"firma"`
	Telefon string `json:"telefon"`
	Email   string `json:"email"`
	Adres   string `json:"adres"`
	VergiNo string `json:"vergi_no"`
}

type CreateCustomerRequest struct {
	TenantID     int    `json:"tenant_id" validate:"required"`
	FirmaUnvani  string `json:"firma_unvani" validate:"required"`
	Yetkili      string `json:"yetkili"`
	Telefon      string `json:"telefon"`
	Email        string `json:"email"`
	Adres        string `json:"adres"`
	VergiDairesi string `json:"vergi_dairesi"`
	VergiNo      string `json:"vergi_no"`
}

type UpdateCustomerRequest struct {
	FirmaUnvani  *string `json:"firma_unvani,omitempty"`
	Yetkili      *string `json:"yetkili,omitempty"`
	Telefon      *string `json:"telefon,omitempty"`
	Email        *string `json:"email,omitempty"`
	Adres        *string `json:"adres,omitempty"`
	VergiDairesi *string `json:"vergi_dairesi,omitempty"`
	VergiNo      *string `json:"vergi_no,omitempty"`
	Durum        *bool   `json:"durum,omitempty"`
}

// ============================================================
// Invoice
// ============================================================
type Invoice struct {
	ID            int        `json:"id"`
	TenantID      int        `json:"tenant_id"`
	CustomerID    *int       `json:"customer_id,omitempty"`
	TripID        *int       `json:"trip_id,omitempty"`
	Tip           *string    `json:"tip,omitempty"`
	IadeFaturaID  *int       `json:"iade_fatura_id,omitempty"`
	Musteri       *string    `json:"musteri,omitempty"`
	FaturaNo      string     `json:"fatura_no"`
	Tarih         *string    `json:"tarih,omitempty"`
	Vade          *string    `json:"vade,omitempty"`
	ParaBirimi    *string    `json:"para_birimi,omitempty"`
	Kur           *float64   `json:"kur,omitempty"`
	AraToplam     *float64   `json:"ara_toplam,omitempty"`
	IskontoTutar  *float64   `json:"iskonto_tutar,omitempty"`
	IskontoOran   *float64   `json:"iskonto_oran,omitempty"`
	Kdv           *float64   `json:"kdv,omitempty"`
	KdvOran       *float64   `json:"kdv_oran,omitempty"`
	Tevkifat      *float64   `json:"tevkifat,omitempty"`
	GenelToplam   *float64   `json:"genel_toplam,omitempty"`
	ToplamOdenen  *float64   `json:"toplam_odenen,omitempty"`
	Kalan         *float64   `json:"kalan,omitempty"`
	Durum         *string    `json:"durum,omitempty"`
	OdemeDurumu   *string    `json:"odeme_durumu,omitempty"`
	OdemeYontemi  *string    `json:"odeme_yontemi,omitempty"`
	EbelgeTip     *string    `json:"ebelge_tip,omitempty"`
	EbelgeDurum   *string    `json:"ebelge_durum,omitempty"`
	EbelgeUUID    *string    `json:"ebelge_uuid,omitempty"`
	EbelgeEttn    *string    `json:"ebelge_ettn,omitempty"`
	EbelgeYanit   *json.RawMessage `json:"ebelge_yanit,omitempty"`
	OdemeTarihi   *string    `json:"odeme_tarihi,omitempty"`
	Notlar        *string    `json:"notlar,omitempty"`
	Items         []InvoiceItem    `json:"items,omitempty"`
	Payments      []InvoicePayment `json:"payments,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *string    `json:"updated_at,omitempty"`
}

type InvoiceItem struct {
	ID           int      `json:"id"`
	InvoiceID    int      `json:"invoice_id"`
	Sira         *int     `json:"sira,omitempty"`
	UrunAdi      string   `json:"urun_adi"`
	Aciklama     *string  `json:"aciklama,omitempty"`
	Miktar       *float64 `json:"miktar,omitempty"`
	Birim        *string  `json:"birim,omitempty"`
	BirimFiyat   *float64 `json:"birim_fiyat,omitempty"`
	KdvOran      *float64 `json:"kdv_oran,omitempty"`
	KdvTutar     *float64 `json:"kdv_tutar,omitempty"`
	IskontoOran  *float64 `json:"iskonto_oran,omitempty"`
	IskontoTutar *float64 `json:"iskonto_tutar,omitempty"`
	Tutar        *float64 `json:"tutar,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

type InvoicePayment struct {
	ID         int        `json:"id"`
	InvoiceID  int        `json:"invoice_id"`
	Tutar      float64    `json:"tutar"`
	Yontem     string     `json:"yontem"`
	ReferansNo *string    `json:"referans_no,omitempty"`
	Tarih      *string    `json:"tarih,omitempty"`
	Aciklama   *string    `json:"aciklama,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

type EFaturaLog struct {
	ID         int              `json:"id"`
	InvoiceID  int              `json:"invoice_id"`
	Islem      string           `json:"islem"`
	Durum      string           `json:"durum"`
	Istek      *json.RawMessage `json:"istek,omitempty"`
	Yanit      *json.RawMessage `json:"yanit,omitempty"`
	HataMesaji *string          `json:"hata_mesaji,omitempty"`
	CreatedAt  time.Time        `json:"created_at"`
}

type InvoiceRecurrence struct {
	ID           int              `json:"id"`
	TenantID     int              `json:"tenant_id"`
	CustomerID   int              `json:"customer_id"`
	Frekans      string           `json:"frekans"`
	SonrakiTarih string           `json:"sonraki_tarih"`
	BitisTarihi  *string          `json:"bitis_tarihi,omitempty"`
	Sablon       json.RawMessage  `json:"sablon"`
	Aktif        bool             `json:"aktif"`
	CreatedAt    time.Time        `json:"created_at"`
}

type InvoiceCreate struct {
	CustomerID   int               `json:"customer_id"`
	TripID       *int              `json:"trip_id,omitempty"`
	Tip          string            `json:"tip"`
	Musteri      string            `json:"musteri"`
	Tarih        string            `json:"tarih"`
	Vade         string            `json:"vade"`
	ParaBirimi   string            `json:"para_birimi"`
	Kur          float64           `json:"kur"`
	IskontoOran  float64           `json:"iskonto_oran"`
	IskontoTutar float64           `json:"iskonto_tutar"`
	Tevkifat     float64           `json:"tevkifat"`
	Items        []InvoiceItemCreate `json:"items"`
	Notlar       string            `json:"notlar"`
}

type InvoiceItemCreate struct {
	Sira         int     `json:"sira"`
	UrunAdi      string  `json:"urun_adi"`
	Aciklama     string  `json:"aciklama"`
	Miktar       float64 `json:"miktar"`
	Birim        string  `json:"birim"`
	BirimFiyat   float64 `json:"birim_fiyat"`
	KdvOran      float64 `json:"kdv_oran"`
	IskontoOran  float64 `json:"iskonto_oran"`
	IskontoTutar float64 `json:"iskonto_tutar"`
}

type InvoiceUpdate struct {
	CustomerID   *int               `json:"customer_id,omitempty"`
	TripID       *int               `json:"trip_id,omitempty"`
	Musteri      *string            `json:"musteri,omitempty"`
	Tarih        *string            `json:"tarih,omitempty"`
	Vade         *string            `json:"vade,omitempty"`
	ParaBirimi   *string            `json:"para_birimi,omitempty"`
	Kur          *float64           `json:"kur,omitempty"`
	IskontoOran  *float64           `json:"iskonto_oran,omitempty"`
	IskontoTutar *float64           `json:"iskonto_tutar,omitempty"`
	Tevkifat     *float64           `json:"tevkifat,omitempty"`
	Notlar       *string            `json:"notlar,omitempty"`
	Items        []InvoiceItemCreate `json:"items,omitempty"`
	Durum        *string            `json:"durum,omitempty"`
}

type PaymentCreate struct {
	Tutar      float64 `json:"tutar"`
	Yontem     string  `json:"yontem"`
	ReferansNo string  `json:"referans_no"`
	Tarih      string  `json:"tarih"`
	Aciklama   string  `json:"aciklama"`
}

type EFaturaGonderRequest struct {
	EbelgeTip string `json:"ebelge_tip"`
}

type InvoiceRecurrenceCreate struct {
	CustomerID   int               `json:"customer_id"`
	Frekans      string            `json:"frekans"`
	SonrakiTarih string            `json:"sonraki_tarih"`
	BitisTarihi  string            `json:"bitis_tarihi,omitempty"`
	Sablon       InvoiceCreate     `json:"sablon"`
}

type AgingReportRow struct {
	Musteri       string  `json:"musteri"`
	VadesiGecmemis float64 `json:"vadesi_gecmemis"`
	Gun_1_30      float64  `json:"gun_1_30"`
	Gun_31_60     float64  `json:"gun_31_60"`
	Gun_61_90     float64  `json:"gun_61_90"`
	Gun_90_ustu   float64  `json:"gun_90_ustu"`
	Toplam        float64  `json:"toplam"`
}

type PaginatedInvoices struct {
	Data       []Invoice `json:"data"`
	Total      int       `json:"total"`
	Page       int       `json:"page"`
	PageSize   int       `json:"page_size"`
	TotalPages int       `json:"total_pages"`
}

type TCMBKur struct {
	Currency string  `json:"currency"`
	Rate     float64 `json:"rate"`
}

type CreateInvoiceRequest struct {
	TenantID    int     `json:"tenant_id" validate:"required"`
	CustomerID  int     `json:"customer_id"`
	Musteri     string  `json:"musteri"`
	FaturaNo    string  `json:"fatura_no" validate:"required"`
	Tarih       string  `json:"tarih"`
	Vade        string  `json:"vade"`
	Tutar       float64 `json:"tutar"`
	Kdv         float64 `json:"kdv"`
	GenelToplam float64 `json:"genel_toplam"`
	Notlar      string  `json:"notlar"`
}

type UpdateInvoiceRequest struct {
	Musteri     *string  `json:"musteri,omitempty"`
	Tarih       *string  `json:"tarih,omitempty"`
	Vade        *string  `json:"vade,omitempty"`
	Tutar       *float64 `json:"tutar,omitempty"`
	Kdv         *float64 `json:"kdv,omitempty"`
	GenelToplam *float64 `json:"genel_toplam,omitempty"`
	Durum       *string  `json:"durum,omitempty"`
	Notlar      *string  `json:"notlar,omitempty"`
}

type PDFGenerateRequest struct {
	IncludeLogo    bool   `json:"include_logo"`
	IncludeQR      bool   `json:"include_qr"`
	Template       string `json:"template"`
	Orientation    string `json:"orientation"`
}

// ============================================================
// Expense
// ============================================================
type Expense struct {
	ID          int      `json:"id"`
	TenantID    int      `json:"tenant_id"`
	TruckID     *int     `json:"truck_id,omitempty"`
	Kategori    string   `json:"kategori"`
	Tarih       string   `json:"tarih"`
	Tutar       float64  `json:"tutar"`
	Aciklama    *string  `json:"aciklama,omitempty"`
	Plaka       *string  `json:"plaka,omitempty"`
	FaturaNo    *string  `json:"fatura_no,omitempty"`
	OdemeDurumu *string  `json:"odeme_durumu,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   *string  `json:"updated_at,omitempty"`
}

type ExpenseCreate = CreateExpenseRequest

type CreateExpenseRequest struct {
	TenantID int     `json:"tenant_id" validate:"required"`
	TruckID  int     `json:"truck_id"`
	Kategori string  `json:"kategori" validate:"required"`
	Tarih    string  `json:"tarih" validate:"required"`
	Tutar    float64 `json:"tutar" validate:"required"`
	Aciklama string  `json:"aciklama"`
	Plaka    string  `json:"plaka"`
	FaturaNo string  `json:"fatura_no"`
}

type UpdateExpenseRequest struct {
	Kategori    *string  `json:"kategori,omitempty"`
	Tarih       *string  `json:"tarih,omitempty"`
	Tutar       *float64 `json:"tutar,omitempty"`
	Aciklama    *string  `json:"aciklama,omitempty"`
	Plaka       *string  `json:"plaka,omitempty"`
	FaturaNo    *string  `json:"fatura_no,omitempty"`
	OdemeDurumu *string  `json:"odeme_durumu,omitempty"`
}

// ============================================================
// Employee
// ============================================================
type Employee struct {
	ID           int        `json:"id"`
	TenantID     int        `json:"tenant_id"`
	AdSoyad      string     `json:"ad_soyad"`
	Rol          *string    `json:"rol,omitempty"`
	Telefon      *string    `json:"telefon,omitempty"`
	EhliyetBitis *string    `json:"ehliyet_bitis,omitempty"`
	SrcBitis     *string    `json:"src_bitis,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
}

type EmployeeCreate struct {
	Ad       string  `json:"ad"`
	Soyad    string  `json:"soyad"`
	Telefon  string  `json:"telefon"`
	Email    string  `json:"email"`
	Rol      string  `json:"rol"`
	Maas     float64 `json:"maas"`
	IseGiris string  `json:"ise_giris"`
}

type EmployeeWithMetrics struct {
	Employee
	TamamlananSefer int     `json:"tamamlanan_sefer"`
	ToplamCiro      float64 `json:"toplam_ciro"`
}

type CreateEmployeeRequest struct {
	TenantID     int    `json:"tenant_id" validate:"required"`
	UserID       int    `json:"user_id"`
	AdSoyad      string `json:"ad_soyad" validate:"required"`
	Rol          string `json:"rol"`
	Telefon      string `json:"telefon"`
	EhliyetBitis string `json:"ehliyet_bitis"`
	SrcBitis     string `json:"src_bitis"`
}

type UpdateEmployeeRequest struct {
	AdSoyad      *string `json:"ad_soyad,omitempty"`
	Rol          *string `json:"rol,omitempty"`
	Telefon      *string `json:"telefon,omitempty"`
	EhliyetBitis *string `json:"ehliyet_bitis,omitempty"`
	SrcBitis     *string `json:"src_bitis,omitempty"`
	Aktif        *bool   `json:"aktif,omitempty"`
}

// ============================================================
// CekSenet
// ============================================================
type CekSenet struct {
	ID           int      `json:"id"`
	TenantID     int      `json:"tenant_id"`
	CustomerID   *int     `json:"customer_id,omitempty"`
	Tur          *string  `json:"tur,omitempty"`
	SeriNo       *string  `json:"seri_no,omitempty"`
	Tutar        *float64 `json:"tutar,omitempty"`
	VadeTarihi   *string  `json:"vade_tarihi,omitempty"`
	Status       *string  `json:"status,omitempty"`
	Banka        *string  `json:"banka,omitempty"`
	Sube         *string  `json:"sube,omitempty"`
	HesapNo      *string  `json:"hesap_no,omitempty"`
	Kesideci     *string  `json:"kesideci,omitempty"`
	Aciklama     *string  `json:"aciklama,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt    *string  `json:"updated_at,omitempty"`
}

type CekSenetCreate struct {
	CustomerID int     `json:"customer_id"`
	Tur        string  `json:"tur"`
	SeriNo     string  `json:"seri_no"`
	Tutar      float64 `json:"tutar"`
	VadeTarihi string  `json:"vade_tarihi"`
	Banka      string  `json:"banka"`
	Sube       string  `json:"sube"`
	HesapNo    string  `json:"hesap_no"`
	Kesideci   string  `json:"kesideci"`
	Aciklama   string  `json:"aciklama"`
}

type CekSenetStatusUpdate struct {
	Status string `json:"status"`
}

type CekSenetSummary struct {
	ToplamPortfoy    float64 `json:"toplam_portfoy"`
	YaklasanVadeCount int    `json:"yaklasan_vade_count"`
	GecikmisCount    int    `json:"gecikmis_count"`
	KarsiliksizCount  int    `json:"karsiliksiz_count"`
}

// ============================================================
// Module
// ============================================================
type Module struct {
	ID             int     `json:"id"`
	ModuleKey      string  `json:"module_key"`
	ModuleName     string  `json:"module_name"`
	Category       string  `json:"category"`
	IsCore         bool    `json:"is_core"`
	DefaultEnabled bool    `json:"default_enabled"`
	Description    *string `json:"description,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

// ============================================================
// PlanModule
// ============================================================
type PlanModule struct {
	ID        int    `json:"id"`
	Plan      string `json:"plan"`
	ModuleID  int    `json:"module_id"`
	Enabled   bool   `json:"enabled"`
	CreatedAt   time.Time `json:"created_at"`
}

// ============================================================
// TenantModule
// ============================================================
type TenantModule struct {
	ID        int    `json:"id"`
	TenantID  int    `json:"tenant_id"`
	ModuleID  int    `json:"module_id"`
	Enabled   bool   `json:"enabled"`
	CreatedAt   time.Time `json:"created_at"`
}

type UpdateTenantModuleRequest struct {
	Enabled bool `json:"enabled"`
}

// ============================================================
// Action
// ============================================================
type Action struct {
	ID         int              `json:"id"`
	TenantID   int              `json:"tenant_id"`
	UserID     *int             `json:"user_id,omitempty"`
	ActionType string           `json:"action_type"`
	TableName  string           `json:"table_name"`
	RecordID   *string          `json:"record_id,omitempty"`
	RecordData *json.RawMessage `json:"record_data,omitempty"`
	Summary    *string          `json:"summary,omitempty"`
	CreatedAt  time.Time        `json:"created_at"`
}

type ActionCreate struct {
	ActionType string          `json:"action_type"`
	TableName  string          `json:"table_name"`
	RecordID   *string         `json:"record_id,omitempty"`
	RecordData *json.RawMessage `json:"record_data,omitempty"`
	Summary    *string         `json:"summary,omitempty"`
}

// ============================================================
// Settings
// ============================================================
type Setting struct {
	ID        int     `json:"id"`
	TenantID  int     `json:"tenant_id"`
	Key       string  `json:"key"`
	Value     string  `json:"value"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   *time.Time `json:"updated_at,omitempty"`
}

type UpdateSettingRequest struct {
	Value string `json:"value" validate:"required"`
}

// ============================================================
// Notification
// ============================================================
type Notification struct {
	ID        int    `json:"id"`
	TenantID  int    `json:"tenant_id"`
	UserID    *int   `json:"user_id,omitempty"`
	Message   string `json:"message"`
	Read      bool   `json:"read"`
	CreatedAt   time.Time `json:"created_at"`
}

// ============================================================
// Prediction
// ============================================================
type Prediction struct {
	ID        int      `json:"id"`
	TenantID  int      `json:"tenant_id"`
	Ay        string   `json:"ay"`
	Month     string   `json:"month"`
	Gelir     *float64 `json:"tahmini_gelir,omitempty"`
	Gider     *float64 `json:"tahmini_gider,omitempty"`
	Kar       *float64 `json:"tahmini_kar,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

// ============================================================
// Subscription
// ============================================================
type Subscription struct {
	ID        int     `json:"id"`
	TenantID  int     `json:"tenant_id"`
	Plan      string  `json:"plan"`
	Baslangic string  `json:"baslangic"`
	Bitis     string  `json:"bitis"`
	Ucret     float64 `json:"ucret"`
	Status    *string `json:"status,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateSubscriptionRequest struct {
	TenantID  int     `json:"tenant_id" validate:"required"`
	Plan      string  `json:"plan" validate:"required"`
	Baslangic string  `json:"baslangic" validate:"required"`
	Bitis     string  `json:"bitis" validate:"required"`
	Ucret     float64 `json:"ucret" validate:"required"`
}

// ============================================================
// PasswordReset
// ============================================================
type PasswordReset struct {
	ID        int    `json:"id"`
	Email     string `json:"email"`
	Token     string `json:"token"`
	ExpiresAt string `json:"expires_at"`
	Used      bool   `json:"used"`
	CreatedAt   time.Time `json:"created_at"`
}

// ============================================================
// MaintenanceRecord
// ============================================================
type MaintenanceRecord struct {
	ID                int      `json:"id"`
	TenantID          int      `json:"tenant_id"`
	TruckID           int      `json:"truck_id"`
	Tarih             string   `json:"tarih"`
	Km                int      `json:"km"`
	Turu              string   `json:"turu"`
	YapilanIslemler   *string  `json:"yapilan_islemler,omitempty"`
	ToplamTutar       *float64 `json:"toplam_tutar,omitempty"`
	FaturaNo          *string  `json:"fatura_no,omitempty"`
	ServisAdi         *string  `json:"servis_adi,omitempty"`
	SonrakiBakimKm    *int     `json:"sonraki_bakim_km,omitempty"`
	SonrakiBakimTarih *string  `json:"sonraki_bakim_tarih,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateMaintenanceRecordRequest struct {
	TenantID          int     `json:"tenant_id" validate:"required"`
	TruckID           int     `json:"truck_id" validate:"required"`
	Tarih             string  `json:"tarih" validate:"required"`
	Km                int     `json:"km" validate:"required"`
	Turu              string  `json:"turu" validate:"required"`
	YapilanIslemler   string  `json:"yapilan_islemler"`
	ToplamTutar       float64 `json:"toplam_tutar"`
	FaturaNo          string  `json:"fatura_no"`
	ServisAdi         string  `json:"servis_adi"`
	SonrakiBakimKm    int     `json:"sonraki_bakim_km"`
	SonrakiBakimTarih string  `json:"sonraki_bakim_tarih"`
}

type UpdateMaintenanceRecordRequest struct {
	Tarih             *string  `json:"tarih,omitempty"`
	Km                *int     `json:"km,omitempty"`
	Turu              *string  `json:"turu,omitempty"`
	YapilanIslemler   *string  `json:"yapilan_islemler,omitempty"`
	ToplamTutar       *float64 `json:"toplam_tutar,omitempty"`
	FaturaNo          *string  `json:"fatura_no,omitempty"`
	ServisAdi         *string  `json:"servis_adi,omitempty"`
	SonrakiBakimKm    *int     `json:"sonraki_bakim_km,omitempty"`
	SonrakiBakimTarih *string  `json:"sonraki_bakim_tarih,omitempty"`
}

// ============================================================
// FuelLog
// ============================================================
type FuelLog struct {
	ID          int      `json:"id"`
	TenantID    int      `json:"tenant_id"`
	TruckID     int      `json:"truck_id"`
	Tarih       string   `json:"tarih"`
	MiktarLitre float64  `json:"miktar_litre"`
	BirimFiyat  float64  `json:"birim_fiyat"`
	ToplamTutar float64  `json:"toplam_tutar"`
	AlinanYer   *string  `json:"alinan_yer,omitempty"`
	KmOkuma     *int     `json:"km_okuma,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateFuelLogRequest struct {
	TenantID    int     `json:"tenant_id" validate:"required"`
	TruckID     int     `json:"truck_id" validate:"required"`
	Tarih       string  `json:"tarih"`
	MiktarLitre float64 `json:"miktar_litre" validate:"required"`
	BirimFiyat  float64 `json:"birim_fiyat" validate:"required"`
	ToplamTutar float64 `json:"toplam_tutar" validate:"required"`
	AlinanYer   string  `json:"alinan_yer"`
	KmOkuma     int     `json:"km_okuma"`
}

// ============================================================
// TollLog
// ============================================================
type TollLog struct {
	ID          int      `json:"id"`
	TenantID    int      `json:"tenant_id"`
	TruckID     int      `json:"truck_id"`
	GecisTarihi string   `json:"gecis_tarihi"`
	HgsEtiketNo *string  `json:"hgs_etiket_no,omitempty"`
	GirisGise   *string  `json:"giris_gise,omitempty"`
	CikisGise   *string  `json:"cikis_gise,omitempty"`
	GecisUcreti float64  `json:"gecis_ucreti"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateTollLogRequest struct {
	TenantID    int     `json:"tenant_id" validate:"required"`
	TruckID     int     `json:"truck_id" validate:"required"`
	GecisTarihi string  `json:"gecis_tarihi" validate:"required"`
	HgsEtiketNo string  `json:"hgs_etiket_no"`
	GirisGise   string  `json:"giris_gise"`
	CikisGise   string  `json:"cikis_gise"`
	GecisUcreti float64 `json:"gecis_ucreti" validate:"required"`
}

// ============================================================
// DriverLeave
// ============================================================
type DriverLeave struct {
	ID         int     `json:"id"`
	TenantID   int     `json:"tenant_id"`
	UserID     int     `json:"user_id"`
	Baslangic  string  `json:"baslangic"`
	Bitis      string  `json:"bitis"`
	Turu       *string `json:"turu,omitempty"`
	OnayDurumu *string `json:"onay_durumu,omitempty"`
	Aciklama   *string `json:"aciklama,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateDriverLeaveRequest struct {
	TenantID  int    `json:"tenant_id" validate:"required"`
	UserID    int    `json:"user_id" validate:"required"`
	Baslangic string `json:"baslangic" validate:"required"`
	Bitis     string `json:"bitis" validate:"required"`
	Turu      string `json:"turu"`
	Aciklama  string `json:"aciklama"`
}

type UpdateDriverLeaveRequest struct {
	Baslangic  *string `json:"baslangic,omitempty"`
	Bitis      *string `json:"bitis,omitempty"`
	Turu       *string `json:"turu,omitempty"`
	OnayDurumu *string `json:"onay_durumu,omitempty"`
	Aciklama   *string `json:"aciklama,omitempty"`
}

// ============================================================
// InsurancePolicy
// ============================================================
type InsurancePolicy struct {
	ID             int      `json:"id"`
	TenantID       int      `json:"tenant_id"`
	TruckID        int      `json:"truck_id"`
	PoliceNo       string   `json:"police_no"`
	Turu           string   `json:"turu"`
	SigortaSirketi *string  `json:"sigorta_sirketi,omitempty"`
	Baslangic      string   `json:"baslangic"`
	Bitis          string   `json:"bitis"`
	PrimTutari     *float64 `json:"prim_tutari,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateInsurancePolicyRequest struct {
	TenantID       int     `json:"tenant_id" validate:"required"`
	TruckID        int     `json:"truck_id" validate:"required"`
	PoliceNo       string  `json:"police_no" validate:"required"`
	Turu           string  `json:"turu" validate:"required"`
	SigortaSirketi string  `json:"sigorta_sirketi"`
	Baslangic      string  `json:"baslangic" validate:"required"`
	Bitis          string  `json:"bitis" validate:"required"`
	PrimTutari     float64 `json:"prim_tutari"`
}

// ============================================================
// Billing
// ============================================================
type Billing struct {
	ID             int      `json:"id"`
	TenantID       int      `json:"tenant_id"`
	SubscriptionID *int     `json:"subscription_id,omitempty"`
	FaturaNo       string   `json:"fatura_no"`
	Tarih          string   `json:"tarih"`
	Vade           string   `json:"vade"`
	Tutar          float64  `json:"tutar"`
	Kdv            float64  `json:"kdv"`
	GenelToplam    float64  `json:"genel_toplam"`
	Durum          *string  `json:"durum,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

// ============================================================
// LoadBoard
// ============================================================
type LoadBoard struct {
	ID           int      `json:"id"`
	TenantID     int      `json:"tenant_id"`
	UserID       int      `json:"user_id"`
	Type         string   `json:"type"`
	FromCity     string   `json:"from_city"`
	ToCity       string   `json:"to_city"`
	LoadDate     string   `json:"load_date"`
	WeightKg     *float64 `json:"weight_kg,omitempty"`
	VehicleType  *string  `json:"vehicle_type,omitempty"`
	Price        *float64 `json:"price,omitempty"`
	Description  *string  `json:"description,omitempty"`
	Status       *string  `json:"status,omitempty"`
	ContactPhone *string  `json:"contact_phone,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateLoadBoardRequest struct {
	TenantID     int     `json:"tenant_id" validate:"required"`
	Type         string  `json:"type" validate:"required"`
	FromCity     string  `json:"from_city" validate:"required"`
	ToCity       string  `json:"to_city" validate:"required"`
	LoadDate     string  `json:"load_date" validate:"required"`
	WeightKg     float64 `json:"weight_kg"`
	VehicleType  string  `json:"vehicle_type"`
	Price        float64 `json:"price"`
	Description  string  `json:"description"`
	ContactPhone string  `json:"contact_phone"`
}

// ============================================================
// Dashboard
// ============================================================
type DashboardSummary struct {
	AktifKamyon     int              `json:"aktif_kamyon"`
	BugunkuKazanc   float64          `json:"bugunku_kazanc"`
	BuAyKar         float64          `json:"bu_ay_kar"`
	BekleyenTahsilat float64         `json:"bekleyen_tahsilat"`
	AylikGelir      []MonthlyRevenue `json:"aylik_gelir"`
	SonAktiviteler  []Action         `json:"son_aktiviteler"`
}

type MonthlyRevenue struct {
	Ay    string  `json:"ay"`
	Gelir float64 `json:"gelir"`
	Gider float64 `json:"gider"`
}

// ============================================================
// Pagination & Common
// ============================================================
type PaginationRequest struct {
	Page     int `json:"page"`
	PageSize int `json:"page_size"`
}

type PaginationResponse struct {
	Page       int `json:"page"`
	PageSize   int `json:"page_size"`
	TotalItems int `json:"total_items"`
	TotalPages int `json:"total_pages"`
}

type MetaResponse struct {
	Pagination PaginationResponse `json:"pagination"`
}

type APIResponse struct {
	Success bool         `json:"success"`
	Data    interface{}  `json:"data,omitempty"`
	Error   string       `json:"error,omitempty"`
	Meta    *MetaResponse `json:"meta,omitempty"`
}

type ErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
}

// PlanInfo describes a billing plan
type PlanInfo struct {
	Name     string   `json:"name"`
	Price    float64  `json:"price"`
	Currency string   `json:"currency"`
	Features []string `json:"features"`
}

// MRRData contains monthly recurring revenue data
type MRRData struct {
	MRR      float64 `json:"mrr"`
	Currency string  `json:"currency"`
	Period   string  `json:"period"`
}

// ChurnData contains churn rate analytics
type ChurnData struct {
	ChurnRate float64 `json:"churn_rate"`
	Total     int     `json:"total"`
	Suspended int     `json:"suspended"`
}

// GrowthData contains signup growth data over a period
type GrowthData struct {
	Period  string `json:"period"`
	Signups int    `json:"signups"`
}

// UpdateModuleRequest for updating an existing module
type UpdateModuleRequest struct {
	ModuleName     *string `json:"module_name,omitempty"`
	Category       *string `json:"category,omitempty"`
	Description    *string `json:"description,omitempty"`
	DefaultEnabled *bool   `json:"default_enabled,omitempty"`
}

// TenantSettingsResponse contains all tenant settings
type TenantSettingsResponse struct {
	Settings      []Setting `json:"settings"`
	Notifications string    `json:"notifications"`
}

type SuccessResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}
