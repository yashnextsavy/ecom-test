"use client";

import { useState, useEffect, useMemo } from "react";
import { CgChevronRight } from "react-icons/cg";
import { FaChevronDown } from "react-icons/fa";
import { BsShare } from "react-icons/bs";

type SectionType = {
    id: string;
    title: string;
    html: string;
};

type BlogFaq = {
    id: string;
    question: string;
    answer: string;
};

type BlogsDetailsProps = {
    title?: string;
    excerpt?: string;
    content?: string;
    faqs?: BlogFaq[];
    contactDetails?: {
        sectionInfo?: {
            title?: string;
            description?: string;
        };
        contactDetails?: {
            whatsappNumber?: string;
            callNumber?: string;
            email?: string;
        };
    };
};





const BlogsDetails = ({
    title,
    excerpt,
    content,
    faqs = [],
    contactDetails,
}: BlogsDetailsProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeSection, setActiveSection] = useState("section-1");
    const [openId, setOpenId] = useState<string | null>(null);
    const [copyMessage, setCopyMessage] = useState("");
    const whatsappLink = contactDetails?.contactDetails?.whatsappNumber
        ? `https://wa.me/${contactDetails.contactDetails.whatsappNumber.replace("+", "")}`
        : "#";

    const [mounted, setMounted] = useState(false);




    useEffect(() => {
        if (faqs.length > 0) {
            setOpenId(faqs[0].id);
        }
    }, [faqs]);

    useEffect(() => {
        if (!copyMessage) return;

        const timer = setTimeout(() => {
            setCopyMessage("");
        }, 2000);

        return () => clearTimeout(timer);
    }, [copyMessage]);



    const sections: SectionType[] = useMemo(() => {
        if (!content || typeof window === "undefined") return [];

        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/html");

        // const nodes = Array.from(doc.body.children);
        const nodes = Array.from(doc.body.childNodes).filter(
            (node): node is Element => node.nodeType === 1
        );


        const result: SectionType[] = [];
        let currentSection: SectionType | null = null;





        const isEmptyParagraph = (node: Element) => {
            if (node.tagName.toLowerCase() !== "p") return false;

            const text = node.textContent
                ?.replace(/\u00A0/g, "")
                .replace(/\s+/g, " ")
                .trim();

            return text === "";
        };

        nodes.forEach((node) => {
            const tag = node.tagName?.toLowerCase();

            // if (isEmptyParagraph(node)) return;
            if (tag === "p") {
                const text = node.textContent
                    ?.replace(/\u00A0/g, "")
                    .replace(/\s+/g, " ")
                    .trim();

                if (!text) return; // only skip truly empty
            }


            if (tag === "h2" || tag === "h3" || tag === "h4") {
                const id = `section-${result.length + 1}`;

                currentSection = {
                    id,
                    title: node.textContent || `Section ${result.length + 1}`,
                    html: node.outerHTML,
                };

                result.push(currentSection);
            } else {
                if (!currentSection) {
                    currentSection = {
                        id: "section-1",
                        title: "Introduction",
                        html: "",
                    };
                    result.push(currentSection);
                }

                currentSection.html += node.outerHTML;
            }
        });

        if (faqs && faqs.length > 0) {
            result.push({
                id: "blog-faqs",
                title: "Frequently Asked Questions",
                html: "",
            });
        }

        return result;
    }, [content, faqs]);



    const hasValidContent =
        sections?.some(
            (section) =>
                section.id !== "blog-faqs" &&
                section.html &&
                section.html.replace(/<[^>]*>/g, "").trim()
        );


    /**
     * Scroll Spy
     */
    useEffect(() => {
        const sectionEls = document.querySelectorAll(".blog-details-content-section");

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            {
                rootMargin: "-40% 0px -50% 0px",
                threshold: 0,
            }
        );

        sectionEls.forEach((section) => observer.observe(section));

        return () => {
            sectionEls.forEach((section) => observer.unobserve(section));
        };
    }, [sections]);

    // const handleShare = async () => {
    //     try {
    //         await navigator.clipboard.writeText(window.location.href);
    //     } catch (err) {
    //         console.error(err);
    //     }
    // };
    const copyShareLink = async (url: string) => {
        if (!url) return;

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
            } else {
                const textarea = document.createElement("textarea");
                textarea.value = url;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                textarea.remove();
            }

            setCopyMessage("Link copied");
        } catch (err) {
            console.error("Clipboard failed", err);
            setCopyMessage("Copy failed");
        }
    };

    const handleShare = async () => {
        const url = typeof window !== "undefined" ? window.location.href : "";
        if (!url) return;

        const shareData = {
            title: title || "Blog article",
            text: excerpt || "",
            url,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                return;
            } catch {
                console.log("Share cancelled");
            }
        }

        await copyShareLink(url);
    };



    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="blog-details-wrapper">
                <div className="container-custom mx-auto">
                    <div className="blog-details-cta-content-wrapper flex gap-8 xl:gap-24">

                        {/* SIDEBAR */}
                        <div className="hidden lg:block w-auto xl:w-[40%]">
                            <div className="w-[380px] xl:w-[460px] space-y-6">




                                {/* TOC title */}
                                <div className="h-22 w-[100%] bg-gray-200 rounded-3xl animate-pulse" />



                                {/* CTA card */}
                                <div className="mt-8 p-6 rounded-2xl bg-gray-100 space-y-4">
                                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-10 w-full bg-gray-300 rounded-full animate-pulse" />
                                </div>



                            </div>
                        </div>

                        {/* CONTENT */}
                        <div className="blog-details-content-wrapper flex-1">

                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="blog-details-content-section pb-8">

                                    {/* dashed divider like real UI */}
                                    {i !== 0 && (
                                        <div
                                            className="w-full mb-8"
                                            style={{ borderTop: "1px dashed #045A7C66" }}
                                        />
                                    )}

                                    {/* heading (matches h2/h3 scale) */}
                                    <div className="h-10 w-2/3 bg-gray-300 rounded animate-pulse mb-6" />

                                    {/* paragraphs (match 18px rhythm) */}
                                    <div className="space-y-3">
                                        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                                        <div className="h-4 w-11/12 bg-gray-200 rounded animate-pulse" />
                                        <div className="h-4 w-10/12 bg-gray-200 rounded animate-pulse" />
                                        <div className="h-4 w-8/12 bg-gray-200 rounded animate-pulse" />
                                    </div>

                                </div>
                            ))}

                        </div>

                    </div>
                </div>
            </div>
        );
    }



    return (
        <div className="blog-details-wrapper">
            <div className="container-custom mx-auto">
                <div className="blog-details-cta-content-wrapper">

                    {/* SIDEBAR */}
                    {hasValidContent && (
                        <div className="blog-details-nav-cta-wrapper">
                            <div className="blog-details-nav-cta">

                                <div className={`blog-content-progressbar ${isOpen ? "open" : ""}`}>

                                    <button
                                        className="blog-progress-accordian"
                                        onClick={() => setIsOpen(!isOpen)}
                                    >
                                        Table of Content
                                        <span className={`flex items-center chevron-icon ${isOpen ? "rotate" : ""}`}>
                                            <FaChevronDown />
                                        </span>
                                    </button>

                                    <div className={`accordion-body relative ${isOpen ? "open" : ""}`}>
                                        <div className="faq-divider">
                                            <img
                                                alt="divider icon"
                                                className="faq-divider-line"
                                                src="/assets/images/faq-dashed-line-gray.svg"
                                            />
                                        </div>

                                        <ul className="blog-progress-section-list">

                                            {sections.map((section) => (
                                                <li
                                                    key={section.id}
                                                    className={
                                                        activeSection === section.id
                                                            ? "bullet-point white-bullet"
                                                            : "bullet-point waiting"
                                                    }
                                                    onClick={() =>
                                                        document
                                                            .getElementById(section.id)
                                                            ?.scrollIntoView({ behavior: "smooth" })
                                                    }
                                                >
                                                    {section.title}
                                                </li>
                                            ))}

                                        </ul>
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className="blog-cta-banner">
                                    <img
                                        alt="Background shapes"
                                        className="contact-bg-image absolute right-0 top-0 bottom-0 z-0 h-full opacity-50"
                                        src="/assets/images/cta-voucher-right.svg"
                                    />

                                    <h3>
                                        {contactDetails?.sectionInfo?.title || "Found the article insightful?"}
                                    </h3>

                                    <p>
                                        {contactDetails?.sectionInfo?.description ||
                                            "Get in touch with us or share it with those who may benefit."}
                                    </p>

                                    <div className="cta-button-wrap">
                                        <a
                                            href={whatsappLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-primary whitespace-nowrap"
                                        >
                                            Connect via WhatsApp
                                            <span className="inline-button-arrow">
                                                <CgChevronRight className="primary-btn-first-arrow" />
                                                <CgChevronRight className="primary-btn-second-arrow" />
                                            </span>
                                        </a>

                                        <button
                                            className="cta-copy-btn"
                                            onClick={handleShare}
                                            type="button"
                                        >
                                            <BsShare />
                                        </button>
                                    </div>

                                </div>

                            </div>
                        </div>
                    )}


                    {/* BLOG CONTENT */}
                    <main className="blog-details-content-wrapper">

                        {!hasValidContent ? (
                            <div className="blog-details-content-section">
                                <h3>Information unavailable at the moment</h3>
                                <p>Please check back later or explore other blogs.</p>
                            </div>
                        ) : (
                            sections.map((section, index) => (
                                <div key={section.id}>

                                    {section.id !== "blog-faqs" ? (
                                        <section
                                            id={section.id}
                                            className="blog-details-content-section"
                                            style={{ paddingBottom: "32px" }}
                                            dangerouslySetInnerHTML={{ __html: section.html }}
                                        />
                                    ) : (
                                        <section id="blog-faqs" className="blog-details-content-section blog-faqs">
                                            <h2>Frequently Asked Questions</h2>

                                            <div className="faq-list">
                                                {faqs?.map((faq) => {
                                                    const isOpen = openId === faq.id;

                                                    return (
                                                        <div
                                                            key={faq.id}
                                                            className={`faq-item ${isOpen ? "open" : ""}`}
                                                        >

                                                            <div className="faq-divider">
                                                                <img
                                                                    alt="divider icon"
                                                                    className="faq-divider-question"
                                                                    src="/assets/images/faq-dashed-line.svg"
                                                                />
                                                            </div>

                                                            <button
                                                                className="faq-question"
                                                                onClick={() =>
                                                                    setOpenId(isOpen ? null : faq.id)
                                                                }
                                                            >
                                                                <span>{faq.question}</span>

                                                                <span className={`faq-icon ${isOpen ? "open" : ""}`}>
                                                                    +
                                                                </span>
                                                            </button>

                                                            <div className="faq-answer">
                                                                <p>{faq.answer}</p>
                                                            </div>

                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="faq-divider">
                                                <img
                                                    alt="divider icon"
                                                    className="faq-divider-line"
                                                    src="/assets/images/faq-dashed-line.svg"
                                                />
                                            </div>
                                        </section>
                                    )}

                                    {index !== sections.length - 1 && (
                                        <div
                                            className="faq-divider"
                                            style={{
                                                borderTop: "1px dashed #045A7C66",
                                                margin: "32px 0",
                                            }}
                                        />
                                    )}
                                </div>
                            ))

                        )}

                    </main>

                </div>
            </div>

            <div
                className={`pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform transition-all duration-300 ${copyMessage ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                    }`}
                aria-live="polite"
                aria-atomic="true"
            >
                <div className="rounded-full bg-[#045A7C] px-4 py-2 text-sm font-medium text-white shadow-lg">
                    {copyMessage}
                </div>
            </div>
        </div>
    );
};

export default BlogsDetails;
