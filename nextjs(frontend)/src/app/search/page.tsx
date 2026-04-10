"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SearchBanner from "@/app/components/SearchBanner/SearchBanner";
import SearchListing from "@/app/components/SearchListing/SearchListing";
import SearchContact from "@/app/components/SearchContact/SearchContact";
import { useContact } from "@/app/context/contact-context";

type Product = {
    id: string;
    title: string;
    handle: string;
    categories?: Array<{
        handle?: string;
    }>;
};

const SearchPageContent = () => {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";


    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const { contactData } = useContact();
    useEffect(() => {
        if (!query) return;

        async function fetchSearch() {
            try {
                setLoading(true);

                const res = await fetch(`/api/search?q=${query}`);
                const data = await res.json();


                const rawProducts = data.products || [];

                const filteredProducts = rawProducts.filter((product: any) => {
                    const text = `${product.title || ""} ${product.handle || ""}`.toLowerCase();
                    return !text.includes("international");
                });

                setResults(filteredProducts);


            } catch (err) {
                console.error("Search error:", err);
            }

            setLoading(false);
        }

        fetchSearch();
    }, [query]);

    console.log("results : ", results)
    return (
        <>
            <SearchBanner
                query={query}
                resultsCount={results.length}
            />

            <SearchListing
                results={results}
                loading={loading}
            />

            <SearchContact contactInfoData={contactData} />
        </>
    );
};

const Page = () => {
    return (
        <Suspense fallback={null}>
            <SearchPageContent />
        </Suspense>
    );
};

export default Page;
