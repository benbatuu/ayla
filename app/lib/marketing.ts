import { prisma } from "./prisma";

export async function getMarketingSettings() {
  return prisma.marketingSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
}

export async function getActiveCampaigns() {
  return prisma.marketingCampaign.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });
}

export function buildCampaignUrl(
  baseUrl: string,
  campaign: { source: string; medium: string; campaign: string; content?: string | null }
) {
  const url = new URL(baseUrl);
  url.searchParams.set("utm_source", campaign.source);
  url.searchParams.set("utm_medium", campaign.medium);
  url.searchParams.set("utm_campaign", campaign.campaign);
  if (campaign.content) {
    url.searchParams.set("utm_content", campaign.content);
  }
  return url.toString();
}
