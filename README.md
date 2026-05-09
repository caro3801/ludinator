# Ludinator

Application web de gestion de festival. Fonctionne directement dans le navigateur, sans compte ni connexion.

---

## Pour les organisateurs

Ludinator est organisé en trois modules accessibles depuis le menu principal :

| Module | Description |
|--------|-------------|
| **Crew** | Gestion des bénévoles et des plannings de postes |
| **Fest** | Suivi des activités et comptage des entrées |
| **Mioum** | Caisse et gestion des stocks de la buvette |

Chaque édition du festival est gérée indépendamment. Les données sont sauvegardées localement dans le navigateur — aucune installation requise pour les utilisateurs.

---

## Pour les développeurs

### Prérequis

- [Node.js](https://nodejs.org) ≥ 20
- [Bun](https://bun.sh) ≥ 1.0

### Installation

```bash
make install
```

### Commandes

```bash
make dev          # Lance Vite (frontend) + serveur Bun (WebSocket) en parallèle
make test         # Lance les tests une fois
make test-watch   # Lance les tests en mode watch
make build        # Génère le build de production dans dist/
make deploy       # Build + envoi vers le serveur + redémarrage Bun
```

### Déploiement

Configurer les variables de déploiement (via variables d'environnement ou en tête du `Makefile`) :

```bash
DEPLOY_HOST=monserveur.o2switch.net
DEPLOY_USER=monuser
DEPLOY_PATH=~/www/ludinator
DEPLOY_PORT=22
```

Puis :

```bash
make deploy
```

Le serveur Bun doit être installé sur l'hôte distant. Le déploiement copie le frontend compilé via rsync et redémarre le processus serveur via SSH.

### Architecture

Le projet suit une **architecture hexagonale** stricte, organisée par module :

```
src/
  <module>/
    domain/       # Entités, value objects, agrégats — zéro dépendance technique
    application/  # Cas d'usage
    ports/        # Interfaces (stockage, événements UI)
    adapters/
      ui/         # Web Components, handlers DOM
      storage/    # localStorage / IndexedDB
  server/         # Serveur WebSocket Bun + dispatching des commandes
```

### Contribution

Le projet est développé en **TDD strict** :

1. Modéliser le domaine
2. Écrire les tests avant l'implémentation
3. Implémenter le minimum pour faire passer les tests
4. Refactoriser si besoin
5. Soumettre pour validation avant de continuer
