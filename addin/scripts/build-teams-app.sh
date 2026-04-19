#!/usr/bin/env bash
#
# Construit le package Teams App (.zip) à uploader dans le M365 Admin Center.
#
# Contenu du zip :
#   - manifest.json (Teams schema v1.17)
#   - color.png  (192×192)
#   - outline.png (32×32)
#
# Prérequis : npm run make:teams-icons (au moins une fois) pour générer les PNG.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADDIN_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
MANIFEST_DIR="${ADDIN_DIR}/teams-manifest"
OUT_DIR="${ADDIN_DIR}/dist"
OUT_ZIP="${OUT_DIR}/gr33t-teams-app.zip"

REQUIRED=(manifest.json color.png outline.png)

for f in "${REQUIRED[@]}"; do
  if [[ ! -f "${MANIFEST_DIR}/${f}" ]]; then
    echo "❌ Fichier manquant : ${MANIFEST_DIR}/${f}" >&2
    if [[ "$f" == *.png ]]; then
      echo "   → lance 'npm run make:teams-icons' pour générer les icônes" >&2
    fi
    exit 1
  fi
done

mkdir -p "$OUT_DIR"
rm -f "$OUT_ZIP"

cd "$MANIFEST_DIR"
zip -j "$OUT_ZIP" "${REQUIRED[@]}"

echo
echo "╔════════════════════════════════════════════════╗"
echo "║  ✅ Package Teams App créé                      ║"
echo "║  $(basename "$OUT_ZIP" | sed 's/.*/& /g' | head -c 40)                    ║"
echo "║                                                ║"
echo "║  Upload : https://admin.microsoft.com          ║"
echo "║  → Paramètres → Applications intégrées         ║"
echo "║  → Upload custom apps                          ║"
echo "╚════════════════════════════════════════════════╝"
echo
echo "Chemin : $OUT_ZIP"
