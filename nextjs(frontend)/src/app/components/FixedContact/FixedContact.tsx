'use client'

import { useState, useEffect } from "react"
import { FaWhatsapp } from "react-icons/fa"
import { BsChatSquareText } from "react-icons/bs"
import DefaultContactPopup from "../DefaultContactPopup/DefaultContactPopup"
import InformationsPopup from "../InformationsPopup/InformationsPopup"
import { usePathname } from "next/navigation"


const FixedContact = ({ contactData, categoryData }: any) => {
    const [isOpen, setIsOpen] = useState(false)

    const contact = contactData?.contactDetails;

    const whatsappNumber = contact?.whatsappNumber?.replace(/\D/g, "") || "";
    const phoneNumber = contact?.callNumber || "";
    const email = contact?.email || "";

    // const [isOpen, setIsOpen] = useState(false)
    const [showThankYou, setShowThankYou] = useState(false)
    const [isVisible, setIsVisible] = useState(true)
    const pathname = usePathname()


    useEffect(() => {
        const handleVisibility = () => {
            const width = window.innerWidth

            // Hide completely on specific pages
            if (
                pathname === "/checkout" ||
                pathname === "/thank-you" ||
                pathname === "/payment-success"
            ) {
                setIsVisible(false)
                return
            }

            // Special rule for /cart
            if (pathname === "/cart") {
                setIsVisible(width >= 1440)
                return
            }

            // Default: visible
            setIsVisible(true)
        }

        handleVisibility()
        window.addEventListener("resize", handleVisibility)

        return () => window.removeEventListener("resize", handleVisibility)
    }, [pathname])


    const handleSuccess = () => {
        setIsOpen(false);

        setTimeout(() => {
            setShowThankYou(true);
        }, 300);
    };

    if (!isVisible) return null;



    return (
        <>
            <div className="default-contact-us-floating-wrapper">

                {/*  WhatsApp */}
                {whatsappNumber && (
                    <a
                        href={`https://wa.me/${whatsappNumber}`}
                        target="_blank"
                        className="default-contact-us-btn whatsapp"
                    >
                        <FaWhatsapp />
                    </a>
                )}

                {/*  Contact Popup Button */}
                <button
                    className="default-contact-us-btn contact"
                    onClick={() => setIsOpen(true)}
                >
                    <BsChatSquareText />
                </button>

            </div>

            {/*  Popup with dynamic data */}
            <DefaultContactPopup
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                emailLink={email}
                phoneLink={phoneNumber}
                whatsappLink={whatsappNumber}
                onSuccess={handleSuccess}
                categories={categoryData?.product_categories || []}

            />


            {showThankYou && (
                <InformationsPopup
                    isOpen={showThankYou}
                    title="Thank you."
                    description="Your request has been submitted successfully."
                    type="success"
                    onClose={() => setShowThankYou(false)}

                />


            )}
        </>
    )
}

export default FixedContact