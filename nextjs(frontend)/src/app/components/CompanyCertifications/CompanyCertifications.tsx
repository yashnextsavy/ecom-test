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





const CompanyCertifications = () => {
    return (

        <section className="cert-grid my-12 noslider-grid">
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
                                <span  className="btn-primary small-btn whitespace-nowrap">
                                   Explore Vouchers <span className='inline-button-arrow'> <CgChevronRight className='primary-btn-first-arrow' /> <CgChevronRight className='primary-btn-second-arrow' />  </span>
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>


             
            </div>
        </section>
    );
};

export default CompanyCertifications;
