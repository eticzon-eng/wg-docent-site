document.getElementById("year").textContent = String(new Date().getFullYear());

const SOCIAL_LINKS = [
  { label: "Facebook", url: "https://www.facebook.com/profile.php?id=61591799307772" },
  { label: "Instagram", url: "https://www.instagram.com/wgdocent/" },
];

const socialNav = document.getElementById("footer-social");
if (socialNav) {
  socialNav.innerHTML = SOCIAL_LINKS.map(
    (link) =>
      `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label}</a>`
  ).join("");
}
