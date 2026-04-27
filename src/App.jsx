// Checkout App.jsx — updated price IDs + reads ?count= URL param to pre-select bundle
import React, { useState, useEffect } from "react";

const PRICE_IDS = {
  1:  "price_1TQdhBDWURdmEJUGAu0beHL1",
  3:  "price_1TQU18DWURdmEJUGP9ZkYvUa",
  6:  "price_1TQU1ODWURdmEJUGQMAlvUHa",
  12: "price_1TQU1ZDWURdmEJUGm2Hfiemn",
};
const PRICES = { 1:97, 3:297, 6:597, 12:1297 };

const B = {
  navy:"#0A1628", midBlue:"#2B5C8A", lightBlue:"#4A90D9",
  skyBlue:"#E8F4FD", ice:"#F0F6FC", white:"#FFFFFF",
  glass:"rgba(255,255,255,0.72)", glassBorder:"rgba(74,144,217,0.18)",
  shadow:"0 8px 32px rgba(10,22,40,0.08)", shadowHover:"0 12px 40px rgba(10,22,40,0.14)",
  text:"#0D1B2A", textMuted:"#5A7080", textLight:"#8899AA", green:"#1B7A3D",
};
const F = "'Montserrat', sans-serif";

const AGENTS = [
  { id:1,  name:"Sage",        title:"the Strategist",         icon:"◈" },
  { id:2,  name:"Petunia",     title:"the Copywriter",         icon:"✦" },
  { id:3,  name:"Ivy",         title:"the Business Developer", icon:"◉" },
  { id:4,  name:"Basil",       title:"the Producer",           icon:"⬡" },
  { id:5,  name:"Clover",      title:"the Moneymaker",         icon:"⬟" },
  { id:6,  name:"Olive",       title:"the Closer",             icon:"⬢" },
  { id:7,  name:"Juniper",     title:"the Analytical",         icon:"◬" },
  { id:8,  name:"Flora",       title:"the Publisher",          icon:"◈" },
  { id:9,  name:"Laurel",      title:"the Generator",          icon:"✦" },
  { id:10, name:"Orchid",      title:"the Searcher",           icon:"◉" },
  { id:11, name:"Jasmine",     title:"the Administrator",      icon:"⬡" },
  { id:12, name:"The Crystal", title:"All Twelve. One Mind.",  icon:"∞" },
];

const BUNDLES = [
  { count:1,  badge:null,           cta:"Get 1 Fragment" },
  { count:3,  badge:null,           cta:"Get 3 Fragments" },
  { count:6,  badge:"Most Popular", cta:"Get 6 Fragments" },
  { count:12, badge:"Full Crystal", cta:"Get the Fragments" },
];

function GlassCard({ children, style }) {
  return <div style={{ background:B.glass, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:`1px solid ${B.glassBorder}`, borderRadius:16, boxShadow:B.shadow, ...style }}>{children}</div>;
}
function SectionLabel({ children }) {
  return <div style={{ fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:B.textLight, fontFamily:F, marginBottom:14 }}>{children}</div>;
}

function AgentSelectCard({ agent, selected, disabled, onToggle }) {
  const [hov, setHov] = useState(false);
  const active = selected.includes(agent.id);
  return (
    <div onClick={() => !disabled && onToggle(agent.id)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ border:`1.5px solid ${active?B.lightBlue:hov&&!disabled?B.lightBlue:B.glassBorder}`, borderRadius:12, padding:"14px 16px", cursor:disabled&&!active?"not-allowed":"pointer", background:active?`${B.lightBlue}09`:disabled?B.ice:B.white, transition:"all 0.18s", boxShadow:active?`0 0 0 3px ${B.lightBlue}18`:"none", opacity:disabled&&!active?0.4:1, display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ width:18, height:18, borderRadius:4, flexShrink:0, border:`2px solid ${active?B.lightBlue:B.glassBorder}`, background:active?B.lightBlue:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
        {active && <span style={{ color:"#fff", fontSize:11, fontWeight:800, lineHeight:1 }}>✓</span>}
      </div>
      <div style={{ width:30, height:30, borderRadius:7, background:B.skyBlue, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:B.lightBlue, flexShrink:0 }}>{agent.icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:active?B.navy:B.text, fontFamily:F }}>{agent.name}</div>
        <div style={{ fontSize:10, color:B.textLight, fontFamily:F, marginTop:1 }}>{agent.title}</div>
      </div>
    </div>
  );
}

function BundlePicker({ activeCount, onSelect }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
      {BUNDLES.map(b => {
        const active = activeCount === b.count;
        return (
          <div key={b.count} onClick={() => onSelect(b.count)}
            style={{ border:`1.5px solid ${active?B.lightBlue:B.glassBorder}`, borderRadius:10, padding:"12px 10px", cursor:"pointer", textAlign:"center", background:active?`${B.lightBlue}09`:B.white, boxShadow:active?`0 0 0 3px ${B.lightBlue}18`:"none", transition:"all 0.18s", position:"relative" }}>
            {b.badge && <div style={{ position:"absolute", top:-9, left:"50%", transform:"translateX(-50%)", fontSize:8, fontWeight:800, letterSpacing:"1px", textTransform:"uppercase", padding:"2px 10px", borderRadius:20, background:active?B.navy:B.lightBlue, color:"#fff", fontFamily:F, whiteSpace:"nowrap" }}>{b.badge}</div>}
            <div style={{ fontSize:20, fontWeight:900, color:active?B.lightBlue:B.navy, fontFamily:F, letterSpacing:"-0.5px" }}>${PRICES[b.count].toLocaleString()}</div>
            <div style={{ fontSize:10, fontWeight:700, color:B.textLight, fontFamily:F, marginTop:3 }}>{b.count} Fragment{b.count>1?"s":""}</div>
          </div>
        );
      })}
    </div>
  );
}

function OrderSummary({ selectedAgents, bundleCount, onCheckout, loading }) {
  const price = PRICES[bundleCount] || 0;
  const ready = selectedAgents.length === bundleCount;
  return (
    <GlassCard style={{ padding:28, fontFamily:F }}>
      <SectionLabel>Order Summary</SectionLabel>
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20, paddingBottom:20, borderBottom:`1px solid ${B.glassBorder}` }}>
        <div style={{ width:48, height:48, borderRadius:12, flexShrink:0, background:`linear-gradient(135deg,${B.navy} 0%,${B.midBlue} 100%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>💎</div>
        <div>
          <div style={{ fontSize:15, fontWeight:800, color:B.navy, fontFamily:F }}>The Crystal</div>
          <div style={{ fontSize:11, color:B.textMuted, fontFamily:F, marginTop:2 }}>{bundleCount} Fragment{bundleCount>1?"s":""}</div>
        </div>
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:B.textLight, fontFamily:F, marginBottom:8 }}>Agents selected ({selectedAgents.length}/{bundleCount})</div>
        {selectedAgents.length === 0 ? (
          <div style={{ fontSize:12, color:B.textLight, fontFamily:F, fontStyle:"italic" }}>None selected yet</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {selectedAgents.map(id => { const a=AGENTS.find(x=>x.id===id); return a?(<div key={id} style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:6,height:6,borderRadius:"50%",background:B.lightBlue,flexShrink:0 }}/><span style={{ fontSize:12,fontWeight:600,color:B.navy,fontFamily:F }}>{a.name}</span><span style={{ fontSize:10,color:B.textLight,fontFamily:F }}>{a.title}</span></div>):null; })}
          </div>
        )}
      </div>
      <div style={{ borderTop:`1px solid ${B.glassBorder}`, paddingTop:14, marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:11, color:B.textLight, fontFamily:F }}>One-time payment</div>
          {bundleCount>1 && <div style={{ fontSize:11, color:B.green, fontFamily:F, fontWeight:600 }}>${Math.round(price/bundleCount)}/fragment</div>}
        </div>
        <div style={{ fontSize:28, fontWeight:900, color:B.navy, fontFamily:F, letterSpacing:"-1px" }}>${price.toLocaleString()}</div>
      </div>
      <div style={{ background:B.skyBlue, borderRadius:10, padding:"12px 14px", marginBottom:20 }}>
        <div style={{ fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"#2B5C8A", fontFamily:F, marginBottom:8 }}>What you receive</div>
        {[`${bundleCount} unique Fragment code${bundleCount>1?"s":""} — one per agent`,"Codes sent to your email instantly","Enter each code on The Crystal to activate that agent","Codes never expire — lifetime access"].map(t=>(
          <div key={t} style={{ display:"flex", gap:8, marginBottom:5 }}><span style={{ fontSize:11, color:B.lightBlue, flexShrink:0 }}>✦</span><span style={{ fontSize:11, color:"#2B5C8A", fontFamily:F, lineHeight:1.5 }}>{t}</span></div>
        ))}
      </div>
      {!ready && <div style={{ background:B.ice, border:`1px solid ${B.glassBorder}`, borderRadius:8, padding:"10px 14px", marginBottom:14, textAlign:"center" }}><div style={{ fontSize:12, color:B.textMuted, fontFamily:F }}>Select {bundleCount-selectedAgents.length} more agent{bundleCount-selectedAgents.length!==1?"s":""} to continue</div></div>}
      <button onClick={onCheckout} disabled={loading||!ready}
        style={{ width:"100%", padding:"15px 0", background:!ready||loading?B.textLight:`linear-gradient(135deg,${B.navy} 0%,${B.midBlue} 100%)`, color:"#fff", border:"none", borderRadius:10, fontSize:15, fontWeight:800, fontFamily:F, cursor:!ready||loading?"default":"pointer", boxShadow:!ready||loading?"none":"0 6px 24px rgba(10,22,40,0.3)", transition:"all 0.2s" }}>
        {loading?"Redirecting to Stripe...":ready?`Unlock ${bundleCount} Agent${bundleCount>1?"s":""} →`:`Select ${bundleCount-selectedAgents.length} More`}
      </button>
      <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:6 }}>
        {["One-time · No subscription ever","Secured by Stripe · PCI compliant","30-day money-back guarantee"].map(t=>(
          <div key={t} style={{ display:"flex", alignItems:"center", gap:7 }}><span style={{ fontSize:11, color:B.green }}>✓</span><span style={{ fontSize:11, color:B.textLight, fontFamily:F }}>{t}</span></div>
        ))}
      </div>
    </GlassCard>
  );
}

function FAQItem({ q, a, last }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom:last?"none":`1px solid ${B.glassBorder}`, paddingBottom:last?0:16, marginBottom:last?0:16 }}>
      <button onClick={() => setOpen(o=>!o)} style={{ width:"100%", background:"none", border:"none", padding:0, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, textAlign:"left" }}>
        <span style={{ fontSize:14, fontWeight:600, color:B.navy, fontFamily:F, lineHeight:1.5 }}>{q}</span>
        <span style={{ fontSize:20, color:B.lightBlue, flexShrink:0, transition:"transform 0.2s", transform:open?"rotate(45deg)":"none", fontWeight:300, lineHeight:1 }}>+</span>
      </button>
      {open && <div style={{ marginTop:10, fontSize:13, color:B.textMuted, fontFamily:F, lineHeight:1.7 }}>{a}</div>}
    </div>
  );
}

export default function App() {
  // Read ?count= from URL to pre-select a bundle (used by tier cards on Crystal vault)
  const urlCount = parseInt(new URLSearchParams(window.location.search).get("count") || "0");
  const validCounts = [1, 3, 6, 12];
  const initialCount = validCounts.includes(urlCount) ? urlCount : 6;

  const [bundleCount, setBundleCount]       = useState(initialCount);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState(null);

  const handleBundleSelect = (count) => { setBundleCount(count); setSelectedAgents([]); };
  const toggleAgent = (id) => {
    setSelectedAgents(prev => {
      if (prev.includes(id)) return prev.filter(x=>x!==id);
      if (prev.length >= bundleCount) return prev;
      return [...prev, id];
    });
  };

  const handleCheckout = async () => {
    if (selectedAgents.length !== bundleCount) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          fragmentCount: bundleCount,
          agentIds: selectedAgents,
          successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: window.location.href,
        }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else throw new Error(data.error || "Failed to create session");
    } catch (e) { setError(e.message); setLoading(false); }
  };

  return (
    <div style={{ fontFamily:F, minHeight:"100vh", background:`linear-gradient(165deg,${B.white} 0%,${B.ice} 40%,${B.skyBlue} 100%)`, color:B.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap'); *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;} html,body{background:#F0F6FC;font-family:'Montserrat',sans-serif;} button{transition:all 0.18s;} button:hover:not(:disabled){opacity:0.9;} @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} .fadein{animation:fadeUp 0.55s ease forwards} @media(max-width:820px){.grid{grid-template-columns:1fr!important}.h1{font-size:26px!important}.agent-grid{grid-template-columns:1fr!important}}`}</style>
      <div style={{ position:"fixed",top:"-10%",right:"-5%",width:480,height:480,borderRadius:"50%",background:"radial-gradient(circle,rgba(74,144,217,0.07) 0%,transparent 70%)",pointerEvents:"none",zIndex:0 }}/>

      <header style={{ position:"sticky",top:0,zIndex:100,background:B.glass,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:`1px solid ${B.glassBorder}`,padding:"13px 32px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:36,height:36,borderRadius:9,background:`linear-gradient(135deg,${B.navy} 0%,${B.midBlue} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>💎</div>
          <div>
            <div style={{ fontSize:14,fontWeight:800,color:B.navy,letterSpacing:"1px",fontFamily:F }}>THE CRYSTAL</div>
            <div style={{ fontSize:9,color:B.textLight,letterSpacing:"2.5px",textTransform:"uppercase",fontFamily:F }}>AI Agent Vault · Prëmo Inc.</div>
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:7 }}>
          <div style={{ width:7,height:7,borderRadius:"50%",background:B.green }}/>
          <span style={{ fontSize:10,color:B.textLight,fontFamily:F }}>Secured by Stripe</span>
        </div>
      </header>

      <div style={{ position:"relative",zIndex:1,maxWidth:1060,margin:"0 auto",padding:"52px 24px 80px" }}>
        <div className="fadein" style={{ textAlign:"center",marginBottom:48 }}>
          <div style={{ fontSize:9,fontWeight:700,letterSpacing:"3px",textTransform:"uppercase",color:B.lightBlue,fontFamily:F,marginBottom:10 }}>One-time · Lifetime Access · No Subscription</div>
          <h1 className="h1" style={{ fontSize:40,fontWeight:900,color:B.navy,letterSpacing:"-1px",lineHeight:1.1,marginBottom:16,maxWidth:640,margin:"0 auto 16px",fontFamily:F }}>Acquire Your Fragments</h1>
          <p style={{ fontSize:16,color:B.textMuted,lineHeight:1.75,maxWidth:500,margin:"0 auto",fontFamily:F,fontWeight:500 }}>Each Fragment unlocks one AI agent. Choose how many, pick which agents. One unique code per agent, delivered instantly to your email.</p>
        </div>

        <div className="grid" style={{ display:"grid",gridTemplateColumns:"1fr 360px",gap:32,alignItems:"start" }}>
          <div style={{ display:"flex",flexDirection:"column",gap:24 }}>
            <GlassCard style={{ padding:28 }}>
              <SectionLabel>Step 1 — How many fragments?</SectionLabel>
              <BundlePicker activeCount={bundleCount} onSelect={handleBundleSelect}/>
              <div style={{ marginTop:14,fontSize:12,color:B.textMuted,fontFamily:F,lineHeight:1.6 }}>Each fragment = one AI agent permanently unlocked in your vault.</div>
            </GlassCard>
            <GlassCard style={{ padding:28 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:14 }}>
                <SectionLabel style={{ marginBottom:0 }}>Step 2 — Which agents?</SectionLabel>
                <div style={{ fontSize:12,fontWeight:700,color:selectedAgents.length===bundleCount?B.green:B.lightBlue,fontFamily:F }}>{selectedAgents.length} / {bundleCount} selected</div>
              </div>
              <div style={{ fontSize:12,color:B.textMuted,fontFamily:F,marginBottom:16,lineHeight:1.6 }}>Select {bundleCount} agent{bundleCount>1?"s":""}. One unique Fragment code per agent, sent to your email.</div>
              <div className="agent-grid" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                {AGENTS.map(a=><AgentSelectCard key={a.id} agent={a} selected={selectedAgents} disabled={selectedAgents.length>=bundleCount&&!selectedAgents.includes(a.id)} onToggle={toggleAgent}/>)}
              </div>
            </GlassCard>
            <GlassCard style={{ padding:28 }}>
              <SectionLabel>How It Works</SectionLabel>
              <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
                {[["1","Choose fragments & agents","Select your bundle and pick which agents to unlock."],["2","Pay once via Stripe","Secure one-time payment. No subscription. No recurring charge."],["3","Receive your codes","One CRYSTAL-XXXX-XXXX code per agent, sent instantly to your email."],["4","Activate on The Crystal","Enter each code to unlock and talk to that agent."],["5","Come back for more","Buy more fragments anytime. They accumulate under your profile."]].map(([n,title,desc])=>(
                  <div key={n} style={{ display:"flex",gap:14,alignItems:"flex-start" }}>
                    <div style={{ width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${B.navy} 0%,${B.midBlue} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",fontFamily:F,flexShrink:0 }}>{n}</div>
                    <div>
                      <div style={{ fontSize:13,fontWeight:700,color:B.navy,fontFamily:F,marginBottom:2 }}>{title}</div>
                      <div style={{ fontSize:12,color:B.textMuted,fontFamily:F,lineHeight:1.6 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
            <GlassCard style={{ padding:28 }}>
              <SectionLabel>Common Questions</SectionLabel>
              {[["Is this really a one-time payment?","Yes. One payment, lifetime access. No subscription, no renewal, no expiry. Ever."],["What is a Fragment code?","A code in the format CRYSTAL-XXXX-XXXX. Each is unique and linked to one specific agent under your account."],["Can I buy more fragments later?","Yes. Come back anytime. All fragments accumulate under your profile on The Crystal."],["What if I lose my codes?","Your codes are permanently linked to your email. Log into The Crystal and all your codes will be there."],["Do I have to pick all agents now?","You pick which agents to unlock with each purchase. Buy another bundle later to unlock different ones."]].map(([q,a],i,arr)=>(
                <FAQItem key={q} q={q} a={a} last={i===arr.length-1}/>
              ))}
            </GlassCard>
          </div>
          <div style={{ position:"sticky",top:80,display:"flex",flexDirection:"column",gap:14 }}>
            {error && <div style={{ background:"#FEE2E2",border:"1px solid rgba(192,57,43,0.25)",borderRadius:10,padding:"12px 16px" }}><div style={{ fontSize:12,color:"#C0392B",fontFamily:F }}>{error}</div></div>}
            <OrderSummary selectedAgents={selectedAgents} bundleCount={bundleCount} onCheckout={handleCheckout} loading={loading}/>
            <GlassCard style={{ padding:"18px 22px" }}>
              {[["🔒","No contracts","Buy once. Yours forever."],["✉️","Instant delivery","Codes in your inbox within 60 seconds."],["💎","Lifetime access","Codes never expire. Agents are permanently yours."]].map(([icon,title,desc])=>(
                <div key={title} style={{ display:"flex",gap:10,marginBottom:12 }}>
                  <span style={{ fontSize:16,flexShrink:0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize:12,fontWeight:700,color:B.navy,fontFamily:F,marginBottom:1 }}>{title}</div>
                    <div style={{ fontSize:11,color:B.textMuted,fontFamily:F,lineHeight:1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </GlassCard>
          </div>
        </div>
      </div>
      <div style={{ textAlign:"center",padding:"20px 24px",fontSize:10,color:B.textLight,fontFamily:F,letterSpacing:"1.5px",borderTop:`1px solid ${B.glassBorder}`,background:B.white,position:"relative",zIndex:1 }}>
        PRËMO INC. · CANGGU, BALI · {new Date().getFullYear()} · Payments secured by Stripe
      </div>
    </div>
  );
}
