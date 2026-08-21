// Shared embedding helpers for the read-only BitPopArt magazine.
//
// The magazine is a self-contained HTML document (POP MAGAZINE) loaded into a
// sandboxed <iframe> via srcDoc. Inside that document sits an in-place visual
// editor ("✎ EDIT" button + edit bar with drag/resize/move + contenteditable).
// Nobody — owner included — should be able to edit the live magazine; it is
// updated only by uploading a new version at /magazine.
//
// This module ships a site-layer NEUTRALIZER: it hides/removes the editor UI and
// forces editing off no matter which published version of the HTML is live. It
// is injected at embed time (so the site controls the document string), and is
// shared by both the /magazine page and the in-app reader.

export const MAGAZINE_SLUG = 'magazine';

// Shared cache for fetched magazine HTML across renders/navigation.
export const magazineHtmlCache = new Map<string, string>();

const HTML_FILE_RE = /\.html?(\?|$)/i;

/** Does the URL point at a Blossom/remote HTML document we can inline? */
export function isRemoteHtmlUrl(url?: string | null): boolean {
  return !!url && HTML_FILE_RE.test(url);
}

/** Rewrites download/file links in raw HTML so they never navigate the iframe away. */
export function injectDownloadScript(html: string): string {
  const FILE_RE = /\.(pdf|zip|docx?|xlsx?|pptx?|mp4|mp3|png|jpe?g|gif|svg|webp|exe|dmg|apk)(\?|$)/i;
  const rewritten = html.replace(
    /<a\s([^>]*)>/gi,
    (match: string, attrs: string) => {
      const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
      if (!hrefMatch) return match;
      const href = hrefMatch[1];
      const hasDownload = /\bdownload\b/i.test(attrs);
      if (!hasDownload && !FILE_RE.test(href)) return match;
      const newAttrs = attrs
        .replace(/href=["'][^"']*["']/i, `href="#"`)
        .replace(/\btarget=["'][^"']*["']/i, '');
      return `<a ${newAttrs} data-dl="${href}">`;
    }
  );

  const script = `<script>
document.addEventListener('click',function(e){
  var a=e.target&&e.target.closest?e.target.closest('[data-dl]'):null;
  if(!a)return;
  e.preventDefault();e.stopImmediatePropagation();
  window.parent.postMessage({type:'__download__',url:a.getAttribute('data-dl'),filename:a.getAttribute('download')||a.getAttribute('data-dl').split('/').pop()||'download'},'*');
},true);
</script>`;

  if (rewritten.includes('</head>')) return rewritten.replace('</head>', script + '</head>');
  if (rewritten.includes('<body')) return rewritten.replace('<body', script + '<body');
  return script + rewritten;
}

/**
 * Site-layer magazine editor neutralizer.
 *
 * Injects CSS + JS that (1) hide/remove the ✎ EDIT button and editor bar,
 * (2) force the editing class off the stage, (3) strip contenteditable, and
 * (4) no-op the toggle function — so nothing in the document can be edited and
 * no editor UI can surface, regardless of which magazine version is live.
 */
export function injectMagazineReadOnly(html: string): string {
  const guard = `<style>
/* BitPopArt read-only magazine layer — remove editor UI */
.edit-btn{display:none !important}
#editBtn{display:none !important}
.edit-bar{display:none !important}
#editBar{display:none !important}
[contenteditable]{pointer-events:none !important; -webkit-user-select:none; user-select:none;}
</style>
<script>
(function(){
  function neutralize(){
    var i;
    var killers=['.edit-btn','#editBtn','.edit-bar','#editBar','.editBar','.editing-btn'];
    for(i=0;i<killers.length;i++){var e=document.querySelector(killers[i]);if(e)try{e.remove()}catch(_){}}
    var st=document.getElementById('stage');
    if(st)try{st.classList.remove('editing')}catch(_){}
    var c=document.querySelectorAll('[contenteditable]');
    for(i=0;i<c.length;i++){try{var el=c[i];el.removeAttribute('contenteditable');el.contentEditable='false';}catch(_){}}
    try{window.toggleEdit=function(){};}catch(_){}
    try{window.toggleEditor=function(){};}catch(_){}
  }
  try{neutralize();setTimeout(neutralize,800);}catch(_){}
})();
</script>`;

  // Fall back to a safe split point if the usual tags are absent.
  if (html.includes('</body>')) return html.replace('</body>', guard + '</body>');
  if (html.includes('</head>')) return html.replace('</head>', guard + '</head>');
  if (html.includes('<body')) return html.replace('<body', guard + '<body');
  return guard + html;
}

/** Fetches remote HTML (e.g. the magazine from Blossom) with caching + timeout. */
export async function fetchRemoteHtml(url: string): Promise<string | null> {
  const hit = magazineHtmlCache.get(url);
  if (hit !== undefined) return hit;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const text = await res.text();
    magazineHtmlCache.set(url, text);
    return text;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
/** Clear all in-memory fetched magazine HTML so a freshly published version is re-fetched. */
export function purgeMagazineCache() {
  magazineHtmlCache.clear();
}

