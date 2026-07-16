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
  let submittedEmail = "";

  const fields = form.querySelector(".subscribe-form-fields");
  const confirmation = form.querySelector("[data-subscribe-confirmation]");
  const confirmationEmail = form.querySelector("[data-subscribe-email]");

  function setStatus(message, type) {
    const status = form.querySelector("[data-subscribe-status]");
    if (!status) return;
    status.textContent = message;
    status.classList.remove("is-success", "is-error");
    if (type) status.classList.add(type);
  }

  function showConfirmation() {
    if (confirmationEmail && submittedEmail) {
      confirmationEmail.textContent = submittedEmail;
    }
    if (confirmation) confirmation.hidden = false;
    if (fields) fields.setAttribute("aria-hidden", "true");
    form.classList.add("is-confirmed");
    setStatus("");
  }

  responseFrame.addEventListener("load", function () {
    if (!activeForm) return;

    showConfirmation();
    activeForm.reset();
    activeForm = null;
  });

  form.addEventListener("submit", function () {
    const emailInput = form.querySelector('input[name="email"]');
    submittedEmail = emailInput instanceof HTMLInputElement ? emailInput.value.trim() : "";
    activeForm = form;
    form.target = frameName;
    setStatus("Submitting…");
  });
})();
