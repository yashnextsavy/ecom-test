import Image from "next/image";
import Link from "next/link";
import React from "react";
import AddToCartButton from "../AddToCartButton/AddToCartButton";
// import { useCart } from "@/app/context/CartContext"


export interface ProductCardProps {
  id: string;
  variant_id: string;
  region_id: string
  sales_channel_id: string
  title: string;
  image: string;
  imageAlt?: string;
  examSeries: Array<string | { title?: string }>;
  actualPrice: string;
  discountedPrice: string;
  currency?: string;
  discountPercentage?: number;
  viewLink: string;
  cartLink: string;
  slug: string;
  examSeriesText?: string;
  isOutOfStock?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  variant_id,
  region_id,
  sales_channel_id,
  title,
  image,
  imageAlt = "product",
  examSeries,
  actualPrice,
  discountedPrice,
  currency = "₹",
  discountPercentage,
  viewLink,
  slug,
  cartLink,
  examSeriesText,
  isOutOfStock
}) => {


  const encodedImage = encodeURI(image);
  const safeImageUrl = image.replace(/ /g, "%20");
  // console.log("inside card imag: ", encodedImage);
  const formatPrice = (price: number | string) => {
    const numericPrice =
      typeof price === "number" ? price : Number(String(price).replace(/,/g, ""));

    if (Number.isNaN(numericPrice)) {
      return `${currency}${price}`;
    }

    return `${currency}${numericPrice.toLocaleString("en-IN")}`;
  };

  // const { openCart } = useCart()
  // const handleAddToCart = async () => {
  // openCart()
  // }
  const numericActual = Number(String(actualPrice).replace(/,/g, ""));
  const numericDiscounted = Number(String(discountedPrice).replace(/,/g, ""));

  const hasValidDiscount =
    !Number.isNaN(numericActual) &&
    !Number.isNaN(numericDiscounted) &&
    numericDiscounted < numericActual;

  return (
    <div className="product-card-wrapper">
      <div className="product-card-body">
        <div className="product-card-cutout-wrapper">
          <span className="product-card-cutout"></span>
        </div>

        {/* Discount Tag (Only If Exists) */}
        {Number(discountPercentage) > 0 && (
          <div className="product-card-discount-tag">
            <span>{discountPercentage}% OFF</span>
          </div>
        )}

        {/* Image Section */}
        <div className="product-card-hero">
          <div className="product-card-image-wrapper">
            <Image
              className="object-contain"
              src={safeImageUrl}
              alt={imageAlt}
              width={210}
              height={77}
              unoptimized
            />
          </div>
        </div>

        {/* Bottom Content */}
        <div className="product-card-main-content">
          <div className="product-card-title">
            <div className="product-card-title-heading">{title}</div>

            {examSeries.length > 0 && (
              <div className="product-valid-exam-series">
                {examSeriesText}



                <ul>
                  {examSeries.map((series, index) => (
                    <li key={index}>
                      {typeof series === "string" ? series : series?.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="product-price-card">
            <div className="card-product-price-wrapper">
              <div
                className="card-product-price product-price-actual-price"
                style={
                  hasValidDiscount
                    ? {}
                    : { opacity: 0, visibility: "hidden" }
                }
              >
                <p>Actual price</p>
                <h3>{formatPrice(actualPrice)}</h3>
              </div>

              <div className="card-product-price product-price-discounted-price">
                <p>{hasValidDiscount ? "Discounted price" : "Voucher price"}</p>
                <h3>
                  {formatPrice(
                    hasValidDiscount ? discountedPrice : actualPrice
                  )}
                </h3>
              </div>
            </div>

            <span className="price-terms-quote">
              *The above-quoted prices are inclusive of GST.
            </span>

            <div className="product-card-buttons-wrapper">
              <AddToCartButton
                variantId={variant_id}
                productId={id}
                regionId={region_id}
                salesChannelId={sales_channel_id}
                isOutOfStock={isOutOfStock}
              />

              <Link
                href={`/voucher/${slug}/${viewLink}`}
                className="card-button-secondary"
              >
                View details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
