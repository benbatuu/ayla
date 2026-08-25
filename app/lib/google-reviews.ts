import { unstable_cache } from "next/cache";
import {
  buildGoogleMapsLinks,
  DEFAULT_GOOGLE_FEATURE_ID,
  isUsableHttpUrl,
  normalizeGooglePlaceId,
} from "./google-maps";

export type GoogleReviewItem = {
  name: string;
  rating: number;
  date: string;
  text: string;
  source: "Google";
};

export type GoogleReviewSummary = {
  rating: number | null;
  reviewCount: number | null;
  reviews: GoogleReviewItem[];
  links: ReturnType<typeof buildGoogleMapsLinks>;
  fromGoogle: boolean;
};

type SiteSettingsInput = {
  mapUrl?: string | null;
  googlePlaceFeatureId?: string | null;
  googlePlaceId?: string | null;
  googleReviewsUrl?: string | null;
};

type PlacesReview = {
  rating?: number;
  text?: { text?: string };
  relativePublishTimeDescription?: string;
  publishTime?: string;
  authorAttribution?: { displayName?: string };
};

type PlacesSearchResponse = {
  places?: Array<{
    id?: string;
    rating?: number;
    userRatingCount?: number;
    reviews?: PlacesReview[];
    googleMapsLinks?: {
      reviewsUri?: string;
      writeAReviewUri?: string;
      placeUri?: string;
    };
  }>;
};

type PlacesDetailsResponse = {
  id?: string;
  rating?: number;
  userRatingCount?: number;
  reviews?: PlacesReview[];
  googleMapsLinks?: {
    reviewsUri?: string;
    writeAReviewUri?: string;
    placeUri?: string;
  };
};

function mapReview(review: PlacesReview): GoogleReviewItem | null {
  const text = review.text?.text?.trim();
  const name = review.authorAttribution?.displayName?.trim();
  if (!text || !name || !review.rating) {
    return null;
  }

  return {
    name,
    rating: review.rating,
    date: review.relativePublishTimeDescription ?? "",
    text,
    source: "Google",
  };
}

async function searchPlaceId(apiKey: string): Promise<string | null> {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id",
    },
    body: JSON.stringify({
      textQuery: "Ay'La Food & More Alanya",
      locationBias: {
        circle: {
          center: { latitude: 36.5484256, longitude: 31.9945747 },
          radius: 1200,
        },
      },
      maxResultCount: 1,
    }),
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as PlacesSearchResponse;
  return data.places?.[0]?.id?.replace(/^places\//, "") ?? null;
}

async function fetchPlacePayload(
  apiKey: string,
  placeId: string
): Promise<PlacesDetailsResponse | null> {
  const normalizedId = placeId.replace(/^places\//, "");
  const response = await fetch(
    `https://places.googleapis.com/v1/places/${normalizedId}`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "id,rating,userRatingCount,reviews,googleMapsLinks",
      },
      next: { revalidate: 3600 },
    }
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PlacesDetailsResponse;
}

const cachedGoogleReviews = unstable_cache(
  async (
    placeId: string,
    featureId: string,
    mapUrl: string,
    customReviewsUrl: string
  ): Promise<GoogleReviewSummary> => {
    const links = buildGoogleMapsLinks({
      mapUrl,
      googlePlaceFeatureId: featureId,
      googlePlaceId: placeId,
      googleReviewsUrl: customReviewsUrl,
    });

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return {
        rating: null,
        reviewCount: null,
        reviews: [],
        links,
        fromGoogle: false,
      };
    }

    let resolvedPlaceId = placeId;
    if (!resolvedPlaceId) {
      resolvedPlaceId = (await searchPlaceId(apiKey)) ?? "";
    }

    if (!resolvedPlaceId) {
      return {
        rating: null,
        reviewCount: null,
        reviews: [],
        links,
        fromGoogle: false,
      };
    }

    const payload = await fetchPlacePayload(apiKey, resolvedPlaceId);
    if (!payload) {
      return {
        rating: null,
        reviewCount: null,
        reviews: [],
        links,
        fromGoogle: false,
      };
    }

    const apiLinks = payload.googleMapsLinks;
    const mergedLinks = buildGoogleMapsLinks({
      mapUrl: apiLinks?.placeUri ?? mapUrl,
      googlePlaceFeatureId: featureId,
      googlePlaceId: resolvedPlaceId,
      googleReviewsUrl: isUsableHttpUrl(apiLinks?.writeAReviewUri)
        ? apiLinks?.writeAReviewUri
        : isUsableHttpUrl(customReviewsUrl)
          ? customReviewsUrl
          : null,
    });

    if (isUsableHttpUrl(apiLinks?.reviewsUri)) {
      mergedLinks.reviewsUrl = apiLinks!.reviewsUri!;
    }
    if (isUsableHttpUrl(apiLinks?.writeAReviewUri)) {
      mergedLinks.writeReviewUrl = apiLinks!.writeAReviewUri!;
    }

    const reviews =
      payload.reviews
        ?.map(mapReview)
        .filter((item): item is GoogleReviewItem => item !== null) ?? [];

    const hasLiveStats =
      payload.rating != null || payload.userRatingCount != null;

    return {
      rating: payload.rating ?? null,
      reviewCount: payload.userRatingCount ?? null,
      reviews,
      links: mergedLinks,
      fromGoogle: reviews.length > 0 || hasLiveStats,
    };
  },
  ["google-place-reviews-v2"],
  { revalidate: 3600 }
);

export async function getGoogleReviewSummary(
  settings: SiteSettingsInput
): Promise<GoogleReviewSummary> {
  const featureId = settings.googlePlaceFeatureId?.trim() || DEFAULT_GOOGLE_FEATURE_ID;
  const mapUrl = settings.mapUrl?.trim() ?? "";
  const placeId = normalizeGooglePlaceId(settings.googlePlaceId);
  const customReviewsUrl = isUsableHttpUrl(settings.googleReviewsUrl)
    ? settings.googleReviewsUrl!.trim()
    : "";

  return cachedGoogleReviews(placeId, featureId, mapUrl, customReviewsUrl);
}
