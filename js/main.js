const year = document.getElementById("year");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

const EBOOK_URL = "https://a.co/d/0j0g4wAm";
const PAPERBACK_URL = "https://www.amazon.com/dp/B0HGTQZ63H";
const EBOOK_LABEL = "Buy the ebook";
const PAPERBACK_LABEL = "Buy the paperback";

function setupBuyLinks(selector, url, buttonLabel) {
  document.querySelectorAll(selector).forEach((el) => {
    el.setAttribute("href", url);
    el.removeAttribute("aria-disabled");
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
    if (el.classList.contains("button")) {
      el.textContent = buttonLabel;
    }
  });
}

setupBuyLinks("[data-ebook]", EBOOK_URL, EBOOK_LABEL);
setupBuyLinks("[data-paperback]", PAPERBACK_URL, PAPERBACK_LABEL);

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

  function isOpen() {
    return lightbox.classList.contains("is-open");
  }

  function show(index) {
    if (index < 0 || index >= items.length) return;
    currentIndex = index;
    const button = items[index];
    const img = button.querySelector("img");
    const figure = button.closest("figure");
    if (!img) return;

    image.src = img.currentSrc || img.src;
    image.alt = img.alt;
    caption.textContent = figure ? (figure.querySelector("figcaption")?.textContent || "") : "";
    lightbox.hidden = false;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeButton?.focus();
  }

  function hide() {
    lightbox.hidden = true;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    image.removeAttribute("src");
    image.alt = "";
    caption.textContent = "";
    currentIndex = -1;
    if (lastFocused) lastFocused.focus();
  }

  function showRelative(step) {
    if (currentIndex < 0) return;
    const nextIndex = (currentIndex + step + items.length) % items.length;
    show(nextIndex);
  }

  items.forEach(function (button, index) {
    button.addEventListener("click", function () {
      lastFocused = button;
      show(index);
    });
  });

  closeButton?.addEventListener("click", hide);
  prevButton?.addEventListener("click", function () {
    showRelative(-1);
  });
  nextButton?.addEventListener("click", function () {
    showRelative(1);
  });

  lightbox.querySelector(".lightbox-figure")?.addEventListener("click", function (event) {
    event.stopPropagation();
  });

  lightbox.addEventListener("click", function (event) {
    if (event.target === lightbox) hide();
  });

  document.addEventListener("keydown", function (event) {
    if (!isOpen()) return;
    if (event.key === "Escape") hide();
    if (event.key === "ArrowLeft") showRelative(-1);
    if (event.key === "ArrowRight") showRelative(1);
  });
})();
