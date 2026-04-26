// ─────────────────────────────────────────────────────────────────────────────
// api/webhook.js — Stripe webhook for The Crystal checkout
//
// FLOW PER CUSTOMER:
// 1. Stripe fires checkout.session.completed
// 2. We create or find the customer in crystal_users (by email)
// 3. We read which agents they selected from session.metadata.agent_ids
// 4. We generate ONE unique Fragment code per agent selected
//    Format: CRYSTAL-XXXX-XXXX (cryptographically unique, never reused)
// 5. Each code is a row in crystal_fragments linked to the user + agent_id
// 6. TODO: Send email with codes (add your email provider)
//
// EVERY CUSTOMER gets a completely separate set of rows and codes.
// Tom's CRYSTAL-A3B7-X9K2 will never appear in any other customer's account.
// ─────────────────────────────────────────────────────────────────────────────

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

// Service role key — bypasses RLS. Never expose to frontend.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Maps Stripe price IDs back to fragment counts (for validation)
// Same product: prod_UPGkv9wTQrtzCb
const FRAGMENT_COUNTS = {
  "price_REPLACE_crystal_1":  1,
  "price_REPLACE_crystal_3":  3,
  "price_REPLACE_crystal_6":  6,
  "price_REPLACE_crystal_12": 12,
};

// Generate a unique Fragment code
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1 confusion
  const seg = (n) => Array.from({ length: n }, () =>
    chars[crypto.randomInt(0, chars.length)]
  ).join("");
  return `CRYSTAL-${seg(4)}-${seg(4)}`;
}

// Ensure code doesn't already exist in the database
async function uniqueCode() {
  let code, exists;
  do {
    code = generateCode();
    const { data } = await supabase
      .from("crystal_fragments")
      .select("id")
      .eq("code", code)
      .maybeSingle();
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
    console.error("Webhook signature failed:", e.message);
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }

  // Only handle successful checkouts
  if (event.type !== "checkout.session.completed") {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;
  const email   = session.customer_details?.email;
  const name    = session.customer_details?.name;

  // Read agent selection from metadata
  // agent_ids is a comma-separated string e.g. "1,3,7"
  const agentIdsRaw = session.metadata?.agent_ids;
  const agentIds    = agentIdsRaw
    ? agentIdsRaw.split(",").map(Number).filter(Boolean)
    : [];

  if (!email || agentIds.length === 0) {
    console.error("Missing email or agent_ids in session:", session.id);
    return res.status(400).json({ error: "Missing required metadata" });
  }

  try {
    // ── 1. Create or find the customer ────────────────────────────────────────
    // Upsert on email — same customer buying again gets the same user row.
    // New customer gets a fresh row with a new UUID.
    const { data: user, error: userErr } = await supabase
      .from("crystal_users")
      .upsert(
        {
          email,
          name:               name || null,
          stripe_customer_id: session.customer || null,
          updated_at:         new Date().toISOString(),
        },
        { onConflict: "email" }
      )
      .select()
      .single();

    if (userErr) throw new Error(`User upsert failed: ${userErr.message}`);

    // ── 2. Generate one unique code per agent selected ─────────────────────────
    const created = [];
    for (const agentId of agentIds) {
      const code = await uniqueCode();

      const { error: fragErr } = await supabase
        .from("crystal_fragments")
        .insert({
          code,
          user_id:              user.id,
          agent_id:             agentId,
          active:               true,
          stripe_session_id:    session.id,
          stripe_payment_intent: session.payment_intent || null,
          purchased_at:         new Date().toISOString(),
        });

      if (fragErr) {
        console.error(`Fragment insert failed for agent ${agentId}:`, fragErr.message);
      } else {
        created.push({ code, agentId });
      }
    }

    console.log(
      `[Crystal] Created ${created.length} fragments for ${email}:`,
      created.map(c => `${c.code} → agent ${c.agentId}`).join(", ")
    );

    // ── 3. Send email with all codes ───────────────────────────────────────────
    // TODO: plug in your email provider (Resend recommended)
    //
    // Each code in 'created' has:
    //   - code:    "CRYSTAL-XXXX-XXXX"  (the fragment code)
    //   - agentId: 1–12                 (which petal it unlocks)
    //
    // Fetch agent names to include in the email:
    // const { data: agents } = await supabase
    //   .from("crystal_agent_configs")
    //   .select("agent_id, agent_name, agent_title")
    //   .in("agent_id", agentIds);
    //
    // await resend.emails.send({
    //   from: "The Crystal <crystal@premo.inc>",
    //   to: email,
    //   subject: `Your ${created.length} Fragment${created.length > 1 ? "s" : ""} — The Crystal`,
    //   html: buildFragmentEmail(name, created, agents),
    // });

    return res.status(200).json({ received: true, fragments: created.length });

  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
};
