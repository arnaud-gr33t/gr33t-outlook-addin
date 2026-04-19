# Calcul de l'Indice de Récupération Active (IRA) — v1.1

> Version 1.1 — 19 avril 2026  
> Précise la v1.0 avec arbitrages implémentation : pseudocodes, cas limites, stockage, affichage dashboard.  
> Change log en fin de document.

---

## Vue d'ensemble

L'Indice de Récupération Active (IRA) mesure la capacité d'un collaborateur à maintenir sa performance dans la durée grâce à ses pratiques de récupération active. Il s'inspire des principes d'entraînement des athlètes de haut niveau : la performance dépend autant de l'effort que de la récupération.

---

## Formule principale

```
IRA = round( 0.30 × Transitions + 0.30 × Concentration
           + 0.25 × Horaires     + 0.15 × Focus )
```

- Chaque facteur est un pourcentage 0–100.
- Résultat sur 0–100, arrondi à l'entier le plus proche.

---

## Périodes de référence

| Granularité | Définition | Usage |
|---|---|---|
| **Score journalier** | Un jour calendaire (00:00–23:59) | Source unique de vérité, persisté par l'addin |
| **Score hebdomadaire** | Moyenne arithmétique des 5 scores journaliers d'une semaine ouvrée (lun–ven) | Header "Semaine S-1 / S" du dashboard |
| **IRA 30 jours** | Moyenne arithmétique des 30 derniers scores journaliers **calendaires** (weekends inclus) | Carte IRA du dashboard ; valeur "officielle" de l'indicateur |

**Règle générale** : chaque facteur et l'IRA sont d'abord calculés **jour par jour**, puis agrégés par moyenne.

### Statut des week-ends

- **Transitions, Concentration, Focus** : score journalier fixé à **100** le samedi et le dimanche (ces facteurs n'ont pas de sens en dehors des plages usuelles de travail).
- **Horaires** : le week-end a une plage usuelle vide → **toute activité** samedi ou dimanche fait basculer le jour en "débordement" → score Horaires = 0. Un week-end **sans activité** = "jour sans débordement" → score Horaires = 100.

---

## Détail des facteurs

### 1. Transitions préservées (poids 30 %)

**Définition** : pourcentage de réunions entourées d'au moins 10 min de plage libre (avant **OU** après).

**Plage libre** = aucune réunion et aucun **envoi** de mail (chat exclu en v1) dans l'intervalle de 10 min.

#### Pseudocode (score journalier)

```
meetings = réunions du jour dans [08:00, 18:30]
if meetings.isEmpty():
    return 100   // rien à transitionner → pas de stress

ok = 0
for m in meetings:
    is_first = (m == meetings[0])
    is_last  = (m == meetings[last])
    has_before = is_first OR no_activity_in( m.start - 10min, m.start )
    has_after  = is_last  OR no_activity_in( m.end, m.end + 10min )
    if has_before OR has_after:
        ok += 1

return (ok / meetings.count) × 100
```

Où `no_activity_in(a, b)` = aucune réunion ET aucun **envoi** mail dans [a, b].

#### Cas limites

| Cas | Règle |
|---|---|
| 1re réunion de la journée | Transition **avant** = **toujours OK** (bord de plage) |
| Dernière réunion de la journée | Transition **après** = **toujours OK** (bord de plage) |
| Journée sans aucune réunion | Score = **100** |
| Week-end | Score = **100** (par convention, cf. ci-dessus) |

**Fondement** : 70 % des collaborateurs ressentent une fatigue accrue après 3 h de réunions enchaînées (Ipsos-Lecko). Sans transition, le cerveau n'a pas le temps de récupérer.

---

### 2. Plages de concentration (poids 30 %)

**Définition** : pourcentage du temps de travail hors-réunion passé en plages continues ≥ 2 h sans interruption.

**Fenêtre de travail du jour** :
```
start = max( premier_envoi_ou_début_réunion, 08:00 )
end   = min( dernier_envoi_ou_fin_réunion,   18:30 )
```
Les envois effectués en débordement (avant 08:00 ou après 18:30) sont **ignorés** pour ce facteur (ils comptent uniquement pour Horaires).

**Interruption** = un envoi de mail **ou** le début d'une réunion. Les réceptions ne comptent pas.

**Plage de concentration** = intervalle de temps sans réunion et sans envoi, de durée ≥ 2 h.

#### Pseudocode (score journalier)

```
(start, end) = fenêtre_de_travail_du_jour()
meetings = réunions du jour ∩ [start, end]
sends    = envois mail du jour ∩ [start, end]

if end ≤ start:
    return 100   // pas de travail ce jour

// Temps disponible hors réunions
time_off_meetings = (end - start) - Σ durée(meetings)

// Segmentation : cut-points = bornes de réunions + envois mail
cut_points = [start] ∪ {m.start, m.end for m in meetings} ∪ {s.time for s in sends} ∪ [end]
ordered_cuts = sort(cut_points)

// Pour chaque intervalle hors réunion ≥ 2h → compte comme plage de concentration
focus_time = 0
for each (a, b) in paires consécutives de ordered_cuts:
    if (a, b) n'est pas à l'intérieur d'une réunion
    and (b - a) ≥ 2h:
        focus_time += (b - a)

if time_off_meetings == 0:
    return 100
return (focus_time / time_off_meetings) × 100
```

#### Cas limites

| Cas | Règle |
|---|---|
| Jour sans activité | Score = **100** (rien à fragmenter) |
| Fenêtre < 2 h | Score = **0** (aucune plage ≥ 2 h possible) |
| Activité en débordement avant 8h / après 18h30 | **Ignorée** pour Concentration |
| Week-end | Score = **100** (cf. statut week-end) |

**Fondement** : notre mémoire de travail ne peut manipuler que 7 ± 2 informations. Chaque changement de tâche fragmente la concentration.

---

### 3. Respect des horaires (poids 25 %)

**Définition — binaire** : un jour est soit "en débordement" (score 0), soit "sans débordement" (score 100).

**Débordement** = au moins un envoi de mail ou une réunion **en dehors** de `[08:00, 18:30]`.

#### Pseudocode (score journalier)

```
def horaires_score_day(day):
    if day.weekday() in (SAT, SUN):
        if aucune_activité(day):
            return 100        // week-end calme
        else:
            return 0          // toute activité weekend = débordement

    activities = mails_envoyés(day) ∪ réunions(day)
    for a in activities:
        if a.start < 08:00 or a.end > 18:30:
            return 0

    return 100
```

#### Cas limites

| Cas | Règle |
|---|---|
| Semaine sans aucune activité | Chaque jour = 100 (rien à pénaliser) |
| Samedi à 14 h : 1 mail envoyé | Score = **0** (pas de plage usuelle le week-end) |
| Réunion 17 h → 19 h | Score = **0** (fin > 18:30) |
| Mail envoyé à 07:55 | Score = **0** (début < 08:00) |
| Activité exactement à 18:30 | **Limite incluse** : `≤ 18:30` = OK. Convention : seuil strict, activité *à* 18:30 = dernière seconde OK. |

**Fondement** : notre charge cognitive diminue grâce aux temps de détente déconnectés de l'activité professionnelle. Repenser au travail rompt la phase de régénération.

---

### 4. Focus en réunion (poids 15 %)

**Définition** : pourcentage de réunions sans envoi de mail pendant leur durée.

**Réunion** (en v1) = événement calendrier avec `isAllDay=false`, `showAs≠free`, `attendees.count ≥ 1` (au moins 1 autre participant).

**Aucune tolérance** : dès **1** mail envoyé pendant la réunion → réunion KO.

#### Pseudocode (score journalier)

```
meetings = réunions du jour (filtrage ci-dessus)
if meetings.isEmpty():
    return 100

ok = 0
for m in meetings:
    sends = mails envoyés dans [m.start, m.end]
    if sends.isEmpty():
        ok += 1

return (ok / meetings.count) × 100
```

#### Cas limites

| Cas | Règle |
|---|---|
| Jour sans réunion | Score = **100** |
| Réunion de 15 min | Même règle (pas de tolérance proportionnelle) |
| Chat envoyé pendant la réunion | **Ignoré en v1** (support chat prévu en v1.x+) |
| Mail envoyé exactement à `m.start` | Compte comme "pendant la réunion" (égalité incluse) |
| Week-end | Score = **100** |

**Fondement** : envoyer des mails pendant une réunion fragmente l'attention ; le multitâche dépasse rapidement les capacités du cerveau, créant du bruit organisationnel.

---

## Agrégation — du journalier à l'IRA affiché

### 1. Score journalier (source unique de vérité)

```
iraScoreDaily = round( 0.30 × Transitions_day + 0.30 × Concentration_day
                     + 0.25 × Horaires_day    + 0.15 × Focus_day )
```

### 2. Score hebdomadaire (lun-ven)

```
IRA_hebdo(semaine)       = moyenne( iraScoreDaily[lun..ven] )
Transitions_hebdo(sem.)  = moyenne( Transitions_day[lun..ven] )
… idem pour les 3 autres facteurs
```

Chaque facteur hebdo est la moyenne des facteurs journaliers de la même semaine (pas un recalcul global).

### 3. IRA 30 jours (indicateur principal affiché)

```
IRA_30j(today) = moyenne( iraScoreDaily[today-29 .. today] )   // 30 jours calendaires
```

Weekends inclus (avec leurs scores 100 ou pénalisés via Horaires, voir règles).

### 4. Variation Δ

```
delta(today) = IRA_30j(today) - IRA_30j(today - 7)
```

---

## Mapping dashboard → calcul

| Élément du dashboard | Valeur calculée |
|---|---|
| **Carte IRA — chiffre central** | `IRA_30j(today)` |
| **Carte IRA — libellé qualitatif** | Selon échelle d'interprétation (voir plus bas) |
| **Carte IRA — Δ** | `delta(today)` (arrondi entier, signé) |
| **Header "Semaine passée · S-1"** | `IRA_hebdo(S-1)` — label "IRA S-1" |
| **Header "Cette semaine · S"** | `delta(today)` (même chiffre que la carte) — label "vs S-1" |
| **Header "Semaine à venir · S+1"** | **Pas de score IRA calculé.** Afficher uniquement le **nombre de réunions planifiées** S+1 (ex: "12 réunions") |
| **Leviers (4 barres bipolaires)** | `Transitions_30j / Concentration_30j / Horaires_30j / Focus_30j`, où `X_30j = moyenne(X_day, 30 derniers jours)` |

**Note v1** : la projection chiffrée S+1 de la maquette (72) est **abandonnée**. On n'attribue pas de score IRA aux jours futurs (hypothèses trop fragiles).

---

## Échelle d'interprétation

| IRA 30j | Niveau | Couleur | Recommandation |
|---|---|---|---|
| **70–100** | Excellente capacité de récupération | 🟢 Vert | Maintenir les bonnes pratiques |
| **50–69** | Capacité modérée | 🟠 Orange | Appliquer 1-2 conseils prioritaires |
| **0–49** | Capacité faible — zone de risque | 🔴 Rouge | Action urgente — risque d'épuisement |

**Alertes** :
- `IRA_30j < 50` pendant 3 semaines consécutives → dégradation prolongée
- `IRA_30j < 40` → alerte critique, recommandation d'échange manager/RH

---

## Stockage & rafraîchissement

### Stockage (déjà en place, à enrichir)

L'addin écrit un événement **all-day** quotidien dans le calendrier `Gr33t Recovery` avec un `openTypeExtension` nommé `com.gr33t.recovery` portant :

```json
{
  "date": "2026-04-14",
  "scoreIRA": 72,
  "factors": {
    "transitions": 65,
    "concentration": 58,
    "horaires": 100,
    "focus": 80
  },
  "focusBlocks":     [...],
  "overtimeEvents":  [...],
  "meetings":        [...]
}
```

**Enrichissement v1.1** : ajout du bloc `factors` dans l'extension existante (jusqu'ici seul `scoreIRA` était structuré).

### Rafraîchissement — calcul côté addin

- **Quand** : à l'ouverture du dashboard et à chaque nouveau jour détecté (minuit local).
- **Comment** : l'addin lit les 30 derniers événements all-day du calendrier Gr33t Recovery (1 seule requête Graph avec `$top=40`) → hydrate les scores journaliers → calcule les moyennes 30j / hebdo en mémoire.
- **Cache** : résultat mis en cache `localStorage` avec clé `gr33t.ira.30j.{date}` (invalidé chaque jour).
- **Écriture** : si un jour ≤ J-1 n'a pas encore d'événement all-day, l'addin le calcule depuis `/me/calendarView` (réunions) + `/me/mailFolders/SentItems/messages` (envois) et l'écrit.

**Pas de backend serveur en v1**. Migration possible vers Azure Function si la charge augmente.

---

## Sources de données (Microsoft Graph)

| Facteur | Données requises | Endpoint | Scope |
|---|---|---|---|
| Transitions | Réunions du jour (bornes) | `/me/calendarView` | `Calendars.Read` |
| Concentration | Réunions + envois mails | `/me/calendarView`, `/me/mailFolders/SentItems/messages` | `Calendars.Read`, `Mail.ReadBasic` |
| Horaires | Réunions + envois mails + bornes horaires | idem ci-dessus | idem |
| Focus | Réunions + envois mails pendant la réunion | idem ci-dessus | idem |

**v1 : chat exclu**. Les scopes `Chat.ReadBasic` / `ChatMessage.Read` seront ajoutés en v1.x+.

**Scope Mail.ReadBasic** : retourne uniquement les headers (from, to, subject, timestamps) — suffisant pour détecter un envoi et son horodatage, sans exposer le contenu.

---

## Exemple numérique complet (corrigé)

### Semaine du 14-18 avril 2026 — scores journaliers

| Jour | Transitions | Concentration | Horaires | Focus | IRA journalier |
|---|---|---|---|---|---|
| Lun 14 | 80 | 60 | 100 | 100 | `.30×80 + .30×60 + .25×100 + .15×100 = 82` |
| Mar 15 | 50 | 40 | 100 | 75 | `.30×50 + .30×40 + .25×100 + .15×75 = 63` |
| Mer 16 | 100 | 80 | 100 | 100 | `95` |
| Jeu 17 | 60 | 50 | 0 | 100 | `.30×60 + .30×50 + .25×0 + .15×100 = 48` |
| Ven 18 | 70 | 60 | 100 | 80 | `.30×70 + .30×60 + .25×100 + .15×80 = 76` |

**Score hebdo S** :
```
IRA_hebdo(S)        = (82 + 63 + 95 + 48 + 76) / 5  = 72.8 → 73
Transitions_hebdo   = (80+50+100+60+70)/5           = 72
Concentration_hebdo = (60+40+80+50+60)/5            = 58
Horaires_hebdo      = (100+100+100+0+100)/5         = 80
Focus_hebdo         = (100+75+100+100+80)/5         = 91
```

### IRA 30 jours

Sur les 30 derniers jours calendaires (18 mars → 16 avril 2026), supposons :
```
scores journaliers = [65, 70, 68, ..., 82, 63, 95, 48, 76]     // 30 valeurs
moyenne                                                         = 65

→ Carte IRA affiche : 65 (Capacité modérée)
```

### Delta

```
IRA_30j(16 avril) = 65
IRA_30j(9 avril)  = 66
delta = 65 - 66 = -1 pt    → "Δ−1 pt vs semaine dernière"
```

---

## Conformité RGPD et confidentialité

(identique à v1.0)

1. **Données individuelles uniquement** : visibles uniquement par l'utilisateur
2. **Partage limité** : seul l'IRA global peut être partagé avec le manager
3. **Consentement explicite** : l'utilisateur active le calcul
4. **Droit à l'effacement** : suppression complète possible à tout moment
5. **Transparence** : formule documentée et accessible
6. **Stockage** : dans le calendrier Outlook de l'utilisateur (tenant M365 Europe) — aucune donnée ne sort du périmètre Microsoft 365 du collaborateur en v1

---

## Évolutions prévues

### v1.2
- Intégration des **chats** (mails+chats pour Concentration/Horaires/Focus)
- Détection "journée saine" (IRA journalier ≥ 70) pour encouragement positif

### v1.3
- Facteur "Pause méridienne" (détection plage 12h-14h sans activité)

### v2.0
- Pondération adaptative par profil (manager vs contributeur)
- Intégration Viva Insights
- Patterns individuels (rythme circadien)
- Projection chiffrée S+1 si un modèle prédictif robuste est validé

---

## Changelog v1.0 → v1.1

| § | Changement |
|---|---|
| Horaires — formule | **Binaire** (0 ou 100) au lieu de demi-journées ambiguës |
| Horaires — week-end | Toute activité samedi/dimanche = débordement (score 0) |
| Transitions — bord de plage | 1re réunion : transition avant OK par défaut ; dernière réunion : transition après OK par défaut |
| Concentration — fenêtre | Précisée : `[max(first,08:00), min(last,18:30)]`, envois en débordement ignorés |
| Focus | Tolérance 2 min **supprimée** (aucune tolérance) |
| Chat | **Exclu en v1**, ré-intégration v1.2 |
| Agrégation | IRA affiché = **moyenne 30 derniers jours calendaires** (pas "semaine" comme en v1.0) |
| Projection S+1 | **Supprimée**. Remplacée par "nb réunions planifiées" |
| Rafraîchissement | Côté **addin** (pas backend) |
| Stockage | Extension `com.gr33t.recovery` enrichie avec bloc `factors` |
| Scopes Graph | `Mail.ReadBasic` au lieu de `Mail.Read` ; `Chat.Read` retiré |
| Pseudocode | Ajouté pour chaque facteur |
| Cas limites | Nouvelle section par facteur |
| Exemple numérique | Corrigé (incohérence Horaires) |

---

**Document version** : 1.1  
**Date** : 19 avril 2026  
**Auteur** : Arnaud Rayrole + arbitrages v1.1
