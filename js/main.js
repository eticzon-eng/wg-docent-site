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
  const embedUrl = "https://buttondown.com/wgdocent?as_embed=true";

  if (!iframe) return;

  let iframeReady = false;
  let loadsToIgnore = 1;
  let suppressConfirmationUntil = 0;

  function showConfirmation() {
    if (iframeWrap) iframeWrap.hidden = true;
    if (confirmation) confirmation.hidden = false;
    confirmation?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function showForm() {
    if (confirmation) confirmation.hidden = true;
    if (iframeWrap) iframeWrap.hidden = false;
    iframe.src = embedUrl + "&_=" + Date.now();
  }

  function shouldIgnoreLoad() {
    if (loadsToIgnore > 0) {
      loadsToIgnore -= 1;
      return true;
    }
    if (Date.now() < suppressConfirmationUntil) {
      return true;
    }
    return false;
  }

  iframe.addEventListener("load", function () {
    if (shouldIgnoreLoad()) return;
    if (!iframeReady) return;
    showConfirmation();
  });

  window.setTimeout(function () {
    iframeReady = true;
  }, 500);

  resetButton?.addEventListener("click", function () {
    iframeReady = false;
    loadsToIgnore = 4;
    suppressConfirmationUntil = Date.now() + 4000;
    showForm();
    window.setTimeout(function () {
      iframeReady = true;
    }, 500);
  });
})();
