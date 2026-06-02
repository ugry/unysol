# Unysol — Registration Flow (Mermaid)

```mermaid
flowchart TD
    START([User visits Unysol]) --> CHOICE{Login Method?}

    %% ---- GOOGLE OAUTH PATH ----
    CHOICE -->|Google| GOOGLE[Google OAuth Popup]
    GOOGLE --> G_AUTH[Google Authenticates]
    G_AUTH --> G_CHECK{Email exists in DB?}
    G_CHECK -->|Yes| G_LOGIN[Login existing user]
    G_CHECK -->|No| G_CREATE[Auto-create tenant + user<br/>aktif = TRUE]
    G_CREATE --> G_DASHBOARD[→ Tenant Dashboard]

    %% ---- EMAIL/PASSWORD PATH ----
    CHOICE -->|Email| SIGNUP[Signup Form<br/>Company Name + Email + Password]
    SIGNUP --> VALIDATE{Validations pass?}
    VALIDATE -->|No| SIGNUP_ERR[Show validation errors]
    SIGNUP_ERR --> SIGNUP
    VALIDATE -->|Yes| CREATE[Create tenant + user<br/>aktif = FALSE]

    %% ---- VERIFICATION ----
    CREATE --> GEN_CODE[Generate 6-digit code<br/>+ verification token]
    GEN_CODE --> STORE[Store in email_verification_tokens<br/>expires in 1 hour]
    STORE --> SEND_EMAIL[Send verification email<br/>Subject: 'Unysol Doğrulama Kodu: 123456'<br/>Body: code + clickable link]

    %% ---- USER RECEIVES EMAIL ----
    SEND_EMAIL --> WAIT[User checks email<br/>@ Mailpit in QA]

    WAIT --> CODE_CHOICE{How to verify?}

    CODE_CHOICE -->|"Enter 6-digit code<br/>on /verify page"| CODE_INPUT[User types 6-digit code]
    CODE_INPUT --> CODE_POST[POST /api/auth/verify-code]
    CODE_POST --> CODE_VALID{Code valid?}

    CODE_CHOICE -->|"Click link<br/>in email"| LINK_CLICK[GET /api/auth/verify?token=xxx&code=123456]
    LINK_CLICK --> LINK_VALID{Token + code valid?}

    %% ---- VALIDATION OUTCOMES ----
    CODE_VALID -->|Invalid/Expired| CODE_ERR[Show error:<br/>'Geçersiz kod' or 'Kodun süresi doldu']
    CODE_ERR --> WAIT
    LINK_VALID -->|Invalid/Expired| LINK_ERR[Show error page]

    CODE_VALID -->|Valid| ACTIVATE[Set aktif = TRUE<br/>Mark code as used]
    LINK_VALID -->|Valid| ACTIVATE

    ACTIVATE --> AUTO_LOGIN[Generate JWT token]
    AUTO_LOGIN --> REDIRECT[Redirect to /dashboard]

    %% ---- RESEND ----
    WAIT --> RESEND[User clicks 'Tekrar Gönder']
    RESEND --> GEN_CODE

    %% ---- SUB-STYLES ----
    style GOOGLE fill:#4285F4,color:#fff
    style SIGNUP fill:#FF5F03,color:#fff
    style SEND_EMAIL fill:#16A34A,color:#fff
    style ACTIVATE fill:#16A34A,color:#fff
    style REDIRECT fill:#16A34A,color:#fff
    style AUTO_LOGIN fill:#FF5F03,color:#fff
    style CODE_ERR fill:#DC2626,color:#fff
    style LINK_ERR fill:#DC2626,color:#fff
```

---

## Flow Summary

| Step | Google OAuth | Email/Password |
|------|:---:|:---:|
| Tenant creation | Auto | During signup |
| Email verification | Skipped | Required |
| 6-digit code | N/A | Sent in email subject + body |
| Code expiry | N/A | 1 hour |
| Auto-login after verify | N/A | Yes — JWT returned |
| First screen | Dashboard | Dashboard |

---

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|:---:|---------|
| POST | `/api/auth/signup` | Public | Create tenant + user, send code |
| POST | `/api/auth/login` | Public | Login (blocks if unverified) |
| POST | `/api/auth/google` | Public | Google OAuth (auto-activates) |
| GET | `/api/auth/verify` | Public | Verify via link (token + code) |
| POST | `/api/auth/verify-code` | Public | Verify via 6-digit code |
| POST | `/api/auth/resend-code` | Public | Resend verification code |

## Email Template

```
Subject: Unysol — Doğrulama Kodunuz: 123456

Merhaba,

Unysol hesabınızı doğrulamak için:

Doğrulama Kodunuz: 123456

Veya aşağıdaki linke tıklayın:
http://localhost/verify?token=abc123...&code=123456

Bu kod 1 saat süreyle geçerlidir.

Saygılarımızla,
Unysol Ekibi
```
