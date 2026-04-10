"use client";

import Link from "next/link";
import { CgChevronRight } from "react-icons/cg";

type Product = {
    id: string;
    title: string;
    handle: string;
    categories?: Array<{
        handle?: string;
    }>;
};

type SearchListingProps = {
    results: Product[];
    loading?: boolean;
};

const SearchListing = ({ results, loading }: SearchListingProps) => {
    return (
        <section className="search-listing-section">
            <div className="container-custom mx-auto">
                <div className="search-listing-results-wrapper">

                    {loading && (
                        <div className="searchbar-window-loading">
                            Searching...
                        </div>
                    )}

                    {!loading && results.length === 0 && (
                        <div className="searchbar-window-empty">
                            No results found
                        </div>
                    )}

                    {!loading &&
                        results.map((product) => {
                            const categoryHandle = product.categories?.[0]?.handle || "general";

                            return (
                                <Link
                                    key={product.id}
                                    href={`/voucher/${categoryHandle}/${product.handle}`}
                                    className="searchbar-window-item"
                                >
                                    <span>{product.title}</span>
                                    <CgChevronRight />
                                </Link>
                            );
                        })}

                </div>
            </div>
        </section>
    );
};

export default SearchListing;
