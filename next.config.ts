import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./app/i18n/request.ts");

const nextConfig = {
  // Prisma custom output must be traced into Vercel serverless functions
  serverExternalPackages: ["@prisma/client"],
  outputFileTracingIncludes: {
    "/*": ["./app/generated/prisma/**/*"],
    "/api/**/*": ["./app/generated/prisma/**/*"],
    "/admin/**/*": ["./app/generated/prisma/**/*"],
    "/menu/**/*": ["./app/generated/prisma/**/*"],
  },
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