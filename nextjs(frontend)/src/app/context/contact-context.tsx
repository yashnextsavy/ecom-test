"use client";

import { createContext, useContext } from "react";
import { ContactInformation } from "@/lib/api";

type ContactContextType = {
    contactData?: ContactInformation;
};

const ContactContext = createContext<ContactContextType | null>(null);

export function     ContactProvider({
    children,
    contactData,
}: {
    children: React.ReactNode;
    contactData?: ContactInformation;
}) {
    return (
        <ContactContext.Provider value={{ contactData }}>
            {children}
        </ContactContext.Provider>
    );
}

export function useContact() {
    const context = useContext(ContactContext);

    if (!context) {
        throw new Error("useContact must be used inside ContactProvider");
    }

    return context;
}