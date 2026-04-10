"use client";

import Link from "next/link";
import React from "react";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
    return (
        <section className="breadcrumb-wrapper">
            <div className="container-custom mx-auto">
                <nav className="breadcrumb">
                    {items.map((item, index) => {
                        const isLast = index === items.length - 1;

                        return (
                            <span key={index} className="breadcrumb-item">
                                {!isLast && item.href ? (
                                    <Link href={item.href}>{item.label}</Link>
                                ) : (
                                    <span className="breadcrumb-current">
                                        {item.label}
                                    </span>
                                )}

                                {!isLast && <span className="breadcrumb-separator">›</span>}
                            </span>
                        );
                    })}
                </nav>
            </div>
        </section>
    );
};

export default Breadcrumbs;
