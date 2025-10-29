# WAADI — MVP Data Model (Lean)

## Collections

### `users`

```json
{
  "_id": "...",
  "email": "...",
  "password": "...",
"firstName":"",
"lastName":"",
  "phone": null,
  "createdAt": "Date",
  "updatedAt": "Date",
  "createdBy": "ObjectId",
  "updatedBy": "ObjectId"
}
```

### `businesses`

```json
{
  "_id": "ObjectId",
  "ownerId": "ObjectId", // primary owner (also
  "businessName": "String", // unique
  "contact": {
    "phone": "String",
    "email": "String"
  },
  "address": {
    "street": "String",
    "city": "String",
    "state": "String",
    "country": "String",
    "pincode": "String"
  },
  "website": "String|null",
  "socials?": [{ "name": "String", "url": "String" }],
  "branding": { "logoUrl": "String|null" },

  "bookingPreferences": {
     "timings": {
    "morning": { "start": "08:00", "end": "12:00" },
    "evening": { "start": "17:00", "end": "21:00" },
    "fullDay": { "start": "08:00", "end": "21:00" }
  },
    "notes": "String|null" //just in case
  },

  "status": {
    "type": "String",
    "enum": ["inactive", "active"],
    "default": "active"
  },
  "isDeleted": "Boolean",

  "createdAt": "Date",
  "updatedAt": "Date",
  "createdBy": "ObjectId",
  "updatedBy": "ObjectId"
}
```

### `venues (1 business → many venues)`

```json
{
  "_id": "ObjectId",
  "businessId": "ObjectId",
  "venueName": "String",
  "venueType": {
    "type": "String",
    "enum": ["banquet", "theatre", "convention_center", "other"]
  },
  "capacity": { "min": "Number", "max": "Number" },
  "address": {
    "street": "String",
    "city": "String",
    "state": "String",
    "country": "String",
    "pincode": "String"
  },
  "media": {
    "coverImageUrl": "String|null"
  },
  "status": {
    "type": "String",
    "enum": ["active", "inactive"],
    "default": "active"
  },
  "createdAt": "Date",
  "updatedAt": "Date",
  "createdBy": "ObjectId",
  "updatedBy": "ObjectId"
}
```

### `packages (per venue or business)`

```json
{
  "_id": "ObjectId",
  "venueId": "ObjectId",

  "name": "String", // e.g., "Premium", "Bronze" "Wedding Tops"
  "description": "String|null",
  "services": ["String"], // simple MVP;

  "price": "Number",

  "status": {
    "type": "String",
    "enum": ["active", "inactive"],
    "default": "active"
  },

  "createdAt": "Date",
  "updatedAt": "Date",
  "createdBy": "ObjectId",
  "updatedBy": "ObjectId"
}
```

if we want more flexible role based access control we can create below collection type

### `user_business_roles (many-to-many, per-tenant RBAC)`

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId", // -> users._id
  "businessId": "ObjectId", // -> businesses._id
  "role": { "type": "String", "enum": ["superadmin", "admin", "owner"] },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Indexes (MVP)

- `users.email` unique
- `businesses.name` unique
