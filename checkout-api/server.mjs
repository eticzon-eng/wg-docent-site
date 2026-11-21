/**
 * Local test checkout for Wizard Hat Books.
 *
 * GitHub Pages cannot run this file or hold a Stripe secret key.
 * www.wizardhatbooks.com can serve the pages, and Pay stays unavailable there
 * until this process is what answers /api/checkout-session on that host.
 *
 * Smallest test, from the repo root, with test keys only (never commit them):
 *
 *   STRIPE_SECRET_KEY=... STRIPE_PUBLISHABLE_KEY=... node checkout-api/server.mjs
 *
 * Then open http://127.0.0.1:8787/checkout.html
 * The book price defaults to price_1UdcGw4Hl5YFsJh9v50wkBnl.
 * Live keys are refused.
 *
 * Optional:
 *   PORT                 default 8787
 *   STRIPE_PRICE_ID      override the test price id
 *   CHECKOUT_RETURN_URL  default the local confirmation page
 *   STRIPE_API_VERSION   default 2026-03-25.dahlia
 *
 * The session uses Stripe API Dahlia with ui_mode=form:
 * billing address required, individual name optional, phone off,
 * automatic tax, shipping to US and CA, US rate $5, CA rate $10,
 * Link display never, Amazon Pay excluded, card / Klarna / Affirm / Cash App kept.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const US_RATE = "shr_1UeFD14Hl5YFsJh9GGknDIhI";
const CA_RATE = "shr_1UeFDF4Hl5YFsJh97GTlZXDj";
const PRICE_ID = "price_1UdcGw4Hl5YFsJh9v50wkBnl";
const API_VERSION = process.env.STRIPE_API_VERSION || "2026-03-25.dahlia";
const PORT = Number(process.env.PORT || 8787);
const RETURN_URL = process.env.CHECKOUT_RETURN_URL
  || ("http://127.0.0.1:" + PORT + "/checkout-complete.html?session_id={CHECKOUT_SESSION_ID}");

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

function requireTestKey(name, value, prefix) {
  if (value.startsWith(prefix + "live_")) {
    var live = new Error(name + " is a live key. This checkout stays on test keys.");
    live.status = 400;
    throw live;
  }
  if (!value.startsWith(prefix + "test_")) {
    var missing = new Error(name + " must be a Stripe test key.");
    missing.status = 500;
    throw missing;
  }
}

function stripeRequest(requestPath, params) {
  var secret = process.env.STRIPE_SECRET_KEY || "";
  requireTestKey("STRIPE_SECRET_KEY", secret, "sk_");
  return fetch("https://api.stripe.com" + requestPath, {
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
  var priceId = process.env.STRIPE_PRICE_ID || PRICE_ID;
  if (!priceId.startsWith("price_")) {
    throw new Error("STRIPE_PRICE_ID must be the test book price id.");
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
  requireTestKey("STRIPE_PUBLISHABLE_KEY", publishable, "pk_");
  var session = await stripeRequest("/v1/checkout/sessions", sessionParams());
  return {
    publishableKey: publishable,
    clientSecret: session.client_secret,
  };
}

async function readSession(sessionId) {
  if (!/^cs_test_[A-Za-z0-9]+$/.test(sessionId)) {
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

var TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".mp4": "video/mp4",
};

function serveFile(res, pathname) {
  var rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch (error) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bad path.");
    return;
  }
  if (rel === "/") rel = "/index.html";
  if (rel.endsWith("/")) rel += "index.html";
  var filePath = path.resolve(ROOT, "." + rel);
  var inside = filePath === ROOT || filePath.startsWith(ROOT + path.sep);
  var name = path.basename(filePath);
  if (!inside || name.startsWith(".") || rel.includes("\0")) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found.");
    return;
  }
  fs.readFile(filePath, function (error, body) {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found.");
      return;
    }
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(body);
  });
}

const server = http.createServer(function (req, res) {
  var url = new URL(req.url, "http://127.0.0.1");
  var origin = req.headers.origin || "";

  if (url.pathname !== "/api/checkout-session") {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" });
      res.end("Method not allowed.");
      return;
    }
    serveFile(res, url.pathname);
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
