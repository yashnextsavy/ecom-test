"use client";
import React, { useState, useRef, useEffect } from "react";
import { CgChevronDown } from "react-icons/cg";

type TocItem = {
    id: string;
    label: string;
};

type BlogDetailsLayoutProps = {
    tocItems?: TocItem[];
    children?: React.ReactNode;
};

const defaultToc: TocItem[] = [
    { id: "section-1", label: "No Content Found eheh" }
];

export default function BlogDetailsLayout({
    tocItems,
    children,
}: BlogDetailsLayoutProps) {
    const [tocOpen, setTocOpen] = useState(false);
    const [ctaOpen, setCtaOpen] = useState(false);
    const hasContent = React.Children.count(children) > 0;


    const tocRef = useRef<HTMLDivElement>(null);
    const [tocHeight, setTocHeight] = useState<number | null>(null);


    useEffect(() => {
        if (tocOpen && tocRef.current) {
            setTocHeight(tocRef.current.scrollHeight);
        } else {
            setTocHeight(0);
        }
    }, [tocOpen]);


    const safeToc: TocItem[] =
        tocItems?.length
            ? tocItems
            : hasContent
                ? [] // if content exists but no toc passed, don't show fake "no content"
                : [{ id: "no-content", label: "No Content Found" }];


    return (
        <section className="blog-details-section">
            <div className="container-custom mx-auto">
                <div className="blog-details-layout">

                    {/* SIDEBAR */}
                    <aside className="blog-sidebar">

                        {/* TABLE OF CONTENT */}
                        <div className={`sidebar-accordion ${tocOpen ? "open" : ""}`}>
                            <button
                                className="sidebar-accordion-header"
                                onClick={() => setTocOpen(!tocOpen)}
                            >
                                <span>Table Of Content</span>
                                <CgChevronDown
                                    className={`accordion-icon ${tocOpen ? "rotate" : ""}`}
                                />
                            </button>

                            <div
                                ref={tocRef}
                                className="sidebar-accordion-body"
                                style={{
                                    maxHeight: tocHeight !== null ? `${tocHeight}px` : "0px",
                                    opacity: tocOpen ? 1 : 0
                                }}>
                                <ul>
                                    {safeToc.length > 0 ? (
                                        safeToc.map((item) => (
                                            <li key={item.id}>
                                                {item.id === "no-content" ? (
                                                    <span>{item.label}</span>
                                                ) : (
                                                    <a href={`#${item.id}`}>{item.label}</a>
                                                )}
                                            </li>
                                        ))
                                    ) : (
                                        <li>
                                            <span>No Table of Content Available</span>
                                        </li>
                                    )}
                                </ul>

                            </div>
                        </div>

                        {/* CTA */}
                        <div className={`sidebar-accordion light ${ctaOpen ? "open" : ""}`}>
                            <button
                                className="sidebar-accordion-header"
                                onClick={() => setCtaOpen(!ctaOpen)}
                            >
                                <span>Found the article insightful?</span>
                                <CgChevronDown
                                    className={`accordion-icon ${ctaOpen ? "rotate" : ""}`}
                                />
                            </button>

                            <div className="sidebar-accordion-body">
                                <p>Connect with our experts for assistance.</p>

                                <button className="btn-primary w-full mt-3">
                                    Connect via WhatsApp
                                </button>
                            </div>
                        </div>

                    </aside>

                    {/* MAIN CONTENT */}
                    <main className="blog-main-content">
                        {children ? (
                            children
                        ) : (
                            <div className="no-content-placeholder">
                                <h3>No Content Found</h3>
                                <p>The blog content is currently unavailable.</p>
                            </div>
                        )}
                    </main>


                </div>
            </div >
        </section >
    );
}
