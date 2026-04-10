'use client';

import React from 'react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import { CgChevronRight } from 'react-icons/cg';
import Link from 'next/link';



const companies = [
    { name: 'Oracle', logo: '/assets/images/company-certifications.svg' },
    { name: 'CompTIA', logo: '/assets/images/company-certifications.svg' },
    { name: 'AWS', logo: '/assets/images/company-certifications.svg' },
    { name: 'Cisco', logo: '/assets/images/company-certifications.svg' },
    { name: 'SAS', logo: '/assets/images/company-certifications.svg' },
    { name: 'ISACA', logo: '/assets/images/company-certifications.svg' },
    { name: 'Salesforce', logo: '/assets/images/company-certifications.svg' },
    { name: 'Microsoft', logo: '/assets/images/company-certifications.svg' },
    { name: 'VMware', logo: '/assets/images/company-certifications.svg' },
    { name: 'Check Point', logo: '/assets/images/company-certifications.svg' },
    { name: 'Kubernetes', logo: '/assets/images/company-certifications.svg' },
    { name: 'EC-Council', logo: '/assets/images/company-certifications.svg' },
    { name: 'Pega', logo: '/assets/images/company-certifications.svg' },
    { name: 'Dell EMC', logo: '/assets/images/company-certifications.svg' },
    { name: 'Fortinet', logo: '/assets/images/company-certifications.svg' },
];





const CompanyCertificationsWithSlider = () => {
    return (



        <section className="cert-grid cert-grid-wrapper">
            <div className='container-custom mx-auto'>
                {/* DESKTOP GRID */}
                <div className="cert-grid__desktop">
                    {companies.map((item) => (
                        <Link href="#" key={item.name} className="cert-card">
                            <div className="cert-card__inner">
                                <span className="cert-card__badge">UPTO 30% OFF</span>
                                <img src={item.logo} alt={item.name} />
                            </div>

                            <div className="cert-card__cta">
                                <span className="hidden! lg:flex! btn-primary small-btn whitespace-nowrap">
                                    Explore Vouchers <span className='inline-button-arrow'> <CgChevronRight className='primary-btn-first-arrow' /> <CgChevronRight className='primary-btn-second-arrow' />  </span>
                                </span>
                                <span className="btn-primary small-btn whitespace-nowrap lg:hidden!">
                                    Explore <span className='inline-button-arrow'> <CgChevronRight className='primary-btn-first-arrow' /> <CgChevronRight className='primary-btn-second-arrow' />  </span>
                                </span>

                            </div>
                        </Link>
                    ))}
                </div>


                {/* MOBILE SLIDER */}

                {/* <div className="cert-grid__mobile">
                    <Splide
                        options={{
                            perPage: 1,
                            
                            gap: '16px',
                            arrows: false,
                            pagination: false,
                            drag: true,

                        }}
                    >






                        {companies.map((item) => (

                            <SplideSlide key={item.name}>
                                <div className="cert-card">
                                    <span className="cert-card__badge">UPTO 30% OFF</span>
                                    <img src={item.logo} alt={item.name} />
                                    <button className="cert-card__cta">Explore Vouchers</button>

                                </div>
                            </SplideSlide>
                        ))}
                    </Splide>
                </div> */}
            </div>
        </section>
    );
};

export default CompanyCertificationsWithSlider;
