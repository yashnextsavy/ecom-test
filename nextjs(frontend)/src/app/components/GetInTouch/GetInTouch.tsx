'use client';

import React, { useState, useEffect, useRef } from 'react';
import { HiMiniChevronRight } from "react-icons/hi2";
import { AiOutlineMail } from "react-icons/ai";
import Link from 'next/link';
import { ContactInformation } from '@/lib/api';
import { getData } from "country-list";
import InformationsPopup from '../InformationsPopup/InformationsPopup';
import { getDialCodeValue, getFormattedDialCode } from '@/lib/utils/countryUtils';
import ReactCountryFlag from "react-country-flag";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import ReCAPTCHA from "react-google-recaptcha";

type Option = {
    label: string;
    value: string;
    code?: string;
    dialCode?: string;
};

type CustomSelectProps = {
    name: string;
    value: string;
    options: Option[];
    placeholder: string;
    onChange: (name: string, value: string) => void;
    openDropdown: string | null;
    setOpenDropdown: (name: string | null) => void;
    disabled?: boolean;
    renderOption?: (option: Option, isActive: boolean) => React.ReactNode;
};

const formatDisplayNumber = (number?: string) =>
    number?.startsWith("+91") && !number.includes("-")
        ? number.replace("+91", "+91-")
        : number;




// const CustomSelect = ({
//     name,
//     value,
//     options,
//     placeholder,
//     onChange,
//     openDropdown,
//     setOpenDropdown,
//     disabled = false,
//     onDisabledClick,
// }: CustomSelectProps & {
//     onDisabledClick?: () => void;
// }) => {

//     const isOpen = openDropdown === name;

//     const [searchTerm, setSearchTerm] = useState("");

//     // reset search when closing
//     useEffect(() => {
//         if (!isOpen) setSearchTerm("");
//     }, [isOpen]);

//     const filteredOptions = options.filter((opt) =>
//         opt.label.toLowerCase().includes(searchTerm.toLowerCase())
//     );

//     const selectedLabel =
//         options.find((opt) => opt.value === value)?.label || '';

//     return (
//         <div className="custom-select">
//             <button
//                 type="button"
//                 className={`custom-select-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled-vendor' : ''}`}
//                 onClick={(e) => {
//                     e.stopPropagation();

//                     if (disabled) {
//                         onDisabledClick?.();
//                         return;
//                     }

//                     setOpenDropdown(isOpen ? null : name);
//                 }}
//             >
//                 <span className={!value ? 'placeholder' : ''}>
//                     {value ? selectedLabel : placeholder}
//                 </span>
//                 <span className={`chevron ${isOpen ? 'rotate' : ''}`} />
//             </button>

//             {isOpen && (
//                 <div className="custom-select-dropdown">

//                     {/* 🔍 Search */}
//                     <input
//                         type="text"
//                         className="custom-select-search"
//                         placeholder="Type to search..."
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                         autoFocus
//                         onClick={(e) => e.stopPropagation()}
//                     />

//                     {/* Options */}
//                     {filteredOptions.length > 0 ? (
//                         filteredOptions.map((option) => (
//                             <div
//                                 key={option.value}
//                                 className="custom-select-option"
//                                 onClick={() => {
//                                     if (disabled) return;

//                                     onChange(name, option.value);
//                                     setOpenDropdown(null);
//                                 }}
//                             >
//                                 {option.label}
//                             </div>
//                         ))
//                     ) : (
//                         <div className="custom-select-option disabled">
//                             No results found
//                         </div>
//                     )}
//                 </div>
//             )}
//         </div>
//     );
// };


const CustomSelect = ({
    name,
    value,
    options,
    placeholder,
    onChange,
    openDropdown,
    setOpenDropdown,
    disabled = false,
    onDisabledClick,
    renderOption,
}: CustomSelectProps & {
    onDisabledClick?: () => void;
}) => {

    const isOpen = openDropdown === name;

    const [searchTerm, setSearchTerm] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);



    const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

    // reset on close
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm("");
            setActiveIndex(-1);
        }
    }, [isOpen]);

    // filter
    // const filteredOptions = options.filter((opt) =>
    //     opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    // );


    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().startsWith(searchTerm.toLowerCase())
    );
    //     const normalizedSearch = searchTerm.trim().toLowerCase();

    // const filteredOptions = options.filter((opt) =>
    //     opt.label.toLowerCase().startsWith(normalizedSearch)
    // );



    // reset index on search/open
    useEffect(() => {
        if (isOpen) setActiveIndex(0);
    }, [isOpen]);

    useEffect(() => {
        setActiveIndex(0);
    }, [searchTerm]);

    // scroll active item into view
    useEffect(() => {
        if (activeIndex >= 0) {
            optionRefs.current[activeIndex]?.scrollIntoView({
                block: "nearest",
            });
        }
    }, [activeIndex]);

    // truncate helper
    const truncate = (text: string, max = 40) =>
        text.length > max ? text.slice(0, max) + "..." : text;

    const selectedLabel =
        options.find((opt) => opt.value === value)?.label || '';

    const selectedOption = options.find((opt) => opt.value === value);





    return (
        <div className="custom-select">
            <button
                type="button"
                className={`custom-select-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled-vendor' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();

                    if (disabled) {
                        onDisabledClick?.();
                        return;
                    }

                    setOpenDropdown(isOpen ? null : name);
                }}
            >
                <span className={!value ? 'placeholder' : ''}>
                    {/* {value ? truncate(selectedLabel) : placeholder} */}
                    {renderOption && selectedOption
                        ? renderOption(selectedOption, false)
                        : (value ? truncate(selectedLabel) : placeholder)}

                </span>
                <span className={`chevron ${isOpen ? 'rotate' : ''}`} />
            </button>

            {isOpen && (
                <div
                    className="custom-select-dropdown"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 🔍 Search */}
                    <input
                        type="text"
                        className="custom-select-search"
                        placeholder="Type to search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                            if (!filteredOptions.length) return;

                            if (e.key === "ArrowDown") {
                                e.preventDefault();
                                setActiveIndex((prev) =>
                                    prev < filteredOptions.length - 1 ? prev + 1 : 0
                                );
                            }

                            if (e.key === "ArrowUp") {
                                e.preventDefault();
                                setActiveIndex((prev) =>
                                    prev > 0 ? prev - 1 : filteredOptions.length - 1
                                );
                            }

                            if (e.key === "Enter") {
                                e.preventDefault();
                                const selected = filteredOptions[activeIndex];
                                if (selected) {
                                    onChange(name, selected.value);
                                    setOpenDropdown(null);
                                }
                            }

                            if (e.key === "Escape") {
                                setOpenDropdown(null);
                            }
                        }}
                    />

                    {/* Options */}
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, index) => (
                            <div
                                key={option.value}
                                ref={(el) => {
                                    optionRefs.current[index] = el
                                }}
                                className={`custom-select-option ${index === activeIndex ? "active" : ""
                                    }`}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => {
                                    if (disabled) return;

                                    onChange(name, option.value);
                                    setOpenDropdown(null);
                                }}
                            >
                                {/* {option.label} */}
                                {renderOption
                                    ? renderOption(option, index === activeIndex)
                                    : option.label}
                            </div>
                        ))
                    ) : (
                        <div className="custom-select-option disabled">
                            No results found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


type FormState = {
    fullName: string;
    email: string;
    mobile: string;
    country: string;
    phoneCountry: string;
    dialCode: string;
    vendor: string;
    course: string;
    message: string;
    // phoneInput: string;
};

type FormErrors = Partial<Record<keyof FormState, string>> & {
    captcha?: string;
};

type DetectedCountry = {
    country: string;
    dialCode: string;
};

const initialState: FormState = {
    fullName: '',
    email: '',
    mobile: '',
    country: '',
    phoneCountry: '',
    dialCode: '',
    vendor: '',
    course: '',
    message: '',
    // phoneInput: '',
};

interface Props {
    contactInfoData?: ContactInformation;
    categories?: any[];
}


export default function GetInTouch({ contactInfoData, categories = [] }: Props) {


    const [form, setForm] = useState<FormState>(initialState);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const details = contactInfoData?.contactDetails;
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);


    const [courseOptions, setCourseOptions] = useState<Option[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [detectedCountryData, setDetectedCountryData] = useState<DetectedCountry | null>(null);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [captchaClicked, setCaptchaClicked] = useState(false);
    const [phoneSearch, setPhoneSearch] = useState("");
    const phoneOptionRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);



    useEffect(() => {
        phoneOptionRefs.current[activeIndex]?.scrollIntoView({
            block: "nearest",
        });
    }, [activeIndex]);


    useEffect(() => {
        if (openDropdown !== "phoneCountry") {
            setPhoneSearch("");
            setActiveIndex(0);
        }
    }, [openDropdown]);




    useEffect(() => {
        if (!form.vendor) {
            setCourseOptions([]);
            return;
        }

        async function fetchCourses() {
            try {
                setLoadingCourses(true);

                const res = await fetch(`/api/courses?vendor=${form.vendor}`);
                const data = await res.json();

                const formatted = (data.products || []).map((product: any) => ({
                    label: product.title,
                    value: product.handle,
                })).sort((a: Option, b: Option) => a.label.localeCompare(b.label));

                setCourseOptions(formatted);
            } catch (err) {
                console.error("Failed to load courses", err);
            } finally {
                setLoadingCourses(false);
            }
        }

        fetchCourses();
    }, [form.vendor]);


    useEffect(() => {
        setForm(prev => ({ ...prev, course: "" }));
    }, [form.vendor]);


    const [popupData, setPopupData] = useState<{
        title: string;
        description: string;
    } | null>(null);

    const countryOptions = [
        {
            label: "India",
            value: "India",
            code: "IN",
        },
        ...getData()
            .filter((country) => country.code !== "IN")
            .map((country) => ({
                label: country.name,
                value: country.name,
                code: country.code,
            })),
    ].sort((a, b) => a.label.localeCompare(b.label));;

    // const countryOptions = [
    //     {
    //         label: "India (+91)",
    //         value: "India",
    //     },
    //     ...getData()
    //         .filter((country) => country.code !== "IN")
    //         .map((country) => {
    //             const dialCode = countryToDialCode[country.name];
    //             return {
    //                 label: `${country.name} (+${dialCode})`,
    //                 value: country.name,
    //             };
    //         }),
    // ];


    const phoneCountryOptions: Option[] = countryOptions.map((c) => ({
        label: `${c.label} (${getFormattedDialCode(c.value, c.code)})`,
        value: c.value,
        code: c.code,
        dialCode: getDialCodeValue(c.value, c.code),
    }));



    const filteredPhoneOptions = phoneCountryOptions.filter((opt) => {
        const normalizedSearch = phoneSearch.trim().toLowerCase().replace(/^\+/, "");
        const normalizedLabel = opt.label.toLowerCase();
        const normalizedValue = opt.value.toLowerCase();
        const normalizedDialCode = opt.dialCode?.toLowerCase() || "";

        if (!normalizedSearch) return true;

        return (
            normalizedLabel.startsWith(normalizedSearch) ||
            normalizedValue.startsWith(normalizedSearch) ||
            normalizedDialCode.startsWith(normalizedSearch)
        );
    });




    const whatsappNumber = details?.whatsappNumber?.replace(/\D/g, "");

    const whatsappLink =
        whatsappNumber && whatsappNumber.length >= 10
            ? `https://wa.me/${whatsappNumber}`
            : "#";


    useEffect(() => {
        const handleClickOutside = () => {
            setOpenDropdown(null);
        };

        window.addEventListener("click", handleClickOutside);

        return () => {
            window.removeEventListener("click", handleClickOutside);
        };
    }, []);



    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        // let updatedValue = value;

        //  Mobile: allow only numbers + max 12 digits
        // if (name === "mobile") {
        //     updatedValue = value.replace(/\D/g, "").slice(0, 12);
        // }

        if (name === "mobile") {
            const cleaned = value.replace(/\D/g, "").slice(0, 12);

            setForm((prev) => ({
                ...prev,
                mobile: cleaned,
            }));

            setErrors((prev) => ({ ...prev, mobile: "" }));
            return;
        }


        // Auto-grow textarea
        if (e.target instanceof HTMLTextAreaElement) {
            e.target.style.height = 'auto';
            const newHeight = Math.min(e.target.scrollHeight, 350);
            e.target.style.height = `${newHeight}px`;
        }

        // setForm({ ...form, [name]: updatedValue });
        setForm({ ...form, [name]: value });
        setErrors({ ...errors, [name]: '' });
    };
    const validate = (): FormErrors => {


        const newErrors: FormErrors = {};

        if (!captchaToken) {
            newErrors.captcha = "Please verify that you are not a robot";
        }

        if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';


        if (!/^\S+@\S+\.\S+$/.test(form.email))
            newErrors.email = 'Enter a valid email address';


        if (!form.mobile || form.mobile.length < 8) {
            newErrors.mobile = "Enter a valid phone number";
        }
        if (!form.country) newErrors.country = 'Country is required';
        if (!form.vendor) newErrors.vendor = 'Vendor is required';
        if (!form.course) newErrors.course = 'Exam Name is required';
        // if (!form.message.trim()) newErrors.message = 'Message cannot be empty';
        return newErrors;

    };


    const vendorOptions = categories.map((cat) => ({
        label: cat.name,
        value: cat.handle
    })).sort((a, b) => a.label.localeCompare(b.label));


    // const handleCustomChange = (name: string, value: string) => {
    //     setForm((prev) => ({ ...prev, [name]: value }));
    //     setErrors((prev) => ({ ...prev, [name]: '' }));
    // };

    const getDialCodeForCountry = (countryName: string) => {
        const matchedCountry = countryOptions.find((country) => country.value === countryName);
        return getFormattedDialCode(countryName, matchedCountry?.code);
    };

    const handleCustomChange = (name: string, value: string) => {
        if (name === "country") {
            setForm((prev) => ({
                ...prev,
                country: value,
                phoneCountry: value,
                dialCode: getDialCodeForCountry(value),
            }));
        } else if (name === "phoneCountry") {
            setForm((prev) => ({
                ...prev,
                phoneCountry: value,
                country: value,
                dialCode: getDialCodeForCountry(value),
                mobile: "", // reset number when dial code changes
            }));
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }

        setErrors((prev) => ({
            ...prev,
            [name]: "",
            ...(name === "country" || name === "phoneCountry" ? { country: "" } : {}),
        }));
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsSubmitting(true);

        try {


            const payload: any = {
                fullName: form.fullName,
                emailID: form.email,
                mobileNumber: `${form.dialCode}${form.mobile}`,
                country: form.country,
                vendor: form.vendor,
                course: form.course,
                pageUrl: window.location.href,
                captchaToken,
            };

            if (form.message?.trim()) {
                payload.message = form.message.trim();
            }

            // if (typeof form.message === "string" && form.message.trim()) {
            //     payload.message = form.message.trim();
            // }

            console.log("Contact Form Payloadddddd:", payload);


            const res = await fetch("/api/contact-form", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),

                // body: JSON.stringify({
                //     fullName: form.fullName,
                //     emailID: form.email,
                //     mobileNumber: form.mobile,
                //     country: form.country,
                //     vendor: form.vendor,
                //     course: form.course || null,
                //     message: form.message,
                //     page_url: window.location.href,

                // }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error || "Something went wrong");
            }

            setForm(initialState);
            await detectCountry();

            setPopupData({
                title: "Thank you.",
                description: `
        <p>Your request has been submitted successfully. Our team has received your details. One of our experts will contact you shortly to guide you further.</p>
        <p>We appreciate your interest in Global IT Success.</p>
    `,

            });


        } catch (error: any) {
            console.error("Submit Error:", error);

            setPopupData({
                title: "Submission Failed",
                description: `
            <p>Failed to send message.</p>
        `,

            });
        }
        finally {
            setIsSubmitting(false);
        }
    };


    const detectCountry = async () => {
        try {
            // Call your server API route


            const res = await fetch("/api/detect-country");
            const data = await res.json();

            console.log("Country API responseeeeeeeeeeeeee:", data);

            if (!data?.country_name) throw new Error("No country detected");

            const detectedCountry = data.country_name;

            const matchedCountry = countryOptions.find(
                (c) => c.value.toLowerCase() === detectedCountry.toLowerCase()
            );

            const finalCountry = matchedCountry ? matchedCountry.value : "India";

            const dialCode = getFormattedDialCode(finalCountry, matchedCountry?.code);

            // ✅ cache it
            setDetectedCountryData({
                country: finalCountry,
                dialCode,
            });

            // ✅ apply to form
            setForm((prev) => ({
                ...prev,
                country: finalCountry,
                phoneCountry: finalCountry,
                dialCode,
            }));

        } catch (err) {
            console.error("Country detection failed", err);

            const fallback = {
                country: "India",
                dialCode: getFormattedDialCode("India", "IN"),
            };

            setDetectedCountryData(fallback);
            setForm((prev) => ({
                ...prev,
                country: fallback.country,
                phoneCountry: fallback.country,
                dialCode: fallback.dialCode,
            }));
        }
    };

    useEffect(() => {
        detectCountry();
    }, []);

    const selectedPhoneCountry = countryOptions.find(
        (c) => c.value === form.phoneCountry
    );


    useEffect(() => {
        if (openDropdown === "phoneCountry") {
            setTimeout(() => {
                phoneOptionRefs.current[0]?.focus();
            }, 0);
        }
    }, [openDropdown]);



    return (
        <section className="contact-wrapper">

            <img
                alt="Background shapes"
                className="contact-bg-image absolute right-0 top-0 bottom-0 z-0"
                src="/assets/images/get-in-touch-bg.svg"
            />

            <div className="container-custom mx-auto">
                <div className="contact-content-wrapper grid grid-cols-1 lg:grid-cols-12 gap-6 items-start z-1 relative">
                    {/* Left */}
                    <div className="contact-info col-span-1 md:col-span-12 lg:col-span-4">
                        <div className="contact-into-title">
                            <h2>{contactInfoData?.sectionInfo?.title}</h2>
                            <p>{contactInfoData?.sectionInfo?.description}</p>
                        </div>

                        <ul className="contact-info-list md:mt-8 lg:mt-0">

                            {/* whatsapp */}

                            <li className='w-full '>
                                <Link className="flex w-full flex-row items-center justify-between gap-4"
                                    href={whatsappLink}
                                >
                                    <div className='flex flex-row items-start gap-3 w-full'>
                                        <div>
                                            <img alt="divider icon" width={54} height={54} className="rounded-full faq-divider-line" src="/assets/images/getInTouch-whatsapp.svg" />
                                        </div>
                                        <div className='contact-social-links '>
                                            <h5 className='mb-2.5'>WhatsApp</h5>
                                            <div className='secondary-btn-link-contact inline-flex justify-center items-center'>
                                                <p >Chat With Us</p>
                                            </div>
                                        </div>

                                    </div>
                                    <div>
                                        <HiMiniChevronRight />
                                    </div>
                                </Link>



                            </li>

                            <div className="faq-divider my-6 lg:my-8">
                                <img alt="divider icon" className="faq-divider-line" src="/assets/images/faq-dashed-line.svg" />
                            </div>


                            {/* contact us */}
                            <li className='w-full '>
                                <Link className="flex w-full flex-row items-center justify-between gap-4" href={`tel:${details?.callNumber}`}>
                                    <div className='flex flex-row items-start gap-3 w-full'>
                                        <div>
                                            <img alt="divider icon" width={54} height={54} className="rounded-full faq-divider-line" src="/assets/images/getInTouch-phone.svg" />
                                        </div>
                                        <div className='contact-social-links '>
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
                                <img alt="divider icon" className="faq-divider-line" src="/assets/images/faq-dashed-line.svg" />
                            </div>


                            {/* email  */}
                            <li className='w-full '>
                                <Link className="flex w-full flex-row items-center justify-between gap-4" href={`mailto:${details?.email ?? "info@globalitsuccess.com"}`}>
                                    <div className='flex flex-row items-start gap-3 w-full'>
                                        <div className='w-max'>
                                            <img alt="divider icon" width={54} height={54} className="rounded-full faq-divider-line" src="/assets/images/getInTouch-email.svg" />
                                        </div>
                                        <div className='contact-social-links'>
                                            <h5 className='mb-2.5'>Email Us</h5>
                                            <div className='secondary-btn-link-contact inline-flex justify-center items-center'>
                                                <p className='small-fonts' >{details?.email}</p>
                                            </div>
                                        </div>

                                    </div>
                                    <div>
                                        <HiMiniChevronRight />
                                    </div>
                                </Link>



                            </li>

                            <div className="faq-divider my-6 lg:my-8">
                                <img alt="divider icon" className="faq-divider-line" src="/assets/images/faq-dashed-line.svg" />
                            </div>


                            {/* maps  */}
                            <li className='w-full '>
                                <Link className="flex w-full flex-row items-center justify-between gap-4" href={details?.mapLocationUrl ?? "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <div className='flex flex-row items-start gap-3 w-full '>
                                        <div>
                                            <img alt="divider icon" width={54} height={54} className="rounded-full faq-divider-line" src="/assets/images/getInTouch-location.svg" />
                                        </div>
                                        <div className='contact-social-links '>
                                            <h5 className='mb-2.5'>Visit Us</h5>
                                            <div className='secondary-btn-link-contact inline-flex justify-center items-center'>
                                                <p >Go to Maps</p>
                                            </div>

                                        </div>

                                    </div>
                                    <div>
                                        <HiMiniChevronRight />
                                    </div>
                                </Link>



                            </li>

                            <div className="faq-divider my-6 lg:my-8">
                                <img alt="divider icon" className="faq-divider-line" src="/assets/images/faq-dashed-line.svg" />
                            </div>

                        </ul>
                    </div>

                    {/* Right */}
                    <form
                        className="contact-form col-span-1 md:col-span-12 lg:col-span-8 xl:col-span-7 lg:col-start-5 xl:col-start-6"
                        onSubmit={handleSubmit}
                    >
                        <div className="contact-form-grid">
                            <div className="form-field">
                                <label>Full Name</label>
                                <input
                                    name="fullName"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    placeholder="Enter Full Name"
                                />
                                {errors.fullName && <span className="error-msg">{errors.fullName}</span>}
                            </div>

                            <div className="form-field">
                                <label>Email ID</label>
                                <input
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="Enter Email ID"
                                />
                                {errors.email && <span className="error-msg">{errors.email}</span>}
                            </div>

                            {/* <div className="form-field">
                                <label>Mobile Number</label>
                             
                                <div className="flex justify-start items-center gap-3">
                                    <span className="country-code">
                                        {form.dialCode || ""}
                                    </span>

                                    <input
                                        name="mobile"
                                        value={form.mobile}
                                        onChange={handleChange}
                                        placeholder="Enter Mobile Number"
                                        inputMode="numeric"
                                        maxLength={12}
                                        className='flex-1'
                                    />
                                </div>

                                {errors.mobile && <span className="error-msg">{errors.mobile}</span>}
                            </div> */}
                            <div className="form-field">
                                <label>Mobile Number</label>

                                <div className="phone-container">

                                    {/* LEFT: Flag + dropdown */}
                                    <div
                                        className="phone-country"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenDropdown(openDropdown === "phoneCountry" ? null : "phoneCountry");
                                        }}

                                    >

                                        <ReactCountryFlag

                                            countryCode={selectedPhoneCountry?.code || "IN"}
                                            svg
                                            style={{ width: "20px", height: "20px", marginRight: "4px" }}
                                        />
                                        <span className={`contact-country-arrow ${openDropdown === "phoneCountry" ? "rotate " : ""}`}>
                                            ▼
                                        </span>
                                    </div>

                                    {/* Dropdown */}
                                    {/* {openDropdown === "phoneCountry" && (
                                        <div className="phone-dropdown">
                                            {countryOptions.map((c) => {
                                                const dial = getDialCodeValue(c.value, c.code);
                                                return (
                                                    <div
                                                        key={c.value}
                                                        className="phone-option"
                                                        onClick={() => {
                                                            handleCustomChange("phoneCountry", c.value);
                                                            setOpenDropdown(null);
                                                        }}
                                                    >
                                                        <ReactCountryFlag
                                                            countryCode={c.code}
                                                            svg
                                                            style={{ width: "20px", height: "20px", marginRight: "8px" }}
                                                        /> {c.label} (+{dial})


                                                    </div>
                                                );
                                            })}
                                           
                                        </div>
                                    )} */}



                                    {openDropdown === "phoneCountry" && (
                                        <div
                                            className="phone-dropdown country-code-dropdown"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {/* 🔍 Search */}
                                            <input
                                                type="text"
                                                className="phone-search"
                                                placeholder="Search country..."
                                                value={phoneSearch}
                                                autoFocus
                                                onChange={(e) => setPhoneSearch(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (!filteredPhoneOptions.length) return;

                                                    // 👇 THIS IS THE FIX
                                                    if (e.key === "ArrowDown") {
                                                        e.preventDefault();
                                                        setActiveIndex(0);
                                                        phoneOptionRefs.current[0]?.focus();
                                                        return;
                                                    }

                                                    if (e.key === "ArrowUp") {
                                                        e.preventDefault();
                                                        const lastIndex = filteredPhoneOptions.length - 1;
                                                        setActiveIndex(lastIndex);
                                                        phoneOptionRefs.current[lastIndex]?.focus();
                                                        return;
                                                    }

                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        const selected = filteredPhoneOptions[activeIndex];
                                                        if (selected) {
                                                            handleCustomChange("phoneCountry", selected.value);
                                                            setOpenDropdown(null);
                                                        }
                                                    }

                                                    if (e.key === "Escape") {
                                                        setOpenDropdown(null);
                                                    }
                                                }}
                                            />

                                            {/* Options */}
                                            {filteredPhoneOptions.length > 0 ? (
                                                filteredPhoneOptions.map((c, index) => (
                                                    <div
                                                        key={c.value}
                                                        tabIndex={0}
                                                        ref={(el) => {
                                                            phoneOptionRefs.current[index] = el;
                                                        }}
                                                        className={`phone-option ${index === activeIndex ? "active" : ""
                                                            }`}
                                                        onMouseEnter={() => setActiveIndex(index)}
                                                        onClick={() => {
                                                            handleCustomChange("phoneCountry", c.value);
                                                            setOpenDropdown(null);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                handleCustomChange("phoneCountry", c.value);
                                                                setOpenDropdown(null);
                                                            }

                                                            if (e.key === "ArrowDown") {
                                                                e.preventDefault();
                                                                const next = (index + 1) % filteredPhoneOptions.length;
                                                                phoneOptionRefs.current[next]?.focus();
                                                                setActiveIndex(next);
                                                            }

                                                            if (e.key === "ArrowUp") {
                                                                e.preventDefault();
                                                                const prev =
                                                                    (index - 1 + filteredPhoneOptions.length) %
                                                                    filteredPhoneOptions.length;
                                                                phoneOptionRefs.current[prev]?.focus();
                                                                setActiveIndex(prev);
                                                            }
                                                        }}

                                                    >
                                                        <ReactCountryFlag
                                                            countryCode={c.code || "IN"}
                                                            svg
                                                            style={{ width: "20px", height: "20px", marginRight: "8px" }}
                                                        />
                                                        {c.label}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="phone-option disabled">
                                                    No results found
                                                </div>
                                            )}
                                        </div>
                                    )}



                                    {/* new */}
                                    {/* <div className="phone-country-wrapper">
                                        <CustomSelect
                                            name="phoneCountry"
                                            value={form.phoneCountry}
                                            placeholder="Select country"
                                            options={phoneCountryOptions}
                                            onChange={handleCustomChange}
                                            openDropdown={openDropdown}
                                            setOpenDropdown={setOpenDropdown}
                                            renderOption={(option) => (
                                                <div className="flex items-center gap-2">
                                                    <ReactCountryFlag
                                                        countryCode={option.code || "IN"}
                                                        svg
                                                        style={{ width: "18px", height: "18px" }}
                                                    />
                                                    <span>{option.label}</span>
                                                </div>
                                            )}
                                        />
                                    </div> */}



                                    {/* Input */}
                                    <input
                                        name="mobile"
                                        value={`${form.dialCode} ${form.mobile}`}
                                        className="phone-input flex-1"
                                        onKeyDown={(e) => {
                                            const cursor = e.currentTarget.selectionStart || 0;
                                            const lockLength = form.dialCode.length + 1;

                                            if (cursor < lockLength) {
                                                // block deletion
                                                if (e.key === "Backspace" || e.key === "Delete") {
                                                    e.preventDefault();
                                                }

                                                // block typing ONLY before prefix
                                                if (e.key.length === 1) {
                                                    e.preventDefault();
                                                }
                                            }
                                        }}

                                        onChange={(e) => {
                                            let value = e.target.value;

                                            // ✅ Always remove prefix safely (only from start)
                                            if (value.startsWith(form.dialCode)) {
                                                value = value.slice(form.dialCode.length);
                                            }

                                            // remove space after dial code
                                            value = value.trimStart();

                                            // ✅ keep only digits
                                            const cleaned = value.replace(/\D/g, "").slice(0, 12);

                                            setForm((prev) => ({
                                                ...prev,
                                                mobile: cleaned,
                                            }));

                                            setErrors((prev) => ({ ...prev, mobile: "" }));
                                        }}

                                        onClick={(e) => {
                                            const input = e.currentTarget;
                                            const lockLength = form.dialCode.length + 1;

                                            // 🎯 Always push cursor after dial code if user clicks before it
                                            if ((input.selectionStart || 0) < lockLength) {
                                                setTimeout(() => {
                                                    input.setSelectionRange(lockLength, lockLength);
                                                }, 0);
                                            }
                                        }}

                                        onFocus={(e) => {
                                            const input = e.currentTarget;
                                            const lockLength = form.dialCode.length + 1;

                                            setTimeout(() => {
                                                if ((input.selectionStart || 0) < lockLength) {
                                                    input.setSelectionRange(lockLength, lockLength);
                                                }
                                            }, 0);
                                        }}

                                    />

                                </div>
                                {errors.mobile && <span className="error-msg">{errors.mobile}</span>}

                            </div>
                            <div className="form-field">
                                <label>Country</label>
                                <CustomSelect
                                    name="country"
                                    value={form.country}
                                    placeholder="Select Country"
                                    options={countryOptions}
                                    onChange={handleCustomChange}
                                    openDropdown={openDropdown}
                                    setOpenDropdown={setOpenDropdown}
                                />

                                {errors.country && <span className="error-msg">{errors.country}</span>}
                            </div>

                            {/* <div className="form-field">
                                <label>Vendor</label>
                                <CustomSelect
                                    name="vendor"
                                    value={form.vendor}
                                    placeholder="Select Vendor"
                                    options={vendorOptions}
                                    onChange={handleCustomChange}
                                    openDropdown={openDropdown}
                                    setOpenDropdown={setOpenDropdown}
                                />

                                {errors.vendor && <span className="error-msg">{errors.vendor}</span>}
                            </div> */}
                            <div className="form-field">
                                <label>Vendor</label>
                                <CustomSelect
                                    name="vendor"
                                    value={form.vendor}
                                    placeholder="Select Vendor"
                                    options={vendorOptions}
                                    disabled={false}
                                    onDisabledClick={() => {
                                        setErrors((prev) => ({
                                            ...prev,
                                            vendor: "Please select vendor first",
                                        }));
                                    }}
                                    onChange={(name: string, value: string) => {
                                        handleCustomChange(name, value);

                                        //  clear vendor + course errors
                                        setErrors((prev) => ({
                                            ...prev,
                                            vendor: "",
                                            course: "",
                                        }));
                                    }}
                                    openDropdown={openDropdown}
                                    setOpenDropdown={setOpenDropdown}
                                />

                                {errors.vendor && (
                                    <span className="error-msg">{errors.vendor}</span>
                                )}
                            </div>

                            {/* <div className="form-field">
                                <label>Course</label>
                                <CustomSelect
                                    name="course"
                                    value={form.course}
                                    placeholder={
                                        !form.vendor
                                            ? "Select vendor first"
                                            : loadingCourses
                                                ? "Loading courses..."
                                                : "Select Course"
                                    }
                                    options={courseOptions}
                                    disabled={!form.vendor || loadingCourses}
                                    onChange={handleCustomChange}
                                    openDropdown={openDropdown}
                                    setOpenDropdown={setOpenDropdown}
                                />

                                {errors.course && <span className="error-msg">{errors.course}</span>}
                            </div> */}
                            <div className="form-field">
                                <label>Exam List</label>
                                <CustomSelect
                                    name="course"
                                    value={form.course}
                                    placeholder="Select Exam"
                                    options={courseOptions}
                                    disabled={!form.vendor}
                                    onDisabledClick={() => {
                                        setErrors((prev) => ({
                                            ...prev,
                                            course: "Please select a vendor first",
                                        }));
                                    }}
                                    onChange={handleCustomChange}
                                    openDropdown={openDropdown}
                                    setOpenDropdown={setOpenDropdown}
                                />

                                {errors.course && (
                                    <span className="error-msg">{errors.course}</span>
                                )}
                            </div>

                            <div className="form-field full-width">
                                <label>Message</label>
                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    placeholder="Write a message..."
                                />
                                {errors.message && <span className="error-msg">{errors.message}</span>}
                            </div>
                        </div>

                        <div className="mt-4">
                            <ReCAPTCHA
                                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                                onChange={(token) => {
                                    setCaptchaToken(token);
                                    setCaptchaClicked(true); // mark as clicked
                                }}
                                onExpired={() => {
                                    setCaptchaToken(null);
                                    setCaptchaClicked(false);
                                }}

                            />
                            {errors.captcha && <span className="error-msg">{errors.captcha}</span>}
                        </div>


                        <button
                            type="submit"
                            className='btn-primary mt-4 lg:mt-6 primary-color-btn flex items-center justify-center gap-2'
                            disabled={isSubmitting || !captchaToken}
                        >
                            {isSubmitting ? (
                                <span className="spinner"></span>
                            ) : (
                                'Get In Touch'
                            )}
                        </button>
                    </form>

                </div>
            </div >

            <InformationsPopup
                isOpen={popupData !== null}
                title={popupData?.title}
                description={popupData?.description}
                type="success"
                onClose={() => setPopupData(null)}
            />

        </section >
    );
}
