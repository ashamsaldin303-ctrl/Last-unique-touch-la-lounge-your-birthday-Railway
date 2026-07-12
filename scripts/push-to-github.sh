#!/usr/bin/env bash
# ============================================================
# Push lut-deploy to a new GitHub repo
# ============================================================
# Usage:
#   ./push-to-github.sh <GITHUB_PAT> [REPO_NAME] [VISIBILITY]
#
# Arguments:
#   GITHUB_PAT   — GitHub Personal Access Token (needs repo + workflow scopes)
#   REPO_NAME    — (optional) repo name, default: last-unique-touch-deploy
#   VISIBILITY   — (optional) "private" (default) or "public"
#
# Example:
#   ./push-to-github.sh ghp_xxxxxxxxxxxx last-unique-touch-deploy private
# ============================================================
set -euo pipefail

PAT="${1:-}"
REPO_NAME="${2:-last-unique-touch-deploy}"
VISIBILITY="${3:-private}"

if [ -z "$PAT" ]; then
  echo "❌ Error: GitHub Personal Access Token required"
  echo "Usage: $0 <GITHUB_PAT> [REPO_NAME] [VISIBILITY]"
  echo ""
  echo "Create a PAT at: https://github.com/settings/tokens/new?scopes=repo,workflow"
  exit 1
fi

# Resolve repo dir (script lives in <repo>/scripts/)
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

# Ensure gh CLI is installed
if ! command -v gh >/dev/null 2>&1; then
  echo "❌ gh CLI not found. Install: https://cli.github.com/"
  exit 1
fi

echo "→ Authenticating with GitHub…"
echo "$PAT" | gh auth login --with-token
gh auth status

echo "→ Creating repo '$REPO_NAME' ($VISIBILITY)…"
if [ "$VISIBILITY" = "public" ]; then
  gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
else
  gh repo create "$REPO_NAME" --private --source=. --remote=origin --push \
    --description "Last Unique Touch + La Lounge + Your Birthday — Multi-tenant e-commerce (Railway + Supabase ready)"
fi

echo ""
echo "✅ Done!"
echo "→ Repo URL: $(gh repo view --json url -q .url)"
echo "→ Verify:   gh repo view --web"
