/**
 * Checkout Session API for the hidden Wizard Hat Books test checkout.
 *
 * GitHub Pages cannot run this file. Host it on a server that can keep
 * STRIPE_SECRET_KEY in the environment, then route these paths on
 * https://www.wizardhatbooks.com to that server:
 *
 *   POST /api/checkout-session
 *   GET  /api/checkout-session?session_id=CHECKOUT_SESSION_ID
 *
 * Required environment variables (never commit the values):
 *   STRIPE_SECRET_KEY       Stripe test secret key
 *   STRIPE_PUBLISHABLE_KEY  Stripe test publishable key
 *   STRIPE_PRICE_ID         the same book price id the local checkout uses
 *
 * Optional:
 *   PORT                    default 8787
 *   CHECKOUT_RETURN_URL     default the live confirmation page
 *   STRIPE_API_VERSION      default 2026-03-25.dahlia
 *
 * The session uses Stripe API Dahlia with ui_mode=form:
 * billing address required, individual name optional, phone off,
 * automatic tax, shipping to US and CA, US rate $5, CA rate $10,
 * Link display never, Amazon Pay excluded, card / Klarna / Affirm / Cash App kept.
 */

import http from "node:http";

const US_RATE = "shr_1UeFD14Hl5YFsJh9GGknDIhI";
const CA_RATE = "shr_1UeFDF4Hl5YFsJh97GTlZXDj";
const API_VERSION = process.env.STRIPE_API_VERSION || "2026-03-25.dahlia";
const RETURN_URL = process.env.CHECKOUT_RETURN_URL
  || "https://www.wizardhatbooks.com/checkout-complete.html?session_id={CHECKOUT_SESSION_ID}";
const PORT = Number(process.env.PORT || 8787);

const ALLOWED_ORIGINS = new Set([
  "https://www.wizardhatbooks.com",
  "https://wizardhatbooks.com",
  "http://127.0.0.1:8080",
  "http://localhost:8080",
]);

function send(res, status, body, origin) {
  var headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

function stripeRequest(path, params) {
  var secret = process.env.STRIPE_SECRET_KEY || "";
  if (!secret.startsWith("sk_")) {
    return Promise.reject(new Error("STRIPE_SECRET_KEY is not set to a secret key."));
  }
  return fetch("https://api.stripe.com" + path, {
    method: params ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + secret,
      "Stripe-Version": API_VERSION,
      ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: params ? params.toString() : undefined,
  }).then(async function (response) {
    var payload = await response.json();
    if (!response.ok) {
      var message = payload && payload.error && payload.error.message
        ? payload.error.message
        : "Stripe rejected the request.";
      var error = new Error(message);
      error.status = response.status;
      throw error;
    }
    return payload;
  });
}

function sessionParams() {
  var priceId = process.env.STRIPE_PRICE_ID || "";
  if (!priceId.startsWith("price_")) {
    throw new Error("STRIPE_PRICE_ID must be the local checkout price id.");
  }
  var body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("ui_mode", "form");
  body.set("submit_type", "pay");
  body.set("line_items[0][price]", priceId);
  body.set("line_items[0][quantity]", "1");
  body.set("return_url", RETURN_URL);
  body.set("billing_address_collection", "required");
  body.set("name_collection[individual][enabled]", "true");
  body.set("name_collection[individual][optional]", "true");
  body.set("phone_number_collection[enabled]", "false");
  body.set("automatic_tax[enabled]", "true");
  body.append("shipping_address_collection[allowed_countries][]", "US");
  body.append("shipping_address_collection[allowed_countries][]", "CA");
  body.set("shipping_options[0][shipping_rate]", US_RATE);
  body.set("shipping_options[1][shipping_rate]", CA_RATE);
  body.append("payment_method_types[]", "card");
  body.append("payment_method_types[]", "klarna");
  body.append("payment_method_types[]", "affirm");
  body.append("payment_method_types[]", "cashapp");
  body.set("wallet_options[link][display]", "never");
  body.set("integration_identifier", "wizard_hat_books_hidden_checkout");
  return body;
}

function publicOrder(session) {
  var shippingDetails = (session.collected_information && session.collected_information.shipping_details)
    || session.shipping_details
    || {};
  var address = shippingDetails.address || {};
  var item = session.line_items && session.line_items.data && session.line_items.data[0];
  var product = item && item.price && item.price.product;
  var productName = product && typeof product === "object" ? product.name : "";
  return {
    email: (session.customer_details && session.customer_details.email) || session.customer_email || "",
    shipping: {
      name: shippingDetails.name || (session.customer_details && session.customer_details.name) || "",
      line1: address.line1 || "",
      line2: address.line2 || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postal_code || "",
      country: address.country || "",
    },
    line: {
      description: (item && item.description) || productName || "Silas and the Wizard",
      quantity: (item && item.quantity) || 1,
      amount: item ? (item.amount_subtotal ?? item.amount_total ?? 0) : (session.amount_subtotal || 0),
    },
    shippingAmount: (session.total_details && session.total_details.amount_shipping)
      ?? (session.shipping_cost && session.shipping_cost.amount_total)
      ?? 0,
    total: session.amount_total || 0,
    currency: session.currency || "usd",
  };
}

async function createSession() {
  var publishable = process.env.STRIPE_PUBLISHABLE_KEY || "";
  if (!publishable.startsWith("pk_")) {
    throw new Error("STRIPE_PUBLISHABLE_KEY is not set to a publishable key.");
  }
  var session = await stripeRequest("/v1/checkout/sessions", sessionParams());
  return {
    publishableKey: publishable,
    clientSecret: session.client_secret,
  };
}

async function readSession(sessionId) {
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    var invalid = new Error("session_id is not a Checkout Session id.");
    invalid.status = 400;
    throw invalid;
  }
  var session = await stripeRequest(
    "/v1/checkout/sessions/" + encodeURIComponent(sessionId)
      + "?expand[]=line_items&expand[]=line_items.data.price.product&expand[]=shipping_cost.shipping_rate"
  );
  if (session.status !== "complete" && session.payment_status !== "paid") {
    var unpaid = new Error("This payment is not complete.");
    unpaid.status = 409;
    throw unpaid;
  }
  return publicOrder(session);
}

const server = http.createServer(function (req, res) {
  var url = new URL(req.url, "http://127.0.0.1");
  var origin = req.headers.origin || "";

  if (url.pathname !== "/api/checkout-session") {
    send(res, 404, { error: "Not found." }, origin);
    return;
  }

  if (req.method === "OPTIONS") {
    var headers = {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Accept, Content-Type",
      "Access-Control-Max-Age": "86400",
    };
    if (ALLOWED_ORIGINS.has(origin)) {
      headers["Access-Control-Allow-Origin"] = origin;
      headers.Vary = "Origin";
    }
    res.writeHead(204, headers);
    res.end();
    return;
  }

  var task;
  if (req.method === "POST") task = createSession();
  else if (req.method === "GET") task = readSession(url.searchParams.get("session_id") || "");
  else {
    send(res, 405, { error: "Method not allowed." }, origin);
    return;
  }

  task.then(function (body) {
    send(res, 200, body, origin);
  }).catch(function (error) {
    send(res, error.status || 500, { error: error.message || "Checkout server error." }, origin);
  });
});

server.listen(PORT, "127.0.0.1", function () {
  process.stdout.write("Checkout API listening on 127.0.0.1:" + PORT + "\n");
});
