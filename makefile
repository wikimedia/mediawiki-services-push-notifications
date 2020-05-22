npm_test:
	docker-compose exec push-notifications npm test

npm_install:
	docker-compose exec push-notifications npm install

watch:
	docker-compose exec push-notifications npm run watch

build:
	docker-compose exec push-notifications npm run build

clean:
	docker-compose exec push-notifications npm run clean
