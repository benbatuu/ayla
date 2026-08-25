/** Google Maps feature ID (hex) from Ay'La Food & More listing */
export const DEFAULT_GOOGLE_FEATURE_ID =
  "0x14dc9983c30ef407:0xf396f6025729a5bb";

export const DEFAULT_GOOGLE_MAP_URL =
  "https://www.google.com/maps/place/Ay'La+Food+%26+More/@36.5484256,31.9945747,17z/data=!4m6!3m5!1s0x14dc9983c30ef407:0xf396f6025729a5bb!8m2!3d36.5484256!4d31.9945747!16s%2Fg%2F11z0mq9pyl";

export type GoogleMapsLinks = {
  mapUrl: string;
  /** Opens Google Maps reviews list for the place */
  reviewsUrl: string;
  /** Opens Google Maps write-a-review form */
  writeReviewUrl: string;
};

export function isUsableHttpUrl(value?: string | null): boolean {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed === "#") {
    return false;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidGooglePlaceId(value?: string | null): boolean {
  const trimmed = value?.trim().replace(/^places\//, "") ?? "";
  return /^ChI[a-zA-Z0-9_-]+$/.test(trimmed);
}

export function normalizeGooglePlaceId(value?: string | null): string {
  const trimmed = value?.trim().replace(/^places\//, "") ?? "";
  return isValidGooglePlaceId(trimmed) ? trimmed : "";
}

export function buildGoogleMapsLinks(input: {
  mapUrl?: string | null;
  googlePlaceFeatureId?: string | null;
  googlePlaceId?: string | null;
  googleReviewsUrl?: string | null;
}): GoogleMapsLinks {
  const featureId = input.googlePlaceFeatureId?.trim() || DEFAULT_GOOGLE_FEATURE_ID;
  const placeId = normalizeGooglePlaceId(input.googlePlaceId);

  const reviewsFromFeature = `https://www.google.com/maps/place//data=!4m4!3m3!1s${featureId}!9m1!1b1`;
  const writeFromFeature = `https://www.google.com/maps/place//data=!4m3!3m2!1s${featureId}!12e1`;
  const writeFromPlaceId = placeId
    ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`
    : null;
  const reviewsFromPlaceId = placeId
    ? `https://search.google.com/local/reviews?placeid=${encodeURIComponent(placeId)}`
    : null;

  const custom = isUsableHttpUrl(input.googleReviewsUrl)
    ? input.googleReviewsUrl!.trim()
    : null;

  return {
    mapUrl: isUsableHttpUrl(input.mapUrl) ? input.mapUrl!.trim() : DEFAULT_GOOGLE_MAP_URL,
    reviewsUrl: reviewsFromPlaceId ?? reviewsFromFeature,
    writeReviewUrl: custom ?? writeFromPlaceId ?? writeFromFeature,
  };
}
