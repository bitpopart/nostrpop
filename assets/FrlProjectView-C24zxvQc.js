import{r as d,j as a}from"./vendor-react-Boa4e_cT.js";import{d as N,n as P}from"./vendor-nostr-nrnx7nPQ.js";import{a as A}from"./vendor-query--2w0ie8x.js";import{J as E,A as b,B as L,a2 as R}from"./index-DmCJDHKR.js";import{d as U,a as S}from"./vendor-router-D0mOqrMg.js";const D="npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz",I=P.decode(D).data,c=new Map;function B(r){const o=`<script id="__frl_bridge__">
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
<\/script>`;return r.includes("</head>")?r.replace("</head>",o+"</head>"):r.includes("<body")?r.replace("<body",o+"<body"):o+r}function z(){var w,h;const{projectId:r}=U(),o=S(),{nostr:v}=N(),{data:n,isLoading:_}=A({queryKey:["frl-project",r],queryFn:async e=>{if(!r)return null;const s=AbortSignal.any([e.signal,AbortSignal.timeout(5e3)]);return(await v.query([{kinds:[36171],authors:[I],"#d":[r],"#t":["bitpopart-project"],limit:1}],{signal:s}))[0]??null},enabled:!!r}),t=(w=n==null?void 0:n.tags.find(e=>e[0]==="brand-site"))==null?void 0:w[1],u=((h=n==null?void 0:n.tags.find(e=>e[0]==="name"))==null?void 0:h[1])??"Project",[p,m]=d.useState(()=>t?c.get(t)??null:null),[j,f]=d.useState(!1),g=d.useRef(null);return d.useEffect(()=>{if(t){if(c.has(t)){m(c.get(t));return}g.current!==t&&(g.current=t,f(!0),fetch(t).then(e=>e.text()).then(e=>{c.set(t,e),m(e),f(!1)}).catch(()=>f(!1)))}},[t]),d.useEffect(()=>{const e=async s=>{if(s.data){if(s.data.type==="__navigate__"){const l=s.data.path;l&&o(l);return}if(s.data.type==="__download__"){const{url:l,filename:y}=s.data;try{const k=await(await fetch(l)).blob(),x=URL.createObjectURL(k),i=document.createElement("a");i.href=x,i.download=y||l.split("/").pop()||"download",document.body.appendChild(i),i.click(),document.body.removeChild(i),setTimeout(()=>URL.revokeObjectURL(x),1e4)}catch{window.open(l,"_blank")}}}};return window.addEventListener("message",e),()=>window.removeEventListener("message",e)},[o]),E({title:n?`${u} - POPArt.frl`:"POPArt.frl Project",description:n?(()=>{try{return JSON.parse(n.content).description||""}catch{return""}})():""}),_||j&&!p?a.jsx("div",{className:"flex-1 overflow-auto bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20",children:a.jsxs("div",{className:"container mx-auto px-4 py-12",children:[a.jsx(b,{className:"h-8 w-32 mb-6"}),a.jsx(b,{className:"h-[60vh] w-full rounded-xl"})]})}):!n||!t?a.jsx("div",{className:"flex-1 overflow-auto bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 flex items-center justify-center",children:a.jsxs("div",{className:"text-center space-y-4",children:[a.jsx("p",{className:"text-muted-foreground",children:"Project not found."}),a.jsxs(L,{variant:"outline",onClick:()=>o("/frl"),children:[a.jsx(R,{className:"h-4 w-4 mr-2"})," Back to POPArt.frl"]})]})}):a.jsx("div",{className:"flex-1 flex flex-col w-full",style:{minHeight:0},children:p?a.jsx("iframe",{srcDoc:B(p),title:u,className:"w-full flex-1 border-0",sandbox:"allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"}):a.jsx("iframe",{src:t,title:u,className:"w-full flex-1 border-0",sandbox:"allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"})})}export{z as default};
