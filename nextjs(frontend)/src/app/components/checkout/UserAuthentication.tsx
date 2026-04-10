'use client'

import { useEffect, useState } from "react"
import Link from 'next/link'
import React from 'react'
import { CgChevronLeft, CgChevronRight } from 'react-icons/cg';
import { MdOutlineEdit } from "react-icons/md";
import { useCheckout } from "@/app/context/CheckoutContext"
import { useCart } from "@/app/context/CartContext"
import ReCAPTCHA from "react-google-recaptcha";
import { getData } from "country-list";
import { getDialCodeValue, getFormattedDialCode } from "@/lib/utils/countryUtils";
import ReactCountryFlag from "react-country-flag";
import { useRef } from "react";

const DEFAULT_PAYMENT_PROVIDER_ID = "pp_easebuzz_default"
const CHECKOUT_PAYMENT_LOCK_KEY = "checkout_payment_lock_v1"
const CHECKOUT_TAB_ID_KEY = "checkout_tab_id_v1"
const CHECKOUT_PAYMENT_LOCK_TTL_MS = 10 * 60 * 1000

type CountryOption = {
    label: string
    value: string
    code?: string
    dialCode?: string
}

type EasebuzzSessionPayload = {
    payment_url: string
    payment_method?: "GET" | "POST"
    payment_fields: Record<string, string>
    payment_session_id?: string | null
}

function toStringRecord(value: unknown): Record<string, string> {
    if (!value || typeof value !== "object") {
        return {}
    }
    return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, val]) => [
            key,
            typeof val === "string" ? val : String(val ?? ""),
        ])
    )
}

function extractEasebuzzSessionPayload(raw: any): EasebuzzSessionPayload | null {
    const sessions = Array.isArray(raw?.payment_collection?.payment_sessions)
        ? raw.payment_collection.payment_sessions
        : []
    const dataCandidates = [
        raw,
        raw?.payment_session,
        raw?.data?.payment_session,
        ...sessions,
        ...sessions.map((session: any) => session?.data),
    ]

    for (const candidate of dataCandidates) {
        const paymentUrl = candidate?.payment_url || candidate?.url
        const paymentMethodRaw = candidate?.payment_method || candidate?.method || "POST"
        const paymentMethod =
            typeof paymentMethodRaw === "string" && paymentMethodRaw.trim()
                ? paymentMethodRaw.trim().toUpperCase()
                : "POST"
        const primaryFields = toStringRecord(candidate?.payment_fields)
        const fallbackFields = toStringRecord(candidate?.fields)
        const paymentFields =
            Object.keys(primaryFields).length > 0 ? primaryFields : fallbackFields

        const hasValidPostFields = Object.keys(paymentFields).length > 0
        if (
            typeof paymentUrl === "string" &&
            paymentUrl.trim() &&
            (paymentMethod === "GET" || hasValidPostFields)
        ) {
            return {
                payment_url: paymentUrl,
                payment_method: paymentMethod === "GET" ? "GET" : "POST",
                payment_fields: paymentFields,
                payment_session_id:
                    candidate?.id ||
                    candidate?.payment_session_id ||
                    raw?.payment_session_id ||
                    raw?.payment_session?.id ||
                    null,
            }
        }
    }

    return null
}

function autoSubmitGatewayForm(url: string, fields: Record<string, string>) {
    const form = document.createElement("form")
    form.method = "POST"
    form.action = url
    form.style.display = "none"

    Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement("input")
        input.type = "hidden"
        input.name = key
        input.value = value
        form.appendChild(input)
    })

    document.body.appendChild(form)
    form.submit()
}

function redirectToGateway(url: string) {
    window.location.assign(url)
}

type CheckoutPaymentLock = {
    owner_tab_id: string
    cart_id: string
    expires_at: number
}

function getOrCreateCheckoutTabId() {
    try {
        const existing = sessionStorage.getItem(CHECKOUT_TAB_ID_KEY)
        if (existing) return existing
        const created = crypto.randomUUID()
        sessionStorage.setItem(CHECKOUT_TAB_ID_KEY, created)
        return created
    } catch {
        return `tab_${Date.now()}`
    }
}

function readCheckoutPaymentLock(): CheckoutPaymentLock | null {
    try {
        const raw = localStorage.getItem(CHECKOUT_PAYMENT_LOCK_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as CheckoutPaymentLock
        if (!parsed?.owner_tab_id || !parsed?.cart_id || !parsed?.expires_at) {
            return null
        }
        return parsed
    } catch {
        return null
    }
}

function acquireCheckoutPaymentLock(cartId: string) {
    const ownerTabId = getOrCreateCheckoutTabId()
    const now = Date.now()
    const existing = readCheckoutPaymentLock()
    const existingActive = existing && existing.expires_at > now

    if (
        existingActive &&
        existing.cart_id === cartId &&
        existing.owner_tab_id !== ownerTabId
    ) {
        return {
            acquired: false,
            message: "Payment is already in progress in another tab for this cart.",
        }
    }

    const nextLock: CheckoutPaymentLock = {
        owner_tab_id: ownerTabId,
        cart_id: cartId,
        expires_at: now + CHECKOUT_PAYMENT_LOCK_TTL_MS,
    }

    localStorage.setItem(CHECKOUT_PAYMENT_LOCK_KEY, JSON.stringify(nextLock))

    return {
        acquired: true,
        ownerTabId,
    }
}

function releaseCheckoutPaymentLock(ownerTabId: string, cartId?: string) {
    const current = readCheckoutPaymentLock()
    if (!current) return
    if (current.owner_tab_id !== ownerTabId) return
    if (cartId && current.cart_id !== cartId) return
    localStorage.removeItem(CHECKOUT_PAYMENT_LOCK_KEY)
}


const UserAuthentication = () => {




    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        mobile: "",
        email: "",
        otp: ""
    })

    const [errors, setErrors] = useState<any>({})
    const [loadingOtp, setLoadingOtp] = useState(false)
    const [otpSent, setOtpSent] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [mobileChanged, setMobileChanged] = useState(false)

    // const MOCK_OTP = "121212"
    const [resendTimer, setResendTimer] = useState(30)
    const [canResend, setCanResend] = useState(false)
    const [otpExpired, setOtpExpired] = useState(false)

    const { setCheckoutData } = useCheckout()
    const selectedProviderId = DEFAULT_PAYMENT_PROVIDER_ID
    const [otpContext, setOtpContext] = useState<null | {
        email: string
        firstName: string
        lastName: string
        mobile: string
    }>(null)
    const isEmailChanged = !!(otpContext && form.email !== otpContext.email)
    const isOtherDataChanged = !!(
        otpContext &&
        (
            form.firstName !== otpContext.firstName ||
            form.lastName !== otpContext.lastName ||
            form.mobile !== otpContext.mobile
        )
    )
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

    const handleRecaptchaChange = (token: string | null) => {
        setRecaptchaToken(token);
    };

    const [phoneCountry, setPhoneCountry] = useState("");
    const [dialCode, setDialCode] = useState("+91");
    const recaptchaRef = useRef<InstanceType<typeof ReCAPTCHA> | null>(null);
    const [phoneSearch, setPhoneSearch] = useState("");
    const phoneOptionRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);


    const countryOptions: CountryOption[] = [
        { label: "India", value: "India", code: "IN" },
        ...getData()
            .filter((c) => c.code !== "IN")
            .map((c) => ({
                label: c.name,
                value: c.name,
                code: c.code,
            })),
    ].sort((a, b) => a.label.localeCompare(b.label));

    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const phoneCountryOptions: CountryOption[] = countryOptions.map((country) => ({
        label: `${country.label} (${getFormattedDialCode(country.value, country.code)})`,
        value: country.value,
        code: country.code,
        dialCode: getDialCodeValue(country.value, country.code),
    }));

    const filteredPhoneOptions = phoneCountryOptions.filter((option) => {
        const search = phoneSearch.toLowerCase();

        return (
            option.label.toLowerCase().startsWith(search) ||
            option.value.toLowerCase().startsWith(search) ||
            option.dialCode?.startsWith(search.replace("+", ""))
        );
    });

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


    useEffect(() => {
        const detectCountry = async () => {
            try {
                const res = await fetch("/api/detect-country");
                const data = await res.json();

                const detected = data?.country_name;

                const match = countryOptions.find(
                    (c) => c.value.toLowerCase() === detected?.toLowerCase()
                );

                const finalCountry = match ? match.value : "India";

                const dial = getFormattedDialCode(finalCountry, match?.code);

                setPhoneCountry(finalCountry);
                setDialCode(dial);
            } catch {
                setPhoneCountry("India");
                setDialCode("+91");
            }
        };

        detectCountry();
    }, []);


    useEffect(() => {
        let interval: any

        if (otpSent && !canResend) {
            interval = setInterval(() => {
                setResendTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval)
                        setCanResend(true)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }

        return () => clearInterval(interval)
    }, [otpSent, canResend])


    function getCartId() {
        const cookie = document.cookie
            .split("; ")
            .find(row => row.startsWith("cart_id="))
            ?.split("=")[1];

        return cookie || localStorage.getItem("cart_id");
    }



    const handleChange = (e: any) => {
        const { name, value } = e.target

        let updatedValue = value

        if (name === "mobile") {
            updatedValue = value.replace(/\D/g, "").slice(0, 10)

            // mark mobile changed
            // if (otpSent || isEditingMobile) {
            if (otpSent || isEditing) {
                setMobileChanged(true)
            }
        }

        if (name === "email" && otpSent) {
            setCanResend(true)
        }



        if (name === "otp") {
            updatedValue = value.replace(/\D/g, "").slice(0, 6);

            setErrors((prev: any) => ({
                ...prev,
                otp: ""
            }));
        }

        setForm({ ...form, [name]: updatedValue })

        setErrors((prev: any) => ({ ...prev, [name]: "" }))
    }


    const validateForm = () => {
        const newErrors: any = {}

        if (!form.firstName) newErrors.firstName = "First name is required"
        if (!form.lastName) newErrors.lastName = "Last name is required"

        if (!form.mobile) {
            newErrors.mobile = "Mobile is required"
        } else if (form.mobile.length < 8) {
            newErrors.mobile = "Enter valid mobile number"
        }

        if (!form.email) {
            newErrors.email = "Email is required"
        } else if (
            !form.email.includes("@")
        ) {
            newErrors.email = "Enter valid email"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }


    const handleEditForm = () => {
        setIsEditing(true)
        setMobileChanged(false)
        setForm((prev) => ({ ...prev, otp: "" }))

        // 🔥 Reset captcha
        setRecaptchaToken(null)
        recaptchaRef.current?.reset()
    }

    const handlePhoneCountryChange = (value: string) => {
        setPhoneCountry(value);
        setDialCode(
            getFormattedDialCode(
                value,
                countryOptions.find((country) => country.value === value)?.code
            )
        );
        setForm((prev) => ({ ...prev, mobile: "" }));
        setErrors((prev: any) => ({ ...prev, mobile: "" }));
    }


    const handleGetOtp = async () => {
        if (!validateForm()) return;

        if (!recaptchaToken) {
            setErrors((prev: any) => ({
                ...prev,
                email: "Please complete the reCAPTCHA"
            }));
            return;
        }

        // If nothing changed, just show OTP input
        if (otpContext && !isEmailChanged) {
            setOtpSent(true);
            setIsEditing(false);
            return;
        }

        // If OTP sent recently and cooldown is active
        if (otpSent && !isEmailChanged && !canResend) {
            setErrors((prev: any) => ({
                ...prev,
                email: `Please wait ${resendTimer}s before requesting another OTP`
            }));
            return;
        }

        setLoadingOtp(true);

        try {
            const cartId = getCartId();
            if (!cartId) throw new Error("Invalid cart");

            const res = await fetch("/api/checkout/request-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    cartId,
                    email: form.email,
                    recaptchaToken // send token to backend
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error || "Failed to send OTP");
            }

            setOtpContext({
                email: form.email,
                firstName: form.firstName,
                lastName: form.lastName,
                mobile: `${dialCode}${form.mobile}`
            });

            setOtpSent(true);
            setIsEditing(false);
            setMobileChanged(false);
            setResendTimer(30);
            setCanResend(false);
            setOtpExpired(false);

            // Reset recaptcha
            setRecaptchaToken(null);

        } catch (err: any) {
            setErrors((prev: any) => ({
                ...prev,
                email: err.message
            }));
        } finally {
            setLoadingOtp(false);
        }
    };


    const handleResendOtp = async () => {
        if (!canResend) return

        setLoadingOtp(true)

        try {
            const cartId = getCartId()

            const res = await fetch("/api/checkout/request-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    cartId,
                    email: form.email
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data?.error || "Failed to resend OTP")
            }

            // reset timer again
            setResendTimer(30)
            setCanResend(false)
            setOtpExpired(false)
            setForm((prev) => ({ ...prev, otp: "" }))

        } catch (err: any) {
            console.error("Resend OTP error:", err)
        } finally {
            setLoadingOtp(false)
        }
    }


    const handleVerify = async () => {
        const newErrors: any = {}

        if (!form.otp) {
            newErrors.otp = "OTP is required"
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        if (verifying) return
        setVerifying(true)
        let paymentLockOwnerTabId = ""
        let shouldKeepPaymentLock = false

        try {
            const cartId = getCartId()

            if (!cartId || cartId === "null") {
                throw new Error("Invalid cart ID")
            }

            const verifyRes = await fetch("/api/checkout/verify-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    cartId,
                    email: form.email,
                    otp: form.otp
                })
            })

            const verifyData = await verifyRes.json()

            if (!verifyRes.ok) {
                const errorMessage = verifyData?.error || "Invalid or expired OTP"
                setErrors((prev: any) => ({
                    ...prev,
                    otp: verifyData?.error || "Invalid or expired OTP"
                }))

                if (errorMessage.toLowerCase().includes("expired")) {
                    setOtpExpired(true)
                    setCanResend(true)
                }


                setVerifying(false)
                return
            }

            const lockResult = acquireCheckoutPaymentLock(cartId)
            if (!lockResult.acquired) {
                throw new Error(lockResult.message)
            }
            paymentLockOwnerTabId = lockResult.ownerTabId || ""


            // await new Promise((res) => setTimeout(res, 800))

            // if (form.otp !== MOCK_OTP) {
            //     setErrors((prev: any) => ({
            //         ...prev,
            //         otp: "Invalid OTP. Please try again."
            //     }))
            //     setVerifying(false)
            //     return
            // }

            await fetch("/api/cart/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    cart_id: cartId,
                    email: form.email,
                    shipping_address: {
                        first_name: form.firstName,
                        last_name: form.lastName,
                        phone: `${dialCode}${form.mobile}`,
                        country_code: "in"
                    }
                })
            })

            const collectionRes = await fetch("/api/checkout/create-payment-collection", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ cart_id: cartId })
            })

            const collectionData = await collectionRes.json().catch(() => null)
            if (!collectionRes.ok) {
                throw new Error(
                    collectionData?.error ||
                    collectionData?.message ||
                    "Collection failed"
                )
            }

            const paymentCollection = collectionData?.payment_collection

            if (!paymentCollection?.id) {
                throw new Error("Invalid payment collection")
            }

            const sessionRes = await fetch("/api/checkout/create-payment-session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    payment_collection_id: paymentCollection.id,
                    provider_id: selectedProviderId,
                    cart_id: cartId,
                    email: form.email,
                    phone: form.mobile,
                    first_name: form.firstName
                })
            })

            if (!sessionRes.ok) {
                const sessionErr = await sessionRes.json().catch(() => null)
                throw new Error(
                    sessionErr?.error ||
                    sessionErr?.message ||
                    "Session failed"
                )
            }

            const sessionData = await sessionRes.json()
            const easebuzzPayload = extractEasebuzzSessionPayload(sessionData)

            if (!easebuzzPayload?.payment_url) {
                throw new Error(
                    sessionData?.error ||
                    "Payment redirect URL is missing in payment session response"
                )
            }

            const paymentMethod = (easebuzzPayload.payment_method || "POST").toUpperCase()
            if (paymentMethod === "POST") {
                const gatewayEmail = (easebuzzPayload.payment_fields.email || "").trim()
                const gatewayPhone = (easebuzzPayload.payment_fields.phone || "").trim()
                const gatewayKey = (easebuzzPayload.payment_fields.key || "").trim()

                if (!gatewayEmail || !gatewayPhone || !gatewayKey) {
                    throw new Error(
                        "Payment session is missing required Easebuzz fields (email/phone/key). Please check backend provider configuration."
                    )
                }
            }

            const pendingCheckout = {
                cart_id: cartId,
                provider_id: selectedProviderId,
                payment_collection_id: paymentCollection.id,
                payment_session_id: easebuzzPayload.payment_session_id || null,
            }

            localStorage.setItem("checkout_pending_payment", JSON.stringify(pendingCheckout))
            sessionStorage.setItem("checkout_in_progress", "true")
            sessionStorage.setItem("easebuzz_callback_payload", "")

            setCheckoutData({
                cartId: cartId,
                payment: pendingCheckout,
                user: {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: form.email,
                    mobile: form.mobile
                }
            })

            if (paymentMethod === "GET") {
                shouldKeepPaymentLock = true
                redirectToGateway(easebuzzPayload.payment_url)
            } else {
                shouldKeepPaymentLock = true
                autoSubmitGatewayForm(easebuzzPayload.payment_url, easebuzzPayload.payment_fields)
            }

        } catch (error) {
            console.error("Checkout error:", error)
            setErrors((prev: any) => ({
                ...prev,
                otp:
                    error instanceof Error
                        ? error.message
                        : "Unable to start payment. Please try again.",
            }))
        } finally {
            if (!shouldKeepPaymentLock && paymentLockOwnerTabId) {
                const cartId = getCartId() || undefined
                releaseCheckoutPaymentLock(paymentLockOwnerTabId, cartId)
            }
            setVerifying(false)
        }
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    const isFormValidForOtp =
        form.firstName.trim() &&
        form.lastName.trim() &&
        form.mobile.length >= 8 &&
        isValidEmail


    const selectedCountry = countryOptions.find(
        (c) => c.value === phoneCountry
    );


    return (
        <>

            <div className="checkout-authentication-sticky-wrapper">
                <div className='checkout-authentication'>

                    <div className='checkout-authentication-heading'>
                        <h2>Checkout</h2>
                        {/* <div className='login-link'>
                            <div
                                className="secondary-btn-link inline-flex justify-center items-center hidden-element"

                            >
                                Log In
                                <span className="secondary-link-arrow">
                                    <CgChevronRight />
                                </span>
                            </div>
                        </div> */}
                        <div className='login-link'>
                            <Link href="/cart"
                                className="secondary-btn-link inline-flex justify-center items-center "

                            >
                                Go to Cart
                                <span className="secondary-link-arrow">
                                    <CgChevronRight />
                                </span>
                            </Link>
                        </div>


                    </div>
                    <div className="checkout-authentication-form-wrapper">
                        <form
                            className="checkout-authentication-form"
                            onSubmit={(e) => e.preventDefault()}
                        >

                            <div className="checkout-authentication-form-grid">

                                {/* FIRST NAME */}
                                <div className="checkout-authentication-form-group">
                                    <label>First Name</label>
                                    <input
                                        name="firstName"
                                        value={form.firstName}
                                        onChange={handleChange}
                                        disabled={otpSent && !isEditing}
                                        autoComplete="off"
                                        placeholder="Enter First Name"
                                    />
                                    {errors.firstName && (
                                        <span className="checkout-authentication-form-error">
                                            {errors.firstName}
                                        </span>
                                    )}
                                </div>

                                {/* LAST NAME */}
                                <div className="checkout-authentication-form-group">
                                    <label>Last Name</label>
                                    <input
                                        name="lastName"
                                        value={form.lastName}
                                        onChange={handleChange}
                                        disabled={otpSent && !isEditing}
                                        autoComplete="off"
                                        placeholder="Enter Last Name"
                                    />
                                    {errors.lastName && (
                                        <span className="checkout-authentication-form-error">
                                            {errors.lastName}
                                        </span>
                                    )}
                                </div>

                                {/* MOBILE */}
                                <div className="checkout-authentication-form-group phone-input">
                                    <label>Mobile</label>
                                    {/* <input
                                        name="mobile"
                                        value={form.mobile}
                                        onChange={handleChange}
                                        disabled={otpSent && !isEditing}
                                        autoComplete="off"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={12}
                                        placeholder="Enter Mobile Number"

                                    /> */}
                                    <div className="phone-container">

                                        {/* FLAG */}
                                        <div
                                            className="phone-country"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (otpSent && !isEditing) return;
                                                setOpenDropdown(openDropdown === "phoneCountry" ? null : "phoneCountry");
                                            }}
                                        >
                                            <ReactCountryFlag
                                                countryCode={selectedCountry?.code || "IN"}
                                                svg
                                                style={{ width: "20px", height: "20px", marginRight: "4px" }}
                                            />
                                            <span className={`contact-country-arrow ${openDropdown === "phoneCountry" ? "rotate " : ""}`}>
                                                ▼
                                            </span>
                                        </div>

                                        {/* DROPDOWN */}
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
                                                                handlePhoneCountryChange(selected.value);
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
                                                                handlePhoneCountryChange(country.value);
                                                                setOpenDropdown(null);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    handlePhoneCountryChange(country.value);
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

                                        {/* INPUT */}
                                        <input
                                            name="mobile"
                                            value={`${dialCode} ${form.mobile}`}
                                            disabled={otpSent && !isEditing}
                                            autoComplete="off"
                                            className="phone-input"
                                            inputMode="numeric"
                                            maxLength={16}

                                            onKeyDown={(e) => {
                                                const cursor = e.currentTarget.selectionStart || 0;
                                                const lockLength = dialCode.length + 1;

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

                                                if (value.startsWith(dialCode)) {
                                                    value = value.slice(dialCode.length);
                                                }

                                                value = value.trimStart();

                                                const cleaned = value.replace(/\D/g, "").slice(0, 12);

                                                setForm((prev) => ({
                                                    ...prev,
                                                    mobile: cleaned,
                                                }));

                                                setErrors((prev: any) => ({ ...prev, mobile: "" }));
                                            }}

                                            onClick={(e) => {
                                                const input = e.currentTarget;
                                                const lockLength = dialCode.length + 1;

                                                if ((input.selectionStart || 0) < lockLength) {
                                                    setTimeout(() => {
                                                        input.setSelectionRange(lockLength, lockLength);
                                                    }, 0);
                                                }
                                            }}

                                            onFocus={(e) => {
                                                const input = e.currentTarget;
                                                const lockLength = dialCode.length + 1;

                                                setTimeout(() => {
                                                    if ((input.selectionStart || 0) < lockLength) {
                                                        input.setSelectionRange(lockLength, lockLength);
                                                    }
                                                }, 0);
                                            }}
                                        />
                                    </div>

                                    {errors.mobile && (
                                        <span className="checkout-authentication-form-error">
                                            {errors.mobile}
                                        </span>
                                    )}
                                </div>

                                {/* EMAIL */}
                                <div className="checkout-authentication-form-group">
                                    <label>Email</label>
                                    <input

                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        disabled={otpSent && !isEditing}
                                        autoComplete="off"
                                        placeholder="Enter Email ID"
                                    />
                                    {errors.email && (
                                        <span className="checkout-authentication-form-error">
                                            {errors.email}
                                        </span>
                                    )}
                                </div>

                            </div>

                            {/* GET OTP */}
                            {(!otpSent || isEditing) && (
                                <div className="recaptcha-wrapper">
                                    <ReCAPTCHA
                                        ref={recaptchaRef}
                                        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                                        onChange={handleRecaptchaChange}
                                    />
                                </div>
                            )}


                            {(!otpSent || isEditing) && (

                                <button
                                    type="button"
                                    className={`checkout-authentication-form-btn primary ${(!recaptchaToken || loadingOtp) ? "disabled" : ""
                                        }`}
                                    onClick={handleGetOtp}
                                    disabled={loadingOtp || !recaptchaToken}
                                >
                                    {loadingOtp ? (
                                        <span className="spinner"></span>
                                    ) : otpContext && !isEmailChanged && otpSent ? (
                                        "Enter OTP"
                                    ) : (
                                        "Get OTP via Email"
                                    )}
                                </button>
                            )}

                            {/* OTP */}
                            {otpSent && !isEditing && (
                                <div className="checkout-authentication-form-group full-width">

                                    <div className="otp-label-row">

                                        {/* LEFT SIDE */}
                                        <label className="otp-input-label">
                                            Enter OTP sent to -
                                            <span className="edit-input-data" onClick={handleEditForm}>
                                                <MdOutlineEdit /> {form.email}
                                            </span>
                                        </label>

                                        {/* RIGHT SIDE */}
                                        <div className="otp-actions">
                                            {!canResend ? (
                                                <span className="otp-timer">
                                                    Resend in {resendTimer}s
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="resend-otp-btn"
                                                    onClick={handleResendOtp}
                                                    disabled={loadingOtp}
                                                >
                                                    Resend OTP
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {/* <label className="otp-input-label">Enter OTP sent to - <span className="edit-input-data" onClick={handleEditForm}> <MdOutlineEdit /> {form.email} </span> </label> */}
                                    <input
                                        name="otp"
                                        value={form.otp}
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={6}
                                        onChange={handleChange}
                                    />
                                    {errors.otp && (
                                        <span className="checkout-authentication-form-error">
                                            {errors.otp}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* VERIFY */}
                            {otpSent && !isEditing && (
                                <button
                                    type="button"
                                    className="checkout-authentication-form-btn success"
                                    onClick={handleVerify}
                                    disabled={verifying || form.otp.length < 6}
                                >
                                    {verifying ? <span className="spinner"></span> : "Verify & Pay"}
                                </button>
                            )}

                        </form>

                        <div className="terms-condition-refrence flex justify-center items-center">
                            *By proceeding, I accept the&nbsp;
                            <Link href="/company/terms-of-service" target="_blank">Terms of Use</Link>
                        </div>

                    </div>

                </div>
            </div >

        </>
    )
}

export default UserAuthentication
