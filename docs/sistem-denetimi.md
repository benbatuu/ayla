# Ay'la Food & More — Sistem Denetim Raporu

**Tarih:** 25 Ağustos 2026 (yeniden değerlendirme)  
**Önceki genel skor (kapanış):** ~8.3 / 10  
**Bu değerlendirme:** ~8.5 / 10

---

## Skor kartı

| Modül | Önceki | Şimdi | Not |
|-------|--------|-------|-----|
| Pazarlama sitesi | 8.7 | **8.8** | FAQ ana sayfada (`#faq`); SEO/i18n/legal güçlü |
| Admin | 8.2 | **8.2** | Mobil drawer, auth, rate limit, feedback inbox |
| Rezervasyon | 8.5 | **8.3** | 7 gün / gece slot / 8+ telefon OK; kapasite yarışı riski duruyor |
| QR / servis | 8.3 | **8.2** | Tercih + sunucu total + “Hesap alındı”; waiter-call IP limiti zayıf |
| Altyapı | 7.0 | **8.5** | **Neon Postgres canlı** + SQLite snapshot import; notify hâlâ demo |
| **Genel** | **~8.3** | **~8.5 / 10** | Soft launch / soft production hazır |

### Alt skorlar (detay)

| Alan | Puan |
|------|------|
| Ana sayfa akışı | 9.0 |
| SEO / JSON-LD | 8.5 |
| i18n TR·EN·RU | 9.0 |
| Legal + cookie | 9.0 |
| Hero video / perf | 8.0 |
| Rezervasyon lib | 8.0 |
| Rezervasyon API | 7.5 |
| QR adisyon | 8.5 |
| Sipariş rate limit | 8.0 |
| Waiter-call koruma | 6.5 |
| Notify | 8.0 (demo) |
| Admin auth | 8.5 |
| Admin UX / kapsama | 8.5 |
| Prisma / Neon | 8.5 |
| Seed güvenlik | 8.5 |
| Docs / `.env.example` | 7.0 |

---

## Ne değişti (bu tur)

- [x] FAQ ayrı sayfa değil → ana sayfa `#faq` (yorumlar ↔ rezervasyon arası)
- [x] `/faq` → `/#faq` kalıcı redirect
- [x] Neon PostgreSQL aktif; menü (188), kategoriler, masalar, ayarlar import edildi
- [x] SQLite migrations arşivlendi; baseline `20260825171000_neon_init`

---

## Güçlü yanlar

1. **Pazarlama:** Hero → hikâye → imza menü → galeri → yorumlar → FAQ → rezervasyon — tek hikâye, marka odaklı
2. **İş kuralları net:** max 7 gün, 8+ telefon, iptal telefonda, online ödeme yok, hesap = tercih
3. **Operasyon:** Admin servis board + ses; feedback inbox; upload limitleri; login rate limit
4. **Veri:** Neon üzerinde gerçek restoran içeriği; JSON-LD / NAP / slogan tutarlı

---

## Kalan riskler / açıklar

| Öncelik | Madde | Etki |
|---------|-------|------|
| Yüksek (ops) | Resend + Twilio canlı anahtarlar | Misafir e-posta/SMS gitmez (demo konsol) |
| Yüksek (ops) | Production admin şifresi değiştir | Varsayılan hesap riski |
| Orta | Rezervasyon kapasite yarışı (Serializable yok) | Eşzamanlı aşırı rezervasyon mümkün |
| Orta | In-memory rate limit | Multi-instance’ta zayıf |
| Orta | Waiter-call / feedback IP rate limit yok | Spam riski |
| Düşük | `.env.example` hâlâ SQLite default | Yeni kurulum karışıklığı |
| Düşük | Sitemap hreflang cluster; menü SEO TR-only | SEO cilası |
| Düşük | GSC / Bing verification | Admin SEO alanı boşsa index gecikir |
| Opsiyonel | Neon credential rotate (chat’te ifşa olduysa) | Güvenlik hijyeni |

---

## Bilinçli ertelenenler

- Rol bazlı personel (owner / garson / mutfak)
- PSP / online ödeme
- KDS / mutfak yazıcısı
- Misafir self-serve iptal linki

---

## Verdict

**Soft launch skoru: 8.5 / 10.**  
Restoran sitesi + rezervasyon + QR servis zinciri production’a yakın. Canlıya çıkmadan önce: **bildirim anahtarları**, **admin şifresi**, isteğe bağlı **Neon şifre rotate**. Kod tarafı blocker kalmadı; kalanlar çoğunlukla ops + sertleştirme.

*Kurulum notları: `docs/neon-setup.md`.*
