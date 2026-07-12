# WG Docent — Author Website

Official author site for **WG Docent** and the illustrated novel *Silas and the Wizard*.

This is a **standalone project**, separate from the tennis league app.

## Local preview

```bash
python3 -m http.server 8080
```

Open http://127.0.0.1:8080

## Deploy to GitHub Pages

1. Create a new empty repo on GitHub (e.g. `wg-docent-site`).
2. From this folder:

```bash
git add .
git commit -m "Initial author website"
git branch -M main
git remote add origin git@github.com:YOUR_USER/wg-docent-site.git
git push -u origin main
```

3. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Your site will be at: `https://YOUR_USER.github.io/wg-docent-site/`

## Deploy to Netlify

Connect this repo at netlify.com — `netlify.toml` is already configured.

## Before going live

- [ ] Amazon buy link in `book.html`
- [ ] Formspree form ID in `contact.html`
- [ ] Optional custom domain (e.g. `wgdocent.com`)
