const year = document.getElementById("year");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

(function initSubscribeForm() {
  const form = document.querySelector(".subscribe-form");
  if (!form) return;

  const frameName = "buttondown-subscribe-frame";
  let responseFrame = document.querySelector(`iframe[name="${frameName}"]`);
  if (!responseFrame) {
    responseFrame = document.createElement("iframe");
    responseFrame.name = frameName;
    responseFrame.title = "Newsletter subscription response";
    responseFrame.hidden = true;
    responseFrame.tabIndex = -1;
    document.body.appendChild(responseFrame);
  }

  let activeForm = null;

  function setStatus(message, type) {
    const status = form.querySelector("[data-subscribe-status]");
    if (!status) return;
    status.textContent = message;
    status.classList.remove("is-success", "is-error");
    if (type) status.classList.add(type);
  }

  responseFrame.addEventListener("load", function () {
    if (!activeForm) return;

    setStatus(
      "Almost done. Check your inbox to confirm your subscription. If you don't see it, check spam or junk.",
      "is-success"
    );
    activeForm.reset();
    activeForm = null;
  });

  form.addEventListener("submit", function () {
    activeForm = form;
    form.target = frameName;
    setStatus("Submitting…");
  });
})();
