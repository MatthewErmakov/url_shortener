Project activation

1. Inside your own global CLI environment use node >=24 version.
2. Run docker compose up -d to start the containers.
3. Copy + paste the current .env.example to .env file to make all of services properly ran.
4. Run the migration via npm run `npm run typeorm:run-migrations`
5. Generate JWT token with your phrase `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`.
6. 
