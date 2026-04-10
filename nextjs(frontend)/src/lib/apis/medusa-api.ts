import "server-only";
import { fetchJson } from "@/lib/server/http-client";

const MEDUSA_DEFAULT_BASE_URL = process.env.MEDUSA_API_BASE_URL || "http://localhost:9000";
const MEDUSA_PUBLISHABLE_API_KEY = process.env.MEDUSA_PUBLISHABLE_API_KEY;

export const MEDUSA_API_BASE_URL =
  process.env.MEDUSA_API_BASE_URL ??
  MEDUSA_DEFAULT_BASE_URL;

export const MEDUSA_API_PATHS = {
  login: "/auth/user/emailpass",
  profile: "/static/profile",
  productCategories: "/store/product-categories",
  trendingOffers: "/store/trending-offers",
  products: "/store/products",
  productCategoryList: "/store/product-list",
  productDetails: "/store/product-details",
  internationalCategories: "/store/international-categories",
  internationalProducts: "/store/international-product-list",
  search: "/store/search",
  carts: "/store/carts",
} as const;

export const getMedusaApiUrl = (path: string) => `${MEDUSA_API_BASE_URL}${path}`;

export const getMedusaProductCategoryDetailsPath = (categoryId: string) =>
  `/store/product-categories/${categoryId}`;

export const getMedusaProductDetailsPath = (productId: string) =>
  `/store/products/${productId}`;

export const getMedusaAuthHeaders = ({
  token,
  publishableApiKey,
}: {
  token?: string;
  publishableApiKey?: string;
}) => {
  const resolvedPublishableApiKey =
    publishableApiKey ?? MEDUSA_PUBLISHABLE_API_KEY;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (resolvedPublishableApiKey) {
    headers["x-publishable-api-key"] = resolvedPublishableApiKey;
  }

  return headers;
};


export interface CategoryMedia {
  id: string;
  url: string;
}

export interface ProductCategoryExtended {
  id: string;
  name: string;
  description: string;
  handle: string;
  rank: number;
  parent_category_id: string | null;
  created_at: string;
  updated_at: string;

  metadata?: {
    offer_badge_text?: string;
    additional_information?: {
      title?: string;
      description?: string;
      exam_information?: unknown[];
      certification_levels?: unknown[];
    };
  };

  parent_category: null;
  category_children: unknown[];

  media: CategoryMedia[];

  offer_badge?: string;
  offer_badge_text?: string;
  category_img?: string;

  additional_information?: {
    title?: string;
    description?: string;
    exam_information?: unknown[];
    certification_levels?: unknown[];
  };
}

export interface ProductCategoriesResponse {
  product_categories: ProductCategoryExtended[];
}

export interface TrendingOfferCategory {
  id: string;
  name: string;
  handle: string;
  offer_badge_text?: string;
  category_img?: string;
}

export interface TrendingOffersResponse {
  product_categories: TrendingOfferCategory[];
  count?: number;
}



export interface ExamSeries {
  id: string;
  title: string;
}

export interface ProductPrice {
  currency_code: string;
  price: string;
  our_price: string;
  actual_price: string;
}
export interface ProductCardListingCategory {
  id?: string;
  name: string;
  description?: string;
  media?: CategoryMedia[];
  faq_section?: {
    title?: string;
    description?: string;
  };
  faq?: Array<{
    question: string;
    answer: string;
  }>;
}

export interface ProductSeo {
  meta_title?: string;
  meta_description?: string;
  keywords?: string[] | string;
}

export interface ProductDetailsInformationBlock {
  title?: string;
  description?: string;
}

export interface ProductDetailsInformation {
  validity_information?: ProductDetailsInformationBlock;
  delivery_information?: ProductDetailsInformationBlock;
  additional_information?: ProductDetailsInformationBlock;
}
export interface ProductCardListing {
  id: string;
  title: string;
  status: string;
  thumbnail?: string;
  fallbackDescription?: string;
  variants?: Array<{ id: string }>;
  region_id?: string;
  sales_channel_id?: string;
  handle: string;
  examSeries?: ExamSeries[];
  exam_series?: ExamSeries[];
  prices?: ProductPrice[];
  image: string;
  categories: ProductCardListingCategory[];
  category?: ProductCardListingCategory[];
  details_information?: ProductDetailsInformation;
  seo?: ProductSeo;
  imageAlt?: string;
  viewLink: string;
  cartLink: string;
  is_out_of_stock: boolean;
}

export interface AdditionalInformation {
  title: string;
  description: string;
  exam_information: {
    title: string;
    description: string;
    values: string[];
  }[];
  certification_levels: {
    title: string;
    description: string;
    values: string[];
  }[];
}


export interface CategorySideSection {
  title?: string
  description?: string
}
export interface ListingPageBanner {
  title?: string;
  description?: string;
  button_1_text?: string;
  button_1_link?: string;
  button_2_text?: string;
  button_2_link?: string;
}
export interface ProductCategory {
  id?: string;
  name?: string;
  listing_page_side_section?: CategorySideSection
  listing_page_banner?: ListingPageBanner
  additional_information?: AdditionalInformation
  faq_section?: {
    title?: string;
    description?: string;
  };
  faq?: Array<{
    question: string;
    answer: string;
  }>;
}

export interface ProductCategoryListResponse {
  products: ProductCardListing[];
  categories?: ProductCategory[];
  filters?: {
    category_handles?: string[];
  };
  additional_information: AdditionalInformation;
}




export const medusaRequest = async <T = unknown>(
  path: string,
  options?: Omit<RequestInit, "headers" | "body"> & {
    token?: string;
    publishableApiKey?: string;
    body?: unknown;
    headers?: Record<string, string>;
  }
) => {
  const { token, publishableApiKey, headers, ...requestOptions } = options ?? {};

  return fetchJson<T>(getMedusaApiUrl(path), {
    ...requestOptions,
    headers: {
      ...headers,
      ...getMedusaAuthHeaders({ token, publishableApiKey }),
    },
    cache: "no-store", // Medusa data is core/volatile for ecommerce.
  });
};

// export const getMedusaProductCategories = async () => {
//   return medusaRequest(MEDUSA_API_PATHS.productCategories, {
//     method: "GET",
//   });
// };

export const getMedusaProductCategories =
  async (): Promise<ProductCategoriesResponse> => {
    return (
      await medusaRequest<ProductCategoriesResponse>(
        MEDUSA_API_PATHS.productCategories,
        {
          method: "GET",
        }
      )) ?? { product_categories: [] };
  };

export const getMedusaTrendingOffers =
  async (): Promise<TrendingOffersResponse> => {
    return (
      await medusaRequest<TrendingOffersResponse>(MEDUSA_API_PATHS.trendingOffers, {
        method: "GET",
      })
    ) ?? { product_categories: [], count: 0 };
  };

export const getMedusaProductCategoryDetails = async (categoryId: string) => {
  return medusaRequest(getMedusaProductCategoryDetailsPath(categoryId), {
    method: "GET",
  });
};

export const getMedusaProductDetails = async (productId: string) => {
  return medusaRequest(getMedusaProductDetailsPath(productId), {
    method: "GET",
  });
};



export const getMedusaProductCategoryListByCategorySlug = async (
  categorySlug: string
): Promise<ProductCategoryListResponse> => {
  const normalizedSlug = categorySlug.trim();

  if (!normalizedSlug) {
    throw new Error("categorySlug is required");
  }

  const query = new URLSearchParams({
    category_slug: normalizedSlug,
  });
  const path = `${MEDUSA_API_PATHS.productCategoryList}?${query.toString()}`;

  return (
    await medusaRequest<ProductCategoryListResponse>(path, {
      method: "GET",
    })
  ) ?? {
    products: [],
    additional_information: {
      title: "",
      description: "",
      exam_information: [],
      certification_levels: [],
    },
  };
};


export const getMedusaProductDetailsByHandle = async (
  handle: string
): Promise<ProductCardListing | null> => {
  if (!handle) {
    throw new Error("Product handle is required");
  }

  const path = `${MEDUSA_API_PATHS.productDetails}/${handle}`;

  const response = await medusaRequest<{ product: ProductCardListing } | null>(path, {
    method: "GET",
  });

  if (!response) {
    return null;
  }

  return response.product;
};



export interface InternationalCategoriesResponse {
  categories?: ProductCategoryExtended[];
  product_categories?: ProductCategoryExtended[];
}

export const getMedusaInternationalCategories =
  async (): Promise<InternationalCategoriesResponse> => {
    return (
      await medusaRequest<InternationalCategoriesResponse>(
        MEDUSA_API_PATHS.internationalCategories,
        {
          method: "GET",
        }
      )) ?? { categories: [], product_categories: [] };
  };


export const getMedusaInternationalProductsByCategorySlug = async (
  categorySlug: string
): Promise<ProductCategoryListResponse> => {
  const normalizedSlug = categorySlug.trim();

  if (!normalizedSlug) {
    throw new Error("categorySlug is required");
  }

  const params = new URLSearchParams({
    category_slug: normalizedSlug,
  });

  const path = `${MEDUSA_API_PATHS.internationalProducts}?${params.toString()}`;

  return (
    await medusaRequest<ProductCategoryListResponse>(path, {
      method: "GET",
    })
  ) ?? {
    products: [],
    additional_information: {
      title: "",
      description: "",
      exam_information: [],
      certification_levels: [],
    },
  };
};



export interface MedusaSearchResponse {
  products: ProductCardListing[];
}

export const searchMedusaProducts = async (
  query: string
): Promise<MedusaSearchResponse> => {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return { products: [] };
  }

  const params = new URLSearchParams({
    q: normalizedQuery,
  });

  const path = `${MEDUSA_API_PATHS.search}?${params.toString()}`;

  return (
    await medusaRequest<MedusaSearchResponse>(path, {
      method: "GET",
    })
  ) ?? { products: [] };
};


export const createMedusaCart = async (variantId: string) => {
  return medusaRequest<{ cart: any }>(MEDUSA_API_PATHS.carts, {
    method: "POST",
    body: {
      region_id: "reg_01KGPYG739RK5C9N02SCWFEXW1",
      sales_channel_id: "sc_01KGPTNP9JY4KGVR5C0T5YW76J",
      items: [
        {
          variant_id: variantId,
          quantity: 1,
        },
      ],
    },
  });
};

export const getMedusaCart = async (cartId: string) => {
  return medusaRequest<{ cart: any }>(
    `${MEDUSA_API_PATHS.carts}/${cartId}`,
    {
      method: "GET",
    }
  );
};

export const addMedusaLineItem = async (
  cartId: string,
  variantId: string
) => {
  return medusaRequest(
    `${MEDUSA_API_PATHS.carts}/${cartId}/line-items`,
    {
      method: "POST",
      body: {
        variant_id: variantId,
        quantity: 1,
      },
    }
  );
};



export const getMedusaRelatedVouchers = async (
  categorySlugs: string[]
): Promise<{ products: ProductCardListing[] }> => {
  if (!categorySlugs?.length) {
    return { products: [] }
  }

  const params = new URLSearchParams({
    category_slug: categorySlugs.join(","),
  })

  const path = `/store/you-may-also-like?${params.toString()}`

  return (
    await medusaRequest<{ products: ProductCardListing[] }>(path, {
      method: "GET",
    })
  ) ?? { products: [] }
}
