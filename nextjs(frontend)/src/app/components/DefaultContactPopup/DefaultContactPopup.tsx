'use client'

import type { Dispatch, SetStateAction } from "react"
import { useEffect, useRef, useState } from "react"
import { FiMail, FiPhone } from "react-icons/fi"
import { FaWhatsapp } from "react-icons/fa"
import { IoIosClose } from "react-icons/io";
import { getData } from "country-list";
import ReCAPTCHA from "react-google-recaptcha";
import { getDialCodeValue, getFormattedDialCode } from '@/lib/utils/countryUtils';
import ReactCountryFlag from "react-country-flag";


type Option = {
    label: string
    value: string
}

type CountryOption = {
    label: string
    value: string
    code?: string
    dialCode?: string
}

type CategoryOption = {
    name: string
    handle: string
}

type CustomSelectProps = {
    name: string
    value: string
    options: Option[]
    placeholder: string
    onChange: (name: string, value: string) => void
    openDropdown: string | null
    setOpenDropdown: Dispatch<SetStateAction<string | null>>
    onSuccess?: () => void
    disabled?: boolean
    onDisabledClick?: () => void
}

const CustomSelect = ({
    name,
    value,
    options,
    placeholder,
    onChange,
    openDropdown,
    setOpenDropdown,
    onSuccess,
    disabled = false,
    onDisabledClick,

}: CustomSelectProps) => {
    const isOpen = openDropdown === name

    const selectedLabel =
        options.find((opt: Option) => opt.value === value)?.label || ""
    const [searchTerm, setSearchTerm] = useState("")

    const filteredOptions = options.filter((opt: Option) =>
        opt.label.toLowerCase().startsWith(searchTerm.toLowerCase())
    )

    const [activeIndex, setActiveIndex] = useState(-1);
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm("");
            setActiveIndex(-1);
        }
    }, [isOpen]);


    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            dropdownRef.current?.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        setActiveIndex(0); // reset to first option on search
    }, [searchTerm]);


    useEffect(() => {
        if (isOpen) setActiveIndex(0);
    }, [isOpen]);


    const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        if (activeIndex >= 0) {
            optionRefs.current[activeIndex]?.scrollIntoView({
                block: "nearest",
            });
        }
    }, [activeIndex]);

    const truncate = (text: string, max = 40) =>
        text.length > max ? text.slice(0, max) + "..." : text;


    return (
        <div className="custom-select default-contact-from-dropdown">
            <button
                type="button"
                // className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
                className={`custom-select-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled-vendor' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();

                    if (disabled) {
                        onDisabledClick?.();
                        return;
                    }
                    // if (disabled) return;

                    setOpenDropdown(isOpen ? null : name);

                }}
            // disabled={disabled}
            >
                <span className={!value ? 'placeholder' : ''}>
                    {value ? truncate(selectedLabel, 25) : placeholder}
                </span>
                <span className={`chevron ${isOpen ? 'rotate' : ''}`} />
            </button>

            {/* {isOpen && (
                <div
                    className="custom-select-dropdown"
                    onClick={(e) => e.stopPropagation()}
                >
                    {options.map((option: Option) => (
                        <div
                            key={option.value}
                            className="custom-select-option"
                            onClick={() => {
                                onChange(name, option.value);
                                setOpenDropdown(null);
                            }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )} */}
            {isOpen && (
                <div
                    // ref={dropdownRef}
                    className="custom-select-dropdown"
                    onClick={(e) => e.stopPropagation()}
                // tabIndex={0}

                >
                    {/* 🔍 Search input */}
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

                    {/* ✅ Filtered options */}
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option: Option, index: number) => (
                            <div

                                ref={(el) => {
                                    optionRefs.current[index] = el;
                                }}
                                key={option.value}
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
        </div>
    );
};



const DefaultContactPopup = ({
    isOpen,
    onClose,
    emailLink,
    phoneLink,
    whatsappLink,
    onSuccess,
    categories = []
}: {
    isOpen: boolean
    onClose: () => void
    emailLink?: string
    phoneLink?: string
    whatsappLink?: string
    onSuccess?: () => void
    categories?: CategoryOption[]
}) => {

    const popupRef = useRef<HTMLDivElement>(null)
    const nameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)+$/ // first + last name
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    // const phoneRegex = /^[6-9]\d{9}$/
    const [errors, setErrors] = useState<any>({})
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [phoneSearch, setPhoneSearch] = useState("");
    const phoneOptionRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    const [courseOptions, setCourseOptions] = useState<any[]>([]);


    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [captchaClicked, setCaptchaClicked] = useState(false);

    const captchaRef = useRef<{ reset: () => void } | null>(null);


    const vendorOptions = categories.map((cat: CategoryOption) => ({
        label: cat.name,
        value: cat.handle,
    }))
    const [popupData, setPopupData] = useState<{
        title: string;
        description: string;
        type?: "success" | "error" | "information";
    } | null>(null);





    // const countryOptions = getData().map((country) => ({
    //     label: country.name,
    //     value: country.code.toLowerCase(),
    // }));
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
        // default to India if nothing set
        if (!form.phoneCountry) {
            const defaultCountry = "India";
            const dialCode = getFormattedDialCode(defaultCountry, "IN");

            setForm((prev) => ({
                ...prev,
                country: defaultCountry,
                phoneCountry: defaultCountry,
                dialCode,
            }));
        }
    }, []);




    useEffect(() => {
        const handleClickOutside = () => setOpenDropdown(null);
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


    const [form, setForm] = useState({
        fullName: "",
        email: "",
        phone: "",          // only digits
        country: "",        // form country
        phoneCountry: "",   // phone country (NEW)
        dialCode: "",       // +91, +1 (NEW)
        vendor: "",
        course: "",
        message: ""
    })


    const selectedPhoneCountry = countryOptions.find(
        (c) => c.value === form.phoneCountry
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

            if (!data?.country_name) throw new Error("No country detected");

            const detectedCountry = data.country_name;

            const matchedCountry = countryOptions.find(
                (c) => c.value.toLowerCase() === detectedCountry.toLowerCase()
            );

            const finalCountry = matchedCountry ? matchedCountry.value : "India";

            const dialCode = getFormattedDialCode(finalCountry, matchedCountry?.code);

            setForm((prev) => ({
                ...prev,
                country: finalCountry,
                phoneCountry: finalCountry,
                dialCode,
            }));

        } catch (err) {
            console.error("Country detection failed", err);

            // fallback
            const fallback = "India";
            const dialCode = getFormattedDialCode(fallback, "IN");

            setForm((prev) => ({
                ...prev,
                country: fallback,
                phoneCountry: fallback,
                dialCode,
            }));
        }
    };

    useEffect(() => {
        detectCountry();
    }, []);


    const validate = () => {
        const newErrors: any = {};


        if (!captchaToken) {
            newErrors.captcha = "Please verify that you are not a robot";
        }


        // Full Name
        if (!form.fullName.trim()) {
            newErrors.fullName = "Full name is required";
        } else if (form.fullName.trim().length < 2) {
            newErrors.fullName = "Full name must be at least 2 characters";
        }

        // Email
        if (!form.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!emailRegex.test(form.email)) {
            newErrors.email = "Enter a valid email";
        }

        // Phone
        if (!form.phone || form.phone.length < 6 || form.phone.length > 12) {
            newErrors.phone = "Enter a valid phone number";
        }

        // Country
        if (!form.country) {
            newErrors.country = "Please select country";
        }

        // Vendor
        if (!form.vendor) {
            newErrors.vendor = "Please select vendor";
        }

        // Course
        if (!form.course) {
            newErrors.course = "Please select course";
        }

        // Message
        // if (form.message.trim()) {
        //     if (form.message.trim().length < 10) {
        //         newErrors.message = "Message must be at least 10 characters";
        //     }
        // }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate() || isSubmitting) return;

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/contact-form", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fullName: form.fullName,
                    emailID: form.email,
                    // mobileNumber: form.phone,
                    mobileNumber: `${form.dialCode}${form.phone}`,
                    country: form.country,
                    vendor: form.vendor,
                    course: form.course,
                    message: form.message || null,
                    pageUrl: window.location.href,
                    captchaToken,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error || "Something went wrong");
            }

            //
            // setForm({
            //     fullName: "",
            //     email: "",
            //     phone: "",
            //     country: "",
            //     phoneCountry: "",
            //     dialCode: "",
            //     vendor: "",
            //     course: "",
            //     message: ""
            // });

            setForm((prev) => ({
                fullName: "",
                email: "",
                phone: "",
                country: prev.country,
                phoneCountry: prev.phoneCountry,
                dialCode: prev.dialCode,
                vendor: "",
                course: "",
                message: ""
            }));

            setErrors({});
            onSuccess?.();
            // await detectCountry();
            setCaptchaToken(null);
            setCaptchaClicked(false);
            captchaRef.current?.reset();


            //     setTimeout(() => {
            //         setPopupData({
            //             title: "Thank you.",
            //             description: `
            //     <p>Your request has been submitted successfully. Our team has received your details.</p>
            //     <p>We will contact you shortly.</p>
            // `,
            //         });
            //     }, 400);





        } catch (err: any) {
            console.error("Submit Error:", err);
            setCaptchaToken(null);
            setCaptchaClicked(false);
            captchaRef.current?.reset();

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

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "auto"
        return () => { document.body.style.overflow = "auto" }
    }, [isOpen])


    useEffect(() => {
        const fetchCourses = async () => {
            if (!form.vendor) return;

            try {
                const res = await fetch(`/api/courses?vendor=${form.vendor}`);
                const data = await res.json();

                const formatted = (data.products || []).map((product: any) => ({
                    label: product.title,
                    value: product.handle,
                }));



                setCourseOptions(formatted);
            } catch (err) {
                console.error("Course fetch failed", err);
            }
        };

        fetchCourses();
    }, [form.vendor]);

    useEffect(() => {
        setForm(prev => ({
            ...prev,
            course: "",
        }));
    }, [form.vendor]);

    if (!isOpen) return null

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
            onClose()
        }
    }






    const handleChange = (e: any) => {
        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value
        }));

        setErrors((prev: any) => ({
            ...prev,
            [name]: ""
        }));
    };


    // const handleCustomChange = (name: string, value: string) => {
    //     setForm(prev => ({
    //         ...prev,
    //         [name]: value
    //     }));

    //     setErrors((prev: any) => ({
    //         ...prev,
    //         [name]: ""
    //     }));
    // };
    const getDialCodeForCountry = (countryName: string) => {
        const matchedCountry = countryOptions.find((country) => country.value === countryName);
        return getFormattedDialCode(countryName, matchedCountry?.code);
    };

    const handleCustomChange = (name: string, value: string) => {

        // 🌍 Country (form country)
        if (name === "country") {
            setForm((prev) => ({
                ...prev,
                country: value,
                phoneCountry: value,
                dialCode: getDialCodeForCountry(value),
            }));
        }

        // 📱 Phone Country (controls dial code + reset phone)
        else if (name === "phoneCountry") {
            const selectedCountry = countryOptions.find((country) => country.value === value);
            const dialCode = getFormattedDialCode(value, selectedCountry?.code);

            setForm((prev) => ({
                ...prev,
                phoneCountry: value,
                dialCode,
                phone: "", // 🔥 reset number when country changes
            }));
        }

        // default
        else {
            setForm((prev) => ({
                ...prev,
                [name]: value
            }));
        }

        setErrors((prev: any) => ({
            ...prev,
            [name]: ""
        }));
    };

    const handleSyncedCountryChange = (name: string, value: string) => {
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
                phone: "",
            }));
        } else {
            handleCustomChange(name, value);
            return;
        }

        setErrors((prev: any) => ({
            ...prev,
            [name]: "",
            country: "",
        }));
    };




    return (
        <>
            <div
                className="default-contact-us-form-overlay"
                onClick={handleOverlayClick}
            >
                <div className="default-contact-us-form-wrapper">
                    {/*  CONTACT ICON BUTTONS */}
                    {(emailLink || phoneLink || whatsappLink) && (
                        <div className="default-contact-us-contact-buttons">

                            {emailLink && (
                                <a
                                    href={`mailto:${emailLink}`}
                                    className="popup-contact-btn"
                                    target="_blank"
                                >
                                    <FiMail />
                                </a>
                            )}

                            {phoneLink && (
                                <a
                                    href={`tel:${phoneLink}`}
                                    className="popup-contact-btn"
                                >
                                    <FiPhone />
                                </a>
                            )}

                            {whatsappLink && (
                                <a
                                    href={`https://wa.me/${whatsappLink}`}
                                    className="popup-contact-btn"
                                    target="_blank"
                                >
                                    <FaWhatsapp />
                                </a>
                            )}

                        </div>
                    )}

                    <div className="default-scroll-wrapper">




                        <div
                            className="default-contact-us-form-inner"
                            ref={popupRef}
                        >

                            {/* CLOSE */}
                            <button
                                className="default-contact-us-form-close"
                                onClick={onClose}
                            >
                                <IoIosClose />
                            </button>

                            {/* TITLE */}
                            <h2 className="default-contact-us-form-title">
                                Get in Touch
                            </h2>

                            {/* GRID */}

                            <div className="default-contact-us-form-grid-wrapper">
                                <div className="default-contact-us-form-grid">

                                    <div className="default-contact-us-form-group">
                                        <label>Full Name</label>
                                        <input autoComplete="off" name="fullName" placeholder="Enter Full Name" onChange={handleChange} />
                                        {errors.fullName && (
                                            <span className="default-contact-us-error">
                                                {errors.fullName}
                                            </span>
                                        )}

                                    </div>

                                    <div className="default-contact-us-form-group">
                                        <label>Email ID</label>
                                        <input autoComplete="off" name="email" placeholder="Enter Email ID" onChange={handleChange} />
                                        {errors.email && (
                                            <span className="default-contact-us-error">
                                                {errors.email}
                                            </span>
                                        )}
                                    </div>

                                    <div className="default-contact-us-form-group">
                                        <label>Mobile Number</label>
                                        {/* <input autoComplete="off" name="phone" placeholder="Enter Mobile Number" onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "")
                            setForm({ ...form, phone: value })
                        }} /> */}
                                        {/* <input
                                            autoComplete="off"
                                            name="phone"
                                            placeholder="Enter Mobile Number"
                                            value={form.phone}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, "").slice(0, 12);
                                                setForm({ ...form, phone: value });
                                            }}
                                            inputMode="numeric"
                                        /> */}

                                        <div className="phone-container">

                                            {/* 🌍 LEFT: Flag + Dropdown */}
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
                                                    style={{ width: "20px", height: "20px", marginRight: "6px" }}
                                                />
                                                <span className={`contact-country-arrow ${openDropdown === "phoneCountry" ? "rotate" : ""}`}>
                                                    ▼
                                                </span>
                                            </div>

                                            {/* 🔽 Dropdown */}
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
                                                                    handleSyncedCountryChange("phoneCountry", selected.value);
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
                                                                    handleSyncedCountryChange("phoneCountry", country.value);
                                                                    setOpenDropdown(null);
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        handleSyncedCountryChange("phoneCountry", country.value);
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

                                            {/* 📱 INPUT */}
                                            <input
                                                name="phone"
                                                value={`${form.dialCode} ${form.phone}`}
                                                className="phone-input"
                                                inputMode="numeric"

                                                onKeyDown={(e) => {
                                                    const cursor = e.currentTarget.selectionStart || 0;
                                                    const lockLength = form.dialCode.length + 1;

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

                                                    if (value.startsWith(form.dialCode)) {
                                                        value = value.slice(form.dialCode.length);
                                                    }

                                                    value = value.trimStart();

                                                    const cleaned = value.replace(/\D/g, "").slice(0, 12);

                                                    setForm((prev) => ({
                                                        ...prev,
                                                        phone: cleaned,
                                                    }));

                                                    setErrors((prev: any) => ({ ...prev, phone: "" }));
                                                }}

                                                onClick={(e) => {
                                                    const input = e.currentTarget;
                                                    const lockLength = form.dialCode.length + 1;

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

                                        {errors.phone && (
                                            <span className="default-contact-us-error">
                                                {errors.phone}
                                            </span>
                                        )}
                                    </div>

                                    <div className="default-contact-us-form-group">
                                        <label>Country</label>
                                        {/* <select name="country" value={form.country} onChange={handleChange}>
                            <option value="" disabled hidden>Select Country</option>
                            <option value="India">India</option>
                            <option value="USA">USA</option>
                        </select> */}
                                        <CustomSelect
                                            name="country"
                                            value={form.country}
                                            placeholder="Select Country"
                                            options={countryOptions}
                                            onChange={handleSyncedCountryChange}
                                            openDropdown={openDropdown}
                                            setOpenDropdown={setOpenDropdown}
                                        />
                                        {errors.country && (
                                            <span className="default-contact-us-error">
                                                {errors.country}
                                            </span>
                                        )}
                                    </div>

                                    <div className="default-contact-us-form-group">
                                        <label>Vendor</label>
                                        {/* <select
                            name="vendor"
                            value={form.vendor}
                            onChange={handleChange}
                        >
                            <option value="" disabled hidden>Select Vendor</option>
                            <option value="Microsoft">Microsoft</option>
                            <option value="AWS">AWS</option>
                        </select> */}
                                        <CustomSelect
                                            name="vendor"
                                            value={form.vendor}
                                            placeholder="Select Vendor"
                                            options={vendorOptions}
                                            // onChange={handleCustomChange}
                                            // onChange={(name: string, value: string) => {
                                            //     setForm(prev => ({ ...prev, [name]: value }));
                                            //     setErrors((prev: any) => ({ ...prev, [name]: "" }));
                                            // }}
                                            onChange={(name: string, value: string) => {
                                                setForm(prev => ({ ...prev, [name]: value }));

                                                setErrors((prev: any) => ({
                                                    ...prev,
                                                    vendor: "",
                                                    course: "",
                                                }));
                                            }}
                                            openDropdown={openDropdown}
                                            setOpenDropdown={setOpenDropdown}

                                        />
                                        {errors.vendor && (
                                            <span className="default-contact-us-error">
                                                {errors.vendor}
                                            </span>
                                        )}
                                    </div>

                                    <div className="default-contact-us-form-group">
                                        <label>Exam List</label>



                                        <CustomSelect
                                            name="course"
                                            value={form.course}
                                            placeholder="Select Exam"
                                            options={courseOptions}
                                            disabled={!form.vendor}
                                            onDisabledClick={() => {
                                                setErrors((prev: any) => ({
                                                    ...prev,
                                                    course: "Please select a vendor first",
                                                }));
                                            }}
                                            onChange={(name: string, value: string) => {
                                                setForm(prev => ({ ...prev, [name]: value }));
                                                setErrors((prev: any) => ({ ...prev, [name]: "" }));
                                            }}
                                            openDropdown={openDropdown}
                                            setOpenDropdown={setOpenDropdown}
                                        />

                                        {errors.course && (
                                            <span className="default-contact-us-error">
                                                {errors.course}
                                            </span>
                                        )}
                                    </div>

                                </div>

                                {/* MESSAGE */}
                                <div className="default-contact-us-form-group full">
                                    <label>Message</label>
                                    <textarea

                                        name="message"
                                        placeholder="Write A Message..."
                                        onChange={handleChange}
                                    />
                                    {errors.message && (
                                        <span className="default-contact-us-error">
                                            {errors.message}
                                        </span>
                                    )}
                                </div>


                                {/* to add recaptcha  */}
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
                                    {errors.captcha && (
                                        <span className="default-contact-us-error">
                                            {errors.captcha}
                                        </span>
                                    )}

                                </div>



                                {/* CTA */}
                                <button
                                    className={`default-contact-us-form-submit ${(!captchaToken || isSubmitting) ? "disabled" : ""
                                        }`}
                                    onClick={handleSubmit}
                                    // disabled={isSubmitting}
                                    disabled={isSubmitting || !captchaToken}
                                >
                                    {isSubmitting ? <span className="spinner inline-block"></span> :
                                        "Get In Touch"}
                                </button>


                            </div>




                        </div>
                    </div>
                </div>


            </div>


        </>
    )
}

export default DefaultContactPopup
