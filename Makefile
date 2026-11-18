.PHONY: install db run build typecheck docker

install:
	npm install
	node -e "const fs = require('fs'); fs.existsSync('.env') || fs.copyFileSync('.env.example', '.env')"

db:
	docker compose up -d --wait postgres

run: db
	npx concurrently -k -n web,api -c blue,green "npm run dev" "npm run backend:dev"

typecheck:
	npm run typecheck

build:
	npm run build

docker:
	docker compose up -d --build
