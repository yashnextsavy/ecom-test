"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
// import { HiOutlineChevronRight } from "react-icons/hi";
import { FaChevronDown, FaChevronRight } from "react-icons/fa6";
import { FiSearch } from "react-icons/fi";
import { LuUser } from "react-icons/lu";
import { BsCart3 } from "react-icons/bs";
import Link from "next/link";
import { LuPlus } from "react-icons/lu";
import { GoSearch } from "react-icons/go";
import { FiPhone } from "react-icons/fi";
import { FaWhatsapp, FaChevronLeft } from "react-icons/fa";
import { CgChevronRight, } from "react-icons/cg";
import { RxCross2 } from "react-icons/rx";
import { useCart } from "@/app/context/CartContext";


type Certification = {
    id: string;
    title: string;
    slug: string;
};


type Product = {
    id: string
    handle: string
    title: string
}

type Category = {
    id: string
    name: string
    handle: string
    media?: {
        url: string
    }[]
    products?: Product[]
}

type HeaderProps = {
    categories: Category[]
    contactData?: {
        contactDetails?: {
            whatsappNumber?: string
            callNumber?: string
        }
    }
}

export default function Header({ categories, contactData }: HeaderProps) {

    const [openMega, setOpenMega] = useState(false);
    // const [activeVendor, setActiveVendor] = useState<Vendor | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState("");
    const router = useRouter();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [isVoucherVisible, setIsVoucherVisible] = useState(true);
    const [isVoucherHidden, setIsVoucherHidden] = useState(false);
    const [voucherProducts, setVoucherProducts] = useState<any[]>([])
    const [loadingProducts, setLoadingProducts] = useState(false)
    const [activeVendor, setActiveVendor] = useState<Category | null>(null)
    const showAllLink = activeVendor
        ? `/voucher/${activeVendor.handle}`
        : '/vendors' // fallback


    const [mobileLevel, setMobileLevel] = useState(0);
    // 0 = main
    // 1 = categories
    // 2 = products
    const [selectedVendor, setSelectedVendor] = useState<Category | null>(null);

    const [mobileDirection, setMobileDirection] = useState<
        "forward" | "back" | null
    >(null);

    const listRef = useRef<HTMLDivElement | null>(null)
    const mobileMenuRef = useRef<HTMLDivElement | null>(null)

    const [showMobileListFade, setShowMobileListFade] = useState(false);


    const { openCart } = useCart()


    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showSearchWindow, setShowSearchWindow] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const { cart } = useCart()


    const cartItemCount = cart?.items?.reduce(
        (total: number, item: any) => total + item.quantity,
        0
    ) ?? 0
    const [hasUserTyped, setHasUserTyped] = useState(false);

    const [showCloseBtn, setShowCloseBtn] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;

        if (isSearchActive) {
            timer = setTimeout(() => {
                setShowCloseBtn(true);
            }, 40);
        } else {
            setShowCloseBtn(false);
        }

        return () => {
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [isSearchActive]);



    useEffect(() => {
        //  block auto suggestions after navigation
        if (!hasUserTyped) return;

        if (query.trim().length < 2) {
            setSearchResults([]);
            setShowSearchWindow(false);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            try {
                setSearchLoading(true);

                const res = await fetch(`/api/search?q=${query}`);
                const data = await res.json();

                // console.log("RAW SEARCH RESPONSE:#######", data);
                // // optional deeper inspection
                // console.log("ALL PRODUCTS: ########", data.products);


                console.log("RAW SEARCH RESPONSE:", data);

                const rawProducts = data.products || [];

                const filteredProducts = rawProducts.filter((product: any) => {
                    const text = `${product.title || ""} ${product.handle || ""}`.toLowerCase();
                    return !text.includes("international");
                });

                console.log("AFTER FILTER:", filteredProducts);

                setSearchResults(filteredProducts);

                setShowSearchWindow(true);

            } catch (err) {
                console.error("SEARCH ERROR:", err);
            }

            setSearchLoading(false);
        }, 350);

        return () => clearTimeout(delayDebounce);

    }, [query, hasUserTyped]);



    useEffect(() => {

        function handleClickOutside(event: MouseEvent) {

            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node)
            ) {
                setShowSearchWindow(false);
            }

        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };

    }, []);




    useEffect(() => {
        // close mobile menu
        setMobileMenuOpen(false);
        setMobileLevel(0);
        setSelectedVendor(null);

        // close desktop mega menu
        setOpenMega(false);
        setActiveVendor(null);
    }, [pathname]);

    useEffect(() => {
        if (!activeVendor) return;
        const vendorHandle = activeVendor.handle;

        async function fetchProducts() {
            setLoadingProducts(true);
            try {
                const res = await fetch(`/api/vouchers/${vendorHandle}`);
                if (!res.ok) {
                    throw new Error(`Failed to fetch voucher data: ${res.status}`);
                }
                const data = await res.json();
                console.log("Voucher data:", data);
                setVoucherProducts(data.products || []);
            } catch (err) {
                console.error("Client fetch error:", err);
            }
            setLoadingProducts(false);
        }

        fetchProducts();
    }, [activeVendor]);

    useEffect(() => {
        fetch("/api/vouchers/comptia-exam")
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch voucher data: ${res.status}`);
                }
                return res.json();
            })
            .then(data => console.log("Voucher dataaaaaaaaaaa:", data))
            .catch(err => console.error(err));
    }, []);



    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMega(false);
                setActiveVendor(null);

            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // useEffect(() => {
    //     if (mobileMenuOpen) {
    //         document.body.style.overflow = "hidden";



    //     } else {
    //         document.body.style.overflow = "auto";
    //     }

    //     // Cleanup (important!)
    //     return () => {
    //         document.body.style.overflow = "auto";
    //     };

    // }, [mobileMenuOpen]);


    // useEffect(() => {
    //     if (mobileMenuOpen || openMega) {
    //         document.body.style.overflow = "hidden";
    //     } else {
    //         document.body.style.overflow = "auto";
    //     }

    //     return () => {
    //         document.body.style.overflow = "auto";
    //     };
    // }, [mobileMenuOpen, openMega]);




    // useEffect(() => {
    //     const shouldLock = mobileMenuOpen || openMega;

    //     if (shouldLock) {
    //         const scrollbarWidth =
    //             window.innerWidth - document.documentElement.clientWidth;

    //         document.body.style.overflow = "hidden";
    //         document.body.style.paddingRight = `${scrollbarWidth}px`;
    //     } else {
    //         document.body.style.overflow = "";
    //         document.body.style.paddingRight = "";
    //     }

    //     return () => {
    //         document.body.style.overflow = "";
    //         document.body.style.paddingRight = "";
    //     };
    // }, [mobileMenuOpen, openMega]);

    // useEffect(() => {
    //     const shouldLock = mobileMenuOpen || openMega;

    //     if (!shouldLock) return;

    //     const preventScroll = (e: Event) => {
    //         e.preventDefault();
    //     };

    //     const preventKeyScroll = (e: KeyboardEvent) => {
    //         const keys = [
    //             "ArrowUp",
    //             "ArrowDown",
    //             "PageUp",
    //             "PageDown",
    //             "Home",
    //             "End",
    //             " "
    //         ];

    //         if (keys.includes(e.key)) {
    //             e.preventDefault();
    //         }
    //     };

    //     window.addEventListener("wheel", preventScroll, { passive: false });
    //     window.addEventListener("touchmove", preventScroll, { passive: false });
    //     window.addEventListener("keydown", preventKeyScroll);

    //     return () => {
    //         window.removeEventListener("wheel", preventScroll);
    //         window.removeEventListener("touchmove", preventScroll);
    //         window.removeEventListener("keydown", preventKeyScroll);
    //     };
    // }, [mobileMenuOpen, openMega]);



    // useEffect(() => {
    //     const shouldLock = mobileMenuOpen || openMega;

    //     if (shouldLock) {
    //         const scrollY = window.scrollY;

    //         document.body.style.position = "fixed";
    //         document.body.style.top = `-${scrollY}px`;
    //         document.body.style.width = "100%";

    //         document.body.dataset.scrollY = scrollY.toString();
    //     } else {
    //         const scrollY = document.body.dataset.scrollY;

    //         document.body.style.position = "";
    //         document.body.style.top = "";
    //         document.body.style.width = "";

    //         if (scrollY) {
    //             window.scrollTo(0, parseInt(scrollY));
    //         }
    //     }
    // }, [mobileMenuOpen, openMega]);



    // useEffect(() => {
    //     const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    //     const shouldLock = (mobileMenuOpen || openMega) && isDesktop;

    //     if (!shouldLock) return;

    //     const preventScroll = (e: Event) => {
    //         e.preventDefault();
    //     };

    //     const preventKeyScroll = (e: KeyboardEvent) => {
    //         const keys = [
    //             "ArrowUp",
    //             "ArrowDown",
    //             "PageUp",
    //             "PageDown",
    //             "Home",
    //             "End",
    //             " "
    //         ];

    //         if (keys.includes(e.key)) {
    //             e.preventDefault();
    //         }
    //     };

    //     window.addEventListener("wheel", preventScroll, { passive: false });
    //     window.addEventListener("keydown", preventKeyScroll);

    //     return () => {
    //         window.removeEventListener("wheel", preventScroll);
    //         window.removeEventListener("keydown", preventKeyScroll);
    //     };
    // }, [mobileMenuOpen, openMega]);

    useEffect(() => {
        const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
        const shouldLock = (mobileMenuOpen || openMega) && isDesktop;

        if (!shouldLock) return;

        const isInsideMegaMenu = (target: EventTarget | null) => {
            return (target as HTMLElement)?.closest(".mega-menu-scroll");
        };

        const preventScroll = (e: Event) => {
            if (!isInsideMegaMenu(e.target)) {
                e.preventDefault();
            }
        };

        const preventKeyScroll = (e: KeyboardEvent) => {
            const keys = [
                "ArrowUp",
                "ArrowDown",
                "PageUp",
                "PageDown",
                "Home",
                "End",
                " "
            ];

            if (!keys.includes(e.key)) return;

            const activeElement = document.activeElement;

            if (!isInsideMegaMenu(activeElement)) {
                e.preventDefault();
            }
        };

        window.addEventListener("wheel", preventScroll, { passive: false });
        window.addEventListener("keydown", preventKeyScroll);

        return () => {
            window.removeEventListener("wheel", preventScroll);
            window.removeEventListener("keydown", preventKeyScroll);
        };
    }, [mobileMenuOpen, openMega]);



    useEffect(() => {
        if (mobileDirection === "forward") {
            const timer = setTimeout(() => {
                setMobileDirection(null);
            }, 300); // same as animation duration

            return () => clearTimeout(timer);
        }
    }, [mobileDirection]);


    useEffect(() => {
        const el = mobileMenuRef.current
        if (!el) return

        const checkScroll = () => {
            const hasOverflow = el.scrollHeight > el.clientHeight
            const isNotAtBottom =
                el.scrollTop + el.clientHeight < el.scrollHeight - 2

            setShowMobileListFade(hasOverflow && isNotAtBottom)
        }

        checkScroll()

        el.addEventListener("scroll", checkScroll)

        return () => {
            el.removeEventListener("scroll", checkScroll)
        }
    }, [mobileMenuOpen, mobileLevel])


    // const handleSearch = () => {
    //     if (!query.trim()) return;

    //     setIsSearchActive(true);
    //     setIsVoucherVisible(true);
    //     setIsVoucherHidden(false);

    //     setShowSearchWindow(false);
    //     setSearchResults([]);

    //     setHasUserTyped(false); // 👈 reset so new page doesn't auto-open

    //     router.push(`/search?q=${encodeURIComponent(query)}`);
    // };

    const handleSearch = () => {
        if (!query.trim()) return;

        // execute search
        router.push(`/search?q=${encodeURIComponent(query)}`);

        // close dropdown
        setShowSearchWindow(false);
        setSearchResults([]);

        // reset interaction
        setHasUserTyped(false);

        // ✅ FIX: close active UI
        setIsSearchActive(false);

        // restore header layout
        setIsVoucherVisible(true);
        setIsVoucherHidden(false);
    };

    const handleSearchActive = () => {

        setIsSearchActive(true);
        setIsVoucherVisible(false);
        setTimeout(() => {
            setIsVoucherHidden(true);
        }, 50);


    };


    const closeMegaMenu = () => {
        setOpenMega(false);
        setActiveVendor(null);
    };

    const handleCloseSearch = () => {
        setIsSearchActive(false);
        setIsVoucherHidden(false)
        setTimeout(() => {
            setIsVoucherVisible(true);
        }, 50);


    };



    const handleCouponClick = (categorySlug: string, slug: string) => {
        router.push(`/voucher/${categorySlug}/${slug}`);
    };

    const resetSearch = () => {
        setQuery("");
        setSearchResults([]);
        setShowSearchWindow(false);
        setIsSearchActive(false);

        // restore header layout
        setIsVoucherHidden(false);

        setTimeout(() => {
            setIsVoucherVisible(true);
        }, 50);
    };

    // useEffect(() => {
    //     setIsSearchActive(false);

    //     setIsVoucherHidden(false);

    //     setTimeout(() => {
    //         setIsVoucherVisible(true);
    //     }, 50);

    //     setShowSearchWindow(false);
    //     setSearchResults([]);

    //     setHasUserTyped(false);

    // }, [pathname]);


    useEffect(() => {
        // reset everything on route change
        setIsSearchActive(false);
        setIsVoucherHidden(false);

        setTimeout(() => {
            setIsVoucherVisible(true);
        }, 50);

        // close suggestions
        setShowSearchWindow(false);
        setSearchResults([]);

        // reset typing state
        setHasUserTyped(false);

        // ✅ ADD THIS: reset mobile search state
        setMobileSearchOpen(false);



    }, [pathname]);


    // useEffect(() => {
    //     if (pathname === "/thank-you") {
    //         const timer = setTimeout(() => {
    //             window.location.reload()
    //         }, 1000)

    //         return () => clearTimeout(timer)
    //     }
    // }, [pathname])



    const contact = contactData?.contactDetails;

    const whatsappNumber =
        contact?.whatsappNumber?.replace(/\D/g, "") || "";

    const phoneNumber =
        contact?.callNumber?.replace(/\D/g, "") || "";

    const getCategoryHandle = (product: any) => {
        if (product.categories && product.categories.length > 0) {
            return product.categories[0].handle;
        }
        return "voucher";
    };


    const itemCount = voucherProducts?.length || 0;

    const cols =
        itemCount > 12 ? 3 :
            itemCount > 6 ? 2 :
                1;


    return (
        <header className="header-wrapper ">
            <div className="container-custom mx-auto header-navbar-links-desktop-wrapper ">

                <div ref={menuRef} className="header-navbar-links gap-6 ">



                    <Link href="/" className="header-title-image text-2xl font-bold">
                        <img height={54} width={153} src="/assets/images/header-icon.webp" alt="global it sucesses" />
                    </Link>



                    <div ref={menuRef} className={` header-all-vouchers-wrapper   
                        ${!isVoucherVisible ? "hide" : ""} 
                        ${!isVoucherVisible && isSearchActive && isVoucherHidden ? "hidden" : ""}`
                    }
                    >

                        {openMega && (
                            <div className="mega-menu-wrapper">

                                {/* level 2 footer */}
                                {activeVendor && (

                                    <div className="mega-menu-level-2-footer">

                                        <div style={{ height: "stretch" }}
                                            className="flex overflow-hidden items-center justify-center h-full ">
                                            <button
                                                onClick={() => setActiveVendor(null)}
                                                className="menu-back-btn"
                                            >
                                                <FaChevronLeft className="animate-left-arrow" />
                                                Back to Menu
                                            </button>
                                        </div>


                                        {/* <Link href="/products" className="btn-primary whitespace-nowrap">
                                                Show All Vouchers <span className='inline-button-arrow'> <CgChevronRight className='primary-btn-first-arrow' /> <CgChevronRight className='primary-btn-second-arrow' />  </span>

                                            </Link> */}
                                        <Link href={showAllLink} className="btn-primary whitespace-nowrap">
                                            Show All Vouchers <span className='inline-button-arrow'>
                                                <CgChevronRight className='primary-btn-first-arrow' />
                                                <CgChevronRight className='primary-btn-second-arrow' />
                                            </span>
                                        </Link>

                                    </div>

                                )}


                                <div className="mega-menu-scroll">



                                    {!activeVendor && (
                                        <div className="mega-menu-grid ">
                                            {categories.map((vendor) => (
                                                <div
                                                    key={vendor.id}
                                                    onClick={() => setActiveVendor(vendor)}
                                                    className="mega-menu-grid-item"
                                                >
                                                    <img
                                                        src={vendor?.media?.[0]?.url}
                                                        alt={vendor?.name}
                                                        className="h-8 object-contain header-mega-menu-image"
                                                    />
                                                    <p className="font-semibold"><FaChevronRight />
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}


                                    {activeVendor && (
                                        <div className="mega-menu-level-2">


                                            <div className="mega-menu-level-2-content">
                                                <div className="mega-level-2-image-wrapper">
                                                    <img
                                                        src={activeVendor?.media?.[0]?.url}
                                                        alt={activeVendor.name}
                                                    />
                                                </div>

                                                <div
                                                    className={`mega-menu-level-2-product-list 
    ${voucherProducts.length > 1 ? "show-col-1" : ""}
    ${voucherProducts.length > 2 ? "show-col-2" : ""}
  `}
                                                    style={{ "--cols": cols } as React.CSSProperties}>
                                                    {loadingProducts ? (
                                                        <p>Loading...</p>
                                                    ) : voucherProducts.length > 0 ? (
                                                        voucherProducts.map((product) => (
                                                            <div
                                                                key={product.id}
                                                                onClick={() => {
                                                                    if (!activeVendor?.handle) return;
                                                                    handleCouponClick(activeVendor.handle, product.handle);
                                                                }}
                                                                className="mega-menu-product-item"
                                                            >
                                                                {product.title}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p>No Vouchers Found</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 
                                            <div className="mega-menu-level-2-footer">

                                                <div style={{ height: "stretch" }}
                                                    className="flex overflow-hidden items-center justify-center h-full ">
                                                    <button
                                                        onClick={() => setActiveVendor(null)}
                                                        className="menu-back-btn"
                                                    >
                                                        <FaChevronLeft className="animate-left-arrow" />
                                                        Back to Menu
                                                    </button>
                                                </div>


                                                <Link href={showAllLink} className="btn-primary whitespace-nowrap">
                                                    Show All Vouchers <span className='inline-button-arrow'>
                                                        <CgChevronRight className='primary-btn-first-arrow' />
                                                        <CgChevronRight className='primary-btn-second-arrow' />
                                                    </span>
                                                </Link>

                                            </div> */}

                                        </div>
                                    )}


                                </div>
                            </div>
                        )}


                        <div className="flex justify-center relative  ">
                            <button onClick={() => {
                                if (openMega) {
                                    closeMegaMenu();
                                } else {
                                    setOpenMega(true);
                                }
                            }} className="cursor-pointer mega-menu-trigger-button whitespace-nowrap">
                                All Vouchers <span className='header-mega-menu-icon-wrapper'> <FaChevronDown className={`header-mega-menu-icon inline-block transition-transform duration-300 ease-in-out ${openMega ? "rotate-180" : ""
                                    }`}
                                /> </span>

                            </button>
                        </div>


                    </div>


                    <div className={`nav-quick-links nav-h-elements  ${!isVoucherVisible ? "hide" : ""} 
                        ${!isVoucherVisible && isSearchActive && isVoucherHidden ? "hidden" : ""}`
                    }>

                        <ul className="flex flex-row ">

                            <li>
                                <Link href="/about" data-text="About" className={pathname === "/about" ? "activepage" : ""}>

                                    About</Link>
                            </li>
                            <li>
                                <Link href="/achievements" data-text="Achievements" className={pathname === "/achievements" ? "activepage" : ""}>
                                    Achievements</Link>
                            </li>

                            <li>
                                <Link href="/international" data-text="International" className={pathname === "/international" ? "activepage" : ""}>
                                    International</Link>
                            </li>

                            <li>
                                <Link href="/blogs" data-text="Blogs"
                                    className={pathname.startsWith("/blogs") ? "activepage" : ""}
                                >
                                    Blogs</Link>
                            </li>

                            <li>
                                <Link href="/contact" data-text="Contact" className={pathname === "/contact" ? "activepage" : ""}>
                                    Contact</Link>
                            </li>
                        </ul>

                    </div>


                    <div className={`header-features ${isSearchActive ? "active" : ""}`}>

                        <div ref={searchRef} onClick={handleSearchActive} className={`header-searchbar ${isSearchActive ? "active" : ""}`}>




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

                                            {/* {searchResults.map((product) => {

                                                const categoryHandle = product.category?.handle;

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

                                            })} */}
                                            {searchResults.map((product) => {
                                                const categoryHandle = getCategoryHandle(product);
                                                console.log("Product:", product.title, "→ Category:", categoryHandle);
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
                                            })}

                                        </div>

                                    </div>

                                </div>
                            )}


                            <input
                                type="text"
                                value={query}
                                // onChange={(e) => setQuery(e.target.value)}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setQuery(value);
                                    setHasUserTyped(true);
                                    if (value.length > 0) {
                                        setSearchResults([
                                        ]);

                                        setShowSearchWindow(true);
                                    } else {
                                        setShowSearchWindow(false);
                                    }
                                }}

                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSearch();
                                }}
                                placeholder={"Search for vouchers, exam etc."}
                                className="flex-1 outline-none text-sm bg-transparent"
                            />

                            <button onClick={handleSearch} className="searchbar-search-btn">
                                <FiSearch className="text-white" size={16} />
                            </button>


                        </div>





                        {/* <div className={`header-login inline-flex items-center ${!isVoucherVisible ? "hide" : ""} 
                        ${!isVoucherVisible && isSearchActive && isVoucherHidden ? "hidden" : ""}`
                        }>


                            <LuUser className="mr-1" />
                            login

                        </div> */}



                        {/* <div
                            className={`header-cart relative  
    ${!isVoucherVisible ? "hide" : ""} 
    ${!isVoucherVisible && isSearchActive && isVoucherHidden ? "hidden" : ""}`
                            }
                            onClick={(e) => {
                                e.preventDefault()

                                if (pathname === "/checkout") {
                                    router.push("/cart")
                                } else {
                                    openCart()
                                }
                            }}
                            style={{ cursor: "pointer" }}
                        >
                            <BsCart3 className="cart-element" />

                            {cartItemCount > 0 && (
                                <div className="cart-quantity-badge">
                                    {cartItemCount}
                                </div>
                            )}
                        </div> */}
                        <div
                            className={`header-cart relative  
    ${!isVoucherVisible ? "hide" : ""} 
    ${!isVoucherVisible && isSearchActive && isVoucherHidden ? "hidden" : ""} 
    ${pathname === "/cart" ? "no-click" : ""}
  `}
                            onClick={(e) => {
                                e.preventDefault()

                                if (pathname === "/checkout") {
                                    router.push("/cart")
                                } else if (pathname === "/cart") {
                                    return
                                } else {
                                    openCart()
                                }
                            }}
                            style={{
                                cursor: pathname === "/cart" ? "default" : "pointer"
                            }}
                        >
                            <BsCart3 className="cart-element" />

                            {cartItemCount > 0 && (
                                <div className="cart-quantity-badge">
                                    {cartItemCount}
                                </div>
                            )}
                        </div>


                        {/* <div onClick={handleCloseSearch} className="header-search-close relative">
                            <RxCross2 size={18} />
                        </div> */}
                        {showCloseBtn && (
                            <div onClick={handleCloseSearch} className="header-search-close relative">
                                <RxCross2 size={18} />
                            </div>
                        )}
                    </div>


                </div>





            </div>



            <div className="header-navbar-links-mobile-wrapper">

                <header className="mobile-header">

                    {!mobileSearchOpen ? (
                        <>
                            <div className="flex flex-row gap-4 items-center">

                                <button
                                    className={`hamburger ${mobileMenuOpen ? "active" : ""}`}
                                    onClick={() => {
                                        if (mobileMenuOpen) {
                                            setMobileMenuOpen(false)
                                            setSelectedVendor(null)
                                            setTimeout(() => {
                                                setMobileLevel(0)
                                            }, 200)
                                        } else {
                                            setMobileMenuOpen(true)
                                        }
                                    }}
                                >
                                    <span />
                                    <span />
                                    <span />
                                </button>

                                <Link href={"/"}>
                                    <img
                                        src="/assets/images/header-icon.webp"
                                        alt="global it sucesses"
                                        className="mobile-logo"
                                    />
                                </Link>

                            </div>

                            <div className="flex items-center gap-4">





                                {/* <div
                                    className="cart-icon"
                                    onClick={() => {
                                        if (pathname === "/checkout") {
                                            router.push("/cart")
                                        } else {
                                            openCart()
                                        }
                                    }}
                                >
                                    <BsCart3 />

                                    {cartItemCount > 0 && (
                                        <div className="cart-quantity-badge">
                                            {cartItemCount}
                                        </div>
                                    )}
                                </div> */}
                                <div
                                    className={`cart-icon ${pathname === "/cart" ? "no-click" : ""}`}
                                    onClick={() => {
                                        if (pathname === "/checkout") {
                                            router.push("/cart")
                                        } else if (pathname === "/cart") {
                                            return
                                        } else {
                                            openCart()
                                        }
                                    }}
                                >
                                    <BsCart3 />

                                    {cartItemCount > 0 && (
                                        <div className="cart-quantity-badge">
                                            {cartItemCount}
                                        </div>
                                    )}
                                </div>


                            </div>
                        </>
                    ) : (
                        <>
                            <div ref={searchRef} onClick={handleSearchActive} className={`header-searchbar ${isSearchActive ? "active" : ""}`}>







                                <input
                                    type="text"
                                    value={query}
                                    // onChange={(e) => setQuery(e.target.value)}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setQuery(value);
                                        setHasUserTyped(true);
                                        if (value.length > 0) {
                                            setSearchResults([]);

                                            setShowSearchWindow(true);
                                        } else {
                                            setShowSearchWindow(false);
                                        }
                                    }}

                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSearch();
                                    }}
                                    placeholder={"Search for vouchers, exam etc."}
                                    className="flex-1 outline-none text-sm bg-transparent"
                                />

                                <button onClick={handleSearch} className="searchbar-search-btn">
                                    <FiSearch className="text-white" size={16} />
                                </button>





                            </div>


                            <button
                                className="mobile-search-close cart-icon"
                                onClick={() => {
                                    setMobileSearchOpen(false)
                                    setQuery("")
                                    setShowSearchWindow(false)
                                }}
                            >
                                <RxCross2 />
                            </button>



                        </>
                    )}
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

                                    {/* {searchResults.map((product) => {

                                        const categoryHandle = product.category?.handle;

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

                                    })} */}
                                    {searchResults.map((product) => {
                                        const categoryHandle = getCategoryHandle(product);

                                        console.log("Product:", product.title, "→ Category:", categoryHandle);

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
                                    })}

                                </div>

                            </div>

                        </div>
                    )}

                </header>

                <div ref={mobileMenuRef} className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>

                    <div className="mobile-menu-inner">
                        {mobileLevel === 0 && (
                            <div className={`menu-content mobile-level ${mobileDirection === "forward" ? "slide-in" : ""
                                }`}>
                                <ul>
                                    <li
                                        className="first-btn-menu"
                                        onClick={() => {
                                            setMobileDirection("forward");
                                            setMobileLevel(1);
                                        }}
                                    >
                                        All Vouchers <FaChevronRight />
                                    </li>
                                    <li>
                                        <Link href="/about" data-text="About" className={pathname === "/about" ? "activepage" : ""}>

                                            About</Link>
                                    </li>
                                    <li>
                                        <Link href="/achievements" data-text="Achievements" className={pathname === "/achievements" ? "activepage" : ""}>
                                            Achievements</Link>
                                    </li>

                                    <li>
                                        <Link href="/international" data-text="International" className={pathname === "/international" ? "activepage" : ""}>
                                            International</Link>
                                    </li>

                                    <li>
                                        <Link href="/blogs" data-text="Blogs"
                                            className={pathname.startsWith("/blogs") ? "activepage" : ""}
                                        >
                                            Blogs</Link>
                                    </li>

                                    <li>
                                        <Link href="/contact" data-text="Contact" className={pathname === "/contact" ? "activepage" : ""}>
                                            Contact</Link>
                                    </li>
                                </ul>
                            </div>
                        )}

                        {mobileLevel === 1 && (
                            <div className="menu-content mobile-level level-padding">
                                <div
                                    className="mobile-back"
                                    onClick={() => {
                                        setMobileDirection("back");
                                        setMobileLevel(0);
                                    }}
                                >
                                    <FaChevronLeft /> Back
                                </div>

                                <ul
                                    className={mobileDirection === "forward" ? "slide-in" : ""}
                                >
                                    {categories.map((vendor) => (
                                        <li
                                            key={vendor.id}
                                            onClick={() => {
                                                setSelectedVendor(vendor);
                                                setActiveVendor(vendor);
                                                setMobileDirection("forward");
                                                setMobileLevel(2);
                                            }}
                                        >
                                            <img src={vendor?.media?.[0]?.url} className="h-5" />
                                            <FaChevronRight />
                                        </li>

                                    ))}
                                </ul>


                            </div>
                        )}

                        {mobileLevel === 2 && (
                            <div className="menu-content mobile-level level-padding ">
                                <div
                                    className="mobile-back"
                                    onClick={() => {
                                        setMobileDirection("back");
                                        setMobileLevel(1);
                                    }}
                                >
                                    <FaChevronLeft /> Back
                                </div>

                                <ul className={mobileDirection === "forward" ? "slide-in" : ""}>
                                    {loadingProducts ? (
                                        <li>Loading...</li>
                                    ) : (
                                        <>
                                            {voucherProducts.map((product) => (
                                                <li
                                                    key={product.id}
                                                    onClick={() => {
                                                        if (!selectedVendor?.handle) return;
                                                        handleCouponClick(
                                                            selectedVendor.handle,
                                                            product.handle
                                                        );
                                                        setMobileMenuOpen(false);
                                                        setMobileLevel(0);
                                                        setSelectedVendor(null);
                                                    }}
                                                >
                                                    {product.title}
                                                </li>
                                            ))}

                                            {/* 👇 SEE ALL ITEM */}
                                            {selectedVendor?.handle && (
                                                <li
                                                    className="see-all-item"
                                                    onClick={() => {
                                                        router.push(`/voucher/${selectedVendor.handle}`);
                                                        setMobileMenuOpen(false);
                                                        setMobileLevel(0);
                                                        setSelectedVendor(null);
                                                    }}
                                                >
                                                    Show All Vouchers
                                                </li>
                                            )}
                                        </>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>


                </div>



                <div
                    className={`mobileMenu-list-fade ${mobileMenuOpen ? "active" : ""
                        } ${showMobileListFade ? "show" : ""}`}
                ></div>

                {/* fixed Bottom Buttons */}
                <div className="menu-footer">
                    <Link href="/voucher" className="voucher-btn">
                        All Vouchers <LuPlus />

                    </Link>


                    {/* <div
                        className="contact-icon"
                        onClick={() => {
                            handleSearchActive();
                            setMobileSearchOpen(true)
                        }}
                    > */}
                    <div
                        className="contact-icon"
                        onClick={() => {
                            setMobileSearchOpen(true);
                            setIsSearchActive(true); // ensure it's NOT active on mobile
                        }}
                    >
                        <GoSearch />
                    </div>

                    {/* <div className="contact-icon">
                        <FiPhone />

                    </div>
                    <div className="contact-icon">
                        <FaWhatsapp />


                    </div> */}

                    <div className="contact-icon">
                        <a href={`tel:${phoneNumber}`}>
                            <FiPhone />
                        </a>
                    </div>

                    <div className="contact-icon">
                        <a
                            href={`https://wa.me/${whatsappNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <FaWhatsapp />
                        </a>
                    </div>



                </div>
            </div>



        </header>
    );
}
