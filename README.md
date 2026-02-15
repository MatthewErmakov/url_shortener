## Project activation

1. Inside your own global CLI environment use node >=24 version.
2. Run docker compose up -d to start the containers.
3. Copy + paste the current .env.example to .env file to make all of services properly ran.
4. Run the migration via npm run `npm run typeorm:run-migrations`
5. Generate private and public key by running this command `npm run generate:jwt-keys`.

## Postman

### Setup

1. Go the root folder (URL Shortener).
2. Make sure all the services have their origin and port setup properly according to the .env file.
3. Go to Users -> Auth -> Create user.
4. Create new user (payload: `{"email": "your_email@gmail.com", "password": "your_password"}`).
5. Get xApiKey -> Go to the root folder (URL Shortener).
6. Specify "x-api-key" as a header in the parent directory
7. Execute Users -> Auth -> Token request.
8. Get your accessToken.
9. Go to root folder.
10. Specify "Authorization" header value from what you've got from `accessToken` value from the request.

### Bingoo - now you have access to all of the microservices inside the application.

## Shortlinks creation

1. Go to "Permalink Shortener" -> Shortlinks -> CREATE ONE/CREATE BULK.

Payload for one:

{
    "original_url": "https://google.com",
    "expires_at": "2026-02-15T23:23:45.423Z" -> optional
}

Payload for bulk:

[
    {
        "original_url": "https://google.com",
        "expires_at": "2026-02-15T23:23:45.423Z" -> optional
    },
    {
        "original_url": "https://ya.ru",
        "expires_at": "2026-02-15T23:23:45.423Z" -> optional
    }
]

2. Take "shortCode" value from the response body.
3. Go to "Permalink Shortener" -> "TEST SHORTCODE REDIRECT" -> Paste your shorcode /r/:here.
4. Make sure it works!