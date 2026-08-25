export default function AdminPageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-10 border-b border-white/10 pb-8">
      <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-white/35">
        Yönetim
      </p>
      <h1 className="font-brand text-[clamp(2rem,5vw,2.75rem)] italic leading-[0.95] tracking-[-0.03em]">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function AdminSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm lg:p-8 ${className}`}
    >
      <h2 className="mb-6 text-lg font-medium tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export function AdminCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition hover:border-white/15 hover:bg-white/[0.04] ${className}`}
    >
      {children}
    </div>
  );
}
