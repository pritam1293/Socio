# Socio API Reference

Base URL: `http://localhost:8080/api/v1`

All authenticated endpoints require header: `Authorization: Bearer <access_token>`

---

## Authentication

### POST /auth/register
Register with email. A verification link is sent.

**Body:**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe"
}
```

**Response 201:**
```json
{
  "message": "registration successful, please check your email for verification link",
  "user": { "id": "uuid", "email": "user@example.com", "full_name": "John Doe" }
}
```

---

### POST /auth/request-login
Request magic link. An email with a sign-in link is sent.

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Response 200:**
```json
{
  "message": "check your email for the magic link"
}
```

---

### GET /auth/verify
Verify email or magic link token. Returns JWT tokens on success.

**Query:**
```
?token=<verification_token>
```

**Response 200:**
```json
{
  "user": { "id": "uuid", "email": "...", "full_name": "...", ... },
  "access_token": "eyJ...",
  "refresh_token": "abc123..."
}
```

---

### POST /auth/refresh
Refresh expired access token.

**Body:**
```json
{
  "refresh_token": "abc123..."
}
```

**Response 200:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "def456..."
}
```

---

### POST /auth/resend-verification
Resend verification email. (No auth required)

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Response 200:**
```json
{
  "message": "verification email resent"
}
```

---

### POST /auth/logout
Invalidate refresh token. **Requires auth.**

No body.

**Response 200:**
```json
{
  "message": "logged out successfully"
}
```

---

## Social Accounts

### GET /social/connect
Get OAuth authorization URL for a platform. **Requires auth.**

**Query:**
```
?platform=twitter
```
Supported: `twitter`, `reddit`, `threads`

**Response 200:**
```json
{
  "auth_url": "https://twitter.com/i/oauth2/authorize?..."
}
```

---

### GET /social/:platform/callback
OAuth callback handler. **Requires auth.**

**Query:**
```
?code=<oauth_code>&state=<oauth_state>
```

**Response 200:**
```json
{
  "message": "account connected successfully",
  "account": { "id": "uuid", "platform": "twitter", "platform_username": "@user", "is_active": true }
}
```

---

### GET /social/accounts
List connected social accounts. **Requires auth.**

**Response 200:**
```json
{
  "accounts": [
    { "id": "uuid", "platform": "twitter", "platform_username": "@user", "is_active": true, "created_at": "..." }
  ]
}
```

---

### DELETE /social/accounts/:id
Disconnect a social account. **Requires auth.**

**Response 200:**
```json
{
  "message": "account disconnected"
}
```

---

## Posts

### POST /posts
Create a post. **Requires auth.**

**Body:**
```json
{
  "caption": "Hello world",
  "hashtags": ["socio", "launch"],
  "platforms": ["twitter", "reddit"],
  "scheduled_at": "2026-07-10T15:00:00Z",
  "media_ids": ["uuid1", "uuid2"]
}
```
`scheduled_at` is optional (omit for draft). `media_ids` is optional.

**Response 201:**
```json
{
  "id": "uuid",
  "caption": "Hello world",
  "hashtags": ["socio", "launch"],
  "status": "draft",
  "platforms": [...],
  "media_files": [...],
  ...
}
```

---

### GET /posts
List user's posts. **Requires auth.**

**Query:**
```
?status=draft&limit=20&offset=0
```
`status`: draft, scheduled, published, failed, partial

**Response 200:**
```json
{
  "posts": [...],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

---

### GET /posts/:id
Get a single post. **Requires auth.**

**Response 200:** Post object with platforms and media.

---

### PUT /posts/:id
Update a post. **Requires auth.**

**Body:** Same as create. All fields optional — only sent fields are updated.

**Response 200:** Updated post object.

---

### DELETE /posts/:id
Delete a post. **Requires auth.**

**Response 200:**
```json
{
  "message": "post deleted"
}
```

---

### POST /posts/:id/publish
Publish a post immediately across selected platforms. **Requires auth.**

**Response 200:** Updated post with per-platform status.

---

### GET /posts/dashboard
Get dashboard overview. **Requires auth.**

**Response 200:**
```json
{
  "overview": { "drafts": 5, "scheduled": 3, "published": 12, "failed": 1 },
  "upcoming": [...],
  "published": [...],
  "failed": [...],
  "drafts": [...]
}
```

---

### POST /posts/:id/media
Upload media to a post. **Requires auth.**

**Body:** `multipart/form-data` with field `file`

**Response 201:**
```json
{
  "id": "uuid",
  "post_id": "uuid",
  "file_url": "/uploads/post-id/filename.png",
  "file_type": "image",
  "file_name": "photo.png",
  "file_size": 102400
}
```

---

### DELETE /media/:mediaId
Delete media file. **Requires auth.**

**Response 200:**
```json
{
  "message": "media deleted"
}
```

---

## Health

### GET /health
No auth required.

**Response 200:**
```json
{
  "status": "ok",
  "service": "socio"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "human-readable error message"
}
```

HTTP status codes: `400` (bad request/validation), `401` (unauthorized), `404` (not found), `500` (server error).
