import{c as P,u as U,b as D,a5 as x}from"./index-BqSgIXs0.js";import{a as L,u as E,b as C}from"./vendor-query--2w0ie8x.js";import{d as M}from"./vendor-nostr-nrnx7nPQ.js";import"./vendor-react-Boa4e_cT.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const K=P("Truck",[["path",{d:"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",key:"wrbu53"}],["path",{d:"M15 18H9",key:"1lyqi6"}],["path",{d:"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",key:"lysw3i"}],["circle",{cx:"17",cy:"18",r:"2",key:"332jqn"}],["circle",{cx:"7",cy:"18",r:"2",key:"19iecd"}]]),q="nostrpop_orders";function h(){try{const e=localStorage.getItem(q);return e?JSON.parse(e):[]}catch{return[]}}function O(e){localStorage.setItem(q,JSON.stringify(e))}function $(e){const i=h(),t=i.findIndex(n=>n.id===e.id);t>=0?i[t]=e:i.unshift(e),O(i)}function Q(){const{nostr:e}=M(),{user:i}=U(),t=x();return L({queryKey:["shop-orders"],queryFn:async n=>{var d,c,u,a,m,k,w;const o=h();if(i&&t)try{const b=AbortSignal.any([n.signal,AbortSignal.timeout(8e3)]),f=await e.query([{kinds:[4],"#p":[t],limit:200},{kinds:[16],"#p":[t],limit:200}],{signal:b});for(const r of f)try{const T=await((d=i.signer.nip44)==null?void 0:d.decrypt(r.pubkey,r.content))??await((c=i.signer.nip04)==null?void 0:c.decrypt(r.pubkey,r.content));if(!T)continue;const p=JSON.parse(T);if(r.kind===16){if(((u=r.tags.find(([s])=>s==="type"))==null?void 0:u[1])!=="1")continue;const g=`gamma-${r.id}`;if(o.find(s=>s.id===g))continue;const y=((a=r.tags.find(([s])=>s==="order"))==null?void 0:a[1])||r.id,_=Number(((m=r.tags.find(([s])=>s==="amount"))==null?void 0:m[1])||0),l=r.tags.filter(([s])=>s==="item"),I=(k=r.tags.find(([s])=>s==="address"))==null?void 0:k[1],A=(w=r.tags.find(([s])=>s==="email"))==null?void 0:w[1],v={id:g,order_number:`GAMMA-${y.slice(0,8).toUpperCase()}`,status:"pending",items:l.map(([,s,N])=>({product_id:s||"",product_name:s||"",quantity:Number(N)||1,price:0,currency:"SAT",type:"physical"})),total_price:_,currency:"SAT",buyer_email:A,buyer_npub:r.pubkey,shipping_address:I?{line1:I,city:"",postal_code:"",country:""}:void 0,notes:typeof p.notes=="string"?p.notes:void 0,source:"nip15",payment_method:"Lightning (Gamma)",created_at:new Date(r.created_at*1e3).toISOString(),updated_at:new Date(r.created_at*1e3).toISOString()};$(v),o.unshift(v)}else if(r.kind===4){if(p.type!==0)continue;const S=`nip15-${r.id}`;if(o.find(l=>l.id===S))continue;const g=p.items??[],y=p.contact,_={id:S,order_number:`NIP15-${r.id.slice(0,8).toUpperCase()}`,status:"pending",items:g.map(l=>({product_id:l.product_id,product_name:l.product_id,quantity:l.quantity,price:0,currency:"SAT",type:"physical"})),total_price:0,currency:"SAT",buyer_name:p.name,buyer_email:y==null?void 0:y.email,buyer_npub:y==null?void 0:y.nostr,shipping_address:p.address?{line1:p.address,city:"",postal_code:"",country:""}:void 0,notes:p.message,source:"nip15",payment_method:"Lightning",created_at:new Date(r.created_at*1e3).toISOString(),updated_at:new Date(r.created_at*1e3).toISOString()};$(_),o.unshift(_)}}catch{}}catch{}return o.sort((b,f)=>new Date(f.created_at).getTime()-new Date(b.created_at).getTime())},enabled:!0,staleTime:3e4,refetchInterval:6e4})}function J(){const{toast:e}=D(),i=E();return C({mutationFn:async({orderId:t,status:n,trackingNumber:o,notes:d})=>{const c=h(),u=c.findIndex(m=>m.id===t);if(u<0)throw new Error("Order not found");const a=new Date().toISOString();return c[u]={...c[u],status:n,updated_at:a,...n==="shipped"?{shipped_at:a}:{},...o!==void 0?{tracking_number:o}:{},...d!==void 0?{notes:d}:{}},O(c),c[u]},onSuccess:t=>{const n={pending:"Pending",paid:"Paid",processing:"Processing",shipped:"Shipped",completed:"Completed",cancelled:"Cancelled"};e({title:"Order Updated",description:`Order ${t.order_number} marked as ${n[t.status]}.`}),i.invalidateQueries({queryKey:["shop-orders"]})},onError:t=>{console.error("Failed to update order:",t),e({title:"Update Failed",description:"Could not update the order. Please try again.",variant:"destructive"})}})}function G(){const{toast:e}=D(),i=E();return C({mutationFn:async({orderId:t})=>{const o=h().filter(d=>d.id!==t);return O(o),t},onSuccess:()=>{e({title:"Order Deleted",description:"The order has been removed."}),i.invalidateQueries({queryKey:["shop-orders"]})},onError:()=>{e({title:"Delete Failed",description:"Could not delete order.",variant:"destructive"})}})}function R(e){try{const i=e.items.some(a=>a.type==="physical"),t=e.items.map(a=>`  • ${a.product_name}  ×${a.quantity}  ${a.price} ${a.currency}`).join(`
`),n=e.shipping_address,o=i&&n?`
SHIP TO:
${n.line1}${n.line2?`
`+n.line2:""}
${n.city}${n.state?", "+n.state:""} ${n.postal_code}
${n.country}
`:"",d=e.tracking_number?`
Tracking: ${e.tracking_number}`:"",c=`NEW ORDER — BitPopArt
${"─".repeat(40)}
Order Number : ${e.order_number}
Date         : ${new Date(e.created_at).toLocaleString()}
Status       : ${e.status.toUpperCase()}

ITEMS:
${t}

TOTAL        : ${e.total_price} ${e.currency}
Payment      : ${e.payment_method??"Lightning Network ⚡"}

BUYER:
Name  : ${e.buyer_name??"—"}
Email : ${e.buyer_email??"—"}
`+o+d+`
${"─".repeat(40)}
View in orders dashboard: /orders
shop@bitpopart.com · bitpopart.com`,u=`NEW ORDER ${e.order_number} — BitPopArt`;window.open(`mailto:shop@bitpopart.com?subject=${encodeURIComponent(u)}&body=${encodeURIComponent(c)}`,"_blank")}catch{}}function V(e){const i=`checkout-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,t=new Date().toISOString(),n=e.items??[{product_id:e.productId,product_name:e.productName,quantity:1,price:e.price,currency:e.currency,type:e.productType,image:e.productImage}],o={id:i,order_number:`ORD-${Date.now().toString(36).toUpperCase()}`,status:"paid",items:n,total_price:e.price,currency:e.currency,buyer_name:e.buyerName,buyer_email:e.buyerEmail,shipping_address:e.shippingAddress,payment_method:e.paymentMethod??"Lightning",source:"checkout",source_page:e.sourcePage??"other",created_at:t,updated_at:t};return $(o),e.skipEmail||R(o),o}export{K as T,J as a,G as b,V as c,h as g,Q as u};
