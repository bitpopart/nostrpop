import { useState, useEffect, useMemo, useRef } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Box, Upload } from 'lucide-react';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useArtworks } from '@/hooks/useArtworks';
import { GalleryUploadDialog } from '@/components/art/GalleryUploadDialog';
import type { ArtworkData } from '@/lib/artTypes';

const BASE = import.meta.env.BASE_URL ?? '/';
const base = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
const GALLERY_SRC = base + '/gallery-src/index.html';

function buildGalleryData(artworks: ArtworkData[] | undefined): Record<string, unknown> {
  const data: Record<string, unknown> = {
    _walls: { n: '#f97316', s: '#ffffff', w: '#fff7ed', e: '#fff7ed' },
    _props: { s: [{ t: 'POP!', c: '#f97316' }], cube: { c: '#f7931a' } },
  };
  if (!artworks || artworks.length === 0) return data;
  for (let i = 0; i < 36; i++) {
    const artwork = artworks[i];
    if (!artwork) break;
    const img = artwork.images?.[0];
    if (!img) continue;
    data[String(i)] = { img, t: artwork.title || '' };
  }
  return data;
}

export default function Gallery() {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editArtwork, setEditArtwork] = useState<ArtworkData | null>(null);
  const isAdmin = useIsAdmin();
  const { data: artworks } = useArtworks('all');
  const galleryData = useMemo(() => buildGalleryData(artworks), [artworks]);

  // Keep the latest artworks in a ref so the iframe message handler never goes stale.
  const artworksRef = useRef(artworks);
  useEffect(() => {
    artworksRef.current = artworks;
  }, [artworks]);

  // When the admin clicks an artwork inside the 3D gallery, the iframe posts a
  // message with the slot index. Open the upload popup in edit mode for it
  // (or in add mode if that frame is empty).
  useEffect(() => {
    if (!isAdmin) return;
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { type?: string; slot?: number } | null;
      if (!d || d.type !== 'bitpop-gallery-art' || typeof d.slot !== 'number') return;
      const art = artworksRef.current?.[d.slot] ?? null;
      setEditArtwork(art);
      setUploadOpen(true);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [isAdmin]);

  const closeUpload = (open: boolean) => {
    setUploadOpen(open);
    if (!open) setEditArtwork(null);
  };

  useSeoMeta({
    title: 'POP WORLD Virtual Gallery -- BitPopArt',
    description: 'Walk through the POP WORLD virtual gallery with 21 wall frames and 15 floor tiles.',
    ogTitle: 'POP WORLD Virtual Gallery -- BitPopArt',
    ogImage: 'https://bitpopart.com/bitpopart-logo.png',
    ogUrl: 'https://bitpopart.com/gallery',
    twitterCard: 'summary_large_image',
    robots: 'index, follow',
  });

  useEffect(() => {
    fetch(GALLERY_SRC).then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(setHtml).catch(() => setError(true));
  }, []);

  const galleryHtml = useMemo(() => {
    if (!html) return null;
    let result = html;
    const dataJson = JSON.stringify(galleryData);
    result = result.replace(
      /<script type="application\/json" id="galleryData">[\s\S]*?<\/script>/,
      '<script type="application/json" id="galleryData">' + dataJson + '<\/script>'
    );
    // The built-in iframe ADMIN button/panel is removed for EVERYONE (admin
    // included). Artwork is added/edited through the React upload popup instead.
    // Keep the ADMIN button locked, the panel hidden and the inputs disabled so
    // no admin UI is reachable or visible inside the 3D gallery.
    result = result.replace(
      '</body>',
      '<script>(function(){var b=document.getElementById("adminBtn");if(b){b.classList.add("adminLocked");b.style.display="none";}var p=document.getElementById("admin");if(p){p.style.display="none";p.style.pointerEvents="none";}var f=document.getElementById("fileIn");if(f){f.disabled=true;}var j=document.getElementById("jsonIn");if(j){j.disabled=true;}})();<\/script></body>'
    );
    return result;
  }, [html, galleryData]);

  if (!galleryHtml && !error) {
    return (
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#1a0040 0%,#0f172a 100%)',gap:20}}>
        <style>{'@keyframes gshimmer{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}'}</style>
        <div style={{padding:20,borderRadius:20,background:'rgba(249,115,22,.15)',border:'1px solid rgba(249,115,22,.3)'}}>
          <Box style={{width:48,height:48,color:'#f97316'}} />
        </div>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:'Bangers,Impact,sans-serif',fontSize:'2.5rem',letterSpacing:6,color:'#f97316',lineHeight:1}}>POP WORLD</div>
          <div style={{color:'rgba(255,255,255,.6)',fontSize:'.9rem',marginTop:6}}>Loading virtual gallery...</div>
        </div>
        <div style={{width:180,height:4,borderRadius:9999,background:'rgba(255,255,255,.1)',overflow:'hidden',position:'relative'}}>
          <div style={{position:'absolute',top:0,bottom:0,width:'45%',borderRadius:9999,background:'linear-gradient(90deg,#f97316,#ec4899)',animation:'gshimmer 1.4s ease-in-out infinite'}} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',background:'#0f172a'}}>
        <div style={{textAlign:'center',color:'#f97316'}}>
          <Box style={{width:40,height:40,margin:'0 auto 12px'}} />
          <p style={{fontFamily:'Bangers,Impact,sans-serif',fontSize:'1.5rem',letterSpacing:3}}>POP WORLD</p>
          <p style={{color:'rgba(255,255,255,.5)',fontSize:'.85rem',marginTop:6}}>Could not load gallery.</p>
          <button onClick={() => {setError(false);fetch(GALLERY_SRC).then((r) => r.text()).then(setHtml).catch(() => setError(true))}} style={{marginTop:16,padding:'8px 20px',borderRadius:9999,background:'#f97316',color:'#fff',border:'none',cursor:'pointer',fontWeight:700}}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{flex:1,position:'relative',minHeight:0,display:'flex'}}>
      <iframe srcDoc={galleryHtml!} title="POP WORLD Virtual Gallery" style={{flex:1,width:'100%',height:'100%',border:'none',display:'block',minHeight:0}} sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-fullscreen" />
      {isAdmin && (
        <>
          <button
            onClick={() => { setEditArtwork(null); setUploadOpen(true); }}
            title="Upload a new artwork to the gallery (admin only)"
            className="admin-addart-btn"
            style={{
              position:'absolute',top:12,left:12,zIndex:20,
              display:'inline-flex',alignItems:'center',gap:7,
              padding:'9px 18px',border:'none',borderRadius:9999,cursor:'pointer',
              background:'linear-gradient(135deg,#f97316,#ec4899)',
              color:'#fff',fontFamily:"'Righteous',Impact,sans-serif",
              fontSize:14,letterSpacing:2,fontWeight:400,
              boxShadow:'0 4px 14px rgba(249,115,22,.45)',
              transition:'transform .15s ease, box-shadow .15s ease',
            }}
          >
            <Upload style={{width:16,height:16}} strokeWidth={3} />
            UPLOAD
          </button>
          <style>{'.admin-addart-btn:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(236,72,153,.5)!important}.admin-addart-btn:active{transform:translateY(0)}'}</style>
          <GalleryUploadDialog open={uploadOpen} onOpenChange={closeUpload} editArtwork={editArtwork} />
        </>
      )}
    </div>
  );
}