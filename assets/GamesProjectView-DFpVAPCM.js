import{r,j as a}from"./vendor-react-Boa4e_cT.js";import{r as D,w as R,g as H,l as F}from"./siteHtml-sDZ2D92c.js";import{d as K,n as C}from"./vendor-nostr-nrnx7nPQ.js";import{a as J}from"./vendor-query--2w0ie8x.js";import{J as T}from"./index-E1PBQc3d.js";import{J as z,G as Q}from"./GameMechanismOverlay-RCTQJUwy.js";import{d as V,a as Y}from"./vendor-router-D0mOqrMg.js";import"./useGameJackpot-BpQLgaJN.js";import"./timer-Cz5khzBX.js";const W="npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz",X=C.decode(W).data;function Z(s){const c=`<script>
(function(){
  var _score = 0;
  window.gamestr = {
    scoreUpdate: function(s) {
      _score = s;
      window.parent.postMessage({ type: 'score_update', score: s }, '*');
    },
    /**
     * Call when the game ends.
     * @param {number} score  - final score
     * @param {string} [name] - player name (from game's own UI)
     * @param {string} [npub] - player npub (from game's own UI)
     * @param {number} [sats] - sats paid (0 = free play)
     */
    gameOver: function(s, name, npub, sats) {
      _score = (s !== undefined ? s : _score);
      window.parent.postMessage({
        type: 'game_over',
        score: _score,
        playerName: name || '',
        playerNpub: npub || '',
        satsPaid: sats || 0
      }, '*');
    },
    gameStart: function() {
      window.parent.postMessage({ type: 'game_start' }, '*');
    },
    ready: function() {
      window.parent.postMessage({ type: 'ready' }, '*');
    }
  };
  // Listen for commands from parent
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'gamestr_command') {
      var cmd = e.data.command;
      if (cmd === 'reset' && typeof window.gamestrOnReset === 'function') window.gamestrOnReset();
      if (cmd === 'start' && typeof window.gamestrOnStart === 'function') window.gamestrOnStart();
    }
  });
})();
<\/script>`;return/<head[^>]*>/i.test(s)?s.replace(/<head([^>]*)>/i,`<head$1>${c}`):/<body[^>]*>/i.test(s)?s.replace(/<body([^>]*)>/i,`<body$1>${c}`):c+s}function ce(){var _,G;const{projectId:s}=V(),c=Y(),{nostr:A}=K(),w=r.useRef(null),[I,d]=r.useState(0),[M,x]=r.useState(!1),[O,b]=r.useState(""),[U,h]=r.useState(""),[k,v]=r.useState(0),[N,L]=r.useState(0),{data:n,isLoading:$}=J({queryKey:["games-project",s],queryFn:async t=>{if(!s)return null;const l=AbortSignal.any([t.signal,AbortSignal.timeout(5e3)]);return(await A.query([{kinds:[36171],authors:[X],"#d":[s],"#t":["bitpopart-project"],limit:1}],{signal:l}))[0]??null},enabled:!!s}),i=s?D("games",s):void 0,o=((_=n==null?void 0:n.tags.find(t=>t[0]==="brand-site"))==null?void 0:_[1])??(i==null?void 0:i.brandSiteUrl),m=((G=n==null?void 0:n.tags.find(t=>t[0]==="name"))==null?void 0:G[1])??(i==null?void 0:i.name)??"Game";r.useEffect(()=>{var e,E;if(!n||!s)return;const t=(e=n.tags.find(y=>y[0]==="brand-site"))==null?void 0:e[1],l=(E=n.tags.find(y=>y[0]==="name"))==null?void 0:E[1];t&&R("games",s,{brandSiteUrl:t,name:l})},[n,s]);const j=s??"unknown-game",[f,p]=r.useState(()=>o?H(o):null),[B,u]=r.useState(!1),[g,S]=r.useState("");r.useEffect(()=>{if(!o)return;let t=!0;const l=H(o);if(l){p(l);return}return u(!0),S(""),F(o).then(e=>{t&&(p(e),u(!1))}).catch(e=>{console.error("Game HTML fetch failed:",e),t&&(p(null),S("The game file could not be loaded from its host."),u(!1))}),()=>{t=!1}},[o]);const P=f?Z(f):null;r.useEffect(()=>{const t=l=>{const e=l.data;!e||typeof e!="object"||(e.type==="score_update"&&typeof e.score=="number"&&d(e.score),e.type==="game_over"&&typeof e.score=="number"&&(d(e.score),b(typeof e.playerName=="string"?e.playerName:""),h(typeof e.playerNpub=="string"?e.playerNpub:""),v(typeof e.satsPaid=="number"?e.satsPaid:0),x(!0)))};return window.addEventListener("message",t),()=>window.removeEventListener("message",t)},[]);const q=r.useCallback(()=>{d(0),x(!1),b(""),h(""),v(0),L(t=>t+1)},[]);return T({title:n||i?`${m} — BitPopArt Games`:"BitPopArt Games"}),!f&&($||B)?a.jsx("div",{className:"flex-1 flex items-center justify-center bg-white",children:a.jsxs("div",{className:"text-center space-y-2",children:[a.jsx("div",{className:"animate-bounce text-5xl",children:"🎮"}),a.jsx("p",{className:"font-bold text-xl text-violet-600",style:{letterSpacing:"2px"},children:"LOADING…"})]})}):!o||g||!n&&!i?a.jsx("div",{className:"flex-1 flex items-center justify-center",children:a.jsxs("div",{className:"text-center space-y-4",children:[a.jsx("p",{className:"text-muted-foreground",children:g||"Game not found."}),g&&a.jsxs("p",{className:"text-xs text-muted-foreground",children:["The game published from ",o," isn't reachable right now."]}),a.jsx("button",{className:"text-sm underline text-orange-600",onClick:()=>c("/games"),children:"← Back to Games"})]})}):a.jsxs("div",{className:"flex-1 flex flex-col w-full",style:{minHeight:0},children:[a.jsx(z,{game:j}),a.jsxs("div",{className:"relative flex-1 flex flex-col",style:{minHeight:0},children:[P?a.jsx("iframe",{ref:w,srcDoc:P,title:m,className:"w-full flex-1 border-0",sandbox:"allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"},`srcdoc-${N}`):a.jsx("iframe",{ref:w,src:o,title:m,className:"w-full flex-1 border-0",sandbox:"allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"},`src-${N}`),a.jsx(Q,{gameId:j,gameName:m,onPlayAgain:q,score:I,isGameOver:M,playerName:O,playerNpub:U,satsPaid:k})]})]})}export{ce as default};
