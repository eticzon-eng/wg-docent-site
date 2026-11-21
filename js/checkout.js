(function () {
  var US_RATE = "shr_1UeFD14Hl5YFsJh9GGknDIhI";
  var CA_RATE = "shr_1UeFDF4Hl5YFsJh97GTlZXDj";
  var RATES = { US: US_RATE, CA: CA_RATE };

  var statusEl = document.querySelector("[data-checkout-status]");
  var formRoot = document.querySelector("#checkout-form");
  var apiMeta = document.querySelector('meta[name="checkout-api"]');
  var api = apiMeta ? apiMeta.content : "/api/checkout-session";

  function setStatus(message) {
    if (!statusEl) return;
    statusEl.hidden = !message;
    statusEl.textContent = message || "";
  }

  function backendMessage() {
    return "Pay isn’t available yet. GitHub Pages can’t create a Stripe Checkout Session. A server that holds the test secret key has to answer POST /api/checkout-session before Pay can run.";
  }

  function loadStripeJs() {
    if (window.Stripe) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = "https://js.stripe.com/endive/stripe.js";
      script.onload = function () { resolve(); };
      script.onerror = function () { reject(new Error("Stripe.js did not load.")); };
      document.head.appendChild(script);
    });
  }

  function countryOf(value) {
    var shipping = value && value.shippingAddress;
    var address = shipping && shipping.address;
    return address && address.country;
  }

  function selectedRateId(value) {
    var option = value && value.shippingOption;
    return option && option.id;
  }

  fetch(api, {
    method: "POST",
    headers: { Accept: "application/json" },
  })
    .then(function (response) {
      if (!response.ok) throw new Error("unavailable");
      return response.json();
    })
    .then(function (payload) {
      if (!payload || !payload.clientSecret || !payload.publishableKey) {
        throw new Error("unavailable");
      }
      if (String(payload.publishableKey).indexOf("sk_") === 0) {
        throw new Error("unavailable");
      }
      return loadStripeJs().then(function () {
        return payload;
      });
    })
    .then(function (payload) {
      setStatus("");
      var stripe = window.Stripe(payload.publishableKey);
      var checkout = stripe.initCheckoutFormSdk({
        clientSecret: payload.clientSecret,
        appearance: {
          theme: "flat",
          variables: {
            colorPrimary: "#1a1a1a",
            colorBackground: "#ffffff",
            colorText: "#1a1a1a",
            colorTextSecondary: "#5c5c5c",
            borderRadius: "12px",
            fontFamily: "Georgia, Times New Roman, serif",
          },
        },
      });
      var form = checkout.createForm({ layout: "expanded" });
      return checkout.loadActions().then(function (loaded) {
        if (loaded.type !== "success") {
          throw new Error(loaded.error && loaded.error.message ? loaded.error.message : "unavailable");
        }
        var actions = loaded.actions;
        var syncingRate = false;
        var appliedCountry = "";

        form.on("change", function (event) {
          if (syncingRate) return;
          var value = event && event.value ? event.value : event;
          var country = countryOf(value);
          var rate = RATES[country];
          if (!rate || selectedRateId(value) === rate) {
            if (rate && selectedRateId(value) === rate) appliedCountry = country;
            return;
          }
          if (appliedCountry === country) return;
          syncingRate = true;
          actions.updateShippingOption(rate).then(function (result) {
            syncingRate = false;
            if (result && result.type === "success") appliedCountry = country;
          }, function () {
            syncingRate = false;
          });
        });

        form.on("confirm", function (event) {
          var value = typeof form.getValue === "function" ? form.getValue() : null;
          if (!value || value.complete !== true || value.empty === true) {
            return actions.validateElements().then(function () {
              return undefined;
            });
          }
          return actions.confirm({ formConfirmEvent: event }).then(function (result) {
            if (result && result.type === "error") {
              setStatus(result.error && result.error.message
                ? result.error.message
                : "Payment was not completed. You can correct the form and try again.");
            }
          }).catch(function (error) {
            setStatus(error && error.message
              ? error.message
              : "Payment could not be submitted. The form is still editable.");
          });
        });

        form.mount(formRoot);
      });
    })
    .catch(function () {
      setStatus(backendMessage());
    });
})();
