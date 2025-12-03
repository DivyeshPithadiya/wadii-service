# Transaction Architecture Documentation

## Overview

The payment architecture has been refactored to introduce a dedicated **Transaction model** that supports:
- Multiple payments per booking (partial, full, advance)
- Complete transaction history tracking
- Failed/successful transaction tracking
- Refund support
- Multiple payment modes per booking

## Architecture Changes

### Before (Old Architecture)
```
Booking Model
├── payment.totalAmount
├── payment.advanceAmount (single value)
├── payment.paymentStatus (calculated once)
└── payment.paymentMode (single mode)
```

**Issues:**
- No transaction history
- Single advance amount only
- No support for multiple payments
- No failed transaction tracking

### After (New Architecture)
```
Transaction Model (New)
├── bookingId → Reference to Booking
├── amount → Individual transaction amount
├── mode → Payment mode for this transaction
├── status → initiated | success | failed | refunded
├── type → advance | partial | full
├── referenceId → UPI/Bank reference
├── paidAt → When payment was made
└── notes → Transaction notes

Booking Model (Updated)
├── payment.totalAmount (unchanged)
├── payment.advanceAmount (calculated from transactions)
├── payment.paymentStatus (calculated from transactions)
└── payment.paymentMode (primary mode for reference)
```

## Database Models

### Transaction Model

**Location:** `src/models/Transaction.ts`

**Schema:**
```typescript
{
  bookingId: ObjectId (ref: Booking, required, indexed)
  amount: Number (required, min: 0)
  mode: Enum ["cash", "card", "upi", "bank_transfer", "cheque", "other"] (required, indexed)
  status: Enum ["initiated", "success", "failed", "refunded"] (default: "initiated", indexed)
  type: Enum ["advance", "partial", "full"] (required, indexed)
  referenceId: String (optional, for UPI/bank refs)
  notes: String
  paidAt: Date (required, indexed)
  createdBy: ObjectId (ref: User)
  updatedBy: ObjectId (ref: User)
  timestamps: true
}
```

**Indexes:**
- Single: `bookingId`, `mode`, `status`, `type`, `paidAt`, `amount`
- Compound: `(bookingId, status)`, `(bookingId, paidAt)`, `(paidAt, status)`, `(status, mode)`

### Booking Model Changes

**Location:** `src/models/Booking.ts`

**Changes:**
- `payment.advanceAmount` - Now calculated from Transaction model (backward compatible)
- `payment.paymentStatus` - Now calculated from Transaction model
- `payment.paymentMode` - Represents primary/default payment mode

**Note:** The Booking model still maintains these fields for backward compatibility but they are now computed from the Transaction model.

## API Endpoints

### Transaction Endpoints

#### 1. Create Transaction
```http
POST /api/transactions
```

**Request Body:**
```json
{
  "bookingId": "64abc123...",
  "amount": 5000,
  "mode": "upi",
  "status": "success",
  "type": "advance",
  "referenceId": "UPI123456",
  "notes": "Initial advance payment",
  "paidAt": "2025-01-15T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64xyz789...",
    "bookingId": "64abc123...",
    "amount": 5000,
    "mode": "upi",
    "status": "success",
    "type": "advance",
    "createdAt": "2025-01-15T10:00:00Z"
  },
  "message": "Transaction created successfully"
}
```

**Business Logic:**
- Automatically calculates transaction type based on total paid
- Updates booking's `paymentStatus` and `advanceAmount`
- Validates booking exists

#### 2. Get Transactions (with Filters)
```http
GET /api/transactions?bookingId=xxx&startDate=xxx&endDate=xxx&mode=upi&status=success
```

**Query Parameters:**
- `bookingId` - Filter by booking
- `startDate` - Filter by payment date (paidAt >= startDate)
- `endDate` - Filter by payment date (paidAt <= endDate)
- `mode` - Filter by payment mode
- `status` - Filter by transaction status
- `type` - Filter by transaction type
- `minAmount` - Minimum transaction amount
- `maxAmount` - Maximum transaction amount
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "pages": 2
  }
}
```

#### 3. Get Transaction by ID
```http
GET /api/transactions/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64xyz789...",
    "bookingId": {...},
    "amount": 5000,
    "mode": "upi",
    "status": "success",
    "type": "advance",
    "createdBy": {...},
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

#### 4. Get Booking for Transaction
```http
GET /api/transactions/:id/booking
```

Returns the complete booking details for a transaction.

#### 5. Update Transaction
```http
PATCH /api/transactions/:id
```

**Request Body:**
```json
{
  "status": "refunded",
  "notes": "Customer requested refund"
}
```

**Note:** Updating transaction status or amount automatically recalculates the booking's payment status.

#### 6. Get Transactions by Booking
```http
GET /api/transactions/booking/:bookingId
```

Returns all transactions for a specific booking, sorted by payment date.

### Report Endpoints

#### 1. Cash Ledger Report (Refactored)
```http
GET /api/reports/cash-ledger?venueId=xxx&startDate=xxx&endDate=xxx&paymentMode=upi
```

**Changes:**
- Now uses Transaction model for accurate payment tracking
- Payment mode breakdown based on actual transactions
- Supports multiple payment modes per booking

#### 2. Income & Expenditure Report (Refactored)
```http
GET /api/reports/income-expenditure?venueId=xxx&startDate=xxx&endDate=xxx&groupBy=service
```

**Changes:**
- Income calculated from successful transactions only
- Supports grouping by service, occasion type, or month
- More accurate financial reporting

#### 3. Transactions Summary (New)
```http
GET /api/reports/transactions-summary?startDate=xxx&endDate=xxx
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTransactions": 150,
    "successfulTransactions": 142,
    "failedTransactions": 8,
    "totalSuccessfulAmount": 450000,
    "advancePayments": 50,
    "partialPayments": 30,
    "fullPayments": 62,
    "byPaymentMode": {
      "cash": { "count": 20, "amount": 50000 },
      "upi": { "count": 80, "amount": 250000 },
      "card": { "count": 30, "amount": 100000 },
      "bank_transfer": { "count": 12, "amount": 50000 },
      "cheque": { "count": 0, "amount": 0 },
      "other": { "count": 0, "amount": 0 }
    }
  }
}
```

## Booking Creation Flow

### Old Flow
```
1. Create Booking with payment.advanceAmount
2. Done
```

### New Flow
```
1. Create Booking (sets payment.totalAmount, payment.paymentMode)
2. If advanceAmount > 0:
   - Create Transaction record
   - Transaction service calculates type (advance/partial/full)
   - Transaction service updates booking's paymentStatus
3. Done
```

**Code Example:**
```typescript
// In BookingController.createBooking
const booking = await BookingService.createBooking(bookingData);

// Create initial transaction if advance amount provided
if (req.body.payment?.advanceAmount > 0) {
  await TransactionService.createTransaction({
    bookingId: booking._id.toString(),
    amount: req.body.payment.advanceAmount,
    mode: req.body.payment.paymentMode,
    status: "success",
    notes: "Initial advance payment",
    paidAt: new Date(),
    createdBy: req.user.userId,
  });
}
```

## Payment Status Calculation

The `TransactionService.createTransaction()` method automatically:

1. Fetches all successful transactions for the booking
2. Calculates total paid amount
3. Determines transaction type:
   - **advance**: First payment, not covering full amount
   - **partial**: Subsequent payment, still not covering full amount
   - **full**: Payment that completes the booking amount
4. Updates booking's payment status:
   - **unpaid**: totalPaid === 0
   - **partially_paid**: 0 < totalPaid < totalAmount
   - **paid**: totalPaid >= totalAmount

## Benefits

1. **Complete Transaction History**: Every payment is tracked individually
2. **Multiple Payments**: Support for installments and partial payments
3. **Failed Transaction Tracking**: Track payment failures for analytics
4. **Refund Support**: Mark transactions as refunded
5. **Multiple Payment Modes**: Different transactions can use different payment modes
6. **Accurate Reporting**: Reports based on actual successful transactions
7. **Audit Trail**: Complete history with timestamps and user tracking
8. **Backward Compatible**: Booking model maintains summary fields

## Migration Notes

### For Existing Data

If you have existing bookings with `payment.advanceAmount`:

1. Create a migration script to convert existing advance amounts to Transaction records
2. For each booking with advanceAmount > 0:
   ```typescript
   await TransactionService.createTransaction({
     bookingId: booking._id.toString(),
     amount: booking.payment.advanceAmount,
     mode: booking.payment.paymentMode,
     status: "success",
     type: "advance",
     notes: "Migrated from legacy booking data",
     paidAt: booking.createdAt,
     createdBy: booking.createdBy,
   });
   ```

### Backward Compatibility

- Booking model still has `payment.advanceAmount` and `payment.paymentStatus`
- These fields are automatically updated by TransactionService
- Old API responses remain unchanged
- Reports are enhanced but maintain the same structure

## Testing

### Test Scenarios

1. **Create booking with advance payment**
   - Verify transaction record is created
   - Verify booking paymentStatus is updated

2. **Add partial payment**
   - Create additional transaction
   - Verify booking status updates to "partially_paid"

3. **Complete payment**
   - Create final transaction
   - Verify booking status updates to "paid"

4. **Failed transaction**
   - Create transaction with status "failed"
   - Verify booking status is NOT updated

5. **Multiple payment modes**
   - Create transactions with different modes
   - Verify reports correctly aggregate by mode

6. **Refund**
   - Update transaction status to "refunded"
   - Verify booking status recalculates correctly

## Performance Considerations

### Indexes
All critical query paths are indexed:
- Transaction queries by bookingId
- Transaction queries by date range (paidAt)
- Transaction queries by status
- Compound indexes for common filter combinations

### Aggregation
Reports use efficient aggregation pipelines:
- Minimal data fetching
- In-database calculations
- Proper use of MongoDB aggregation framework

### Caching Opportunities
Consider caching:
- Transaction summaries per booking
- Report data for common date ranges
- Payment status calculations

## Security

- All transaction endpoints require authentication
- Permission-based access control (BOOKING_READ, BOOKING_WRITE)
- Transaction updates recalculate booking status to prevent inconsistency
- Input validation on all endpoints

## Future Enhancements

1. **Payment Gateway Integration**: Link transactions to payment gateway records
2. **Automated Reconciliation**: Match bank statements with transactions
3. **Payment Reminders**: Send reminders based on pending amounts
4. **Payment Plans**: Support for predefined installment schedules
5. **Multi-currency Support**: Handle different currencies per transaction
6. **Commission Tracking**: Track commission on each transaction
7. **Tax Calculations**: Automatic tax calculations per transaction
