import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./app/i18n/request.ts");

const nextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  images: {
    remotePatterns: [
      {
        protocol: "https" as const,
        hostname: "menu.qrtekpro.com",
        pathname: "/uploads/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/faq", destination: "/#faq", permanent: true },
      { source: "/en/faq", destination: "/en#faq", permanent: true },
      { source: "/ru/faq", destination: "/ru#faq", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);