# Approval System Frontend

Simple and clean React frontend for the Approval Service. Built with React + Tailwind CSS.

## 📁 Project Structure

```
approval-frontend/
├── src/
│   ├── components/
│   │   ├── ApprovalForm.jsx      # Form to create new approvals
│   │   ├── ApprovalCard.jsx      # Single approval card (approve/reject)
│   │   ├── ApprovalList.jsx      # List of all approvals
│   │   └── StatusBadge.jsx       # Status display badge
│   ├── services/
│   │   └── approvalService.js    # API calls to backend
│   ├── App.jsx                   # Main app component
│   ├── main.jsx                  # React entry point
│   └── index.css                 # Tailwind CSS
├── public/                       # Static files
├── index.html                    # HTML entry point
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
├── postcss.config.js            # PostCSS configuration
└── package.json                 # Dependencies
```

## 🚀 Setup Instructions

### **Step 1: Install Dependencies**

```bash
cd approval-frontend
npm install
```

This installs:
- React 18
- Vite (fast build tool)
- Tailwind CSS (styling)
- Axios (API calls)

### **Step 2: Ensure Backend is Running**

Before starting the frontend, make sure the backend API is running:

```bash
# In approval-service folder (another terminal)
npm run start:dev
# Should show: Nest application successfully started
```

The backend runs on **http://localhost:3000**

### **Step 3: Start Frontend Development Server**

```bash
npm run dev
```

This will:
- Start dev server on **http://localhost:5173**
- Open browser automatically
- Enable hot reload (changes instant)

### **Step 4: View in Browser**

Open: **http://localhost:5173**

You should see the Approval System dashboard!

---

## 🎯 How to Use

### **Creating an Approval Request**

1. **Enter Title**: Type the approval title (e.g., "Q1 Budget")
2. **Click Create**: Press "Create Approval" button
3. **Success**: See green success message
4. **Auto-added**: New approval appears in list below

### **Viewing Approval Requests**

- All created approvals appear in the list
- Each shows:
  - ✓ Title
  - ✓ ID (unique identifier)
  - ✓ Status (PENDING/APPROVED/REJECTED)
  - ✓ Version (update count)
  - ✓ Creation date

### **Approving/Rejecting Requests**

For PENDING requests only:
1. **Green Button**: Click "✓ Approve" to approve
2. **Red Button**: Click "✗ Reject" to reject
3. **Instant**: Status updates immediately
4. **Disabled**: Buttons disappear after action taken

---

## 🎨 UI Components

### **StatusBadge**
- Shows approval status with colors
- PENDING: Yellow
- APPROVED: Green ✓
- REJECTED: Red ✗

### **ApprovalForm**
- Simple input field for title
- Error & success messages
- Loading state while submitting
- Clear form after success

### **ApprovalCard**
- Individual approval card
- Shows full approval details
- Approve/Reject buttons (if pending)
- Error handling per card

### **ApprovalList**
- Displays all approvals
- Updates in real-time
- Empty state message
- Reverse chronological order

---

## 🔗 API Integration

The frontend connects to backend endpoints:

```
POST   /approvals              Create new approval
GET    /approvals/{id}         Get approval details
POST   /approvals/{id}/approve Approve request
POST   /approvals/{id}/reject  Reject request
```

All errors are caught and displayed to user.

---

## 📦 Build for Production

```bash
npm run build
```

Creates optimized build in `dist/` folder.

To preview:
```bash
npm run preview
```

---

## 🛠️ Technology Stack

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **Vite** | Fast build tool |
| **Tailwind CSS** | Styling |
| **Axios** | HTTP requests |
| **JavaScript ES6** | Programming language |

---

## 🎯 Features

✅ **Create Approvals** - Simple form submission  
✅ **View Approvals** - Real-time list display  
✅ **Approve/Reject** - Action buttons with confirmation  
✅ **Status Display** - Color-coded status badges  
✅ **Error Handling** - User-friendly error messages  
✅ **Loading States** - Shows progress during requests  
✅ **Responsive Design** - Works on desktop & tablet  
✅ **Zero Dependencies** - Minimal external packages  

---

## ⚙️ Troubleshooting

### **Issue: "Cannot connect to backend"**
```
Error: Network Error
Fix: Make sure backend is running on localhost:3000
Run: npm run start:dev (in approval-service folder)
```

### **Issue: "Module not found"**
```
Error: Cannot find module 'react'
Fix: Install dependencies
Run: npm install
```

### **Issue: "Port 5173 already in use"**
```
Error: Port 5173 already in use
Fix: Kill other process or use different port
Run: npm run dev -- --port 5174
```

### **Issue: "Tailwind CSS not loading"**
```
Solution: Clear browser cache (Ctrl+Shift+Delete)
Or: Hard refresh (Ctrl+Shift+R)
```

---

## 📝 Notes

- Frontend auto-connects to backend at `http://localhost:3000`
- All data is stored in backend database
- Refreshing page shows new approvals (reads from DB)
- No authentication - anyone can access
- Simple & clean code for easy modification

---

## 🚀 Next Steps (Optional Enhancements)

1. **Add Search/Filter** - Find approvals by title
2. **Add Pagination** - Show 10 per page
3. **Add Authentication** - Login for users
4. **Add Notifications** - Email on approval
5. **Add Comments** - Allow rejection reasons
6. **Add History** - Track approval changes

---

**Created**: May 18, 2026  
**Status**: Production Ready ✅

---

## 📞 Running Both Frontend & Backend

### **Terminal 1: Backend (Port 3000)**
```bash
cd approval-service
docker compose up -d
npm run start:dev
```

### **Terminal 2: Frontend (Port 5173)**
```bash
cd approval-frontend
npm install
npm run dev
```

### **Open in Browser**
```
http://localhost:5173
```

**Both running together = Full system ready!** 🎉
