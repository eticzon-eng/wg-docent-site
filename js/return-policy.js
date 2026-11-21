(function () {
  var root = document.querySelector("[data-return-policy]");
  if (!root) return;

  root.className = "return-policy";
  root.innerHTML =
    "<h2>Return policy</h2>" +
    "<p>You can return an unused book within 30 days of delivery. Email " +
    '<a href="mailto:contact@wizardhatbooks.com">contact@wizardhatbooks.com</a> ' +
    "from the address on the order and we will send return instructions. " +
    "After the book arrives back, we refund the book price and the tax. " +
    "Shipping is refunded if the book arrives damaged or we sent the wrong copy.</p>";
})();
