import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQList({ items }: { items: FAQItem[] }) {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="faq-list">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div className={`faq-item${isOpen ? " is-open" : ""}`} key={item.question}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${index}`}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span>{t(item.question)}</span>
              <span className="faq-icon" aria-hidden="true">
                +
              </span>
            </button>
            {isOpen && (
              <p className="faq-answer" id={`faq-answer-${index}`}>
                {t(item.answer)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
