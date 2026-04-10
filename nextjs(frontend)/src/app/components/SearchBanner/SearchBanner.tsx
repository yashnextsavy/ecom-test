import React from "react";

type SearchBannerProps = {
    query: string;
    resultsCount: number;
};

const SearchBanner = ({ query, resultsCount }: SearchBannerProps) => {
    let message = "";

    if (!query) {
        message = "Search for exam vouchers, certifications, or vendors.";
    } else if (resultsCount === 0) {
        message = `No Results found for "${query}".`;
    } else {
        message = `${resultsCount} Search Result${resultsCount === 1 ? "" : "s"} found for "${query}"`;
    }

    return (
        <section className="search-page-section">
            <div className="container-custom mx-auto">
                <div className="search-page-banner-header">
                    <h1>{message}</h1>
                </div>
            </div>
        </section>
    );
};

export default SearchBanner;