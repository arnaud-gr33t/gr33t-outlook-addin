#!/usr/bin/env bash
#
# Déploie le contenu de addin/dist/ sur le repo GitHub Pages
# https://github.com/arnaud-gr33t/gr33t-outlook-addin (branche main).
#
# Usage :
#   ./scripts/deploy-gh-pages.sh              # build puis push
#   ./scripts/deploy-gh-pages.sh --skip-build # réutilise le dist existant
#
# Prérequis :
#   - Authentification GitHub configurée (gh CLI ou clé SSH/PAT classique)
#   - Le repo distant existe et est initialisé (au minimum un commit sur main)
#
set -euo pipefail

REPO_URL="https://github.com/arnaud-gr33t/gr33t-outlook-addin.git"
BRANCH="gh-pages"

# Chemins
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADDIN_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DIST_DIR="${ADDIN_DIR}/dist"
CLONE_DIR="${ADDIN_DIR}/.deploy-gh-pages"

SKIP_BUILD=false
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
    -h|--help)
      sed -n '1,20p' "$0"
      exit 0
      ;;
    *)
      echo "Argument inconnu : $arg" >&2
      exit 1
      ;;
  esac
done

# --- 1. Build production ---
if [[ "$SKIP_BUILD" = false ]]; then
  echo "┌─ Build production ─────────────────────────"
  cd "$ADDIN_DIR"
  npm run build
  echo
fi

if [[ ! -d "$DIST_DIR" ]] || [[ -z "$(ls -A "$DIST_DIR" 2>/dev/null)" ]]; then
  echo "❌ dist/ est vide. Lance 'npm run build' d'abord." >&2
  exit 1
fi

# --- 2. Clone ou update du repo gh-pages ---
if [[ ! -d "$CLONE_DIR/.git" ]]; then
  echo "┌─ Clone initial du repo gh-pages ───────────"
  git clone --branch "$BRANCH" "$REPO_URL" "$CLONE_DIR"
  echo
else
  echo "┌─ Update du clone gh-pages existant ────────"
  cd "$CLONE_DIR"
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"
  echo
fi

# --- 3. Copier le contenu de dist/ dans le clone ---
echo "┌─ Synchronisation dist → clone ─────────────"
cd "$CLONE_DIR"

# Retirer les anciens fichiers gérés par le déploiement (sauf .git et .gitignore
# éventuels), puis recopier dist/.
find . -mindepth 1 -maxdepth 1 \
  -not -name '.git' \
  -not -name '.gitignore' \
  -not -name 'README.md' \
  -exec rm -rf {} +

cp -R "$DIST_DIR"/. .

echo "  ✓ Fichiers copiés depuis $DIST_DIR"
echo

# --- 4. Commit + push ---
echo "┌─ Commit & push ────────────────────────────"
git add -A

if git diff --cached --quiet; then
  echo "  Aucune modification à déployer."
  exit 0
fi

VERSION=$(grep -oE '<Version>[^<]+</Version>' "$ADDIN_DIR/manifest.xml" | head -1 | sed 's/<[^>]*>//g' || echo "unknown")
COMMIT_MSG="Deploy $(date -u +%Y-%m-%dT%H:%M:%SZ) — manifest v${VERSION}"

git commit -m "$COMMIT_MSG"
git push origin "$BRANCH"

echo
echo "╔════════════════════════════════════════════╗"
echo "║  ✅ Déploiement terminé                     ║"
echo "║                                            ║"
echo "║  URL : https://arnaud-gr33t.github.io/     ║"
echo "║        gr33t-outlook-addin/                ║"
echo "║                                            ║"
echo "║  Propagation GitHub Pages : ~1-2 min       ║"
echo "╚════════════════════════════════════════════╝"
