# Manager System API Guide

## 🎯 **Complete Owner-Manager Assignment System**

This system allows **Owners** to create and assign **Managers** with venue-level or business-level access control.

## 🔐 **Role Hierarchy**
- **DEVELOPER**: Full system access
- **OWNER**: Can create and assign managers within their business
- **MANAGER**: Read-only access to assigned venues/business

## 📋 **API Endpoints**

### **1. Create Manager** 
**`POST /api/managers`**

Creates a new manager user account for a business.

**Request:**
```json
{
  "email": "manager@example.com",
  "firstName": "John",
  "lastName": "Doe", 
  "phone": "+1234567890",
  "businessId": "60d5ecb74f5c2a001d8b4567"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Manager created successfully",
  "data": {
    "user": {
      "_id": "60d5ecb74f5c2a001d8b4568",
      "email": "manager@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "role": "manager"
    },
    "tempPassword": "Abc123Def" // Send this to manager via email/SMS
  }
}
```

---

### **2. List Business Managers**
**`GET /api/managers/business/:businessId`**

Lists all managers assigned to a business (any scope).

**Response:**
```json
{
  "success": true,
  "message": "Managers retrieved successfully",
  "data": [
    {
      "_id": "60d5ecb74f5c2a001d8b4569",
      "user": {
        "_id": "60d5ecb74f5c2a001d8b4568",
        "email": "manager@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+1234567890"
      },
      "business": {
        "_id": "60d5ecb74f5c2a001d8b4567",
        "businessName": "Elite Banquets"
      },
      "venue": { // null if business-level
        "_id": "60d5ecb74f5c2a001d8b4570",
        "venueName": "Grand Hall"
      },
      "scope": "venue", // "business" | "venue"
      "assignedBy": "60d5ecb74f5c2a001d8b4566",
      "createdAt": "2023-01-15T10:00:00Z",
      "updatedAt": "2023-01-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

---

### **3. List Available Managers**
**`GET /api/managers/business/:businessId/available`**

Shows all managers in the business with their current assignments (for assignment UI).

**Response:**
```json
{
  "success": true,
  "message": "Available managers retrieved successfully",
  "data": [
    {
      "_id": "60d5ecb74f5c2a001d8b4568",
      "email": "manager@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "currentAssignments": [
        {
          "scope": "venue",
          "venue": "Grand Hall"
        },
        {
          "scope": "business",
          "venue": null // business-level access
        }
      ]
    }
  ],
  "total": 1
}
```

---

### **4. List Venue Managers**
**`GET /api/managers/venue/:venueId`**

Lists all managers who have access to a specific venue (venue-specific + business-level).

**Response:** Same format as business managers list.

---

### **5. Assign Manager to Venue**
**`POST /api/managers/assign`**

Assigns existing manager to a venue or business scope.

**Request Examples:**

**Venue-Level Assignment:**
```json
{
  "managerId": "60d5ecb74f5c2a001d8b4568",
  "businessId": "60d5ecb74f5c2a001d8b4567",
  "venueId": "60d5ecb74f5c2a001d8b4570",
  "scope": "venue"
}
```

**Business-Level Assignment:**
```json
{
  "managerId": "60d5ecb74f5c2a001d8b4568", 
  "businessId": "60d5ecb74f5c2a001d8b4567",
  "scope": "business"
  // venueId not needed for business scope
}
```

**Response:**
```json
{
  "success": true,
  "message": "Manager assigned successfully",
  "data": {
    "_id": "60d5ecb74f5c2a001d8b4569",
    "user": { /* user details */ },
    "business": { /* business details */ },
    "venue": { /* venue details or null */ },
    "scope": "venue",
    "assignedBy": "60d5ecb74f5c2a001d8b4566"
  }
}
```

---

### **6. Remove Manager Assignment**
**`DELETE /api/managers/assignments/:assignmentId`**

Removes a specific manager assignment.

**Response:**
```json
{
  "success": true,
  "message": "Manager assignment removed successfully"
}
```

## 🔄 **Owner Workflow Examples**

### **Scenario 1: Create Manager for Specific Venue**
```bash
# Step 1: Create manager user
POST /api/managers
{
  "email": "venue.manager@example.com",
  "firstName": "Alice",
  "businessId": "business123"
}

# Step 2: Assign to specific venue
POST /api/managers/assign  
{
  "managerId": "manager456",
  "businessId": "business123",
  "venueId": "venue789", 
  "scope": "venue"
}

# Result: Manager can read-only access venue789 data
```

### **Scenario 2: Create Manager for All Venues**
```bash
# Step 1: Create manager user
POST /api/managers
{
  "email": "business.manager@example.com",
  "firstName": "Bob",
  "businessId": "business123"
}

# Step 2: Assign to entire business
POST /api/managers/assign
{
  "managerId": "manager789",
  "businessId": "business123",
  "scope": "business"
}

# Result: Manager can read-only access ALL venues in business123
```

### **Scenario 3: List Managers for Assignment UI**
```bash
# Get available managers to show in dropdown
GET /api/managers/business/business123/available

# Shows managers with their current assignments
# UI can show: "John Doe (assigned to Grand Hall, Main Ballroom)"
```

## 🔒 **Permission Matrix**

| Action | Developer | Owner | Manager |
|--------|-----------|-------|---------|
| Create Manager | ✅ | ✅ | ❌ |
| List Managers | ✅ | ✅ | ✅ (read-only) |
| Assign Manager | ✅ | ✅ | ❌ |
| Remove Assignment | ✅ | ✅ | ❌ |
| Access Venue Data | ✅ | ✅ | ✅ (assigned only) |

## 🏗️ **Database Schema**

The `UserBusinessRole` model supports venue-level assignments:

```typescript
{
  userId: ObjectId,        // Manager user
  businessId: ObjectId,    // Business context
  venueId?: ObjectId,      // Optional - specific venue
  role: "manager",         // Always manager for these assignments
  scope: "business" | "venue", // Access scope
  permissions: string[],   // Read-only permissions
  assignedBy: ObjectId,    // Who created this assignment
}
```

## 🚀 **Frontend Integration**

### **Owner Dashboard Components:**
1. **Manager Creation Form** → `POST /api/managers`
2. **Manager List Table** → `GET /api/managers/business/:businessId`
3. **Assignment Modal** → `GET /api/managers/business/:businessId/available` + `POST /api/managers/assign`
4. **Venue Manager List** → `GET /api/managers/venue/:venueId`

### **Manager Dashboard:**
- Managers get read-only access to their assigned venues
- Use existing venue/package/booking endpoints
- Permission system automatically restricts access

Your Owner-Manager assignment system is now **complete and production-ready**! 🎉
