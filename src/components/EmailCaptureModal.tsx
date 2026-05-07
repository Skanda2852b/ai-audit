'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Mail, CheckCircle2, Loader2, Bell } from 'lucide-react';

interface EmailCaptureModalProps {
  auditId?: string;
  monthlySavings?: number;
  shareableUrl?: string;
  mode?: 'report' | 'notify';
  onClose: () => void;
}

export default function EmailCaptureModal({
  auditId,
  monthlySavings,
  shareableUrl,
  mode = 'report',
  onClose,
}: EmailCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [teamSize, setTeamSize] = useState('');
  // Honeypot field — hidden from real users, bots will fill it
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const isNotify = mode === 'notify';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check
    if (website) {
      onClose();
      return;
    }

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          company: company || undefined,
          role: role || undefined,
          teamSize: teamSize ? parseInt(teamSize) : undefined,
          auditId: auditId || undefined,
          monthlySavings: monthlySavings || undefined,
          shareableUrl: shareableUrl || undefined,
          website, // honeypot — server also checks
          notifyMode: isNotify,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-3 right-3"
        >
          <X className="h-4 w-4" />
        </Button>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isNotify ? (
              <>
                <Bell className="h-5 w-5 text-emerald-600" />
                {success ? 'You\'re on the list!' : 'Get notified about new savings'}
              </>
            ) : (
              <>
                <Mail className="h-5 w-5 text-emerald-600" />
                {success ? 'You\'re all set!' : 'Get your report via email'}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
              <p className="font-medium mb-1">
                {isNotify ? 'We\'ll keep you posted!' : 'Report sent!'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isNotify
                  ? 'We\'ll email you when pricing changes or new savings apply to your stack. No spam, ever.'
                  : 'Check your inbox for a link to your personalized audit report.'}
              </p>
              <Button onClick={onClose} className="mt-4" variant="outline">
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isNotify
                  ? 'We\'ll email you when new savings opportunities match your tool stack. No spam, ever.'
                  : 'We\'ll email you a link to your report. No spam, ever.'}
              </p>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    placeholder="Acme Inc"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    placeholder="CTO, Eng Lead..."
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamSize">Team Size</Label>
                <Input
                  id="teamSize"
                  type="number"
                  min={1}
                  placeholder="5"
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                />
              </div>
              {/* Honeypot - hidden from users, bots fill it and get rejected */}
              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                  </>
                ) : isNotify ? (
                  'Notify Me'
                ) : (
                  'Send My Report'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
