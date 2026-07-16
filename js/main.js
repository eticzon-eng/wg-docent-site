const year = document.getElementById("year");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

(function initSubscribeEmbed() {
  const embed = document.querySelector(".contact-embed");
  if (!embed) return;

  const iframeWrap = embed.querySelector("[data-subscribe-iframe-wrap]");
  const iframe = iframeWrap?.querySelector("iframe");
  const confirmation = embed.querySelector("[data-subscribe-confirmation]");
  const resetButton = embed.querySelector("[data-subscribe-reset]");

  if (!iframe) return;

  let iframeReady = false;

  function showConfirmation() {
    if (iframeWrap) iframeWrap.hidden = true;
    if (confirmation) confirmation.hidden = false;
    confirmation?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function showForm() {
    if (confirmation) confirmation.hidden = true;
    if (iframeWrap) iframeWrap.hidden = false;
    iframe.src = iframe.src;
  }

  iframe.addEventListener("load", function () {
    if (!iframeReady) return;
    showConfirmation();
  });

  window.setTimeout(function () {
    iframeReady = true;
  }, 300);

  resetButton?.addEventListener("click", function () {
    iframeReady = false;
    showForm();
    window.setTimeout(function () {
      iframeReady = true;
    }, 300);
  });
})();
