"use client";

import { useEffect, useRef, useState } from "react";

type EmailCopyProps = {
  email: string;
};

export default function EmailCopy({ email }: EmailCopyProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const copyWithFallback = () => {
    const input = document.createElement("textarea");
    input.value = email;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    const didCopy = document.execCommand("copy");
    input.remove();
    return didCopy;
  };

  const copyEmail = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
      } else if (!copyWithFallback()) {
        throw new Error("Copy unavailable");
      }
    } catch {
      if (!copyWithFallback()) {
        return;
      }
    }

    setCopied(true);

    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }

    resetTimer.current = setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  return (
    <div className="contact-email">
      <p className="contact-label">EMAIL</p>

      <div className="contact-email-row">
        <a href={`mailto:${email}`}>{email}</a>
        <button
          type="button"
          onClick={copyEmail}
          aria-label={copied ? "Email copied" : "Copy email address"}
        >
          <span aria-live="polite">{copied ? "COPIED ✓" : "COPY"}</span>
        </button>
      </div>
    </div>
  );
}
