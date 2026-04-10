'use client';

import React from 'react';
import { HiMiniChevronRight } from "react-icons/hi2";
import Link from 'next/link';
import { ContactInformation } from '@/lib/api';



const formatDisplayNumber = (number?: string) =>
    number?.startsWith("+91") && !number.includes("-")
        ? number.replace("+91", "+91-")
        : number;




interface Props {
    contactInfoData?: ContactInformation;
}

export default function SearchContact({ contactInfoData }: Props) {

    const details = contactInfoData?.contactDetails;

    const whatsappNumber = details?.whatsappNumber?.replace(/\D/g, "");

    const whatsappLink =
        whatsappNumber && whatsappNumber.length >= 10
            ? `https://wa.me/${whatsappNumber}`
            : "#";

    return (
        <section className="search-page-contact contact-wrapper">



            <div className="container-custom mx-auto">

                <div className="contact-content-wrapper flex flex-col lg:flex-row gap-10 items-start z-1 relative">

                    {/* Left */}
                    <div className="search-not-found-title w-full lg:w-1/2">
                        <h2>
                            Unable to find what you're searching for? Contact us for assistance.
                        </h2>

                        <p>
                            Contact our team for assistance with exam voucher selection,
                            purchasing, or certification-related queries.
                        </p>
                    </div>

                    {/* Right */}

                    {/* <div className="contact-info w-full lg:w-1/2">

                       
                        <ul className="contact-info-list md:mt-8 lg:mt-0">

                        
                            <li className='w-full'>
                                <Link
                                    className="flex w-full flex-row items-center justify-between gap-4"
                                    href={whatsappLink}
                                >
                                    <div className='flex flex-row items-start gap-3 w-full'>
                                        <img
                                            alt="divider icon"
                                            width={54}
                                            height={54}
                                            className="rounded-full faq-divider-line"
                                            src="/assets/images/getInTouch-whatsapp.svg"
                                        />
                                        <div className='contact-social-links link-underline'>
                                            <h5 className='mb-2.5'>WhatsApp</h5>
                                            <p>Chat With Us</p>
                                        </div>
                                    </div>

                                    <HiMiniChevronRight />
                                </Link>
                            </li>

                            <div className="faq-divider my-6 lg:my-8">
                                <img
                                    alt="divider icon"
                                    className="faq-divider-line"
                                    src="/assets/images/faq-dashed-line.svg"
                                />
                            </div>

                           
                            <li className='w-full'>
                                <Link
                                    className="flex w-full flex-row items-center justify-between gap-4"
                                    href={`tel:${details?.callNumber}`}
                                >
                                    <div className='flex flex-row items-start gap-3 w-full'>
                                        <img
                                            alt="divider icon"
                                            width={54}
                                            height={54}
                                            className="rounded-full faq-divider-line"
                                            src="/assets/images/getInTouch-phone.svg"
                                        />
                                        <div className='contact-social-links link-underline'>
                                            <h5 className='mb-2.5'>Call Us</h5>
                                          
                                            <p>{formatDisplayNumber(details?.callNumber)}</p>
                                        </div>
                                    </div>

                                    <HiMiniChevronRight />
                                </Link>
                            </li>

                            <div className="faq-divider my-6 lg:my-8">
                                <img
                                    alt="divider icon"
                                    className="faq-divider-line"
                                    src="/assets/images/faq-dashed-line.svg"
                                />
                            </div>

                           
                            <li className='w-full'>
                                <Link
                                    className="flex w-full flex-row items-center justify-between gap-4"
                                    href={`mailto:${details?.email ?? "info@globalitsuccess.com"}`}
                                >
                                    <div className='flex flex-row items-start gap-3 w-full'>
                                        <img
                                            alt="divider icon"
                                            width={54}
                                            height={54}
                                            className="rounded-full faq-divider-line"
                                            src="/assets/images/getInTouch-email.svg"
                                        />
                                        <div className='contact-social-links link-underline'>
                                            <h5 className='mb-2.5'>Email Us</h5>
                                            <p>{details?.email}</p>
                                        </div>
                                    </div>

                                    <HiMiniChevronRight />
                                </Link>
                            </li>

                            <div className="faq-divider my-6 lg:my-8">
                                <img
                                    alt="divider icon"
                                    className="faq-divider-line"
                                    src="/assets/images/faq-dashed-line.svg"
                                />
                            </div>

                          
                            <li className='w-full'>
                                <Link
                                    className="flex w-full flex-row items-center justify-between gap-4"
                                    href={details?.mapLocationUrl ?? "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <div className='flex flex-row items-start gap-3 w-full'>
                                        <img
                                            alt="divider icon"
                                            width={54}
                                            height={54}
                                            className="rounded-full faq-divider-line"
                                            src="/assets/images/getInTouch-location.svg"
                                        />
                                        <div className='contact-social-links link-underline'>
                                            <h5 className='mb-2.5'>Visit Us</h5>
                                            <p>Go to Maps</p>
                                        </div>
                                    </div>

                                    <HiMiniChevronRight />
                                </Link>
                            </li>

                        </ul>

                    </div> */}
                    <div className="contact-info w-full lg:w-1/2">
                        <ul className="contact-info-list md:mt-8 lg:mt-0">

                            {/* WhatsApp */}
                            <li className='w-full'>
                                <Link
                                    className="flex w-full flex-row items-center justify-between gap-4"
                                    href={whatsappLink}
                                >
                                    <div className='flex flex-row items-start gap-3 w-full'>
                                        <div>
                                            <img
                                                alt="divider icon"
                                                width={54}
                                                height={54}
                                                className="rounded-full faq-divider-line"
                                                src="/assets/images/getInTouch-whatsapp.svg"
                                            />
                                        </div>

                                        <div className='contact-social-links'>
                                            <h5 className='mb-2.5'>WhatsApp</h5>
                                            <div className='secondary-btn-link-contact inline-flex justify-center items-center'>
                                                <p>Chat With Us</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <HiMiniChevronRight />
                                    </div>
                                </Link>
                            </li>

                            <div className="faq-divider my-6 lg:my-8">
                                <img
                                    alt="divider icon"
                                    className="faq-divider-line"
                                    src="/assets/images/faq-dashed-line.svg"
                                />
                            </div>

                            {/* Call */}
                            <li className='w-full'>
                                <Link
                                    className="flex w-full flex-row items-center justify-between gap-4"
                                    href={`tel:${details?.callNumber}`}
                                >
                                    <div className='flex flex-row items-start gap-3 w-full'>
                                        <div>
                                            <img
                                                alt="divider icon"
                                                width={54}
                                                height={54}
                                                className="rounded-full faq-divider-line"
                                                src="/assets/images/getInTouch-phone.svg"
                                            />
                                        </div>

                                        <div className='contact-social-links'>
                                            <h5 className='mb-2.5'>Call Us</h5>
                                            <div className='secondary-btn-link-contact inline-flex justify-center items-center'>
                                                <p>{formatDisplayNumber(details?.callNumber)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <HiMiniChevronRight />
                                    </div>
                                </Link>
                            </li>

                            <div className="faq-divider my-6 lg:my-8">
                                <img
                                    alt="divider icon"
                                    className="faq-divider-line"
                                    src="/assets/images/faq-dashed-line.svg"
                                />
                            </div>

                            {/* Email */}
                            <li className='w-full'>
                                <Link
                                    className="flex w-full flex-row items-center justify-between gap-4"
                                    href={`mailto:${details?.email ?? "info@globalitsuccess.com"}`}
                                >
                                    <div className='flex flex-row items-start gap-3 w-full'>
                                        <div>
                                            <img
                                                alt="divider icon"
                                                width={54}
                                                height={54}
                                                className="rounded-full faq-divider-line"
                                                src="/assets/images/getInTouch-email.svg"
                                            />
                                        </div>

                                        <div className='contact-social-links'>
                                            <h5 className='mb-2.5'>Email Us</h5>
                                            <div className='secondary-btn-link-contact inline-flex justify-center items-center'>
                                                <p className='small-fonts'>{details?.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <HiMiniChevronRight />
                                    </div>
                                </Link>
                            </li>

                            <div className="faq-divider my-6 lg:my-8">
                                <img
                                    alt="divider icon"
                                    className="faq-divider-line"
                                    src="/assets/images/faq-dashed-line.svg"
                                />
                            </div>

                            {/* Location */}
                            <li className='w-full'>
                                <Link
                                    className="flex w-full flex-row items-center justify-between gap-4"
                                    href={details?.mapLocationUrl ?? "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <div className='flex flex-row items-start gap-3 w-full'>
                                        <div>
                                            <img
                                                alt="divider icon"
                                                width={54}
                                                height={54}
                                                className="rounded-full faq-divider-line"
                                                src="/assets/images/getInTouch-location.svg"
                                            />
                                        </div>

                                        <div className='contact-social-links'>
                                            <h5 className='mb-2.5'>Visit Us</h5>
                                            <div className='secondary-btn-link-contact inline-flex justify-center items-center'>
                                                <p>Go to Maps</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <HiMiniChevronRight />
                                    </div>
                                </Link>
                            </li>

                        </ul>
                    </div>

                </div>


            </div>

        </section>
    );
}