import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Web3Forms access key — get yours free in 30 seconds:
// 1. Go to https://web3forms.com
// 2. Enter shop@bitpopart.com and click "Create Access Key"
// 3. Check your email, click the confirmation link
// 4. Copy the access key and paste it below
const WEB3FORMS_KEY = '7769e613-722d-4609-b1f5-cb83bf3d7a5b';

/**
 * FloatingChatButton
 *
 * A persistent floating button (bottom-left). First click opens a compact
 * inline chat bubble with a quick email form. Submitting POSTs to Web3Forms
 * which delivers the message directly to shop@bitpopart.com — no email client
 * opens, no backend needed. A "More → Community" link takes visitors to the
 * full community/FAQ page.
 *
 * Hidden on the Community page itself.
 */
export function FloatingChatButton() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Don't show on the community page itself
  if (pathname === '/community') return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `BitPopArt message from ${form.name}`,
          from_name: form.name,
          name: form.name,
          email: form.email,
          message: form.message,
          botcheck: '',
        }),
      });

      const data = await res.json() as { success?: boolean; message?: string };
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Send failed');
      }

      setSent(true);
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSent(false);
    setError('');
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-3">

      {/* ── Chat bubble popup ── */}
      {open && (
        <div className="w-80 rounded-2xl shadow-2xl border border-pink-100 dark:border-pink-900 bg-white dark:bg-gray-900 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-white" />
              <span className="text-sm font-bold text-white">Get in Touch</span>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            {sent ? (
              <div className="text-center py-4 space-y-2">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
                <p className="font-bold text-sm text-green-700 dark:text-green-400">Message sent!</p>
                <p className="text-xs text-muted-foreground">
                  Thanks! We'll get back to you as soon as possible.
                </p>
                <button
                  className="text-xs text-pink-600 dark:text-pink-400 underline mt-1"
                  onClick={() => setSent(false)}
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-2.5">
                <p className="text-xs text-muted-foreground mb-1">
                  Quick message to BitPopArt — we read every one! ✉️
                </p>

                <Input
                  name="name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={handleChange}
                  className="h-8 text-sm border-pink-200 dark:border-pink-800 focus-visible:ring-pink-400"
                />
                <Input
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={handleChange}
                  className="h-8 text-sm border-pink-200 dark:border-pink-800 focus-visible:ring-pink-400"
                />
                <Textarea
                  name="message"
                  placeholder="Your message…"
                  rows={3}
                  value={form.message}
                  onChange={handleChange}
                  className="text-sm resize-none border-pink-200 dark:border-pink-800 focus-visible:ring-pink-400"
                />

                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}

                <Button
                  type="submit"
                  size="sm"
                  disabled={sending}
                  className="w-full bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 hover:from-pink-600 hover:via-orange-500 hover:to-yellow-500 text-white border-0 h-8 text-xs font-bold disabled:opacity-70"
                >
                  {sending ? (
                    <>Sending…</>
                  ) : (
                    <>
                      <Send className="h-3 w-3 mr-1.5" />
                      Send Message
                    </>
                  )}
                </Button>

                {/* Link to full community page */}
                <Link
                  to="/community"
                  onClick={handleClose}
                  className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors pt-0.5"
                >
                  More — FAQ &amp; Community
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Toggle button ── */}
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-label="Open contact form"
        className={[
          'h-14 w-14 rounded-full relative',
          'bg-gradient-to-br from-pink-500 via-orange-400 to-yellow-400',
          'hover:from-pink-600 hover:via-orange-500 hover:to-yellow-500',
          'shadow-lg hover:shadow-xl',
          'transition-all duration-300',
          'hover:scale-110 active:scale-95',
          'flex items-center justify-center',
          'ring-2 ring-white/40 dark:ring-gray-900/40',
        ].join(' ')}
      >
        {open
          ? <X className="h-6 w-6 text-white drop-shadow" />
          : <MessageCircle className="h-6 w-6 text-white drop-shadow" />
        }
        {/* Pulsing green dot — hide when open */}
        {!open && (
          <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-green-400 border-2 border-white dark:border-gray-900 animate-pulse" />
        )}
      </button>
    </div>
  );
}
