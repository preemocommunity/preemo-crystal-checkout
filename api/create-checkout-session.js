const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Product: prod_UPGkv9wTQrtzCb — 4 prices, one per bundle
const PRICE_IDS = {
  1:  "price_1TQSCl3Nki63MxsyABFqMANk",
  3:  "price_1TQSXL3Nki63Mxsy93qlTwts",
  6:  "price_1TQSXs3Nki63MxsypKsp6hjW",
  12: "price_1TQSY53Nki63Mxsy90gcrh24",
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

  // agentIds: array of agent IDs the customer selected e.g. [1, 3, 7]
  const selectedAgents = Array.isArray(agentIds) && agentIds.length === count
    ? agentIds
    : [];

  if (selectedAgents.length !== count) {
    return res.status(400).json({ error: `Expected ${count} agent selections, got ${selectedAgents.length}` });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: PRICE_IDS[count], quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: {
        product:        "the_crystal",
        fragment_count: String(count),
        agent_ids:      selectedAgents.join(","),
      },
      payment_intent_data: {
        metadata: {
          fragment_count: String(count),
          agent_ids:      selectedAgents.join(","),
        },
      },
      ...(customerEmail ? { customer_email: customerEmail } : {}),
    });

    res.status(200).json({ url: session.url });
  } catch (e) {
    console.error("Checkout session error:", e);
    res.status(500).json({ error: e.message });
  }
};
