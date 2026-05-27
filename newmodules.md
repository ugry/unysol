# Unysol — New Module Development Rules

> **Date:** 27 May 2026
> **Source:** exa.ai research + competitor analysis

---

## Rule 1: Research Before Build
Every new module must be researched against at least 3 competitors:
- Use exa.ai API for search
- Compare feature sets
- Identify what competitors are missing
- Build what's missing + what's in demand

## Rule 2: Competitor Baseline — Never Be Less
| Module | FiloMetrik | Kamyoon | ATS PRO | Parsek ERP | Unysol Target |
|--------|:---:|:---:|:---:|:---:|:---:|
| **Fuel Tracking** | ✅ | ❌ | ✅ | ✅ | ✅ Built v2.28 |
| **Maintenance** | ✅ | ❌ | ✅ | ✅ | ✅ Built v2.28 |
| **Tire Tracking** | ❌ | ❌ | ✅ | ✅ | ⬜ Planned |
| **Toll/HGS Tracking** | ❌ | ❌ | ✅ | ❌ | ⬜ Planned |
| **Trailer Mgmt** | ✅ | ❌ | ❌ | ❌ | ⬜ Planned |
| **Insurance Tracking** | ❌ | ❌ | ✅ | ❌ | ⬜ Planned |
| **Driver Leave** | ❌ | ❌ | ❌ | ❌ | ⬜ Planned |

## Rule 3: Module Recipe
Each module must have:
1. ✅ Database table (from 01-schema.sql)
2. ✅ Registered in modules table (admin visible)
3. ✅ Backend handler (CRUD in internal/handlers/)
4. ✅ Route registration (in main.go)
5. ✅ Frontend page (in pages/)
6. ✅ Sidebar navigation link
7. ✅ CI test rule (in test.yml)

## Rule 4: CI Pipeline Rule
```
Any new module must:
- Pass module-consistency check (registered in DB)
- Have a corresponding frontend page
- Be imported in App.tsx routes
- Be listed in Sidebar navigation
- Not introduce mock data
```

## Rule 5: Competitor Feature Gap
| Feature | Competitors Have | Unysol |
|---------|:---:|:---:|
| Fuel tracking per vehicle | ✅ All | ✅ Added |
| Maintenance calendar | ✅ All | ✅ Added |
| Cost per km calculation | ✅ Parsek, ATS | ✅ Added |
| Service reminder alerts | ✅ All | ✅ Added |
| Tire management | ✅ ATS, Parsek | ⬜ |
| HGS toll import | ✅ ATS, Filo Asistan | ⬜ |
| Mobile fuel entry | ✅ Parsek | ⬜ |
| Fuel card integration | ✅ ATS | ⬜ |
