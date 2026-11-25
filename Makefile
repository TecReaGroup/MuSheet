.PHONY: install run docker

install:
	npm install
	node -e "const fs = require('fs'); fs.existsSync('.env') || fs.copyFileSync('.env.example', '.env')"

run:
	docker compose up -d --wait postgres
	node node_modules/concurrently/dist/bin/concurrently.js --kill-others --names web,api --prefix-colors blue,green \
		"node node_modules/vite/bin/vite.js" \
		"node --watch --watch-preserve-output --import tsx backend/server.ts"

docker:
	docker compose up -d --build
