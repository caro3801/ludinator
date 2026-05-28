.PHONY: install dev test test-watch build deploy

-include .env.make

# — Deploy config — valeurs par défaut, surcharger dans .env.make (non commité)
DEPLOY_HOST ?= monserveur.o2switch.net
DEPLOY_USER ?= monuser
DEPLOY_PATH ?= ~/www/ludinator
DEPLOY_PORT ?= 22
SERVER_PROCESS ?= bun

# ——————————————————————————————————————————————————————————————————————————————

install:
	npm install

dev:
	@echo "Démarrage de Vite et du serveur Bun..."
	@bun run src/server/server.js &
	@BUN_PID=$$! ; \
	trap "kill $$BUN_PID 2>/dev/null" EXIT INT TERM ; \
	npx vite ; \
	kill $$BUN_PID 2>/dev/null

test:
	npm test
	bun test

test-watch:
	npx vitest

build:
	npx vite build

deploy: build
	@echo "Envoi du frontend vers $(DEPLOY_USER)@$(DEPLOY_HOST):$(DEPLOY_PATH)..."
	rsync -avz --delete -e "ssh -p $(DEPLOY_PORT)" dist/ $(DEPLOY_USER)@$(DEPLOY_HOST):$(DEPLOY_PATH)/
	@echo "Redémarrage du serveur Bun..."
	ssh -p $(DEPLOY_PORT) $(DEPLOY_USER)@$(DEPLOY_HOST) \
		"cd $(DEPLOY_PATH) && pkill -f 'bun.*server.js' 2>/dev/null; nohup bun run server/server.js > server.log 2>&1 &"
	@echo "Déploiement terminé."
