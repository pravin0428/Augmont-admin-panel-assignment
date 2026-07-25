# API Testing Guide — Production (Postman)

Real requests + real responses captured against the deployed backend.

- **Base URL:** `https://augmont-backend.onrender.com/api/v1`
- **Auth:** every endpoint needs header `Authorization: Bearer <token>` **except** `/auth/register`, `/auth/login`, and `/health/*`.
- **Get a token:** call **Login** (below), copy `data.token`, and in Postman set each protected request's **Authorization → Bearer Token** to it. Tokens expire in ~24h — re-login when you start getting `401`.
- ⏱️ First call after ~15 min idle can take 30–60s (free-tier cold start).

---

## 1. Auth

### Register
- **POST** `/auth/register` · Auth: none
- **Body → raw → JSON:**
```json
{ "email": "newuser@example.com", "password": "NewPass123" }
```
- **Response `201`:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...QqIyI-nmOaaLZbgMaRTuBIs43BcJP-Pu5sLEiJCQd-0",
    "user": {
      "id": 3,
      "email": "newuser@example.com",
      "createdAt": "2026-07-25T12:24:32.208Z",
      "updatedAt": "2026-07-25T12:24:32.208Z"
    }
  }
}
```

### Login
- **POST** `/auth/login` · Auth: none
- **Body → raw → JSON:**
```json
{ "email": "you@example.com", "password": "Test@1234" }
```
- **Response `200`:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...wHKVf--BOS9nlj-ovKAATIQmsOgHu5yNnBUTRRLIr58",
    "user": {
      "id": 2,
      "email": "you@example.com",
      "createdAt": "2026-07-25T10:40:04.100Z",
      "updatedAt": "2026-07-25T10:40:04.100Z"
    }
  }
}
```

### Current user
- **GET** `/auth/me` · Auth: Bearer · Body: none
- **Response `200`:**
```json
{
  "success": true,
  "message": "Authenticated user",
  "data": { "id": 2, "email": "you@example.com" }
}
```

---

## 2. Categories

### List categories
- **GET** `/categories` · Auth: Bearer · Body: none
- **Response `200`:**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    { "id": 2, "uniqueId": "ebb83474-92c3-4f74-85fc-eb653b8bb5f5", "name": "Books",
      "createdAt": "2026-07-25T06:43:08.923Z", "updatedAt": "2026-07-25T06:43:08.923Z" },
    { "id": 1, "uniqueId": "06942702-079d-46a5-b0b7-540e848fe66b", "name": "Electronics",
      "createdAt": "2026-07-25T06:42:55.533Z", "updatedAt": "2026-07-25T06:42:55.533Z" }
  ]
}
```

### Get one category
- **GET** `/categories/1` · Auth: Bearer · Body: none
- **Response `200`:**
```json
{
  "success": true,
  "message": "Category retrieved successfully",
  "data": {
    "id": 1,
    "uniqueId": "06942702-079d-46a5-b0b7-540e848fe66b",
    "name": "Electronics",
    "createdAt": "2026-07-25T06:42:55.533Z",
    "updatedAt": "2026-07-25T06:42:55.533Z"
  }
}
```

### Create category
- **POST** `/categories` · Auth: Bearer
- **Body → raw → JSON:**
```json
{ "name": "Home & Kitchen" }
```
- **Response `201`:**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": 6,
    "uniqueId": "9fac278d-310b-4526-a6c1-761d3473cf3a",
    "name": "Home & Kitchen",
    "createdAt": "2026-07-25T12:23:58.340Z",
    "updatedAt": "2026-07-25T12:23:58.340Z"
  }
}
```

### Update category
- **PUT** `/categories/6` · Auth: Bearer
- **Body → raw → JSON:**
```json
{ "name": "Home & Garden" }
```
- **Response `200`:**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "id": 6,
    "uniqueId": "9fac278d-310b-4526-a6c1-761d3473cf3a",
    "name": "Home & Garden",
    "createdAt": "2026-07-25T12:23:58.340Z",
    "updatedAt": "2026-07-25T12:24:35.827Z"
  }
}
```

### Delete category (success — empty category)
- **DELETE** `/categories/3` · Auth: Bearer · Body: none
- **Response `200`:**
```json
{ "success": true, "message": "Category deleted successfully", "data": null }
```

### Delete category (blocked — still has products)
- **DELETE** `/categories/1` · Auth: Bearer · Body: none
- **Response `409`:**
```json
{
  "success": false,
  "message": "Cannot delete category: 7 product(s) still reference it",
  "errors": []
}
```

---

## 3. Products

### List (pagination + sort + search + filter)
- **GET** `/products` · Auth: Bearer · Body: none
- **Query params (Postman → Params tab):**

| Key | Example | Notes |
|-----|---------|-------|
| page | 1 | |
| limit | 2 | max 100 |
| sortBy | price | `name` \| `price` \| `createdAt` |
| order | asc | `asc` \| `desc` |
| search | mouse | matches name (optional) |
| categoryId | 1 | filter (optional) |
| minPrice | 0 | optional |
| maxPrice | 1000 | optional |

- **Response `200`** (note the paginated envelope):
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "data": [
      { "id": 6, "uniqueId": "446e3ca8-a10f-4b19-9ee3-a8e3ba082ced", "name": "Wireless Mouse",
        "image": null, "price": 24.99, "categoryId": 1,
        "category": { "id": 1, "uniqueId": "06942702-079d-46a5-b0b7-540e848fe66b", "name": "Electronics" },
        "createdAt": "2026-07-25T12:07:30.698Z", "updatedAt": "2026-07-25T12:07:30.698Z" },
      { "id": 1, "uniqueId": "61e83f34-7d76-4cec-864a-188079260835", "name": "Wireless Mouse Pro",
        "image": null, "price": 29.99, "categoryId": 1,
        "category": { "id": 1, "uniqueId": "06942702-079d-46a5-b0b7-540e848fe66b", "name": "Electronics" },
        "createdAt": "2026-07-25T06:48:52.678Z", "updatedAt": "2026-07-25T12:09:47.082Z" }
    ],
    "total": 7,
    "page": 1,
    "limit": 2,
    "totalPages": 4
  }
}
```

### Get one product
- **GET** `/products/6` · Auth: Bearer · Body: none
- **Response `200`:**
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "id": 6,
    "uniqueId": "446e3ca8-a10f-4b19-9ee3-a8e3ba082ced",
    "name": "Wireless Mouse",
    "image": null,
    "price": 24.99,
    "categoryId": 1,
    "category": { "id": 1, "uniqueId": "06942702-079d-46a5-b0b7-540e848fe66b", "name": "Electronics" },
    "createdAt": "2026-07-25T12:07:30.698Z",
    "updatedAt": "2026-07-25T12:07:30.698Z"
  }
}
```

### Create product
- **POST** `/products` · Auth: Bearer
- **Body → form-data** (NOT JSON — so an image file can be attached):

| Key | Type | Value |
|-----|------|-------|
| name | Text | Mechanical Keyboard |
| price | Text | 89.00 |
| categoryId | Text | 1 |
| image | File | *(optional — choose an image file)* |

- **Response `201`:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 7,
    "uniqueId": "77536c47-3747-46ac-9ae9-d7b77dddb5ef",
    "name": "Mechanical Keyboard",
    "image": null,
    "price": 89,
    "categoryId": 1,
    "category": { "id": 1, "uniqueId": "06942702-079d-46a5-b0b7-540e848fe66b", "name": "Electronics" },
    "createdAt": "2026-07-25T12:23:59.117Z",
    "updatedAt": "2026-07-25T12:23:59.117Z"
  }
}
```
> When you attach an image, `"image"` comes back like `"uploads/<uuid>.png"`, viewable at `https://augmont-backend.onrender.com/uploads/<uuid>.png`.

### Update product
- **PUT** `/products/1` · Auth: Bearer
- **Body → form-data** (any subset of fields):

| Key | Type | Value |
|-----|------|-------|
| name | Text | Wireless Mouse Pro |
| price | Text | 29.99 |

- **Response `200`:**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": 1,
    "uniqueId": "61e83f34-7d76-4cec-864a-188079260835",
    "name": "Wireless Mouse Pro",
    "image": null,
    "price": 29.99,
    "categoryId": 1,
    "category": { "id": 1, "uniqueId": "06942702-079d-46a5-b0b7-540e848fe66b", "name": "Electronics" },
    "createdAt": "2026-07-25T06:48:52.678Z",
    "updatedAt": "2026-07-25T12:09:47.082Z"
  }
}
```

### Delete product
- **DELETE** `/products/7` · Auth: Bearer · Body: none
- **Response `200`:**
```json
{ "success": true, "message": "Product deleted successfully", "data": null }
```

### Bulk import (CSV / XLSX)
- **POST** `/products/import` · Auth: Bearer
- **Body → form-data:**

| Key | Type | Value |
|-----|------|-------|
| file | File | a `.csv` or `.xlsx` with header `name,price,category` |

- **Response `200`** (bad rows are skipped and reported — the rest still import):
```json
{
  "success": true,
  "message": "Bulk import completed",
  "data": {
    "totalRecords": 10,
    "inserted": 4,
    "failed": 6,
    "failures": [
      { "row": 3, "reason": "Unknown category \"Clothing\"" },
      { "row": 5, "reason": "Missing required field \"name\"" },
      { "row": 6, "reason": "Invalid price \"notanumber\"" },
      { "row": 7, "reason": "price must be greater than 0" },
      { "row": 8, "reason": "Unknown category \"Toys & Games\"" },
      { "row": 9, "reason": "Missing category (provide \"category\" name or \"categoryId\")" }
    ],
    "failuresTruncated": false,
    "durationMs": 35
  }
}
```

---

## 4. Users

### List users
- **GET** `/users` · Auth: Bearer · Body: none
- **Response `200`:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    { "id": 2, "email": "you@example.com", "createdAt": "2026-07-25T10:40:04.100Z", "updatedAt": "2026-07-25T10:40:04.100Z" },
    { "id": 1, "email": "mohite461998@gmail.com", "createdAt": "2026-07-25T06:41:06.257Z", "updatedAt": "2026-07-25T06:41:06.257Z" }
  ]
}
```

### Get one user
- **GET** `/users/2` · Auth: Bearer · Body: none
- **Response `200`:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": { "id": 2, "email": "you@example.com", "createdAt": "2026-07-25T10:40:04.100Z", "updatedAt": "2026-07-25T10:40:04.100Z" }
}
```

### Create user
- **POST** `/users` · Auth: Bearer
- **Body → raw → JSON:**
```json
{ "email": "jane@example.com", "password": "Passw0rd1" }
```
- **Response `201`:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": { "id": 4, "email": "jane@example.com", "createdAt": "2026-07-25T12:24:33.608Z", "updatedAt": "2026-07-25T12:24:33.608Z" }
}
```

### Update user
- **PUT** `/users/5` · Auth: Bearer
- **Body → raw → JSON** (email and/or password, both optional):
```json
{ "email": "updated@example.com" }
```
- **Response `200`:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": { "id": 5, "email": "updated@example.com", "createdAt": "2026-07-25T12:24:34.510Z", "updatedAt": "2026-07-25T12:24:35.037Z" }
}
```

### Delete user
- **DELETE** `/users/5` · Auth: Bearer · Body: none
- **Response `200`:**
```json
{ "success": true, "message": "User deleted successfully", "data": null }
```

---

## 5. Reports (file download)

> In Postman these return a file. Click **Send → Save Response → Save to a file** (or use "Send and Download").

### CSV report
- **GET** `/reports/products?format=csv` · Auth: Bearer
- **Optional query:** `search`, `categoryId`, `minPrice`, `maxPrice`
- **Response headers:**
```
content-type: text/csv; charset=utf-8
content-disposition: attachment; filename="products-report-2026-07-25T12-26-41-414Z.csv"
```
- **Body (streamed CSV):**
```
Unique ID,Name,Price,Category,Created At
61e83f34-7d76-4cec-864a-188079260835,Wireless Mouse Pro,29.99,Electronics,2026-07-25T06:48:52.678Z
c7823ab6-eecc-4eb4-a590-775f3bb4902b,Bluetooth Speaker,45.5,Electronics,2026-07-25T06:48:52.678Z
58a1875c-951f-4444-8d7c-826a7a369e85,Noise Cancelling Headphones,199,Electronics,2026-07-25T06:48:52.678Z
```

### XLSX report
- **GET** `/reports/products?format=xlsx` · Auth: Bearer
- **Response headers:**
```
content-type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
content-disposition: attachment; filename="products-report-2026-07-25T12-26-42-029Z.xlsx"
```
- Body is a binary `.xlsx` (Microsoft Excel 2007+) — save and open in Excel.

---

## 6. Health (public — no token)

### Liveness
- **GET** `/health/live`
```json
{ "success": true, "message": "Service is live", "data": { "status": "ok", "uptime": 1275.03 } }
```

### Readiness
- **GET** `/health/ready`
```json
{ "success": true, "message": "Service is ready", "data": { "status": "ready", "database": "up" } }
```

---

## 7. Error responses (same envelope everywhere)

### 401 — missing/invalid token
- Any protected request without a valid Bearer token:
```json
{ "success": false, "message": "Missing or malformed Authorization header", "errors": [] }
```

### 400 — validation failed (field-level errors)
- e.g. `POST /products` with `name=x`, `price=-5`, `categoryId=abc`:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "name", "message": "Product name must be between 2 and 150 characters" },
    { "field": "price", "message": "Price must be a positive number" },
    { "field": "categoryId", "message": "categoryId must be a positive integer" }
  ]
}
```

### 409 — conflict (duplicate)
- e.g. `POST /categories` with a name that already exists:
```json
{ "success": false, "message": "A category with this name already exists", "errors": [] }
```

### 404 — not found
- e.g. `GET /products/999999`:
```json
{ "success": false, "message": "Product not found", "errors": [] }
```

---

### Recommended test order (empty DB → full flow)
1. **Register** or **Login** → copy `token`.
2. **Create category** → note its `id`.
3. **Create product** with that `categoryId` (optionally attach an image).
4. **List products** (try `sortBy`, `search`, `categoryId`).
5. **Bulk import** a CSV → check the inserted/failed summary.
6. **Download report** (CSV/XLSX).
7. Try the **error cases** (401/400/409/404) to see the consistent envelope.
