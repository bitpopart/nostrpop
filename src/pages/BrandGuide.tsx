import BrandGuideContent from './BrandGuideContent';

export default function BrandGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-950/10 via-background to-orange-950/5">
      <div className="container mx-auto px-4 py-12 max-w-3xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <img
            src="/bitpopart-logo.svg"
            alt="BitPopArt"
            className="h-16 w-auto"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <h1 className="text-3xl font-black tracking-tight">Brand Guide</h1>
            <p className="text-muted-foreground text-sm mt-1">
              BitPopArt · Bitcoin Pop Art · Complete UI/UX &amp; Visual Identity Kit
            </p>
          </div>
        </div>

        <BrandGuideContent />

      </div>
    </div>
  );
}
