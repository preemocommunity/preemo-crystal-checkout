const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");
 
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
 
const FRAGMENT_COUNTS = {
  "price_1TQdhBDWURdmEJUGAu0beHL1": 1,
  "price_1TQdhODWURdmEJUGuzLEQsKe": 3,
  "price_1TQdhYDWURdmEJUGHuDaK3Kk": 6,
  "price_1TQdhgDWURdmEJUGYkANx8HV": 12,
};
 
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = (n) => Array.from({ length: n }, () => chars[crypto.randomInt(0, chars.length)]).join("");
  return `CRYSTAL-${seg(4)}-${seg(4)}`;
}
 
async function uniqueCode() {
  let code, exists;
  do {
    code = generateCode();
    const { data } = await supabase.from("crystal_fragments").select("id").eq("code", code).maybeSingle();
    exists = !!data;
  } while (exists);
  return code;
}
 
async function provisionFragments(session) {
  const email    = session.customer_details?.email || session.customer_email;
  const name     = session.customer_details?.name;
  const agentIds = (session.metadata?.agent_ids || "").split(",").map(Number).filter(Boolean);
 
  if (!email || agentIds.length === 0) {
    console.error("Missing email or agent_ids:", session.id);
    return;
  }
 
  const { data: user, error: userErr } = await supabase
    .from("crystal_users")
    .upsert(
      { email, name: name || null, stripe_customer_id: session.customer || null, updated_at: new Date().toISOString() },
      { onConflict: "email" }
    )
    .select()
    .single();
 
  if (userErr) throw new Error(`User upsert failed: ${userErr.message}`);
 
  for (const agentId of agentIds) {
    const code = await uniqueCode();
    const { error } = await supabase.from("crystal_fragments").insert({
      code,
      user_id:               user.id,
      agent_id:              agentId,
      tier:                  "",
      active:                true,
      stripe_session_id:     session.id,
      stripe_payment_intent: session.payment_intent || null,
      purchased_at:          new Date().toISOString(),
    });
    if (error) console.error(`Fragment insert failed agent ${agentId}:`, error.message);
    else console.log(`[Crystal] ${code} → agent ${agentId} for ${email}`);
  }
}
 
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
 
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }
 
  try {
    switch (event.type) {
      // First payment — provision the fragment codes
      case "checkout.session.completed": {
        const session = event.data.object;
        // For subscriptions, only provision on first payment
        if (session.payment_status === "paid") {
          await provisionFragments(session);
        }
        break;
      }
 
      // Subscription renewed — keep access active (no new codes needed)
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        if (invoice.billing_reason === "subscription_cycle") {
          // Update subscription status in crystal_users if you track it
          console.log(`[Crystal] Renewal paid for customer ${invoice.customer}`);
        }
        break;
      }
 
      // Payment failed — you may want to suspend access
      case "invoice.payment_failed": {
        console.log(`[Crystal] Payment failed for customer ${event.data.object.customer}`);
        // Optional: set active = false on their fragments after grace period
        break;
      }
 
      // Subscription cancelled
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        console.log(`[Crystal] Subscription cancelled for customer ${sub.customer}`);
        // Optional: deactivate fragments
        // await supabase.from("crystal_fragments")
        //   .update({ active: false })
        //   .eq("user_id", <look up by stripe customer id>);
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
 
  return res.status(200).json({ received: true });
};
