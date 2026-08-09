import { useState, useEffect, useMemo } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Box } from 'lucide-react';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useArtworks } from '@/hooks/useArtworks';
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
  const isAdmin = useIsAdmin();
  const { data: artworks } = useArtworks('all');
  const galleryData = useMemo(() => buildGalleryData(artworks), [artworks]);

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
    if (isAdmin) {
      result = result.replace(
        '</body>',
        '<script>(function(){var b=document.getElementById("adminBtn");if(b){b.style.display="inline-block";b.style.visibility="visible";b.style.pointerEvents="auto";b.style.position="static";b.style.left="auto";}})();<\/script></body>'
      );
    }
    return result;
  }, [html, galleryData, isAdmin]);

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

  return <iframe srcDoc={galleryHtml!} title="POP WORLD Virtual Gallery" style={{flex:1,width:'100%',height:'100%',border:'none',display:'block',minHeight:0}} sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-fullscreen" />;
}