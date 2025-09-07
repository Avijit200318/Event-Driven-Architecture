# API Documentation
## Endpoint: `/api/webhooks/register`

### Description
This endpoint handles incoming webhook events from **Clerk** using **Svix** for secure verification.  
It listens for the `user.created` event and adds the new user’s data to a PostgreSQL(neon db) database via **Prisma**.

### Method
`POST`

### Authentication
❌ No authentication required from the client — authentication is handled by verifying **Svix headers**.

---

### Request Headers
| Key              | Description                     | Required |
|-----------------|---------------------------------|----------|
| `svix-id`        | Unique identifier for the event | ✅       |
| `svix-timestamp` | Timestamp of when the event was sent | ✅   |
| `svix-signature` | Signature for verifying the event | ✅    |

---

### Request Body
The request body is a JSON object sent by Clerk’s webhook with event details. For the `user.created` event, it includes:

- `id` **(string)**: Unique identifier of the user.  
- `email_addresses` **(array)**: List of the user’s email addresses with metadata.  
- `primary_email_address_id` **(string)**: ID of the primary email address.  
- Other fields as provided by Clerk’s webhook.

Example structure:
```json
{
  "type": "user.created",
  "data": {
    "id": "user_abc123",
    "email_addresses": [
      {
        "id": "email_1",
        "email_address": "user@example.com",
        "verification": { "status": "verified" }
      }
    ],
    "primary_email_address_id": "email_1"
  }
}
```
---

## Endpoint: `/api/subscription`

### POST – Add or Renew Subscription

#### Description
This endpoint allows an authenticated user to add or renew their subscription.  
It updates the user's record in the database by setting `isSubscribed` to `true` and extending `subscriptionEnds` by one month.

#### Method
`POST`

#### Authentication
✅ Authentication required (Clerk).

#### Request Body
No request body required.

---

### Example Response

#### ✅ Success Response (201)
```json
{
  "message": "Subscription Added",
  "subscriptionEnds": "2025-10-06T12:34:56.000Z",
  "success": true
}
```

## Endpoint: `/api/subscription`

### GET – Check Subscription Status

#### Description
This endpoint retrieves the current `subscription` status of the `authenticated` user.
If the subscription has `expired`, it resets the subscription data in the database.

#### Method
`GET`

#### Authentication
✅ Authentication required (Clerk).

#### Request Body
No request body required.

---

### Example Response

#### ✅ Success Response (201)
```json
{
  "message": "User subscription active",
  "isSubscribed": true,
  "success": false
}

```