'use client';

import { useEffect, useState } from 'react';


type FAQItem = {
    id: string;
    question: string;
    answer: string;
};

type FAQCategory = {
    id: string;
    categoryTitle: string;
    faqs: FAQItem[];
};

type FAQSectionData = {
    sectionInfo?: {
        title?: string;
        description?: string;
    };
    faqCategories?: FAQCategory[];
};

interface Props {
    faqData?: FAQSectionData;
}








const FaqSection = ({ faqData }: Props) => {
    const [showAll, setShowAll] = useState(false);
    const categories = faqData?.faqCategories || [];
    const hasFaqs =
        categories.some((cat) => cat.faqs && cat.faqs.length > 0);

    if (!hasFaqs) return null;
    
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [openId, setOpenId] = useState<string | null>(null);


    const currentActiveTab =
        activeTab ?? categories[0]?.id ?? null;

    const activeCategory = categories.find(
        (cat) => cat.id === currentActiveTab
    );
    const filteredFaqs = activeCategory?.faqs || [];

    const currentOpenId = openId;





    return (
        <section className="faq-section-wrapper">

            <div className="container-custom mx-auto overflow-x-hidden">
                <div className="faq-wrapper">
                    <div className="faq-header">
                        <div className="faq-header-left">
                            <h2>Frequently<br />Asked Questions</h2>

                        </div>

                        <div className="faq-header-right">
                            <p>
                                Find quick answers to the most common questions about exam vouchers,
                                validity, usage, return, refunds and support, so you can move
                                forward with confidence.
                            </p>
                        </div>
                    </div>
                    <div className='faq-tabs-wrapper'>

                        <div className="faq-tabs">
                            {/* <button
                                className={`faq-tab ${activeTab === 'general' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab('general');
                                    setShowAll(false);
                                    setOpenId(null);
                                }}
                            >
                                General
                            </button>
                            <button
                                className={`faq-tab ${activeTab === 'refund' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab('refund');
                                    setShowAll(false);
                                    setOpenId(null);
                                }}
                            >
                                Return & Refund
                            </button>
                            <button
                                className={`faq-tab ${activeTab === 'policies' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab('policies');
                                    setShowAll(false);
                                    setOpenId(null);
                                }}
                            >
                                Policies
                            </button> */}
                            <div className="faq-tabs">
                                {categories.map((category) =>
                                    category.categoryTitle ? (
                                        <button
                                            key={category.id}
                                            className={`faq-tab ${currentActiveTab === category.id ? 'active' : ''
                                                }`}
                                            onClick={() => {
                                                setActiveTab(category.id);
                                                setShowAll(false);
                                                setOpenId(null);
                                            }}
                                        >
                                            {category.categoryTitle}
                                        </button>
                                    ) : null
                                )}
                            </div>
                        </div>
                    </div>


                    <div className="faq-list">
                        {(showAll ? filteredFaqs : filteredFaqs.slice(0, 3)).map((faq) => {

                            const isOpen = currentOpenId === faq.id;
                            return (
                                <div

                                    key={faq.id}
                                    className={`faq-item ${isOpen ? 'open' : ''}`}
                                >

                                    {/* <div className="faq-divider">
                                        <img alt="divider icon" className="faq-divider-question" src="/assets/images/faq-dashed-line.svg" />
                                    </div> */}


                                    <button
                                        className="faq-question"
                                        onClick={() => {
                                            setOpenId(isOpen ? null : faq.id);
                                        }}
                                    >
                                        <span>{faq.question}</span>
                                        <span className={`faq-icon ${isOpen ? 'open' : ''}`}>
                                            +
                                        </span>
                                    </button>

                                    <div className="faq-answer">
                                        <div className='faq-content-wrapper' dangerouslySetInnerHTML={{ __html: faq.answer }} />
                                    </div>




                                </div>
                            );
                        })}
                        {/* <div className="faq-divider">
                            <img alt="divider icon" className="faq-divider-line" src="/assets/images/faq-dashed-line.svg" />
                        </div> */}

                        <div className="faq-view-more">
                            {filteredFaqs.length > 3 && (
                                <button
                                    className="faq-view-more-button"
                                    onClick={() => setShowAll((prev) => !prev)}
                                >
                                    {showAll ? '− View Less Questions −' : '+ View More Questions +'}
                                </button>
                            )}

                        </div>

                    </div>





                </div>
            </div>

        </section>

    );
};

export default FaqSection;
