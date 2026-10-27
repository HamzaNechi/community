# Communauté Le Revenu

**Communauté Le Revenu** est une application web de discussion communautaire développée à partir d’une maquette HTML statique et modernisée avec une architecture full-stack basée sur Next.js et Strapi. Elle permet aux utilisateurs de consulter des catégories, de participer à des discussions et de publier des réponses, avec une gestion centralisée des contenus, des utilisateurs et des permissions.

Le projet utilise **Next.js 16** pour le frontend, **Strapi v5** pour le backend et **PostgreSQL 15** pour la persistance des données. L’ensemble des services est orchestré avec Docker Compose afin de simplifier l’installation, le développement et la préparation au déploiement.

## Table des matières

- [Architecture](#architecture)
- [Modèle de données Strapi](#modèle-de-données-strapi)
- [Fonctionnalités communautaires et API](#fonctionnalités-communautaires-et-api)
- [Structure du dépôt](#structure-du-dépôt)
- [Prérequis](#prérequis)
- [Configuration centralisée : un seul `.env`](#configuration-centralisée--un-seul-env)
- [Lancement du projet](#lancement-du-projet)
- [Accès aux services](#accès-aux-services)
- [Comptes de démonstration](#comptes-de-démonstration)
- [Seeding automatique](#seeding-automatique)
- [Choix techniques](#choix-techniques)
- [Stratégie de déploiement et CI/CD](#stratégie-de-déploiement-et-cicd)
- [Tests](#tests)
- [Dépannage](#dépannage)
- [Licence](#licence)

## Architecture

### Vue d'ensemble

L'application repose sur une architecture en couches. Next.js gère l'interface utilisateur et les interactions, Strapi expose l'API REST et centralise la logique métier, tandis que PostgreSQL assure le stockage persistant des données. Les réactions, vues, votes et événements de points sont également conservés dans Strapi.

```text
                    ┌─────────────────────────┐
                    │       Navigateur        │
                    │     Interface Web       │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │        Next.js 16       │
                    │       App Router        │
                    ├─────────────────────────┤
                    │  Server Components      │
                    │  - Rendu côté serveur   │
                    │  - Appels API internes  │
                    │  - Chargement données   │
                    │                         │
                    │  Client Components      │
                    │  - Interactions UI      │
                    │  - Formulaires          │
                    │  - État local           │
                    └────────────┬────────────┘
                                 │
                            API REST
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │         Strapi v5       │
                    │  Controllers / Services │
                    │  Lifecycles / Permissions│
                    │  Authentification       │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │       PostgreSQL 15     │
                    │     Base de données     │
                    └─────────────────────────┘
```

### Responsabilités des composants

| Composant | Responsabilité |
|---|---|
| Navigateur | Affichage de l'application et interactions utilisateur. |
| Next.js Server Components | Rendu côté serveur, récupération des données et préparation des pages. |
| Next.js Client Components | Gestion des interactions, formulaires, événements et état de l'interface. |
| Strapi v5 | API REST, logique métier, authentification, permissions et validation des opérations. |
| PostgreSQL 15 | Stockage persistant des utilisateurs, catégories, discussions et réponses. |
| Docker Compose | Orchestration et communication entre les quatre services. |
| pgAdmin 4 | Administration graphique de PostgreSQL. |

### Règles d'architecture

- **Next.js ne communique jamais directement avec PostgreSQL.** Tous les accès aux données passent par l'API Strapi.
- **Strapi centralise la logique métier.** Les controllers gèrent les requêtes HTTP, les services portent les opérations métier, les lifecycles permettent d'intervenir lors des événements du cycle de vie des contenus et les permissions contrôlent les opérations autorisées.
- **Les Server Components** sont privilégiés pour récupérer les données et générer les pages côté serveur.
- **Les Client Components** sont utilisés uniquement lorsque l'interface nécessite des interactions côté navigateur.
- Les secrets du backend ne doivent jamais être exposés au navigateur.
- La communication interne entre les services Docker utilise les noms DNS des conteneurs.

## Modèle de données Strapi

Le backend repose sur les Content Types `Category`, `Discussion`, `Reply`, `Community Like`, `Community Point`, `Community Poll` et `Community Vote`, ainsi que sur les utilisateurs du plugin Users & Permissions.

### Content Types principaux

| Content Type | Champs principaux | Relations et rôle |
|---|---|---|
| `Category` | `name`, `slug`, `description` | Une catégorie regroupe plusieurs discussions ; les slugs sont utilisés pour enregistrer les centres d’intérêt. |
| `Discussion` | `title`, `content`, `type`, `views`, `likes`, `documentId` | Appartient à une catégorie et à un auteur ; possède des réponses et éventuellement une meilleure réponse. |
| `Reply` | `content`, `likes`, `documentId` | Appartient à une discussion et à un auteur. |
| `Community Like` | `targetKey`, `targetType`, `targetDocumentId`, `active` | Réaction d'un utilisateur sur une discussion ou une réponse. `targetDocumentId` rattache la réaction au document Strapi concerné. |
| `Community Point` | `actionKey`, `points` | Événement de points lié à un utilisateur. La clé unique empêche d'attribuer deux fois les points d'une même action. |
| `Community Poll` | `title`, `options`, `active` | Sondage administrable dans Strapi ; les options sont un tableau JSON de libellés. |
| `Community Vote` | `voteKey`, `optionIndex` | Vote unique d'un utilisateur pour un sondage ; le choix peut être modifié. |
| `User` | `username`, `email`, `password`, `confirmed`, `blocked`, `totalPoints`, `communityInterests` | Utilisateur du plugin Users & Permissions ; peut publier et conserve ses points et ses centres d’intérêt. |

> Les champs techniques de Strapi, tels que `id`, `documentId`, `createdAt` et `updatedAt`, sont gérés par le framework selon le type de contenu et sa configuration. Le modèle utilisateur repose sur le plugin Users & Permissions de Strapi.

### Relations

```text
Category (1) ─────────── (N) Discussion
                              │
                              │ (1)
                              ▼
                            Category

User (1) ─────────────── (N) Discussion
User (1) ─────────────── (N) Reply

Discussion (1) ───────── (N) Reply
User (1) ─────────────── (N) Community Like
User (1) ─────────────── (N) Community Point
User (1) ─────────────── (N) Community Vote
Community Poll (1) ───── (N) Community Vote
```

- Une catégorie regroupe plusieurs discussions.
- Une discussion appartient à une catégorie.
- Une discussion est créée par un utilisateur.
- Une discussion peut recevoir plusieurs réponses.
- Chaque réponse appartient à une discussion et possède un auteur.
- Les réactions sont rattachées à un `documentId` de discussion ou de réponse.
- Les points sont stockés sous forme d'événements uniques par action.
- Les votes relient un utilisateur à un sondage et à l'index de l'option choisie.
- Les permissions déterminent qui peut consulter, créer, modifier ou supprimer ces contenus.

## Fonctionnalités communautaires et API

Le frontend Next.js consomme les routes REST de Strapi. Les routes de contenu retournent les données consultables ; les routes personnalisées appliquent les règles métier pour les réactions, les vues, le sondage et les points. Les identifiants de publication dans les routes sont les `documentId` Strapi, et non les IDs numériques internes.

### Fonctionnalités disponibles

| Fonctionnalité | Comportement |
|---|---|
| Discussions | Consultation du fil, filtrage par espace, recherche, tri par tendances/récence/sans réponse et pagination de 10 discussions par page. |
| Publications et réponses | Un membre connecté peut créer une discussion ou répondre à une discussion existante. |
| Mentions « Utile » | Un membre connecté peut activer ou retirer sa réaction sur une discussion ou une réponse. Il ne peut pas réagir à sa propre publication. Un compteur distinct est maintenu pour chaque document. |
| Vues | L'ouverture de la page détail incrémente le compteur de vues de la discussion. Il s'agit d'un compteur de consultations, pas de visiteurs uniques. |
| Meilleure réponse | L'auteur d'une question peut choisir une seule réponse comme meilleure réponse. |
| Points et classement | Les points sont enregistrés côté Strapi et alimentent les totaux du profil et les classements mensuel et général. |
| Sondage | Le sondage actif et ses résultats sont consultables ; un membre connecté peut voter et modifier son choix. |
| Centres d’intérêt | Les slugs des espaces suivis sont lus et enregistrés dans le profil du membre. Ils ne personnalisent pas encore le fil d'actualité. |

### Barème des points

| Action | Points | Règle |
|---|---:|---|
| Créer une discussion | +5 | Une seule attribution par discussion. |
| Publier une réponse | +3 | Une seule attribution par réponse. |
| Recevoir une mention « Utile » | +5 | Attribution unique par membre et publication ; retirer puis remettre la réaction ne redonne pas de points. |
| Choisir une meilleure réponse | +20 | Attribués à l'auteur de la réponse choisie. |
| Voter au sondage | +1 | Une seule attribution par membre et sondage, même si le vote est modifié. |
| Visite quotidienne | +1 | Une attribution par jour, selon le fuseau horaire `Europe/Paris`. |

### Routes REST

Toutes les routes sont préfixées par `http://localhost:1337` en développement local. Pour les requêtes authentifiées, envoyer le JWT dans `Authorization: Bearer <JWT>`.

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `GET` | `/api/categories` | Public | Liste les espaces/catégories. |
| `GET` | `/api/discussions` | Public | Liste les discussions ; accepte les paramètres Strapi de filtre, tri, pagination et `populate`. |
| `GET` | `/api/replies` | Public | Liste les réponses consultables. |
| `POST` | `/api/discussions` | Authenticated | Crée une discussion au nom du membre connecté ; les points sont calculés côté serveur. |
| `POST` | `/api/replies` | Authenticated | Crée une réponse au nom du membre connecté ; les points sont calculés côté serveur. |
| `POST` | `/api/community/discussions/:documentId/views` | Public | Incrémente les vues de la discussion visée. |
| `GET` | `/api/community/:targetType/:documentId/like-state` | Authenticated | Retourne le compteur et l'état de réaction du membre (`targetType`: `discussion` ou `reply`). |
| `POST` | `/api/community/:targetType/:documentId/like` | Authenticated | Active ou retire une réaction sur le document ciblé. |
| `POST` | `/api/community/discussions/:documentId/best-answer/:replyDocumentId` | Auteur de la question | Choisit la meilleure réponse de cette discussion. |
| `POST` | `/api/community/daily-visit` | Authenticated | Enregistre la visite quotidienne et attribue le point si celui-ci n'a pas déjà été gagné ce jour-là. |
| `GET` | `/api/community/me/points` | Authenticated | Retourne `totalPoints` et `monthlyPoints` du membre connecté. |
| `GET` | `/api/community/leaderboard?period=month` | Public | Classement du mois courant ; utiliser `period=all` pour le classement général. |
| `GET` | `/api/community/polls/active` | Public | Retourne le sondage actif et les résultats agrégés. |
| `GET` | `/api/community/polls/:documentId/my-vote` | Authenticated | Retourne l'option sélectionnée par le membre connecté ou `null`. |
| `POST` | `/api/community/polls/:documentId/vote` | Authenticated | Enregistre ou modifie le vote. Corps JSON : `{"optionIndex": 0}`. |
| `GET` | `/api/community/me/interests` | Authenticated | Retourne les slugs des espaces suivis. |
| `PUT` | `/api/community/me/interests` | Authenticated | Remplace les espaces suivis. Corps JSON : `{"interests":["bourse","retraite"]}`. |

### Permissions à configurer dans Strapi

Dans **Settings → Users & Permissions Plugin → Roles**, configurer les rôles `Public` et `Authenticated`. Les noms ci-dessous correspondent aux actions des controllers Strapi ; vérifier la liste après redémarrage du backend.

**Rôle Public :**

- `Category` : `find`, `findOne`
- `Discussion` : `find`, `findOne`
- `Reply` : `find`, `findOne`

Le comptage des vues, le classement public et la lecture du sondage actif sont configurés avec `auth: false` dans leurs routes personnalisées.

**Rôle Authenticated :**

- `Category` : `find`, `findOne`
- `Discussion` : `find`, `findOne`, `create`, `getLikeState`, `toggleLike`, `chooseBestAnswer`
- `Reply` : `find`, `findOne`, `create`
- `Community Point` : `dailyVisit`, `me`
- `Community Poll` : `myVote`, `vote`, `myInterests`, `updateMyInterests`

Ne pas activer les opérations CRUD génériques d'écriture sur `Community Like`, `Community Point` ou `Community Vote` pour les rôles Public et Authenticated. Les routes métier vérifient l'utilisateur connecté, les relations et les points attribués. Les actions comme « choisir une meilleure réponse » appliquent aussi leurs propres contrôles de propriété.

### Gérer le sondage dans l'administration

Dans **Content Manager → Community Poll**, créer un sondage avec un titre, `active` à `true` et au moins deux options au format JSON :

```json
[
  { "label": "Assurance-vie" },
  { "label": "Bourse" },
  { "label": "Immobilier" }
]
```

Le frontend utilise le sondage actif le plus récemment créé. Désactiver l'ancien sondage avant d'en activer un nouveau afin qu'un seul sondage soit actif à la fois. Les votes sont liés au compte membre et peuvent être modifiés ; le point de participation n'est attribué qu'une fois par membre et sondage.

### Initialisation et réparation des compteurs

Au démarrage, Strapi initialise les anciens compteurs de vues/likes nuls et resynchronise les likes actifs enregistrés avec les compteurs correspondants. Les compteurs de likes et de vues sont associés au `documentId` visé afin qu'une réaction ou une consultation ne modifie pas une autre discussion.

Après mise à jour des schémas ou du code du backend, redémarrer Strapi pour appliquer le schéma et exécuter la synchronisation. Cette opération ne nécessite pas de supprimer le volume PostgreSQL.

### Éléments de la maquette qui restent indicatifs

Les éléments ci-dessous ne sont pas reliés à des fonctionnalités métier persistantes :

- « Le Revenu répond » est un agenda indicatif, sans gestion réelle d'événements ou d'inscriptions.
- Les billets de membres et les actualités d'exemple ne constituent pas une publication de blog interne.
- Les valeurs de présentation de certains espaces et du bandeau d'accueil ne sont pas des statistiques calculées par les APIs.
- Les centres d'intérêt enregistrés ne personnalisent pas encore les discussions affichées.
- Les badges visuels ne reposent pas sur un système d'attribution automatique.
- Les notifications et le suivi de discussions ne disposent pas encore d'API dédiées.

## Structure du dépôt

L'arborescence suivante représente l'organisation logique attendue du projet. Les fichiers exacts peuvent varier selon l'état actuel du dépôt.

```text
communaute-le-revenu/
├── backend/                         # API Strapi v5
│   ├── config/                      # Configuration Strapi
│   ├── database/                    # Configuration de la base de données
│   ├── public/                      # Fichiers publics du backend
│   ├── src/
│   │   ├── api/
│   │   │   ├── category/            # API des catégories
│   │   │   ├── discussion/          # API des discussions
│   │   │   ├── reply/               # API des réponses
│   │   │   ├── community-like/      # Réactions sur les discussions et réponses
│   │   │   ├── community-point/     # Points et classement
│   │   │   ├── community-poll/      # Sondage et centres d'intérêt
│   │   │   └── community-vote/      # Votes persistants au sondage
│   │   ├── extensions/              # Extensions des plugins Strapi
│   │   ├── index.ts                 # Bootstrap et initialisation
│   │   └── utils/                   # Utilitaires métier, dont le calcul des points
│   ├── types/                       # Types TypeScript générés ou personnalisés
│   ├── package.json
│   └── Dockerfile
│
├── frontend/                        # Application Next.js 16
│   ├── public/                      # Images, icônes et ressources statiques
│   ├── src/
│   │   ├── app/                     # App Router, pages et layouts
│   │   ├── components/              # Composants réutilisables
│   │   └── lib/                     # Client API, authentification et helpers métier
│   ├── package.json
│   └── Dockerfile
│
├── .github/
│   └── workflows/
│       └── deploy.yml               # Workflow CI/CD prévu
│
├── docker-compose.yml               # Orchestration des 4 services
├── .env.example                     # Modèle de configuration
├── .env                             # Configuration locale, non versionnée
├── .gitignore
├── revenu.postman_collection.json   # Collection de tests API
└── README.md                        # Documentation du projet
```

### Rôle des principaux fichiers

- `docker-compose.yml` : définit PostgreSQL, pgAdmin, Strapi et Next.js, ainsi que leurs réseaux, volumes et dépendances.
- `.env.example` : documente les variables nécessaires au fonctionnement du projet sans contenir de véritables secrets.
- `.env` : contient les valeurs propres à l'environnement local ou de déploiement.
- `backend/src/index.ts` : contient le point d'entrée d'initialisation de Strapi et le mécanisme de seeding dans `bootstrap()`.
- `revenu.postman_collection.json` : regroupe les scénarios de test de l'API REST.
- `.github/workflows/deploy.yml` : fichier destiné à automatiser les étapes de validation et de déploiement.

## Prérequis

Avant de lancer le projet, installer les outils suivants :

| Outil | Utilisation | Vérification |
|---|---|---|
| Docker | Exécution des conteneurs | `docker --version` |
| Docker Compose | Orchestration des services | `docker compose version` |
| Git | Récupération du dépôt et gestion du code | `git --version` |

Docker Desktop ou Docker Engine avec le plugin Docker Compose v2 convient.

### Récupération du projet

```bash
git clone <URL_DU_DEPOT>
cd communaute-le-revenu
```

Remplacer `<URL_DU_DEPOT>` par l'URL réelle du dépôt Git.

## Configuration centralisée : un seul `.env`

### Pourquoi un seul fichier `.env` ?

Le projet utilise un fichier `.env` unique à la racine pour centraliser la configuration des quatre services Docker.

Cette approche présente plusieurs avantages :

- **Configuration centralisée :** toutes les variables sont regroupées au même endroit.
- **Cohérence :** les services utilisent une configuration commune et documentée.
- **Déploiement simplifié :** le fichier peut être généré à partir des secrets et variables de l'environnement cible.
- **Préparation au CI/CD :** GitHub Actions pourra construire le fichier `.env` à partir de GitHub Secrets et GitHub Variables.
- **Maintenance facilitée :** les changements de ports, d'identifiants ou d'URLs sont plus faciles à suivre.

Docker Compose lit les variables du fichier `.env` racine pour interpoler les valeurs définies dans `docker-compose.yml`. Les variables destinées aux applications doivent ensuite être transmises explicitement aux conteneurs via `environment` ou `env_file`.

### Création du fichier

Après avoir récupéré le dépôt :

```bash
cp .env.example .env
```

Ouvrir ensuite le fichier `.env` et remplacer toutes les valeurs d'exemple par les valeurs adaptées à l'environnement.

### Génération des secrets

Utiliser OpenSSL pour générer des secrets aléatoires :

```bash
openssl rand -base64 32
```

Exécuter cette commande séparément pour chaque secret. Ne pas réutiliser une seule valeur pour toutes les clés cryptographiques.

Exemples de secrets à générer :

- Clé d'application Strapi.
- Clé API Strapi.
- Secret JWT.
- Secret des tokens d'accès et de rafraîchissement, selon la configuration du projet.
- Secret du panneau d'administration Strapi.
- Mot de passe PostgreSQL.
- Mot de passe administrateur pgAdmin.

Les secrets doivent être conservés hors du dépôt Git. Les valeurs d'exemple ne doivent jamais être utilisées en production.

### Tableau des variables d'environnement

Le tableau suivant présente les variables usuelles attendues. Les noms doivent correspondre exactement à ceux référencés dans `docker-compose.yml`, les Dockerfiles et le code applicatif.

| Variable | Rôle | Sensible |
|---|---|---|
| `NODE_ENV` | Environnement d'exécution Node.js | Non |
| `POSTGRES_DB` | Nom de la base PostgreSQL | Non |
| `POSTGRES_USER` | Utilisateur de la base PostgreSQL | Oui |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | Oui |
| `DATABASE_CLIENT` | Pilote de base de données Strapi (`postgres`) | Non |
| `DATABASE_HOST` | Hôte PostgreSQL vu depuis Strapi, généralement `postgres` | Non |
| `DATABASE_PORT` | Port PostgreSQL interne (`5432`) | Non |
| `DATABASE_NAME` | Base utilisée par Strapi | Non |
| `DATABASE_USERNAME` | Utilisateur utilisé par Strapi | Oui |
| `DATABASE_PASSWORD` | Mot de passe utilisé par Strapi | Oui |
| `DATABASE_SSL` | Active ou désactive SSL pour la connexion à la base | Non |
| `APP_KEYS` | Clés de chiffrement/signature utilisées par Strapi | Oui |
| `API_TOKEN_SALT` | Sel utilisé pour les tokens API | Oui |
| `ADMIN_JWT_SECRET` | Secret JWT du panneau d'administration | Oui |
| `TRANSFER_TOKEN_SALT` | Sel des tokens de transfert Strapi | Oui |
| `JWT_SECRET` | Secret JWT utilisé par le mécanisme d'authentification concerné | Oui |
| `STRAPI_ADMIN_BACKEND_URL` | URL publique du backend si utilisée par la configuration | Non |
| `NEXT_PUBLIC_STRAPI_URL` | URL de Strapi accessible depuis le navigateur | Non |
| `STRAPI_INTERNAL_URL` | URL de Strapi accessible depuis le conteneur Next.js | Non |
| `PGADMIN_DEFAULT_EMAIL` | Adresse de connexion à pgAdmin | Oui |
| `PGADMIN_DEFAULT_PASSWORD` | Mot de passe de pgAdmin | Oui |
| `PORT` | Port d'écoute du service concerné | Non |
| `HOST` | Adresse d'écoute du service concerné | Non |

**Important :** certaines variables sont spécifiques à la configuration du projet. Avant de lancer les services, comparer ce tableau avec `.env.example` et `docker-compose.yml`. Ne pas ajouter de variables inutilisées en supposant que Strapi ou Next.js les prendra automatiquement en compte.

### URLs internes et externes

Deux variables ont des rôles différents :

```dotenv
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_INTERNAL_URL=http://strapi:1337
```

- `NEXT_PUBLIC_STRAPI_URL` est destinée aux appels exécutés dans le navigateur. Le préfixe `NEXT_PUBLIC_` signifie que sa valeur peut être intégrée au bundle frontend.
- `STRAPI_INTERNAL_URL` est utilisée par le serveur Next.js pour appeler Strapi à travers le réseau Docker.

Ne jamais placer de mot de passe ou de secret dans une variable `NEXT_PUBLIC_*`.

### Faut-il un `.env` dans `backend/` ou `frontend/` ?

**Non, pas pour le fonctionnement via Docker Compose**, si le fichier racine transmet toutes les variables requises aux conteneurs.

Les fichiers `.env` propres à chaque application ne sont pas nécessaires dans ce scénario. Les commandes lancées directement sur l'hôte, en dehors de Docker, peuvent toutefois nécessiter une configuration distincte.

Ajouter `.env` à `.gitignore` :

```gitignore
.env
.env.*
!.env.example
```

Cette règle doit être adaptée si le dépôt contient déjà des fichiers d'environnement spécifiques qui doivent être versionnés.

## Lancement du projet

### 1. Construire et démarrer les services

```bash
docker compose up --build
```

Cette commande construit les images nécessaires puis démarre les quatre services :

1. PostgreSQL 15.
2. pgAdmin 4.
3. Strapi v5.
4. Next.js 16.

Le mode interactif affiche les journaux des conteneurs. La première construction peut prendre plusieurs minutes.

### 2. Démarrer les services sans reconstruire

```bash
docker compose up
```

Cette commande démarre les services à partir des images disponibles. Elle ne garantit pas que les images soient reconstruites après une modification du code ou d'un Dockerfile.

### 3. Arrêter les services

```bash
docker compose down
```

Cette commande arrête et supprime les conteneurs ainsi que le réseau créé par Compose. Les volumes persistants sont conservés, notamment les données PostgreSQL.

### 4. Réinitialiser complètement les données

```bash
docker compose down -v
```

Cette commande arrête les services et supprime également les volumes déclarés par le projet. Les données PostgreSQL persistantes sont donc supprimées.

**Attention :** cette opération est destructive. Toutes les données présentes dans les volumes supprimés seront perdues. Elle est utile pour repartir d'une base vierge et rejouer le seeding de démonstration.

### Commandes utiles

Afficher les services :

```bash
docker compose ps
```

Consulter les journaux de Strapi :

```bash
docker compose logs -f strapi
```

Consulter les journaux du frontend :

```bash
docker compose logs -f frontend
```

Consulter les journaux de PostgreSQL :

```bash
docker compose logs -f postgres
```

Reconstruire un service particulier :

```bash
docker compose up --build frontend
```

Le nom du service doit correspondre à celui défini dans `docker-compose.yml`.

## Accès aux services

Après le démarrage, les services sont accessibles depuis la machine hôte via les ports publiés dans Docker Compose.

| Service | URL ou adresse | Identifiants |
|---|---|---|
| Frontend Next.js | [http://localhost:3000](http://localhost:3000) | Selon les fonctionnalités de l'application |
| Administration Strapi | [http://localhost:1337/admin](http://localhost:1337/admin) | Compte administrateur Strapi |
| API REST Strapi | [http://localhost:1337/api](http://localhost:1337/api) | Selon les permissions de l'endpoint |
| pgAdmin 4 | [http://localhost:5050](http://localhost:5050) | `PGADMIN_DEFAULT_EMAIL` et `PGADMIN_DEFAULT_PASSWORD` |
| PostgreSQL | `localhost:5432` | `POSTGRES_USER`, `POSTGRES_PASSWORD` et `POSTGRES_DB` |

### Connexion à PostgreSQL depuis pgAdmin

Dans pgAdmin, enregistrer un nouveau serveur avec les paramètres suivants :

| Paramètre | Valeur |
|---|---|
| Name | `Communauté Le Revenu` |
| Host name/address | `postgres` |
| Port | `5432` |
| Maintenance database | Valeur de `POSTGRES_DB` |
| Username | Valeur de `POSTGRES_USER` |
| Password | Valeur de `POSTGRES_PASSWORD` |

Utiliser `postgres` comme hôte lorsque pgAdmin et PostgreSQL sont connectés au même réseau Docker Compose. `localhost` désignerait alors le conteneur pgAdmin lui-même, et non le conteneur PostgreSQL.

Les ports doivent être publiés dans `docker-compose.yml` pour accéder aux services depuis l'hôte.

## Comptes de démonstration

### Administrateur Strapi

Le panneau d'administration est accessible à l'adresse :

[http://localhost:1337/admin](http://localhost:1337/admin)

Le compte administrateur doit être créé lors de la première initialisation de Strapi, sauf si une procédure spécifique du projet le provisionne.

Les identifiants administrateur ne sont pas supposés être prédéfinis. Utiliser le compte configuré pour l'environnement courant ou créer le premier administrateur via l'interface Strapi.

### Utilisateur de démonstration

| Champ | Valeur |
|---|---|
| Email | `demo@example.com` |
| Mot de passe | `123456` |
| Rôle | `Authenticated` |
| Statut | Confirmé |

Ce compte permet de tester les fonctionnalités réservées aux utilisateurs authentifiés, notamment la création de discussions et de réponses.

**Sécurité :** ce compte est exclusivement destiné à la démonstration locale. Son mot de passe est volontairement simple et ne doit jamais être réutilisé en production.

## Seeding automatique

Le projet intègre un mécanisme de seeding automatique dans `backend/src/index.ts`, au niveau de la fonction `bootstrap()` de Strapi.

### Données initialisées

Le jeu de données de démonstration comprend :

| Type de contenu | Nombre | Description |
|---|---:|---|
| Catégories | 6 | Catégories de discussion prédéfinies. |
| Discussions | 5 | Discussions associées aux catégories et aux utilisateurs. |
| Réponses | 6 | Réponses liées aux discussions de démonstration. |

Le seeding prépare les données nécessaires à la présentation et aux tests fonctionnels de l'application.

### Fonctionnement

- Le seeding est exécuté lors de l'initialisation du backend, via `bootstrap()`.
- Il est conçu pour être **idempotent** : plusieurs démarrages ne doivent pas créer de doublons.
- Il doit vérifier l'existence des données avant de les créer.
- Il peut dépendre de la disponibilité de la base de données et de l'existence des Content Types concernés.
- Les erreurs de seeding doivent être visibles dans les journaux Strapi.

L'idempotence dépend des critères de recherche utilisés par le script. Des identifiants stables, tels que des slugs ou des emails uniques, sont préférables à des recherches basées sur des champs non uniques.

### Forcer une réinitialisation du seeding

Pour supprimer les données persistantes et repartir de zéro :

```bash
docker compose down -v
docker compose up --build
```

Cette procédure supprime les volumes déclarés par le projet, y compris les données PostgreSQL qu'ils contiennent. Le backend peut ensuite recréer les données de démonstration au démarrage.

Ne pas utiliser cette procédure sur un environnement contenant des données à conserver.

## Choix techniques

### Pourquoi Strapi ?

Strapi est un CMS headless qui permet de construire une API REST sans développer manuellement toute l'infrastructure de gestion de contenu.

Ses principaux avantages pour ce projet sont :

- **API REST intégrée :** exposition des contenus à travers des endpoints structurés.
- **Gestion des utilisateurs :** prise en charge de l'authentification et des rôles via le plugin Users & Permissions.
- **Permissions configurables :** contrôle des opérations publiques et authentifiées.
- **Modélisation des relations :** gestion des catégories, discussions et réponses.
- **Extensibilité :** possibilité d'ajouter des controllers, services, policies et lifecycles.
- **Administration intégrée :** interface pour gérer les contenus et les utilisateurs.
- **Évolutivité :** possibilité d'ajouter de nouveaux types de contenus sans reconstruire tout le backend.

Strapi permet ainsi de séparer clairement la présentation, portée par Next.js, de la logique métier et de la gestion des données.

### Pourquoi `documentId` et non `id` ?

Strapi v5 utilise `documentId` comme identifiant documentaire de référence pour les opérations courantes sur les documents de l'API Content Manager.

Il est important de distinguer les deux identifiants :

| Identifiant | Rôle |
|---|---|
| `id` | Identifiant numérique interne d'une entrée physique en base de données. |
| `documentId` | Identifiant documentaire utilisé par Strapi v5 pour identifier un document à travers ses différentes représentations et versions localisées, selon la configuration. |

Dans le frontend, `documentId` est préférable pour identifier les documents Strapi v5 dans les routes et les opérations API qui attendent cet identifiant.

Exemple conceptuel :

```typescript
type Discussion = {
  documentId: string;
  title: string;
  content: string;
};
```

Pour récupérer un document par son identifiant documentaire, l'endpoint REST de Strapi v5 utilise généralement la route du Content Type, par exemple :

```text
GET /api/discussions/:documentId
```

Le nom de la collection dans l'URL dépend du `pluralName` défini par le Content Type. Il faut donc vérifier le schéma réellement configuré dans Strapi.

Ne pas confondre `documentId` avec un identifiant d'autorisation ou un secret : il identifie un document, mais ne remplace pas les contrôles de permissions.

### Server Components vs Client Components

Next.js App Router privilégie les Server Components par défaut. Les Client Components sont réservés aux parties de l'interface qui ont besoin de fonctionnalités du navigateur.

| Critère | Server Components | Client Components |
|---|---|---|
| Exécution | Côté serveur | Côté navigateur après hydratation |
| Directive | Aucune directive nécessaire par défaut | `'use client'` |
| Récupération de données | Adaptée aux appels API serveur | Possible via des effets, hooks ou bibliothèques clientes |
| Secrets serveur | Peuvent utiliser des variables privées si elles restent côté serveur | Ne doivent jamais recevoir de secrets serveur |
| État React interactif | Pas de hooks d'état client | `useState`, `useEffect`, etc. |
| Événements utilisateur | Pas de gestion directe des événements navigateur | `onClick`, `onChange`, etc. |
| Cas d'utilisation | Pages, layouts, récupération initiale des données | Formulaires, filtres interactifs, modales, boutons |

**Règle de conception :** conserver les composants en Server Components tant qu'aucune interaction côté navigateur n'est nécessaire. Ajouter `'use client'` au niveau le plus bas possible dans l'arborescence pour limiter la taille du JavaScript envoyé au navigateur.

### Gestion du cache dans Next.js 16

Next.js 16 propose plusieurs mécanismes de rendu et de cache. Le projet doit les utiliser de manière explicite pour éviter les incohérences entre les données affichées et celles enregistrées dans Strapi.

#### `cacheComponents`

L'option `cacheComponents` permet d'activer le modèle de mise en cache des composants de Next.js 16. Elle doit être configurée dans `next.config.ts` si le projet utilise cette fonctionnalité.

Exemple de configuration :

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default nextConfig;
```

Cette configuration doit être vérifiée par rapport à la version exacte de Next.js installée et aux mécanismes de cache réellement utilisés par l'application.

#### `<Suspense>`

`<Suspense>` permet d'afficher un état de chargement pendant qu'une partie de l'interface attend des données ou un rendu différé.

Exemple :

```tsx
import { Suspense } from 'react';

export default function DiscussionsPage() {
  return (
    <Suspense fallback={<p>Chargement des discussions...</p>}>
      {/* Composant serveur chargé de récupérer les discussions */}
    </Suspense>
  );
}
```

En production, remplacer le commentaire par le composant serveur concerné. L'utilisation de Suspense doit correspondre à une frontière asynchrone réelle ; elle ne remplace pas la gestion des erreurs.

#### Invalidation du cache

Après une création ou une modification de discussion, il faut s'assurer que les données affichées sont actualisées. Selon l'architecture retenue, cela peut passer par une invalidation de cache, une revalidation de route ou une récupération de données non mise en cache.

Pour les données fréquemment modifiées, telles que les nouvelles discussions et les réponses, éviter de servir un contenu obsolète sans stratégie explicite de revalidation.

### Gestion des erreurs HTTP

Les erreurs de l'API Strapi doivent être traitées côté frontend afin de fournir des messages compréhensibles et de conserver le contrôle des opérations sensibles.

| Code HTTP | Signification | Comportement attendu |
|---|---|---|
| `400 Bad Request` | Données invalides ou requête incorrecte | Afficher les erreurs de validation et permettre la correction du formulaire. |
| `401 Unauthorized` | Utilisateur non authentifié ou token invalide/expiré | Demander une authentification ou tenter un renouvellement de token lorsque c'est approprié. |
| `403 Forbidden` | Utilisateur authentifié mais non autorisé | Afficher un message d'accès refusé. |
| `404 Not Found` | Ressource inexistante ou inaccessible selon le comportement de l'API | Afficher une page ou un message indiquant que la ressource est introuvable. |

Exemple de gestion centralisée des réponses :

```typescript
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    switch (response.status) {
      case 400:
        throw new Error('Les données envoyées sont invalides.');
      case 401:
        throw new Error('Vous devez vous authentifier.');
      case 403:
        throw new Error("Vous n'avez pas les permissions nécessaires.");
      case 404:
        throw new Error('La ressource demandée est introuvable.');
      default:
        throw new Error('Une erreur est survenue lors de la requête.');
    }
  }

  return response.json() as Promise<T>;
}
```

Cet exemple constitue une base. Dans l'application réelle, il est préférable de conserver le code HTTP, le message technique et les détails de validation afin de permettre un traitement adapté à chaque formulaire.

Ne jamais se fier uniquement aux validations du frontend : Strapi doit également valider les données et vérifier les permissions.

### Authentification et refresh token

Le mécanisme d'authentification repose sur les tokens émis par Strapi et sur un renouvellement du token d'accès lorsque celui-ci expire, si cette fonctionnalité est prise en charge par la configuration du projet.

Le fonctionnement général est le suivant :

1. L'utilisateur soumet ses identifiants.
2. Strapi vérifie les identifiants et retourne les informations d'authentification.
3. Le frontend utilise le token d'accès pour les requêtes protégées.
4. Lorsqu'un token expire, le frontend tente de le renouveler via le mécanisme prévu.
5. Si le renouvellement échoue, l'utilisateur doit se reconnecter.

#### Bug Strapi #24871 et contournement

Le projet prend en compte le problème référencé dans [Strapi issue #24871](https://github.com/strapi/strapi/issues/24871), qui concerne le comportement du mécanisme de refresh token dans certains scénarios d'authentification.

Un contournement appliqué dans `refreshAccessToken` consiste à transmettre explicitement le header `Authorization` lorsque l'endpoint de renouvellement le nécessite.

Exemple conceptuel :

```typescript
const response = await fetch(refreshUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    refreshToken,
  }),
});
```

Cet extrait illustre le principe du contournement ; les noms exacts des champs, le format du token et les exigences du header doivent correspondre à l'implémentation du projet et à la version de Strapi utilisée.

Le header `Authorization` ne doit pas être ajouté aveuglément à tous les endpoints : il faut respecter le contrat de l'endpoint de renouvellement et vérifier les effets du contournement avec des tests d'authentification.

#### Bonnes pratiques

- Ne jamais exposer les secrets de signature JWT dans le frontend.
- Éviter de stocker des tokens sensibles dans `localStorage` lorsque des alternatives plus sûres sont possibles.
- Si des cookies sont utilisés pour l'authentification, configurer les attributs `HttpOnly`, `Secure` et `SameSite` selon l'environnement.
- Vérifier les permissions côté backend pour chaque opération protégée.
- Ne pas considérer la présence d'un token comme une preuve suffisante d'autorisation.

### Communication entre conteneurs Docker

Le navigateur et le serveur Next.js ne se trouvent pas dans le même contexte réseau.

Le navigateur accède à Strapi par le port publié sur la machine hôte, tandis que le serveur Next.js utilise le DNS interne de Docker Compose.

| Variable | Valeur locale | Utilisation |
|---|---|---|
| `NEXT_PUBLIC_STRAPI_URL` | `http://localhost:1337` | Requêtes exécutées dans le navigateur. |
| `STRAPI_INTERNAL_URL` | `http://strapi:1337` | Requêtes exécutées depuis le conteneur Next.js. |

#### Pourquoi deux URLs ?

`localhost` désigne la machine ou le conteneur dans lequel le code s'exécute.

- Depuis le navigateur de l'utilisateur, `http://localhost:1337` pointe vers le port Strapi publié sur la machine hôte.
- Depuis le conteneur Next.js, `http://localhost:1337` pointerait vers le conteneur Next.js lui-même.
- Le nom `strapi` permet au conteneur Next.js de joindre le service Strapi à travers le réseau Docker Compose.

Exemple de fonction de récupération :

```typescript
const STRAPI_URL =
  typeof window === 'undefined'
    ? process.env.STRAPI_INTERNAL_URL
    : process.env.NEXT_PUBLIC_STRAPI_URL;

export async function fetchFromStrapi(path: string) {
  if (!STRAPI_URL) {
    throw new Error('URL Strapi non configurée.');
  }

  return fetch(`${STRAPI_URL}${path}`);
}
```

Cette fonction est illustrative. En production, séparer de préférence le client serveur du client navigateur plutôt que de dépendre de `typeof window`, notamment pour contrôler les headers d'authentification, le cache et les erreurs.

Attention également au préfixe `NEXT_PUBLIC_` : sa valeur est généralement intégrée au bundle lors de la construction de Next.js. Pour une image Docker réutilisée entre plusieurs environnements, il faut vérifier que la valeur publique correspond bien à l'environnement cible.

## Stratégie de déploiement et CI/CD

### Objectif

L'objectif est de préparer un déploiement reproductible dans lequel la configuration est générée automatiquement à partir des GitHub Secrets et GitHub Variables.

Le workflow devra notamment :

1. Récupérer le code du dépôt.
2. Valider les variables nécessaires.
3. Construire les images Docker.
4. Exécuter les vérifications et tests prévus.
5. Générer la configuration `.env` à partir des valeurs protégées.
6. Transférer ou déployer les services sur le serveur cible.
7. Vérifier la santé des services après le déploiement.

### État actuel

Le déploiement automatique n'est pas encore opérationnel, car le serveur cible n'est pas encore disponible.

Pour le moment, le fichier `.env` est transmis manuellement par email lorsque cela est nécessaire. Cette méthode est temporaire et présente des risques de sécurité, car le fichier peut contenir des mots de passe et des secrets d'application.

Il est recommandé de migrer vers un mécanisme sécurisé dès que le serveur et le pipeline seront disponibles.

### Workflow prévu

Le fichier suivant est prévu :

```text
.github/workflows/deploy.yml
```

Il contiendra les étapes de construction, de validation et de déploiement. Le workflow exact dépendra de l'hébergement retenu, de la méthode de connexion au serveur et de la stratégie de livraison des images Docker.

### GitHub Secrets et GitHub Variables

| Nom | Type | Rôle |
|---|---|---|
| `POSTGRES_PASSWORD` | Secret | Mot de passe PostgreSQL. |
| `DATABASE_USERNAME` | Secret | Compte de connexion de Strapi à PostgreSQL. |
| `DATABASE_PASSWORD` | Secret | Mot de passe de connexion de Strapi. |
| `APP_KEYS` | Secret | Clés d'application Strapi. |
| `API_TOKEN_SALT` | Secret | Sel des tokens API. |
| `ADMIN_JWT_SECRET` | Secret | Secret du JWT administrateur. |
| `TRANSFER_TOKEN_SALT` | Secret | Sel des tokens de transfert. |
| `JWT_SECRET` | Secret | Secret JWT du mécanisme d'authentification concerné. |
| `PGADMIN_DEFAULT_EMAIL` | Variable ou Secret | Compte de connexion pgAdmin ; préférer Secret si nécessaire. |
| `PGADMIN_DEFAULT_PASSWORD` | Secret | Mot de passe de pgAdmin. |
| `NODE_ENV` | Variable | Environnement Node.js, par exemple `production`. |
| `POSTGRES_DB` | Variable | Nom de la base PostgreSQL. |
| `DATABASE_HOST` | Variable | Hôte de base de données, généralement `postgres` dans Docker. |
| `DATABASE_PORT` | Variable | Port PostgreSQL interne, généralement `5432`. |
| `NEXT_PUBLIC_STRAPI_URL` | Variable | URL publique de Strapi utilisée par le navigateur. |
| `STRAPI_INTERNAL_URL` | Variable | URL interne de Strapi utilisée par Next.js. |
| `DEPLOY_HOST` | Secret | Adresse du serveur de déploiement. |
| `DEPLOY_USER` | Secret | Utilisateur SSH de déploiement. |
| `DEPLOY_SSH_KEY` | Secret | Clé privée SSH du compte de déploiement. |

Les variables et secrets listés constituent une proposition initiale. Le workflow final devra reprendre les noms réellement utilisés dans `.env.example` et `docker-compose.yml`.

### Exemple de génération du fichier `.env` dans GitHub Actions

Le workflow pourra générer un fichier d'environnement temporaire sur le runner :

```yaml
- name: Générer le fichier .env
  shell: bash
  env:
    POSTGRES_DB: ${{ vars.POSTGRES_DB }}
    POSTGRES_USER: ${{ secrets.POSTGRES_USER }}
    POSTGRES_PASSWORD: ${{ secrets.POSTGRES_PASSWORD }}
    APP_KEYS: ${{ secrets.APP_KEYS }}
    API_TOKEN_SALT: ${{ secrets.API_TOKEN_SALT }}
    ADMIN_JWT_SECRET: ${{ secrets.ADMIN_JWT_SECRET }}
    TRANSFER_TOKEN_SALT: ${{ secrets.TRANSFER_TOKEN_SALT }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
    NEXT_PUBLIC_STRAPI_URL: ${{ vars.NEXT_PUBLIC_STRAPI_URL }}
    STRAPI_INTERNAL_URL: ${{ vars.STRAPI_INTERNAL_URL }}
  run: |
    set +x
    umask 077
    {
      printf 'POSTGRES_DB=%s\n' "$POSTGRES_DB"
      printf 'POSTGRES_USER=%s\n' "$POSTGRES_USER"
      printf 'POSTGRES_PASSWORD=%s\n' "$POSTGRES_PASSWORD"
      printf 'APP_KEYS=%s\n' "$APP_KEYS"
      printf 'API_TOKEN_SALT=%s\n' "$API_TOKEN_SALT"
      printf 'ADMIN_JWT_SECRET=%s\n' "$ADMIN_JWT_SECRET"
      printf 'TRANSFER_TOKEN_SALT=%s\n' "$TRANSFER_TOKEN_SALT"
      printf 'JWT_SECRET=%s\n' "$JWT_SECRET"
      printf 'NEXT_PUBLIC_STRAPI_URL=%s\n' "$NEXT_PUBLIC_STRAPI_URL"
      printf 'STRAPI_INTERNAL_URL=%s\n' "$STRAPI_INTERNAL_URL"
    } > .env
```

Cet extrait illustre le principe. Il doit être complété avec toutes les variables réellement requises par le projet, puis intégré au workflow final.

**Précautions de sécurité :**

- Ne jamais afficher le contenu du fichier `.env` dans les logs.
- Ne jamais committer le fichier `.env` généré.
- Limiter l'accès aux secrets GitHub aux personnes et workflows autorisés.
- Éviter de transmettre les secrets par email.
- Protéger la clé SSH de déploiement et utiliser un compte système aux permissions minimales.
- Supprimer les fichiers temporaires sensibles après leur utilisation lorsque cela est pertinent.
- Ne pas considérer le masquage automatique des secrets dans GitHub Actions comme une garantie contre toute fuite.

Pour la production, il faudra également définir la stratégie de sauvegarde PostgreSQL, la gestion des migrations, le stockage des médias, les certificats HTTPS, la surveillance et la procédure de retour arrière.

## Tests

### Collection Postman

Le dépôt contient la collection :

```text
revenu.postman_collection.json
```

Elle permet de tester les principaux scénarios de l'API REST Strapi.

| Scénario | Objectif |
|---|---|
| Login | Vérifier l'authentification et la récupération du token. |
| Création d'une discussion | Vérifier qu'un utilisateur authentifié peut créer une discussion valide. |
| Refus sans token | Vérifier qu'une opération protégée est refusée sans authentification. |
| Refus d'usurpation | Vérifier qu'un utilisateur ne peut pas créer un contenu en se faisant passer pour un autre utilisateur. |
| Validation du titre | Vérifier le rejet d'un titre absent ou invalide selon les règles métier. |
| Création d'une réponse | Vérifier qu'une réponse peut être créée avec les relations attendues. |
| Populate | Vérifier que les relations demandées, comme la catégorie, l'auteur ou les réponses, sont correctement retournées. |
| Réaction sur plusieurs discussions | Liker une discussion par son `documentId`, puis vérifier que seul son compteur change, même si le fil est trié ou paginé. |
| Retrait d'une réaction | Retirer le like et vérifier que le compteur du même document diminue sans modifier les compteurs voisins. |
| Comptage des vues | Ouvrir le détail de plusieurs discussions et vérifier que chaque compteur correspond au bon `documentId`. |
| Vote au sondage | Voter, vérifier les résultats, puis modifier son choix sans recevoir une deuxième attribution de point. |
| Centres d'intérêt | Enregistrer des slugs valides, relire la liste et vérifier que les slugs inconnus sont refusés. |
| Points et classement | Vérifier les points après les actions prévues et comparer les totaux avec le classement mensuel et général. |

### Exécution des tests

1. Démarrer l'application avec Docker Compose.
2. Ouvrir Postman.
3. Importer `revenu.postman_collection.json`.
4. Configurer l'URL de base de Strapi, généralement `http://localhost:1337`.
5. S'authentifier avec un compte de démonstration ou un compte de test.
6. Exécuter les requêtes dans l'ordre requis par leurs dépendances.
7. Vérifier les codes HTTP, les corps de réponse et les données persistées.

Pour les tests d'authentification, récupérer le token à partir de la réponse du login et le réutiliser dans les requêtes protégées.

### Tests automatisés prévus

Des tests automatisés pourront être ajoutés progressivement :

- Tests unitaires des fonctions métier.
- Tests d'intégration des endpoints Strapi.
- Tests de validation des données.
- Tests des permissions et des rôles.
- Tests du mécanisme de renouvellement des tokens.
- Tests de composants et de pages Next.js.
- Tests end-to-end des parcours utilisateur principaux.
- Exécution automatique dans le pipeline CI/CD.

Les tests devront notamment vérifier qu'un utilisateur ne peut pas modifier ou supprimer une discussion ou une réponse appartenant à un autre utilisateur, même s'il connaît son `documentId`.

## Dépannage

### 1. Erreur `fetch failed`

Cette erreur apparaît généralement lorsque Next.js ne parvient pas à joindre Strapi.

**Cause fréquente : mauvaise URL selon le contexte d'exécution.**

Vérifier les variables :

```dotenv
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_INTERNAL_URL=http://strapi:1337
```

Depuis le navigateur, utiliser l'URL publiée sur l'hôte. Depuis le conteneur Next.js, utiliser le nom du service Docker.

Vérifier ensuite l'état des services :

```bash
docker compose ps
docker compose logs -f strapi
docker compose logs -f frontend
```

Vérifier la connectivité interne depuis le conteneur frontend, si les outils nécessaires sont disponibles :

```bash
docker compose exec frontend node -e \
  "fetch('http://strapi:1337/api').then(r => console.log(r.status)).catch(e => { console.error(e); process.exit(1) })"
```

Un code HTTP indiquant que la route n'existe pas peut tout de même confirmer la connectivité réseau. En revanche, `ECONNREFUSED`, une erreur DNS ou un délai dépassé indique un problème de service, de réseau ou d'adresse.

### 2. Strapi reste `unhealthy`

Le healthcheck Docker peut échouer si le conteneur ne dispose pas de la commande utilisée pour le contrôle de santé.

Par exemple, une image minimale peut ne pas contenir `wget`.

Vérifier l'état :

```bash
docker compose ps
docker inspect "$(docker compose ps -q strapi)" \
  --format '{{json .State.Health}}'
```

Consulter les journaux :

```bash
docker compose logs --tail=200 strapi
```

#### Utiliser Node.js pour le healthcheck

Si Node.js est disponible dans l'image, il est possible d'effectuer le contrôle avec `fetch` plutôt qu'avec `wget`.

Exemple de principe à adapter dans `docker-compose.yml` :

```yaml
healthcheck:
  test:
    - CMD
    - node
    - -e
    - "fetch('http://127.0.0.1:1337/admin').then(r => process.exit(r.status < 500 ? 0 : 1)).catch(() => process.exit(1))"
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 60s
```

Ce contrôle vérifie qu'une réponse HTTP est disponible. Il ne garantit pas à lui seul que PostgreSQL est prêt ou que tous les Content Types sont correctement initialisés.

### 3. pgAdmin ne démarre pas

Vérifier que les variables requises sont présentes dans `.env` et transmises au service pgAdmin.

Exemple :

```dotenv
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=change-me
```

Vérifier les journaux :

```bash
docker compose logs -f pgadmin
```

Puis contrôler la configuration effective du service :

```bash
docker compose config
```

Ne pas partager la sortie complète de `docker compose config` sans vérifier qu'elle ne contient pas de secrets.

Si les variables sont absentes ou vides, corriger `.env`, puis recréer le conteneur :

```bash
docker compose up -d --force-recreate pgadmin
```

### 4. Le seeding est ignoré

Si les catégories, discussions ou réponses ne sont pas créées automatiquement :

1. Vérifier que PostgreSQL est disponible.
2. Consulter les logs Strapi.
3. Vérifier que `bootstrap()` est bien exécuté dans `backend/src/index.ts`.
4. Vérifier que le code de seeding est appelé depuis `bootstrap()`.
5. Vérifier que les Content Types existent et que leurs noms correspondent à ceux utilisés par le script.
6. Vérifier que les critères d'idempotence ne considèrent pas à tort les données comme déjà présentes.
7. Vérifier que les éventuelles erreurs du seeding sont journalisées.

Commandes utiles :

```bash
docker compose logs --tail=300 strapi
docker compose ps
```

Pour repartir d'une base vierge en développement :

```bash
docker compose down -v
docker compose up --build
```

Cette opération supprime les volumes concernés et les données persistantes qu'ils contiennent.

### 5. Erreur `Cannot find module './scripts/seed'`

Cette erreur indique que le code essaie de charger un module qui n'est pas disponible au chemin attendu dans l'environnement d'exécution.

Vérifier les points suivants :

- Le fichier existe réellement dans le dépôt.
- Le chemin d'import correspond à son emplacement.
- La casse du nom de fichier est correcte. Les systèmes Linux sont sensibles à la casse.
- Le fichier est inclus dans l'image Docker.
- Le chemin d'import est compatible avec le répertoire de sortie après compilation TypeScript.
- Le fichier n'est pas exclu par le `.dockerignore` ou par la configuration de compilation.

Par exemple, si `index.ts` se trouve dans `backend/src/` et que le module se trouve dans `backend/src/scripts/seed.ts`, l'import relatif doit être cohérent avec cette arborescence.

```typescript
import seed from './scripts/seed';
```

Cet exemple n'est valable que si le fichier exporte bien une valeur par défaut et si le système de compilation utilisé prend en charge cet import.

Si le module n'existe pas, il faut soit le créer, soit corriger l'import pour utiliser le véritable emplacement du script.

Après correction, reconstruire le backend :

```bash
docker compose up --build strapi
```

### 6. Les modifications du code ne sont pas prises en compte

Si une modification du frontend ou du backend n'apparaît pas :

```bash
docker compose up --build
```

Vérifier également les volumes de développement, les étapes de build et les fichiers effectivement copiés dans les images Docker.

En cas de doute, consulter les journaux et vérifier que le conteneur exécute bien la version attendue du code.

### 7. Erreurs d'authentification ou permissions incorrectes

Si une requête retourne `401` ou `403` :

- Vérifier que le token a été récupéré correctement lors du login.
- Vérifier que le header `Authorization` utilise le format attendu, généralement `Bearer <token>`.
- Vérifier que le token n'a pas expiré.
- Vérifier les permissions du rôle `Authenticated` dans Strapi.
- Vérifier que les règles métier empêchent la modification des contenus d'un autre utilisateur.
- Vérifier la configuration du refresh token si le renouvellement échoue.

Ne pas rendre un endpoint public uniquement pour contourner une erreur d'authentification.

## Licence

**Projet réalisé dans le cadre d'un test technique.**

Ce dépôt n'est pas publié sous une licence commerciale. Aucun droit de réutilisation commerciale, de redistribution ou de modification n'est accordé implicitement par ce README.

Les droits applicables au code, aux ressources et aux dépendances tierces restent soumis à leurs conditions respectives. Toute utilisation au-delà du cadre du test technique doit faire l'objet d'une autorisation appropriée.