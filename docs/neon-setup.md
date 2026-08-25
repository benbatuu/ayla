# Neon (PostgreSQL) — aktif

Proje Neon PostgreSQL kullanır. Yerel SQLite yedeği: `prisma/dev.db` + `media/sqlite-snapshot.json`.

## Bağlantı

`.env`:

```bash
DATABASE_URL="postgresql://...?sslmode=require"
```

Pooler URL (`-pooler`) uygulama için uygundur.

## Şema senkron

```bash
npx prisma db push
npx prisma generate
```

veya migration geçmişi ile:

```bash
npx prisma migrate deploy
```

Baseline: `prisma/migrations/20260825171000_neon_init`  
Eski SQLite migration’lar: `prisma/migrations_sqlite_archive/`

## SQLite → Neon veri taşıma

```bash
# 1) SQLite export (schema hâlâ sqlite iken)
DATABASE_URL="file:./dev.db" npx tsx scripts/export-sqlite-snapshot.ts

# 2) provider=postgresql + db push

# 3) Import
npx tsx scripts/import-sqlite-snapshot-to-neon.ts

# 4) Doğrula
npx tsx scripts/verify-neon.ts
```

## Bildirim (demo)

```bash
NOTIFY_DEMO_MODE=1
```

Resend/Twilio sonra eklenebilir.
