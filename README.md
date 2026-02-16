## Project activation

1. Inside your own global CLI environment use node >=24 version `nvm use 24`.
2. Generate private and public key by running this command `npm run generate:jwt-keys`.
3. Copy + paste the current .env.example to .env file to make all of services properly ran.
4. Run `docker compose up -d` to start the containers.

## Postman

### Setup

#### LINK TO COLLENCTION -> https://matvii-v-yermakov-699600.postman.co/workspace/Matvii-Yermakov's-Workspace~ea49b356-00a7-46ad-8cd0-63bbc3cc5276/collection/47501650-e9c518b7-a241-4886-afeb-bf4abf45b7fc?action=share&creator=47501650

1. Go the root folder (URL Shortener).
2. Make sure all the services have their origin and port setup properly according to the .env file.
3. Go to Users Service -> Users -> Create user.
4. Create new user (payload: `{"email": "your_email@gmail.com", "password": "your_password"}`).
5. Get xApiKey -> Go to the root folder (URL Shortener).
6. Variables -> Specify "x-api-key" as a header in the parent directory
7. Execute Users -> Auth -> Token request.
8. Get your access_token.
9. Go to root folder (URL Shortener).
10. Authorization -> Specify "Authorization" header value from what you've got from `access_token` value from the request.
11. Validate you're successfully authorized Users Service -> Auth -> Me.

Success payload example:

```json
{
    "email": "username@example.com",
    "x_api_key": "usr_apikeyasdasdadsa",
    "subscription_type": "FREE"
}
```

### Bingoo - now you have access to all of the microservices inside the application.

## API Reference

### Base URLs (default)

- Users Service: `http://localhost:3005`
- Permalinks Manager (Shortlinks Resolver): `http://localhost:3004`
- Analytics Service: `http://localhost:3001`

### Common auth headers

- `Authorization: Bearer <access_token>` for protected endpoints.
- `x-api-key: <user_x_api_key>` only for `POST /auth/token`.

### Response format note

All HTTP responses are normalized to `snake_case` keys by a global interceptor.

Error format example:

```json
{
    "status_code": 403,
    "error": "ForbiddenException",
    "message": "Analytics are available for Pro users only."
}
```

## Users & Auth

### Create user

- Method: `POST`
- URL: `/users`
- Auth: none

Request:

```json
{
    "email": "user@example.com",
    "password": "StrongPass12!"
}
```

Response:

```json
{
    "email": "user@example.com",
    "x_api_key": "usr_..."
}
```

### Login (credentials check)

- Method: `POST`
- URL: `/auth/login`
- Auth: none

Request:

```json
{
    "email": "user@example.com",
    "password": "StrongPass12!"
}
```

Response:

```json
{
    "email": "user@example.com",
    "x_api_key": "usr_..."
}
```

### Get access token by API key

- Method: `POST`
- URL: `/auth/token`
- Auth: `x-api-key` header
- Body: empty

Response:

```json
{
    "access_token": "<jwt>"
}
```

### Get current user profile

- Method: `GET`
- URL: `/auth/me`
- Auth: Bearer token

Response:

```json
{
    "email": "user@example.com",
    "x_api_key": "usr_...",
    "subscription_type": "FREE"
}
```

## Account

### Get quota usage

- Method: `GET`
- URL: `/account/quota`
- Auth: Bearer token

Response:

```json
{
    "subscription_type": "FREE",
    "total_quota": 10,
    "created_count": 3,
    "remaining_count": 7
}
```

### Subscribe to PRO

- Method: `POST`
- URL: `/account/subscribe`
- Auth: Bearer token
- Body: empty

Response:

```json
{
    "email": "user@example.com",
    "x_api_key": "usr_...",
    "subscription_type": "PRO"
}
```

If user is already PRO:

```json
{
    "status_code": 409,
    "error": "ConflictException",
    "message": "Your subscription type is already PRO."
}
```

### Unsubscribe to FREE

- Method: `POST`
- URL: `/account/unsubscribe`
- Auth: Bearer token
- Body: empty

Response:

```json
{
    "email": "user@example.com",
    "x_api_key": "usr_...",
    "subscription_type": "FREE"
}
```

If user is already FREE:

```json
{
    "status_code": 409,
    "error": "ConflictException",
    "message": "Your subscription type is already FREE."
}
```

## Permalinks Manager (CRUD)

### CREATE: one permalink

- Method: `POST`
- URL: `/shortlinks`
- Auth: Bearer token

Request:

```json
{
    "original_url": "https://google.com",
    "expires_at": "2026-02-15T23:23:45.423Z",
    "shortcode": "mycode01"
}
```

`expires_at` and `shortcode` are optional.

Response:

```json
{
    "id": 1,
    "user_id": "1",
    "short_code": "mycode01",
    "original_url": "https://google.com",
    "expires_at": "2026-02-15T23:23:45.423Z",
    "created_at": "2026-02-16T10:00:00.000Z",
    "updated_at": "2026-02-16T10:00:00.000Z",
    "shortened_url": "http://localhost:3004/r/mycode01"
}
```

Rules:

- Custom `shortcode` is available only for `PRO`.
- Monthly limits: `FREE` = 10 per month, `PRO` = 100 per month.

### CREATE: bulk permalinks

- Method: `POST`
- URL: `/shortlinks/bulk`
- Auth: Bearer token

Request:

```json
[
    {
        "original_url": "https://google.com",
        "expires_at": "2026-02-15T23:23:45.423Z"
    },
    {
        "original_url": "https://ya.ru"
    }
]
```

Response: array of shortlink objects (same shape as create one).

### READ: list permalinks

- Method: `GET`
- URL: `/shortlinks?limit=50&offset=0`
- Auth: Bearer token

Response:

```json
{
    "data": [
        {
            "id": 1,
            "user_id": "1",
            "short_code": "abc12345",
            "original_url": "https://google.com",
            "expires_at": null,
            "created_at": "2026-02-16T10:00:00.000Z",
            "updated_at": "2026-02-16T10:00:00.000Z",
            "shortened_url": "http://localhost:3004/r/abc12345"
        }
    ],
    "pagination": {
        "limit": 50,
        "offset": 0,
        "total": 1
    }
}
```

### READ: one permalink by shortcode

- Method: `GET`
- URL: `/shortlinks/:shortcode`
- Auth: Bearer token

Response: one shortlink object (same shape as in list/create).

### UPDATE: permalink by shortcode

- Method: `PATCH`
- URL: `/shortlinks/:shortcode`
- Auth: Bearer token

Request (partial):

```json
{
    "original_url": "https://new-url.com",
    "expires_at": "2026-03-01T12:00:00.000Z",
    "shortcode": "newcode01"
}
```

Rules:

- Body is partial (`PATCH`).
- If `shortcode` changes, only `PRO` users can do it.
- New `shortcode` must be unique.

Response: updated shortlink object (same shape as create one).

### DELETE: permalink by shortcode

- Method: `DELETE`
- URL: `/shortlinks/:shortcode`
- Auth: Bearer token
- Response code: `204 No Content`

### Redirect test endpoint

- Method: `GET`
- URL: `/r/:shortCode`
- Auth: none
- Behavior: `301` redirect to original URL, emits analytics click event.

## Analytics

### Read analytics for one shortcode

- Method: `GET`
- URL: `/shortlinks/:shortCode?limit=50&offset=0`
- Service: Analytics (`http://localhost:3001`)
- Auth: Bearer token
- Access: PRO only

Response:

```json
{
    "shortcode": "abc12345",
    "total_clicks": 123,
    "history": [
        {
            "timestamp": "2026-02-15T22:10:00.000Z",
            "ip_address": "203.0.113.10",
            "user_agent": "Mozilla/5.0 ..."
        }
    ],
    "pagination": {
        "limit": 50,
        "offset": 0
    }
}
```

If user is `FREE`:

```json
{
    "status_code": 403,
    "error": "ForbiddenException",
    "message": "Analytics are available for Pro users only."
}
```

If shortcode does not exist for current user:

```json
{
    "status_code": 404,
    "error": "NotFoundException",
    "message": "Shortlink not found."
}
```

## Trade-offs & Design Decisions

Below are the main implementation trade-offs made to keep the solution aligned with the original requirements while fitting the current microservice architecture.

### 1. User-bound API key + short-lived JWT

- `x-api-key` is a persistent credential bound to the user entity.
- JWT access tokens are short-lived (15 minutes).
- In practice, `x-api-key` is used as a stable way to obtain a new JWT (`POST /auth/token`).
- Trade-off:
- Better fit for microservices (lightweight stateless auth for service-to-service and API calls).
- Simpler token validation flow.
- Slightly more operational complexity (clients must renew access tokens periodically).

### 2. REST-first endpoint design for permalink management

- Instead of non-REST shape like `POST /url/shorten`, permalink operations are exposed as REST resources:
- `POST /shortlinks`
- `POST /shortlinks/bulk`
- `GET /shortlinks`
- `GET /shortlinks/:shortcode`
- `PATCH /shortlinks/:shortcode`
- `DELETE /shortlinks/:shortcode`
- Trade-off:
- Cleaner, resource-oriented API that is easier to evolve.
- Less “single-action” endpoint naming, but better consistency across CRUD operations.

### 3. Redirect namespace separation (`/r/:shortCode`)

- Redirect endpoint is namespaced under `/r/:shortCode` instead of using a top-level shortcode path directly.
- Trade-off:
- Avoids route collisions with existing API namespaces (for example `/shortlinks/...`).
- Keeps redirect intent explicit and easy to identify.

### 4. Analytics endpoint shape by service context

- Instead of pattern like `/url/:shortcode/stats`, analytics is exposed inside the Analytics service context:
- `GET http://localhost:3001/shortlinks/:shortCode` (3001) by default in .env.example
- Trade-off:
- Endpoint is shorter and consistent with service boundaries.
- Service context itself communicates that this is analytics data.

### 5. Security choice: return 404 for inaccessible/missing shortlinks in analytics

- For analytics reads, inaccessible/non-owned shortcode is treated as `404 Not Found` (instead of exposing ownership details).
- Trade-off:
- Reduces information leakage about whether a shortcode exists for another user.
- Slightly less explicit semantics than a strict ownership-based `403`, but safer by default.

### 6. Account usage endpoint naming

- Instead of `/user/usage`, usage is exposed as `GET /account/quota`.
- Response is business-oriented: plan type, total quota, created count, remaining count.
- Trade-off:
- Better product semantics for subscription-based limits.
- Less “raw technical” naming, more user-facing clarity.

### 7. Explicit subscription testing endpoints

- Added:
- `POST /account/subscribe`
- `POST /account/unsubscribe`
- Trade-off:
- Makes PRO/FREE flows easy to test quickly in development and QA.
- Introduces mutable plan endpoints that would typically require stricter controls in production environments.
