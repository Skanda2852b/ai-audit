'use client';

import { Button } from '@/components/ui/button';
import { Share2, Copy, Check } from 'lucide-react';
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
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = shareableUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnTwitter = () => {
    const text = `I just found $${savings.toFixed(0)}/month in AI tool savings with AI Spend Audit! Check yours:`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareableUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareableUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
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
    </>
  );
}
