export interface User {
  id: number;
  email: string;
  tenant_id: number;
  role: string;
  firma_unvani?: string;
  telefon?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  tenant_id: number;
  email: string;
  role: string;
}

export interface AdminUser {
  id: string;
  email: string;
  ad: string;
  rol: 'SUPER_ADMIN' | 'ADMIN';
}

export interface AdminLoginResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  tenant_id: number;
  email: string;
  role: string;
}

export interface AdminDashboardSummary {
  toplam_firma: number;
  aktif_firma: number;
  mrr: number;
  bu_ay_yeni_kayit: number;
  mrr_trend: { month: string; gelir: number }[];
  paket_dagilimi: { paket: string; sayi: number }[];
  son_kayitlar: SonKayit[];
}

export interface SonKayit {
  id: string;
  firma_unvani: string;
  yetkili: string;
  plan: string;
  kayit_tarihi: string;
}

export interface AdminTenant {
  id: string;
  firma_unvani: string;
  yetkili: string;
  email: string;
  plan: 'FREE' | 'PRO' | 'PREMIUM';
  kayit_tarihi: string;
  son_giris: string;
  durum: 'AKTIF' | 'PASIF';
  telefon?: string;
}

export interface AdminModule {
  id: number;
  module_name: string;
  module_key: string;
  description: string | null;
  category: string;
  default_enabled: boolean;
  is_core: boolean;
  enabled_countries: string[];
  enabled_plans: string[];
}

export interface AdminCountry {
  kod: string;
  ad: string;
  vergi_orani: number;
  para_birimi: string;
  fatura_formati: string;
  sofor_gereksinimleri: Record<string, unknown>;
}

export interface AdminAnalyticsMmr {
  month: string;
  mrr: number;
  yeni: number;
  kayip: number;
}

export interface AdminAnalyticsChurn {
  month: string;
  oran: number;
}

export interface AdminAnalyticsGrowth {
  month: string;
  gelir?: number;
  tahmin?: number;
}

export interface Truck {
  id: string;
  plaka: string;
  marka: string;
  model: string;
  yil: number;
  tracking_source: 'PHONE' | 'ESP32_LTE' | 'MANUEL';
  aktif: boolean;
}

export interface DashboardSummary {
  aktif_kamyon: number;
  bugunku_kazanc: number;
  bu_ay_kar: number;
  bekleyen_tahsilat: number;
  aylik_gelir: MonthlyRevenue[];
  son_aktiviteler: Activity[];
}

export interface MonthlyRevenue {
  month: string;
  gelir: number;
}

export interface Activity {
  id: string;
  aciklama: string;
  tarih: string;
  tutar?: number;
}

export interface SignupPayload {
  firma_unvani: string;
  email: string;
  password: string;
  telefon?: string;
}

// ============================================================
// INVOICE MODULE TYPES
// ============================================================

export interface InvoiceItem {
  id: number;
  invoice_id?: number;
  sira: number;
  urun_adi: string;
  aciklama?: string;
  miktar: number;
  birim: string;
  birim_fiyat: number;
  kdv_oran: number;
  kdv_tutar: number;
  iskonto_oran: number;
  iskonto_tutar: number;
  tutar: number;
}

export interface InvoicePayment {
  id: number;
  invoice_id?: number;
  tutar: number;
  yontem: string;
  referans_no?: string;
  tarih?: string;
  aciklama?: string;
}

export interface Invoice {
  id: number;
  tenant_id?: number;
  customer_id?: number;
  trip_id?: number;
  tip: 'SATIS' | 'IADE';
  iade_fatura_id?: number;
  musteri: string;
  fatura_no: string;
  tarih: string;
  vade: string;
  para_birimi: string;
  kur: number;
  ara_toplam: number;
  iskonto_tutar: number;
  iskonto_oran: number;
  kdv: number;
  kdv_oran: number;
  tevkifat: number;
  genel_toplam: number;
  toplam_odenen: number;
  kalan: number;
  durum: 'taslak' | 'onayda' | 'onaylandi' | 'gonderildi' | 'odendi' | 'iptal';
  odeme_durumu: 'bekleyen' | 'kismi_odendi' | 'odendi' | 'gecikti' | 'vadesi_gecti' | 'iptal';
  odeme_yontemi?: string;
  ebelge_tip: 'YOK' | 'E_FATURA' | 'E_ARSIV';
  ebelge_durum: 'BEKLIYOR' | 'GONDERILDI' | 'ONAYLANDI' | 'REDDEDILDI' | 'HATA';
  ebelge_uuid?: string;
  ebelge_ettn?: string;
  odeme_tarihi?: string;
  notlar?: string;
  items: InvoiceItem[];
  payments: InvoicePayment[];
  created_at: string;
  updated_at?: string;
}

export interface InvoiceCreatePayload {
  customer_id: number;
  trip_id?: number;
  tip: string;
  musteri: string;
  tarih: string;
  vade: string;
  para_birimi: string;
  kur: number;
  iskonto_oran: number;
  iskonto_tutar: number;
  tevkifat: number;
  items: InvoiceItemCreatePayload[];
  notlar: string;
}

export interface InvoiceItemCreatePayload {
  sira: number;
  urun_adi: string;
  aciklama: string;
  miktar: number;
  birim: string;
  birim_fiyat: number;
  kdv_oran: number;
  iskonto_oran: number;
  iskonto_tutar: number;
}

export interface InvoiceUpdatePayload {
  customer_id?: number;
  musteri?: string;
  tarih?: string;
  vade?: string;
  para_birimi?: string;
  kur?: number;
  iskonto_oran?: number;
  iskonto_tutar?: number;
  tevkifat?: number;
  notlar?: string;
  items?: InvoiceItemCreatePayload[];
  durum?: string;
}

export interface PaymentCreatePayload {
  tutar: number;
  yontem: string;
  referans_no: string;
  tarih: string;
  aciklama: string;
}

export interface PaginatedInvoices {
  data: Invoice[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AgingReportRow {
  musteri: string;
  vadesi_gecmemis: number;
  gun_1_30: number;
  gun_31_60: number;
  gun_61_90: number;
  gun_90_ustu: number;
  toplam: number;
}

export interface TCMBKur {
  currency: string;
  rate: number;
}

export interface InvoiceRecurrenceRecord {
  id: number;
  customer_id: number;
  musteri: string;
  frekans: string;
  sonraki_tarih: string;
  bitis_tarihi?: string;
  sablon: InvoiceCreatePayload;
  aktif: boolean;
  created_at: string;
}
