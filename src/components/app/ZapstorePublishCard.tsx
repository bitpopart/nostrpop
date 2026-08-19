import { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Rocket,
  Package,
  Upload,
  Loader2,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Send,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { useZapstorePublish, type ZapstoreAppConfig } from '@/hooks/useZapstorePublish';
import { extractApkCertFingerprint } from '@/lib/apkCertExtractor';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const PACKAGE_NAME = 'com.bitpopart.fanapp';
const APP_ICON_URL = 'https://bitpopart.com/app-icon-512.png';

interface PublishResult {
  url: string;
  sha256: string;
  certFingerprint: string;
  assetEventId: string;
  releaseEventId: string;
}

// ─── App Metadata (kind 32267) ───────────────────────────────

function AppMetadataCard() {
  const { user } = useCurrentUser();
  const { publishApp } = useZapstorePublish();
  const [config, setConfig] = useState<ZapstoreAppConfig>({
    packageName: PACKAGE_NAME,
    name: 'BitPopArt Fan App',
    summary: 'Free Bitcoin pop art for fans — wallpapers, GIFs, animations, avatars, merch & more',
    description:
      'The BitPopArt fan community app — free wallpapers, GIFs, animations, avatars, merch and more!\n\n' +
      'Bitcoin pop art for fans worldwide.\nNo login, no KYC, no barriers.',
    icon: APP_ICON_URL,
    images: [],
    tags: ['art', 'bitcoin', 'pop-art', 'entertainment', 'social', 'nostr', 'fan-app'],
    license: 'MIT',
    repository: 'https://github.com/bitpopart/nostrpop',
    website: 'https://bitpopart.com/app',
    supportedNips: ['01', '07', '57', '99'],
    platforms: ['android-arm64-v8a', 'android-armeabi-v7a', 'android-x86', 'android-x86_64'],
  });
  const [tagsText, setTagsText] = useState(config.tags.join(', '));

  const update = <K extends keyof ZapstoreAppConfig>(key: K, value: ZapstoreAppConfig[K]) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  const doPublish = () => {
    void publishApp.mutateAsync({
      ...config,
      tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-5 w-5 text-yellow-600" />
          1 · App Metadata (kind 32267)
        </CardTitle>
        <CardDescription>
          Creates the app entry in the Zapstore catalog. Publish this once before (or together with) your first APK release.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="zs-name">App name</Label>
            <Input id="zs-name" value={config.name} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zs-identifier">Identifier</Label>
            <Input id="zs-identifier" value={config.packageName} onChange={(e) => update('packageName', e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="zs-summary">Short summary</Label>
          <Input id="zs-summary" value={config.summary} onChange={(e) => update('summary', e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="zs-desc">Description</Label>
          <Textarea id="zs-desc" rows={4} value={config.description} onChange={(e) => update('description', e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="zs-icon">Icon URL</Label>
            <Input id="zs-icon" value={config.icon} onChange={(e) => update('icon', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zs-tags">Tags (comma separated)</Label>
            <Input id="zs-tags" value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground">
            Repository: <code className="bg-muted px-1 rounded">{config.repository}</code> · License: {config.license}
          </p>
          <Button onClick={doPublish} disabled={!user || publishApp.isPending} className="gap-2">
            {publishApp.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {publishApp.isPending ? 'Publishing…' : 'Publish App Metadata'}
          </Button>
        </div>

        {!user && (
          <p className="text-xs text-yellow-700 dark:text-yellow-500">
            You must be logged in with the admin account (the one that signs your admin saves) to publish.
          </p>
        )}

        {publishApp.isSuccess && (
          <Alert className="border-green-300 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200 text-sm space-y-1">
              <p><strong>App metadata published!</strong></p>
              <p className="font-mono text-xs break-all">event {publishApp.data?.id}</p>
            </AlertDescription>
          </Alert>
        )}

        {publishApp.isError && (
          <Alert className="border-red-300 bg-red-50 dark:bg-red-950/20">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200 text-sm break-all">
              {publishApp.error?.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// ─── APK Release (kinds 3063 + 30063) ────────────────────────

function ApkReleaseCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useCurrentUser();
  const { publishApkRelease } = useZapstorePublish();

  const [file, setFile] = useState<File | null>(null);
  const [cert, setCert] = useState<{ fingerprint: string; source: 'v1' | 'v2' } | null>(null);
  const [certLoading, setCertLoading] = useState(false);
  const [version, setVersion] = useState('1.0.0');
  const [versionCode, setVersionCode] = useState('1');
  const [channel, setChannel] = useState('main');
  const [releaseNotes, setReleaseNotes] = useState('Initial release of the BitPopArt Fan App — free Bitcoin pop art for fans.');
  const [stage, setStage] = useState('');
  const [pct, setPct] = useState(0);
  const [result, setResult] = useState<PublishResult | null>(null);
  const [copied, setCopied] = useState<'url' | 'sha' | 'cert' | null>(null);

  const pickFile = () => fileInputRef.current?.click();

  const onFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
    setCert(null);
    setResult(null);
    setStage('');
    setPct(0);
    if (!f) return;
    e.target.value = '';
    // Try to parse version from filename, e.g. "app-1.2.3-release.apk"
    const m = f.name.match(/[_\-v](\d+\.\d+(?:\.\d+)?)/i);
    if (m) setVersion(m[1]);
    setCertLoading(true);
    extractApkCertFingerprint(f)
      .then((r) => setCert(r))
      .catch(() => setCert(null)) // user can still try; relay will reject with a hint
      .finally(() => setCertLoading(false));
  };

  const doPublish = () => {
    if (!file) return;
    setResult(null);
    publishApkRelease.mutate(
      {
        file,
        asset: {
          packageName: PACKAGE_NAME,
          version,
          versionCode,
          mimeType: 'application/vnd.android.package-archive',
          platform: 'android-arm64-v8a',
          apkCertHash: cert?.fingerprint ?? '',
        },
        release: {
          packageName: PACKAGE_NAME,
          version,
          channel,
          releaseNotes,
        },
        onProgress: (s, p) => {
          setStage(s);
          if (p !== undefined) setPct(p);
        },
      },
      {
        onSuccess: (r) => setResult(r),
      },
    );
  };

  const copy = async (kind: 'url' | 'sha' | 'cert', value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card className="border-green-200 dark:border-green-800">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Rocket className="h-5 w-5 text-green-600" />
          2 · Publish APK Release (kinds 3063 + 30063)
        </CardTitle>
        <CardDescription>
          Pick your signed APK. This uploads it to the Blossom CDN (if not already there), extracts the signing
          certificate, and publishes the asset + release events to relay.zapstore.dev — one click.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".apk,application/vnd.android.package-archive"
          className="hidden"
          onChange={onFileChosen}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" className="gap-2" onClick={pickFile}>
            <Upload className="h-4 w-4" /> Choose signed APK
          </Button>
          <span className="text-sm text-muted-foreground truncate max-w-xs">
            {file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)` : 'No APK selected'}
          </span>
          {cert && (
            <Badge variant="outline" className="gap-1 text-green-700 border-green-300 dark:text-green-400 dark:border-green-700">
              <KeyRound className="h-3 w-3" /> Cert v{cert.source === 'v2' ? '2/3' : '1'} extracted
            </Badge>
          )}
          {certLoading && (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Reading cert…
            </Badge>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="zs-version">Version</Label>
            <Input id="zs-version" value={version} onChange={(e) => setVersion(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zs-versioncode">Version code</Label>
            <Input id="zs-versioncode" value={versionCode} onChange={(e) => setVersionCode(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zs-channel">Channel</Label>
            <Input id="zs-channel" value={channel} onChange={(e) => setChannel(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="zs-notes">Release notes</Label>
          <Textarea id="zs-notes" rows={2} value={releaseNotes} onChange={(e) => setReleaseNotes(e.target.value)} />
        </div>

        {stage && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{stage}</span>
              {pct > 0 && <span>{pct}%</span>}
            </div>
            {pct > 0 && (
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground">
            Publishes to <code className="bg-muted px-1 rounded">wss://relay.zapstore.dev</code> · package{' '}
            <code className="bg-muted px-1 rounded">{PACKAGE_NAME}</code>
          </p>
          <Button
            onClick={doPublish}
            disabled={!file || !user || publishApkRelease.isPending}
            className="gap-2"
          >
            {publishApkRelease.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            {publishApkRelease.isPending ? 'Publishing…' : 'Publish to Zapstore'}
          </Button>
        </div>

        {!user && (
          <p className="text-xs text-yellow-700 dark:text-yellow-500">
            You must be logged in with the admin account to publish.
          </p>
        )}

        {result && (
          <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Published to Zapstore!
              </span>
              <a
                href={`https://zapstore.dev/apps/${PACKAGE_NAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-orange-600 hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> View listing
              </a>
            </div>
            <div className="grid gap-2 text-xs sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all bg-muted px-2 py-1 rounded">asset …{result.assetEventId.slice(-10)}</code>
                <Button size="sm" variant="outline" className="h-6 gap-1" onClick={() => copy('sha', result.sha256)}>
                  {copied === 'sha' ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  SHA
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all bg-muted px-2 py-1 rounded">release …{result.releaseEventId.slice(-10)}</code>
                <Button size="sm" variant="outline" className="h-6 gap-1" onClick={() => copy('cert', result.certFingerprint)}>
                  {copied === 'cert' ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  Cert
                </Button>
              </div>
            </div>
          </div>
        )}

        {publishApkRelease.isError && (
          <Alert className="border-red-300 bg-red-50 dark:bg-red-950/20">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200 text-sm break-all whitespace-pre-wrap">
              {publishApkRelease.error?.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
          <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-800 dark:text-blue-200">
            The relay requires the <strong>APK signing certificate hash</strong> for Android apps — this card extracts it
            from your APK automatically. APK hash is immutable: never rebuild/re-upload the same version with a different
            keystore, or the update will be rejected.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ZapstorePublishCard() {
  return (
    <div className="space-y-6">
      <AppMetadataCard />
      <ApkReleaseCard />
    </div>
  );
}
