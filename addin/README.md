# Gr33t Recovery Layer — Outlook Add-in (Jalon 1)

Add-in Microsoft 365 pour Outlook qui affiche les indicateurs de récupération Gr33t (score journalier + 4 facteurs + mini-timeline) dans un TaskPane latéral.

**Stack** : React 18 + TypeScript + Fluent UI v9 + Webpack 5

**Statut** : Jalon 1 terminé — TaskPane complet avec données mockées, sans authentification ni Microsoft Graph.

---

## Prérequis

- Node.js ≥ 18, npm ≥ 9
- Un compte Microsoft 365 (tenant Developer Program recommandé)
- Outlook Web (outlook.office.com) ou Outlook Desktop (Windows / Mac)

---

## Démarrage rapide

```bash
cd "Gr33t Layer Outlook/addin"
npm install
npm run validate   # vérifie le manifest
npm run build:dev  # build développement
npm start          # démarre le dev server HTTPS + sideload
```

Le serveur HTTPS tourne sur `https://localhost:3000`.

### Sideload dans Outlook Web

Si le sideload automatique ne fonctionne pas :

1. Ouvrir [Outlook Web](https://outlook.office.com)
2. **Obtenir des compléments** (icône engrenage ou bouton dans le ruban)
3. **Mes compléments** → **Ajouter un complément personnalisé** → **À partir d'un fichier**
4. Sélectionner le fichier `addin/manifest.xml`
5. Confirmer l'installation

---

## Placement du bouton dans Outlook

L'add-in Office ne permet **pas** officiellement de placer un bouton dans le ruban global de la vue calendrier Semaine/Jour ([issue GitHub](https://github.com/OfficeDev/office-js-docs-pr/issues/1326)). Les options retenues sont donc :

### Option C — Mail + Réunions (choix Jalon 1)

Le bouton **Gr33t Layer** apparaît :

1. **Dans le ruban de la vue Mail** en permanence, grâce à l'attribut `SupportsNoItemContext` (API Mailbox 1.13+). L'utilisateur peut ouvrir le TaskPane sans avoir à sélectionner un message.
2. **Dans le ruban des fenêtres de réunion** (organisateur et participant) via les extension points `AppointmentOrganizerCommandSurface` et `AppointmentAttendeeCommandSurface`.

### Limitation

En **Outlook Web**, `SupportsNoItemContext` ne fait pas apparaître le bouton dans la barre de commandes si aucun message n'est sélectionné (limitation documentée par Microsoft). Il faut donc sélectionner un mail pour voir le bouton Gr33t sur le web. Sur **Outlook Desktop**, le bouton est toujours visible dans le ruban de la vue Mail.

---

## Architecture du projet

```
addin/
├── manifest.xml              # Manifest Office Add-in (XML 1.1)
├── webpack.config.js         # Config webpack 5 avec dev server HTTPS
├── tsconfig.json             # TypeScript strict mode
├── babel.config.json
├── package.json
├── assets/                   # Icônes Gr33t (16/32/64/80 px PNG)
│   └── icon-*.png
└── src/
    ├── taskpane/
    │   ├── index.tsx         # Bootstrap React dans Office.onReady
    │   ├── taskpane.html     # Shell HTML + Office.js CDN
    │   └── taskpane.css      # Reset minimal global
    ├── components/
    │   ├── App.tsx           # Composant racine, état global
    │   ├── TaskPane.tsx      # Layout vertical
    │   ├── Header.tsx        # Titre jour + score + barre + fermer
    │   ├── WeekSelector.tsx  # 5 cartes Lun-Ven
    │   ├── Timeline.tsx      # Timeline verticale 8h-21h + overlays
    │   ├── FactorList.tsx    # Liste des 4 facteurs
    │   ├── FactorCard.tsx    # Carte facteur avec hover → highlight
    │   ├── RefreshButton.tsx # Bouton « Actualiser » + toast
    │   ├── TrendChart.tsx    # Courbe SVG 3 semaines
    │   └── Footer.tsx        # Mention QVCT
    ├── data/
    │   └── mockData.ts       # Données mockées typées (5 jours)
    ├── types/
    │   └── index.ts          # Interfaces TypeScript (DayScore, Factor, ...)
    └── utils/
        └── timeline.ts       # hourToY, durationToH, scoreBand, fmtH
```

---

## Commandes disponibles

| Commande | Description |
|---|---|
| `npm start` | Démarre le dev server HTTPS et sideload dans Outlook |
| `npm stop` | Arrête le dev server et désinstalle le sideload |
| `npm run build` | Build production (minifié) dans `dist/` |
| `npm run build:dev` | Build développement (avec source maps) |
| `npm run watch` | Build continu en développement |
| `npm run validate` | Valide le manifest XML |
| `npm run lint` | Lint TypeScript / JavaScript |
| `npm run lint:fix` | Corrige automatiquement les erreurs de lint |

---

## Ce qui est dans le Jalon 1

- ✅ Scaffolding React + TypeScript + Webpack + Fluent UI v9
- ✅ Manifest XML valide avec bouton ruban Mail + Réunions
- ✅ Icônes placeholder Gr33t (bleu `#4387F4` avec "G" blanc)
- ✅ TaskPane complet avec données mockées
- ✅ Composants : Header, WeekSelector, Timeline, FactorList, FactorCard, TrendChart, Footer
- ✅ Interactions : sélection jour, hover facteur → overlay timeline, toast Actualiser
- ✅ Types TypeScript stricts, contrat UI découplé des sources de données
- ✅ Styling Fluent UI v9 (tokens, `makeStyles`, `shorthands`)

## Ce qui n'est PAS dans le Jalon 1

- ❌ Authentification Microsoft Graph
- ❌ Appels Microsoft Graph (calendrier, mails)
- ❌ Calcul réel des scores
- ❌ Stockage local (`roamingSettings` / `localStorage`)
- ❌ Déploiement sur hébergement stable (Azure Static Web Apps)
- ❌ Tests unitaires du ScoreCalculator

Ces éléments sont planifiés pour les phases 4 à 9 du Plan de Développement v2.

---

## Notes techniques

### Fluent UI v9 et Griffel

Fluent UI v9 utilise **Griffel** comme moteur CSS-in-JS, qui interdit les propriétés CSS shorthand multi-valeurs (`padding`, `border`, `borderRadius`, `margin`, etc.). Pour les contourner, on utilise le helper `shorthands` de `@fluentui/react-components` :

```tsx
import { makeStyles, tokens, shorthands } from "@fluentui/react-components";

const useStyles = makeStyles({
  container: {
    ...shorthands.padding("12px", "16px"),
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
});
```

### Couleurs : Fluent vs Gr33t

- Le **chrome** du TaskPane utilise les tokens Fluent (`tokens.colorBrandBackground` = `#0F6CBD`) pour s'intégrer à Microsoft 365.
- La couleur **Gr33t** (`#4387F4`) est réservée à l'identité de l'add-in : icônes PNG du bouton ruban.

### Office.js et React

React doit impérativement être monté **à l'intérieur du callback `Office.onReady()`**, jamais au top-level :

```tsx
Office.onReady(() => {
  const root = createRoot(document.getElementById("container")!);
  root.render(<App />);
});
```

---

## Prochaines étapes

- **Phase 3** : Déploiement sur Azure Static Web Apps
- **Phase 4** : App Registration Azure AD + AuthService (SSO + MSAL fallback)
- **Phase 5** : Client Microsoft Graph + hook `useGraphData`
- **Phase 6** : Moteur de calcul des 4 facteurs + tests unitaires
- **Phase 7** : Stockage local `roamingSettings` + cache-then-refresh
- **Phase 8-9** : Tests end-to-end, packaging et déploiement pilote
