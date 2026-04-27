const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
 
const PRICE_IDS = {
  1:  "price_1TQdhBDWURdmEJUGAu0beHL1",
  3:  "price_1TQU18DWURdmEJUGP9ZkYvUa",
  6:  "price_1TQU1ODWURdmEJUGQMAlvUHa",
  12: "price_1TQU1ZDWURdmEJUGm2Hfiemn",
};
 
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
 
  const { fragmentCount, agentIds, successUrl, cancelUrl, customerEmail } = req.body;
  const count = Number(fragmentCount);
 
  if (!count || !PRICE_IDS[count] || !successUrl || !cancelUrl) {
    return res.status(400).json({ error: "Missing or invalid fields" });
  }
 
  const selectedAgents = Array.isArray(agentIds) && agentIds.length === count ? agentIds : [];
  if (selectedAgents.length !== count) {
    return res.status(400).json({ error: `Expected ${count} agent selections, got ${selectedAgents.length}` });
  }
 
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",                          // ← recurring
      line_items: [{ price: PRICE_IDS[count], quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      subscription_data: {
        metadata: {
          product:        "the_crystal",
          fragment_count: String(count),
          agent_ids:      selectedAgents.join(","),
        },
      },
      metadata: {
        product:        "the_crystal",
        fragment_count: String(count),
        agent_ids:      selectedAgents.join(","),
      },
      ...(customerEmail ? { customer_email: customerEmail } : {}),
    });
    res.status(200).json({ url: session.url });
  } catch (e) {
    console.error("Checkout session error:", e);
    res.status(500).json({ error: e.message });
  }
};
