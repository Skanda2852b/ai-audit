'use client';

import { Button } from '@/components/ui/button';
import { Share2, Copy, Check, Mail } from 'lucide-react';
import { useState } from 'react';

interface ShareButtonsProps {
  shareableUrl: string;
  savings: number;
}

export default function ShareButtons({ shareableUrl, savings }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers / iframe restrictions
      try {
        const textarea = document.createElement('textarea');
        textarea.value = shareableUrl;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // Last resort: prompt the user
        prompt('Copy this link to share:', shareableUrl);
      }
    }
  };

  const shareOnTwitter = () => {
    const text = `I just found $${savings.toFixed(0)}/month in AI tool savings with AI Spend Audit! Check yours:`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareableUrl)}`;
    window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');
  };

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareableUrl)}`;
    window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(
      `I found $${savings.toFixed(0)}/month in AI tool savings!`
    );
    const body = encodeURIComponent(
      `Check out this AI Spend Audit — I found $${savings.toFixed(0)}/month in potential savings on AI tools!\n\n` +
        `See the full report: ${shareableUrl}\n\n` +
        `Get your own free audit at ${window.location.origin}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

  return (
    <>
      <Button variant="outline" onClick={copyLink} className="flex-1">
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4 text-emerald-600" /> Copied!
          </>
        ) : (
          <>
            <Copy className="mr-2 h-4 w-4" /> Copy Link
          </>
        )}
      </Button>
      <Button variant="outline" onClick={shareOnTwitter} className="flex-1">
        <Share2 className="mr-2 h-4 w-4" /> Twitter
      </Button>
      <Button variant="outline" onClick={shareOnLinkedIn} className="flex-1">
        <Share2 className="mr-2 h-4 w-4" /> LinkedIn
      </Button>
      <Button variant="outline" onClick={shareViaEmail} className="flex-1">
        <Mail className="mr-2 h-4 w-4" /> Email
      </Button>
    </>
  );
}
