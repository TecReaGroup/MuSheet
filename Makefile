.PHONY: install db run build typecheck docker

install:
	npm install
	node -e "const fs = require('fs'); fs.existsSync('.env') || fs.copyFileSync('.env.example', '.env')"

db:
	docker compose up -d --wait postgres

# Node entry points are called directly: npm/npx/vite .cmd shims make cmd.exe ask
# "Terminate batch job (Y/N)?" on Ctrl+C, which fights the shell for the console.
run: db
	node node_modules/concurrently/dist/bin/concurrently.js -k -n web,api -c blue,green "node node_modules/vite/bin/vite.js" "node --watch --watch-preserve-output --import tsx backend/server.ts"

typecheck:
	npm run typecheck

build:
	npm run build

docker:
	docker compose up -d --build
