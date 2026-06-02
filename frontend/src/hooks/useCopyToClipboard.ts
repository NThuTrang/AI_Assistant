import { useState } from 'react';

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);

      return true;
    } catch (err) {
      console.error('Copy failed:', err);
      setCopied(false);
      return false;
    }
  };

  return {
    copied,
    copy,
  };
}