package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/middleware"
)

type LoadBoardHandler struct {
	DB *pgxpool.Pool
}

type LoadBoardResponse struct {
	ID           int     `json:"id"`
	TenantID     int     `json:"tenant_id"`
	UserID       int     `json:"user_id"`
	Type         string  `json:"type"`
	FromCity     string  `json:"from_city"`
	FromDistrict string  `json:"from_district"`
	ToCity       string  `json:"to_city"`
	ToDistrict   string  `json:"to_district"`
	LoadDate     string  `json:"load_date"`
	WeightKg     *int    `json:"weight_kg"`
	VehicleType  *string `json:"vehicle_type"`
	Price        *int    `json:"price"`
	Description  *string `json:"description"`
	Status       string  `json:"status"`
	ContactPhone *string `json:"contact_phone"`
	ContactEmail string  `json:"contact_email"`
	CompanyName  string  `json:"company_name"`
	CreatedAt    string  `json:"created_at"`
}

func (h *LoadBoardHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Use(middleware.RequireTenant)
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	return r
}

func (h *LoadBoardHandler) List(w http.ResponseWriter, r *http.Request) {
	ttype := r.URL.Query().Get("type")
	city := r.URL.Query().Get("city")
	search := r.URL.Query().Get("search")

	query := `SELECT lb.id, lb.tenant_id, lb.user_id, lb.type, lb.from_city, COALESCE(lb.from_district,''),
		lb.to_city, COALESCE(lb.to_district,''), lb.load_date, lb.weight_kg, lb.vehicle_type, lb.price,
		lb.description, lb.status, lb.contact_phone, COALESCE(u.email,''), COALESCE(t.firma_unvani,''), lb.created_at
		FROM load_board lb
		JOIN users u ON u.id = lb.user_id
		JOIN tenants t ON t.id = lb.tenant_id
		WHERE lb.status = 'AKTIF'`
	args := []interface{}{}
	argN := 1

	if ttype != "" {
		query += ` AND lb.type = $` + itoa(argN)
		args = append(args, strings.ToUpper(ttype))
		argN++
	}
	if city != "" {
		query += ` AND (lb.from_city ILIKE $` + itoa(argN) + ` OR lb.to_city ILIKE $` + itoa(argN) + `)`
		args = append(args, "%"+city+"%")
		argN++
	}
	if search != "" {
		query += ` AND (lb.from_city ILIKE $` + itoa(argN) + ` OR lb.to_city ILIKE $` + itoa(argN) + ` OR lb.description ILIKE $` + itoa(argN) + ` OR t.firma_unvani ILIKE $` + itoa(argN) + `)`
		args = append(args, "%"+search+"%")
		argN++
	}
	query += ` ORDER BY lb.created_at DESC LIMIT 500`

	rows, err := h.DB.Query(r.Context(), query, args...)
	if err != nil {
		slog.Error("failed to list load board", "error", err)
		writeError(w, http.StatusInternalServerError, "Yük panosu yüklenemedi")
		return
	}
	defer rows.Close()

	loads := make([]LoadBoardResponse, 0)
	for rows.Next() {
		var lb LoadBoardResponse
		var loadDate time.Time
		var createdAt time.Time
		if err := rows.Scan(&lb.ID, &lb.TenantID, &lb.UserID, &lb.Type, &lb.FromCity, &lb.FromDistrict,
			&lb.ToCity, &lb.ToDistrict, &loadDate, &lb.WeightKg, &lb.VehicleType, &lb.Price,
			&lb.Description, &lb.Status, &lb.ContactPhone, &lb.ContactEmail, &lb.CompanyName, &createdAt); err != nil {
			slog.Error("failed to scan load board", "error", err)
			continue
		}
		lb.LoadDate = loadDate.Format("2006-01-02")
		lb.CreatedAt = createdAt.Format(time.RFC3339)
		loads = append(loads, lb)
	}
	writeJSON(w, http.StatusOK, loads)
}

func (h *LoadBoardHandler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())

	var req struct {
		Type         string `json:"type"`
		FromCity     string `json:"from_city"`
		FromDistrict string `json:"from_district"`
		ToCity       string `json:"to_city"`
		ToDistrict   string `json:"to_district"`
		LoadDate     string `json:"load_date"`
		WeightKg     int    `json:"weight_kg"`
		VehicleType  string `json:"vehicle_type"`
		Price        int    `json:"price"`
		Description  string `json:"description"`
		ContactPhone string `json:"contact_phone"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Geçersiz istek")
		return
	}
	if req.Type == "" || req.FromCity == "" || req.ToCity == "" || req.LoadDate == "" {
		writeError(w, http.StatusBadRequest, "Tür, kalkış şehri, varış şehri ve tarih zorunludur")
		return
	}
	req.Type = strings.ToUpper(req.Type)

	uid, _ := strconv.Atoi(userID)

	var lb LoadBoardResponse
	var loadDate, createdAt time.Time
	err := h.DB.QueryRow(r.Context(),
		`INSERT INTO load_board (tenant_id, user_id, type, from_city, from_district, to_city, to_district, load_date, weight_kg, vehicle_type, price, description, contact_phone)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8::date,$9,$10,$11,$12,$13)
		 RETURNING id, tenant_id, user_id, type, from_city, COALESCE(from_district,''), to_city, COALESCE(to_district,''), load_date, weight_kg, vehicle_type, price, description, status, contact_phone, created_at`,
		tenantID, uid, req.Type, req.FromCity, req.FromDistrict, req.ToCity, req.ToDistrict, req.LoadDate,
		nullInt(req.WeightKg), nullString(req.VehicleType), nullInt(req.Price),
		nullString(req.Description), nullString(req.ContactPhone),
	).Scan(&lb.ID, &lb.TenantID, &lb.UserID, &lb.Type, &lb.FromCity, &lb.FromDistrict,
		&lb.ToCity, &lb.ToDistrict, &loadDate, &lb.WeightKg, &lb.VehicleType, &lb.Price,
		&lb.Description, &lb.Status, &lb.ContactPhone, &createdAt)
	if err != nil {
		slog.Error("failed to create load board", "error", err)
		writeError(w, http.StatusInternalServerError, "Kayıt oluşturulamadı")
		return
	}
	lb.LoadDate = loadDate.Format("2006-01-02")
	lb.CreatedAt = createdAt.Format(time.RFC3339)

	// Fetch user info for response
	_ = h.DB.QueryRow(r.Context(), `SELECT COALESCE(email,''), COALESCE(firma_unvani,'') FROM users u JOIN tenants t ON t.id=u.tenant_id WHERE u.id=$1`, uid).Scan(&lb.ContactEmail, &lb.CompanyName)

	writeJSON(w, http.StatusCreated, lb)
}

func (h *LoadBoardHandler) Update(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))

	var req struct {
		Status       string `json:"status"`
		Description  string `json:"description"`
		ContactPhone string `json:"contact_phone"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	if req.Status != "" {
		_, err := h.DB.Exec(r.Context(),
			`UPDATE load_board SET status=$1 WHERE id=$2 AND tenant_id=$3`,
			req.Status, id, tenantID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Güncelleme başarısız")
			return
		}
	}

	if req.Description != "" || req.ContactPhone != "" {
		_, _ = h.DB.Exec(r.Context(),
			`UPDATE load_board SET description=COALESCE(NULLIF($1,''),description), contact_phone=COALESCE(NULLIF($2,''),contact_phone) WHERE id=$3 AND tenant_id=$4`,
			req.Description, req.ContactPhone, id, tenantID)
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

func (h *LoadBoardHandler) Delete(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))

	result, err := h.DB.Exec(r.Context(),
		`UPDATE load_board SET status='IPAL' WHERE id=$1 AND tenant_id=$2`, id, tenantID)
	if err != nil || result.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "Kayıt bulunamadı")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

var (
	turkishCities = map[string][]string{
		"Adana":      {"Seyhan", "Yüreğir", "Çukurova", "Sarıçam", "Karaisalı"},
		"Adıyaman":   {"Merkez", "Besni", "Gölbaşı", "Kahta"},
		"Afyon":      {"Merkez", "Sandıklı", "Dinar", "Bolvadin", "Emirdağ"},
		"Ağrı":       {"Merkez", "Doğubayazıt", "Patnos"},
		"Amasya":     {"Merkez", "Merzifon", "Suluova"},
		"Ankara":     {"Çankaya", "Keçiören", "Yenimahalle", "Mamak", "Altındağ", "Etimesgut", "Sincan", "Pursaklar", "Gölbaşı", "Polatlı"},
		"Antalya":    {"Muratpaşa", "Kepez", "Konyaaltı", "Alanya", "Manavgat", "Serik", "Kemer"},
		"Artvin":     {"Merkez", "Hopa", "Arhavi"},
		"Aydın":      {"Efeler", "Nazilli", "Kuşadası", "Söke", "Didim"},
		"Balıkesir":  {"Altıeylül", "Karesi", "Bandırma", "Edremit", "Ayvalık", "Burhaniye"},
		"Bilecik":    {"Merkez", "Bozüyük", "Osmaneli"},
		"Bingöl":     {"Merkez", "Genç"},
		"Bitlis":     {"Merkez", "Tatvan", "Ahlat"},
		"Bolu":       {"Merkez", "Gerede", "Mengen"},
		"Burdur":     {"Merkez", "Bucak"},
		"Bursa":      {"Osmangazi", "Yıldırım", "Nilüfer", "İnegöl", "Gemlik", "Mudanya", "Mustafakemalpaşa", "Karacabey", "Orhangazi", "Kestel", "Gürsu"},
		"Çanakkale":  {"Merkez", "Biga", "Gelibolu", "Ezine"},
		"Çankırı":    {"Merkez", "Çerkeş"},
		"Çorum":      {"Merkez", "Sungurlu", "Osmancık"},
		"Denizli":    {"Merkezefendi", "Pamukkale", "Çivril", "Sarayköy", "Buldan"},
		"Diyarbakır": {"Kayapınar", "Bağlar", "Yenişehir", "Sur", "Bismil", "Ergani"},
		"Edirne":     {"Merkez", "Keşan", "Uzunköprü"},
		"Elazığ":     {"Merkez", "Keban"},
		"Erzincan":   {"Merkez", "Tercan"},
		"Erzurum":    {"Yakutiye", "Palandöken", "Aziziye", "Oltu", "Horasan"},
		"Eskişehir":  {"Odunpazarı", "Tepebaşı", "Sivrihisar"},
		"Gaziantep":  {"Şahinbey", "Şehitkamil", "Nizip", "İslahiye", "Nurdağı"},
		"Giresun":    {"Merkez", "Bulancak", "Tirebolu"},
		"Gümüşhane":  {"Merkez", "Kelkit"},
		"Hakkari":    {"Merkez", "Yüksekova"},
		"Hatay":      {"Antakya", "İskenderun", "Dörtyol", "Samandağ", "Kırıkhan", "Reyhanlı"},
		"Isparta":    {"Merkez", "Yalvaç", "Eğirdir"},
		"Mersin":     {"Akdeniz", "Mezitli", "Toroslar", "Yenişehir", "Tarsus", "Silifke", "Erdemli"},
		"İstanbul":   {"Kadıköy", "Beşiktaş", "Şişli", "Üsküdar", "Pendik", "Kartal", "Maltepe", "Ataşehir", "Beylikdüzü", "Esenyurt", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Fatih", "Zeytinburnu", "Sultanbeyli", "Sancaktepe", "Ümraniye", "Beykoz", "Tuzla", "Silivri", "Çatalca", "Arnavutköy", "Başakşehir", "Sarıyer", "Eyüpsultan", "Kağıthane", "Gaziosmanpaşa", "Sultangazi"},
		"İzmir":     {"Konak", "Karşıyaka", "Bornova", "Buca", "Çiğli", "Gaziemir", "Karabağlar", "Balçova", "Narlıdere", "Güzelbahçe", "Urla", "Seferihisar", "Menemen", "Torbalı", "Aliağa", "Bergama", "Ödemiş", "Tire", "Selçuk", "Çeşme"},
		"Kars":       {"Merkez", "Sarıkamış"},
		"Kastamonu":  {"Merkez", "Tosya", "Taşköprü"},
		"Kayseri":    {"Melikgazi", "Kocasinan", "Talas", "Develi", "Yahyalı"},
		"Kırklareli": {"Merkez", "Lüleburgaz", "Babaeski"},
		"Kırşehir":   {"Merkez", "Kaman"},
		"Kocaeli":    {"İzmit", "Gebze", "Darıca", "Gölcük", "Körfez", "Kartepe", "Başiskele", "Dilovası", "Çayırova"},
		"Konya":      {"Selçuklu", "Meram", "Karatay", "Ereğli", "Akşehir", "Beyşehir", "Çumra"},
		"Kütahya":    {"Merkez", "Tavşanlı", "Simav", "Gediz"},
		"Malatya":    {"Battalgazi", "Yeşilyurt", "Doğanşehir"},
		"Manisa":     {"Şehzadeler", "Yunusemre", "Akhisar", "Salihli", "Turgutlu", "Soma"},
		"Kahramanmaraş": {"Dulkadiroğlu", "Onikişubat", "Elbistan", "Afşin"},
		"Mardin":     {"Artuklu", "Kızıltepe", "Nusaybin", "Midyat"},
		"Muğla":      {"Menteşe", "Bodrum", "Fethiye", "Marmaris", "Milas", "Datça", "Köyceğiz"},
		"Muş":        {"Merkez", "Bulanık"},
		"Nevşehir":   {"Merkez", "Ürgüp", "Avanos"},
		"Niğde":      {"Merkez", "Bor"},
		"Ordu":       {"Altınordu", "Fatsa", "Ünye"},
		"Rize":       {"Merkez", "Çayeli"},
		"Sakarya":    {"Adapazarı", "Serdivan", "Hendek", "Akyazı", "Karasu", "Ferizli"},
		"Samsun":     {"İlkadım", "Atakum", "Canik", "Bafra", "Çarşamba", "Tekkeköy", "Vezirköprü"},
		"Siirt":      {"Merkez", "Kurtalan"},
		"Sinop":      {"Merkez", "Boyabat"},
		"Sivas":      {"Merkez", "Zara", "Suşehri"},
		"Tekirdağ":   {"Süleymanpaşa", "Çorlu", "Çerkezköy", "Kapaklı", "Malkara", "Saray"},
		"Tokat":      {"Merkez", "Turhal", "Zile", "Niksar"},
		"Trabzon":    {"Ortahisar", "Akçaabat", "Vakfıkebir", "Beşikdüzü"},
		"Tunceli":    {"Merkez", "Ovacık"},
		"Şanlıurfa":  {"Haliliye", "Eyyübiye", "Karaköprü", "Siverek", "Viranşehir", "Suruç", "Akçakale"},
		"Uşak":       {"Merkez", "Banaz"},
		"Van":        {"İpekyolu", "Tuşba", "Edremit", "Erciş", "Özalp"},
		"Yozgat":     {"Merkez", "Sorgun", "Boğazlıyan"},
		"Zonguldak":  {"Merkez", "Ereğli", "Çaycuma"},
		"Aksaray":    {"Merkez", "Ortaköy"},
		"Bayburt":    {"Merkez"},
		"Karaman":    {"Merkez", "Ermenek"},
		"Kırıkkale":  {"Merkez", "Keskin", "Yahşihan"},
		"Batman":     {"Merkez", "Kozluk"},
		"Şırnak":     {"Merkez", "Cizre", "Silopi"},
		"Bartın":     {"Merkez"},
		"Ardahan":    {"Merkez"},
		"Iğdır":      {"Merkez"},
		"Yalova":     {"Merkez", "Çiftlikköy"},
		"Karabük":    {"Merkez", "Safranbolu"},
		"Kilis":      {"Merkez"},
		"Osmaniye":   {"Merkez", "Kadirli", "Düziçi"},
		"Düzce":      {"Merkez", "Akçakoca"},
	}
)

func (h *LoadBoardHandler) GetCities(w http.ResponseWriter, r *http.Request) {
	cities := make([]map[string]interface{}, 0, len(turkishCities))
	for city, districts := range turkishCities {
		cities = append(cities, map[string]interface{}{
			"name":      city,
			"districts": districts,
		})
	}
	writeJSON(w, http.StatusOK, cities)
}

func nullInt(v int) interface{} {
	if v == 0 {
		return nil
	}
	return v
}

func nullFloat(v float64) interface{} {
	if v == 0 {
		return nil
	}
	return v
}

func nullString(v string) interface{} {
	if v == "" {
		return nil
	}
	return v
}
