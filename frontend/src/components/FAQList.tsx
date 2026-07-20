import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQList({ items }: { items: FAQItem[] }) {
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
              <span>{item.question}</span>
              <span className="faq-icon" aria-hidden="true">
                +
              </span>
            </button>
            {isOpen && (
              <p className="faq-answer" id={`faq-answer-${index}`}>
                {item.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
