const year = document.getElementById("year");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

const EBOOK_URL = "https://a.co/d/0j0g4wAm";
const PAPERBACK_URL = "https://www.amazon.com/dp/B0HGTQZ63H";
const HARDCOVER_URL = "https://www.tiktok.com/view/product/1732809589560545892";
const EBOOK_LABEL = "Buy the ebook";
const PAPERBACK_LABEL = "Buy the paperback";
const HARDCOVER_LABEL = "Buy the hardcover on TikTok Shop";

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
setupBuyLinks("[data-hardcover]", HARDCOVER_URL, HARDCOVER_LABEL);

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
  const lightbox = document.querySelector("[data-lightbox]");
  if (!lightbox) return;

  const image = lightbox.querySelector("[data-lightbox-image]");
  const video = lightbox.querySelector("[data-lightbox-video]");
  const caption = lightbox.querySelector("[data-lightbox-caption]");
  const closeButton = lightbox.querySelector("[data-lightbox-close]");
  const prevButton = lightbox.querySelector("[data-lightbox-prev]");
  const nextButton = lightbox.querySelector("[data-lightbox-next]");
  const imageItems = Array.from(document.querySelectorAll("[data-gallery] [data-gallery-open]"));
  const reelItems = Array.from(document.querySelectorAll("[data-reels] [data-reel-open]"));
  if (!imageItems.length && !reelItems.length) return;

  let items = [];
  let currentIndex = -1;
  let lastFocused = null;

  function isOpen() {
    return lightbox.classList.contains("is-open");
  }

  function stopVideo() {
    if (!video) return;
    video.pause();
    video.removeAttribute("src");
    video.load();
  }

  function show(index) {
    if (index < 0 || index >= items.length) return;
    currentIndex = index;
    const button = items[index];
    const figure = button.closest("figure");
    const captionText = figure ? (figure.querySelector("figcaption")?.textContent || "") : "";
    const isReel = button.hasAttribute("data-reel-open");
    caption.textContent = captionText;

    if (isReel) {
      const poster = button.querySelector("img");
      const src = button.getAttribute("data-reel-src");
      if (!video || !src) return;
      lightbox.classList.add("is-reel");
      if (image) image.alt = "";
      video.poster = poster ? (poster.currentSrc || poster.src) : "";
      video.setAttribute("aria-label", captionText || "Reel");
      video.src = src;
      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(function () {});
      }
      if (prevButton) prevButton.setAttribute("aria-label", "Previous reel");
      if (nextButton) nextButton.setAttribute("aria-label", "Next reel");
    } else {
      const img = button.querySelector("img");
      if (!img || !image) return;
      lightbox.classList.remove("is-reel");
      stopVideo();
      image.src = img.currentSrc || img.src;
      image.alt = img.alt;
      if (prevButton) prevButton.setAttribute("aria-label", "Previous illustration");
      if (nextButton) nextButton.setAttribute("aria-label", "Next illustration");
    }

    lightbox.hidden = false;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeButton?.focus();
  }

  function hide() {
    lightbox.hidden = true;
    lightbox.classList.remove("is-open");
    lightbox.classList.remove("is-reel");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    stopVideo();
    if (image) {
      image.removeAttribute("src");
      image.alt = "";
    }
    if (caption) caption.textContent = "";
    currentIndex = -1;
    items = [];
    if (lastFocused) lastFocused.focus();
  }

  function showRelative(step) {
    if (currentIndex < 0 || !items.length) return;
    show((currentIndex + step + items.length) % items.length);
  }

  function bind(list) {
    list.forEach(function (button, index) {
      button.addEventListener("click", function () {
        items = list;
        lastFocused = button;
        show(index);
      });
    });
  }

  bind(imageItems);
  bind(reelItems);

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
    if (event.key === "Escape") {
      event.preventDefault();
      hide();
      return;
    }
    if (video && (event.target === video || video.contains(event.target))) return;
    if (event.key === "ArrowLeft") showRelative(-1);
    if (event.key === "ArrowRight") showRelative(1);
  });
})();
