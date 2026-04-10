"use client"
import { useState, useRef, useEffect } from "react";
import { FaFacebook } from "react-icons/fa";
import { BsTwitterX } from "react-icons/bs";
import { FaLinkedinIn } from "react-icons/fa";
import { AiFillInstagram } from "react-icons/ai";
import Link from "next/link";
// import { getContactPageData } from "@/lib/api";
import { CgChevronRight } from 'react-icons/cg';



type FooterLink = string | {
    label: string
    href?: string
    openInNewTab?: boolean
}

const formatDisplayNumber = (number?: string) =>
    number?.startsWith("+91") && !number.includes("-")
        ? number.replace("+91", "+91-")
        : number;


export const footerData = {


    exploreTitle: "Explore Vouchers",

    exploreLinks: [
        "CompTIA",
        "VMware",
        "Kubernetes",
        "EC-Council",
        "Dell EMC",
        "Checkpoint",
        "Oracle",
        "Microsoft",
        "Salesforce",
        "CISCO",
        "SAS",
        "Juniper",
        "AWS",
        "ISTQB",
        "ISACA",
        "Splunk",
        "Fortinet",
    ],

    companyInfo: {
        description:
            "Global IT Success focuses on availing countless discounted vouchers to help you achieve your certification goals affordably.",
    },

    columns: [
        {
            title: "GET IN TOUCH",
            links: [
                "+91 9311358835",
                "info@globalitsuccess.com",
                "Chat With Us",
                "Go to Maps",
            ],
        },
        {
            title: "QUICK LINKS",
            links: ["about", "vendors", "blogs", "contact"],
        },
        {
            title: "COMPANY",
            links: [
                { label: "Terms & Conditions", href: "/company/terms-of-service" }
            ],
        }
    ],

    copyright:
        "©2026 Global IT Success. All Rights Reserved.",
    craftedBy: "Crafted By Nextsavy Technologies",
};




interface FooterProps {
    contactData?: any;
    categories?: any[];
    footerColumns?: any;
}

const Footer: React.FC<FooterProps> = ({ contactData, categories, footerColumns }) => {

    const contact = contactData?.contactDetails;
    const socials = contactData?.socialMedia;

    const [exploreOpen, setExploreOpen] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);



    const mobileRef = useRef<HTMLDivElement>(null);
    const desktopRef = useRef<HTMLDivElement>(null);

    const [mobileHeight, setMobileHeight] = useState(0);
    const [desktopHeight, setDesktopHeight] = useState(0);


    // const mappedColumns = mapFooterDataToColumns(footerColumns)
    const apiData = footerColumns?.value?.data;

    const examVouchers = categories?.map(cat => ({
        id: cat.id,
        categoryTitle: cat.name,
        categoryHandle: cat.handle
    })) || [];


    const dynamicColumns = footerData.columns.map((col) => {
        if (col.title === "QUICK LINKS" && apiData?.quickLinks) {
            return {
                ...col,
                links: apiData.quickLinks.map((item: any) => ({
                    label: item.title,
                    href: item.url || `/${item.title.toLowerCase().replace(/\s+/g, "-")}`,
                })),
            };
        }

        if (col.title === "COMPANY" && apiData?.companyLinks) {
            return {
                ...col,
                links: apiData.companyLinks.map((item: any) => ({
                    label: item.title,
                    href: item.url,
                    openInNewTab: item.openInNewTab,
                })),
            };
        }

        return col; // keep GET IN TOUCH untouched
    });

    // const dynamicColumns = footerColumns
    //     ? mapFooterDataToColumns(footerColumns)
    //     : footerData.columns;

    // useEffect(() => {
    //     if (contentRef.current) {
    //         setHeight(contentRef.current.scrollHeight);
    //     }
    // }, [exploreOpen]);

    // useEffect(() => {
    //     console.log("iside the testing area: ", contact)
    // }, []);

    const formatLabel = (text: string) =>
        text.replace(/\b\w/g, (c) => c.toUpperCase());


    useEffect(() => {
        console.log("footerColumns:", footerColumns)
        console.log("apiData:", footerColumns?.value?.data)
        console.log("dynamicColumns:", dynamicColumns)
    }, [])



    useEffect(() => {
        if (exploreOpen && mobileRef.current) {
            const parent = mobileRef.current.parentElement;

            if (parent) {
                // temporarily remove height restriction
                parent.style.height = "auto";

                const fullHeight = mobileRef.current.scrollHeight;

                // set correct height
                setMobileHeight(fullHeight);
            }
            console.log("mobile scrollHeight:", mobileRef.current?.scrollHeight);
        }
    }, [exploreOpen, examVouchers]);




    return (


        <>

            {/* <pre>{JSON.stringify(categories, null, 2)}</pre> */}

            <footer className="footer">


                <div className="footer-explore mobile">

                    <button
                        className="footer-accordion-header"
                        onClick={() => setExploreOpen(!exploreOpen)}
                    >
                        <h2>{footerData?.exploreTitle}</h2>
                        <span className={`accordion-icon ${exploreOpen ? "open" : ""}`}>
                            +
                        </span>
                    </button>

                    <div className={`footer-explore-accordion mobile-explore-grid ${exploreOpen ? "open" : ""}`}
                        style={{
                            height: exploreOpen ? mobileHeight : 0,
                        }}
                    >
                        <div ref={mobileRef} className="footer-explore-grid">
                            {examVouchers.map((item: any) => (
                                <Link key={item.id} href={`/voucher/${item.categoryHandle}`}>
                                    {item.categoryTitle}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>



                <div className="container-custom mx-auto">
                    <div className='footer-content-wrapper flex flex-col gap-12 lg:gap-20'>




                        {/* Explore Section */}
                        <div className="footer-explore">

                            <button
                                className="footer-accordion-header"
                                onClick={() => setExploreOpen(!exploreOpen)}
                            >
                                <h2>{footerData.exploreTitle}</h2>
                                <span className={`accordion-icon ${exploreOpen ? "open" : ""}`}>
                                    +
                                </span>
                            </button>

                            <div className="footer-explore-accordion"
                                style={{
                                    height: exploreOpen ? desktopHeight : 0,
                                }}
                            >

                                <div ref={desktopRef} className="footer-explore-grid">
                                    {examVouchers.map((item: any) => (
                                        <Link
                                            className="footer-hov-item-link"
                                            key={item.id}
                                            href={`/voucher/${item.categoryHandle}`}
                                        >
                                            {item.categoryTitle}
                                            <span className="secondary-link-arrow">
                                                <CgChevronRight />
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>


                        <div className="my-0.5 lg:my-0 faq-divider">
                            <img alt="divider icon" className="faq-divider-line" src="/assets/images/faq-dashed-line-gray-long.svg" />
                        </div>


                        {/* Bottom Section */}
                        <div className="footer-bottom">

                            {/* Brand */}
                            <div className="footer-brand">
                                <img src="/assets/images/footer-title-img.webp" alt="Logo" className='object-contain' />
                                <p>{footerData?.companyInfo?.description}</p>

                                <div className="social-icons">

                                    {socials?.facebook && (
                                        <a href={socials.facebook} target="_blank">
                                            <FaFacebook />
                                        </a>
                                    )}

                                    {socials?.tweeter && (
                                        <a href={socials.tweeter} target="_blank">
                                            <BsTwitterX />
                                        </a>
                                    )}

                                    {socials?.linkedin && (
                                        <a href={socials.linkedin} target="_blank">
                                            <FaLinkedinIn />
                                        </a>
                                    )}

                                    {socials?.instagram && (
                                        <a href={socials.instagram} target="_blank">
                                            <AiFillInstagram />
                                        </a>
                                    )}

                                </div>
                            </div>

                            {/* Dynamic Columns */}
                            {dynamicColumns.map((col, index) => {

                                // CUSTOM GET IN TOUCH FROM API
                                if (col.title === "GET IN TOUCH") {
                                    return (
                                        <div key={index}>
                                            <h4>{col.title}</h4>

                                            <ul className="footer-hov-link">
                                                <li>
                                                    <a href={`tel:${contact?.callNumber}`}>
                                                        {formatDisplayNumber(contact?.callNumber)} <span className="secondary-link-arrow">
                                                            <CgChevronRight />
                                                        </span>
                                                    </a>
                                                </li>

                                                <li>
                                                    <a href={`mailto:${contact?.email}`}>
                                                        {contact?.email} <span className="secondary-link-arrow">
                                                            <CgChevronRight />
                                                        </span>
                                                    </a>
                                                </li>

                                                <li>
                                                    <a
                                                        href={`https://wa.me/${contact?.whatsappNumber?.replace(/\D/g, "")}`}
                                                        target="_blank"
                                                    >
                                                        Chat With Us <span className="secondary-link-arrow">
                                                            <CgChevronRight />
                                                        </span>
                                                    </a>
                                                </li>

                                                <li>
                                                    <a href={contact?.mapLocationUrl} target="_blank">
                                                        Go to Maps  <span className="secondary-link-arrow">
                                                            <CgChevronRight />
                                                        </span>
                                                    </a>
                                                </li>
                                            </ul>
                                        </div>
                                    );
                                }

                                // DEFAULT COLUMNS (QUICK LINKS + COMPANY)
                                return (
                                    <div key={index}>
                                        <h4>{col.title}</h4>

                                        <ul className="footer-hov-link">
                                            {col.links.map((link: FooterLink, i: number) => {
                                                // let href = "#";
                                                // let label = "";
                                                const label = typeof link === "string" ? formatLabel(link) : link.label
                                                const href =
                                                    typeof link === "string"
                                                        ? `/${link.toLowerCase().replace(/\s+/g, "-")}`
                                                        : link.href || "#"

                                                const openInNewTab =
                                                    typeof link === "object" && link.openInNewTab



                                                return (
                                                    <li key={i}>
                                                        <Link
                                                            className="capitalize"
                                                            href={href}
                                                            // target={label === "Terms & Conditions" ? "_blank" : "_self"}
                                                            // rel={label === "Terms & Conditions" ? "noopener noreferrer" : undefined}
                                                            target={openInNewTab ? "_blank" : "_self"}
                                                            rel={openInNewTab ? "noopener noreferrer" : undefined}
                                                        >
                                                            {label} <span className="secondary-link-arrow">
                                                                <CgChevronRight />
                                                            </span>
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>




                        {/* Copyright */}

                        <div className='footer-copy-wrapper'>
                            <div className="faq-divider">
                                <img alt="divider icon" className="faq-divider-line" src="/assets/images/faq-dashed-line-gray-long.svg" />
                            </div>
                            <div className="footer-copy">
                                <p>{`© 2025 - ${new Date().getFullYear()} D Succeed Learners. All Rights Reserved.`}</p>
                            </div>
                        </div>

                    </div>
                </div>
            </footer>
        </>
    );
};

export default Footer;
