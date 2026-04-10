'use client'
import React, { useRef, useEffect } from "react";
import { FiMail, FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";


type InformationsPopupProps = {
    isOpen: boolean
    title?: string
    description?: string
    type?: "success" | "error" | "information"
    emailLink?: string
    phoneLink?: string
    whatsappLink?: string
    onClose: () => void
}

const InformationsPopup = ({
    isOpen,
    title,
    description,
    type = "information",
    emailLink,
    phoneLink,
    whatsappLink,
    onClose
}: InformationsPopupProps) => {

    const popupRef = useRef<HTMLDivElement>(null)

    /* Disable body scroll */
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "auto"
        }

        return () => {
            document.body.style.overflow = "auto"
        }
    }, [isOpen])


    if (!isOpen) return null


    const handleOverlayClick = (e: React.MouseEvent) => {
        if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
            onClose()
        }
    }


    return (
        <div
            className="additional-information-popup-overlay"
            onClick={handleOverlayClick}
        >

            <div
                className="additional-information-popup"
                ref={popupRef}
            >

                <button
                    className="popup-close-btn"
                    onClick={onClose}
                >
                    ×
                </button>

                {/* <h2 className="">
                    {title}
                </h2> */}
                <div className="popup-title-wrapper flex items-center justify-start">


                    <h2 className="popup-title">
                        {title}
                    </h2>

                </div>

                <div
                    className="popup-content"
                    dangerouslySetInnerHTML={{
                        __html: description || ""
                    }}
                />

                {(emailLink || phoneLink || whatsappLink) && (
                    <div className="popup-contact-buttons">

                        {emailLink && (
                            <a
                                href={emailLink}
                                className="popup-contact-btn"
                                target="_blank"
                            >
                                <FiMail />
                            </a>
                        )}

                        {phoneLink && (
                            <a
                                href={phoneLink}
                                className="popup-contact-btn"
                            >
                                <FiPhone />
                            </a>
                        )}

                        {whatsappLink && (
                            <a
                                href={whatsappLink}
                                className="popup-contact-btn"
                                target="_blank"
                            >
                                <FaWhatsapp />
                            </a>
                        )}

                    </div>
                )}

            </div>

        </div>
    )
}

export default InformationsPopup