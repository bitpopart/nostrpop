import{c as l,J as s,K as y,u as g,b3 as b,b4 as d,ae as o}from"./index-DNd-_MMY.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=l("Megaphone",[["path",{d:"m3 11 18-5v12L3 14v-3z",key:"n962bs"}],["path",{d:"M11.6 16.8a3 3 0 1 1-5.8-1.6",key:"1yl0tm"}]]),u="com.bitpopart.art-banner";function p(){const{nostr:e}=s(),n=o();return y({queryKey:["art-banner",n],queryFn:async a=>{const r=AbortSignal.any([a.signal,AbortSignal.timeout(5e3)]),t=await e.query([{kinds:[30078],authors:[n],"#d":[u],limit:1}],{signal:r});if(t.length===0)return null;try{return JSON.parse(t[0].content)}catch{return null}},enabled:!!n,staleTime:6e4})}function f(){const{nostr:e}=s(),{user:n}=g(),a=b(),r=o();return d({mutationFn:async t=>{if(!n)throw new Error("Must be logged in");const i={kind:30078,content:JSON.stringify(t),tags:[["d",u],["t","art-banner"]],created_at:Math.floor(Date.now()/1e3)},c=await n.signer.signEvent(i);return await e.event(c,{signal:AbortSignal.timeout(5e3)}),t},onSuccess:t=>{a.setQueryData(["art-banner",r],t)}})}export{h as M,f as a,p as u};
