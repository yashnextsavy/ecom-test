import { customList } from "country-codes-list";

// key = country name -> value = dial code
export const countryToDialCode = customList(
    "countryNameEn",
    "{countryCallingCode}"
);

// key = ISO country code -> value = dial code
export const countryCodeToDialCode = customList(
    "countryCode",
    "{countryCallingCode}"
);

// key = country name -> full object
export const countryDataMap = customList(
    "countryNameEn",
    "{countryNameEn}:{countryCallingCode}:{countryCode}"
);

const normalizeCountryName = (value?: string) =>
    value
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\(the\)/gi, "")
        .replace(/\*/g, "")
        .replace(/[()[\],']/g, " ")
        .replace(/\s*&\s*/g, " and ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase() || "";

const normalizeDialCode = (value?: string) => value?.replace(/\s+/g, "").trim() || "";

const normalizedCountryNameToDialCode = Object.entries(countryToDialCode).reduce<Record<string, string>>(
    (acc, [countryName, dialCode]) => {
        const normalizedName = normalizeCountryName(countryName);
        const normalizedDialCode = normalizeDialCode(dialCode);

        if (normalizedName && normalizedDialCode) {
            acc[normalizedName] = normalizedDialCode;
        }

        return acc;
    },
    {}
);

export const getDialCodeValue = (countryName?: string, countryCode?: string) => {
    const dialCodeFromCountryCode = normalizeDialCode(
        countryCode ? countryCodeToDialCode[countryCode] : ""
    );

    if (dialCodeFromCountryCode) {
        return dialCodeFromCountryCode;
    }

    const dialCodeFromCountryName = normalizeDialCode(
        countryName ? countryToDialCode[countryName] : ""
    );

    if (dialCodeFromCountryName) {
        return dialCodeFromCountryName;
    }

    return normalizedCountryNameToDialCode[normalizeCountryName(countryName)] || "";
};

export const getFormattedDialCode = (
    countryName?: string,
    countryCode?: string,
    fallback = "+91"
) => {
    const dialCode = getDialCodeValue(countryName, countryCode);
    return dialCode ? `+${dialCode}` : fallback;
};
