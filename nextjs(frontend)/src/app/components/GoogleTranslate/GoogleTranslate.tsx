"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement?: new (
          options: Record<string, unknown>,
          elementId: string
        ) => unknown;
      };
    };
  }
}

const GOOGLE_TRANSLATE_CONTAINER_ID = "google_translate_element";

export default function GoogleTranslate() {
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      const TranslateElement = window.google?.translate?.TranslateElement;
      if (!TranslateElement) return;

      const container = document.getElementById(GOOGLE_TRANSLATE_CONTAINER_ID);
      if (!container || container.childElementCount > 0) return;

      new TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,hi,ar,fr,de,es",
          autoDisplay: false,
        },
        GOOGLE_TRANSLATE_CONTAINER_ID
      );
    };
  }, []);

  return (
    <div className="google-translate-widget">
      <div id={GOOGLE_TRANSLATE_CONTAINER_ID} />
      <Script
        id="google-translate-script"
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </div>
  );
}
