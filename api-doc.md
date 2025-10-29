# 📘 Banquet Booking API Documentation

Base URL:

`http://localhost:2000/api`

Authentication:

- **JWT Bearer Token** in `Authorization` header
- Example:

  `Authorization: Bearer <your_token_here>`

---

## 🔑 Auth Endpoints

### 1. Register User

**POST** `/auth/register`  
Registers a new user.

**Request Body**

`{  "email":  "user@example.com",  "password":  "password123",  "firstName":  "John",  "lastName":  "Doe",  "phone":  "+911234567890",  "role":  "owner" //default is owner to add superadmin and admin run /scripts/seed.ts  }`

**Response**

`{  "success":  true,  "message":  "User registered successfully",  "data":  {  "user":  {  "_id":  "64f...",  "email":  "user@example.com",  "firstName":  "John",  "lastName":  "Doe",  "role":  "user"  },  "token":  "<JWT_TOKEN>"  }  }`

---
### 1. Register User By Admin

**POST** `/auth/register`  
Registers a new user By Admin.

**Request Body**

`{  "email":  "user@example.com", ,  "firstName":  "John",  "lastName":  "Doe",  "phone":  "+911234567890",  "role":  "owner" //default is owner to add superadmin and admin run /scripts/seed.ts  }`

**Response**

{
	"success": true,
	"message": "User created by admin successfully",
	"data": {
		"user": {
			"email": "owner@example.com",
			"mustChangePassword": true,
			"firstName": "Jane",
			"lastName": "Doe",
			"phone": "9876543210",
			"role": "owner",
			"createdBy": "68c32003e9f517bae3a4c70e",
			"_id": "68d109acd7eeb6de94aa2529",
			"createdAt": "2025-09-22T08:32:44.006Z",
			"updatedAt": "2025-09-22T08:32:44.006Z",
			"__v": 0
		},
		"tempPassword": "w5lsN8hw"
	}
}


### 2. Login

**POST** `/auth/login`

**Request Body**

`{  "email":  "user@example.com",  "password":  "password123"  }`

**Response**

`{  "success":  true,  "message":  "Login successful",  "data":  {  "user":  {  "_id":  "64f...",  "email":  "user@example.com",  "firstName":  "John",  "role":  "admin"  },  "token":  "<JWT_TOKEN>"  }  }`

---

### 3. Get Profile

**GET** `/auth/profile`

**Headers**: `Authorization: Bearer <token>`

**Response**

`{  "success":  true,  "message":  "Profile retrieved successfully",  "data":  {  "user":  {  "_id":  "64f...",  "email":  "user@example.com",  "firstName":  "John",  "role":  "admin"  },  "roles":  [  {  "role":  "owner",  "permissions":  ["business.read",  "venue.create"],  "businessId":  {  "_id":  "68c...",  "businessName":  "Owner Biz"  }  }  ]  }  }`

---

## 🏢 Business Endpoints

Base: `/businesses`

### 1. Create Business

**POST** `/businesses`  
Roles: `superadmin`, `admin`, or any authenticated user (becomes **owner**).

**Request Body**

`{  "businessName":  "Banquet Royale",  "contact":  {  "phone":  "+911234567890",  "email":  "info@banquet.com"  },  "address":  {  "street":  "123 Street",  "city":  "Mumbai",  "state":  "Maharashtra",  "country":  "India",  "pincode":  "400001"  },  "website":  "https://banquet.com",  "bookingPreferences":  {  "timings":  {  "morning":  {  "start":  "09:00",  "end":  "12:00"  },  "evening":  {  "start":  "17:00",  "end":  "21:00"  },  "fullDay":  {  "start":  "09:00",  "end":  "21:00"  }  },  "notes":  "Special weekend offers"  }  }`

**Response**

`{  "success":  true,  "message":  "Business created successfully",  "data":  {  "_id":  "68c...",  "businessName":  "Banquet Royale",  "ownerId":  "64f...",  "status":  "active"  }  }`

---

### 2. Get All Businesses

**GET** `/businesses`

- **Superadmin** → sees all.
- **Admin/Owner** → sees only assigned businesses.

**Response**

`{  "success":  true,  "data":  [  {  "_id":  "68c...",  "businessName":  "Banquet Royale"  }  ],  "total":  1  }`

---

### 3. Get Business by ID

**GET** `/businesses/:businessId`  
Requires `business.read`.

---

### 4. Update Business

**PUT** `/businesses/:businessId`  
Requires `business.update`.

**Request Body**

`{  "businessName":  "Banquet Royale Deluxe",  "status":  "inactive"  }`

---

### 5. Delete Business

**DELETE** `/businesses/:businessId`

- Allowed: `superadmin`, `owner`
- Denied: `admin`

---

## 🏟️ Venue Endpoints

Base: `/venues`

### 1. Create Venue

**POST** `/venues`  
Requires `venue.create`.

**Request Body**

`{  "businessId":  "68c3212be3710fa083e0b119",  "venueName":  "Main Hall",  "venueType":  "banquet",  "capacity":  {  "min":  50,  "max":  500  },  "address":  {  "street":  "Hall Street",  "city":  "Mumbai",  "state":  "MH",  "country":  "India",  "pincode":  "400002"  }  }`

---

### 2. Get Venues by Business

**GET** `/venues/business/:businessId`

---

### 3. Get Venue by ID

**GET** `/venues/:venueId`

---

### 4. Update Venue

**PUT** `/venues/:venueId`  
Requires `venue.update`.

---

### 5. Delete Venue

**DELETE** `/venues/:venueId`  
Requires `venue.delete`.

---

## 🎁 Package Endpoints

Base: `/packages`

### 1. Create Package

**POST** `/packages`  
Requires `package.create`.

**Request Body**

`{  "venueId":  "68c...",  "name":  "Wedding Package",  "description":  "Includes decoration and catering",  "services":  ["catering",  "decor",  "sound"],  "price":  150000  }`

---

### 2. Get Packages by Venue

**GET** `/packages/venue/:venueId`

---

### 3. Get Package by ID

**GET** `/packages/:packageId`

---

### 4. Update Package

**PUT** `/packages/:packageId`  
Requires `package.update`.

---

### 5. Delete Package

**DELETE** `/packages/:packageId`  
Requires `package.delete`.

---

## 🔒 Role-based Access Control (RBAC)

- **Superadmin** → Full access to everything.
- **Admin** → Can `create/read/update` across all businesses, cannot delete.
- **Owner** → Has access only to their own business + venues/packages.

Permissions checked:

- `business.read`, `business.update`
- `venue.create`, `venue.read`, `venue.update`, `venue.delete`
- `package.create`, `package.read`, `package.update`, `package.delete`
