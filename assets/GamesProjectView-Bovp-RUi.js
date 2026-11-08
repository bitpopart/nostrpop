import{r as a,j as s}from"./vendor-react-Boa4e_cT.js";import{d as U,n as B}from"./vendor-nostr-nrnx7nPQ.js";import{a as q}from"./vendor-query--2w0ie8x.js";import{J as D}from"./index-smpiMv3t.js";import{J as T,G as C}from"./GameMechanismOverlay-DfAP4X1B.js";import{d as F,a as K}from"./vendor-router-D0mOqrMg.js";import"./useGameJackpot-CLCcygDz.js";import"./timer-Z4p7P9zZ.js";const J="npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz",z=B.decode(J).data,l=new Map;function Q(n){const i=`<script>
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
<\/script>`;return/<head[^>]*>/i.test(n)?n.replace(/<head([^>]*)>/i,`<head$1>${i}`):/<body[^>]*>/i.test(n)?n.replace(/<body([^>]*)>/i,`<body$1>${i}`):i+n}function ae(){var _,E;const{projectId:n}=F(),i=K(),{nostr:G}=U(),w=a.useRef(null),[M,m]=a.useState(0),[A,y]=a.useState(!1),[H,x]=a.useState(""),[I,h]=a.useState(""),[O,b]=a.useState(0),[N,k]=a.useState(0),{data:o,isLoading:$}=q({queryKey:["games-project",n],queryFn:async e=>{if(!n)return null;const g=AbortSignal.any([e.signal,AbortSignal.timeout(5e3)]);return(await G.query([{kinds:[36171],authors:[z],"#d":[n],"#t":["bitpopart-project"],limit:1}],{signal:g}))[0]??null},enabled:!!n}),r=(_=o==null?void 0:o.tags.find(e=>e[0]==="brand-site"))==null?void 0:_[1],c=((E=o==null?void 0:o.tags.find(e=>e[0]==="name"))==null?void 0:E[1])??"Game",v=n??"unknown-game",[d,p]=a.useState(()=>r?l.get(r)??null:null),[L,u]=a.useState(!1),[f,j]=a.useState(""),S=a.useRef(null);a.useEffect(()=>{if(r){if(l.has(r)){p(l.get(r));return}S.current!==r&&(S.current=r,u(!0),j(""),fetch(r).then(e=>{if(!e.ok)throw new Error(`HTTP ${e.status}`);return e.text()}).then(e=>{if(e.trim().length===0)throw new Error("Empty response");l.set(r,e),p(e),u(!1)}).catch(e=>{console.error("Game HTML fetch failed:",e),p(null),j("The game file could not be loaded from its host."),u(!1)}))}},[r]);const P=d?Q(d):null;a.useEffect(()=>{const e=g=>{const t=g.data;!t||typeof t!="object"||(t.type==="score_update"&&typeof t.score=="number"&&m(t.score),t.type==="game_over"&&typeof t.score=="number"&&(m(t.score),x(typeof t.playerName=="string"?t.playerName:""),h(typeof t.playerNpub=="string"?t.playerNpub:""),b(typeof t.satsPaid=="number"?t.satsPaid:0),y(!0)))};return window.addEventListener("message",e),()=>window.removeEventListener("message",e)},[]);const R=a.useCallback(()=>{m(0),y(!1),x(""),h(""),b(0),k(e=>e+1)},[]);return D({title:o?`${c} — BitPopArt Games`:"BitPopArt Games"}),$||L&&!d?s.jsx("div",{className:"flex-1 flex items-center justify-center bg-white",children:s.jsxs("div",{className:"text-center space-y-2",children:[s.jsx("div",{className:"animate-bounce text-5xl",children:"🎮"}),s.jsx("p",{className:"font-bold text-xl text-violet-600",style:{letterSpacing:"2px"},children:"LOADING…"})]})}):!o||!r||f?s.jsx("div",{className:"flex-1 flex items-center justify-center",children:s.jsxs("div",{className:"text-center space-y-4",children:[s.jsx("p",{className:"text-muted-foreground",children:f||"Game not found."}),f&&s.jsxs("p",{className:"text-xs text-muted-foreground",children:["The game published from ",r," isn't reachable right now."]}),s.jsx("button",{className:"text-sm underline text-orange-600",onClick:()=>i("/games"),children:"← Back to Games"})]})}):s.jsxs("div",{className:"flex-1 flex flex-col w-full",style:{minHeight:0},children:[s.jsx(T,{game:v}),s.jsxs("div",{className:"relative flex-1 flex flex-col",style:{minHeight:0},children:[P?s.jsx("iframe",{ref:w,srcDoc:P,title:c,className:"w-full flex-1 border-0",sandbox:"allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"},`srcdoc-${N}`):s.jsx("iframe",{ref:w,src:r,title:c,className:"w-full flex-1 border-0",sandbox:"allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"},`src-${N}`),s.jsx(C,{gameId:v,gameName:c,onPlayAgain:R,score:M,isGameOver:A,playerName:H,playerNpub:I,satsPaid:O})]})]})}export{ae as default};
