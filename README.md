# Unysol SaaS Platformu — Tasarım Dokümanı v1
## Çok Kiracılı (Multi-Tenant) · Çok Dilli (i18n) · Modüler · Yatay Ölçeklenebilir

> Hedef: 100.000+ küçük nakliye firması, çok ülkeli, çok dilli, modüler.
> Başlangıç noktası: Türkiye. Mimari: yatay genişlemeye hazır.
> Her katman izlenebilir (Prometheus + Grafana + Loki).

---

## A. MİMARİ — GENEL BAKIŞ (v1)

```
                          ┌──────────────────────────┐
                          │    CDN / WAF             │
                          │  Cloudflare / self-host  │
                          └───────────┬──────────────┘
                                      │
                          ┌───────────▼──────────────┐
                          │   LOAD BALANCER          │
                          │   Traefik / HAProxy      │
                          │   TLS termination        │
                          └──┬────────┬──────────┬───┘
                             │        │          │
              ┌──────────────┘        │          └──────────────┐
              ▼                       ▼                         ▼
   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
   │  WEB APP (×N)    │   │  GO/chI (×N)     │   │  (gelecek)       │
   │  React PWA       │   │  Stateless       │   │  MQTT Broker     │
   │                  │   │                  │   │  ESP32/Phone     │
   │ · i18n layer     │   │ · Auth handler   │   │  device ingestion│
   │ · Module loader  │   │ · Truck/Trip svc │   │                  │
   │ · Dark/light     │   │ · CRM svc        │   └────────┬─────────┘
   └────────┬─────────┘   │ · Billing svc    │            │
            │             │ · Prediction svc │            │
            │             └────────┬─────────┘            │
            │                      │                      │
            └──────────────────────┼──────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
   ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
   │  PostgreSQL      │ │  REDIS           │ │  (gelecek)       │
   │  + pgx pool      │ │  · Cache         │ │  Kafka/Redpanda  │
   │  · RLS           │ │  · Session       │ │  Telemetri       │
   │  · Read replicas │ │  · Rate limit    │ │  tamponu         │
   └──────────────────┘ └──────────────────┘ └──────────────────┘

              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
   ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
   │  S3 / MinIO      │ │  MONITORING      │ │  DISASTER RECOV  │
   │  · PDF faturalar │ │  · Prometheus    │ │  · pg_dump/WAL-G │
   │  · İrsaliye fot. │ │  · Grafana       │ │  · Cross-region  │
   │  · CDN statik    │ │  · Loki (log)    │ │  · RPO < 5dk     │
   └──────────────────┘ └──────────────────┘ └──────────────────┘
```

### Katman Açıklamaları

| Katman | Açıklama | Yatay Ölçeklenme |
|--------|----------|-----------------|
| **CDN/WAF** | Statik asset'ler + DDoS koruması | Cloudflare (otomatik) |
| **Load Balancer** | Traefik — TLS, rate limit, routing | DNS round-robin veya anycast |
| **Web App** | React PWA, her istek stateless | Konteyner sayısını artırarak (K8s HPA) |
| **Go/chi Backend** | Backend API, tenant-aware middleware | Konteyner sayısını artırarak |
| **PostgreSQL** | Multi-tenant schema, RLS | Shard + replica ekleyerek |
| **Redis** | Cache, session, pub/sub, rate limiting | Cluster node ekleyerek |
| **S3/MinIO** | Nesne depolama (fatura, fotoğraf, yedek) | Auto-scale (S3) veya node ekle (MinIO) |
| **Monitoring** | Prometheus + Grafana + Loki + AlertManager | Federated Prometheus |

### Tasarım İlkeleri

```
1. STATELESS — her Go API instance'ı her isteği işleyebilir.
   Session Redis'te, dosya S3'te, veritabanı paylaşımlı.

2. MODULAR — modül ekle/çıkar. Her ülke farklı modül seti
   aktif edebilir. Süper admin panelinden toggle.

3. MULTI-LANGUAGE — i18n her katmanda. DB'de country_configs.
   Frontend'de locale dosyaları. API'de Accept-Language header.

4. OBSERVABLE — her servis /metrics endpoint'i sunar.
   Yapılandırılmış log (slog JSON). Distributed tracing (Trace ID).

5. RECOVERABLE — her katmanın yedek stratejisi var.
   Multi-region aktif-pasif DR. Otomatik failover testleri.
```

### URL Yapısı

| URL | Kullanıcı | Amaç |
|-----|-----------|------|
| `unysol.app` | Herkes | Landing page (ülkeye göre yönlendirme) |
| `unysol.app/tr` | Türkiye | TR landing |
| `unysol.app/app` | Firma sahibi | Dashboard (tenant locale'e göre) |
| `unysol.app/admin` | Süper admin | SaaS yönetim + modül yönetimi + izleme |
| `{slug}.unysol.app` | Firma sahibi | Firma alt alan adı (opsiyonel) |

---

## A.1 MODÜLER MİMARİ — Feature Flag Sistemi

Sistem özellikleri bağımsız modüller halinde paketlenir.
Süper admin her modülü ülke, plan veya tenant bazında açıp kapatabilir.

### Modül Kayıt Defteri

```
┌──────────────────────────────────────────────────────────────┐
│              MODULES (modül kayıt defteri)                    │
├──────────────────────────────────────────────────────────────┤
│ id (PK)               serial                                  │
│ module_key            string     UNIQUE  "truck_tracking"     │
│ module_name           string     "Kamyon Takip"              │
│ description           text                                    │
│ category              enum       CORE / FLEET / FINANCE /    │
│                                   CRM / HR / ANALYTICS /     │
│                                   COMPLIANCE / INTEGRATION   │
│ default_enabled       boolean    yeni tenant'ta varsayılan    │
│ is_core               boolean    true ise KAPATILAMAZ         │
│   CORE modüller: auth, tenant_mgmt, dashboard, settings      │
│ created_at            timestamptz                              │
└──────────────────────────────────────────────────────────────┘
```

### Modül Listesi (v1 Seed — 22 modül)

```
CORE (kapatılamaz):
  ✓ auth                  Kullanıcı girişi, JWT, rol yönetimi
  ✓ tenant_mgmt           Firma CRUD, abonelik
  ✓ dashboard             Ana KPI paneli
  ✓ settings              Tenant ayarları
  ✓ actions               İşlem kayıtları (audit log)

FLEET (aç/kapa):
  □ truck_tracking        Canlı harita + GPS takip
  □ maintenance           Bakım takvimi + kayıtları
  □ fuel_logging          Yakıt takibi
  □ trailer_mgmt          Dorse yönetimi
  □ toll_tracking         HGS geçiş takibi

FINANCE (aç/kapa):
  □ invoice_mgmt          Fatura yönetimi (manuel + otomatik)
  □ expense_tracking      Gider takibi
  □ billing               Abonelik + SaaS faturalandırma
  □ cek_senet             Çek / Senet takibi

CRM (aç/kapa):
  □ customer_mgmt         Müşteri kaydı + risk skoru + depo
  □ trip_mgmt             Sefer yönetimi

ANALYTICS (aç/kapa):
  □ predictions           Tahmin motoru (gelir/gider/kar)
  □ reports               Raporlama

HR (aç/kapa):
  □ employee_mgmt         Personel yönetimi
  □ driver_leave          İzin takvimi
```

### Modül Atama Tabloları

```
┌──────────────────────────────────────────────────────────────┐
│              COUNTRY_MODULES (ülke bazında açık modüller)     │
├──────────────────────────────────────────────────────────────┤
│ id (PK)               serial                                  │
│ country_code          string     "TR" / "AZ" / "DE"          │
│ module_id (FK)        integer    FK→modules.id               │
│ enabled               boolean    default true                 │
│ created_at            timestamptz                              │
│ UNIQUE(country_code, module_id)                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│              PLAN_MODULES (plan bazında açık modüller)        │
├──────────────────────────────────────────────────────────────┤
│ id (PK)               serial                                  │
│ plan                  plan_enum  FREE / PRO / PREMIUM        │
│ module_id (FK)        integer    FK→modules.id               │
│ enabled               boolean                                 │
│ created_at            timestamptz                              │
│ UNIQUE(plan, module_id)                                       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│              TENANT_MODULES (tek tek firmaya override)        │
├──────────────────────────────────────────────────────────────┤
│ id (PK)               serial                                  │
│ tenant_id (FK)        integer                                 │
│ module_id (FK)        integer                                 │
│ enabled               boolean    plan/ülke ayarını override    │
│ created_at            timestamptz                              │
│ UNIQUE(tenant_id, module_id)                                  │
└──────────────────────────────────────────────────────────────┘
```

### Modül Çözümleme Sırası (override zinciri)

```
Bir modülün tenant X için aktif olup olmadığı:

  1. TENANT_MODULES'e bak → tenant için özel ayar varsa onu kullan
  2. Yoksa PLAN_MODULES'e bak → tenant'ın planında açık mı?
  3. Yoksa COUNTRY_MODULES'e bak → tenant'ın ülkesinde açık mı?
  4. Hiçbiri yoksa modules.default_enabled kullan
  5. modules.is_core = true ise HER ZAMAN AÇIK

  Çözümlenen modül listesi JWT token'a gömülür (claims.allowed_modules)
  Frontend bu listeye göre menüleri render eder.
  Backend her istekte claims'teki modülleri kontrol eder.
```

### Süper Admin Modül Paneli

```
┌──────────────────────────────────────────────────────────────┐
│              MODÜL YÖNETİM PANELİ (Super Admin)               │
│                                                               │
│  Ülke: [Türkiye ▼]   Plan: [Tümü ▼]                         │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ MODÜL                 │ TR │ FREE│ PRO │ PREM│ Durum │    │
│  ├────────────────────────┼────┼─────┼─────┼─────┼───────┤    │
│  │ 📡 truck_tracking      │ ✅ │ ✅  │ ✅  │ ✅  │ AKTİF │    │
│  │ 🔧 maintenance         │ ✅ │ ✅  │ ✅  │ ✅  │ AKTİF │    │
│  │ 🧾 invoice_mgmt        │ ✅ │ ✅  │ ✅  │ ✅  │ AKTİF │    │
│  │ 💰 billing             │ ✅ │ ✅  │ ✅  │ ✅  │ AKTİF │    │
│  │ 📈 predictions         │ ✅ │ ✅  │ ✅  │ ✅  │ AKTİF │    │
│  │ 🏦 bank_integration    │ ❌ │ ❌  │ ❌  │ ❌  │ PASİF │    │
│  │ 📱 whatsapp_integration│ ❌ │ ❌  │ ❌  │ ❌  │ PASİF │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  Her hücre tıklanabilir toggle. Değişiklik anında aktif.     │
│  Core modüller gri, kapatılamaz.                             │
└──────────────────────────────────────────────────────────────┘
```

---

## A.2 ÇOK DİLLİ MİMARİ (i18n)

### Dil Stratejisi

```
Başlangıç: Türkçe (tr) — varsayılan
Planlanan: İngilizce (en), Arapça (ar), Rusça (ru), Azerice (az)

Her tenant kendi dilini seçer.
Her kullanıcı tenant dilini override edebilir.
```

### Veritabanı — Ülke Bazlı Konfigürasyon

```
┌──────────────────────────────────────────────────────────────┐
│              COUNTRY_CONFIGS (ülkeye özel regülasyon)         │
├──────────────────────────────────────────────────────────────┤
│ id (PK)               serial                                  │
│ country_code          string     FK→countries.code           │
│ config_key            string     "tax_rate" / "invoice_format"│
│ config_value          JSONB      ülkeye özel değer            │
│ description           text                                    │
│ UNIQUE(country_code, config_key)                              │
└──────────────────────────────────────────────────────────────┘
```

### Frontend i18n Mimarisi

```
frontend/src/i18n/
  ├── index.ts              i18next init, dil dedektörü
  ├── types.ts              Tip tanımları (tüm key'ler)
  └── locales/
      ├── tr.json           Türkçe (varsayılan)
      ├── en.json           İngilizce
      ├── ar.json           Arapça (RTL desteği ile)
      ├── ru.json           Rusça
      └── az.json           Azerice

Dil dedektörü öncelik sırası:
  1. Kullanıcı ayarı (users.locale preference)
  2. Tenant ayarı (tenants.locale)
  3. Browser Accept-Language header
  4. Varsayılan: 'tr'
```

### API'de Dil Desteği

```
İstek:  Accept-Language: tr, en;q=0.9
Cevap:  Content-Language: tr

Hata mesajları istek dilinde döner:
  tr: {"error": "Bu plaka zaten kayıtlı"}
  en: {"error": "This license plate is already registered"}
```

---

## A.3 ÜLKEYE ÖZEL REGÜLASYON UYUMU

### Ülke Konfigürasyon Tablosu

```
┌──────────────────────────────────────────────────────────────┐
│              COUNTRIES (ülke tanımları)                       │
├──────────────────────────────────────────────────────────────┤
│ id (PK)               serial                                  │
│ code                  string     UNIQUE  "TR" / "DE" / "AZ"  │
│ name                  string     "Türkiye"                   │
│ default_locale        string     "tr"                        │
│ currency              string     "TRY" / "EUR" / "USD"       │
│ aktif                 boolean    sadece aktif ülkeler         │
│                           registration'a açık                │
└──────────────────────────────────────────────────────────────┘
```

### Türkiye Konfigürasyonu (başlangıç)

```json
{
  "tax": {
    "kdv_oran": 20,
    "tevkifat_oran": 0.20,
    "stopaj_oran": 0
  },
  "invoice": {
    "format": "e-fatura",
    "fields_required": ["vergi_dairesi", "vergi_no"],
    "serial_format": "UNY{YYYY}{SEQ:6d}"
  },
  "vehicle": {
    "plate_format": "NN AAA NNN",
    "plate_regex": "^[0-9]{2} [A-Z]{1,3} [0-9]{2,4}$",
    "inspection_interval_months": 12
  },
  "driver": {
    "license_categories": ["C", "CE", "D", "DE"],
    "src_required": true,
    "psychoteknik_required": true,
    "max_daily_drive_hours": 9,
    "max_weekly_drive_hours": 56
  },
  "legal": {
    "data_retention_months": 24,
    "kvkk_required": true
  },
  "tolls": {
    "provider": "HGS",
    "import_format": "ptt_csv",
    "vehicle_class_default": 5
  },
  "fuel": {
    "domestic_price_source": "epdk_api",
    "card_providers": ["DKV", "PetrolOfisi", "Shell", "Opet"]
  }
}
```

### Yeni Ülke Ekleme Akışı (Super Admin)

```
1. Super Admin → Ülke Yönetimi → "Yeni Ülke Ekle"
2. code, name, locale, currency gir
3. COUNTRY_CONFIGS'e o ülkenin regülasyon değerlerini gir
4. COUNTRY_MODULES'te o ülke için modülleri aç/kapa
5. Veritabanı seed verisine yeni ülkeyi ekle
6. Ülkeyi "aktif" yap → registration'a açılır
```

---

## A.4 İZLEME VE GÖZLEMLENEBİLİRLİK (Monitoring)

### Prometheus + Grafana + Loki Stack

```
┌──────────────────────────────────────────────────────────────┐
│                   MONITORING ARCHITECTURE                     │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Go/chi   │  │ EMQX     │  │ Nginx    │  │ Redis    │    │
│  │ /metrics │  │ exporter │  │ exporter │  │ exporter │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
│       └─────────────┼─────────────┼─────────────┘           │
│                     │             │                          │
│              ┌──────▼─────────────▼──────┐                   │
│              │       PROMETHEUS         │                   │
│              │   · Metric toplama       │                   │
│              │   · Rule evaluation      │                   │
│              │   · Alert forwarding     │                   │
│              └──────────┬───────────────┘                   │
│                         │                                    │
│         ┌───────────────┼───────────────┐                   │
│         ▼               ▼               ▼                   │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐            │
│  │  GRAFANA   │ │ ALERTMANAG.│ │    LOKI      │            │
│  │  Dashboards│ │ · E-posta  │ │  Log aggreg. │            │
│  │  Panels    │ │ · Slack    │ │  · slog JSON │            │
│  │  Alerts    │ │ · SMS      │ │  · Search    │            │
│  └────────────┘ └────────────┘ └──────────────┘            │
└──────────────────────────────────────────────────────────────┘
```

### Toplanan Metrikler

```
İş Metrikleri (business):
  - unysol_signups_total{plan, country}         Yeni kayıt sayısı
  - unysol_active_tenants                       Aktif firma sayısı
  - unysol_mrr_try                              Aylık yinelenen gelir
  - unysol_active_trucks{tenant_id}             Aktif kamyon sayısı
  - unysol_invoices_created_total{country}      Kesilen fatura sayısı
  - unysol_trips_completed_total                Tamamlanan sefer

Sistem Metrikleri (infrastructure):
  - http_requests_total{method, endpoint, status} İstek sayısı
  - http_request_duration_seconds{method, endpoint} Yanıt süresi
  - db_connections_active                         Aktif DB bağlantısı
  - db_query_duration_seconds{query_type}         Sorgu süresi

Özel Metrikler (custom):
  - unysol_active_conns                   Aktif bağlantı sayısı
  - unysol_rate_limited_requests_total    429 dönen istek
```

### Grafana Dashboard'ları

```
1. İş Genel Bakış (Business Overview)
   - MRR trend, yeni kayıt, churn, aktif kamyon
   - Paket dağılımı pasta grafik
   - Ülke bazlı gelir haritası

2. API Performansı
   - İstek/sn, p95/p99 gecikme, hata oranı
   - Endpoint bazlı heatmap

3. Veritabanı Sağlığı
   - Connection pool kullanımı
   - Query süreleri (top 10 slow)
   - Replication lag, shard boyutları

4. Güvenlik
   - Rate limit ihlalleri
   - Başarısız login denemeleri
   - Şüpheli IP'ler
```

---

## A.5 FELAKET KURTARMA (Disaster Recovery)

### Strateji

```
RPO (Recovery Point Objective): < 5 dakika
  → Son yedeğe en fazla 5 dakikalık veri kaybı
  → WAL (Write-Ahead Log) continuous archiving ile

RTO (Recovery Time Objective): < 30 dakika
  → Felaket anından sisteme tekrar erişilebilene kadar max 30dk
  → Otomatik failover + manuel onay
```

### Yedekleme Katmanları

```
┌──────────────────────────────────────────────────────────────┐
│                    BACKUP STRATEGY                            │
├──────────────┬───────────┬──────────┬────────────────────────┤
│ VERİ         │ SIKLIK    │ SAKLAMA  │ ARAÇ                   │
├──────────────┼───────────┼──────────┼────────────────────────┤
│ PostgreSQL   │ Sürekli   │ 30 gün   │ WAL-G → S3 (PITR)     │
│ (WAL)        │ arşiv     │          │                        │
├──────────────┼───────────┼──────────┼────────────────────────┤
│ PostgreSQL   │ Günlük    │ 90 gün   │ pg_dump → S3           │
│ (full dump)  │ 03:00     │          │ (şifreli + sıkıştırılmış)│
├──────────────┼───────────┼──────────┼────────────────────────┤
│ Redis        │ Saatlik   │ 7 gün    │ RDB snapshot → S3      │
├──────────────┼───────────┼──────────┼────────────────────────┤
│ S3/MinIO     │ Sürekli   │ 90 gün   │ Cross-region replikasyon│
│ (fatura vb)  │ senkron   │          │                        │
├──────────────┼───────────┼──────────┼────────────────────────┤
│ Konfigürasyon│ Günlük    │ Sonsuz   │ Git repo (Infra as Code)│
│ (docker-comp)│           │          │                        │
└──────────────┴───────────┴──────────┴────────────────────────┘
```

### Çok Bölgeli DR Mimarisi (Hedef)

```
┌───────────────────┐                    ┌───────────────────┐
│   PRIMARY (İST)   │   Async Repl.     │  STANDBY (ANK)    │
│                   │◄──────────────────►│                   │
│ · PostgreSQL      │                    │ · PostgreSQL      │
│   (master)        │                    │   (standby)       │
│ · Redis (active)  │                    │ · Redis (passive) │
│ · Go/chi (×3)     │                    │ · Go/chi (×1)    │
│ · Web App (×2)    │   DNS Failover     │ · Web App (×1)    │
│                   │   (Cloudflare)     │                   │
│   AKTİF hizmet ───┼─────►  FELAKET ────┼──► AKTİF hizmet  │
└───────────────────┘                    └───────────────────┘
```

---

## A.6 YATAY ÖLÇEKLENEBİLİRLİK KONTROL LİSTESİ

```
Her bileşenin yatay ölçeklenebilirlik durumu:

✅ Stateless API (Go/chi)         → container × N
✅ Stateless Web (React PWA)      → container × N
✅ Redis (cluster mode)           → node × N + sharding
⬜ PostgreSQL (sharded)           → shard × N (10K+ kullanıcıda)
✅ S3/MinIO (object storage)      → auto-scale (S3)
✅ CDN (Cloudflare)               → auto-scale
✅ Monitoring stack               → federated Prometheus

Durum: ✅ = Day 1'den hazır, ⬜ = Büyüyünce eklenecek
```

---

## B. FİYATLANDIRMA PAKETLERİ

| Özellik | FREE | PRO (200 TL/ay) | PREMIUM (500 TL/ay) |
|---------|------|-----------------|---------------------|
| Kayıtlı kamyon | 1 | 5 | Sınırsız |
| Canlı GPS takip | ✓ | ✓ | ✓ |
| Geçmiş veri saklama | 3 ay | 1 yıl | Sınırsız |
| Dashboard + KPI | Temel | Tam | Tam + Özel |
| Sefer yönetimi | Manuel | Otomatik | Otomatik + Optimizasyon |
| Fatura (manuel) | ✓ | ✓ | ✓ |
| e-Fatura / e-Arşiv | — | ✓ | ✓ |
| CRM (müşteri takibi) | — | ✓ | ✓ |
| Personel yönetimi | — | ✓ | ✓ |
| Gider takibi | — | ✓ | ✓ |
| Tahmin motoru | — | ✓ | ✓ |
| Bakım takvimi | — | ✓ | ✓ |
| HGS entegrasyonu | — | ✓ | ✓ |
| Çek/Senet takibi | — | ✓ | ✓ |
| API erişimi | — | — | ✓ |
| Beyaz etiket (logo) | — | — | ✓ |
| Öncelikli destek | — | — | ✓ |
| Veri dışa aktarım (CSV/PDF) | — | Temel | Tam |

> Startup fazında TÜM özellikler tüm paketlerde AKTİF.
> Limitler sadece kayıtlı kamyon sayısı ve veri saklama süresinde geçerli.
> Müşteri tabanı oluşunca kısıtlamalar devreye girer.

---

## C. KULLANICI TİPLERİ VE ROL BAZLI EKRANLAR

```
┌─────────────────────────────────────────────────────────┐
│                    KULLANICI ROLLERİ                     │
├──────────────┬──────────────────────┬────────────────────┤
│ SUPER_ADMIN  │ TENANT_OWNER         │ DRIVER / OFFICE /  │
│ (biz)        │ (firma sahibi)       │ ACCOUNTANT         │
├──────────────┼──────────────────────┼────────────────────┤
│ Tüm firmaları│ Kendi firması        │ Kendi firması      │
│ görür        │ tüm özellikler       │ sınırlı özellikler │
│ Fatura keser │ Personel ekler       │ Sadece görevleri   │
│ Destek verir │ Ayarları yönetir     │ Kendi metriklerini │
│ Modül yönetir│ Plan yükseltir       │ görür              │
└──────────────┴──────────────────────┴────────────────────┘

Rol enum: SUPER_ADMIN, TENANT_OWNER, DRIVER, OFFICE, ACCOUNTANT
(schema: users.rol → user_rol_enum)
```

---

## D. UI AKIŞ ŞEMASI (FLOWCHART)

```
                        ┌─────────────┐
                        │  LANDING    │
                        │  PAGE       │
                        └──┬──┬───┬──┘
                           │  │   │
              ┌────────────┘  │   └────────────┐
              ▼               ▼                ▼
        ┌──────────┐   ┌───────────┐    ┌───────────┐
        │  SIGNUP  │   │  LOGIN    │    │ PRICING   │
        │          │   │           │    │ PAGE      │
        └────┬─────┘   └─────┬─────┘    └───────────┘
             │               │
             │        ┌──────┴──────┐
             │        │  role check │
             │        └──┬──────┬──┘
             │           │      │
             │    ┌──────┘      └──────┐
             │    ▼                    ▼
             │ ┌──────────┐    ┌──────────────┐
             │ │ TENANT   │    │ SUPER ADMIN  │
             │ │ DASHBOARD│    │ DASHBOARD    │
             │ └────┬─────┘    └──────┬───────┘
             │      │                 │
             │      │          ┌──────┴──────┐
             │      │          │             │
             │      │     ┌────▼───┐   ┌─────▼─────┐
             │      │     │TENANTS │   │SUBSCRIPT. │
             │      │     │LIST    │   │& BILLING  │
             │      │     └────────┘   └───────────┘
             │      │
             │      │
             └──────┘
                    │
        ┌───────────┴───────────────────────┐
        │        TENANT DASHBOARD           │
        │  (sol sidebar + üst bar + içerik) │
        └───────┬───────────────────────────┘
                │
    ┌─────┬─────┼─────┬─────┬─────┬──────┬──────┐
    ▼     ▼     ▼     ▼     ▼     ▼      ▼      ▼
 ┌────┐┌────┐┌────┐┌────┐┌────┐┌──────┐┌────┐┌──────┐
 │FİLO││SEFER││MÜŞ- ││FATU││Gİ-  ││PERSO-││TAH-││AYAR- │
 │TAKİ││LER  ││TERİ ││RALAR││DER  ││NEL   ││MİN ││LAR   │
 │P   ││     ││     ││    ││     ││      ││    ││      │
 └────┘└─────┘└─────┘└────┘└─────┘└──────┘└────┘└──────┘
```

### Ekran Detayları

**1. LANDING PAGE**
- Hero: "Filonuzu tek ekrandan yönetin" + CTA (Ücretsiz Başla)
- Özellikler bölümü (3 kolon — GPS takip, Fatura, Tahmin)
- Fiyatlandırma kartları (3'lü)
- Alt bilgi: İletişim, KVKK, sözleşme

**2. LOGIN / SIGNUP**
- Email + şifre ile giriş
- Firma kaydı: unvan, vergi no, telefon, email, şifre
- → Yönlendirme: Dashboard'a

**3. TENANT DASHBOARD**
- Sol sidebar: Logo, nav linkleri (10+ adet), altta paket bilgisi + yükselt butonu
- Üst bar: Firma adı, bildirim çanı, profil avatarı, çıkış
- İçerik alanı:
  - KPI kartları: Aktif kamyon, bugünkü kazanç, bu ay kar, bekleyen tahsilat
  - Aylık gelir-gider chart (recharts)
  - Son aktiviteler tablosu

**4. SUPER ADMIN DASHBOARD**
- Toplam firma sayısı, aktif/pasif
- MRR (Monthly Recurring Revenue)
- Bu ay yeni kayıt, churn rate
- Tenant listesi (firma adı, sahibi, paket, durum)

---

## E. TEKNOLOJİ YIĞINI (Tech Stack)

### Backend

| Teknoloji | Versiyon | Amaç |
|-----------|----------|------|
| **Go** | 1.22 | Backend programlama dili |
| **chi** | v5.1.0 | HTTP router (Go) |
| **pgx** | v5.7.1 | PostgreSQL sürücüsü |
| **golang-jwt** | v5.2.1 | JWT token yönetimi |
| **golang.org/x/crypto** | v0.28.0 | bcrypt şifre hash |
| **google/uuid** | v1.6.0 | UUID oluşturma |
| **go-chi/cors** | v1.2.1 | CORS middleware |

### Frontend

| Teknoloji | Versiyon | Amaç |
|-----------|----------|------|
| **React** | 18.3.1 | UI kütüphanesi |
| **TypeScript** | 5.5 | Tip güvenliği |
| **Vite** | 5.4.0 | Build aracı |
| **Tailwind CSS** | 3.4.3 | Utility-first CSS |
| **react-router-dom** | 6.26.0 | Client-side routing |
| **axios** | 1.7.0 | HTTP client |
| **recharts** | 2.12.0 | Grafik kütüphanesi |
| **leaflet** | 1.9.4 | Harita bileşeni |
| **lucide-react** | 0.400.0 | İkon kütüphanesi |
| **jspdf** | 4.2.1 | PDF oluşturma |
| **xlsx** | 0.18.5 | Excel dışa aktarım |

### Altyapı

| Teknoloji | Versiyon | Amaç |
|-----------|----------|------|
| **PostgreSQL** | 16 | Birincil veritabanı |
| **Redis** | 7 | Cache + session |
| **Docker** | Compose v3.8 | Konteyner orkestrasyonu |

---

## F. VERİTABANI ŞEMASI (MULTI-TENANT)

### Çok Kiracılı Mimari Yaklaşımı
**Seçim: Shared Database + Row-Level Security (tenant_id her tabloda)**

PostgreSQL RLS ile her sorguya otomatik `WHERE tenant_id = current_setting('app.current_tenant_id')` eklenir.

### Tablo Listesi (29 tablo)

| # | Tablo | Katman | Açıklama |
|---|-------|--------|----------|
| 1 | tenants | SaaS | Firmalar (slug, plan, locale, country_code) |
| 2 | users | SaaS | Kullanıcılar (SUPER_ADMIN/TENANT_OWNER/DRIVER/OFFICE/ACCOUNTANT) |
| 3 | trucks | Fleet | Kamyonlar (plaka, marka, tracking_source) |
| 4 | trailers | Fleet | Dorseler |
| 5 | trips | Operations | Seferler (durum, rota, ucret, odeme) |
| 6 | customers | CRM | Müşteriler (vergi, depo, risk skoru) |
| 7 | invoices | Finance | Faturalar (e-Fatura, KDV, tevkifat) |
| 8 | invoice_items | Finance | Fatura kalemleri |
| 9 | invoice_payments | Finance | Fatura ödemeleri |
| 10 | e_fatura_logs | Finance | e-Fatura işlem günlüğü |
| 11 | invoice_recurrences | Finance | Tekrarlayan faturalar |
| 12 | expenses | Finance | Giderler (21 kategori) |
| 13 | employees | HR | Personel (ehliyet, SRC) |
| 14 | cek_senet | Finance | Çek/Senet takibi |
| 15 | modules | Platform | Modül kayıt defteri |
| 16 | country_modules | Platform | Ülke bazlı modüller |
| 17 | plan_modules | Platform | Plan bazlı modüller |
| 18 | tenant_modules | Platform | Firmaya özel override |
| 19 | countries | Platform | Ülke tanımları |
| 20 | country_configs | Platform | Ülke regülasyon konfigürasyonu |
| 21 | actions | Core | İşlem kayıtları (audit log) |
| 22 | settings | Core | Tenant ayarları |
| 23 | notifications | Core | Bildirimler |
| 24 | predictions | Analytics | Tahmin motoru |
| 25 | subscriptions | SaaS | Abonelik geçmişi |
| 26 | password_resets | Auth | Şifre sıfırlama |
| 27 | maintenance_records | Fleet | Bakım kayıtları |
| 28 | fuel_logs | Fleet | Yakıt günlüğü |
| 29 | toll_logs | Fleet | HGS/otoyol geçişleri |
| - | driver_leave | HR | Şoför izin takvimi (schema'da) |
| - | insurance_policies | Fleet | Sigorta poliçeleri (schema'da) |
| - | billing | Finance | SaaS faturalandırma (schema'da) |
| - | load_board | Fleet | Yük panosu (schema'da) |

**Toplam: 29 CREATE TABLE + 17 enum tipi + RLS policy (26 tabloda aktif)**

### RLS (Row-Level Security)

```sql
-- Genel RLS policy fonksiyonu
CREATE OR REPLACE FUNCTION tenant_rls_policy(table_name TEXT)
RETURNS VOID AS $$
DECLARE
    pol_name TEXT;
BEGIN
    pol_name := table_name || '_tenant_isolation';
    EXECUTE format('
        CREATE POLICY %I ON %I
            FOR ALL
            USING (tenant_id = COALESCE(NULLIF(current_setting(''app.current_tenant_id'', TRUE), ''''), ''0'')::INTEGER)
            WITH CHECK (tenant_id = COALESCE(NULLIF(current_setting(''app.current_tenant_id'', TRUE), ''''), ''0'')::INTEGER)
    ', pol_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Users özel policy (SUPER_ADMIN bypass)
CREATE POLICY users_tenant_isolation ON users
    FOR ALL
    USING (
        tenant_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', TRUE), ''), '0')::INTEGER
        OR COALESCE(NULLIF(current_setting('app.current_tenant_id', TRUE), ''), '0')::INTEGER = 0
    );
```

---

## G. BACKEND SERVİS MİMARİSİ

### Go/chi Handler Mimarisi

```
cmd/server/main.go         ← Entry point, router setup
internal/
  ├── config/config.go     ← Environment config (PORT, DATABASE_URL, JWT_SECRET)
  ├── database/
  │   ├── postgres.go      ← pgx pool + migrations runner
  │   └── migrations/      ← SQL migration files
  ├── middleware/
  │   ├── auth.go          ← JWT doğrulama + tenant context
  │   ├── logging.go       ← slog structured logging
  │   └── actionlog.go     ← Dosya tabanlı işlem günlüğü
  ├── handlers/
  │   ├── auth.go          ← /api/auth/* (signup, login)
  │   ├── trucks.go        ← /api/tenant/trucks/*
  │   ├── trips.go         ← /api/tenant/trips/*
  │   ├── customers.go     ← /api/tenant/customers/*
  │   ├── invoices.go      ← /api/tenant/invoices/*
  │   ├── expenses.go      ← /api/tenant/expenses/*
  │   ├── employees.go     ← /api/tenant/employees/*
  │   ├── cek_senet.go     ← /api/tenant/cek-senet/*
  │   ├── dashboard.go     ← /api/tenant/dashboard/*
  │   ├── predictions.go   ← /api/tenant/predictions/*
  │   ├── billing.go       ← /api/tenant/billing/*
  │   ├── settings.go      ← /api/tenant/settings/*
  │   ├── notifications.go ← /api/tenant/notifications/*
  │   ├── actions.go       ← /api/tenant/actions/*
  │   ├── admin.go         ← /api/admin/*
  │   ├── modules.go       ← /api/admin/modules/*
  │   ├── countries.go     ← /api/admin/countries/*
  │   ├── system.go        ← /api/system/* (health, metrics)
  │   └── tenant.go        ← Tenant ortak middleware/helpers
  └── models/
      └── models.go        ← Tüm structlar (request/response/DB)
```

### API Namespace'leri

```
/api/auth/
  POST   /signup                    Firma kaydı + tenant oluştur
  POST   /login                     email + şifre → JWT

/api/system/
  GET    /health                    Health check
  GET    /health/ready              Readiness probe (K8s)
  GET    /health/live               Liveness probe (K8s)
  GET    /metrics                   Prometheus /metrics

/api/tenant/                         ← JWT'den tenant_id alınır
  GET    /dashboard/...             Dashboard KPI'ları
  GET    /trucks                    Firmaya ait kamyonlar
  POST   /trucks                    Kamyon ekle
  PUT    /trucks/{id}               Kamyon düzenle
  DELETE /trucks/{id}               Kamyon sil
  GET    /trips                     Seferler
  POST   /trips                     Yeni sefer
  PUT    /trips/{id}                Sefer düzenle
  GET    /customers                 Müşteri listesi
  POST   /customers                 Müşteri ekle
  GET    /invoices                  Fatura listesi
  POST   /invoices                  Fatura kes
  GET    /expenses                  Gider listesi
  POST   /expenses                  Gider ekle
  GET    /employees                 Personel listesi
  POST   /employees                 Personel ekle
  GET    /cek-senet                 Çek/Senet listesi
  POST   /cek-senet                 Çek/Senet ekle
  GET    /predictions               12 ay tahmin
  GET    /billing/plans             Plan listesi
  GET    /settings                  Tenant ayarları
  PUT    /settings                  Ayar güncelle
  GET    /notifications             Bildirim listesi
  GET    /actions                   İşlem kayıtları

/api/admin/                          ← SUPER_ADMIN JWT
  GET    /tenants                   Tüm firmalar
  GET    /tenants/{id}              Firma detayı
  PUT    /tenants/{id}/plan         Paket değiştir
  POST   /tenants/{id}/suspend      Dondur
  GET    /analytics/mrr             MRR grafiği
  GET    /analytics/churn           Churn rate
  GET    /analytics/growth          Büyüme verisi
  GET    /users                     Kullanıcı listesi
  POST   /users                     Kullanıcı oluştur
  GET    /modules                   Tüm modüller
  POST   /modules                   Yeni modül ekle
  PUT    /modules/{id}              Modül güncelle
  GET    /countries                 Tüm ülkeler
  POST   /countries                 Yeni ülke ekle
```

---

## H. DOCKER COMPOSE ALTYAPISI

```yaml
# 4 servis: PostgreSQL 16 + Redis 7 + Go Backend + React Frontend
services:
  db:
    image: postgres:16-alpine
    container_name: unysol-db
    environment:
      POSTGRES_USER: unysol
      POSTGRES_PASSWORD: unysol
      POSTGRES_DB: unysol
    ports: ["5433:5432"]
    volumes:
      - ./database/01-schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: unysol-redis
    ports: ["6380:6379"]

  backend:
    build: ./backend
    container_name: unysol-backend
    environment:
      PORT: "8080"
      DATABASE_URL: "postgres://unysol:unysol@db:5432/unysol?sslmode=disable"
      JWT_SECRET: "unysol-dev-secret-change-in-production"
      REDIS_URL: "redis:6379"
    ports: ["8080:8080"]

  frontend:
    build: ./frontend
    container_name: unysol-frontend
    ports: ["5174:5173"]
```

### Minimum VPS Gereksinimleri

| Bileşen | 0-50 firma | 50-200 firma | 200+ firma |
|---------|------------|--------------|------------|
| CPU | 2 vCPU | 4 vCPU | 8+ vCPU |
| RAM | 4 GB | 8 GB | 16+ GB |
| Disk | 40 GB SSD | 100 GB SSD | 200+ GB SSD |
| PostgreSQL | Aynı sunucu | Aynı sunucu | Ayrı sunucu |
| Redis | Aynı sunucu | Aynı sunucu | Ayrı sunucu |
| Tahmini aylık | ~400 TL | ~800 TL | ~2.500 TL |

---

## I. GELİŞTİRME FAZLARI

| Faz | Süre | Kapsam |
|-----|------|--------|
| **Faz 0** | 1 hafta | Multi-tenant veritabanı + RLS + auth (JWT) + tenant CRUD |
| **Faz 1** | 2 hafta | Landing page + Signup akışı + Paket seçimi |
| **Faz 2** | 2 hafta | Tenant dashboard (KPI + trucks + trips + customers) |
| **Faz 3** | 2 hafta | Fatura + Gider + Personel modülleri |
| **Faz 4** | 2 hafta | Super admin panel (tenant listesi, abonelik, MRR) |
| **Faz 5** | 2 hafta | Tahmin motoru + Çek/Senet + Bildirimler |
| **Faz 6** | 2 hafta | Ödeme entegrasyonu + Otomatik fatura + Test & Launch |

Toplam: **11 hafta**, 1-2 geliştirici ile SaaS MVP.

---

## J. PROJE DİZİN YAPISI

```
/home/ugur/unysol/
├── docker-compose.yml           ← 4 servis (PG, Redis, Backend, Frontend)
├── database/
│   └── 01-schema.sql            ← 830 satır, 29 tablo + RLS + seed data
├── backend/
│   ├── Dockerfile
│   ├── go.mod                   ← module unysol, Go 1.22
│   ├── go.sum
│   ├── actions.log              ← İşlem günlüğü dosyası
│   └── cmd/server/main.go       ← Entry point, chi router
│   └── internal/
│       ├── config/config.go     ← Env var yükleme
│       ├── database/
│       │   ├── postgres.go      ← pgx pool, migration runner
│       │   └── migrations/      ← SQL migration dosyaları
│       ├── handlers/            ← 18 handler dosyası
│       ├── middleware/           ← Auth, logging, actionlog
│       └── models/models.go     ← 1130 satır, tüm Go structları
└── frontend/
    ├── Dockerfile
    ├── package.json             ← React 18, Vite, Tailwind
    ├── vite.config.ts
    ├── tsconfig.json
    └── src/
        ├── main.tsx             ← React entry point
        ├── App.tsx              ← Router tanımları
        ├── contexts/
        │   └── AuthContext.tsx   ← Auth state management
        ├── lib/
        │   ├── api.ts           ← Tenant axios instance
        │   ├── adminApi.ts      ← Admin axios instance
        │   ├── auth.ts          ← Login/signup/logout
        │   ├── adminAuth.ts     ← Admin auth
        │   ├── export.ts        ← CSV/Excel/PDF export
        │   └── share.ts         ← WhatsApp/Email paylaşım
        ├── components/
        │   ├── Sidebar.tsx      ← Sol menü
        │   ├── MainLayout.tsx   ← Sayfa layout'u
        │   ├── DataGrid.tsx     ← Veri tablosu komponenti
        │   └── KpiCard.tsx      ← KPI kartı
        ├── pages/
        │   ├── LandingPage.tsx
        │   ├── LoginPage.tsx
        │   ├── AdminLoginPage.tsx
        │   ├── AdminDashboard.tsx
        │   ├── DashboardHome.tsx
        │   ├── TrucksPage.tsx
        │   ├── TripsPage.tsx
        │   ├── CustomersPage.tsx
        │   ├── InvoicesPage.tsx
        │   ├── ExpensesPage.tsx
        │   ├── EmployeesPage.tsx
        │   ├── PredictionsPage.tsx
        │   ├── CekSenetPage.tsx
        │   ├── SettingsPage.tsx
        │   └── ActionsPage.tsx
        └── types/
            └── index.ts              ← TypeScript tip tanımları
└── testusernamesandpasswords.md       ← Çok kiracılı test kullanıcı bilgileri (10 firma + 30 alt kullanıcı)
```
