# Imbass — Ürün & Teknik Analiz (v1)

**Tarih:** 2026-04-17
**Hedef kitle:** Ürün sahibi, frontend/backend geliştirici, pitch için referans

Bu belge; pitch'te tanımlanan ürün vizyonunun (**Influencer LinkedIn + Agency CRM + Campaign Management + Performance Analytics + Talent Marketplace**) mevcut kod tabanıyla eşleştirmesidir. Neyin **var**, neyin **eksik** olduğunu dosya-düzeyinde kanıtla gösterir, sonra bir **sprint planı** ve **şema/endpoint önerileri** sunar.

---

## 1. Vizyon Özeti

Ürün **4 ana modülden** oluşuyor:

| # | Modül | Karşılık |
|---|-------|----------|
| 1 | **Marketplace** | Üretici keşfi — LinkedIn benzeri profil ağı |
| 2 | **Agency Management Panel** | Ajans içi CRM — üretici kadrosu yönetimi |
| 3 | **Campaign & Offer System** | Kampanya + teklif + müzakere akışı |
| 4 | **Creator Performance & Level System** | GitHub contribution + Steam level mantığı |

**Çözdüğümüz problemler** (pitch'ten):

- Ajans → creator yönetimi dağınık
- Sponsor → creator keşfi zor
- Creator → iş fırsatı görünmez
- Kampanya → takip zor
- Performans → ölçüm yok
- Güven → düşük
- İletişim → mail kaosu

---

## 2. Mevcut Durum Özeti

### 2.1 Frontend sayfalar (`src/pages/`)

| Sayfa | Açıklama | Duruma |
|-------|----------|--------|
| `LoginPage.tsx` | Email + password girişi | ✅ Çalışır (dev bypass: INFLUENCER olarak girer) |
| `RegisterPage.tsx` | Creator/Agency rol seçimli kayıt | ✅ Çalışır |
| `OnboardingPage.tsx` | Platform bağlama / ajans bilgileri | ✅ Çalışır |
| `enterprise/EnterpriseDashboard.tsx` | Ana dashboard — kampanya/influencer/redemption | ✅ UI hazır, mock data |
| `ProfilePage.tsx` | Profil görüntüleme/düzenleme + platform bağlama | ✅ Çalışır |
| `AdCollaboration.tsx` | Kampanya listesi + detay | ✅ Çalışır |
| `NegotiationConsole.tsx` | Teklif + sayaç + reddet/kabul | ✅ Çalışır |
| `WeeklyAnalytics.tsx` | Haftalık/zaman serisi analitik | ✅ Çalışır |
| `Home.tsx`, `Dashboard.tsx` | Eski versiyonlar | ⚠️ Route'tan düşmüş, ölü kod |

### 2.2 Backend route/controller/service (`server/src/`)

| Rotası | Servisi | Kapsam |
|--------|---------|--------|
| `/api/auth` | `authService.ts` | JWT + refresh token, login/register/logout |
| `/api/profile` | `profileService.ts` | getMe / updateMe |
| `/api/onboarding` | `onboardingService.ts` | completeInfluencer / completeAgency |
| `/api/analytics` | `analyticsService.ts` | weekly, timeseries, summary |
| `/api/negotiations` | `negotiationService.ts` | makeOffer / accept / reject |
| `/api/campaigns`, `/api/influencers`, `/api/apply` | `dataService.ts` | Kampanya CRUD, creator listesi |

### 2.3 DB şeması (`server/setup-db.js` + migration'lar)

Mevcut tablolar:

1. `users` (id, email, password_hash, role, refresh_token, is_onboarding)
2. `profiles` (id, user_id, full_name, bio, location, contact_email, avatar_url, company_name, logo_url)
3. `social_accounts` (id, profile_id, platform, username, follower_count, profile_url)
4. `campaigns` (id, creator_id, title, description, budget_cents, currency, status)
5. `negotiations` (id, campaign_id, creator_id, agency_id, current_offer_cents, status)
6. `negotiation_events` (id, negotiation_id, actor_id, event_type, offer_amount_cents, metadata_comment) — **immutable log**
7. `accounts` (id, owner_id, name, account_type, currency) — escrow
8. `ledger_transactions` + `ledger_entries` — double-entry defter
9. `analytics_data` — reach/engagement/clicks/conversions kayıtları

### 2.4 Cross-cutting

- ✅ JWT auth + role gating (`requireAuth`, `requireRole`)
- ✅ Zod input validation
- ✅ Error middleware
- ❌ **Notification sistemi yok**
- ❌ **File upload altyapısı yok** (avatar/logo data URL olarak geliyor)
- ❌ **WebSocket / real-time yok**
- ❌ **Rate-limiting yok**
- ❌ **Audit log yok**
- ❌ **Arama indeksi yok** (Postgres FTS veya Meilisearch)

---

## 3. Modül Bazlı Eksik Analizi

### 🔴 Modül 1 — Marketplace (Creator LinkedIn)

**Var olanlar:**
- Public profil sayfası (`ProfilePage.tsx`) — bio, konum, iletişim
- Sosyal platform bağlama UI'ı (`OnboardingPage.tsx` + `social_accounts` tablosu)
- Creator listeleme (`dataService.getInfluencers`)

**Eksikler — kritik:**

| Eksik | Gerekçe | Tahmini efor |
|-------|---------|---------------|
| **Public creator profili (/u/:username)** | Login olmadan görünen marketing profili — LinkedIn'in aç-gör halkası | 2 gün |
| **Arama + filtre UI** (platform, takipçi, kategori, lokasyon) | Keşfedilebilirlik ana fonksiyon | 3 gün |
| **Follow / Connect / Bookmark** | Sosyal grafın temeli; agency ↔ creator ilişkisi de buradan besleniyor | 2 gün |
| **Verified badge + rozet sistemi** | Güven skoru — pitch'in "trust" ekseni | 1 gün |
| **Platform doğrulama (OAuth handshake)** | Bağladım diyen herkese güven, zayıf sinyal | 4-5 gün (Instagram/TikTok API) |
| **Username slug (@emre)** | Paylaşılabilir linkler | 0.5 gün |
| **Activity feed** (alınan işbirlikleri, bitmiş kampanyalar) | Profil canlılık | 2 gün |

**Yeni tablolar:**
```sql
follows          (follower_id, following_id, created_at)
verifications    (id, profile_id, platform, verified_at, evidence)
profile_slugs    (slug UNIQUE, profile_id)
```

---

### 🔴 Modül 2 — Agency Management Panel

**Var olanlar:**
- Ajans rolü (`role='AGENCY'`)
- Ajans onboarding (şirket adı, logo)
- Ajans-sahipli kampanya oluşturma

**Eksikler — kritik:**

| Eksik | Gerekçe |
|-------|---------|
| **Agency-Creator roster ilişkisi** | Ajansın kendi bünyesindeki üreticileri yönetebilmesi pitch'in **çekirdeği**; şu an tablo yok |
| **Ajans üye/takım yönetimi** (admin, manager, editor) | Agency hesabı bir kişiye kilitli; gerçek ajanslarda çoklu kullanıcı olur |
| **Ajans içi not / görev / iş takibi** | Kampanya işlenirken atanan görevler, deadline'lar |
| **Roster-level analitik** (hangi creator daha çok getiriyor) | "Kimin daha çok getirisi var" pitch ifadesinin direkt karşılığı |
| **Davet akışı (creator'ı ajansa ekleme)** | Creator onayı + reddi olan 2-aşamalı |

**Yeni tablolar:**
```sql
agency_creators  (agency_id, creator_id, status, invited_at, joined_at, role)
agency_members   (agency_id, user_id, role, permissions jsonb, joined_at)
agency_notes     (id, agency_id, creator_id, author_id, body, pinned, created_at)
tasks            (id, agency_id, creator_id, campaign_id, title, status, due_at, assignee_id)
```

---

### 🟡 Modül 3 — Campaign & Offer System

**Var olanlar — güçlü:**
- Kampanya CRUD + durum alanı (DRAFT/ACTIVE/SETTLED/CANCELLED)
- Müzakere tablosu + **immutable event log** (mükemmel seçim)
- Counter-offer / accept / reject akışı
- Double-entry ledger + escrow hesapları

**Eksikler:**

| Eksik | Gerekçe |
|-------|---------|
| **Public campaign marketplace** | Creator'ın başvurabileceği açık listeleme yok |
| **Creator başvuru (application) akışı** | Creator bir kampanyaya **başvurabilir** olmalı, şu an yalnızca ajans-creator invite var |
| **Brief / deliverable yönetimi** | Kampanya detayında beklenen içerik tipi, uzunluk, sosyal kanal |
| **Milestone/payment tracker** | Ledger hazır ama **settlement workflow** yok — "teslim edildi → escrow serbest bırak" |
| **Contract (sözleşme) tracking** | PDF/e-imza ya da basit sözleşme metni |
| **Kampanya medya yükleme** | Brief görselleri, moodboard — file upload eksikliğinden dolayı yok |
| **Kampanya arama / filtre** (bütçe, platform, kategori) | Marketplace için zorunlu |

**Yeni tablolar:**
```sql
campaign_applications  (id, campaign_id, creator_id, status, pitch, created_at)
deliverables           (id, campaign_id, type, quantity, description, due_at)
milestones             (id, negotiation_id, title, amount_cents, status, due_at)
contracts              (id, negotiation_id, body, signed_by_creator_at, signed_by_agency_at)
campaign_media         (id, campaign_id, url, type, position)
```

---

### 🔴 Modül 4 — Creator Performance & Level System

**Var olanlar:**
- `analytics_data` — reach/engagement/clicks/conversions kayıtları
- Haftalık/zaman-serisi aggregasyon servisleri

**Eksikler — bu modül neredeyse hiç inşa edilmemiş:**

| Eksik | Gerekçe |
|-------|---------|
| **Activity heatmap (GitHub tarzı)** | "Yıllar/aylar/haftalar katkı tablosu" — pitch'in **imza** özelliği |
| **Level / XP sistemi** (Steam tarzı) | Aktiflik + işbirliği sayısına göre level |
| **Trust score** | Teslim süresi, kampanya başarı oranı |
| **ROI skoru** | Creator bazında gelir/maliyet |
| **Fake follower detection** | Takipçi kalite skoru |
| **Audience demographics / overlap** | Hedef kitle eşleşmesi |
| **Creator leaderboard / ranking** | Ajans sıralaması da dahil |
| **Availability calendar** | Creator'ın yoğunluk takvimi |
| **Rate estimator** | Tahmini ücret aralığı |

**Yeni tablolar:**
```sql
creator_activity   (creator_id, day DATE, count INT, primary key (creator_id, day))
creator_levels     (creator_id, xp INT, level INT, trust_score NUMERIC, updated_at)
creator_badges     (creator_id, badge_code, awarded_at)
audience_snapshot  (profile_id, platform, snapshot_at, gender_split jsonb, age_split jsonb, country_split jsonb, bot_ratio NUMERIC)
availability       (creator_id, from_date, to_date, status)
```

**XP formülü önerisi (v1):**
```
xp = (tamamlanan_kampanya × 100)
   + (olumlu_review × 25)
   + (zamanında_teslim × 15)
   - (gecikmeli_teslim × 20)
level = floor(sqrt(xp / 50))
```

---

## 4. Kayda Değer Cross-Cutting Eksikler

**Öncelik notu (2026-04-17 revizyonu):**
> - Notification real-time **değil**, basit polling/DB tabanlı yeterli (Sprint 3)
> - WebSocket **en basic haliyle** eklenecek (müzakere canlılık hissi için — Sprint 3)
> - File upload, Rate limit, Audit log, Arama (FTS) — **sona bırakıldı** (Sprint 5+)

| Eksik | Etkisi | Öncelik |
|-------|--------|---------|
| **Notification (basic)** | Müzakere güncellemeleri kullanıcıya ulaşmıyor | 🟡 Sprint 3 — `notifications` tablosu + in-app dropdown, polling ile (real-time değil) |
| **File upload** | Avatar, logo, kampanya medyası base64 olarak DB'de — şişme riski | 🔵 Sprint 5+ — S3 veya Cloudflare R2 |
| **Real-time messaging (basic)** | Müzakere event-log; canlı hissetmiyor | 🟡 Sprint 3 — Socket.IO en sade kurulum, sadece event broadcast |
| **Audit log** | Kim neyi değiştirdi izi yok | 🔵 Sprint 6+ — `audit_logs` tablosu + middleware |
| **Rate limit** | Brute-force login'e açık | 🔵 Sprint 6+ — `express-rate-limit` |
| **Arama (FTS)** | LIKE sorguları ölçeklenmez | 🔵 Sprint 6+ — Postgres tsvector |

---

## 5. Stratejik / "Rakipsiz" Özellikler (pitch — Görsel 5)

Bunlar MVP dışı ama diferansiyatör:

| Özellik | Aşama |
|---------|-------|
| Verified Campaign Score (ajans güvenilirlik) | V2 — agency_ratings tablosu |
| Creator Trust Badge (teslim rozet) | V2 — creator_badges + otomatik hesap |
| Smart Match AI (creator öneri) | V3 — embedding + cosine similarity |
| Revenue Heatmap (creator profilinde aylık kazanç) | V2 — analytics extension |
| Public Campaign Showcase (vitrin) | V2 — kampanyalara `is_showcase` flag'i |
| Agency Ranking | V2 — agency_metrics view |

"Ek yaratıcı fikirler" (Görsel 4):
- AI creator-brand matching → V3
- Rate estimator → V2 (otomatik fiyat aralığı modeli)
- Fake follower detection → V3 (external API: HypeAuditor/Modash)
- Audience overlap score → V3

---

## 6. Sprint Bazlı Yol Haritası (Revize — 2026-04-17)

### Sprint 0 — "Quick Wins + Tech Debt" (2–3 gün) ⚡
*Pitch-ready görsel güç ve kod hijyeni — backend sözü vermeden yapılabilir*
- Activity heatmap UI (mock data)
- Creator level + XP bar
- Trust score badge
- Marketplace creator directory (mock)
- Campaign showcase vitrine
- Ölü kod temizliği (Home.tsx, Dashboard.tsx)
- Role enum: BRAND eklenir (future-proof)
- `AuthRequest` tipi server'a eklenir
- *(File upload hariç)*

### Sprint 1 — "Marketplace Temeli" ✅ **TAMAMLANDI** (2026-04-17)
- ✅ Public creator profili `/u/:slug` + SEO meta (react-router-dom v6)
- ✅ Creator arama + filtre (platform, niche, availability) — DB destekli, client-side uygulama
- ✅ Follow / bookmark ilişkisi (`follows` tablosu — composite PK, self-follow check)
- ✅ Username slug sistemi + backfill migration
- ✅ Hybrid follow store — authed'de server sync, offline'da localStorage fallback
- ✅ Following sayfası + sidebar count badge
- ✅ Graceful degradation: backend down → "Offline sample" rozeti + mock data
- ✅ Endpoints: `GET /api/creators`, `GET /api/creators/:slug`, `POST|DELETE /api/creators/:id/follow`, `GET /api/me/follows`

### Sprint 2 — "Agency CRM" (2 hafta)
- `agency_creators` + invite/accept akışı
- Ajans üye yönetimi (admin/manager/editor rolleri)
- Creator roster sayfası + roster-level analitik
- Ajans içi not sistemi (`agency_notes`)
- Task/todo tablosu

### Sprint 3 — "Campaign Marketplace + Basic Notification/WS" (2 hafta)
- Public campaign listeleme + başvuru akışı
- Milestone + deliverable modelleri
- Settlement workflow (teslim → escrow serbest bırak)
- **Basic notification** — `notifications` tablosu + in-app dropdown (polling, real-time değil)
- **Basic WebSocket** — Socket.IO minimal kurulum, yalnız müzakere event broadcast

### Sprint 4 — "Creator Level System" (2 hafta)
- `creator_activity` aggregation (heatmap mock'ını gerçek data'ya bağla)
- XP + level hesaplayan nightly job
- Trust score algoritması + rozet sistemi
- Creator leaderboard
- Availability calendar

### Sprint 5+ — "Güvenilirlik, Upload, Arama, Diferansiyatörler"
- File upload altyapısı (S3 / R2 + presigned URL)
- Platform doğrulama (OAuth — Instagram/TikTok Graph API)
- Postgres FTS entegrasyonu
- Rate limiting + security sertleştirme
- Audit log
- Public campaign showcase (production data)
- Agency ranking
- Revenue heatmap
- Smart Match AI

---

## 7. Hemen Yapılabilir "Quick Win"ler

Pitch için **1-2 gün içinde** görsel güç kazandıracak, düşük riskli işler:

1. ✨ **Activity heatmap UI (mock data ile)** — `src/components/creator/ActivityHeatmap.tsx` — sadece görünüm, pitch'te efsane duracak
2. ✨ **Creator level rozeti** — ProfilePage'e eklenmiş XP bar + level number
3. ✨ **Public creator profili mock** — `/u/:slug` route, login olmadan görünen
4. ✨ **Trust score badge** — profilde "Trust 92" yeşil rozet
5. ✨ **Kampanya vitrini (public showcase grid)** — dashboard'a yeni tab
6. 🧹 **Ölü kod temizliği** — `src/pages/Home.tsx`, `Dashboard.tsx` kaldır veya active page'e al

Bunları backend sözü vermeden yapılabilir — demo modunda mock data yeterli.

---

## 8. Teknik Borç / Riskler

- **Roller `INFLUENCER | AGENCY | PRODUCER`** — `PRODUCER` kullanılıyor ama mantığı net değil. Pitch'te **SPONSOR** var (Görsel 2 — "Sponsor → creator keşfi zor"). Role enum'u gözden geçirilmeli:
  - `INFLUENCER` (creator)
  - `AGENCY`
  - `BRAND` (= sponsor) — direkt creator'lara teklif yapar
- **File upload yoksunluğu** — onboarding'de logo data URL olarak gidiyor; bir `profiles.logo_url` `text` alanına devasa base64 yazılıyor. **Migration zorunlu** olmadan DB şişebilir.
- **Çift "Dashboard"** — `Dashboard.tsx` ve `enterprise/EnterpriseDashboard.tsx` eş zamanlı var; routing'de yalnız biri aktif. Kaldırılmalı.
- **Server typecheck hataları** yakın zamanda düzeldi (analyticsService template literal, negotiationController `as string` cast'leri) ama `@ts-ignore` kullanımı `req.user` için riskli — özel `AuthRequest` tipi tanımlanmalı.
- **Test yok** — server için vitest/jest, frontend için react-testing-library eklenmeli.

---

## 9. Ölçüt / Başarı Sinyalleri

MVP "yaşıyor" derken aşağıdakiler çalışmalı:

- [ ] Bir creator kayıt olur → public slug profili oluşur
- [ ] Bir ajans kayıt olur → creator'ı davet edebilir, creator kabul edince roster'a eklenir
- [ ] Ajans bir kampanya açar → public marketplace'te listelenir
- [ ] Dışarıdaki bir creator kampanyaya başvurur → ajans inceler
- [ ] Müzakere başlar → teklif/sayaç → kabul → escrow'a para kilitlenir
- [ ] Teslim onaylanır → escrow serbest bırakılır → creator XP kazanır
- [ ] Creator'ın profilinde activity heatmap dolar, level artar
- [ ] Ajans dashboard'u rosterinin toplam gelirini, en iyi performanslı creator'ı gösterir

---

## 10. Özet — "Bugünkü durum, pitch'e ne kadar yakın?"

| Alan | Dolu | Yarım | Boş |
|------|------|-------|-----|
| UI temel navigation / auth / onboarding | ✅ |  |  |
| Dashboard görsel gücü | ✅ |  |  |
| Kampanya CRUD + müzakere (immutable log) | ✅ |  |  |
| Temel analitik | ✅ |  |  |
| Marketplace keşif / arama / follow |  | 🟡 |  |
| Agency roster CRM |  |  | ❌ |
| Level / XP / trust / heatmap |  |  | ❌ |
| Notification / real-time / upload |  |  | ❌ |
| Differensiyasyon katmanı (AI match, trust badge…) |  |  | ❌ |

**Tahmini MVP'ye kalan süre (tek ekip, orta tempo):** 8–10 hafta.
**Pitch için demo-hazır quick-win seti:** 2–3 gün.

---

## Ekler

### A. Önerilen API endpoint'leri (yeni)

```
GET  /api/creators                    — marketplace listeleme + filtre
GET  /api/creators/:slug              — public profil
POST /api/creators/:id/follow
DELETE /api/creators/:id/follow

POST /api/agencies/:id/invite         — roster daveti
POST /api/invites/:token/accept
GET  /api/agencies/:id/roster
POST /api/agencies/:id/members        — takım üyesi ekle

GET  /api/campaigns/marketplace       — public kampanyalar
POST /api/campaigns/:id/apply         — creator başvurusu
POST /api/negotiations/:id/milestones
POST /api/milestones/:id/complete     — settlement tetikler

GET  /api/creators/:id/activity       — heatmap data
GET  /api/creators/:id/level
GET  /api/creators/:id/badges

POST /api/uploads/presign             — S3 presigned URL
GET  /api/notifications
POST /api/notifications/:id/read
```

### B. Ekip rol dağılımı önerisi

- **Frontend geliştirici:** quick-win demoları + Sprint 1 UI
- **Backend geliştirici:** file upload + notification + agency CRM şema
- **Product:** pitch senaryosunu somut demo adımlarına indirger

---

*Bu belge yaşayan bir doküman — her sprint sonunda güncelleyin. Değişiklik önerisi için PR açın.*
