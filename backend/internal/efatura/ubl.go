package efatura

import (
	"encoding/xml"
	"fmt"
	"time"
)

// ============================================================
// UBL-TR 2.1 e-Fatura / e-Arsiv XML Generator
// Turkish Revenue Administration (GİB) compliant
// ============================================================

// InvoiceData represents all data needed for an e-Fatura
type InvoiceData struct {
	UUID            string
	FaturaNo        string
	FaturaTarihi    string
	VadeTarihi      string
	ParaBirimi      string
	Kur             float64
	AraToplam       float64
	Kdv             float64
	KdvOran         float64
	Tevkifat        float64
	GenelToplam     float64
	OdemeYontemi    string
	Notlar          string

	// Supplier (sender — the tenant company)
	SupplierVKN     string // Vergi Kimlik No
	SupplierUnvan   string
	SupplierVergiDairesi string
	SupplierAdres   string
	SupplierTel     string
	SupplierEmail   string
	SupplierWeb     string

	// Customer (receiver)
	CustomerVKN     string
	CustomerUnvan   string
	CustomerVergiDairesi string
	CustomerAdres   string
	CustomerTel     string
	CustomerEmail   string

	// Line items
	Items           []InvoiceLine

	// e-Fatura specific
	Senaryo         string // TEMELFATURA, TICARIFATURA, IHRACAT
	FaturaTipi      string // SATIS, IADE
	EbelgeTip       string // E_FATURA, E_ARSIV
	ProfileID       string // TEMELFATURA, TICARIFATURA
	DocumentCurrency string
}

type InvoiceLine struct {
	Sira         int
	UrunAdi      string
	Aciklama     string
	Miktar       float64
	Birim        string
	BirimFiyat   float64
	KdvOran      float64
	KdvTutar     float64
	Tutar        float64
	IskontoOran  float64
	IskontoTutar float64
}

// ============================================================
// UBL 2.1 XML Structures
// ============================================================

type InvoiceXML struct {
	XMLName        xml.Name `xml:"Invoice"`
	Xmlns          string   `xml:"xmlns,attr"`
	XmlnsCac       string   `xml:"xmlns:cac,attr"`
	XmlnsCbc       string   `xml:"xmlns:cbc,attr"`
	XmlnsExt       string   `xml:"xmlns:ext,attr"`
	UBLVersionID   string   `xml:"cbc:UBLVersionID"`
	CustomizationID string  `xml:"cbc:CustomizationID"`
	ProfileID      string   `xml:"cbc:ProfileID"`
	ID             string   `xml:"cbc:ID"`
	CopyIndicator  string   `xml:"cbc:CopyIndicator"`
	UUID           string   `xml:"cbc:UUID"`
	IssueDate      string   `xml:"cbc:IssueDate"`
	IssueTime      string   `xml:"cbc:IssueTime"`
	InvoiceTypeCode string  `xml:"cbc:InvoiceTypeCode"`
	Note           []string `xml:"cbc:Note,omitempty"`
	DocumentCurrencyCode string `xml:"cbc:DocumentCurrencyCode"`
	TaxCurrencyCode string  `xml:"cbc:TaxCurrencyCode"`
	LineCountNumeric string `xml:"cbc:LineCountNumeric"`

	// Supplier
	AccountingSupplierParty AccountingParty `xml:"cac:AccountingSupplierParty"`
	// Customer
	AccountingCustomerParty AccountingParty `xml:"cac:AccountingCustomerParty"`
	// Tax
	TaxTotal TaxTotal `xml:"cac:TaxTotal"`
	// Legal monetary total
	LegalMonetaryTotal LegalMonetaryTotal `xml:"cac:LegalMonetaryTotal"`
	// Invoice lines
	InvoiceLine []InvoiceLineXML `xml:"cac:InvoiceLine"`
}

type AccountingParty struct {
	Party Party `xml:"cac:Party"`
}

type Party struct {
	PartyIdentification PartyIdentification `xml:"cac:PartyIdentification"`
	PartyName           PartyName           `xml:"cac:PartyName"`
	PostalAddress       PostalAddress       `xml:"cac:PostalAddress"`
	Contact             *Contact            `xml:"cac:Contact,omitempty"`
}

type PartyIdentification struct {
	ID string `xml:"cbc:ID,attr"`
}

type PartyName struct {
	Name string `xml:"cbc:Name"`
}

type PostalAddress struct {
	StreetName       string `xml:"cbc:StreetName"`
	CitySubdivisionName string `xml:"cbc:CitySubdivisionName,omitempty"`
	CityName         string `xml:"cbc:CityName"`
	Country          string `xml:"cac:Country>cbc:Name"`
}

type Contact struct {
	Telephone      string `xml:"cbc:Telephone,omitempty"`
	ElectronicMail string `xml:"cbc:ElectronicMail,omitempty"`
}

type TaxTotal struct {
	TaxAmount   string     `xml:"cbc:TaxAmount,attr"`
	TaxSubtotal TaxSubtotal `xml:"cac:TaxSubtotal"`
}

type TaxSubtotal struct {
	TaxableAmount string `xml:"cbc:TaxableAmount,attr"`
	TaxAmount     string `xml:"cbc:TaxAmount,attr"`
	Percent       string `xml:"cbc:Percent"`
	TaxCategory   TaxCategory `xml:"cac:TaxCategory"`
}

type TaxCategory struct {
	TaxScheme TaxScheme `xml:"cac:TaxScheme"`
}

type TaxScheme struct {
	Name   string `xml:"cbc:Name"`
	TaxTypeCode string `xml:"cbc:TaxTypeCode"`
}

type LegalMonetaryTotal struct {
	LineExtensionAmount string `xml:"cbc:LineExtensionAmount,attr"`
	TaxExclusiveAmount  string `xml:"cbc:TaxExclusiveAmount,attr"`
	TaxInclusiveAmount  string `xml:"cbc:TaxInclusiveAmount,attr"`
	AllowanceTotalAmount string `xml:"cbc:AllowanceTotalAmount,attr"`
	PayableAmount       string `xml:"cbc:PayableAmount,attr"`
}

type InvoiceLineXML struct {
	ID                    string  `xml:"cbc:ID"`
	InvoicedQuantity      *Quantity `xml:"cbc:InvoicedQuantity,omitempty"`
	LineExtensionAmount   string  `xml:"cbc:LineExtensionAmount,attr"`
	Item                  Item    `xml:"cac:Item"`
	Price                 Price   `xml:"cac:Price"`
	TaxTotal              *LineTaxTotal `xml:"cac:TaxTotal,omitempty"`
}

type Quantity struct {
	Value    string `xml:",chardata"`
	UnitCode string `xml:"unitCode,attr,omitempty"`
}

type Item struct {
	Name        string `xml:"cbc:Name"`
	Description string `xml:"cbc:Description,omitempty"`
}

type Price struct {
	PriceAmount string `xml:"cbc:PriceAmount,attr"`
}

type LineTaxTotal struct {
	TaxAmount  string       `xml:"cbc:TaxAmount,attr"`
	TaxSubtotal TaxSubtotal `xml:"cac:TaxSubtotal"`
}

// ============================================================
// Generate UBL-TR XML
// ============================================================
func GenerateUBLTR(data InvoiceData) ([]byte, error) {
	if data.Senaryo == "" {
		data.Senaryo = "TEMELFATURA"
	}
	if data.ProfileID == "" {
		data.ProfileID = "TEMELFATURA"
	}
	if data.FaturaTipi == "" {
		data.FaturaTipi = "SATIS"
	}
	if data.DocumentCurrency == "" {
		data.DocumentCurrency = "TRY"
	}
	if data.ParaBirimi == "" {
		data.ParaBirimi = "TRY"
	}

	now := time.Now()
	issueDate := data.FaturaTarihi
	if issueDate == "" {
		issueDate = now.Format("2006-01-02")
	}

	invTypeCode := "SATIS"
	if data.FaturaTipi == "IADE" {
		invTypeCode = "IADE"
	}

	invoice := InvoiceXML{
		Xmlns:            "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
		XmlnsCac:         "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
		XmlnsCbc:         "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
		XmlnsExt:         "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
		UBLVersionID:     "2.1",
		CustomizationID:  "TR1.2",
		ProfileID:        data.ProfileID,
		ID:               data.FaturaNo,
		CopyIndicator:    "false",
		UUID:             data.UUID,
		IssueDate:        issueDate,
		IssueTime:        now.Format("15:04:05"),
		InvoiceTypeCode:  invTypeCode,
		DocumentCurrencyCode: data.DocumentCurrency,
		TaxCurrencyCode:  data.ParaBirimi,
		LineCountNumeric: fmt.Sprintf("%d", len(data.Items)),

		AccountingSupplierParty: AccountingParty{
			Party: Party{
				PartyIdentification: PartyIdentification{ID: data.SupplierVKN},
				PartyName:           PartyName{Name: data.SupplierUnvan},
				PostalAddress: PostalAddress{
					StreetName:       data.SupplierAdres,
					CityName:         extractCity(data.SupplierAdres),
					Country:          "Türkiye",
				},
				Contact: &Contact{
					Telephone:      data.SupplierTel,
					ElectronicMail: data.SupplierEmail,
				},
			},
		},

		AccountingCustomerParty: AccountingParty{
			Party: Party{
				PartyIdentification: PartyIdentification{ID: data.CustomerVKN},
				PartyName:           PartyName{Name: data.CustomerUnvan},
				PostalAddress: PostalAddress{
					StreetName:       data.CustomerAdres,
					CityName:         extractCity(data.CustomerAdres),
					Country:          "Türkiye",
				},
				Contact: &Contact{
					Telephone:      data.CustomerTel,
					ElectronicMail: data.CustomerEmail,
				},
			},
		},

		TaxTotal: TaxTotal{
			TaxAmount: fmt.Sprintf("%.2f", data.Kdv),
			TaxSubtotal: TaxSubtotal{
				TaxableAmount: fmt.Sprintf("%.2f", data.AraToplam),
				TaxAmount:     fmt.Sprintf("%.2f", data.Kdv),
				Percent:       fmt.Sprintf("%.0f", data.KdvOran),
				TaxCategory: TaxCategory{
					TaxScheme: TaxScheme{Name: "KDV", TaxTypeCode: "0015"},
				},
			},
		},

		LegalMonetaryTotal: LegalMonetaryTotal{
			LineExtensionAmount:  fmt.Sprintf("%.2f", data.AraToplam),
			TaxExclusiveAmount:   fmt.Sprintf("%.2f", data.AraToplam),
			TaxInclusiveAmount:   fmt.Sprintf("%.2f", data.GenelToplam),
			AllowanceTotalAmount: "0.00",
			PayableAmount:        fmt.Sprintf("%.2f", data.GenelToplam),
		},
	}

	// Build line items
	for _, item := range data.Items {
		unitCode := "C62" // UN/CEFACT unit code for "adet"
		if item.Birim == "kg" {
			unitCode = "KGM"
		} else if item.Birim == "lt" {
			unitCode = "LTR"
		}

		line := InvoiceLineXML{
			ID:                  fmt.Sprintf("%d", item.Sira),
			LineExtensionAmount: fmt.Sprintf("%.2f", item.Tutar),
			Item: Item{
				Name:        item.UrunAdi,
				Description: item.Aciklama,
			},
			Price: Price{
				PriceAmount: fmt.Sprintf("%.2f", item.BirimFiyat),
			},
		}

		if item.Miktar > 0 {
			line.InvoicedQuantity = &Quantity{
				Value:    fmt.Sprintf("%.2f", item.Miktar),
				UnitCode: unitCode,
			}
		}

		if item.KdvOran > 0 {
			line.TaxTotal = &LineTaxTotal{
				TaxAmount: fmt.Sprintf("%.2f", item.KdvTutar),
				TaxSubtotal: TaxSubtotal{
					TaxableAmount: fmt.Sprintf("%.2f", item.Tutar),
					TaxAmount:     fmt.Sprintf("%.2f", item.KdvTutar),
					Percent:       fmt.Sprintf("%.0f", item.KdvOran),
					TaxCategory: TaxCategory{
						TaxScheme: TaxScheme{Name: "KDV", TaxTypeCode: "0015"},
					},
				},
			}
		}

		invoice.InvoiceLine = append(invoice.InvoiceLine, line)
	}

	output, err := xml.MarshalIndent(invoice, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("failed to marshal UBL-TR XML: %w", err)
	}

	// Add XML declaration
	result := []byte(xml.Header)
	result = append(result, output...)
	return result, nil
}

func extractCity(adres string) string {
	if adres == "" {
		return ""
	}
	// Simple: first word is usually the city
	parts := splitByComma(adres)
	if len(parts) > 0 {
		return parts[0]
	}
	return adres
}

func splitByComma(s string) []string {
	var result []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == ',' {
			result = append(result, trimSpace(s[start:i]))
			start = i + 1
		}
	}
	if start < len(s) {
		result = append(result, trimSpace(s[start:]))
	}
	return result
}

func trimSpace(s string) string {
	start, end := 0, len(s)
	for start < end && (s[start] == ' ' || s[start] == '\t') {
		start++
	}
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t') {
		end--
	}
	return s[start:end]
}
