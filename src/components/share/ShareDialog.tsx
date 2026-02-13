import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { Share2, Send, Mail, Copy, Loader2, Check, ExternalLink, Sparkles } from 'lucide-react';
import { nip19 } from 'nostr-tools';

interface ShareDialogProps {
  title: string;
  description?: string;
  url: string;
  imageUrl?: string;
  category?: string;
  contentType: 'blog' | 'artwork' | 'shop' | 'event' | 'project';
  eventRef?: {
    id: string;
    kind: number;
    pubkey: string;
    dTag?: string;
  };
  children: React.ReactNode;
}

export function ShareDialog({
  title,
  description,
  url,
  imageUrl,
  category,
  contentType,
  eventRef,
  children
}: ShareDialogProps) {
  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending } = useNostrPublish();
  const { toast } = useToast();

  const [dmRecipient, setDmRecipient] = useState('');
  const [dmMessage, setDmMessage] = useState('');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const contentLabels = {
    blog: 'blog post',
    artwork: 'artwork',
    shop: 'product',
    event: 'event',
    project: 'project'
  };

  const contentLabel = contentLabels[contentType];

  const sendDirectMessage = async () => {
    if (!user || !dmRecipient.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a recipient's npub or pubkey.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Decode npub if provided, otherwise assume it's a hex pubkey
      let recipientPubkey = dmRecipient.trim();
      if (recipientPubkey.startsWith('npub')) {
        const decoded = nip19.decode(recipientPubkey);
        if (decoded.type !== 'npub') {
          throw new Error('Invalid npub format');
        }
        recipientPubkey = decoded.data;
      }

      // Validate hex pubkey format
      if (!/^[0-9a-f]{64}$/i.test(recipientPubkey)) {
        throw new Error('Invalid pubkey format');
      }

      const messageContent = dmMessage.trim() || `Check out this ${contentLabel}: "${title}"`;
      const fullMessage = `${messageContent}\n\n🎨 ${url}`;

      // Check if signer supports NIP-44 encryption
      if (!user.signer.nip44) {
        toast({
          title: "Encryption Not Supported",
          description: "Please upgrade your signer extension to support NIP-44 encryption for direct messages.",
          variant: "destructive"
        });
        return;
      }

      // Encrypt the message using NIP-44
      const encryptedContent = await user.signer.nip44.encrypt(recipientPubkey, fullMessage);

      createEvent({
        kind: 4,
        content: encryptedContent,
        tags: [
          ['p', recipientPubkey]
        ]
      }, {
        onSuccess: () => {
          toast({
            title: "Message Sent! 📨",
            description: `Your ${contentLabel} has been shared via direct message.`,
          });
          setDmRecipient('');
          setDmMessage('');
          setIsOpen(false);
        },
        onError: (error) => {
          console.error('DM send error:', error);
          toast({
            title: "Send Failed",
            description: "Failed to send direct message. Please try again.",
            variant: "destructive"
          });
        }
      });
    } catch (error) {
      console.error('DM preparation error:', error);
      toast({
        title: "Invalid Recipient",
        description: "Please enter a valid npub or hex pubkey.",
        variant: "destructive"
      });
    }
  };

  const sendEmail = () => {
    if (!emailRecipient.trim()) {
      toast({
        title: "Missing Email",
        description: "Please enter an email address.",
        variant: "destructive"
      });
      return;
    }

    const subject = encodeURIComponent(`Check out this ${contentLabel}: "${title}"`);
    const body = encodeURIComponent(
      `${emailMessage.trim() || `I wanted to share this ${contentLabel} with you!`}\n\n` +
      `🎨 ${title}\n` +
      `🔗 View it here: ${url}\n\n` +
      `Created with BitPopArt`
    );

    const mailtoUrl = `mailto:${emailRecipient}?subject=${subject}&body=${body}`;
    window.open(mailtoUrl, '_blank');

    toast({
      title: "Email Client Opened! 📧",
      description: "Your email client should open with the link.",
    });

    setEmailRecipient('');
    setEmailMessage('');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      toast({
        title: "Link Copied! 📋",
        description: "Link copied to clipboard.",
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard.",
        variant: "destructive"
      });
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} - BitPopArt`,
          text: `Check out this ${contentLabel}!`,
          url
        });
      } catch {
        // User cancelled sharing
      }
    } else {
      copyToClipboard();
    }
  };

  const postToNostr = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to post to Nostr.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create the share content
      let shareContent = `${title}\n\n${url}`;

      // Add the image link if available
      if (imageUrl) {
        shareContent = `${title}\n\n${url}\n\n${imageUrl}`;
      }

      // Add hashtags at the end
      const categoryTag = category ? category.toLowerCase().replace(/[^a-z0-9]/g, '') : contentType;
      shareContent += `\n\n#${contentType} #${categoryTag} #bitpopart`;

      // Prepare tags array
      const tags = [
        ['t', contentType],
        ['t', categoryTag],
        ['t', 'bitpopart'],
        ['r', url],
      ];

      // Add event reference if available
      if (eventRef) {
        tags.push(['e', eventRef.id, '', 'mention']);
        
        // Add the d-tag reference if available
        if (eventRef.dTag) {
          tags.push(['a', `${eventRef.kind}:${eventRef.pubkey}:${eventRef.dTag}`, '', 'mention']);
        }
      }

      // Add image tags if available
      if (imageUrl) {
        tags.push(['image', imageUrl]);
        tags.push([
          'imeta',
          `url ${imageUrl}`,
          'm image/jpeg',
          `alt Preview image for "${title}"`,
          `fallback ${url}`
        ]);
        tags.push(['r', imageUrl]);
        tags.push(['url', imageUrl]);
      }

      // Create kind 1 note to share
      createEvent({
        kind: 1,
        content: shareContent,
        tags
      }, {
        onSuccess: () => {
          toast({
            title: "Posted to Nostr! 📢",
            description: `Your ${contentLabel} has been shared with the Nostr community.`,
          });
          setIsOpen(false);
        },
        onError: (error) => {
          console.error('Post to Nostr error:', error);
          toast({
            title: "Post Failed",
            description: "Failed to post to Nostr. Please try again.",
            variant: "destructive"
          });
        }
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Post Failed",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share {contentLabel.charAt(0).toUpperCase() + contentLabel.slice(1)}
          </DialogTitle>
          <DialogDescription>
            Share "{title}" with friends and family.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full overflow-y-auto flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="nostr">Nostr</TabsTrigger>
            <TabsTrigger value="dm">DM</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Share Link</CardTitle>
                <CardDescription>
                  Copy the link or use native sharing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={url}
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <Button onClick={copyToClipboard} variant="outline">
                    {linkCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button onClick={shareNative} className="flex-1">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button onClick={copyToClipboard} variant="outline" className="flex-1">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nostr" className="space-y-4">
            {/* Preview */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image Preview */}
                {imageUrl && (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Content Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{title}</h3>
                  {description && <p className="text-muted-foreground text-sm">{description}</p>}
                  {category && (
                    <span className="inline-block text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                      {category}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Post Preview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Nostr Post Preview</CardTitle>
                <CardDescription>
                  This is how your post will appear on Nostr.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                  <div className="font-medium">{title}</div>
                  <div className="text-blue-600 dark:text-blue-400 text-sm break-all">{url}</div>
                  {imageUrl && (
                    <div className="text-blue-600 dark:text-blue-400 text-sm break-all">{imageUrl}</div>
                  )}
                  <div className="text-purple-600 dark:text-purple-400 text-sm">
                    #{contentType} #{category ? category.toLowerCase().replace(/[^a-z0-9]/g, '') : contentType} #bitpopart
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Button */}
            <Button
              onClick={postToNostr}
              disabled={isPending || !user}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Post to Nostr
                </>
              )}
            </Button>
            {!user && (
              <p className="text-sm text-muted-foreground text-center">
                Please log in to post to Nostr
              </p>
            )}
          </TabsContent>

          <TabsContent value="dm" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Send Direct Message</CardTitle>
                <CardDescription>
                  Send this {contentLabel} privately via Nostr DM
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dm-recipient">Recipient (npub or pubkey)</Label>
                  <Input
                    id="dm-recipient"
                    placeholder="npub1... or hex pubkey"
                    value={dmRecipient}
                    onChange={(e) => setDmRecipient(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dm-message">Message (optional)</Label>
                  <Textarea
                    id="dm-message"
                    placeholder="Add a personal message..."
                    value={dmMessage}
                    onChange={(e) => setDmMessage(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={sendDirectMessage}
                  disabled={isPending || !user}
                  className="w-full"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send DM
                    </>
                  )}
                </Button>
                {!user && (
                  <p className="text-sm text-muted-foreground text-center">
                    Please log in to send direct messages
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Share via Email</CardTitle>
                <CardDescription>
                  Send this {contentLabel} link via email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-recipient">Email Address</Label>
                  <Input
                    id="email-recipient"
                    type="email"
                    placeholder="friend@example.com"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-message">Message (optional)</Label>
                  <Textarea
                    id="email-message"
                    placeholder="Add a personal message..."
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button onClick={sendEmail} className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Open Email Client
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
