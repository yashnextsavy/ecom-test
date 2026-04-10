import { AiOutlineMail } from "react-icons/ai";
import { FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { HiOutlineChevronRight } from "react-icons/hi";
import { getContactPageData } from "@/lib/apis/payload-api";
import GoogleTranslate from "../GoogleTranslate/GoogleTranslate";

const formatDisplayNumber = (number?: string) =>
    number?.startsWith("+91") && !number.includes("-")
        ? number.replace("+91", "+91-")
        : number;

const TopContactBar = async () => {
    let contactData: Awaited<ReturnType<typeof getContactPageData>> | null = null;
    try {
        contactData = await getContactPageData();
    } catch {
        contactData = null;
    }
    const contact = contactData?.data?.contactDetails;
    const formattedCallNumber = formatDisplayNumber(contact?.callNumber);
    const formattedWhatsappNumber = formatDisplayNumber(contact?.whatsappNumber);
    const whatsappLinkNumber = contact?.whatsappNumber?.replace(/[^\d]/g, "");


    return (

        <>

            {/* <pre> {JSON.stringify(contactData, null, 2)}
            </pre> */}

            <div className="top-contact-bar-wrapper">
                <div className="container-custom top-contact-bar-inner">
                    <nav aria-label="Contact information">

                        <a href={`mailto:${contact?.email}`}>
                            <span className="mr-1"><AiOutlineMail /></span>
                            {contact?.email}
                            <span className="hover-arrow">
                                <HiOutlineChevronRight />
                            </span>
                        </a>

                        <a href={`tel:${contact?.callNumber}`}>
                            <span className="mr-1"><FiPhone /></span>
                            {formattedCallNumber}
                            <span className="hover-arrow">
                                <HiOutlineChevronRight />
                            </span>
                        </a>

                        <a
                            href={`https://wa.me/${whatsappLinkNumber}`}
                            target="_blank"
                            rel="noopener"
                        >
                            <span className="mr-1">
                                <FaWhatsapp className="text-[#6BD65F]" />
                            </span>
                            {formattedWhatsappNumber}
                            <span className="hover-arrow">
                                <HiOutlineChevronRight />
                            </span>
                        </a>

                    </nav>
                    <div className="top-contact-translate">
                        <GoogleTranslate />
                    </div>
                </div>
            </div>



        </>

    )
}


export default TopContactBar
