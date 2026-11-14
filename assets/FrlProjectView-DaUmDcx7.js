import{r as f,j as o}from"./vendor-react-Boa4e_cT.js";import{d as P,n as A}from"./vendor-nostr-nrnx7nPQ.js";import{a as E}from"./vendor-query--2w0ie8x.js";import{J as L,A as h,B as S,a2 as U}from"./index-Du9pxmSX.js";import{r as D,w as H,g as v,l as I}from"./siteHtml-sDZ2D92c.js";import{d as R,a as B}from"./vendor-router-D0mOqrMg.js";const F="npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz",O=A.decode(F).data;function q(e){const l=`<script id="__frl_bridge__">
(function(){
  var FILE_RE = /\\.(pdf|zip|docx?|xlsx?|pptx?|mp4|mp3|png|jpe?g|gif|svg|webp|exe|dmg|apk)(\\?|$)/i;
  document.addEventListener('click', function(e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!href || href === '#') return;
    var hasDownload = a.hasAttribute('download');
    if (hasDownload || FILE_RE.test(href)) {
      e.preventDefault(); e.stopImmediatePropagation();
      window.parent.postMessage({
        type: '__download__',
        url: href,
        filename: a.getAttribute('download') || href.split('/').pop() || 'download'
      }, '*');
      return;
    }
    if (/^https?:\\/\\//i.test(href)) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      return;
    }
    e.preventDefault(); e.stopImmediatePropagation();
    window.parent.postMessage({ type: '__navigate__', path: href }, '*');
  }, true);
})();
<\/script>`;return e.includes("</head>")?e.replace("</head>",l+"</head>"):e.includes("<body")?e.replace("<body",l+"<body"):l+e}function T(){var g,b;const{projectId:e}=R(),l=B(),{nostr:j}=P(),{data:a,isLoading:_}=E({queryKey:["frl-project",e],queryFn:async t=>{if(!e)return null;const r=AbortSignal.any([t.signal,AbortSignal.timeout(5e3)]);return(await j.query([{kinds:[36171],authors:[O],"#d":[e],"#t":["bitpopart-project"],limit:1}],{signal:r}))[0]??null},enabled:!!e}),s=e?D("frl",e):void 0,i=((g=a==null?void 0:a.tags.find(t=>t[0]==="brand-site"))==null?void 0:g[1])??(s==null?void 0:s.brandSiteUrl),d=((b=a==null?void 0:a.tags.find(t=>t[0]==="name"))==null?void 0:b[1])??(s==null?void 0:s.name)??"Project",p=(()=>{if(!a)return(s==null?void 0:s.description)??"";try{return JSON.parse(a.content).description||""}catch{return""}})();f.useEffect(()=>{var r;if(!a||!e)return;const t=(r=a.tags.find(n=>n[0]==="brand-site"))==null?void 0:r[1];t&&H("frl",e,{brandSiteUrl:t,name:d,description:p})},[a,e,d,p]);const[u,w]=f.useState(()=>i?v(i):null),[y,m]=f.useState(!1);return f.useEffect(()=>{if(!i)return;let t=!0;const r=v(i);if(r){w(r);return}return m(!0),I(i).then(n=>{t&&(w(n),m(!1))}).catch(()=>{t&&m(!1)}),()=>{t=!1}},[i]),f.useEffect(()=>{const t=async r=>{if(r.data){if(r.data.type==="__navigate__"){const n=r.data.path;n&&l(n);return}if(r.data.type==="__download__"){const{url:n,filename:k}=r.data;try{const N=await(await fetch(n)).blob(),x=URL.createObjectURL(N),c=document.createElement("a");c.href=x,c.download=k||n.split("/").pop()||"download",document.body.appendChild(c),c.click(),document.body.removeChild(c),setTimeout(()=>URL.revokeObjectURL(x),1e4)}catch{window.open(n,"_blank")}}}};return window.addEventListener("message",t),()=>window.removeEventListener("message",t)},[l]),L({title:a||s?`${d} - POPArt.frl`:"POPArt.frl Project",description:p}),!u&&(_||y)?o.jsx("div",{className:"flex-1 overflow-auto bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20",children:o.jsxs("div",{className:"container mx-auto px-4 py-12",children:[o.jsx(h,{className:"h-8 w-32 mb-6"}),o.jsx(h,{className:"h-[60vh] w-full rounded-xl"})]})}):i?o.jsx("div",{className:"flex-1 flex flex-col w-full",style:{minHeight:0},children:u?o.jsx("iframe",{srcDoc:q(u),title:d,className:"w-full flex-1 border-0",sandbox:"allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"}):o.jsx("iframe",{src:i,title:d,className:"w-full flex-1 border-0",sandbox:"allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"})}):o.jsx("div",{className:"flex-1 overflow-auto bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 flex items-center justify-center",children:o.jsxs("div",{className:"text-center space-y-4",children:[o.jsx("p",{className:"text-muted-foreground",children:"Project not found."}),o.jsxs(S,{variant:"outline",onClick:()=>l("/frl"),children:[o.jsx(U,{className:"h-4 w-4 mr-2"})," Back to POPArt.frl"]})]})})}export{T as default};
