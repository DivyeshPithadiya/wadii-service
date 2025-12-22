# Vendor Payment & Purchase Order Architecture

## Overview

The system now supports comprehensive vendor payment tracking and purchase order (PO) management. This extends the Transaction model to handle both:
- **Inbound Transactions**: Customer payments to venue
- **Outbound Transactions**: Venue payments to vendors

## Architecture

### Unified Transaction Model

```
Transaction Model (Extended)
├── Customer Payments (Inbound)
│   ├── direction: "inbound"
│   ├── type: "advance" | "partial" | "full"
│   └── Updates booking paymentStatus
│
└── Vendor Payments (Outbound)
    ├── direction: "outbound"
    ├── type: "vendor_payment"
    ├── vendorId: Reference to vendor
    ├── vendorType: "catering" | "service"
    └── purchaseOrderId: Links to PO
```

### Purchase Order Management

```
PurchaseOrder Model
├── poNumber: Auto-generated (PO-2025-01-0001)
├── Vendor Details (embedded)
├── Line Items (services/products)
├── Payment Tracking
│   ├── totalAmount
│   ├── paidAmount (from transactions)
│   └── balanceAmount (calculated)
└── Status Lifecycle
    ├── draft
    ├── pending
    ├── approved
    ├── partially_paid
    ├── paid
    └── cancelled
```

## Database Models

### 1. Transaction Model (Extended)

**Location:** `src/models/Transaction.ts`

**New Fields:**
```typescript
{
  direction: "inbound" | "outbound" (default: "inbound")

  // Vendor payment fields (outbound only)
  vendorId?: ObjectId
  vendorType?: "catering" | "service"
  purchaseOrderId?: ObjectId
}
```

**Indexes Added:**
- `direction + status`
- `vendorId + status`
- `purchaseOrderId + status`
- `direction + vendorType`
- `bookingId + direction`

### 2. PurchaseOrder Model (New)

**Location:** `src/models/PurchaseOrder.ts`

**Schema:**
```typescript
{
  poNumber: string (unique, auto-generated)
  bookingId: ObjectId
  venueId: ObjectId

  vendorType: "catering" | "service"
  vendorDetails: {
    name: string
    email: string
    phone: string
    bankDetails: {...}
  }

  lineItems: [{
    description: string
    serviceType: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }]

  totalAmount: number
  paidAmount: number (calculated from transactions)
  balanceAmount: number (totalAmount - paidAmount)

  status: "draft" | "pending" | "approved" | "partially_paid" | "paid" | "cancelled"

  issueDate: Date
  dueDate: Date
  approvedAt: Date
  approvedBy: ObjectId

  termsAndConditions: string
  notes: string
  internalNotes: string
}
```

**Auto Features:**
- PO number auto-generated on creation (`PO-YYYY-MM-NNNN`)
- `balanceAmount` calculated on save
- Status auto-updated based on `paidAmount`:
  - `paid` when paidAmount >= totalAmount
  - `partially_paid` when 0 < paidAmount < totalAmount

## API Endpoints

### Transaction Endpoints (Extended)

#### Create Transaction (Inbound or Outbound)
```http
POST /api/transactions
```

**Customer Payment (Inbound):**
```json
{
  "bookingId": "64abc123...",
  "amount": 5000,
  "mode": "upi",
  "direction": "inbound",
  "status": "success"
}
```

**Vendor Payment (Outbound):**
```json
{
  "bookingId": "64abc123...",
  "amount": 3000,
  "mode": "bank_transfer",
  "direction": "outbound",
  "vendorId": "64xyz789...",
  "vendorType": "service",
  "purchaseOrderId": "64po123...",
  "status": "success",
  "referenceId": "TXN123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "direction": "outbound",
    "type": "vendor_payment",
    ...
  }
}
```

#### Get Transactions (with Vendor Filters)
```http
GET /api/transactions?direction=outbound&vendorType=catering&status=success
```

**New Query Parameters:**
- `direction` - Filter by inbound/outbound
- `vendorId` - Filter by specific vendor
- `vendorType` - Filter by catering/service
- `purchaseOrderId` - Filter by PO

### Purchase Order Endpoints

#### 1. Create PO
```http
POST /api/purchase-orders
```

**Request:**
```json
{
  "bookingId": "64abc123...",
  "venueId": "64venue...",
  "vendorType": "catering",
  "vendorDetails": {
    "name": "ABC Caterers",
    "email": "abc@caterers.com",
    "phone": "+91 9876543210",
    "bankDetails": {
      "accountNumber": "1234567890",
      "accountHolderName": "ABC Caterers",
      "ifscCode": "SBIN0001234",
      "bankName": "State Bank of India"
    }
  },
  "lineItems": [
    {
      "description": "Catering Services",
      "serviceType": "Catering",
      "quantity": 100,
      "unitPrice": 500,
      "totalPrice": 50000
    }
  ],
  "totalAmount": 50000,
  "dueDate": "2025-02-15",
  "notes": "Wedding catering for 100 guests"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "poNumber": "PO-2025-01-0001",
    "status": "draft",
    "totalAmount": 50000,
    "paidAmount": 0,
    "balanceAmount": 50000,
    ...
  },
  "message": "Purchase Order created successfully"
}
```

#### 2. Get POs (with Filters)
```http
GET /api/purchase-orders?venueId=xxx&status=approved&vendorType=service
```

**Query Parameters:**
- `bookingId` - Filter by booking
- `venueId` - Filter by venue
- `vendorType` - catering or service
- `status` - draft, pending, approved, paid, cancelled
- `startDate/endDate` - Filter by issue date
- `minAmount/maxAmount` - Amount range
- `searchVendor` - Search vendor name
- `page/limit` - Pagination

#### 3. Get PO by ID
```http
GET /api/purchase-orders/:id
```

Returns PO with related transactions.

#### 4. Update PO
```http
PATCH /api/purchase-orders/:id
```

#### 5. Approve PO
```http
POST /api/purchase-orders/:id/approve
```

Changes status to `approved` and records approval timestamp.

#### 6. Cancel PO
```http
POST /api/purchase-orders/:id/cancel

{
  "reason": "Vendor cancelled service"
}
```

#### 7. Auto-Generate POs for Booking
```http
POST /api/purchase-orders/generate/:bookingId
```

**Automatically creates POs for:**
- Catering vendor (if exists)
- All service vendors with vendor details

**Response:**
```json
{
  "success": true,
  "data": [
    { "poNumber": "PO-2025-01-0001", "vendorType": "catering", ... },
    { "poNumber": "PO-2025-01-0002", "vendorType": "service", ... },
    { "poNumber": "PO-2025-01-0003", "vendorType": "service", ... }
  ],
  "message": "3 Purchase Order(s) generated successfully"
}
```

#### 8. Get POs by Booking
```http
GET /api/purchase-orders/booking/:bookingId
```

#### 9. Get PO Summary
```http
GET /api/purchase-orders/summary?venueId=xxx&startDate=xxx&endDate=xxx
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPOs": 50,
    "draftPOs": 5,
    "pendingPOs": 10,
    "approvedPOs": 20,
    "paidPOs": 10,
    "cancelledPOs": 5,
    "totalPOAmount": 500000,
    "totalPaidAmount": 350000,
    "totalBalanceAmount": 150000,
    "byVendorType": {
      "catering": { "count": 25, "amount": 300000, "paid": 200000 },
      "service": { "count": 25, "amount": 200000, "paid": 150000 }
    }
  }
}
```

### Report Endpoints (Extended)

#### Vendor Payments Report (New)
```http
GET /api/reports/vendor-payments?venueId=xxx&startDate=xxx&endDate=xxx&vendorType=catering
```

**Response:**
```json
{
  "success": true,
  "data": {
    "purchaseOrders": {
      "totalPOs": 20,
      "totalPOAmount": 200000,
      "totalPaidAmount": 150000,
      "totalBalanceAmount": 50000,
      ...
    },
    "transactions": {
      "totalTransactions": 45,
      "successfulTransactions": 42,
      "totalSuccessfulAmount": 150000,
      ...
    },
    "overallSummary": {
      "totalPOAmount": 200000,
      "totalPaid": 150000,
      "balanceDue": 50000
    }
  }
}
```

## Workflows

### 1. Complete Booking → PO → Payment Flow

#### Step 1: Create Booking
```http
POST /api/bookings
```

Booking includes:
- Catering vendor details
- Service vendor details
- Service prices

#### Step 2: Auto-Generate POs
```http
POST /api/purchase-orders/generate/:bookingId
```

System creates:
- 1 PO for catering vendor (if exists)
- N POs for N service vendors (with vendor details)

Each PO starts in `draft` status.

#### Step 3: Approve POs
```http
POST /api/purchase-orders/:poId/approve
```

Manager/owner approves each PO.
Status changes: `draft` → `approved`

#### Step 4: Make Vendor Payment
```http
POST /api/transactions
```

```json
{
  "bookingId": "...",
  "amount": 25000,
  "mode": "bank_transfer",
  "direction": "outbound",
  "vendorId": "...",
  "vendorType": "catering",
  "purchaseOrderId": "...",
  "status": "success",
  "referenceId": "NEFT1234567",
  "notes": "Advance payment - 50%"
}
```

**System automatically:**
- Creates outbound transaction
- Updates PO `paidAmount`
- Updates PO status to `partially_paid`
- Recalculates `balanceAmount`

#### Step 5: Complete Payment
Make another transaction for remaining amount.

**System automatically:**
- Updates PO `paidAmount`
- Changes status to `paid` when paidAmount >= totalAmount
- Sets `completedAt` timestamp

### 2. Manual PO Creation

For vendors not in the booking:

```http
POST /api/purchase-orders
```

Provide all vendor details manually.

### 3. Payment Without PO

You can create outbound transactions without a PO:

```json
{
  "direction": "outbound",
  "vendorId": "...",
  "vendorType": "service",
  // No purchaseOrderId
}
```

Useful for ad-hoc vendor payments.

## Payment Tracking Features

### For Customer Payments (Inbound)
- Tracks multiple payments per booking
- Auto-calculates payment type (advance/partial/full)
- Updates booking `paymentStatus`
- Maintains `advanceAmount` for backward compatibility

### For Vendor Payments (Outbound)
- Links to Purchase Orders
- Tracks vendor by ID and type
- Supports payment references (bank TXN IDs, etc.)
- Auto-updates PO payment status

### Unified Financial View
All transactions (inbound + outbound) in one model:
- Easy cashflow reports
- Filter by direction for specific views
- Complete audit trail with timestamps

## PO Number Generation

Format: `PO-YYYY-MM-NNNN`

Examples:
- `PO-2025-01-0001` - First PO in January 2025
- `PO-2025-01-0002` - Second PO in January 2025
- `PO-2025-02-0001` - First PO in February 2025

**Logic:**
- Find last PO for current month
- Increment sequence number
- Reset to 0001 each month
- Auto-generated on PO creation

## Status Lifecycle

### Purchase Order Status
```
draft (created)
  ↓
pending (optional - waiting for approval)
  ↓
approved (manager approved)
  ↓
partially_paid (some payment received)
  ↓
paid (fully paid)

cancelled (can cancel from any status except paid)
```

### Auto Status Updates
- **partially_paid**: Automatically set when paidAmount > 0 and < totalAmount
- **paid**: Automatically set when paidAmount >= totalAmount
- **completedAt**: Automatically set when status becomes `paid`

## Vendor Types

### Catering Vendor
- One per booking (optional)
- Stored in `booking.cateringServiceVendor`
- PO includes guest count and per-guest pricing

### Service Vendors
- Multiple per booking
- Stored in `booking.services[]`
- Each service can have a vendor
- One PO per service vendor

## Bank Details Structure

```typescript
{
  accountNumber: string
  accountHolderName: string
  ifscCode: string
  bankName: string
  branchName: string
  upiId: string
}
```

All fields optional, supports various payment methods.

## Security & Permissions

### Transaction Endpoints
- **Create**: Requires `BUSINESS_CREATE` permission
- **Read**: Requires `BOOKING_READ` permission
- **Update**: Requires `BUSINESS_CREATE` permission

### Purchase Order Endpoints
- **Create**: Requires `BUSINESS_CREATE` permission
- **Read**: Requires `BOOKING_READ` permission
- **Update/Approve/Cancel**: Requires `BUSINESS_CREATE` permission

### Report Endpoints
- All reports: Require `BOOKING_READ` permission

## Reporting Capabilities

### 1. Cash Ledger Report
Now includes outbound vendor payments.

### 2. Income & Expenditure Report
- Income: Customer transactions (inbound)
- Expenditure: Vendor transactions (outbound)
- Net profit calculated accurately

### 3. Transactions Summary
Filter by direction for:
- Customer payment summary
- Vendor payment summary

### 4. Vendor Payments Report (New)
Comprehensive vendor payment tracking:
- PO summary
- Transaction summary
- Balance due

### 5. PO Summary
- Count by status
- Total amounts
- Breakdown by vendor type

## Best Practices

### 1. Always Create POs First
Before making vendor payments, create and approve POs for proper tracking.

### 2. Use Auto-Generation
Let the system auto-generate POs from booking to ensure consistency.

### 3. Link Transactions to POs
Always include `purchaseOrderId` when making vendor payments.

### 4. Record Payment References
Store bank reference IDs in `referenceId` field for reconciliation.

### 5. Use Internal Notes
Use `internalNotes` for sensitive information not visible to vendors.

### 6. Approve Before Payment
Change PO status to `approved` before allowing payments (business rule).

## Migration Considerations

### Backward Compatibility
- Existing customer transactions work as-is
- `direction` defaults to "inbound" for old transactions
- Booking `payment` fields still maintained

### New Features Only
- Vendor payments are new functionality
- No data migration needed
- Can start using immediately

## Future Enhancements

1. **Email Notifications**: Send PO PDFs to vendors
2. **Approval Workflow**: Multi-level PO approval
3. **Recurring POs**: Template-based PO generation
4. **Vendor Portal**: Let vendors view their POs
5. **Payment Schedules**: Predefined payment milestones
6. **Credit Terms**: Net 30, Net 60 payment terms
7. **Tax Calculations**: GST/TDS on vendor payments
8. **Bulk Payments**: Pay multiple POs at once
9. **Payment Reconciliation**: Match bank statements
10. **Vendor Performance**: Track vendor delivery metrics

## Example Use Cases

### Use Case 1: Wedding Booking with Multiple Vendors

```
1. Create booking with:
   - Catering: ABC Caterers (₹100,000)
   - Photography: XYZ Photos (₹30,000)
   - Decoration: Decor Inc (₹40,000)

2. Auto-generate 3 POs:
   POST /api/purchase-orders/generate/:bookingId
   → PO-2025-01-0001 (Catering)
   → PO-2025-01-0002 (Photography)
   → PO-2025-01-0003 (Decoration)

3. Approve all POs:
   POST /api/purchase-orders/PO-2025-01-0001/approve
   POST /api/purchase-orders/PO-2025-01-0002/approve
   POST /api/purchase-orders/PO-2025-01-0003/approve

4. Make advance payments (50%):
   - Catering: ₹50,000
   - Photography: ₹15,000
   - Decoration: ₹20,000

5. After event, make final payments:
   - Catering: ₹50,000 (completes PO)
   - Photography: ₹15,000 (completes PO)
   - Decoration: ₹20,000 (completes PO)

6. All POs auto-marked as "paid"
```

### Use Case 2: Ad-hoc Vendor Payment

```
1. Need to pay a vendor not in booking system:
   POST /api/purchase-orders
   {
     "vendorType": "service",
     "vendorDetails": { "name": "Emergency Repairs" },
     "lineItems": [{ "description": "AC Repair", "totalPrice": 5000 }],
     "totalAmount": 5000
   }

2. Approve PO

3. Make payment:
   POST /api/transactions
   {
     "direction": "outbound",
     "vendorId": "...",
     "purchaseOrderId": "...",
     "amount": 5000
   }
```

## Summary

This architecture provides:
✅ Complete vendor payment tracking
✅ Auto-generated PO numbers
✅ Unified transaction model
✅ PO lifecycle management
✅ Comprehensive reporting
✅ Audit trail for all payments
✅ Backward compatible
✅ Scalable for future features

All vendor payments and POs are now tracked systematically with full integration into the existing booking and transaction system.
