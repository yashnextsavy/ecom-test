"use client";

import { useState, useRef, useEffect } from "react"; import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import { CgChevronRight } from "react-icons/cg";

type SearchBannerProps = {
    query: string;
    resultsCount: number;
};

const NotFoundSearchBanner = ({ query, resultsCount }: SearchBannerProps) => {
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState(query || "");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSearchWindow, setShowSearchWindow] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchType, setSearchType] = useState<"voucher" | "technical">("voucher");


    const searchRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node)
            ) {
                setShowSearchWindow(false);
                setIsSearchActive(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    // useEffect(() => {

    //     if (searchQuery.trim().length < 2) {
    //         setSearchResults([]);
    //         setShowSearchWindow(false);
    //         return;
    //     }

    //     const delayDebounce = setTimeout(async () => {

    //         try {

    //             setSearchLoading(true);
    //             const endpoint =
    //                 searchType === "voucher"
    //                     ? `/api/search?q=${searchQuery}`
    //                     : `/api/technical-search?q=${searchQuery}`;


    //             const res = await fetch(endpoint);

    //             if (!res.ok) {
    //                 console.error("Search API error:", res.status);
    //                 setSearchResults([]);
    //                 setSearchLoading(false);
    //                 return;
    //             }

    //             const text = await res.text();

    //             if (!text) {
    //                 setSearchResults([]);
    //                 setSearchLoading(false);
    //                 return;
    //             }

    //             const data = JSON.parse(text);



    //             const rawResults =
    //                 data.products ?? data.results ?? data?.data?.results ?? [];

    //             // const results = Array.isArray(rawResults) ? rawResults : [];
    //             // setSearchResults(results);
    //             const results = Array.isArray(rawResults) ? rawResults : [];

    //             const filteredResults = results.filter((item: any) => {
    //                 const text = `${item.title || item.handle || item.question || ""}`.toLowerCase();
    //                 return !text.includes("international");
    //             });

    //             setSearchResults(filteredResults);

    //             setShowSearchWindow(true);
    //             setSearchLoading(false);

    //         } catch (err) {

    //             console.error("Search error:", err);

    //         }

    //     }, 350);

    //     return () => clearTimeout(delayDebounce);

    // }, [searchQuery, searchType]);

    useEffect(() => {
        // if query is too short, clear results
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            setShowSearchWindow(false);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            try {
                setSearchLoading(true);

                // pick endpoint based on searchType
                const endpoint =
                    searchType === "voucher"
                        ? `/api/search?q=${searchQuery}`
                        : `/api/technical-search?q=${searchQuery}`;

                const res = await fetch(endpoint);

                if (!res.ok) {
                    console.error("Search API error:", res.status);
                    setSearchResults([]);
                    setSearchLoading(false);
                    return;
                }

                const data = await res.json();

                let results: any[] = [];

                if (searchType === "voucher") {
                    // voucher search returns 'products' array
                    results = data.products ?? [];
                } else {
                    // technical search returns data.results.results array
                    results = data.results?.results ?? [];
                }


                const filteredResults = results.filter((item: any) => {
                    const text = `${item.title || item.handle || item.question || ""}`.toLowerCase();
                    return !text.includes("international");
                });

                setSearchResults(filteredResults);
                setShowSearchWindow(true);
                setSearchLoading(false);

            } catch (err) {
                console.error("Search error:", err);
                setSearchLoading(false);
            }
        }, 350);

        return () => clearTimeout(delayDebounce);

    }, [searchQuery, searchType]);


    let message = "";

    if (!query) {
        message = "Search for exam vouchers, certifications, or vendors.";
    } else if (resultsCount === 0) {
        message = `No Results found for "${query}".`;
    } else {
        message = `${resultsCount} Search Result${resultsCount === 1 ? "" : "s"} found for "${query}"`;
    }

    const handleSearch = () => {
        if (!searchQuery.trim()) return;

        if (searchType !== "voucher") {
            return;
        }

        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    };

    const resetSearch = () => {
        setSearchQuery("");
        setSearchResults([]);
        setShowSearchWindow(false);
    };

    const handleSearchActive = () => {
        setIsSearchActive(true);

        if (searchQuery.trim().length > 0) {
            setShowSearchWindow(true);
        }
    };

    useEffect(() => {
        setSearchResults([]);
        setShowSearchWindow(false);
    }, [searchType]);


    return (
        <section className="search-page-section">
            <div className="container-custom mx-auto">
                <div className="search-page-banner-header not-found-page">
                    <div className="not-found-page-title-info">
                        <h1>Can’t Find That Page</h1>
                        <p>Looks like this page isn’t available, but you’re not stuck. </p>
                    </div>

                    <div className="banner-search-wrapper">

                        <div className="search-type-selector">

                            <label className="search-type-option">
                                <input
                                    type="radio"
                                    name="searchType"
                                    value="voucher"
                                    checked={searchType === "voucher"}
                                    onChange={() => setSearchType("voucher")}
                                />
                                <span className="custom-radio"></span>
                                Search for a Voucher
                            </label>

                            <label className="search-type-option">
                                <input
                                    type="radio"
                                    name="searchType"
                                    value="technical"
                                    checked={searchType === "technical"}
                                    onChange={() => setSearchType("technical")}
                                />
                                <span className="custom-radio"></span>
                                Search for a Technical Answer
                            </label>

                        </div>

                        <div
                            ref={searchRef}
                            onClick={handleSearchActive}
                            className={`header-searchbar ${isSearchActive ? "active" : ""}`}
                        >
                            {showSearchWindow && (
                                <div className="searchbar-window-wrapper">
                                    <div className="searchbar-window">
                                        <div className="searchbar-window-content">

                                            {searchLoading && (
                                                <div className="searchbar-window-loading">
                                                    Searching...
                                                </div>
                                            )}

                                            {!searchLoading && searchResults.length === 0 && (
                                                <div className="searchbar-window-empty">
                                                    No results found
                                                </div>
                                            )}

                                            {/* {!searchLoading && searchResults.length > 0 &&
                                                searchResults.map((product) => {

                                                    const categoryHandle =
                                                        product.categories && product.categories.length > 0
                                                            ? product.categories[0].handle
                                                            : "vouchers";

                                                    return (
                                                        <Link
                                                            key={product.id}
                                                            href={
                                                                searchType === "voucher"
                                                                    ? `/voucher/${categoryHandle}/${product.handle}`
                                                                    : `/faq?q=${encodeURIComponent(product.question)}`
                                                            }
                                                            className="searchbar-window-item"
                                                            onClick={resetSearch}
                                                        >
                                                            <span>
                                                                {searchType === "voucher"
                                                                    ? product.title
                                                                    : product.question}
                                                            </span>

                                                            <CgChevronRight />
                                                        </Link>
                                                    );
                                                })
                                            } */}
                                            {!searchLoading && searchResults.length > 0 &&
                                                searchResults.map((product) => {
                                                    const categoryHandle =
                                                        product.categories && product.categories.length > 0
                                                            ? product.categories[0].handle
                                                            : "voucher";

                                                    // if voucher, use link, if technical, use div
                                                    if (searchType === "voucher") {
                                                        return (
                                                            <Link
                                                                key={product.id}
                                                                href={`/voucher/${categoryHandle}/${product.handle}`}
                                                                className="searchbar-window-item"
                                                                onClick={resetSearch}
                                                            >
                                                                <span>{product.title}</span>
                                                                <CgChevronRight />
                                                            </Link>
                                                        );
                                                    } else {

                                                        return (
                                                            <div
                                                                key={product.id}
                                                                className="searchbar-window-item cursor-default"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <span>{product.question}</span>
                                                                <CgChevronRight />
                                                            </div>
                                                        );
                                                    }
                                                })
                                            }

                                        </div>
                                    </div>
                                </div>
                            )}

                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setSearchQuery(value);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSearch();
                                }}
                                placeholder={
                                    searchType === "voucher"
                                        ? "Search for vouchers, exams..."
                                        : "Search for technical questions, answers..."
                                }
                                className="flex-1 outline-none text-sm bg-transparent"
                            />

                            <button onClick={handleSearch} className="searchbar-search-btn">
                                <FiSearch className="text-white" size={16} />
                            </button>

                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default NotFoundSearchBanner;