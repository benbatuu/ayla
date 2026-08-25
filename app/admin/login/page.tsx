import Image from "next/image";
import Link from "next/link";
import { getSessionUser } from "../../lib/auth";
import { redirect } from "next/navigation";
import { loginAction } from "../actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) {
    redirect("/admin");
  }

  const { error } = await searchParams;
  const hasError = error === "1";
  const isLocked = error === "locked";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#171613] text-[#f3f1eb]">
      <div className="absolute inset-0">
        <Image
          src="/table.jpeg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#171613] via-[#171613]/40 to-black/30" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-8 lg:px-10">
          <Link
            href="/"
            className="font-brand text-3xl italic tracking-[-0.04em] text-white transition hover:text-white/80"
          >
            Ay&apos;la
          </Link>
          <Link
            href="/"
            className="text-[10px] uppercase tracking-[0.25em] text-white/45 transition hover:text-white/70"
          >
            Siteye dön
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-md">
            <div className="mb-10 text-center">
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.35em] text-white/50">
                Yönetim Paneli
              </p>
              <h1 className="font-brand text-[clamp(2.5rem,8vw,3.5rem)] italic leading-[0.9] tracking-[-0.04em]">
                Hoş geldiniz
              </h1>
              <p className="mt-4 text-sm text-white/45">
                Devam etmek için hesabınıza giriş yapın.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#171613]/75 p-8 shadow-2xl backdrop-blur-xl">
              {isLocked ? (
                <div className="mb-6 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  Çok fazla başarısız deneme. 15 dakika sonra tekrar deneyin.
                </div>
              ) : null}
              {hasError ? (
                <div className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  E-posta veya şifre hatalı. Lütfen tekrar deneyin.
                </div>
              ) : null}

              <form action={loginAction} className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/40">
                    E-posta
                  </span>
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder="admin@ayla.restaurant"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm outline-none transition placeholder:text-white/20 focus:border-white/30 focus:bg-white/[0.07]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/40">
                    Şifre
                  </span>
                  <input
                    type="password"
                    name="password"
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm outline-none transition placeholder:text-white/20 focus:border-white/30 focus:bg-white/[0.07]"
                  />
                </label>

                <button
                  type="submit"
                  className="group mt-2 w-full rounded-full bg-[#f3f1eb] py-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#171613] transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Giriş Yap
                </button>
              </form>
            </div>

            <p className="mt-8 text-center text-[10px] uppercase tracking-[0.2em] text-white/25">
              Ay&apos;la · Alanya
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
