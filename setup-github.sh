#!/usr/bin/env bash
set -euo pipefail

# Run once after: gh auth login
REPO_NAME="${1:-wg-docent-site}"

gh repo create "$REPO_NAME" \
  --public \
  --source=. \
  --remote=origin \
  --push \
  --description "Author website for WG Docent — Silas and the Wizard"

echo ""
echo "Next: GitHub → Settings → Pages → Source: GitHub Actions"
echo "Site URL: https://$(gh api user -q .login).github.io/${REPO_NAME}/"
