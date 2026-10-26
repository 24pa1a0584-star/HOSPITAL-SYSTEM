# CARENOVA — Smart Hospital Appointment Booking & Management System
> **Care made simple. Every appointment matters.**

[![Node.js Version](https://img.shields.io/badge/Node.js-LTS%20v24+-0D9488?style=flat&logo=node.js)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-18-4169E1?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%209.0-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-010101?style=flat&logo=socket.io)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 1. Problem Statement & System Mission
Outpatient appointment scheduling in modern hospital networks suffers from major operational challenges:
1. **Double-Booking & Race Conditions:** Multiple patients booking the last appointment simultaneously, causing physical OPD congestion and scheduling disputes.
2. **Unverified Practitioner Listings:** Online medical directories displaying unverified doctor credentials or fabricated review ratings without institutional accreditation.
3. **Ghost Availability:** Slots offered during doctor leave, surgery shifts, or lunch breaks due to static timetable designs.
4. **Disjointed Reception Desk & Patient Portals:** Walk-in patients, phone bookings, and digital app users managed in isolated silos.
5. **Patient Health Data Overcollection:** Platforms collecting invasive medical histories or national identity numbers for basic appointment booking.

**CARENOVA** is built from scratch as a secure, production-ready, highly animated, full-stack MERN application that solves these challenges with an **atomic inventory reservation engine**, **mandatory institutional physician verification**, **real-time Socket.IO synchronization**, and **role-separated workspaces**.

---

## 2. Key Architectural Features

### 🔒 Concurrency-Safe Atomic Slot Reservation
- Real-time bookable slots are dynamically computed from active physician weekly shifts, buffer intervals, lunch breaks, and approved leave calendars.
- Slot reservation uses MongoDB atomic conditional operations:
  ```ts
  const reservedSlot = await BookableSlot.findOneAndUpdate(
    { _id: slotId, doctorId, isBooked: false },
    { $set: { isBooked: true, bookedBy: patientId } },
    { new: true }
  );
  ```
- If two patients click "Confirm" on the exact same slot at the exact same millisecond, **strictly one reservation succeeds** and the second immediately receives an HTTP `409 Conflict` status with an automatic UI reload prompting them to choose an alternate time.

### 🎖️ Permanent Internal Doctor ID & Verification Workflow
- Every physician applicant receives a permanent collision-safe internal application identifier:
  `CARE-DOC-000001`, `CARE-DOC-000002`...
- Accounts start strictly in `PENDING_VERIFICATION` status.
- Unverified doctors are **ineligible for public search** and cannot produce bookable slots until the Hospital Medical Director manually reviews their state medical council registration number, credentials, and approves their account.

### 📅 Atomic Rescheduling & Safe Slot Release
- When rescheduling an existing appointment, CARENOVA atomically claims the **new** slot *before* releasing the old reservation. If the replacement slot is contested or unavailable, the patient's original appointment remains **100% intact**.
- Appointment cancellation immediately releases the bookable slot back into public hospital inventory (`isBooked: false`) in an idempotent, non-duplicating transaction.

### 🏥 Multi-Department Hospital Hierarchy
- Supports multiple hospital facilities (e.g., *CareNova Apex Multispeciality Hospital - South Extension, Delhi* and *CareNova SuperCare Center - Indiranagar, Bengaluru*).
- Multi-speciality clinical suites: Cardiology, Dermatology, Orthopedics, Pediatrics, Neurology, and General Medicine.

### 🔔 Real-Time Socket.IO Notifications
- Live in-app alert dispatching when appointments are booked, rescheduled, cancelled, checked in, or completed.
- Persistent audit logging in MongoDB for every healthcare action.

---

## 3. Application User Roles & Access Control

| Operational Role | Primary Capabilities & Permitted Actions |
| :--- | :--- |
| **Patient** | Register, log in, search verified doctors, inspect real-time slots, book appointments, cancel, reschedule, view consultation timeline, receive live notifications. |
| **Doctor** | Log in with verified credentials, view daily OPD schedule, mark consultations (`IN_PROGRESS`, `COMPLETED`, `NO_SHOW`), configure weekly shifts, block dates / request leaves. |
| **Receptionist** | Front-desk patient lookup, quick-register walk-in patients, book appointments on behalf of patients, check patients in physically, generate daily OPD queue tickets (`Queue #1`, `Queue #2`). |
| **Hospital Administrator** | Institutional oversight, review pending doctor verification applications, approve/reject physician credentials, create receptionist accounts, inspect security audit logs. |

---

## 4. Visual Design System & Aesthetics

CARENOVA features an original, vibrant healthcare aesthetic engineered for maximum clarity and visual warmth:

- **Healing Teal (`#0D9488`):** Primary branding, health, trust, confirmed appointments.
- **Electric Royal Blue (`#4169E1`):** Action CTAs, time slots, scheduling highlights.
- **Warm Coral (`#FF7868`):** Cancelled visits, critical alerts, notifications badge.
- **Soft Lavender (`#8B5CF6`):** Virtual teleconsultation tags, administrative markers.
- **Mint Green (`#B8F2E6`):** Success states, slot verified badges.
- **Pastel Peach (`#FFE5D9`):** Accent cards and medical illustrations.
- **Deep Navy (`#132238`):** Editorial headlines, text elements, dark mode accents.
- **Cloud White (`#F7FAFC`):** Background canvas.

**Typography Pairing:**
- **Headlines:** `Space Grotesk` (Google Fonts)
- **Body & Controls:** `Plus Jakarta Sans` (Google Fonts)

---

## 5. Project Monorepo Structure

```
HOSPITAL-SYSTEM/
├── client/                               # Frontend (React 18 + Vite + TypeScript)
│   ├── public/
│   │   └── branding/
│   │       └── logo.svg                  # Original CARENOVA Medical Logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── booking/                  # BookingModal, RescheduleModal
│   │   │   ├── common/                   # StatusBadge
│   │   │   ├── doctors/                  # DoctorCard
│   │   │   ├── layout/                   # Navbar, Footer, ProtectedRoute
│   │   │   └── notifications/            # NotificationDrawer
│   │   ├── context/
│   │   │   └── AuthContext.tsx           # Session restore, RBAC, Socket.IO
│   │   ├── pages/
│   │   │   ├── admin/                    # AdminDashboard
│   │   │   ├── auth/                     # PatientLoginPage, PatientRegisterPage, StaffLoginPage, DoctorRegistrationRequestPage
│   │   │   ├── doctor/                   # DoctorDashboard
│   │   │   ├── patient/                  # PatientDashboard
│   │   │   ├── public/                   # LandingPage, FindDoctorsPage, DoctorDetailsPage, SpecialtiesPage, HospitalsPage, HowItWorksPage, PrivacyPolicyPage
│   │   │   └── receptionist/             # ReceptionistDashboard
│   │   ├── services/
│   │   │   ├── api.ts                    # Axios API client
│   │   │   └── socket.ts                 # Socket.IO client
│   │   ├── types/
│   │   │   └── index.ts                  # Shared TypeScript interfaces
│   │   ├── App.tsx                       # Main router & provider tree
│   │   ├── index.css                     # Custom animations & glassmorphism
│   │   └── main.tsx                      # DOM entry point
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                               # Backend (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── bootstrap/
│   │   │   ├── adminBootstrap.ts         # Idempotent secure admin setup
│   │   │   └── seedDemoData.ts           # Non-destructive demonstration data
│   │   ├── config/
│   │   │   ├── db.ts                     # MongoDB connection & reconnect logic
│   │   │   └── env.ts                    # Zod-validated environment config
│   │   ├── controllers/                  # Auth, Doctor, Appointment, Admin, Receptionist, Hospital, Notification
│   │   ├── middleware/                   # Auth, RoleGuard, ErrorHandler
│   │   ├── models/                       # User, DoctorProfile, PatientProfile, StaffProfile, Hospital, Department, DoctorSchedule, DoctorLeave, BookableSlot, Appointment, Notification, AuditLog, Counter
│   │   ├── routes/                       # Express REST router modules
│   │   ├── services/                     # SchedulingEngine, BookingService, IdGenerator, NotificationService, AuditService
│   │   ├── sockets/                      # Socket.IO real-time manager
│   │   ├── utils/                        # JWT token utility
│   │   ├── validators/                   # Zod request payload schemas
│   │   ├── app.ts                        # Express setup with static client serving
│   │   └── server.ts                     # HTTP + Socket.IO server entry
│   ├── tests/
│   │   ├── api.test.ts                   # Vitest integration suite
│   │   └── runAllTests.ts                # Pure TypeScript test runner
│   ├── package.json
│   └── tsconfig.json
├── package.json                          # Unified root scripts
└── README.md
```

---

## 6. Environment Configuration

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/carenova
JWT_SECRET=carenova_super_secret_jwt_key_2026_production_ready_healthcare
JWT_EXPIRES_IN=7d
COOKIE_SECRET=carenova_cookie_secret_secure_hash_token_2026

# Admin Bootstrap (One-time secure initialization)
INITIAL_SETUP_ENABLED=true
BOOTSTRAP_ADMIN_NAME="Hospital Director Dr. Anita Roy"
BOOTSTRAP_ADMIN_EMAIL=admin@carenova.hospital
BOOTSTRAP_ADMIN_PASSWORD=AdminSecure@2026!

# Hospital Settings
HOSPITAL_TIMEZONE=Asia/Kolkata
HOSPITAL_CURRENCY=INR
```

---

## 7. Local Installation & Windows Execution

Clone the repository and run the following commands in **Windows PowerShell**:

### Step 1: Install All Dependencies
```powershell
npm run install:all
```

### Step 2: Initialize Demonstration Records (Hospitals, Doctors, Schedules)
```powershell
npm run seed:demo
```

### Step 3: Run the Automated Concurrency & Security Test Suite
```powershell
npm test
```

### Step 4: Launch the Full Application in Development
```powershell
npm run dev
```

- **Frontend Development:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 8. Five-Minute Live Demonstration Credentials

For academic and clinical evaluation, the following verified test accounts are seeded:

| User Role | Login Email | Password | Assigned Designation / Context |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient.rohit@gmail.com` | `PatientSecure@2026!` | Registered Outpatient (Rohit Verma) |
| **Doctor** | `dr.sharma.cardio@carenova.hospital` | `DoctorSecure@2026!` | Chief Interventional Cardiologist (CARE-DOC-000001) |
| **Receptionist** | `receptionist.delhi@carenova.hospital` | `ReceptionSecure@2026!` | Senior Front Desk Officer (Sunita Mehra) |
| **Hospital Admin** | `admin@carenova.hospital` | `AdminSecure@2026!` | Medical Director & Chief Administrator (Dr. Anita Roy) |

*Tip: The Sign In forms feature one-click **"⚡ Quick Fill"** buttons to facilitate swift evaluation.*

---

## 9. Automated Testing & Verification Results

The automated integration suite validates healthcare safety, race conditions, and role guards:

```
> carenova-server@1.0.0 test
> tsx tests/runAllTests.ts

🧪 Starting CARENOVA Automated Test Runner...
✅ MongoDB Connected successfully: localhost/carenova
  ✅ PASS: GET /api/health returns status ok
  ✅ PASS: Patient registration hashes password and returns JWT
  ✅ PASS: Incorrect password returns 401
  ✅ PASS: Correct login succeeds and returns token
  ✅ PASS: Session restoration via GET /api/auth/me succeeds
  ✅ PASS: Logout endpoint succeeds
  ✅ PASS: Login again succeeds after logout (persistence verified)
  ✅ PASS: Doctor registration generates collision-safe CARE-DOC ID with PENDING status
  ✅ PASS: Unverified doctor cannot offer bookable slots
  ✅ PASS: Admin logs in and verifies doctor
  ✅ PASS: Scheduling respects working hours and break periods
  ✅ PASS: CRITICAL CONCURRENCY: Two simultaneous booking attempts for same slot -> Exactly ONE succeeds, second gets 409
  ✅ PASS: Patient cannot access admin overview (403 Forbidden)

==================================================
📊 TEST RESULTS: 13 PASSED, 0 FAILED
==================================================
```

---

## 10. Single-URL Render & MongoDB Atlas Deployment

CARENOVA is engineered to deploy seamlessly as a **Single-URL Node.js Web Service** on Render with zero separate frontend hosting required.

### Architecture Overview
$$\text{Internet} \longrightarrow \text{Render Web Service} \longrightarrow \begin{cases} \text{Express serves React App} & (\text{from } \texttt{client/dist}) \\ \text{REST API Routing} & (\texttt{/api/*}) \\ \text{Socket.IO Server} & (\texttt{/socket.io/*}) \end{cases} \longleftrightarrow \text{MongoDB Atlas}$$

### Render Web Service Settings:
- **Environment:** `Node`
- **Root Directory:** *(leave blank / repository root)*
- **Build Command:**
  ```bash
  npm run install:all && npm run build
  ```
- **Start Command:**
  ```bash
  node server/dist/server.js
  ```
- **Environment Variables in Render:**
  - `NODE_ENV`: `production`
  - `PORT`: `10000` (or Render default)
  - `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster0.xxxx.mongodb.net/carenova?retryWrites=true&w=majority`
  - `JWT_SECRET`: *(32+ character random secret)*
  - `COOKIE_SECRET`: *(32+ character random secret)*
  - `INITIAL_SETUP_ENABLED`: `true`
  - `BOOTSTRAP_ADMIN_NAME`: `Hospital Medical Director`
  - `BOOTSTRAP_ADMIN_EMAIL`: `admin@carenova.hospital`
  - `BOOTSTRAP_ADMIN_PASSWORD`: `<strong_admin_password>`

### Resolution of Earlier Historical Deployment Pitfalls:
- **`vite: not found` avoided:** Build scripts run `npm run build` after clean installation across both client and server.
- **`Missing script: build` avoided:** Root `package.json` specifies explicit `build:client` and `build:server` scripts.
- **`MODULE_NOT_FOUND` avoided:** Express dynamically locates compiled `client/dist` directory using verified filesystem fallbacks.
- **`React Router 404 on refresh` avoided:** Express wildcard route (`*`) directs all non-API paths to `dist/index.html`.
- **`Destructive Seeding` avoided:** The database initializer never drops collections or wipes operational appointments.

---

## 11. Security, Privacy & Healthcare Safety Compliance

- **Indian DPDP Act Principles:** Implements data minimization; patients are never prompted for unnecessary clinical diagnoses, diagnostic scans, or national identification credentials.
- **IDOR Protection:** Database queries verify user ownership (`req.user.id`) on all patient appointment lookups.
- **Emergency Medical Notice:** Prominently featured on all page footers:
  > *"For medical emergencies, acute trauma, or chest pain, immediately contact national emergency services (112 / 102) or visit the nearest emergency department. Do not rely on scheduled outpatient appointments."*
- **No Automated Prescription or Diagnosis:** CARENOVA acts solely as an administrative scheduling and appointment management system.

---

## 12. Technology Stack Summary

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Framer Motion, TanStack Query, React Hook Form, Zod, Axios, Sonner, Recharts, Socket.IO Client.
- **Backend:** Node.js LTS, Express, TypeScript, MongoDB, Mongoose, bcryptjs, jsonwebtoken, cookie-parser, Socket.IO, Helmet, CORS, express-rate-limit, morgan.
- **Database:** MongoDB Atlas / Local MongoDB 9.0.
- **Testing:** Supertest, Tsx, Node.js Native Test Runner.
- **Deployment Target:** Render + MongoDB Atlas.

---

## 13. Project Presentation & Team Details

- **Developer:** [DEVELOPER_NAME]
- **Degree & Branch:** [DEGREE_AND_BRANCH]
- **College:** [COLLEGE_NAME]
- **Registration Number:** [REGISTRATION_NUMBER]
- **GitHub Repository:** [GITHUB_PROFILE]
- **Live Deployed URL:** [DEPLOYED_URL]
