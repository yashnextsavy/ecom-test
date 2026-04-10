

"use client";

import { useState, useMemo, useEffect } from "react";
import { FiPlus } from "react-icons/fi";

interface Certification {
    title: string;
    label: string;
    value: string;
}

interface CertificationTab {
    title: string;
    description: string;
    certifications: Certification[];
}

interface AdditionalInformation {
    title: string;
    description: string;
    exam_information: {
        title: string;
        description: string;
        values: string[];
    }[];
    certification_levels: {
        title: string;
        description: string;
        values: string[];
    }[];
}


interface FAQItem {
    question: string;
    answer: string;
}

interface Props {
    additionalInformation?: AdditionalInformation;
    faq?: FAQItem[];
}

const CertificationAccordion = ({ additionalInformation, faq }: Props) => {
    const [activeTab, setActiveTab] = useState<"exam" | "levels" | "faq">("exam");
    const [showAll, setShowAll] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);

    const parseHtmlString = (htmlString: string) => {
        // Remove all HTML tags
        const cleanString = htmlString.replace(/<[^>]+>/g, '').trim();

        // Split by first colon
        let label = "";
        let value = cleanString;

        if (cleanString.includes(":")) {
            const parts = cleanString.split(":");
            label = parts[0].trim();
            value = parts.slice(1).join(":").trim();
        }

        return {
            title: "", // leave empty or extract separately if needed
            label,
            value
        };
    };

    const examData: CertificationTab[] = useMemo(() => {
        return (
            additionalInformation?.exam_information?.map((item) => ({
                title: item.title,
                description: item.description,
                certifications: item.values.map(parseHtmlString),
            })) || []
        );
    }, [additionalInformation]);

    const levelData: CertificationTab[] = useMemo(() => {
        return (
            additionalInformation?.certification_levels?.map((item) => ({
                title: item.title,
                description: item.description,
                certifications: item.values.map(parseHtmlString),
            })) || []
        );
    }, [additionalInformation]);

    const currentData =
        activeTab === "exam"
            ? examData
            : activeTab === "levels"
                ? levelData
                : [];

    const toggleAccordion = (id: string) => {
        setActiveId((prev) => (prev === id ? null : id));
    };



    const faqDataFormatted = useMemo(() => {
        return (
            faq?.map((item, index) => ({
                id: `faq-${index}`,
                question: item.question,
                answer: item.answer,
            })) || []
        );
    }, [faq]);

    useEffect(() => {
        if (examData.length > 0) {
            setActiveTab("exam");
            setActiveId(null);
        } else if (levelData.length > 0) {
            setActiveTab("levels");
            setActiveId(null);
        } else if (faqDataFormatted.length > 0) {
            setActiveTab("faq");
            setActiveId(null);
        }
    }, [examData, levelData, faqDataFormatted]);


    const hasContent =
        (additionalInformation?.exam_information?.length ?? 0) > 0 ||
        (additionalInformation?.certification_levels?.length ?? 0) > 0 ||
        (faq?.length ?? 0) > 0;

    if (!hasContent) return null;







    return (
        <section className="certificate-accordian-section-wrapper">
            <div className="container-custom mx-auto">
                <div className="accordian-content-wrapper">
                    <div className="product-certificates-list-content">
                        <div className="product-certificates-list-title">
                            <h2>{additionalInformation?.title}</h2>
                            <p>{additionalInformation?.description}</p>
                        </div>

                        {/* <div className="accordian-toggle-wrapper">
                            <button
                                className={`accordian-toggle-btn ${activeTab === "exam" ? "btn-active" : "btn-inActive"
                                    }`}
                                onClick={() => {
                                    setActiveTab("exam");
                                    setActiveId(examData?.[0]?.title ?? null);
                                }}
                            >
                                Exam Information
                            </button>

                            <button
                                className={`accordian-toggle-btn ${activeTab === "levels" ? "btn-active" : "btn-inActive"
                                    }`}
                                onClick={() => {
                                    setActiveTab("levels");
                                    setActiveId(levelData?.[0]?.title ?? null);
                                }}
                            >
                                Certification Levels
                            </button>
                        </div> */}
                        <div className="accordian-toggle-wrapper">
                            {examData.length > 0 && (
                                <button
                                    className={`accordian-toggle-btn ${activeTab === "exam" ? "btn-active" : "btn-inActive"
                                        }`}
                                    onClick={() => {
                                        setActiveTab("exam");
                                        setActiveId(null);
                                    }}
                                >
                                    Exam Information
                                </button>
                            )}

                            {levelData.length > 0 && (
                                <button
                                    className={`accordian-toggle-btn ${activeTab === "levels" ? "btn-active" : "btn-inActive"
                                        }`}
                                    onClick={() => {
                                        setActiveTab("levels");
                                        setActiveId(null);
                                    }}
                                >
                                    Certification Levels
                                </button>
                            )}


                            {faq && faq.length > 0 && (
                                <button
                                    className={`accordian-toggle-btn ${activeTab === "faq" ? "btn-active" : "btn-inActive"
                                        }`}
                                    onClick={() => {
                                        setActiveTab("faq");
                                        setActiveId(null);
                                    }}
                                >
                                    Frequently Asked Question
                                </button>
                            )}




                        </div>
                    </div>

                    <div className={`certification-accordion-fade ${activeTab}`}>
                        <div className="certification-accordion">
                            {activeTab === "faq" ? (
                                <div className="faq-list">
                                    {(faqDataFormatted.length > 3
                                        ? faqDataFormatted.slice(0, 3)
                                        : faqDataFormatted
                                    ).map((faq) => {
                                        const isOpen = activeId === faq.id;

                                        return (
                                            <div
                                                key={faq.id}
                                                className={`faq-item ${isOpen ? "open" : ""}`}
                                            >
                                                <div className="faq-divider">
                                                    {/* <img
                                                        alt="divider icon"
                                                        className="faq-divider-question"
                                                        src="/assets/images/faq-dashed-line.svg"
                                                    /> */}
                                                </div>

                                                <button
                                                    className="faq-question"
                                                    onClick={() =>
                                                        setActiveId(isOpen ? null : faq.id)
                                                    }
                                                >
                                                    <span
                                                        dangerouslySetInnerHTML={{
                                                            __html: faq.question,
                                                        }}
                                                    />
                                                    <span
                                                        className={`faq-icon ${isOpen ? "open" : ""
                                                            }`}
                                                    >
                                                        +
                                                    </span>
                                                </button>

                                                <div className="faq-answer">
                                                    <div
                                                        className="faq-content-wrapper"
                                                        dangerouslySetInnerHTML={{
                                                            __html: faq.answer,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* <div className="faq-divider">
                                        <img
                                            alt="divider icon"
                                            className="faq-divider-line"
                                            src="/assets/images/faq-dashed-line.svg"
                                        />
                                    </div> */}

                                    {faqDataFormatted.length > 3 && (
                                        <div className="faq-view-more">
                                            <button
                                                className="faq-view-more-button"
                                                onClick={() =>
                                                    setShowAll((prev) => !prev)
                                                }
                                            >
                                                {showAll
                                                    ? "− View Less Questions −"
                                                    : "+ View More Questions +"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (

                                currentData.map((item) => {
                                    const isActive = activeId === item.title;

                                    return (
                                        <div
                                            key={item.title}
                                            className={`accordion-item ${isActive ? "active" : ""}`}
                                        >
                                            <button
                                                className="accordion-header"
                                                onClick={() => toggleAccordion(item.title)}
                                            >
                                                <div className="accordion-header-left">
                                                    <h3
                                                        className={`accordion-title bullet-point ${isActive ? "white-bullet" : ""
                                                            }`}
                                                    >
                                                        {item.title}
                                                    </h3>

                                                    <p className="accordion-description">
                                                        {item.description}
                                                    </p>
                                                </div>

                                                <div
                                                    className={`accordion-icon ${isActive ? "rotate" : ""}`}
                                                >
                                                    <FiPlus />
                                                </div>
                                            </button>

                                            <div
                                                className={`accordion-content ${isActive ? "open" : ""
                                                    }`}
                                            >
                                                <div className="certification-accordion-inner">
                                                    {item.certifications.length > 0 && (
                                                        <div className="certification-grid">
                                                            {item.certifications.map((cert, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="certification-card"
                                                                >
                                                                    <h4>{cert.title}</h4>
                                                                    <p>
                                                                        {cert.label && <b>{cert.label}: </b>}
                                                                        <span dangerouslySetInnerHTML={{ __html: cert.value }} />
                                                                    </p>
                                                                </div>

                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })

                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CertificationAccordion;
