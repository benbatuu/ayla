import { Link } from "../i18n/navigation";

type Section = {
  title: string;
  paragraphs: string[];
};

export default function LegalDocument({
  title,
  updated,
  intro,
  sections,
  backLabel,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: Section[];
  backLabel: string;
}) {
  return (
    <div className="min-h-screen bg-[#f3f1eb] text-[#171613]">
      <div className="mx-auto max-w-3xl px-6 py-24 lg:px-10 lg:py-32">
        <Link
          href="/"
          className="text-[9px] uppercase tracking-[0.28em] text-black/40 transition-colors hover:text-black/70"
        >
          ← {backLabel}
        </Link>

        <p className="mt-10 text-[8px] uppercase tracking-[0.35em] text-black/35">
          {updated}
        </p>

        <h1 className="mt-6 font-brand text-[clamp(2.5rem,6vw,4.5rem)] italic leading-[0.95] tracking-[-0.04em]">
          {title}
        </h1>

        <p className="mt-8 text-base leading-8 text-black/55">{intro}</p>

        <div className="mt-14 space-y-12 border-t border-black/10 pt-14">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-black/70">
                {section.title}
              </h2>
              <div className="mt-5 space-y-4">
                {section.paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-sm leading-7 text-black/50 lg:text-[15px] lg:leading-8"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
