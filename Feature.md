# NestJS Training Assignment - Todo Management API

## Overview

Build a RESTful Todo Management API using NestJS and PostgreSQL.

The goal of this project is to demonstrate understanding of:

* NestJS architecture
* Controllers
* Services
* Modules
* Dependency Injection
* DTOs and Validation
* Authentication & Authorization
* Database design
* ORM usage
* Relationships

---

# Technical Requirements

## Stack

Required technologies:

* NestJS
* PostgreSQL
* Prisma or TypeORM
* JWT Authentication
* Swagger

## Project Structure

At minimum, the application should contain:

```text
src/
├── auth/
├── users/
├── todos/
├── categories/
├── common/
└── main.ts
```

---

# User Management

## User Entity

Create a user model with the following fields:

| Field     | Type            |
| --------- | --------------- |
| id        | UUID or Integer |
| email     | String          |
| password  | String          |
| fullName  | String          |
| createdAt | Date            |
| updatedAt | Date            |

### Requirements

* Email must be unique.
* Password must be hashed before storage.
* Password must never be returned in API responses.

---

# Authentication

## Register

### Endpoint

```http
POST /auth/register
```

### Request

```json
{
  "email": "john@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

### Validation

* email is required
* email must be valid
* password minimum length: 8
* fullName is required

### Expected Behavior

* Create a new user.
* Return user information.
* Duplicate emails must be rejected.

---

## Login

### Endpoint

```http
POST /auth/login
```

### Request

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Expected Response

```json
{
  "accessToken": "jwt-token"
}
```

### Requirements

* Validate email and password.
* Generate JWT access token.

---

## Get Current User

### Endpoint

```http
GET /users/me
```

### Requirements

* Authentication required.
* Return current user information.

---

# Todo Management

## Todo Entity

Create a Todo model with the following fields:

| Field       | Type            |
| ----------- | --------------- |
| id          | UUID or Integer |
| title       | String          |
| description | String          |
| status      | Enum            |
| priority    | Enum            |
| dueDate     | Date            |
| createdAt   | Date            |
| updatedAt   | Date            |
| userId      | Foreign Key     |

---

## Status Enum

Available values:

```text
PENDING
IN_PROGRESS
DONE
```

Default value:

```text
PENDING
```

---

## Priority Enum

Available values:

```text
LOW
MEDIUM
HIGH
```

Default value:

```text
MEDIUM
```

---

# Todo CRUD

## Create Todo

### Endpoint

```http
POST /todos
```

### Authentication

Required

### Request

```json
{
  "title": "Learn NestJS",
  "description": "Finish DTO section",
  "priority": "HIGH",
  "dueDate": "2026-07-01"
}
```

### Validation

* title is required
* title max length 100
* description is optional
* dueDate must be a valid date

### Requirements

* Todo must belong to the authenticated user.
* Client must not send `userId`.

---

## Get All Todos

### Endpoint

```http
GET /todos
```

---

## Get Todo By Id

### Endpoint

```http
GET /todos/:id
```

### Requirements

* Return todo details.
* Return `404 Not Found` if todo does not exist.

---

## Update Todo

### Endpoint

```http
PATCH /todos/:id
```

### Requirements

* Partial updates allowed.
* Only the owner can update the todo.

---

## Delete Todo

### Endpoint

```http
DELETE /todos/:id
```

### Requirements

* Only the owner can delete the todo.
* Return proper error if todo does not exist.

---

# Authorization

A user may only modify their own todos.

### Allowed

User A updating Todo A.

### Not Allowed

User A updating Todo B owned by User B.

### Expected Response

```http
403 Forbidden
```

---

# Pagination

Support pagination.

### Example

```http
GET /todos?page=1&limit=10
```

### Response

```json
{
  "data": [],
  "page": 1,
  "limit": 10,
  "total": 100
}
```

---

# Filtering

## Filter By Status

Examples:

```http
GET /todos?status=PENDING
```

```http
GET /todos?status=DONE
```

---

## Filter By Priority

Examples:

```http
GET /todos?priority=HIGH
```

```http
GET /todos?priority=LOW
```

---

# Search

Support searching by:

* title
* description

### Example

```http
GET /todos?search=nestjs
```

---

# Sorting

Support sorting results.

### Example

```http
GET /todos?sortBy=createdAt&order=desc
```

### Allowed Fields

```text
createdAt
updatedAt
dueDate
```

### Allowed Orders

```text
asc
desc
```

---

# Categories

## Category Entity

Create a category model.

| Field | Type            |
| ----- | --------------- |
| id    | UUID or Integer |
| name  | String          |

---

## Relationship

```text
Category (1) ------ (N) Todo
```

A category can contain multiple todos.

A todo belongs to one category.

---

## Create Category

### Endpoint

```http
POST /categories
```

---

## Assign Category To Todo

Todo may optionally belong to a category.

---

## Get Todo With Category

### Example Response

```json
{
  "id": 1,
  "title": "Learn NestJS",
  "category": {
    "id": 2,
    "name": "Study"
  }
}
```

---

# Error Handling

Use appropriate HTTP status codes.

Examples:

```http
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
500 Internal Server Error
```

Error messages should clearly explain the problem.

---

```bash
npm install

npm run migration

npm run start:dev
```