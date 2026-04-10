'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";

import {
    FiUser,
    FiMail,
    FiPhone,
    FiBookOpen,
    FiMessageSquare,
} from 'react-icons/fi';
import { CiGlobe } from "react-icons/ci";
import { getData } from "country-list";
import { FaRegBuilding } from 'react-icons/fa';
import InformationsPopup from '../InformationsPopup/InformationsPopup';
import ReactCountryFlag from 'react-country-flag';
import { getDialCodeValue, getFormattedDialCode } from '@/lib/utils/countryUtils';

interface EnquiryFormData {
    fullName: string;
    email: string;
    mobile: string;
    country: string;
    phoneCountry: string; // NEW
    dialCode: string;     // NEW
    vendor: string;
    course: string;
    message: string;
}

interface EnquiryFormErrors {
    fullName?: string;
    email?: string;
    mobile?: string;
    country?: string;
    phoneCountry?: string;
    dialCode?: string;
    vendor?: string;
    course?: string;
    message?: string;
    captcha?: string;
}

type FieldName = keyof EnquiryFormData;


type Option = {
    label: string;
    value: string;
};

type CountryOption = {
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

};

// const CustomSelect = ({
//     name,
//     value,
//     options,
//     placeholder,
//     onChange,
//     openDropdown,
//     setOpenDropdown,
//     disabled,
// }: CustomSelectProps) => {

//     const isOpen = openDropdown === name;

//     const selectedLabel =
//         options.find((opt) => opt.value === value)?.label || '';

//     return (
//         // <div className="custom-select type-enquire-form">
//         <>

//             <button
//                 type="button"

//                 // className={`custom-select-trigger  type-enquire-form ${isOpen ? 'open' : ''}`}
//                 disabled={disabled}
//                 className={`custom-select-trigger  type-enquire-form ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}

//                 onClick={(e) => {
//                     e.stopPropagation();
//                     if (disabled) return;
//                     setOpenDropdown(isOpen ? null : name);

//                 }}
//             >
//                 <span className={!value ? 'placeholder' : ''}>
//                     {value ? selectedLabel : placeholder}
//                 </span>
//                 <span className={`chevron ${isOpen ? 'rotate' : ''}`} />
//             </button>

//             {isOpen && (
//                 <div
//                     className="custom-select-dropdown"
//                     onClick={(e) => e.stopPropagation()}
//                 >
//                     {options.map((option) => (
//                         <div
//                             key={option.value}
//                             className="custom-select-option"
//                             onClick={() => {
//                                 onChange(name, option.value);
//                                 setOpenDropdown(null);
//                             }}
//                         >
//                             {option.label}
//                         </div>
//                     ))}
//                 </div>
//             )}
//         </>
//         // </div>
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
    disabled,
}: CustomSelectProps) => {

    const isOpen = openDropdown === name;

    const [searchTerm, setSearchTerm] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);

    const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().startsWith(searchTerm.toLowerCase())
    );

    const selectedLabel =
        options.find((opt) => opt.value === value)?.label || '';


    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            dropdownRef.current?.focus();
        }
    }, [isOpen]);


    // reset on close
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm("");
            setActiveIndex(-1);
        }
    }, [isOpen]);

    // reset index when search changes
    useEffect(() => {
        setActiveIndex(0);
    }, [searchTerm]);

    useEffect(() => {
        if (isOpen) setActiveIndex(0);
    }, [isOpen]);

    // scroll into view
    useEffect(() => {
        if (activeIndex >= 0) {
            optionRefs.current[activeIndex]?.scrollIntoView({
                block: "nearest",
            });
        }
    }, [activeIndex]);

    // truncate
    const truncate = (text: string, max = 30) =>
        text.length > max ? text.slice(0, max) + "..." : text;




    return (
        <>
            <button
                type="button"
                disabled={disabled}
                className={`custom-select-trigger type-enquire-form ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    if (disabled) return;
                    setOpenDropdown(isOpen ? null : name);
                }}
            >
                <span className={!value ? 'placeholder' : ''}>
                    {value ? truncate(selectedLabel, 25) : placeholder}
                </span>
                <span className={`chevron ${isOpen ? 'rotate' : ''}`} />
            </button>

            {isOpen && (
                <div
                    ref={dropdownRef}
                    tabIndex={0}
                    className="custom-select-dropdown"
                    onClick={(e) => e.stopPropagation()}
                // onKeyDown={(e) => {

                //     e.stopPropagation();
                //     if (!filteredOptions.length) return;

                //     if (e.key === "ArrowDown") {
                //         e.preventDefault();
                //         setActiveIndex((prev) =>
                //             prev < filteredOptions.length - 1 ? prev + 1 : 0
                //         );
                //     }

                //     if (e.key === "ArrowUp") {
                //         e.preventDefault();
                //         setActiveIndex((prev) =>
                //             prev > 0 ? prev - 1 : filteredOptions.length - 1
                //         );
                //     }

                //     if (e.key === "Enter") {
                //         e.preventDefault();
                //         const selected = filteredOptions[activeIndex];
                //         if (selected) {
                //             onChange(name, selected.value);
                //             setOpenDropdown(null);
                //         }
                //     }

                //     if (e.key === "Escape") {
                //         setOpenDropdown(null);
                //     }
                // }}
                >
                    {/* 🔍 SEARCH */}
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

                    {/* OPTIONS */}
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, index) => (
                            <div
                                key={option.value}
                                ref={(el) => {
                                    optionRefs.current[index] = el;
                                }}
                                className={`custom-select-option ${index === activeIndex ? "active" : ""
                                    }`}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => {
                                    onChange(name, option.value);
                                    setOpenDropdown(null);
                                }}
                            >
                                {option.label}
                            </div>
                        ))
                    ) : (
                        <div className="custom-select-option disabled">
                            No results found
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

const EnquireForm = ({ categories = [] }: { categories?: any[] }) => {

    const params = useParams();
    const vendorFromUrl = params?.slug as string;
    const courseFromUrl = params?.examName as string;
    const [formData, setFormData] = useState<EnquiryFormData>({
        fullName: '',
        email: '',
        mobile: '',
        country: '',
        phoneCountry: '',
        dialCode: '',
        vendor: '',
        course: '',
        message: '',
    });





    const [errors, setErrors] = useState<EnquiryFormErrors>({});
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [phoneSearch, setPhoneSearch] = useState("");
    const phoneOptionRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [popupData, setPopupData] = useState<{
        title: string;
        description: string;
        type?: "success" | "error";
    } | null>(null);

    const [courseOptions, setCourseOptions] = useState<Option[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);

    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [captchaClicked, setCaptchaClicked] = useState(false);
    const captchaRef = useRef<{ reset: () => void } | null>(null);



    const countryOptions: CountryOption[] = [
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
    ].sort((a, b) => a.label.localeCompare(b.label));

    const phoneCountryOptions: CountryOption[] = countryOptions.map((country) => ({
        label: `${country.label} (${getFormattedDialCode(country.value, country.code)})`,
        value: country.value,
        code: country.code,
        dialCode: getDialCodeValue(country.value, country.code),
    }));


    useEffect(() => {
        if (!vendorFromUrl) return;

        setFormData(prev => {
            // ✅ don't override if user already selected something
            if (prev.vendor && prev.vendor !== vendorFromUrl) {
                return prev;
            }

            const vendorExists = categories.some(
                (cat: any) => cat.handle === vendorFromUrl
            );

            if (!vendorExists) return prev;

            return {
                ...prev,
                vendor: vendorFromUrl,
            };
        });
    }, [vendorFromUrl, categories]);

    useEffect(() => {
        if (!formData.vendor) {
            setCourseOptions([]);
            return;
        }

        async function fetchCourses() {
            setLoadingCourses(true);

            try {
                const res = await fetch(`/api/courses?vendor=${formData.vendor}`);
                const data = await res.json();

                const formatted = (data.products || []).map((product: any) => ({
                    label: product.title,
                    value: product.handle,
                }));

                setCourseOptions(formatted);
            } catch (error) {
                console.error("Failed to fetch courses", error);
            } finally {
                setLoadingCourses(false);
            }
        }

        fetchCourses();

    }, [formData.vendor]);


    useEffect(() => {
        if (!courseFromUrl || !courseOptions.length) return;

        const exists = courseOptions.some(
            c => c.value === courseFromUrl
        );

        if (!exists) return;

        setFormData(prev => {
            if (prev.course) return prev;

            return {
                ...prev,
                course: courseFromUrl,
            };
        });
    }, [courseFromUrl, courseOptions]);


    useEffect(() => {
        if (!formData.vendor) return;

        setFormData(prev => ({
            ...prev,
            course: "",
        }));
    }, [formData.vendor]);


    useEffect(() => {
        const handleClickOutside = () => {
            setOpenDropdown(null);
        };

        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);

    }, []);

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

    const validateField = (name: FieldName, value: string) => {
        const trimmedValue = value.trim();

        switch (name) {
            case 'fullName':
                if (!trimmedValue) return 'Full name is required';
                if (trimmedValue.length < 2) return 'Full name must be at least 2 characters';
                if (!/^[a-zA-Z.'\-\s]+$/.test(trimmedValue)) return 'Enter a valid full name';
                return '';
            case 'email':
                if (!trimmedValue) return 'Email is required';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedValue)) return 'Enter a valid email';
                return '';
            case 'mobile': {
                const normalizedMobile = value.replace(/\D/g, '');
                if (!normalizedMobile) return 'Mobile number is required';
                if (normalizedMobile.length < 10 || normalizedMobile.length > 15) return 'Enter a valid mobile number';
                return '';
            }
            case 'country':
                if (!trimmedValue) return 'Please select country';
                return '';
            case 'vendor':
                if (!trimmedValue) return 'Please select vendor';
                return '';
            case 'course':
                if (!trimmedValue) return 'Please select Exam Name';
                return '';
            case 'message':
                return '';
            default:
                return '';
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name } = e.target;
        let value = e.target.value;

        if (name === "mobile") {
            value = value.replace(/\D/g, "").slice(0, 12);
        }

        if (e.target instanceof HTMLTextAreaElement) {
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: undefined,
        }));
    };

    const handleBlur = (
        e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const fieldName = e.target.name as FieldName;
        const error = validateField(fieldName, e.target.value);

        setErrors((prev) => ({
            ...prev,
            [fieldName]: error || undefined,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/contact-form", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    emailID: formData.email,
                    mobileNumber: `${formData.dialCode}${formData.mobile}`,
                    country: formData.country,
                    vendor: formData.vendor,
                    course: formData.course,
                    message: formData.message || null,
                    pageUrl: window.location.href,
                    captchaToken,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error || "Something went wrong");
            }

            const { country, phoneCountry, dialCode } = formData;


            // success
            setFormData({
                fullName: '',
                email: '',
                mobile: '',
                country,
                phoneCountry,
                dialCode,
                vendor: '',
                course: '',
                message: '',

            });

            setPopupData({
                title: "Thank you.",
                description: `
            <p>Your request has been submitted successfully. Our team has received your details. One of our experts will contact you shortly to guide you further.</p>
            <p>We appreciate your interest in Global IT Success.</p>
        `,

            });


            // alert("Enquiry submitted successfully!");

        } catch (error: any) {
            console.error("Submit Error:", error);
            // alert(error.message || "Failed to submit enquiry");
            setPopupData({
                title: "Submission Failed",
                description: `
                <p>Failed to send message.</p>
            `,

            });

        } finally {
            setIsSubmitting(false);
        }
    };

    const validateForm = () => {
        const newErrors: EnquiryFormErrors = {};
        // const fields: FieldName[] = ['fullName', 'email', 'mobile', 'country', 'vendor', 'course', 'message'];
        // const fields: FieldName[] = ['fullName', 'email', 'mobile', 'country', 'vendor', 'message'];
        // const fields: FieldName[] = ['fullName', 'email', 'mobile', 'country', 'vendor', 'course'];
        const fields: FieldName[] = ['fullName', 'email', 'mobile', 'country', 'vendor', 'course'];

        fields.forEach((field) => {
            const error = validateField(field, formData[field]);
            if (error) {
                newErrors[field] = error;
            }
        });

        // ✅ CAPTCHA VALIDATION
        if (!captchaToken) {
            newErrors.captcha = "Please verify that you are not a robot";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };


    const vendorOptions = categories.map((cat: any) => ({
        label: cat.name,
        value: cat.handle, // or cat.id if needed
    }));


    const getDialCodeForCountry = (countryName: string) => {
        const matchedCountry = countryOptions.find((country) => country.value === countryName);
        return getFormattedDialCode(countryName, matchedCountry?.code);
    };

    const handleCustomChange = (name: string, value: string) => {

        if (name === "country") {
            setFormData((prev) => ({
                ...prev,
                country: value,
                phoneCountry: value,
                dialCode: getDialCodeForCountry(value),
            }));
        } else if (name === "phoneCountry") {
            setFormData((prev) => ({
                ...prev,
                phoneCountry: value,
                country: value,
                dialCode: getDialCodeForCountry(value),
                mobile: "",
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }

        setErrors((prev) => ({
            ...prev,
            [name]: undefined,
            ...(name === "country" || name === "phoneCountry" ? { country: undefined } : {}),
        }));
    };


    const selectedPhoneCountry = countryOptions.find(
        (c) => c.value === formData.phoneCountry
    );

    const filteredPhoneOptions = phoneCountryOptions.filter((option) => {
        const normalizedSearch = phoneSearch.trim().toLowerCase().replace(/^\+/, "");
        const normalizedLabel = option.label.toLowerCase();
        const normalizedValue = option.value.toLowerCase();
        const normalizedDialCode = option.dialCode?.toLowerCase() || "";

        if (!normalizedSearch) return true;

        return (
            normalizedLabel.startsWith(normalizedSearch) ||
            normalizedValue.startsWith(normalizedSearch) ||
            normalizedDialCode.startsWith(normalizedSearch)
        );
    });

    const detectCountry = async () => {
        try {
            const res = await fetch("/api/detect-country");
            const data = await res.json();

            const detected = data?.country_name;

            const match = countryOptions.find(
                (c) => c.value.toLowerCase() === detected?.toLowerCase()
            );

            const finalCountry = match ? match.value : "India";

            const dialCode = getFormattedDialCode(finalCountry, match?.code);

            setFormData((prev) => ({
                ...prev,
                country: finalCountry,
                phoneCountry: finalCountry,
                dialCode,
            }));

            setCaptchaToken(null);
            setCaptchaClicked(false);
            captchaRef.current?.reset();


        } catch {
            setFormData((prev) => ({
                ...prev,
                country: "India",
                phoneCountry: "India",
                dialCode: "+91",
            }));

            setCaptchaToken(null);
            setCaptchaClicked(false);
            captchaRef.current?.reset();
        }
    };

    useEffect(() => {
        detectCountry();
    }, []);



    return (
        <div className='enquiry-form'>

            <div className='form-floating-title '>
                <div className='form-title'>
                    <div className='double-bullet-points me-5'></div>
                    <h3 >Enquire Form</h3>
                    <div className='double-bullet-points ms-3'></div>
                </div>


            </div>

            <form className="enquiry-form-body" onSubmit={handleSubmit} noValidate>


                {/* Full Name */}

                <div className="form-field relative">
                    <div className="field-icon">
                        <FiUser />
                    </div>

                    <input
                        type="text"
                        name="fullName"
                        placeholder="Enter Full Name"
                        value={formData.fullName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        aria-invalid={!!errors.fullName}
                        aria-describedby="fullName-error"
                    />


                </div>
                {errors.fullName && (
                    <span className="form-error mt-[-10px] text-red-600 text-sm " id="fullName-error">{errors.fullName}</span>
                )}


                {/* Email */}
                <div className="form-field">
                    <span className="field-icon">
                        <FiMail />
                    </span>

                    <input
                        type="email"
                        name="email"
                        placeholder="Enter Email ID"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        aria-invalid={!!errors.email}
                        aria-describedby="email-error"
                    />


                </div>

                {errors.email && (
                    <span className="form-error mt-[-10px] text-red-600 text-sm " id="email-error">{errors.email}</span>
                )}


                {/* Mobile */}
                {/* <div className="form-field">
                    <span className="field-icon">
                        <FiPhone />
                    </span>
                 
                    <input
                        type="tel"
                        name="mobile"
                        placeholder="Enter Mobile Number"
                        value={formData.mobile}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={12}
                        inputMode="numeric"
                    />


                </div> */}
                <div className="form-field phone-field">
                    <span className="field-icon">
                        <FiPhone />
                    </span>

                    {/* 🔽 DROPDOWN */}
                    {openDropdown === "phoneCountry" && (
                        <div
                            className="phone-dropdown country-code-dropdown"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <input
                                type="text"
                                className="phone-search"
                                placeholder="Search country..."
                                value={phoneSearch}
                                autoFocus
                                onChange={(e) => setPhoneSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (!filteredPhoneOptions.length) return;

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

                            {filteredPhoneOptions.length > 0 ? (
                                filteredPhoneOptions.map((country, index) => (
                                    <div
                                        key={country.value}
                                        tabIndex={0}
                                        ref={(el) => {
                                            phoneOptionRefs.current[index] = el;
                                        }}
                                        className={`phone-option ${index === activeIndex ? "active" : ""}`}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        onClick={() => {
                                            handleCustomChange("phoneCountry", country.value);
                                            setOpenDropdown(null);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleCustomChange("phoneCountry", country.value);
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

                                            if (e.key === "Escape") {
                                                setOpenDropdown(null);
                                            }
                                        }}
                                    >
                                        <ReactCountryFlag
                                            countryCode={country.code || "IN"}
                                            svg
                                            style={{ width: "20px", height: "20px", marginRight: "8px" }}
                                        />
                                        {country.label}
                                    </div>
                                ))
                            ) : (
                                <div className="phone-option disabled">
                                    No results found
                                </div>
                            )}
                        </div>
                    )}

                    <div className="phone-container">

                        {/*  FLAG DROPDOWN */}
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
                            <span className={`contact-country-arrow ${openDropdown === "phoneCountry" ? "rotate" : ""}`}>
                                ▼
                            </span>
                        </div>



                        {/* 📱 INPUT */}
                        <input
                            name="mobile"
                            value={`${formData.dialCode} ${formData.mobile}`}
                            className="phone-input flex-1"
                            inputMode="numeric"

                            onKeyDown={(e) => {
                                const cursor = e.currentTarget.selectionStart || 0;
                                const lockLength = formData.dialCode.length + 1;

                                if (cursor < lockLength) {
                                    if (e.key === "Backspace" || e.key === "Delete") {
                                        e.preventDefault();
                                    }
                                    if (e.key.length === 1) {
                                        e.preventDefault();
                                    }
                                }
                            }}

                            onChange={(e) => {
                                let value = e.target.value;

                                if (value.startsWith(formData.dialCode)) {
                                    value = value.slice(formData.dialCode.length);
                                }

                                value = value.trimStart();

                                const cleaned = value.replace(/\D/g, "").slice(0, 12);

                                setFormData((prev) => ({
                                    ...prev,
                                    mobile: cleaned,
                                }));

                                setErrors((prev) => ({ ...prev, mobile: undefined }));
                            }}

                            onClick={(e) => {
                                const input = e.currentTarget;
                                const lockLength = formData.dialCode.length + 1;

                                if ((input.selectionStart || 0) < lockLength) {
                                    setTimeout(() => {
                                        input.setSelectionRange(lockLength, lockLength);
                                    }, 0);
                                }
                            }}

                            onFocus={(e) => {
                                const input = e.currentTarget;
                                const lockLength = formData.dialCode.length + 1;

                                setTimeout(() => {
                                    if ((input.selectionStart || 0) < lockLength) {
                                        input.setSelectionRange(lockLength, lockLength);
                                    }
                                }, 0);
                            }}
                        />
                    </div>
                </div>

                {errors.mobile && (
                    <span className="form-error mt-[-10px] text-red-600 text-sm " id="mobile-error">{errors.mobile}</span>
                )}

                {/* Country */}
                <div className="form-field">
                    <span className="field-icon">
                        <CiGlobe />
                    </span>
                    {/* <select
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            aria-invalid={!!errors.country}
                            aria-describedby="country-error"
                        >
                            <option value="">Select Country</option>
                            <option value="india">India</option>
                            <option value="usa">USA</option>
                            <option value="uk">UK</option>
                        </select> */}
                    <CustomSelect
                        name="country"
                        value={formData.country}
                        placeholder="Select Country"
                        options={countryOptions}
                        onChange={handleCustomChange}
                        openDropdown={openDropdown}
                        setOpenDropdown={setOpenDropdown}
                    />



                </div>
                {errors.country && (
                    <span className="form-error mt-[-10px] text-red-600 text-sm " id="country-error">{errors.country}</span>
                )}

                {/* Vendor */}
                <div className="form-field">
                    <span className="field-icon">
                        <FaRegBuilding />
                    </span>
                    {/* <select
                            name="vendor"
                            value={formData.vendor}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            aria-invalid={!!errors.vendor}
                            aria-describedby="vendor-error"
                        >
                            <option value="">Select Vendor</option>
                            <option value="cisco">Cisco</option>
                            <option value="aws">AWS</option>
                            <option value="microsoft">Microsoft</option>
                        </select> */}
                    <CustomSelect
                        name="vendor"
                        value={formData.vendor}
                        placeholder="Select Vendor"
                        options={vendorOptions}
                        onChange={(name, value) => {
                            setFormData(prev => ({ ...prev, [name]: value }));
                            setErrors(prev => ({ ...prev, [name]: undefined }));
                        }}
                        openDropdown={openDropdown}
                        setOpenDropdown={setOpenDropdown}
                    />


                </div>


                {errors.vendor && (
                    <span className="form-error mt-[-10px] text-red-600 text-sm " id="vendor-error">{errors.vendor}</span>
                )}

                {/* Course */}
                <div className="form-field">
                    <span className="field-icon">
                        <FiBookOpen />
                    </span>
                    {/* <select
                            name="course"
                            value={formData.course}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            aria-invalid={!!errors.course}
                            aria-describedby="course-error"
                        >
                            <option value="">Select Course</option>
                            <option value="ccna">CCNA</option>
                            <option value="ccnp">CCNP</option>
                        </select> */}
                    <CustomSelect
                        name="course"
                        value={formData.course}
                        placeholder="Select Exam"
                        options={loadingCourses
                            ? [{ label: "Loading...", value: "" }]
                            : courseOptions
                        }
                        onChange={(name, value) => {
                            setFormData(prev => ({ ...prev, [name]: value }));
                            setErrors(prev => ({ ...prev, [name]: undefined }));
                        }}
                        disabled={!formData.vendor || loadingCourses}
                        openDropdown={openDropdown}
                        setOpenDropdown={setOpenDropdown}
                    />


                </div>


                {errors.course && (
                    <span className="form-error mt-[-10px] text-red-600 text-sm " id="course-error">{errors.course}</span>
                )}

                {/* Message */}
                <div className="form-field textarea-field">
                    <span className="field-icon">
                        <FiMessageSquare />
                    </span>
                    <textarea
                        name="message"
                        placeholder="Write Your Query"
                        value={formData.message}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        aria-invalid={!!errors.message}
                        aria-describedby="message-error"
                        rows={1}

                    />


                </div>
                {errors.message && (
                    <span className="form-error mt-[-10px] text-red-600 text-sm " id="message-error">{errors.message}</span>
                )}


                <div className="mt-4">
                    <ReCAPTCHA
                        ref={(instance) => {
                            captchaRef.current = instance as {
                                reset: () => void
                            } | null
                        }}
                        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                        onChange={(token) => {
                            setCaptchaToken(token);
                            setCaptchaClicked(true);
                        }}
                        onExpired={() => {
                            setCaptchaToken(null);
                            setCaptchaClicked(false);
                        }}
                    />

                    {!captchaToken && captchaClicked && (
                        <span className="form-error text-red-600 text-sm">
                            Please verify that you are not a robot
                        </span>
                    )}
                    {errors.captcha && (
                        <span className="form-error text-red-600 text-sm">
                            {errors.captcha}
                        </span>
                    )}
                </div>



                <button
                    type="submit"
                    className={`form-submit-btn flex items-center justify-center gap-2 ${isSubmitting || !captchaToken ? "disabled" : ""
                        }`}
                    disabled={isSubmitting || !captchaToken}
                >
                    {isSubmitting ? (
                        <>
                            <span className="spinner"></span>

                        </>
                    ) : (
                        "Get In Touch"
                    )}
                </button>

                <p className="form-note">
                    *Cashback offer is available for corporate employees
                </p>
            </form>


            <InformationsPopup
                isOpen={popupData !== null}
                title={popupData?.title}
                description={popupData?.description}
                type={popupData?.type}
                onClose={() => setPopupData(null)}
            />

        </div>
    );
};

export default EnquireForm;
