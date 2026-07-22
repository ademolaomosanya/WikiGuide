import { useRef, useState, type FormEvent } from "react";

import { sendChatMessage, type ChatSource } from "../api/chat";
import type { AuthUser } from "../types/api";
import { useLanguage } from "../i18n/LanguageContext";

interface ChatWindowProps {
  user: AuthUser | null;
}

interface ChatMessage {
  id: number;
  role: "user" | "assistant" | "error";
  text: string;
  sources: ChatSource[];
}

const suggestions = [
  "How do I make my first Wikipedia edit?",
  "How do I upload an image to Commons?",
  "What is Wikidata?",
];

export function ChatWindow({ user }: ChatWindowProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const nextId = useRef(1);

  const submitMessage = async (message: string) => {
    const normalizedMessage = message.trim();
    if (!normalizedMessage || isSending) return;

    const userMessage: ChatMessage = {
      id: nextId.current++,
      role: "user",
      text: normalizedMessage,
      sources: [],
    };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await sendChatMessage(normalizedMessage);
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: "assistant",
          text: response.answer,
          sources: response.sources,
        },
      ]);
    } catch (requestError) {
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: "error",
          text:
            requestError instanceof Error
              ? requestError.message
              : "WikiGuide chat is unavailable.",
          sources: [],
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitMessage(input);
  };

  return (
    <div className="chat-page">
      <section className="chat-window" aria-labelledby="chat-title">
        <header className="chat-heading">
          <span aria-hidden="true">W</span>
          <div>
            <p className="dashboard-kicker">{t("Grounded in WikiGuide resources")}</p>
            <h1 id="chat-title">{t("Ask WikiGuide")}</h1>
            <p>{t("Get help with your first Wikimedia contributions.")}</p>
          </div>
        </header>

        <div className="chat-messages" aria-live="polite">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <h2>{t("What would you like to learn?")}</h2>
              <p>{t("Try one of these newcomer questions.")}</p>
              <div>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void submitMessage(suggestion)}
                  >
                    {t(suggestion)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <article className={`chat-message is-${message.role}`} key={message.id}>
                <span>
                  {message.role === "user"
                    ? user?.username.slice(0, 1).toUpperCase() ?? "Y"
                    : "W"}
                </span>
                <div>
                  <strong>{message.role === "user" ? t("You") : "WikiGuide"}</strong>
                  <p>{message.text}</p>
                  {message.role === "assistant" && (
                    <div className="chat-sources">
                      <b>{t("Sources")}</b>
                      {message.sources.length > 0 ? (
                        <ul>
                          {message.sources.map((source) => (
                            <li key={source.url}>
                              <a href={source.url} rel="noreferrer" target="_blank">
                                {source.title} <span aria-hidden="true">↗</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span>{t("No matching WikiGuide resources.")}</span>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
          {isSending && (
            <div className="chat-loading" role="status">
              <span /><span /><span /> WikiGuide is checking its resources…
            </div>
          )}
        </div>

        <form className="chat-composer" onSubmit={handleSubmit}>
          <label htmlFor="chat-message">{t("Ask about contributing to Wikimedia")}</label>
          <div>
            <textarea
              id="chat-message"
              maxLength={1000}
              placeholder="How do I add a reference?"
              rows={2}
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <button disabled={!input.trim() || isSending} type="submit">
              {t(isSending ? "Sending…" : "Send")}
            </button>
          </div>
          <small>{t("Answers are limited to the resources currently available in WikiGuide.")}</small>
        </form>
      </section>
    </div>
  );
}
