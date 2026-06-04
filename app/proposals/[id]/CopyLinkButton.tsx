"use client";

import { useState } from "react";

export function CopyLinkButton({ shareUrl }: { shareUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button className="button secondary fullButton" type="button" onClick={handleCopy}>
      {copied ? "Link copied!" : "Copy share link"}
    </button>
  );
}
