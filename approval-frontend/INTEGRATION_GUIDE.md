# 📚 Complete Integration Guide - Frontend + Backend

This guide explains how the frontend and backend work together.

---

## 🏗️ Full System Architecture

```
┌─────────────────────────────────────────────────────┐
│          USER (Browser - localhost:5173)            │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  React Frontend                             │   │
│  │  • ApprovalForm (create requests)           │   │
│  │  • ApprovalList (display list)              │   │
│  │  • ApprovalCard (individual approval)       │   │
│  │  • StatusBadge (color-coded status)         │   │
│  └─────────────┬───────────────────────────────┘   │
└────────────────┼───────────────────────────────────┘
                 │
                 │ HTTP Requests (JSON)
                 │ axios.js → approvalService.js
                 │
┌────────────────▼───────────────────────────────────┐
│      NestJS Backend (localhost:3000)               │
│                                                    │
│  ┌────────────────────────────────────────────┐   │
│  │  ApprovalsController (HTTP Routing)        │   │
│  │  POST   /approvals                         │   │
│  │  GET    /approvals/{id}                    │   │
│  │  POST   /approvals/{id}/approve            │   │
│  │  POST   /approvals/{id}/reject             │   │
│  └─────────────┬────────────────────────────┘    │
│                │                                  │
│  ┌─────────────▼────────────────────────────┐    │
│  │  ApprovalsService (Business Logic)       │    │
│  │  • Create approval                       │    │
│  │  • Approve (atomic update)               │    │
│  │  • Reject (atomic update)                │    │
│  │  • Concurrency control                   │    │
│  └─────────────┬────────────────────────────┘    │
│                │                                  │
│  ┌─────────────▼────────────────────────────┐    │
│  │  PrismaService (Database Access)         │    │
│  │  • Type-safe queries                     │    │
│  │  • Transaction handling                  │    │
│  └─────────────┬────────────────────────────┘    │
└────────────────┼────────────────────────────────┘
                 │
                 │ SQL Queries
                 │
┌────────────────▼────────────────────────────────┐
│   PostgreSQL Database (localhost:5432)          │
│                                                 │
│  approval_requests table                        │
│  ├─ id (UUID)                                   │
│  ├─ title (String)                              │
│  ├─ status (PENDING/APPROVED/REJECTED)          │
│  ├─ version (Integer)                           │
│  ├─ created_at (DateTime)                       │
│  └─ updated_at (DateTime)                       │
└─────────────────────────────────────────────────┘
```

---

## 📡 Data Flow Examples

### **1. CREATE APPROVAL REQUEST**

```
Frontend (React)
│
├─ User fills form: "Q1 Budget Approval"
├─ Clicks "Create Approval"
│
└─→ ApprovalForm.jsx
   └─→ approvalService.createApproval(title)
      └─→ axios.post('/approvals', { title })
         
         HTTP POST to Backend
         
Backend (NestJS)
│
├─ ApprovalsController.create()
├─ Validates title (required)
└─→ ApprovalsService.create(dto)
   └─→ Prisma.approvalRequest.create({
         data: { title }
      })
      └─→ PostgreSQL executes INSERT
         INSERT INTO approval_requests (id, title, status, version)
         VALUES (uuid, 'Q1 Budget Approval', 'PENDING', 1)
         
         Database inserts row
         Returns: { id, title, status: 'PENDING', version: 1, ... }

Frontend (React)
│
├─ Receives 201 Created response
├─ Shows success message: "Approval created! ID: 550e8400..."
├─ Clears form
└─→ ApprovalList receives new approval
   └─→ Updates state
      └─→ Renders in UI
         └─→ User sees card with PENDING status
```

---

### **2. APPROVE REQUEST**

```
Frontend (React)
│
├─ User sees approval with PENDING status
├─ Clicks "✓ Approve" button on card
│
└─→ ApprovalCard.jsx
   └─→ handleApprove() function
      └─→ approvalService.approveApproval(id)
         └─→ axios.post('/approvals/{id}/approve')
            
            HTTP POST to Backend
            
Backend (NestJS)
│
├─ ApprovalsController.approve(id)
├─ Validates UUID format
└─→ ApprovalsService.approve(id)
   └─→ Atomic UPDATE (concurrency control!)
      └─→ Prisma.approvalRequest.updateMany({
            where: { id, status: 'PENDING' },
            data: {
              status: 'APPROVED',
              version: { increment: 1 }
            }
         })
         └─→ PostgreSQL ATOMIC TRANSACTION
            UPDATE approval_requests
            SET status='APPROVED', version=version+1
            WHERE id={id} AND status='PENDING'
            
            Database row locked
            Condition check: status='PENDING'? YES ✓
            Updates row
            Releases lock

Frontend (React)
│
├─ Receives 200 OK response
├─ ApprovalCard.onStatusChange() called
├─ Updates local state: status='APPROVED'
├─ Re-renders card
└─→ User sees:
   ✓ Status badge now GREEN
   ✓ Buttons disappear
   ✓ Message: "This request has been approved"
```

---

### **3. CONCURRENT APPROVAL (Safety Demo)**

```
Frontend (React) - Two browsers/tabs
│
├─ Browser 1: Clicks "✓ Approve" on same request
├─ Browser 2: Clicks "✓ Approve" on SAME request
│  (Same microsecond)
│
└─→ Both send to Backend simultaneously

Backend (NestJS)
│
├─ Two requests arrive
├─ Both call ApprovalsService.approve(SAME_ID)
│
└─→ Atomic UPDATE in PostgreSQL
   
   Browser 1's transaction:
   ├─ Locks row (id = SAME_ID)
   ├─ Condition check: status='PENDING'? YES ✓
   ├─ Updates: status='APPROVED', version=2
   ├─ Commits
   └─ Returns: count=1 (SUCCESS)
   
   Browser 2's transaction:
   ├─ Waits for lock (held by Browser 1)
   ├─ Lock released
   ├─ Condition check: status='PENDING'? NO ✗
   │  (Status is now 'APPROVED' from Browser 1)
   ├─ Does nothing (no update)
   └─ Returns: count=0 (CONFLICT)

Frontend (React)
│
├─ Browser 1 receives: 200 OK
│  ├─ Status changes to APPROVED (green)
│  └─ User sees: "Request approved"
│
└─ Browser 2 receives: 409 Conflict
   ├─ Error message shown
   └─ User sees: "Request is not pending or was already processed"

✓ SAFETY PROVEN: Only 1 approval succeeded, other got error
```

---

## 🔄 Component Communication

```
┌─────────────────────────────────────┐
│            App.jsx                  │
│  (State: newApproval)               │
└────┬────────────────────────────┬───┘
     │                            │
     │ onApprovalCreated()        │ approvalToAdd prop
     │                            │
┌────▼────────────────┐  ┌────────▼──────────────────┐
│  ApprovalForm.jsx   │  │  ApprovalList.jsx         │
│                     │  │                           │
│ • Title input       │  │ • Displays approvals      │
│ • Create button     │  │ • Maps over list          │
│ • Success/Error msg │  │ • Calls ApprovalCard     │
│                     │  │                           │
│ → API call          │  │ → onStatusChange()        │
│ → Pass to parent    │  │ → Updates parent state    │
└─────────────────────┘  └─────────┬──────────────────┘
                                   │
                         ┌─────────▼────────┐
                         │ ApprovalCard.jsx │
                         │                  │
                         │ • Shows approval │
                         │ • Approve button │
                         │ • Reject button  │
                         │                  │
                         │ → API calls      │
                         │ → Notify parent  │
                         └──────────────────┘
```

---

## 🔗 API Endpoints & Responses

### **Endpoint 1: POST /approvals**
```javascript
// Request (from Frontend)
{
  "title": "Q1 Budget Approval"
}

// Response (201 Created)
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Q1 Budget Approval",
  "status": "PENDING",
  "version": 1,
  "createdAt": "2026-05-18T10:00:00Z",
  "updatedAt": "2026-05-18T10:00:00Z"
}
```

### **Endpoint 2: POST /approvals/{id}/approve**
```javascript
// Request (from Frontend)
POST /approvals/550e8400-e29b-41d4-a716-446655440000/approve

// Response (200 OK)
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Q1 Budget Approval",
  "status": "APPROVED",  ← Changed!
  "version": 2,          ← Incremented!
  "createdAt": "2026-05-18T10:00:00Z",
  "updatedAt": "2026-05-18T10:02:00Z"
}

// Or Error Response (409 Conflict)
{
  "statusCode": 409,
  "message": "Request is not pending or was already processed"
}
```

---

## 📋 Frontend Files & Responsibilities

| File | Purpose | Key Functions |
|------|---------|---|
| **App.jsx** | Main container | State management, coordinates components |
| **ApprovalForm.jsx** | Create approvals | Input, validation, API call, messages |
| **ApprovalList.jsx** | Display list | Manage approval list, show empty state |
| **ApprovalCard.jsx** | Individual card | Approve/reject buttons, status update |
| **StatusBadge.jsx** | Status display | Colored badge based on status |
| **approvalService.js** | API layer | All backend calls (axios) |

---

## 🎯 User Interaction Flow

```
1. User lands on http://localhost:5173
   ↓
2. Sees form (left) and empty list (right)
   ↓
3. Types title: "My Approval"
   ↓
4. Clicks "Create Approval"
   ↓
5. Frontend sends to Backend API
   ↓
6. Backend creates in Database
   ↓
7. Returns approval with ID
   ↓
8. Frontend shows success message
   ↓
9. Approval appears in list with PENDING status
   ↓
10. User clicks "✓ Approve"
    ↓
11. Frontend sends to Backend API
    ↓
12. Backend updates Database (atomically)
    ↓
13. Returns updated approval
    ↓
14. Frontend updates card
    ↓
15. Status changes to APPROVED (green)
    ↓
16. Buttons disappear
    ↓
17. Done! ✓
```

---

## ⚠️ Error Handling

### **Frontend Errors (Try-Catch)**
```javascript
try {
  const approval = await approvalService.createApproval(title);
  // Success - show approval
} catch (err) {
  // Show error message to user
  setError(err.message);
}
```

### **Common Errors**

| Error | Cause | Fix |
|-------|-------|-----|
| **Network Error** | Backend not running | Start backend: `npm run start:dev` |
| **409 Conflict** | Already approved | Normal - shows in UI |
| **400 Bad Request** | Missing title | Input validation |
| **404 Not Found** | Invalid ID | Shouldn't happen in normal use |

---

## 🚀 Starting Everything

### **Order Matters!**

**Step 1: Start Database**
```powershell
cd approval-service
docker compose up -d
```

**Step 2: Start Backend**
```powershell
npm run start:dev
```
Wait for: `Nest application successfully started`

**Step 3: Start Frontend**
```powershell
cd approval-frontend
npm install
npm run dev
```
Wait for: `Local: http://localhost:5173`

**Step 4: Open Browser**
Go to: **http://localhost:5173**

---

## 🔍 Debugging

### **Check Backend is Running**
```powershell
curl http://localhost:3000/approvals/test
# Should get: 404 Not Found (that's correct!)
```

### **Check Frontend is Running**
```
Open: http://localhost:5173
Should see: Blue header "Approval System"
```

### **Check Database is Running**
```powershell
docker ps
# Should show: postgres:16-alpine on port 5432
```

### **Monitor API Calls**
Browser F12 → Network tab → See API requests

### **Check Logs**

Backend logs (in backend terminal):
```
[RoutesResolver] ApprovalsController {/approvals}
[HttpServer] Listening on ::
```

Frontend logs (in browser console - F12):
```
POST http://localhost:3000/approvals 201
POST http://localhost:3000/approvals/{id}/approve 200
```

---

## 📊 Success Checklist

- [ ] Docker running (postgres)
- [ ] Backend running on port 3000
- [ ] Frontend running on port 5173
- [ ] Can create approval
- [ ] Can see approval in list
- [ ] Can approve request
- [ ] Status changes to green APPROVED
- [ ] Buttons disappear after approval
- [ ] Can't approve same request twice (409 error)

---

## 🎉 Full System is Now Ready!

You have:
- ✅ React frontend (port 5173)
- ✅ NestJS backend (port 3000)
- ✅ PostgreSQL database (port 5432)
- ✅ API integration
- ✅ Error handling
- ✅ Concurrency safety

**All components working together seamlessly!**

---

**Created**: May 18, 2026  
**Status**: Integration Complete ✓
