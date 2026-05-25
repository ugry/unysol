package repository

import (
	"context"
	"fmt"
	"log/slog"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/models"
)

type Repository struct {
	DB *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{DB: pool}
}

func tenantIDFromContext(ctx context.Context) (int, error) {
	v, _ := ctx.Value("tenant_id").(string)
	if v == "" {
		return 0, fmt.Errorf("tenant_id not found in context")
	}
	return strconv.Atoi(v)
}

// ============================================================
// Trucks
// ============================================================

func (r *Repository) ListTrucks(ctx context.Context, tenantID int) ([]models.Truck, error) {
	rows, err := r.DB.Query(ctx,
		`SELECT id, tenant_id, plaka, marka, model, yil, yakit_tipi, tracking_source,
		        km_sayac_baslangic, km_sayac_guncel, muayene_bitis, aktif, created_at, updated_at
		 FROM trucks WHERE tenant_id = $1 AND aktif = true ORDER BY id DESC`, tenantID)
	if err != nil {
		slog.Error("repository: failed to list trucks", "error", err, "tenant_id", tenantID)
		return nil, fmt.Errorf("failed to list trucks: %w", err)
	}
	defer rows.Close()

	trucks := make([]models.Truck, 0)
	for rows.Next() {
		var t models.Truck
		if err := rows.Scan(&t.ID, &t.TenantID, &t.Plaka, &t.Marka, &t.Model, &t.Yil,
			&t.YakitTipi, &t.TrackingSource, &t.KmSayacBaslangic, &t.KmSayacGuncel,
			&t.MuayeneBitis, &t.Aktif, &t.CreatedAt, &t.UpdatedAt); err != nil {
			slog.Error("repository: failed to scan truck", "error", err, "tenant_id", tenantID)
			return nil, fmt.Errorf("failed to scan truck: %w", err)
		}
		trucks = append(trucks, t)
	}
	return trucks, nil
}

func (r *Repository) GetTruckByID(ctx context.Context, id, tenantID int) (*models.Truck, error) {
	var t models.Truck
	err := r.DB.QueryRow(ctx,
		`SELECT id, tenant_id, plaka, marka, model, yil, yakit_tipi, tracking_source,
		        km_sayac_baslangic, km_sayac_guncel, muayene_bitis, aktif, created_at, updated_at
		 FROM trucks WHERE id = $1 AND tenant_id = $2`, id, tenantID,
	).Scan(&t.ID, &t.TenantID, &t.Plaka, &t.Marka, &t.Model, &t.Yil,
		&t.YakitTipi, &t.TrackingSource, &t.KmSayacBaslangic, &t.KmSayacGuncel,
		&t.MuayeneBitis, &t.Aktif, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		slog.Error("repository: failed to get truck", "error", err, "id", id, "tenant_id", tenantID)
		return nil, fmt.Errorf("truck not found: %w", err)
	}
	return &t, nil
}

func (r *Repository) CreateTruck(ctx context.Context, req models.CreateTruckRequest) (*models.Truck, error) {
	var t models.Truck
	err := r.DB.QueryRow(ctx,
		`INSERT INTO trucks (tenant_id, plaka, marka, model, yil, yakit_tipi, tracking_source)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, tenant_id, plaka, marka, model, yil, yakit_tipi, tracking_source,
		           km_sayac_baslangic, km_sayac_guncel, muayene_bitis, aktif, created_at, updated_at`,
		req.TenantID, req.Plaka, req.Marka, req.Model, req.Yil, req.YakitTipi, req.TrackingSource,
	).Scan(&t.ID, &t.TenantID, &t.Plaka, &t.Marka, &t.Model, &t.Yil,
		&t.YakitTipi, &t.TrackingSource, &t.KmSayacBaslangic, &t.KmSayacGuncel,
		&t.MuayeneBitis, &t.Aktif, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		slog.Error("repository: failed to create truck", "error", err, "tenant_id", req.TenantID)
		return nil, fmt.Errorf("failed to create truck: %w", err)
	}
	return &t, nil
}

func (r *Repository) UpdateTruck(ctx context.Context, id int, req models.UpdateTruckRequest, tenantID int) (*models.Truck, error) {
	var t models.Truck
	err := r.DB.QueryRow(ctx,
		`UPDATE trucks SET plaka = $1, marka = $2, model = $3, yil = $4, tracking_source = $5, updated_at = $6
		 WHERE id = $7 AND tenant_id = $8
		 RETURNING id, tenant_id, plaka, marka, model, yil, yakit_tipi, tracking_source,
		           km_sayac_baslangic, km_sayac_guncel, muayene_bitis, aktif, created_at, updated_at`,
		req.Plaka, req.Marka, req.Model, req.Yil, req.TrackingSource, time.Now(),
		id, tenantID,
	).Scan(&t.ID, &t.TenantID, &t.Plaka, &t.Marka, &t.Model, &t.Yil,
		&t.YakitTipi, &t.TrackingSource, &t.KmSayacBaslangic, &t.KmSayacGuncel,
		&t.MuayeneBitis, &t.Aktif, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		slog.Error("repository: failed to update truck", "error", err, "id", id, "tenant_id", tenantID)
		return nil, fmt.Errorf("failed to update truck: %w", err)
	}
	return &t, nil
}

func (r *Repository) DeleteTruck(ctx context.Context, id, tenantID int) error {
	tag, err := r.DB.Exec(ctx,
		`UPDATE trucks SET aktif = false, updated_at = $1 WHERE id = $2 AND tenant_id = $3`,
		time.Now(), id, tenantID)
	if err != nil {
		slog.Error("repository: failed to delete truck", "error", err, "id", id, "tenant_id", tenantID)
		return fmt.Errorf("failed to delete truck: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("truck not found")
	}
	return nil
}

func (r *Repository) CountTrucks(ctx context.Context, tenantID int) (int, error) {
	var count int
	err := r.DB.QueryRow(ctx,
		`SELECT COUNT(*) FROM trucks WHERE tenant_id = $1 AND aktif = true`, tenantID).Scan(&count)
	if err != nil {
		slog.Error("repository: failed to count trucks", "error", err, "tenant_id", tenantID)
		return 0, fmt.Errorf("failed to count trucks: %w", err)
	}
	return count, nil
}

// ============================================================
// Trips
// ============================================================

func (r *Repository) ListTrips(ctx context.Context, tenantID int) ([]models.Trip, error) {
	rows, err := r.DB.Query(ctx,
		`SELECT t.id, t.tenant_id, t.truck_id, t.customer_id, t.baslangic, t.bitis, t.durum,
		        t.ucret, t.payment_method, t.invoice_id, t.sofor, t.yukleme, t.teslimat,
		        t.musteri, COALESCE(tr.plaka, ''), t.created_at
		 FROM trips t LEFT JOIN trucks tr ON t.truck_id = tr.id
		 WHERE t.tenant_id = $1 ORDER BY t.id DESC`, tenantID)
	if err != nil {
		slog.Error("repository: failed to list trips", "error", err, "tenant_id", tenantID)
		return nil, fmt.Errorf("failed to list trips: %w", err)
	}
	defer rows.Close()

	trips := make([]models.Trip, 0)
	for rows.Next() {
		var tr models.Trip
		if err := rows.Scan(&tr.ID, &tr.TenantID, &tr.TruckID, &tr.CustomerID, &tr.Baslangic,
			&tr.Bitis, &tr.Durum, &tr.Ucret, &tr.PaymentMethod, &tr.InvoiceID,
			&tr.Sofor, &tr.Yukleme, &tr.Teslimat, &tr.Musteri, &tr.TruckPlaka, &tr.CreatedAt); err != nil {
			slog.Error("repository: failed to scan trip", "error", err, "tenant_id", tenantID)
			return nil, fmt.Errorf("failed to scan trip: %w", err)
		}
		trips = append(trips, tr)
	}
	return trips, nil
}

func (r *Repository) GetTripByID(ctx context.Context, id, tenantID int) (*models.Trip, error) {
	var tr models.Trip
	err := r.DB.QueryRow(ctx,
		`SELECT t.id, t.tenant_id, t.truck_id, t.customer_id, t.baslangic, t.bitis, t.durum,
		        t.ucret, t.payment_method, t.invoice_id, t.sofor, t.yukleme, t.teslimat,
		        t.musteri, COALESCE(tr2.plaka, ''), t.created_at
		 FROM trips t LEFT JOIN trucks tr2 ON t.truck_id = tr2.id
		 WHERE t.id = $1 AND t.tenant_id = $2`, id, tenantID,
	).Scan(&tr.ID, &tr.TenantID, &tr.TruckID, &tr.CustomerID, &tr.Baslangic,
		&tr.Bitis, &tr.Durum, &tr.Ucret, &tr.PaymentMethod, &tr.InvoiceID,
		&tr.Sofor, &tr.Yukleme, &tr.Teslimat, &tr.Musteri, &tr.TruckPlaka, &tr.CreatedAt)
	if err != nil {
		slog.Error("repository: failed to get trip", "error", err, "id", id, "tenant_id", tenantID)
		return nil, fmt.Errorf("trip not found: %w", err)
	}
	return &tr, nil
}

func (r *Repository) CreateTrip(ctx context.Context, req models.CreateTripRequest) (*models.Trip, error) {
	var tr models.Trip
	err := r.DB.QueryRow(ctx,
		`INSERT INTO trips (tenant_id, truck_id, sofor, customer_id, yukleme, teslimat, ucret,
		                    baslangic, bitis)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		 RETURNING id, tenant_id, truck_id, customer_id, baslangic, bitis, durum, ucret,
		           payment_method, invoice_id, sofor, yukleme, teslimat, musteri,
		           COALESCE((SELECT plaka FROM trucks WHERE id = $2), ''), created_at`,
		req.TenantID, req.TruckID, req.Sofor, req.Musteri, req.Yukleme, req.Teslimat,
		req.Ucret, req.BaslangicTarih, req.BitisTarih,
	).Scan(&tr.ID, &tr.TenantID, &tr.TruckID, &tr.CustomerID, &tr.Baslangic,
		&tr.Bitis, &tr.Durum, &tr.Ucret, &tr.PaymentMethod, &tr.InvoiceID,
		&tr.Sofor, &tr.Yukleme, &tr.Teslimat, &tr.Musteri, &tr.TruckPlaka, &tr.CreatedAt)
	if err != nil {
		slog.Error("repository: failed to create trip", "error", err, "tenant_id", req.TenantID)
		return nil, fmt.Errorf("failed to create trip: %w", err)
	}
	return &tr, nil
}

func (r *Repository) UpdateTrip(ctx context.Context, id int, req models.UpdateTripRequest, tenantID int) (*models.Trip, error) {
	var tr models.Trip
	now := time.Now()
	err := r.DB.QueryRow(ctx,
		`UPDATE trips SET plaka = $1, sofor = $2, musteri = $3, yukleme = $4, teslimat = $5,
		                  ucret = $6, durum = $7, km = $8, yakit = $9, irsaliye = $10,
		                  baslangic_tarih = $11, bitis_tarih = $12, odeme_durumu = $13, updated_at = $14
		 WHERE id = $15 AND tenant_id = $16
		 RETURNING id, tenant_id, truck_id, customer_id, baslangic, bitis, durum, ucret,
		           payment_method, invoice_id, sofor, yukleme, teslimat, musteri,
		           COALESCE((SELECT plaka FROM trucks WHERE id = trips.truck_id), ''), created_at`,
		req.Plaka, req.Sofor, req.Musteri, req.Yukleme, req.Teslimat,
		req.Ucret, req.Durum, req.Km, req.Yakit, req.Irsaliye,
		req.BaslangicTarih, req.BitisTarih, req.OdemeDurumu, now,
		id, tenantID,
	).Scan(&tr.ID, &tr.TenantID, &tr.TruckID, &tr.CustomerID, &tr.Baslangic,
		&tr.Bitis, &tr.Durum, &tr.Ucret, &tr.PaymentMethod, &tr.InvoiceID,
		&tr.Sofor, &tr.Yukleme, &tr.Teslimat, &tr.Musteri, &tr.TruckPlaka, &tr.CreatedAt)
	if err != nil {
		slog.Error("repository: failed to update trip", "error", err, "id", id, "tenant_id", tenantID)
		return nil, fmt.Errorf("failed to update trip: %w", err)
	}
	return &tr, nil
}

func (r *Repository) UpdateTripStatus(ctx context.Context, id int, durum string, tenantID int) error {
	tag, err := r.DB.Exec(ctx,
		`UPDATE trips SET durum = $1, updated_at = $2 WHERE id = $3 AND tenant_id = $4`,
		durum, time.Now(), id, tenantID)
	if err != nil {
		slog.Error("repository: failed to update trip status", "error", err, "id", id, "tenant_id", tenantID)
		return fmt.Errorf("failed to update trip status: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("trip not found")
	}
	return nil
}

// ============================================================
// Customers
// ============================================================

func (r *Repository) ListCustomers(ctx context.Context, tenantID int) ([]models.Customer, error) {
	rows, err := r.DB.Query(ctx,
		`SELECT id, tenant_id, firma_unvani, yetkili, telefon, email, adres, fatura_adresi,
		        vergi_dairesi, vergi_no, kategori, bakiye, acik_hesap_limiti, risk_skoru,
		        vade_gun, depo_adresleri, fiyat_katalogu, sozlesme_url, musteri_temsilcisi,
		        notlar, durum, created_at
		 FROM customers WHERE tenant_id = $1 ORDER BY id DESC`, tenantID)
	if err != nil {
		slog.Error("repository: failed to list customers", "error", err, "tenant_id", tenantID)
		return nil, fmt.Errorf("failed to list customers: %w", err)
	}
	defer rows.Close()

	customers := make([]models.Customer, 0)
	for rows.Next() {
		var c models.Customer
		if err := rows.Scan(&c.ID, &c.TenantID, &c.FirmaUnvani, &c.Yetkili, &c.Telefon,
			&c.Email, &c.Adres, &c.FaturaAdresi, &c.VergiDairesi, &c.VergiNo,
			&c.Kategori, &c.Bakiye, &c.AcikHesapLimiti, &c.RiskSkoru, &c.VadeGun,
			&c.DepoAdresleri, &c.FiyatKatalogu, &c.SozlesmeUrl, &c.MusteriTemsilcisi,
			&c.Notlar, &c.Durum, &c.CreatedAt); err != nil {
			slog.Error("repository: failed to scan customer", "error", err, "tenant_id", tenantID)
			return nil, fmt.Errorf("failed to scan customer: %w", err)
		}
		customers = append(customers, c)
	}
	return customers, nil
}

func (r *Repository) GetCustomerByID(ctx context.Context, id, tenantID int) (*models.Customer, error) {
	var c models.Customer
	err := r.DB.QueryRow(ctx,
		`SELECT id, tenant_id, firma_unvani, yetkili, telefon, email, adres, fatura_adresi,
		        vergi_dairesi, vergi_no, kategori, bakiye, acik_hesap_limiti, risk_skoru,
		        vade_gun, depo_adresleri, fiyat_katalogu, sozlesme_url, musteri_temsilcisi,
		        notlar, durum, created_at
		 FROM customers WHERE id = $1 AND tenant_id = $2`, id, tenantID,
	).Scan(&c.ID, &c.TenantID, &c.FirmaUnvani, &c.Yetkili, &c.Telefon,
		&c.Email, &c.Adres, &c.FaturaAdresi, &c.VergiDairesi, &c.VergiNo,
		&c.Kategori, &c.Bakiye, &c.AcikHesapLimiti, &c.RiskSkoru, &c.VadeGun,
		&c.DepoAdresleri, &c.FiyatKatalogu, &c.SozlesmeUrl, &c.MusteriTemsilcisi,
		&c.Notlar, &c.Durum, &c.CreatedAt)
	if err != nil {
		slog.Error("repository: failed to get customer", "error", err, "id", id, "tenant_id", tenantID)
		return nil, fmt.Errorf("customer not found: %w", err)
	}
	return &c, nil
}

func (r *Repository) CreateCustomer(ctx context.Context, req models.CreateCustomerRequest) (*models.Customer, error) {
	var c models.Customer
	err := r.DB.QueryRow(ctx,
		`INSERT INTO customers (tenant_id, firma_unvani, yetkili, telefon, email, adres,
		                        vergi_dairesi, vergi_no)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING id, tenant_id, firma_unvani, yetkili, telefon, email, adres, fatura_adresi,
		           vergi_dairesi, vergi_no, kategori, bakiye, acik_hesap_limiti, risk_skoru,
		           vade_gun, depo_adresleri, fiyat_katalogu, sozlesme_url, musteri_temsilcisi,
		           notlar, durum, created_at`,
		req.TenantID, req.FirmaUnvani, req.Yetkili, req.Telefon, req.Email,
		req.Adres, req.VergiDairesi, req.VergiNo,
	).Scan(&c.ID, &c.TenantID, &c.FirmaUnvani, &c.Yetkili, &c.Telefon,
		&c.Email, &c.Adres, &c.FaturaAdresi, &c.VergiDairesi, &c.VergiNo,
		&c.Kategori, &c.Bakiye, &c.AcikHesapLimiti, &c.RiskSkoru, &c.VadeGun,
		&c.DepoAdresleri, &c.FiyatKatalogu, &c.SozlesmeUrl, &c.MusteriTemsilcisi,
		&c.Notlar, &c.Durum, &c.CreatedAt)
	if err != nil {
		slog.Error("repository: failed to create customer", "error", err, "tenant_id", req.TenantID)
		return nil, fmt.Errorf("failed to create customer: %w", err)
	}
	return &c, nil
}

func (r *Repository) UpdateCustomer(ctx context.Context, id int, req models.UpdateCustomerRequest, tenantID int) (*models.Customer, error) {
	var c models.Customer
	now := time.Now()
	err := r.DB.QueryRow(ctx,
		`UPDATE customers SET firma_unvani = $1, yetkili = $2, telefon = $3, email = $4,
		                      adres = $5, vergi_dairesi = $6, vergi_no = $7, durum = $8, updated_at = $9
		 WHERE id = $10 AND tenant_id = $11
		 RETURNING id, tenant_id, firma_unvani, yetkili, telefon, email, adres, fatura_adresi,
		           vergi_dairesi, vergi_no, kategori, bakiye, acik_hesap_limiti, risk_skoru,
		           vade_gun, depo_adresleri, fiyat_katalogu, sozlesme_url, musteri_temsilcisi,
		           notlar, durum, created_at`,
		req.FirmaUnvani, req.Yetkili, req.Telefon, req.Email,
		req.Adres, req.VergiDairesi, req.VergiNo, req.Durum, now,
		id, tenantID,
	).Scan(&c.ID, &c.TenantID, &c.FirmaUnvani, &c.Yetkili, &c.Telefon,
		&c.Email, &c.Adres, &c.FaturaAdresi, &c.VergiDairesi, &c.VergiNo,
		&c.Kategori, &c.Bakiye, &c.AcikHesapLimiti, &c.RiskSkoru, &c.VadeGun,
		&c.DepoAdresleri, &c.FiyatKatalogu, &c.SozlesmeUrl, &c.MusteriTemsilcisi,
		&c.Notlar, &c.Durum, &c.CreatedAt)
	if err != nil {
		slog.Error("repository: failed to update customer", "error", err, "id", id, "tenant_id", tenantID)
		return nil, fmt.Errorf("failed to update customer: %w", err)
	}
	return &c, nil
}

// ============================================================
// Invoices
// ============================================================

func (r *Repository) ListInvoices(ctx context.Context, tenantID int) ([]models.Invoice, error) {
	rows, err := r.DB.Query(ctx,
		`SELECT id, tenant_id, customer_id, trip_id, tip, iade_fatura_id, musteri, fatura_no,
		        tarih, vade, para_birimi, kur, ara_toplam, iskonto_tutar, iskonto_oran,
		        kdv, kdv_oran, tevkifat, genel_toplam, toplam_odenen, kalan, durum,
		        odeme_durumu, odeme_yontemi, ebelge_tip, ebelge_durum, ebelge_uuid,
		        ebelge_ettn, ebelge_yanit, odeme_tarihi, notlar, created_at, updated_at
		 FROM invoices WHERE tenant_id = $1 ORDER BY id DESC`, tenantID)
	if err != nil {
		slog.Error("repository: failed to list invoices", "error", err, "tenant_id", tenantID)
		return nil, fmt.Errorf("failed to list invoices: %w", err)
	}
	defer rows.Close()

	invoices := make([]models.Invoice, 0)
	for rows.Next() {
		var inv models.Invoice
		if err := rows.Scan(&inv.ID, &inv.TenantID, &inv.CustomerID, &inv.TripID, &inv.Tip,
			&inv.IadeFaturaID, &inv.Musteri, &inv.FaturaNo, &inv.Tarih, &inv.Vade,
			&inv.ParaBirimi, &inv.Kur, &inv.AraToplam, &inv.IskontoTutar, &inv.IskontoOran,
			&inv.Kdv, &inv.KdvOran, &inv.Tevkifat, &inv.GenelToplam, &inv.ToplamOdenen,
			&inv.Kalan, &inv.Durum, &inv.OdemeDurumu, &inv.OdemeYontemi, &inv.EbelgeTip,
			&inv.EbelgeDurum, &inv.EbelgeUUID, &inv.EbelgeEttn, &inv.EbelgeYanit,
			&inv.OdemeTarihi, &inv.Notlar, &inv.CreatedAt, &inv.UpdatedAt); err != nil {
			slog.Error("repository: failed to scan invoice", "error", err, "tenant_id", tenantID)
			return nil, fmt.Errorf("failed to scan invoice: %w", err)
		}
		invoices = append(invoices, inv)
	}
	return invoices, nil
}

func (r *Repository) GetInvoiceByID(ctx context.Context, id, tenantID int) (*models.Invoice, error) {
	var inv models.Invoice
	err := r.DB.QueryRow(ctx,
		`SELECT id, tenant_id, customer_id, trip_id, tip, iade_fatura_id, musteri, fatura_no,
		        tarih, vade, para_birimi, kur, ara_toplam, iskonto_tutar, iskonto_oran,
		        kdv, kdv_oran, tevkifat, genel_toplam, toplam_odenen, kalan, durum,
		        odeme_durumu, odeme_yontemi, ebelge_tip, ebelge_durum, ebelge_uuid,
		        ebelge_ettn, ebelge_yanit, odeme_tarihi, notlar, created_at, updated_at
		 FROM invoices WHERE id = $1 AND tenant_id = $2`, id, tenantID,
	).Scan(&inv.ID, &inv.TenantID, &inv.CustomerID, &inv.TripID, &inv.Tip,
		&inv.IadeFaturaID, &inv.Musteri, &inv.FaturaNo, &inv.Tarih, &inv.Vade,
		&inv.ParaBirimi, &inv.Kur, &inv.AraToplam, &inv.IskontoTutar, &inv.IskontoOran,
		&inv.Kdv, &inv.KdvOran, &inv.Tevkifat, &inv.GenelToplam, &inv.ToplamOdenen,
		&inv.Kalan, &inv.Durum, &inv.OdemeDurumu, &inv.OdemeYontemi, &inv.EbelgeTip,
		&inv.EbelgeDurum, &inv.EbelgeUUID, &inv.EbelgeEttn, &inv.EbelgeYanit,
		&inv.OdemeTarihi, &inv.Notlar, &inv.CreatedAt, &inv.UpdatedAt)
	if err != nil {
		slog.Error("repository: failed to get invoice", "error", err, "id", id, "tenant_id", tenantID)
		return nil, fmt.Errorf("invoice not found: %w", err)
	}
	return &inv, nil
}

func (r *Repository) CreateInvoice(ctx context.Context, req models.CreateInvoiceRequest) (*models.Invoice, error) {
	var inv models.Invoice
	err := r.DB.QueryRow(ctx,
		`INSERT INTO invoices (tenant_id, customer_id, musteri, fatura_no, tarih, vade,
		                       ara_toplam, kdv, genel_toplam, notlar)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		 RETURNING id, tenant_id, customer_id, trip_id, tip, iade_fatura_id, musteri, fatura_no,
		           tarih, vade, para_birimi, kur, ara_toplam, iskonto_tutar, iskonto_oran,
		           kdv, kdv_oran, tevkifat, genel_toplam, toplam_odenen, kalan, durum,
		           odeme_durumu, odeme_yontemi, ebelge_tip, ebelge_durum, ebelge_uuid,
		           ebelge_ettn, ebelge_yanit, odeme_tarihi, notlar, created_at, updated_at`,
		req.TenantID, req.CustomerID, req.Musteri, req.FaturaNo, req.Tarih, req.Vade,
		req.Tutar, req.Kdv, req.GenelToplam, req.Notlar,
	).Scan(&inv.ID, &inv.TenantID, &inv.CustomerID, &inv.TripID, &inv.Tip,
		&inv.IadeFaturaID, &inv.Musteri, &inv.FaturaNo, &inv.Tarih, &inv.Vade,
		&inv.ParaBirimi, &inv.Kur, &inv.AraToplam, &inv.IskontoTutar, &inv.IskontoOran,
		&inv.Kdv, &inv.KdvOran, &inv.Tevkifat, &inv.GenelToplam, &inv.ToplamOdenen,
		&inv.Kalan, &inv.Durum, &inv.OdemeDurumu, &inv.OdemeYontemi, &inv.EbelgeTip,
		&inv.EbelgeDurum, &inv.EbelgeUUID, &inv.EbelgeEttn, &inv.EbelgeYanit,
		&inv.OdemeTarihi, &inv.Notlar, &inv.CreatedAt, &inv.UpdatedAt)
	if err != nil {
		slog.Error("repository: failed to create invoice", "error", err, "tenant_id", req.TenantID)
		return nil, fmt.Errorf("failed to create invoice: %w", err)
	}
	return &inv, nil
}

func (r *Repository) UpdateInvoice(ctx context.Context, id int, req models.UpdateInvoiceRequest, tenantID int) (*models.Invoice, error) {
	var inv models.Invoice
	now := time.Now()
	err := r.DB.QueryRow(ctx,
		`UPDATE invoices SET musteri = $1, tarih = $2, vade = $3, ara_toplam = $4, kdv = $5,
		                     genel_toplam = $6, durum = $7, notlar = $8, updated_at = $9
		 WHERE id = $10 AND tenant_id = $11
		 RETURNING id, tenant_id, customer_id, trip_id, tip, iade_fatura_id, musteri, fatura_no,
		           tarih, vade, para_birimi, kur, ara_toplam, iskonto_tutar, iskonto_oran,
		           kdv, kdv_oran, tevkifat, genel_toplam, toplam_odenen, kalan, durum,
		           odeme_durumu, odeme_yontemi, ebelge_tip, ebelge_durum, ebelge_uuid,
		           ebelge_ettn, ebelge_yanit, odeme_tarihi, notlar, created_at, updated_at`,
		req.Musteri, req.Tarih, req.Vade, req.Tutar, req.Kdv,
		req.GenelToplam, req.Durum, req.Notlar, now,
		id, tenantID,
	).Scan(&inv.ID, &inv.TenantID, &inv.CustomerID, &inv.TripID, &inv.Tip,
		&inv.IadeFaturaID, &inv.Musteri, &inv.FaturaNo, &inv.Tarih, &inv.Vade,
		&inv.ParaBirimi, &inv.Kur, &inv.AraToplam, &inv.IskontoTutar, &inv.IskontoOran,
		&inv.Kdv, &inv.KdvOran, &inv.Tevkifat, &inv.GenelToplam, &inv.ToplamOdenen,
		&inv.Kalan, &inv.Durum, &inv.OdemeDurumu, &inv.OdemeYontemi, &inv.EbelgeTip,
		&inv.EbelgeDurum, &inv.EbelgeUUID, &inv.EbelgeEttn, &inv.EbelgeYanit,
		&inv.OdemeTarihi, &inv.Notlar, &inv.CreatedAt, &inv.UpdatedAt)
	if err != nil {
		slog.Error("repository: failed to update invoice", "error", err, "id", id, "tenant_id", tenantID)
		return nil, fmt.Errorf("failed to update invoice: %w", err)
	}
	return &inv, nil
}

// ============================================================
// Expenses
// ============================================================

func (r *Repository) ListExpenses(ctx context.Context, tenantID int) ([]models.Expense, error) {
	rows, err := r.DB.Query(ctx,
		`SELECT id, tenant_id, truck_id, kategori, tarih, tutar, aciklama, plaka,
		        fatura_no, odeme_durumu, created_at, updated_at
		 FROM expenses WHERE tenant_id = $1 ORDER BY id DESC`, tenantID)
	if err != nil {
		slog.Error("repository: failed to list expenses", "error", err, "tenant_id", tenantID)
		return nil, fmt.Errorf("failed to list expenses: %w", err)
	}
	defer rows.Close()

	expenses := make([]models.Expense, 0)
	for rows.Next() {
		var e models.Expense
		if err := rows.Scan(&e.ID, &e.TenantID, &e.TruckID, &e.Kategori, &e.Tarih,
			&e.Tutar, &e.Aciklama, &e.Plaka, &e.FaturaNo, &e.OdemeDurumu,
			&e.CreatedAt, &e.UpdatedAt); err != nil {
			slog.Error("repository: failed to scan expense", "error", err, "tenant_id", tenantID)
			return nil, fmt.Errorf("failed to scan expense: %w", err)
		}
		expenses = append(expenses, e)
	}
	return expenses, nil
}

func (r *Repository) GetExpenseByID(ctx context.Context, id, tenantID int) (*models.Expense, error) {
	var e models.Expense
	err := r.DB.QueryRow(ctx,
		`SELECT id, tenant_id, truck_id, kategori, tarih, tutar, aciklama, plaka,
		        fatura_no, odeme_durumu, created_at, updated_at
		 FROM expenses WHERE id = $1 AND tenant_id = $2`, id, tenantID,
	).Scan(&e.ID, &e.TenantID, &e.TruckID, &e.Kategori, &e.Tarih,
		&e.Tutar, &e.Aciklama, &e.Plaka, &e.FaturaNo, &e.OdemeDurumu,
		&e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		slog.Error("repository: failed to get expense", "error", err, "id", id, "tenant_id", tenantID)
		return nil, fmt.Errorf("expense not found: %w", err)
	}
	return &e, nil
}

func (r *Repository) CreateExpense(ctx context.Context, req models.CreateExpenseRequest) (*models.Expense, error) {
	var e models.Expense
	err := r.DB.QueryRow(ctx,
		`INSERT INTO expenses (tenant_id, truck_id, kategori, tarih, tutar, aciklama, plaka, fatura_no)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING id, tenant_id, truck_id, kategori, tarih, tutar, aciklama, plaka,
		           fatura_no, odeme_durumu, created_at, updated_at`,
		req.TenantID, req.TruckID, req.Kategori, req.Tarih, req.Tutar,
		req.Aciklama, req.Plaka, req.FaturaNo,
	).Scan(&e.ID, &e.TenantID, &e.TruckID, &e.Kategori, &e.Tarih,
		&e.Tutar, &e.Aciklama, &e.Plaka, &e.FaturaNo, &e.OdemeDurumu,
		&e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		slog.Error("repository: failed to create expense", "error", err, "tenant_id", req.TenantID)
		return nil, fmt.Errorf("failed to create expense: %w", err)
	}
	return &e, nil
}

// ============================================================
// Employees
// ============================================================

func (r *Repository) ListEmployees(ctx context.Context, tenantID int) ([]models.Employee, error) {
	rows, err := r.DB.Query(ctx,
		`SELECT id, tenant_id, ad_soyad, rol, telefon, ehliyet_bitis, src_bitis, created_at
		 FROM employees WHERE tenant_id = $1 ORDER BY id DESC`, tenantID)
	if err != nil {
		slog.Error("repository: failed to list employees", "error", err, "tenant_id", tenantID)
		return nil, fmt.Errorf("failed to list employees: %w", err)
	}
	defer rows.Close()

	employees := make([]models.Employee, 0)
	for rows.Next() {
		var e models.Employee
		if err := rows.Scan(&e.ID, &e.TenantID, &e.AdSoyad, &e.Rol, &e.Telefon,
			&e.EhliyetBitis, &e.SrcBitis, &e.CreatedAt); err != nil {
			slog.Error("repository: failed to scan employee", "error", err, "tenant_id", tenantID)
			return nil, fmt.Errorf("failed to scan employee: %w", err)
		}
		employees = append(employees, e)
	}
	return employees, nil
}

func (r *Repository) GetEmployeeByID(ctx context.Context, id, tenantID int) (*models.Employee, error) {
	var e models.Employee
	err := r.DB.QueryRow(ctx,
		`SELECT id, tenant_id, ad_soyad, rol, telefon, ehliyet_bitis, src_bitis, created_at
		 FROM employees WHERE id = $1 AND tenant_id = $2`, id, tenantID,
	).Scan(&e.ID, &e.TenantID, &e.AdSoyad, &e.Rol, &e.Telefon,
		&e.EhliyetBitis, &e.SrcBitis, &e.CreatedAt)
	if err != nil {
		slog.Error("repository: failed to get employee", "error", err, "id", id, "tenant_id", tenantID)
		return nil, fmt.Errorf("employee not found: %w", err)
	}
	return &e, nil
}

func (r *Repository) CreateEmployee(ctx context.Context, req models.CreateEmployeeRequest) (*models.Employee, error) {
	var e models.Employee
	err := r.DB.QueryRow(ctx,
		`INSERT INTO employees (tenant_id, user_id, ad_soyad, rol, telefon, ehliyet_bitis, src_bitis)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, tenant_id, ad_soyad, rol, telefon, ehliyet_bitis, src_bitis, created_at`,
		req.TenantID, req.UserID, req.AdSoyad, req.Rol, req.Telefon,
		req.EhliyetBitis, req.SrcBitis,
	).Scan(&e.ID, &e.TenantID, &e.AdSoyad, &e.Rol, &e.Telefon,
		&e.EhliyetBitis, &e.SrcBitis, &e.CreatedAt)
	if err != nil {
		slog.Error("repository: failed to create employee", "error", err, "tenant_id", req.TenantID)
		return nil, fmt.Errorf("failed to create employee: %w", err)
	}
	return &e, nil
}

func (r *Repository) CountUsers(ctx context.Context, tenantID int) (int, error) {
	var count int
	err := r.DB.QueryRow(ctx,
		`SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND aktif = true`, tenantID).Scan(&count)
	if err != nil {
		slog.Error("repository: failed to count users", "error", err, "tenant_id", tenantID)
		return 0, fmt.Errorf("failed to count users: %w", err)
	}
	return count, nil
}

func (r *Repository) GetTenantPlan(ctx context.Context, tenantID int) (string, error) {
	var plan string
	err := r.DB.QueryRow(ctx,
		`SELECT plan FROM subscriptions WHERE tenant_id = $1`, tenantID).Scan(&plan)
	if err != nil {
		slog.Error("repository: failed to get tenant plan", "error", err, "tenant_id", tenantID)
		return "FREE", nil
	}
	return plan, nil
}

// ============================================================
// Dashboard
// ============================================================

func (r *Repository) GetDashboardSummary(ctx context.Context, tenantID int) (*models.DashboardSummary, error) {
	summary := &models.DashboardSummary{}

	r.DB.QueryRow(ctx,
		`SELECT COUNT(*) FROM trucks WHERE tenant_id = $1 AND aktif = true`, tenantID,
	).Scan(&summary.AktifKamyon)

	r.DB.QueryRow(ctx,
		`SELECT COALESCE(SUM(genel_toplam), 0) FROM invoices
		 WHERE tenant_id = $1 AND tarih = CURRENT_DATE::text`, tenantID,
	).Scan(&summary.BugunkuKazanc)

	r.DB.QueryRow(ctx,
		`SELECT COALESCE(SUM(genel_toplam), 0) - COALESCE((SELECT SUM(tutar) FROM expenses
		   WHERE tenant_id = $1 AND tarih >= date_trunc('month', CURRENT_DATE)::text), 0)
		 FROM invoices WHERE tenant_id = $1
		 AND tarih >= date_trunc('month', CURRENT_DATE)::text`, tenantID,
	).Scan(&summary.BuAyKar)

	r.DB.QueryRow(ctx,
		`SELECT COALESCE(SUM(kalan), 0) FROM invoices
		 WHERE tenant_id = $1 AND odeme_durumu != 'odendi'`, tenantID,
	).Scan(&summary.BekleyenTahsilat)

	rows, err := r.DB.Query(ctx,
		`SELECT TO_CHAR(DATE_TRUNC('month', tarih::date), 'YYYY-MM') AS ay,
		        COALESCE(SUM(CASE WHEN tip = 'gelir' OR ara_toplam >= 0 THEN genel_toplam ELSE 0 END), 0),
		        COALESCE(SUM(CASE WHEN tip = 'gider' OR ara_toplam < 0 THEN ABS(genel_toplam) ELSE 0 END), 0)
		 FROM invoices WHERE tenant_id = $1 AND tarih >= (CURRENT_DATE - INTERVAL '12 months')::text
		 GROUP BY DATE_TRUNC('month', tarih::date)
		 ORDER BY ay`, tenantID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var mr models.MonthlyRevenue
			if err := rows.Scan(&mr.Ay, &mr.Gelir, &mr.Gider); err == nil {
				summary.AylikGelir = append(summary.AylikGelir, mr)
			}
		}
	}

	summary.SonAktiviteler = make([]models.Action, 0)

	return summary, nil
}
