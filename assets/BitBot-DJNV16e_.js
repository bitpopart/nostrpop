import{j as t}from"./vendor-react-Boa4e_cT.js";import{J as n}from"./index-BqSgIXs0.js";import{u as d}from"./useJustBData-DRxxjjsh.js";import"./vendor-query--2w0ie8x.js";import"./vendor-nostr-nrnx7nPQ.js";import"./vendor-router-D0mOqrMg.js";import"./justb-DLEbVhQu.js";function w(){var o,s;const{data:r}=d(),e=r==null?void 0:r.bitbot;if(n({title:"BitBot — Pocket Bot | BitPopArt",description:"BitBot: a pocket bot built by hand, one at a time, with Nostr and Lightning built in, a zap lamp and a face that answers back. In progress — not available to buy yet.",ogTitle:"BitBot — Pocket Bot | BitPopArt",ogDescription:"A pocket bot we build by hand. Nostr and Lightning built in, zap lamp, camera display — and it talks back. In progress, born soon.",ogImage:"https://bitpopart.com/bitbot/logo.webp"}),!e)return null;const p=e.birth?(()=>{const[i,a,b]=e.birth.split("-"),l=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];return`${Number(b)} ${l[Number(a)-1]} ${i}`})():"TO BE ANNOUNCED";return t.jsxs("div",{className:"bitbot-page",children:[t.jsx("link",{rel:"stylesheet",href:"https://fonts.googleapis.com/css2?family=Bangers&display=swap"}),t.jsx("style",{children:`
        .bitbot-page{background:#0e0a17;font-family:'Inter Variable','Inter',system-ui,sans-serif}
        .bitbot-sec{background-image:radial-gradient(circle,rgba(0,0,0,.12) 1.5px,transparent 1.5px);background-color:#dc4b33;background-size:16px 16px,auto;color:#fff;border-top:5px solid #000;border-bottom:5px solid #000;padding:56px 20px 64px}
        .bitbot-wrap{max-width:1060px;margin:0 auto}
        .bitbot-sec h2{font-family:'Bangers','Impact',cursive;font-size:clamp(40px,7vw,64px);letter-spacing:2px;line-height:.95;color:#fff;text-shadow:4px 4px 0 #000;margin:10px 0 6px;text-align:center}
        .bitbot-logo{max-width:320px;width:66%;margin:0 auto 6px;display:block;border-radius:10px}
        .bbver{font-weight:700;font-size:12px;letter-spacing:.24em;color:#ffd166;text-align:center;margin-bottom:10px}
        .bbtag{display:inline-block;margin:0 auto 18px;border:2px solid #ffe08a;border-radius:999px;padding:5px 16px;font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#ffe08a}
        .bblead{text-align:center;max-width:680px;margin:0 auto 26px;font-size:17px;color:#ffe7df;line-height:1.55}
        .bblead b{color:#ffd166}
        .bbbirth{text-align:center;border:4px solid #000;border-radius:16px;background-image:radial-gradient(circle,rgba(0,0,0,.10) 1.5px,transparent 1.5px);background-color:#fce000;color:#0A0A0A;box-shadow:10px 10px 0 #000;padding:26px 22px;max-width:720px;margin:0 auto 30px}
        .bbbirth .bblabel{font-weight:800;font-size:13px;letter-spacing:.3em;color:#c2001f}
        .bbbirth .bbdate{font-family:'Bangers','Impact',cursive;font-size:clamp(38px,7vw,62px);line-height:.95;letter-spacing:2px;margin-top:6px}
        .bbbirth .bbstatus{display:inline-block;margin-top:14px;background:#0A0A0A;color:#ffe08a;font-weight:800;font-size:13px;letter-spacing:.22em;padding:7px 18px;border-radius:6px}
        .bbbirth p{max-width:560px;margin:14px auto 0;font-size:14.5px;color:#2a2a2a;line-height:1.5}
        .bbrow{display:grid;grid-template-columns:1fr;gap:28px;align-items:center}
        @media(min-width:820px){.bbrow{grid-template-columns:1fr 1.15fr}}
        .bbshots{display:flex;gap:14px;align-items:flex-end;justify-content:center}
        .bbshots img{width:46%;max-width:210px;height:auto;border-radius:8px}
        .bbshots img.lead{width:54%;max-width:250px}
        .bbfeat{list-style:none;display:grid;grid-template-columns:1fr;gap:0;padding:0;margin:0}
        @media(min-width:560px){.bbfeat{grid-template-columns:1fr 1fr;gap:0 22px}}
        .bbfeat li{position:relative;padding:9px 0 9px 30px;font-size:15px;border-top:2px solid rgba(255,255,255,.18);color:#fff}
        .bbfeat li:before{content:'';position:absolute;left:0;top:15px;width:13px;height:13px;border-radius:3px;background-color:#ffd166;border:2px solid #000}
        .bbfree{margin-top:30px;border:4px solid #000;border-radius:14px;background-color:#fce000;color:#0A0A0A;box-shadow:8px 8px 0 #000;padding:20px 22px;display:grid;grid-template-columns:1fr;gap:16px;align-items:center}
        @media(min-width:760px){.bbfree{grid-template-columns:auto 1fr}}
        .bbfree .big3{font-family:'Bangers','Impact',cursive;font-size:clamp(30px,6vw,46px);letter-spacing:2px;line-height:.95;text-align:center}
        .bbfree .big3 em{font-style:normal;color:#c2001f;display:block}
        .bbfree p{font-size:15.5px}
        .bbfree p + p{margin-top:8px}
        .bbfree b{color:#c2001f}
        .bbcta{margin-top:28px;text-align:center}
        .bbcta .btn{display:inline-block;background:#fce000;color:#0A0A0A;font-weight:800;font-size:18px;letter-spacing:.06em;padding:15px 32px;border:3px solid #000;border-radius:8px;box-shadow:6px 6px 0 #000;text-decoration:none;text-transform:uppercase}
        .bbcta p{margin-top:12px;font-weight:700;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.65)}
        .bbupdates{background-color:#262033;padding:56px 20px 72px;border-bottom:5px solid #000}
        .bbupdates h2{font-family:'Bangers','Impact',cursive;font-size:clamp(32px,6vw,54px);letter-spacing:2px;line-height:1.02;color:#ffd166;text-shadow:3px 3px 0 #000;margin:0 0 24px;text-align:center}
        .bbupdates .bbupdates-img{display:block;max-width:360px;width:100%;margin:0 auto}
      `}),t.jsx("section",{className:"bitbot-sec",children:t.jsxs("div",{className:"bitbot-wrap",children:[t.jsx("img",{className:"bitbot-logo",src:"/bitbot/logo.webp",alt:"BitBot"}),t.jsx("div",{className:"bbver",children:e.version}),t.jsx("div",{className:"bbtag",children:e.tagline}),t.jsx("p",{className:"bblead",dangerouslySetInnerHTML:{__html:e.lead}}),t.jsxs("div",{className:"bbbirth",id:"birth",children:[t.jsx("div",{className:"bblabel",children:"BIRTH"}),t.jsx("div",{className:"bbdate",children:p}),t.jsx("div",{className:"bbstatus",children:e.status}),!e.available&&t.jsx("p",{children:e.availability})]}),t.jsxs("div",{className:"bbrow",children:[t.jsxs("div",{className:"bbshots",children:[t.jsx("img",{className:"lead",src:"/bitbot/shot-lead.webp",alt:"BitBot, three-quarter view"}),t.jsx("img",{src:"/bitbot/shot-front.webp",alt:"BitBot, front view with camera and display"})]}),t.jsx("ul",{className:"bbfeat",children:e.features.map((i,a)=>t.jsx("li",{children:i},a))})]}),t.jsxs("div",{className:"bbfree",children:[t.jsxs("div",{className:"big3",children:[e.buyTitle,t.jsx("em",{children:e.buySub})]}),t.jsx("div",{children:e.buyLines.map((i,a)=>t.jsx("p",{dangerouslySetInnerHTML:{__html:i}},a))})]}),t.jsxs("div",{className:"bbcta",children:[e.available&&((o=e.cta)!=null&&o.url)?t.jsx("a",{className:"btn",href:e.cta.url,children:((s=e.cta)==null?void 0:s.label)??"GET A BITBOT"}):t.jsxs("a",{className:"btn",href:"#birth",children:[e.status," — NOT FOR SALE YET"]}),t.jsx("p",{children:e.specNote})]})]})}),t.jsx("section",{className:"bbupdates",children:t.jsxs("div",{className:"bitbot-wrap",children:[t.jsx("h2",{children:"Regular Firmware BitBot Ai Updates."}),t.jsx("img",{className:"bbupdates-img",src:"/bitbot/ai-updates.png",alt:"BitBot Ai updates"})]})})]})}export{w as default};
