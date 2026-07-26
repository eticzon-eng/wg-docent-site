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

(function initGalleryLightbox() {
  const gallery = document.querySelector("[data-gallery]");
  const lightbox = document.querySelector("[data-lightbox]");
  if (!gallery || !lightbox) return;

  const image = lightbox.querySelector("[data-lightbox-image]");
  const caption = lightbox.querySelector("[data-lightbox-caption]");
  const closeButton = lightbox.querySelector("[data-lightbox-close]");
  const prevButton = lightbox.querySelector("[data-lightbox-prev]");
  const nextButton = lightbox.querySelector("[data-lightbox-next]");
  const items = Array.from(gallery.querySelectorAll("[data-gallery-open]"));
  let currentIndex = -1;
  let lastFocused = null;

  function show(index) {
    if (index < 0 || index >= items.length) return;
    currentIndex = index;
    const button = items[index];
    const img = button.querySelector("img");
    const figure = button.closest("figure");
    if (!img) return;

    image.src = img.src;
    image.alt = img.alt;
    caption.textContent = figure?.querySelector("figcaption")?.textContent || "";
    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeButton?.focus();
  }

  function hide() {
    lightbox.hidden = true;
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    image.src = "";
    currentIndex = -1;
    lastFocused?.focus();
  }

  function showRelative(step) {
    if (currentIndex < 0) return;
    const nextIndex = (currentIndex + step + items.length) % items.length;
    show(nextIndex);
  }

  gallery.addEventListener("click", function (event) {
    const button = event.target.closest("[data-gallery-open]");
    if (!button) return;
    lastFocused = button;
    show(items.indexOf(button));
  });

  closeButton?.addEventListener("click", hide);
  prevButton?.addEventListener("click", function () {
    showRelative(-1);
  });
  nextButton?.addEventListener("click", function () {
    showRelative(1);
  });

  lightbox.addEventListener("click", function (event) {
    if (event.target === lightbox) hide();
  });

  document.addEventListener("keydown", function (event) {
    if (lightbox.hidden) return;
    if (event.key === "Escape") hide();
    if (event.key === "ArrowLeft") showRelative(-1);
    if (event.key === "ArrowRight") showRelative(1);
  });
})();
