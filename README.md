# Communauté Le Revenu

Application de discussion construite avec Next.js et Strapi 5. Les actions communautaires (publications, réactions, vues, réponses, points, sondage et espaces suivis) sont enregistrées dans Strapi.

## Démarrage local

1. Renseigner les variables requises dans `.env` à partir de la configuration de l’environnement. Ne jamais publier ce fichier ni ses secrets.
2. Démarrer les services depuis la racine du dépôt :

   ```sh
   docker compose up --build
   ```

3. Ouvrir le frontend sur [http://localhost:3000](http://localhost:3000) et l’administration Strapi sur [http://localhost:1337/admin](http://localhost:1337/admin).

Le navigateur utilise `NEXT_PUBLIC_STRAPI_URL` pour joindre Strapi. Les requêtes Next.js exécutées côté serveur utilisent `STRAPI_INTERNAL_URL` (dans Docker, `http://strapi:1337`; en local sans Docker, le défaut est `http://localhost:1337`). `FRONTEND_URL` définit l’origine autorisée par CORS (défaut `http://localhost:3000`).

Les nouveaux schémas sont appliqués au démarrage de Strapi. Le bootstrap crée le sondage d’exemple uniquement si aucun sondage n’existe déjà. Les comptes communautaires sont authentifiés via le compte Le Revenu; aucune inscription locale distincte n’est ajoutée.

Les compteurs de vues et de mentions « Utile » sont rattachés au `documentId` Strapi de la discussion ou de la réponse. Au démarrage, Strapi réassocie les anciens likes à leur document depuis leur clé unique puis resynchronise les compteurs ; redémarrer Strapi après déploiement pour appliquer cette réparation des données existantes.

## Activer les permissions Strapi

Dans **Settings → Users & Permissions Plugin → Roles**, configurer les rôles **Public** et **Authenticated**. Les actions des routes personnalisées apparaissent dans la section **Community** après le redémarrage de Strapi avec le code à jour.

### Rôle Public

Activer uniquement les lectures nécessaires au contenu consultable sans compte :

- **Category** : `find`, `findOne`
- **Discussion** : `find`, `findOne`
- **Reply** : `find`, `findOne`

Le comptage des vues et le classement sont publics par configuration de route (`auth: false`) :

- `POST /api/community/discussions/:documentId/views`
- `GET /api/community/leaderboard`

### Rôle Authenticated

Activer les actions suivantes :

- **Category** : `find`, `findOne`
- **Discussion** : `find`, `findOne`, `create`, `getLikeState`, `toggleLike`, `chooseBestAnswer`
- **Reply** : `find`, `findOne`, `create`
- **Community Point** : `dailyVisit`, `me`
- **Community Poll** : `myVote`, `vote`, `myInterests`, `updateMyInterests`

Les réactions et le vote contrôlent l’identité à partir du JWT côté serveur. Ne pas activer les endpoints CRUD génériques `Community Like`, `Community Point` ou `Community Vote` pour les rôles Public/Authenticated : les écritures passent par les contrôleurs qui vérifient les relations, l’unicité et les points attribués.

Après avoir changé les permissions, enregistrer le rôle puis vérifier les endpoints avec un navigateur déconnecté et un compte membre.

## APIs communautaires

Les réponses sont JSON. Les identifiants `:documentId` sont les `documentId` Strapi, pas les identifiants numériques.

| Méthode | Route | Accès | Comportement |
|---|---|---|---|
| `GET` | `/api/categories` | Public | Espaces disponibles |
| `GET` | `/api/discussions` | Public | Fil, recherche/filtrage et pagination Strapi |
| `GET` | `/api/replies` | Public | Réponses consultables |
| `POST` | `/api/discussions` | Membre | Crée une discussion et crédite **5 points** à son auteur |
| `POST` | `/api/replies` | Membre | Crée une réponse et crédite **3 points** à son auteur |
| `POST` | `/api/community/discussions/:documentId/views` | Public | Incrémente le compteur de vues |
| `GET` | `/api/community/:targetType/:documentId/like-state` | Membre | Lit le nombre de mentions « Utile » et l’état du membre |
| `POST` | `/api/community/:targetType/:documentId/like` | Membre | Active/désactive « Utile » sur une discussion ou une réponse ; un premier « Utile » reçu crédite **5 points** à l’auteur |
| `POST` | `/api/community/discussions/:documentId/best-answer/:replyDocumentId` | Auteur de la question | Choisit l’unique meilleure réponse et crédite **20 points** à son auteur |
| `POST` | `/api/community/daily-visit` | Membre | Crédite au plus **1 point par jour** au membre connecté |
| `GET` | `/api/community/me/points` | Membre | Retourne `totalPoints` et `monthlyPoints` |
| `GET` | `/api/community/leaderboard?period=month\|all` | Public | Classement mensuel ou total |
| `GET` | `/api/community/polls/active` | Public | Sondage actif et résultats (consultables après le vote) |
| `GET` | `/api/community/polls/:documentId/my-vote` | Membre | Lit le choix déjà enregistré pour ce sondage |
| `POST` | `/api/community/polls/:documentId/vote` | Membre | Enregistre ou modifie le vote et crédite **1 point** une seule fois par membre et sondage |
| `GET` | `/api/community/me/interests` | Membre | Espaces suivis du profil |
| `PUT` | `/api/community/me/interests` | Membre | Remplace les espaces suivis; les slugs sont validés côté serveur |

### Règles des points

Les événements de points sont conservés dans `Community Point`, avec une clé d’action unique. Le total est mis à jour côté serveur et ne peut pas être fourni par le navigateur. Les barèmes appliqués sont : réponse `+3`, discussion `+5`, premier « Utile » reçu `+5`, meilleure réponse `+20`, vote au sondage `+1`, visite quotidienne `+1`.

### Gérer le sondage

Dans **Content Manager → Community Poll**, créer un sondage avec un titre et `options` sous la forme d’un tableau JSON, par exemple :

```json
[
  { "label": "Assurance-vie" },
  { "label": "Actions / PEA" }
]
```

Activer `active` pour le rendre visible. Un seul sondage doit être actif à la fois. Les visiteurs peuvent voir la question; les membres connectés peuvent voter, modifier leur choix et consulter les résultats. Un seul point est attribué au premier vote. Les résultats sont calculés à partir des votes enregistrés; ne pas modifier ou supprimer les entrées `Community Vote` pour des membres individuels depuis l’interface publique.

## Fonctionnalités qui restent hors API

Les liens vers le magazine et les actualités redirigent vers le site du Revenu. Le bloc « Le Revenu répond » est un agenda indicatif statique : aucune API événement ni inscription n’existe encore. Les billets des membres n’ont pas encore de modèle/API Strapi. Les centres d’intérêt sont persistés sur le profil Strapi, mais le fil n’est pas encore personnalisé selon ces préférences.

## Vérifications

Depuis la racine du dépôt :

```sh
npm --prefix frontend run lint
npm --prefix frontend run build
```

Le backend est typé avec TypeScript; exécuter le contrôle de type dans `backend` après toute modification de contrôleur ou de schéma :

```sh
npx tsc --noEmit --incremental false
```
