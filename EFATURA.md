# Unysol — e-Fatura / e-Arşiv Integration

> **Status:** UBL-TR XML generation ready. GİB API in simulation mode.  
> **Legal requirement:** Turkish Revenue Administration (GİB) mandates e-Fatura for companies above threshold.

---

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Invoice UI  │────▶│  Backend API │────▶│  UBL-TR Gen  │
│  (Frontend)  │     │  (Go/Chi)   │     │  (efatura/)  │
└──────────────┘     └──────┬───────┘     └──────┬───────┘
                            │                     │
                            ▼                     ▼
                     ┌──────────────┐     ┌──────────────┐
                     │  e-Fatura    │     │  GİB API     │
                     │  Logs (DB)   │     │  (Simulated) │
                     └──────────────┘     └──────────────┘
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tenant/invoices/{id}/e-fatura` | Send invoice as e-Fatura/e-Arşiv |
| POST | `/api/tenant/invoices/{id}/e-fatura/check` | Check e-Fatura status |

### Send e-Fatura

```bash
curl -X POST http://localhost:8080/api/tenant/invoices/301/e-fatura \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ebelge_tip": "E_ARSIV"}'
```

**Response:**
```json
{
  "status": "GONDERILDI",
  "ettn": "ETTN-20260526150405-FTR-2026-0001",
  "uuid": "abc123-def456-...",
  "ebelge_tip": "E_ARSIV"
}
```

### Check Status

```bash
curl -X POST http://localhost:8080/api/tenant/invoices/301/e-fatura/check \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "ettn": "ETTN-20260526150405-FTR-2026-0001",
  "status": "ONAYLANDI",
  "tip": "E_ARSIV"
}
```

## UBL-TR 2.1 XML Format

The package `internal/efatura/ubl.go` generates GİB-compliant UBL-TR 2.1 XML.

**Structure:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>TEMELFATURA</cbc:ProfileID>
  <cbc:ID>FTR-2026-0001</cbc:ID>
  <cbc:UUID>abc123-...</cbc:UUID>
  <cbc:IssueDate>2026-05-26</cbc:IssueDate>
  <!-- Supplier party, customer party, tax totals, items -->
</Invoice>
```

## Invoice Status Flow

```
taslak → GONDERILDI → ONAYLANDI → odendi
                ↓
              REDDEDILDI
```

| Status | Description |
|--------|-------------|
| `taslak` | Draft — not yet sent |
| `GONDERILDI` | Sent to GİB, awaiting response |
| `ONAYLANDI` | Accepted by GİB |
| `REDDEDILDI` | Rejected by GİB |
| `odendi` | Payment received |

## Production Setup (GİB Integration)

To activate real GİB integration, you need:

1. **GİB Portal Registration:**
   - Register at https://efatura.gov.tr
   - Obtain digital certificate (mali mühür)
   - Configure web service credentials

2. **Configuration:**
   ```env
   EFATURA_GIB_URL=https://efaturatest.gib.gov.tr/ws
   EFATURA_GIB_USERNAME=your_username
   EFATURA_GIB_PASSWORD=your_password
   EFATURA_CERT_PATH=/path/to/certificate.pfx
   EFATURA_CERT_PASSWORD=cert_password
   ```

3. **Switch from simulation mode:**
   - Set `EFATURA_MODE=production` in environment
   - Backend will use real GİB web service instead of simulated responses

## Database Tables

| Table | Purpose |
|-------|---------|
| `invoices.ebelge_tip` | E_FATURA, E_ARSIV, or null |
| `invoices.ebelge_durum` | GONDERILDI, ONAYLANDI, REDDEDILDI |
| `invoices.ebelge_uuid` | Unique e-Fatura identifier |
| `invoices.ebelge_ettn` | ETTN (Electronic Transfer Tracking Number) |
| `invoices.ebelge_yanit` | GİB response (JSONB) |
| `e_fatura_logs` | Full transaction log (islem, durum, istek, yanit) |

## Development Mode

In development mode, the system:
- Generates real UBL-TR XML (base64 encoded in response)
- Assigns simulated ETTN numbers
- Auto-approves after a short delay (CheckEFatura status)
- Logs all transactions to e_fatura_logs table
- No actual GİB connection required
