import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Smartphone,
  ExternalLink,
  CheckCircle2,
  Copy,
  Heart,
  Download,
  Zap,
  Apple,
  Globe,
  ShieldCheck,
  Package,
  Upload,
  Code2,
  BookOpen,
  AlertCircle,
  Star,
  Users,
  Lock,
} from 'lucide-react';

// Android icon SVG (simple)
function AndroidIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C7.15 3.23 6 5.01 6 7h12c0-1.99-1.15-3.77-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/>
    </svg>
  );
}

interface StepProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

function Step({ number, title, children }: StepProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      <div className="flex-1 pb-6">
        <h4 className="font-semibold text-sm mb-1.5">{title}</h4>
        <div className="text-sm text-muted-foreground space-y-2">{children}</div>
      </div>
    </div>
  );
}

function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-green-400 text-xs rounded-lg p-3 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap break-all">
        {code}
      </pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
        onClick={handleCopy}
      >
        {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

// ── App Overview Card ──────────────────────────────────────

function AppOverview() {
  return (
    <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* App Icon */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg ring-4 ring-orange-200 dark:ring-orange-800">
              <img
                src="/fan-app-icon.png"
                alt="BitPopArt Fan App Icon"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* App Info */}
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-xl font-bold">BitPopArt Fan App</h3>
              <p className="text-sm text-muted-foreground">Bitcoin Pop Art fan community app</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className="bg-orange-500 text-white border-0 gap-1">
                <Heart className="h-3 w-3" /> Fan App
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Globe className="h-3 w-3" /> PWA
              </Badge>
              <Badge variant="outline" className="gap-1 text-green-700 border-green-300 dark:text-green-400 dark:border-green-700">
                <Lock className="h-3 w-3" /> No Login Required
              </Badge>
              <Badge variant="outline" className="gap-1">
                <ShieldCheck className="h-3 w-3" /> No KYC
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="text-center p-3 bg-white/60 dark:bg-black/20 rounded-xl">
                <Download className="h-5 w-5 mx-auto mb-1 text-teal-600" />
                <p className="text-xs font-semibold">Free Downloads</p>
                <p className="text-[10px] text-muted-foreground">Wallpapers, GIFs, Avatars</p>
              </div>
              <div className="text-center p-3 bg-white/60 dark:bg-black/20 rounded-xl">
                <Users className="h-5 w-5 mx-auto mb-1 text-violet-600" />
                <p className="text-xs font-semibold">Community</p>
                <p className="text-[10px] text-muted-foreground">Open to all fans</p>
              </div>
              <div className="text-center p-3 bg-white/60 dark:bg-black/20 rounded-xl">
                <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
                <p className="text-xs font-semibold">Bitcoin Native</p>
                <p className="text-[10px] text-muted-foreground">Lightning payments</p>
              </div>
            </div>

            <div className="flex gap-2 pt-1 flex-wrap">
              <a href="/app" target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Preview App
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
              <a href="https://bitpopart.com/app" target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" /> bitpopart.com/app
                </Button>
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Zapstore Tab ───────────────────────────────────────────

function ZapstoreTab() {
  const zapstoreYaml = `# zapstore.yaml — commit this to your repo root
name: "BitPopArt Fan App"
identifier: "com.bitpopart.fanapp"
repository: https://github.com/bitpopart/nostrpop
pubkey: npub105em547c5m5gdxslr4fp2f29jav54sxml6cpk6gda7xyvxuzmv6s84a642
website: https://bitpopart.com/app
description: >
  The BitPopArt fan community app — free wallpapers, GIFs, animations,
  avatars, merch and more! Bitcoin pop art for fans worldwide.
  No login, no KYC, no barriers.
categories:
  - Art
  - Entertainment
  - Social
license: MIT`;

  const zspCommand = `# Install zsp (Zapstore CLI)
go install github.com/zapstore/zsp@latest

# Publish your app (interactive wizard)
zsp publish --wizard

# Or direct publish
zsp publish -r github.com/bitpopart/nostrpop`;

  return (
    <div className="space-y-6">
      <Alert className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-700">
        <Zap className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          <strong>Zapstore</strong> is the Nostr-native app store — no gatekeeping, no permission needed. Apps are signed by developers and verified cryptographically. Perfect for the BitPopArt fan app!
        </AlertDescription>
      </Alert>

      {/* What is Zapstore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <img src="https://zapstore.dev/images/logo.svg" alt="Zapstore" className="h-5 w-5" onError={(e) => { e.currentTarget.style.display='none'; }} />
            About Zapstore
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Zapstore is an open, decentralized app store built on Nostr. It's the perfect home for the BitPopArt fan app because:</p>
          <ul className="space-y-1.5 ml-4">
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> No gatekeeping — publish directly to users</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Apps are cryptographically signed by developers</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Built on Nostr — aligned with BitPopArt values</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Users can tip developers via Lightning zaps</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Android first, more platforms coming</li>
          </ul>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-5 w-5 text-yellow-600" />
            Publishing to Zapstore
          </CardTitle>
          <CardDescription>Step-by-step guide to list the BitPopArt fan app on Zapstore</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            <Step number={1} title="Create a zapstore.yaml in the repo root">
              <p>This file identifies your app and links it to your Nostr identity. Commit it to the <code className="bg-muted px-1 rounded text-xs">github.com/bitpopart/nostrpop</code> repo.</p>
              <CopyableCode code={zapstoreYaml} />
            </Step>

            <Step number={2} title="Install the zsp CLI tool">
              <p>Install the Zapstore Publisher (zsp) tool. Requires Go installed on your machine.</p>
              <CopyableCode code={zspCommand} />
            </Step>

            <Step number={3} title="Run the interactive wizard">
              <p>The wizard guides you through signing, metadata enrichment, and publishing. It links your APK signing certificate to your Nostr identity (one-time step).</p>
              <CopyableCode code="zsp publish --wizard" />
            </Step>

            <Step number={4} title="Get whitelisted automatically">
              <p>When the app event reaches the Zapstore relay, it fetches your <code className="bg-muted px-1 rounded text-xs">zapstore.yaml</code> from the repo, verifies the pubkey matches, and whitelists you. Your Nostr identity <code className="bg-muted px-1 rounded text-xs">npub105em...</code> is already registered — future publishes pass immediately.</p>
            </Step>

            <Step number={5} title="Done — fans can now find your app!">
              <p>Your app appears in the Zapstore catalog. Fans can download it directly, leave comments, and zap you as a tip.</p>
              <div className="flex gap-2 mt-2">
                <a href="https://zapstore.dev/apps" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" /> Browse Zapstore Apps
                  </Button>
                </a>
                <a href="https://zapstore.dev/docs/publish" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" /> Full Docs
                  </Button>
                </a>
              </div>
            </Step>
          </div>
        </CardContent>
      </Card>

      {/* Note about PWA vs native */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
          <strong>Note:</strong> Zapstore currently focuses on Android APKs. To publish the fan app as a native Android APK, consider wrapping the PWA using <strong>Bubblewrap</strong> (Google's PWA-to-TWA tool) to generate an APK from <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded text-xs">bitpopart.com/app</code>. The resulting APK can then be published on Zapstore.
        </AlertDescription>
      </Alert>

      {/* Bubblewrap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Code2 className="h-5 w-5 text-green-600" />
            Generate Android APK with Bubblewrap
          </CardTitle>
          <CardDescription>Wrap the BitPopArt PWA into a native Android APK for Zapstore</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            <Step number={1} title="Install Bubblewrap">
              <CopyableCode code="npm i -g @bubblewrap/cli" />
            </Step>
            <Step number={2} title="Initialize the TWA project">
              <CopyableCode code={`bubblewrap init --manifest https://bitpopart.com/manifest.webmanifest`} />
            </Step>
            <Step number={3} title="Build the APK">
              <CopyableCode code="bubblewrap build" />
            </Step>
            <Step number={4} title="Publish the APK to Zapstore">
              <CopyableCode code={`zsp publish --release-source ./app-release-signed.apk \\
  -r github.com/bitpopart/nostrpop`} />
            </Step>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Google Play Tab ────────────────────────────────────────

function GooglePlayTab() {
  const twaManifest = `// twa-manifest.json
{
  "packageId": "com.bitpopart.fanapp",
  "host": "bitpopart.com",
  "name": "BitPopArt Fan App",
  "launcherName": "BitPopArt",
  "themeColor": "#f97316",
  "navigationColor": "#f97316",
  "backgroundColor": "#fef3c7",
  "enableNotifications": false,
  "startUrl": "/app",
  "iconUrl": "https://bitpopart.com/fan-app-icon.png",
  "maskableIconUrl": "https://bitpopart.com/fan-app-icon.png",
  "appVersion": "1",
  "signingKey": {
    "path": "./android.keystore",
    "alias": "bitpopart"
  },
  "generatorApp": "bubblewrap-cli"
}`;

  const assetLinksJson = `// public/.well-known/assetlinks.json
// Replace SHA256_CERT_FINGERPRINT with your keystore fingerprint
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.bitpopart.fanapp",
    "sha256_cert_fingerprints": ["SHA256_CERT_FINGERPRINT"]
  }
}]`;

  return (
    <div className="space-y-6">
      <Alert className="border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-700">
        <AndroidIcon className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          <strong>Trusted Web Activity (TWA)</strong> is the recommended way to publish a PWA to Google Play. It wraps the BitPopArt web app in a native Android shell — no separate codebase needed.
        </AlertDescription>
      </Alert>

      {/* Prerequisites */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prerequisites</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Google Play Developer Account ($25 one-time fee)</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Java JDK installed (for Bubblewrap)</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Android SDK (or Android Studio)</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Node.js & npm</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> PWA must score 80+ on Chrome Lighthouse</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> HTTPS with valid SSL certificate ✓ (bitpopart.com has this)</li>
          </ul>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AndroidIcon className="h-5 w-5 text-green-600" />
            Publishing to Google Play
          </CardTitle>
          <CardDescription>Using Bubblewrap to wrap the BitPopArt PWA as a TWA</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            <Step number={1} title="Install Bubblewrap CLI">
              <CopyableCode code="npm i -g @bubblewrap/cli" />
            </Step>

            <Step number={2} title="Initialize the TWA project">
              <p>Run from your project directory. Bubblewrap reads the PWA manifest automatically.</p>
              <CopyableCode code="bubblewrap init --manifest https://bitpopart.com/manifest.webmanifest" />
              <p className="mt-2">Or configure manually using:</p>
              <CopyableCode code={twaManifest} />
            </Step>

            <Step number={3} title="Set up Digital Asset Links (required for Play Store)">
              <p>This proves you own both the website and the app. Add a <code className="bg-muted px-1 rounded text-xs">.well-known/assetlinks.json</code> file to bitpopart.com:</p>
              <CopyableCode code={assetLinksJson} />
              <p className="mt-2">Get your SHA256 fingerprint after generating the keystore:</p>
              <CopyableCode code="keytool -list -v -keystore android.keystore -alias bitpopart" />
            </Step>

            <Step number={4} title="Build the signed APK">
              <CopyableCode code="bubblewrap build" />
            </Step>

            <Step number={5} title="Create the app on Google Play Console">
              <p>Go to the Google Play Console, create a new app, fill in the store listing:</p>
              <ul className="space-y-1 mt-2 ml-4">
                <li>• <strong>App name:</strong> BitPopArt Fan App</li>
                <li>• <strong>Short description:</strong> Free Bitcoin pop art for fans — wallpapers, GIFs, merch & more</li>
                <li>• <strong>Category:</strong> Art & Design / Entertainment</li>
                <li>• <strong>Content rating:</strong> Everyone</li>
                <li>• <strong>Icon:</strong> Upload fan-app-icon.png (512×512)</li>
              </ul>
            </Step>

            <Step number={6} title="Upload the AAB / APK and publish">
              <p>Upload to the <strong>Internal Testing</strong> track first to verify, then promote to Production.</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <a href="https://play.google.com/console" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" /> Google Play Console
                  </Button>
                </a>
                <a href="https://developer.chrome.com/docs/android/trusted-web-activity/integration-guide" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" /> TWA Integration Guide
                  </Button>
                </a>
              </div>
            </Step>
          </div>
        </CardContent>
      </Card>

      {/* Store Listing Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Suggested Store Listing Copy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-1">
            <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Full Description</p>
            <div className="bg-muted rounded-lg p-3 text-sm leading-relaxed">
              <p>BitPopArt Fan App — the official community app for fans of Bitcoin pop art!</p>
              <br />
              <p>🎨 <strong>What you get:</strong></p>
              <p>• Free wallpapers, GIFs, and animated art for your devices</p>
              <p>• Custom profile avatars and header banners</p>
              <p>• Bitcoin-inspired pop art animations</p>
              <p>• Shop exclusive BitPopArt merchandise</p>
              <p>• Connect with the Nostr community</p>
              <br />
              <p>❤️ <strong>Fan-first:</strong> No account required. No KYC. No data collection. Just art and good vibes.</p>
              <br />
              <p>⚡ <strong>Bitcoin native:</strong> Support the artist directly with Lightning micropayments.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Apple App Store Tab ────────────────────────────────────

function AppleTab() {
  const pwaBuildConfig = `# Install PWABuilder CLI
npm install -g @pwabuilder/cli

# Package the PWA for iOS
pwa-builder package -p ios -u https://bitpopart.com/app`;

  return (
    <div className="space-y-6">
      <Alert className="border-gray-300 bg-gray-50 dark:bg-gray-950/20">
        <Apple className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        <AlertDescription className="text-gray-700 dark:text-gray-300">
          <strong>PWABuilder</strong> is the recommended tool for publishing PWAs to the Apple App Store. It creates a native iOS wrapper for the BitPopArt web app automatically.
        </AlertDescription>
      </Alert>

      {/* Prerequisites */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prerequisites</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Apple Developer Account ($99/year)</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Mac with Xcode installed (required for iOS builds)</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> App Store Connect account</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> PWA must have HTTPS, Web Manifest, and Service Worker ✓</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> App icons in required sizes (PWABuilder handles this)</li>
          </ul>
        </CardContent>
      </Card>

      {/* Option A: PWABuilder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Option A: PWABuilder (Easiest)
          </CardTitle>
          <CardDescription>Microsoft's free PWA packaging tool — handles all the iOS complexity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            <Step number={1} title="Go to PWABuilder.com">
              <p>Visit <a href="https://pwabuilder.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">pwabuilder.com</a> and enter the app URL:</p>
              <CopyableCode code="https://bitpopart.com/app" />
            </Step>

            <Step number={2} title="Review your PWA score">
              <p>PWABuilder scores your PWA. Check for any missing features. The BitPopArt fan app should score well with the existing manifest and service worker.</p>
            </Step>

            <Step number={3} title="Generate the iOS package">
              <p>Click <strong>Package For Stores</strong> → <strong>iOS</strong>. Download the generated Xcode project.</p>
              <p className="mt-2">Or use the CLI:</p>
              <CopyableCode code={pwaBuildConfig} />
            </Step>

            <Step number={4} title="Open in Xcode and configure signing">
              <p>Open the <code className="bg-muted px-1 rounded text-xs">.xcodeproj</code> file in Xcode. Set your Apple Developer Team and Bundle ID:</p>
              <CopyableCode code="com.bitpopart.fanapp" />
            </Step>

            <Step number={5} title="Upload to App Store Connect">
              <p>In Xcode: <strong>Product → Archive → Distribute App → App Store Connect</strong></p>
            </Step>

            <Step number={6} title="Complete App Store listing">
              <p>In <a href="https://appstoreconnect.apple.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">App Store Connect</a>, fill in:</p>
              <ul className="space-y-1 mt-2 ml-4">
                <li>• <strong>Name:</strong> BitPopArt Fan App</li>
                <li>• <strong>Subtitle:</strong> Bitcoin Pop Art for Fans</li>
                <li>• <strong>Category:</strong> Entertainment</li>
                <li>• <strong>Age Rating:</strong> 4+</li>
                <li>• <strong>Price:</strong> Free</li>
                <li>• Screenshots for iPhone 6.5" and iPad</li>
              </ul>
              <div className="flex gap-2 mt-3 flex-wrap">
                <a href="https://www.pwabuilder.com" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" /> PWABuilder
                  </Button>
                </a>
                <a href="https://appstoreconnect.apple.com" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" /> App Store Connect
                  </Button>
                </a>
              </div>
            </Step>
          </div>
        </CardContent>
      </Card>

      {/* Store Listing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Suggested App Store Copy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">App Name</p>
              <CopyableCode code="BitPopArt Fan App" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Subtitle (30 chars max)</p>
              <CopyableCode code="Bitcoin Pop Art for Fans" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Keywords</p>
              <CopyableCode code="bitcoin art, pop art, wallpapers, bitcoin, nostr, crypto art, digital art, free wallpaper" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Description</p>
              <div className="bg-muted rounded-lg p-3 text-sm leading-relaxed">
                <p>BitPopArt Fan App — your free Bitcoin pop art community!</p>
                <br />
                <p>🎨 <strong>FREE content for fans:</strong></p>
                <p>• Beautiful Bitcoin-inspired wallpapers for your phone</p>
                <p>• Animated GIFs and pop art stickers</p>
                <p>• Custom profile avatars and header banners</p>
                <p>• Exclusive animation videos</p>
                <br />
                <p>🛍️ <strong>Shop merch</strong> — Bitcoin pop art prints, clothing & collectibles</p>
                <br />
                <p>❤️ <strong>Truly free:</strong> No sign-up, no account, no KYC. Just download and enjoy. Good vibes only!</p>
                <br />
                <p>⚡ <strong>Bitcoin native:</strong> Support the artist directly with Lightning payments.</p>
                <br />
                <p>Created by Johannes Oppewal — world traveling Bitcoin pop artist (88 countries and counting).</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Policy Note */}
      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
          <strong>Apple Privacy Policy requirement:</strong> The App Store requires a privacy policy URL even for apps with no user data collection. Create a simple privacy policy page at <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded text-xs">bitpopart.com/privacy</code> stating that no personal data is collected or shared.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// ── PWA Readiness Checklist ────────────────────────────────

function PwaChecklist() {
  const checks = [
    { label: 'HTTPS with valid SSL certificate', done: true, note: 'bitpopart.com has HTTPS' },
    { label: 'Web App Manifest (manifest.webmanifest)', done: true, note: 'File exists at /manifest.webmanifest' },
    { label: 'App Name & Short Name', done: true, note: '"BitPopArt" / "BitPopArt Fan App"' },
    { label: 'App Icon (512×512 PNG)', done: true, note: 'fan-app-icon.png added' },
    { label: 'Theme Color & Background Color', done: true, note: 'Orange theme configured' },
    { label: 'Start URL defined', done: true, note: 'start_url: "/"' },
    { label: 'Display Mode: standalone', done: true, note: 'display: "standalone"' },
    { label: 'Service Worker registered', done: false, note: 'Verify in browser DevTools → Application → Service Workers' },
    { label: 'Offline fallback page', done: false, note: 'Optional but recommended for store listings' },
    { label: 'Privacy Policy URL', done: false, note: 'Required for App Store (Apple)' },
    { label: 'Screenshots for store listings', done: false, note: 'Take screenshots at 1290×2796px (iPhone) and 2048×2732px (iPad)' },
    { label: 'Digital Asset Links (.well-known/assetlinks.json)', done: false, note: 'Required for Google Play TWA verification' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-green-600" />
          PWA Publishing Readiness Checklist
        </CardTitle>
        <CardDescription>Requirements for publishing to all app stores</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {checks.map((check, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0">
              {check.done ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-gray-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${check.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {check.label}
                </p>
                <p className="text-xs text-muted-foreground">{check.note}</p>
              </div>
              <Badge variant={check.done ? 'default' : 'outline'} className={`text-[10px] flex-shrink-0 ${check.done ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200' : ''}`}>
                {check.done ? 'Done' : 'TODO'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ─────────────────────────────────────────

export function FanAppPublishing() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Smartphone className="h-6 w-6 text-orange-600" />
        <div>
          <h2 className="text-xl font-bold">Fan App Publishing</h2>
          <p className="text-sm text-muted-foreground">
            Publish the BitPopArt fan app to Apple App Store, Google Play, and Zapstore
          </p>
        </div>
      </div>

      {/* App Overview */}
      <AppOverview />

      {/* PWA Checklist */}
      <PwaChecklist />

      <Separator />

      {/* Platform Tabs */}
      <Tabs defaultValue="zapstore" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="zapstore" className="gap-1.5">
            <Zap className="h-3.5 w-3.5 text-yellow-500" />
            Zapstore
            <Badge className="ml-1 text-[9px] bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 px-1 py-0">Nostr</Badge>
          </TabsTrigger>
          <TabsTrigger value="google" className="gap-1.5">
            <AndroidIcon className="h-3.5 w-3.5 text-green-600" />
            Google Play
          </TabsTrigger>
          <TabsTrigger value="apple" className="gap-1.5">
            <Apple className="h-3.5 w-3.5" />
            Apple Store
          </TabsTrigger>
        </TabsList>

        <TabsContent value="zapstore">
          <ZapstoreTab />
        </TabsContent>

        <TabsContent value="google">
          <GooglePlayTab />
        </TabsContent>

        <TabsContent value="apple">
          <AppleTab />
        </TabsContent>
      </Tabs>

      {/* Footer note */}
      <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/10">
        <CardContent className="py-4">
          <p className="text-sm text-center text-muted-foreground">
            💡 <strong>Tip:</strong> Start with <strong>Zapstore</strong> first — it's the fastest, requires no fees, and aligns perfectly with the BitPopArt Nostr community. Then proceed to Google Play and Apple.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
