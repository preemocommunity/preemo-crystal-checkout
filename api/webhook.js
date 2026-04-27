// api/webhook.js
// Product: prod_UPIbqA5OmYiaQp (new Stripe account)

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Maps price ID → number of fragments granted
const FRAGMENT_COUNTS = {
  "price_1TQU0nDWURdmEJUGwJnitULZ": 1,    // $97
  "price_1TQU18DWURdmEJUGP9ZkYvUa": 3,    // $297
  "price_1TQU1ODWURdmEJUGQMAlvUHa": 6,    // $597
  "price_1TQU1ZDWURdmEJUGm2Hfiemn": 12,   // $1,297
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

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (e) {
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }

  if (event.type !== "checkout.session.completed") {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;
  const email   = session.customer_details?.email;
  const name    = session.customer_details?.name;
  const agentIdsRaw = session.metadata?.agent_ids;
  const agentIds    = agentIdsRaw ? agentIdsRaw.split(",").map(Number).filter(Boolean) : [];

  if (!email || agentIds.length === 0) {
    console.error("Missing email or agent_ids:", session.id);
    return res.status(400).json({ error: "Missing required metadata" });
  }

  try {
    // Create or find customer row
    const { data: user, error: userErr } = await supabase
      .from("crystal_users")
      .upsert(
        { email, name: name || null, stripe_customer_id: session.customer || null, updated_at: new Date().toISOString() },
        { onConflict: "email" }
      )
      .select()
      .single();

    if (userErr) throw new Error(`User upsert failed: ${userErr.message}`);

    // Generate one unique code per selected agent
    const created = [];
    for (const agentId of agentIds) {
      const code = await uniqueCode();
      const { error: fragErr } = await supabase.from("crystal_fragments").insert({
        code,
        user_id:               user.id,
        agent_id:              agentId,
        tier:                  "",          // legacy column — kept empty
        active:                true,
        stripe_session_id:     session.id,
        stripe_payment_intent: session.payment_intent || null,
        purchased_at:          new Date().toISOString(),
      });
      if (fragErr) console.error(`Fragment insert failed agent ${agentId}:`, fragErr.message);
      else created.push({ code, agentId });
    }

    console.log(`[Crystal] ${created.length} fragments for ${email}:`,
      created.map(c => `${c.code} → agent ${c.agentId}`).join(", "));

    // TODO: send email with codes via Resend/Postmark

    return res.status(200).json({ received: true, fragments: created.length });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
};
