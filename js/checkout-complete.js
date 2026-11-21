(function () {
  var params = new URLSearchParams(window.location.search);
  var statusEl = document.querySelector("[data-order-status]");
  var detailsEl = document.querySelector("[data-order-details]");

  var PREVIEW_ORDER = {
    email: "preview@example.com",
    shipping: {
      name: "Preview Reader",
      line1: "1 Preview Lane",
      line2: "",
      city: "Portland",
      state: "OR",
      postalCode: "97201",
      country: "US",
    },
    line: {
      description: "Silas and the Wizard — hardcover",
      quantity: 1,
      amount: 2800,
    },
    shippingAmount: 500,
    total: 3300,
    currency: "usd",
  };

  function setStatus(message) {
    if (!statusEl) return;
    statusEl.hidden = !message;
    statusEl.textContent = message || "";
  }

  function money(cents, currency) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "usd").toUpperCase(),
    }).format((Number(cents) || 0) / 100);
  }

  function countryName(code) {
    if (code === "US") return "United States";
    if (code === "CA") return "Canada";
    return code || "";
  }

  function addressText(shipping) {
    if (!shipping) return "";
    var cityLine = [shipping.city, shipping.state].filter(Boolean).join(", ");
    if (shipping.postalCode) cityLine = (cityLine ? cityLine + " " : "") + shipping.postalCode;
    return [
      shipping.name,
      shipping.line1,
      shipping.line2,
      cityLine,
      countryName(shipping.country),
    ].filter(Boolean).join("\n");
  }

  function lineText(order) {
    var line = order.line || {};
    var description = line.description || "Silas and the Wizard";
    var quantity = line.quantity || 1;
    return description + " × " + quantity + " — " + money(line.amount, order.currency);
  }

  function render(order) {
    document.querySelector("[data-order-email]").textContent = order.email || "";
    document.querySelector("[data-order-address]").textContent = addressText(order.shipping);
    document.querySelector("[data-order-line]").textContent = lineText(order);
    document.querySelector("[data-order-shipping]").textContent = money(order.shippingAmount, order.currency);
    document.querySelector("[data-order-total]").textContent = money(order.total, order.currency);
    if (detailsEl) detailsEl.hidden = false;
  }

  if (params.get("preview") === "1") {
    setStatus("Preview. This is sample order data. Stripe is not contacted.");
    render(PREVIEW_ORDER);
    return;
  }

  var sessionId = params.get("session_id");
  if (!sessionId) {
    setStatus("This page shows an order after payment. Open it with ?preview=1 to see a sample.");
    return;
  }

  var apiMeta = document.querySelector('meta[name="checkout-api"]');
  var api = apiMeta ? apiMeta.content : "/api/checkout-session";
  fetch(api + "?session_id=" + encodeURIComponent(sessionId), {
    headers: { Accept: "application/json" },
  })
    .then(function (response) {
      if (!response.ok) throw new Error("unavailable");
      return response.json();
    })
    .then(function (order) {
      setStatus("");
      render(order);
    })
    .catch(function () {
      setStatus("The order can’t be loaded yet. GitHub Pages can’t read a Checkout Session. The same server that creates the session has to answer GET /api/checkout-session.");
    });
})();
