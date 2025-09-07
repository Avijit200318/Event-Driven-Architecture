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

## Endpoint: `/api/todos`

### Description
This endpoint retrieves a paginated list of todo items for the authenticated user.  
It supports searching by title with case-insensitive matching and returns todos ordered by creation date in descending order.

### Method
`GET`

### Authentication
✅ Authentication required (Clerk).

### Query Parameters

| Parameter | Type   | Description                       | Required |
|----------|-------|----------------------------------|----------|
| `page`    | number | The page number for pagination. Defaults to `1` if not provided. | ❌ |
| `search`  | string | Search term to filter todos by title (case insensitive). Defaults to empty string if not provided. | ❌ |

---

### Example Request
```
/api/todos?page=2&search=meeting
```
---

### Example Response

#### ✅ Success Response (200)
```json
{
  "todos": [
    {
      "id": "todo_123",
      "title": "Team meeting notes",
      "completed": false,
      "userId": "user_abc",
      "createdAt": "2025-09-06T12:45:30.000Z",
      "updatedAt": "2025-09-06T12:45:30.000Z"
    },
    {
      "id": "todo_456",
      "title": "Prepare slides for meeting",
      "completed": true,
      "userId": "user_abc",
      "createdAt": "2025-09-05T08:20:10.000Z",
      "updatedAt": "2025-09-05T08:20:10.000Z"
    }
  ],
  "currentPage": 2,
  "totalPages": 5
}
```
## Endpoint: `/api/todos`

### Description
This endpoint allows an authenticated user to create a new todo item.  
It enforces a restriction that free users can create a maximum of 3 todos.  
Subscribed users have no limit on the number of todos they can create.

### Method
`POST`

### Authentication
✅ Authentication required (Clerk).

### Request Body
The request body must be a JSON object with the following property:

| Key   | Type   | Description               | Required |
|------|------|---------------------------|----------|
| `title` | string | The title of the new todo item. | ✅ |

### Example Request
```json
{
  "title": "Buy groceries"
}
```
---
### Example Response

#### ✅ Success Response (200)
```json
{
  "message": "",
  "todo": {
    "id": "todo_789",
    "title": "Buy groceries",
    "completed": false,
    "userId": "user_abc",
    "createdAt": "2025-09-06T15:10:00.000Z",
    "updatedAt": "2025-09-06T15:10:00.000Z"
  },
  "success": true
}
```