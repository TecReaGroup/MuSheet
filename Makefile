.PHONY: install run docker seed clear clear-deep

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

# 20 test users, plus 20 scores and 20 setlists in both root's personal library and the team library.
seed:
	docker compose up -d --wait postgres
	node --import tsx script/seed-data.ts

# Light: scores, setlists, parts, annotations and PDFs. Accounts are kept.
clear:
	docker compose up -d --wait postgres
	node --import tsx script/clear-data.ts light

# Deep: everything, including user accounts and avatars.
clear-deep:
	docker compose up -d --wait postgres
	node --import tsx script/clear-data.ts deep
