# 🎨 Visual Diagrams & Architecture Reference

## 1. High-Level System Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                            │
│  (Thunder Client, Postman, Web Browser, Mobile App)       │
│                    HTTP/REST                               │
└────────────────┬─────────────────────────────────────────┘
                 │ POST /approvals
                 │ GET /approvals/{id}
                 │ POST /approvals/{id}/approve
                 │ POST /approvals/{id}/reject
                 ↓
┌────────────────────────────────────────────────────────────┐
│           NESTJS API SERVER (localhost:3000)               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         ApprovalsController                          │  │
│  │  • Route handlers                                    │  │
│  │  • Input validation (DTO)                            │  │
│  │  • HTTP status codes                                 │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                       │
│  ┌──────────────────↓───────────────────────────────────┐  │
│  │         ApprovalsService                             │  │
│  │  • Business logic                                    │  │
│  │  • State transitions                                 │  │
│  │  • Concurrency control                               │  │
│  │  • Error handling                                    │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                       │
│  ┌──────────────────↓───────────────────────────────────┐  │
│  │         PrismaService                                │  │
│  │  • Database client wrapper                           │  │
│  │  • Type-safe queries                                 │  │
│  │  • Connection pooling                                │  │
│  └──────────────────┬───────────────────────────────────┘  │
└────────────────────┼──────────────────────────────────────┘
                     │
                     ↓
┌────────────────────────────────────────────────────────────┐
│      PRISMA CLIENT (Auto-generated from schema)            │
│  • Translates TypeScript → SQL                             │
│  • Type checking at compile time                           │
│  • Automatic CRUD operations                               │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ↓
┌────────────────────────────────────────────────────────────┐
│         POSTGRESQL DATABASE (localhost:5432)               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  approval_requests Table                             │  │
│  │  • ACID transactions                                 │  │
│  │  • Row-level locking                                 │  │
│  │  • Data persistence                                  │  │
│  │  • Atomic conditional updates                        │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Database Transaction Flow - Concurrency Example

```
SCENARIO: 3 Users Try to Approve Same Request Simultaneously

Initial State:
┌─────────────────────────────────────┐
│ ID: 550e8400...                     │
│ Status: PENDING                     │
│ Version: 1                          │
└─────────────────────────────────────┘

Timeline:

T=0ms
    User A              User B              User C
    │                   │                   │
    └─→ POST /approve   │                   │
        ↓               │                   │
    [Acquire lock]      │                   │
    ↓                   │                   │
    Check: status=      │                   │
    PENDING? ✓          │                   │
    ↓                   │                   │
    UPDATE...           │                   │
    status=APPROVED     │                   │
    version=2           │                   │
    ↓                   │                   │
    [LOCK HELD]         │                   │
    (B & C wait here)   │                   │


T=1ms
                        (User A still updating)
    ┌────────────────┐
    │ [LOCK HELD]    │
    │ Processing... │
    └────────────────┘


T=2ms
    ✓ COMMIT           ← Waits        ← Waits
    [Lock released]    │              │
    ↓                  ↓              ↓
    User A             [Acquire       [Waiting
    returns:           lock]          in queue]
    
    200 OK             Check:
    {                  status=
      "status":        PENDING?
      "APPROVED",      ✗ NO!
      "version": 2     (Now APPROVED)
    }                  ↓
                       No update
                       made
                       ↓
                       [Lock released]
                       ↓
                       User B returns:
                       
                       409 Conflict
                       "Already processed"


T=3ms                                  ↓
                                       [Acquire lock]
                                       Check:
                                       status=PENDING?
                                       ✗ NO!
                                       ↓
                                       No update
                                       [Lock released]
                                       ↓
                                       User C returns:
                                       
                                       409 Conflict
                                       "Already processed"


Final State:
┌─────────────────────────────────────┐
│ ID: 550e8400...                     │
│ Status: APPROVED          ← Changed  │
│ Version: 2                ← Incremented
└─────────────────────────────────────┘

Result Summary:
  User A: 200 OK     (1 success)
  User B: 409 Conflict (1 conflict)
  User C: 409 Conflict (1 conflict)
  
Data Integrity: ✓ GUARANTEED
Audit Trail: ✓ Perfect (version=2 proves 1 update)
```

---

## 3. Request/Response Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  CLIENT REQUEST                         │
│  Method: POST                                           │
│  URL: /approvals                                        │
│  Body: { "title": "Q1 Budget" }                         │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTP
                  ↓
        ┌─────────────────────┐
        │ Router              │
        │ (Matches /approvals)│
        └─────────┬───────────┘
                  │
                  ↓
    ┌─────────────────────────────┐
    │ ApprovalsController.create() │
    │                             │
    │ 1. Extract body             │
    │ 2. Create DTO               │
    │ 3. Validate:                │
    │    - title exists?          │
    │    - title is string?       │
    │ 4. Call service             │
    └─────────┬───────────────────┘
              │
              ↓
    ┌─────────────────────────────┐
    │ ApprovalsService.create()   │
    │                             │
    │ 1. Call Prisma create()     │
    │ 2. Transform result         │
    │ 3. Return DTO               │
    └─────────┬───────────────────┘
              │
              ↓
    ┌─────────────────────────────┐
    │ Prisma.approvalRequest.create│
    │                             │
    │ 1. Generate SQL:            │
    │    INSERT INTO...           │
    │ 2. Execute query            │
    │ 3. Return created object    │
    └─────────┬───────────────────┘
              │
              ↓
    ┌─────────────────────────────┐
    │ PostgreSQL Database         │
    │                             │
    │ INSERT INTO approval_requests│
    │ (id, title, status, ...)    │
    │ VALUES (...)                │
    │                             │
    │ RETURNING *                 │
    └─────────┬───────────────────┘
              │
              ↓ (Returns inserted row)
    ┌─────────────────────────────┐
    │ Prisma unmarshals to object │
    │ { id, title, status, ... }  │
    └─────────┬───────────────────┘
              │
              ↓
    ┌─────────────────────────────┐
    │ Service transforms to DTO   │
    │ ApprovalResponseDto         │
    └─────────┬───────────────────┘
              │
              ↓
    ┌─────────────────────────────┐
    │ Controller returns response │
    │ with status 201 Created     │
    └─────────┬───────────────────┘
              │ HTTP
              ↓
┌─────────────────────────────────────────────────────────┐
│                   HTTP RESPONSE                         │
│  Status: 201 Created                                    │
│  Body: {                                                │
│    "id": "550e8400...",                                 │
│    "title": "Q1 Budget",                                │
│    "status": "PENDING",                                 │
│    "version": 1,                                        │
│    "createdAt": "2026-05-18T10:00:00Z",                 │
│    "updatedAt": "2026-05-18T10:00:00Z"                  │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Prisma ORM Translation Layer

```
┌──────────────────────────────────────────────────────────┐
│               TYPESCRIPT CODE (Service)                  │
│                                                          │
│  const result = await this.prisma.approvalRequest        │
│    .updateMany({                                         │
│      where: {                                            │
│        id: "550e8400...",                                │
│        status: ApprovalStatus.PENDING                    │
│      },                                                  │
│      data: {                                             │
│        status: targetStatus,                             │
│        version: { increment: 1 }                         │
│      }                                                   │
│    });                                                   │
└──────────────────┬───────────────────────────────────────┘
                   │
        (Prisma generates SQL)
                   │
                   ↓
┌──────────────────────────────────────────────────────────┐
│                  SQL QUERY (PostgreSQL)                  │
│                                                          │
│  UPDATE approval_requests                                │
│  SET                                                     │
│    status = 'APPROVED',                                  │
│    version = version + 1,                                │
│    updated_at = NOW()                                    │
│  WHERE                                                   │
│    id = '550e8400-...' AND                               │
│    status = 'PENDING'                                    │
│  RETURNING *;                                            │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────┐
│              DATABASE EXECUTION                          │
│                                                          │
│  1. Parse SQL                                            │
│  2. Lock row for update                                  │
│  3. Check condition: status = 'PENDING'?                │
│  4. If YES:                                              │
│     - Set new values                                     │
│     - Increment version                                  │
│     - Update timestamp                                   │
│     - Return affected row                                │
│  5. If NO:                                               │
│     - Do nothing                                         │
│     - Return 0 rows affected                             │
│  6. Release lock                                         │
│  7. Commit transaction                                   │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────┐
│           RESPONSE OBJECT (JavaScript)                   │
│                                                          │
│  result = {                                              │
│    count: 1,    // Number of rows updated                │
│  }                                                       │
│                                                          │
│  If count === 1: Update succeeded ✓                      │
│  If count === 0: Condition not met (already approved) ✗  │
└──────────────────────────────────────────────────────────┘
```

---

## 5. State Machine (Status Transitions)

```
┌─────────────────────────────────────────────────────────┐
│                    STATE MACHINE                        │
└─────────────────────────────────────────────────────────┘

Starting State:
┌──────────┐
│ PENDING  │  ← Created here
└────┬─────┘
     │
     └────────────────┬─────────────────┐
                      │                 │
                      ↓                 ↓
            ┌──────────────────┐  ┌──────────────────┐
            │ APPROVED (Final) │  │ REJECTED (Final) │
            │                  │  │                  │
            │ No state change  │  │ No state change  │
            │ beyond this      │  │ beyond this      │
            └──────────────────┘  └──────────────────┘

Transition Rules:
┌────────────────────────────────────────────────────────┐
│ FROM: PENDING                                          │
│                                                        │
│ TO: APPROVED                                           │
│   Triggered by: POST /approvals/{id}/approve          │
│   Atomic SQL: WHERE status='PENDING'                  │
│   Success: Returns 200 OK                             │
│   Failure: Returns 409 Conflict                        │
│                                                        │
│ TO: REJECTED                                           │
│   Triggered by: POST /approvals/{id}/reject           │
│   Atomic SQL: WHERE status='PENDING'                  │
│   Success: Returns 200 OK                             │
│   Failure: Returns 409 Conflict                        │
├────────────────────────────────────────────────────────┤
│ FROM: APPROVED                                         │
│                                                        │
│ Cannot transition further                              │
│ All attempts return: 409 Conflict                      │
├────────────────────────────────────────────────────────┤
│ FROM: REJECTED                                         │
│                                                        │
│ Cannot transition further                              │
│ All attempts return: 409 Conflict                      │
└────────────────────────────────────────────────────────┘

Version Field Tracking:
PENDING (v1) → APPROVED (v2) → [No further changes]
             or
             → REJECTED (v2)  → [No further changes]

Each transition increments version by 1
```

---

## 6. Database Schema Visualization

```
┌─────────────────────────────────────────────────────────┐
│              approval_requests TABLE                    │
├─────────────────────────────────────────────────────────┤
│ Column Name │ Type        │ Constraints   │ Example      │
├─────────────┼─────────────┼───────────────┼──────────────┤
│ id          │ UUID        │ PRIMARY KEY   │ 550e8400...  │
│             │             │ NOT NULL      │              │
├─────────────┼─────────────┼───────────────┼──────────────┤
│ title       │ VARCHAR     │ NOT NULL      │ "Q1 Budget"  │
├─────────────┼─────────────┼───────────────┼──────────────┤
│ status      │ ENUM        │ NOT NULL      │ "PENDING"    │
│             │ PENDING |   │ DEFAULT:      │ or           │
│             │ APPROVED|   │ PENDING       │ "APPROVED"   │
│             │ REJECTED    │               │ or "REJECTED"│
├─────────────┼─────────────┼───────────────┼──────────────┤
│ version     │ INTEGER     │ NOT NULL      │ 1, 2, 3...   │
│             │             │ DEFAULT: 1    │              │
├─────────────┼─────────────┼───────────────┼──────────────┤
│ created_at  │ TIMESTAMP   │ NOT NULL      │ 2026-05-18   │
│             │             │ DEFAULT:      │ 10:00:00 UTC │
│             │             │ NOW()         │              │
├─────────────┼─────────────┼───────────────┼──────────────┤
│ updated_at  │ TIMESTAMP   │ NOT NULL      │ 2026-05-18   │
│             │             │ DEFAULT:      │ 10:05:00 UTC │
│             │             │ NOW()         │              │
└─────────────┴─────────────┴───────────────┴──────────────┘

Sample Row:
┌────────────────────────────────────────────────────────┐
│ id      │ 550e8400-e29b-41d4-a716-446655440000        │
│ title   │ Q1 Marketing Budget                         │
│ status  │ APPROVED                                     │
│ version │ 2                                            │
│ created │ 2026-05-18 10:00:00 +00:00                  │
│ updated │ 2026-05-18 10:02:15 +00:00                  │
└────────────────────────────────────────────────────────┘

Indexes (for performance):
├── PRIMARY KEY (id) - Fast lookup
└── (Optional) INDEX ON (status) - Fast filtering
```

---

## 7. API Endpoints Summary

```
┌──────────────────────────────────────────────────────────┐
│              API ENDPOINTS OVERVIEW                      │
├──────────────────────────────────────────────────────────┤

1️⃣  CREATE APPROVAL REQUEST
    ┌─────────────────────────────────────────────────────┐
    │ Endpoint: POST /approvals                           │
    │ Input:    { "title": "string" }                     │
    │ Response: 201 Created                               │
    │ Body:     {                                         │
    │             "id": "uuid",                           │
    │             "title": "string",                      │
    │             "status": "PENDING",                    │
    │             "version": 1,                           │
    │             "createdAt": "iso-date",                │
    │             "updatedAt": "iso-date"                 │
    │           }                                         │
    └─────────────────────────────────────────────────────┘

2️⃣  GET APPROVAL REQUEST
    ┌─────────────────────────────────────────────────────┐
    │ Endpoint: GET /approvals/{id}                       │
    │ Input:    UUID in URL path                          │
    │ Response: 200 OK                                    │
    │ Body:     (Same as above)                           │
    │           OR                                        │
    │ Response: 404 Not Found                             │
    │ Body:     {                                         │
    │             "message": "Approval request {id}...",  │
    │             "error": "Not Found"                    │
    │           }                                         │
    └─────────────────────────────────────────────────────┘

3️⃣  APPROVE REQUEST
    ┌─────────────────────────────────────────────────────┐
    │ Endpoint: POST /approvals/{id}/approve              │
    │ Input:    UUID in URL path                          │
    │ Response: 200 OK (if approved)                      │
    │ Body:     {                                         │
    │             "id": "uuid",                           │
    │             "status": "APPROVED",  ← Changed!       │
    │             "version": 2            ← Incremented!  │
    │           }                                         │
    │           OR                                        │
    │ Response: 409 Conflict (already processed)          │
    │ Body:     {                                         │
    │             "statusCode": 409,                      │
    │             "message": "Request is not pending..."  │
    │           }                                         │
    │           OR                                        │
    │ Response: 404 Not Found (id doesn't exist)          │
    └─────────────────────────────────────────────────────┘

4️⃣  REJECT REQUEST
    ┌─────────────────────────────────────────────────────┐
    │ Endpoint: POST /approvals/{id}/reject               │
    │ Input:    UUID in URL path                          │
    │ Response: 200 OK (if rejected)                      │
    │ Body:     {                                         │
    │             "id": "uuid",                           │
    │             "status": "REJECTED",  ← Changed!       │
    │             "version": 2            ← Incremented!  │
    │           }                                         │
    │           OR                                        │
    │ Response: 409 Conflict (already processed)          │
    │ Body:     {                                         │
    │             "statusCode": 409,                      │
    │             "message": "Request is not pending..."  │
    │           }                                         │
    │           OR                                        │
    │ Response: 404 Not Found (id doesn't exist)          │
    └─────────────────────────────────────────────────────┘

HTTP Status Codes Reference:
├── 200 OK                - Request succeeded
├── 201 Created           - Resource created
├── 400 Bad Request       - Invalid input
├── 404 Not Found         - Resource doesn't exist
└── 409 Conflict          - State conflict (already processed)
```

---

## 8. Concurrency Control Mechanism

```
Atomic Conditional Update Pattern
═════════════════════════════════

Traditional Approach (❌ UNSAFE):
┌──────────────────────────────────────────────────────┐
│ STEP 1: Read                                         │
│ SELECT status FROM approval_requests WHERE id = ?   │
│ ↓ (race condition here - other thread could update) │
│ STEP 2: Check                                        │
│ if (status === 'PENDING') { ✓ continue }            │
│ ↓ (race condition here - other thread could update) │
│ STEP 3: Write                                        │
│ UPDATE approval_requests SET status = 'APPROVED'    │
│ WHERE id = ?                                         │
│                                                      │
│ Problem: Multiple threads could pass the check      │
│ Result: Multiple concurrent approvals possible ✗    │
└──────────────────────────────────────────────────────┘

Our Approach (✅ SAFE):
┌──────────────────────────────────────────────────────┐
│ ATOMIC CONDITIONAL UPDATE (Single SQL statement)     │
│                                                      │
│ UPDATE approval_requests                             │
│ SET status = 'APPROVED', version = version + 1      │
│ WHERE id = ? AND status = 'PENDING'                  │
│                                                      │
│ PostgreSQL handles this atomically:                  │
│ 1. Locks the row                                     │
│ 2. Checks condition (status = 'PENDING'?)           │
│ 3. If YES:                                           │
│    - Updates the row                                 │
│    - Increments version                              │
│    - Releases lock                                   │
│    - Returns: affected_rows = 1 ✓                    │
│ 4. If NO:                                            │
│    - Does nothing                                    │
│    - Releases lock                                   │
│    - Returns: affected_rows = 0 ✓                    │
│                                                      │
│ Result: Exactly one thread wins, others notified ✓  │
│ No race conditions possible ✓                        │
└──────────────────────────────────────────────────────┘

Result Interpretation:
┌──────────────────────────────────────────────────────┐
│ if (result.count === 1) {                            │
│   // This request won the race!                      │
│   return { status: 200, body: updated_approval }     │
│ } else if (result.count === 0) {                     │
│   // Someone else already updated it                 │
│   return { status: 409, message: "Conflict" }        │
│ }                                                    │
└──────────────────────────────────────────────────────┘
```

---

## 9. Error Handling Flow

```
Request comes in → ApprovalsController.approve()
                           │
                           ↓
        ┌────────────────────────────────┐
        │ Validate UUID format?           │
        └────────┬──────────────┬─────────┘
                 │ INVALID      │ VALID
                 ↓              ↓
            400 Bad      ApprovalsService
            Request      .approve(id)
                              │
                              ↓
                  ┌───────────────────────┐
                  │ Call atomic update    │
                  │ UPDATE ... WHERE ...  │
                  └──────┬────────┬───────┘
                         │        │
                  result │        │
                  .count │        └──────────────┐
                    │    │                       │
                    ↓    ↓ (0)                   │
                   (1)   │                   (throws
                    │    │                    error)
                    │    ↓                       │
                    │  Check if ID             ↓
                    │  exists in DB         NotFoundException
                    │    │                       │
                    │    ├─→ Yes (row exists)   │
                    │    │   ↓ (status≠PENDING) │
                    │    │   ConflictException  │
                    │    │   ↓                  │
                    │    │   409 Conflict       │
                    │    │                      │
                    │    └─→ No (row missing)   │
                    │        ↓                  │
                    │        NotFoundException │
                    │        ↓                  │
                    │        404 Not Found      │
                    │                           │
                    ↓                           ↓
            Fetch updated        (caught by
            record from DB       Express error
                 │               handler)
                 ↓                │
            Transform to DTO      ↓
                 │           Return HTTP
                 ↓           response
            Return 200 OK    with error
            with approval    details
```

---

## 10. Deployment Architecture (Future)

```
PRODUCTION DEPLOYMENT RECOMMENDATION
════════════════════════════════════

┌─────────────────────────────────────────────────────────┐
│                  LOAD BALANCER                          │
│            (nginx, AWS ALB, HAProxy)                    │
└────────────┬────────────────┬────────────────┬──────────┘
             │                │                │
             ↓                ↓                ↓
    ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
    │ API Server 1   │ │ API Server 2   │ │ API Server N   │
    │ (NestJS)       │ │ (NestJS)       │ │ (NestJS)       │
    │ Port 3000      │ │ Port 3000      │ │ Port 3000      │
    │ Container 1    │ │ Container 2    │ │ Container N    │
    └────────┬───────┘ └────────┬───────┘ └────────┬───────┘
             │                  │                  │
             └──────────────────┼──────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ↓                               ↓
    ┌──────────────────────┐        ┌──────────────────────┐
    │ PostgreSQL Primary   │        │ PostgreSQL Replica   │
    │ (Write node)         │        │ (Read node)          │
    │ Data sync via WAL    │        │ Failover ready       │
    │ Replication          │◄──────►│                      │
    └──────────────────────┘        └──────────────────────┘
             │
             ↓
    ┌──────────────────────┐
    │ Database Backups     │
    │ (Daily snapshots)    │
    │ Point-in-time        │
    │ recovery enabled     │
    └──────────────────────┘

Additional Components:
├── Monitoring (DataDog, New Relic)
├── Logging (ELK stack)
├── Alerting (PagerDuty)
├── CDN (CloudFront, Cloudflare)
└── Secrets (Vault, AWS Secrets Manager)
```

---

**These diagrams provide visual understanding of:**
- System architecture
- Data flows
- Concurrency control
- State transitions
- Error handling
- Deployment structure

Print or share these with your manager for visual reference during discussions!
