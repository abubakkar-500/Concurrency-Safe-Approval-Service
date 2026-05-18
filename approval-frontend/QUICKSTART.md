# 🚀 Quick Start Guide - Run Everything

Follow these steps to run both backend and frontend together!

---

## **Option 1: Windows PowerShell (Recommended)**

### **Step 1: Open Terminal 1 (Backend)**

```powershell
cd "d:\Jobs_Work\Job_testing_App\approval-service"
docker compose up -d
npm run start:dev
```

Wait for: `Nest application successfully started`

### **Step 2: Open Terminal 2 (Frontend)**

```powershell
cd "d:\Jobs_Work\Job_testing_App\approval-frontend"
npm install
npm run dev
```

Wait for: `Local: http://localhost:5173`

### **Step 3: Open Browser**

Go to: **http://localhost:5173**

**Done! ✓** You now have:
- ✅ Backend API on **localhost:3000**
- ✅ Frontend UI on **localhost:5173**
- ✅ Database on **localhost:5432**

---

## **Complete Flow**

```
You fill form
    ↓
Frontend sends to Backend (http://localhost:3000)
    ↓
Backend creates in Database (PostgreSQL)
    ↓
Frontend shows in list
    ↓
Click Approve/Reject buttons
    ↓
Backend updates Database atomically
    ↓
Frontend shows updated status
```

---

## **Testing the System**

### **1. Create Approval**
- Type title: "Test Approval"
- Click "Create Approval"
- See success message
- Approval appears in list

### **2. Approve Request**
- Click "✓ Approve" button
- Status changes to APPROVED (green)
- Button disappears
- Version increments to 2

### **3. Try Again**
- Try to approve same request again
- See error: "Already processed"
- Proves concurrency safety! ✓

---

## **Monitoring**

### **Terminal 1 (Backend)**
Shows API calls:
```
[InstanceLoader] ApprovalsModule dependencies initialized
[RouterExplorer] Mapped {/approvals, POST} route
[RouterExplorer] Mapped {/approvals/:id/approve, POST} route
```

### **Terminal 2 (Frontend)**
Shows build progress:
```
  VITE v5.0.0  ready in 150 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to access from network
```

### **Browser Console (F12)**
Shows API calls:
```
POST http://localhost:3000/approvals - 201 Created
POST http://localhost:3000/approvals/{id}/approve - 200 OK
```

---

## **Common Issues & Fixes**

### **Issue: "Port 3000 already in use"**
```powershell
netstat -ano | findstr :3000
taskkill /PID {number} /F
npm run start:dev
```

### **Issue: "Cannot connect to backend"**
- Check Docker is running: `docker ps`
- Check server is running: `npm run start:dev`
- Check port 3000: `localhost:3000`

### **Issue: "npm: command not found"**
- Install Node.js from: https://nodejs.org/
- Verify: `node --version` & `npm --version`

### **Issue: "Module not found"**
```powershell
npm install
```

### **Issue: "Port 5173 already in use"**
```powershell
npm run dev -- --port 5174
```

---

## **Quick Checklist**

Before you start:
- [ ] Node.js 20+ installed
- [ ] Docker Desktop running
- [ ] Both folders exist:
  - [ ] `d:\Jobs_Work\Job_testing_App\approval-service`
  - [ ] `d:\Jobs_Work\Job_testing_App\approval-frontend`
- [ ] No process using port 3000, 5173, or 5432

---

## **Stop Everything**

### **Stop Frontend**
In Terminal 2: Press `Ctrl+C`

### **Stop Backend**
In Terminal 1: Press `Ctrl+C`

### **Stop Database**
```powershell
docker compose down
```

---

## **One-Command Setup (if you prefer)**

```powershell
# Backend
$backend = Start-Process powershell -ArgumentList "cd 'd:\Jobs_Work\Job_testing_App\approval-service'; npm run start:dev" -PassThru

# Frontend
$frontend = Start-Process powershell -ArgumentList "cd 'd:\Jobs_Work\Job_testing_App\approval-frontend'; npm install; npm run dev" -PassThru

Write-Host "Backend PID: $($backend.Id)"
Write-Host "Frontend PID: $($frontend.Id)"
Write-Host "Open: http://localhost:5173"
```

---

## **URLs to Remember**

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | User interface |
| **Backend API** | http://localhost:3000 | API endpoints |
| **Database** | localhost:5432 | PostgreSQL |
| **DB Studio** | http://localhost:5555 | Visual database (optional) |

---

## **Success Indicators**

✅ **Backend Console Shows:**
```
[NestApplication] Nest application successfully started
```

✅ **Frontend Console Shows:**
```
Local: http://localhost:5173/
```

✅ **Browser Shows:**
- Blue header: "Approval System"
- Form on left side
- Empty list on right side

---

## **Next: Your First Approval**

1. Enter title: "Demo Approval"
2. Click "Create Approval"
3. See green success message
4. See approval in list with PENDING status
5. Click "✓ Approve"
6. See status change to APPROVED (green)
7. Success! 🎉

---

## **Detailed Step-by-Step**

### **Step 1: Start Backend (5 minutes)**

Terminal 1:
```powershell
cd "d:\Jobs_Work\Job_testing_App\approval-service"
```

Start database:
```powershell
docker compose up -d
```

Verify: `docker ps` shows postgres:16-alpine

Start server:
```powershell
npm run start:dev
```

Wait for green message (app started)

### **Step 2: Start Frontend (2 minutes)**

Terminal 2:
```powershell
cd "d:\Jobs_Work\Job_testing_App\approval-frontend"
```

Install dependencies:
```powershell
npm install
```

Start dev server:
```powershell
npm run dev
```

Browser opens automatically

### **Step 3: Use the System (1 minute)**

1. Type "My First Approval"
2. Click "Create Approval"
3. See it appear below
4. Click "✓ Approve"
5. Status changes to green APPROVED
6. Done! 🎉

---

**Total Time: ~8 minutes from start to first approval!** ⏱️

---

**Questions?** See README.md in approval-frontend folder.

**Troubleshooting?** Check "Common Issues" section above.

**Everything working?** Congrats! You have a full-stack approval system! 🚀
