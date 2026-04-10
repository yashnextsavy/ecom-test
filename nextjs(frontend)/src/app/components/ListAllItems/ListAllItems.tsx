"use client";

import Image from "next/image";
import Link from "next/link";
import { HiChevronRight } from "react-icons/hi2";

type Category = {
    id: string;
    name: string;
    handle: string;
    media?: { url: string }[];
};

type Product = {
    id: string;
    title: string;
    handle: string;
    best_seller: boolean;
    organize?: {
        categories?: Array<{
            handle?: string;
        }>;
    };
};

type Props = {
    items: Category[];
    bestSellers: Product[];
};

export default function ListAllItems({ items, bestSellers }: Props) {
    return (
        <section className="list-all-items-section">
            <div className="container-custom">
                <div className="list-all-items-content-wrapper">

                    {/* LEFT SIDE - Certified Vendors */}
                    <div className="list-column vendors-column">
                        <h2>Certified Vendors</h2>

                        <div className="vendors-grid">
                            {items.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/voucher/${item.handle}`}
                                    className="list-item"
                                >
                                    <div className="list-item-left">
                                        {item.media?.[0]?.url && (
                                            <img
                                                src={item.media[0].url}
                                                alt={item.name}
                                                width={26}
                                                height={26}
                                            />
                                        )}
                                        {/* <span>{item.name}</span> */}
                                    </div>

                                    <HiChevronRight className="chevron-icon" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT SIDE - Best Selling Vouchers */}
                    <div className="list-column best-selling-vouchers">
                        <h2>Best Selling Vouchers</h2>

                        {bestSellers.map((product) => {
                            const categoryHandle = product.organize?.categories?.[0]?.handle || "general";

                            return (
                                <Link
                                    key={product.id}
                                    href={`/voucher/${categoryHandle}/${product.handle}`}
                                    className="list-item"
                                >
                                    <span>{product.title}</span>
                                    <HiChevronRight className="chevron-icon" />
                                </Link>
                            );
                        })}
                    </div>

                </div>
            </div>
        </section>
    );
}
