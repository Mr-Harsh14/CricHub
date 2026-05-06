"use client";

import { useState } from "react";

type CopyButtonProps = {
  text: string;
};

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyText() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button className="button button-primary" type="button" onClick={copyText}>
      {copied ? "Copied" : "Copy message"}
    </button>
  );
}
