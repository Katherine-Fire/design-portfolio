"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type ContactIcon = "mail" | "phone" | "wechat";

type EmailCopyProps = {
  href?: string;
  icon: ContactIcon;
  label?: string;
  value: string;
  variant?: "primary" | "secondary";
};

const iconPaths: Record<ContactIcon, ReactNode> = {
  mail: (
    <>
      <rect x="2.75" y="4.5" width="18.5" height="15" rx="2.5" />
      <path d="m4 6 8 6 8-6" />
    </>
  ),
  phone: (
    <path d="M7.2 3.5 9.8 8l-2 1.9a15.5 15.5 0 0 0 6.3 6.3l1.9-2 4.5 2.6-.8 3.1c-.2.8-.9 1.3-1.7 1.3C9.6 20.8 3.2 14.4 2.8 6c0-.8.5-1.5 1.3-1.7l3.1-.8Z" />
  ),
  wechat: (
    <>
      <path d="M13.2 16.4c-1 .3-2 .5-3.2.5-4.1 0-7.4-2.7-7.4-6.1S5.9 4.7 10 4.7s7.4 2.7 7.4 6.1c0 .5-.1 1-.2 1.5" />
      <path d="M21.4 15.3c0 2.7-2.7 4.9-6 4.9-1 0-1.9-.2-2.7-.5l-2.4 1.1.7-2.1a4.5 4.5 0 0 1-1.6-3.4c0-2.7 2.7-4.9 6-4.9s6 2.2 6 4.9Z" />
    </>
  ),
};

export default function EmailCopy({
  href,
  icon,
  label,
  value,
  variant = "secondary",
}: EmailCopyProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const copyWithFallback = () => {
    const input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    const didCopy = document.execCommand("copy");
    input.remove();
    return didCopy;
  };

  const copyValue = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else if (!copyWithFallback()) {
        throw new Error("Copy unavailable");
      }
    } catch {
      if (!copyWithFallback()) return;
    }

    setCopied(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 1800);
  };

  const valueContent = href ? <a href={href}>{value}</a> : <p>{value}</p>;

  return (
    <div className={`contact-method contact-method--${variant}`}>
      <span className="contact-method-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
          {iconPaths[icon]}
        </svg>
      </span>

      <div className="contact-method-content">
        {label ? <p className="contact-method-label">{label}</p> : null}
        {valueContent}
      </div>

      <button
        type="button"
        onClick={copyValue}
        aria-label={copied ? `${label ?? "Contact"} copied` : `Copy ${label ?? "contact"}`}
      >
        <span aria-live="polite">{copied ? "COPIED" : "COPY"}</span>
      </button>
    </div>
  );
}
