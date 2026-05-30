# 🏥 Click Klinik

### One Click Closer to Healthcare

Click Klinik is a telehealth platform that streamlines the healthcare journey for Filipino patients and healthcare professionals.

The platform supports doctor discovery, appointment booking, consultations, prescriptions, medical records, payments, health monitoring, and follow-up care in a single system.

---

# Features

## 👤 Patient Features

* Patient Registration & Authentication
* Doctor Discovery & Search
* AI-Assisted Doctor Recommendation
* Appointment Booking
* Health Triage Forms
* Google Meet Consultations
* Phone Consultations
* Physical Visit Scheduling
* Medical Records Access
* Prescription Viewing
* Medical Certificate Access
* Health Monitoring Logs
* Multi-Language Support

## 👨‍⚕️ Doctor Features

* Doctor Registration
* Profile Management
* Availability & Schedule Management
* Consultation Management
* Patient Medical Records Access
* Consultation Notes
* Prescription Management
* Medical Certificate Generation
* Earnings & Payout Tracking

## 🛡️ Admin Features

* Doctor Application Review
* User Management
* Platform Monitoring

---

# Bonus Features

## 🌐 Multi-Language Support

One of the major accessibility features of Click Klinik is built-in language support.

Supported languages include:

* English
* Filipino
* Cebuano
* Ilocano

Translation is available from the landing page through the dashboard experience.

This helps make healthcare more accessible to users from different regions of the Philippines.

---

## 🤖 AI Doctor Recommendation

Patients may not always know which medical specialist they need.

The AI recommendation system helps match symptoms to appropriate doctor specializations.

Examples:

* Diabetes → Internal Medicine
* Fever → General Practitioner
* Child Healthcare → Pediatrics

**Important:** AI recommendations are guidance only and do not provide diagnoses.

---

## 📍 Philippine Location Support

Patients can provide:

* Region
* Province
* Municipality
* Barangay

This supports:

* Location-Aware Doctor Discovery
* Physical Consultation Routing
* Better Healthcare Accessibility

---

## 📊 Health Monitoring

Beyond consultations, patients can track their health over time.

This encourages continuous healthcare engagement instead of one-time consultations.

---

## 🔔 Notification System

Users receive notifications for:

* Appointment Updates
* Booking Confirmations
* Consultation Changes
* Prescriptions
* Medical Records

---

# Technology Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

## Backend

* NestJS
* TypeScript
* MongoDB

## Authentication

* Firebase Authentication

## Integrations

* Google Calendar
* Google Meet
* Xendit Payments

---

# Architecture

```text
Patient / Doctor / Admin
            │
            ▼
      Next.js Frontend
            │
            ▼
        NestJS API
            │
 ┌──────────┼──────────┐
 ▼          ▼          ▼

MongoDB   Firebase   External Services
           Auth

                     Google Calendar
                     Google Meet
                     Xendit Payments
```

---

# Local Setup

## Prerequisites

* Node.js 20+
* pnpm
* MongoDB
* Firebase Project

---

## Clone Repository

```bash
git clone <repository-url>
cd click-klinik
```

---

## Install Dependencies

```bash
pnpm install
```

---

## Backend Setup

Navigate to:

```bash
cd apps/api
```

Create:

```bash
.env
```

Example:

```env
MONGODB_URI=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

XENDIT_SECRET_KEY=

SUPERADMIN_EMAILS=
```

Start backend:

```bash
pnpm start:dev
```

Backend runs on:

```text
http://localhost:3000
```

---

## Frontend Setup

Navigate to:

```bash
cd apps/web
```

Create:

```bash
.env.local
```

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

NEXT_PUBLIC_SUPERADMIN_EMAILS=
```

Start frontend:

```bash
pnpm dev
```

Frontend runs on:

```text
http://localhost:3001
```

---

# Judge Evaluation Guide

To experience the complete workflow:

## Patient Flow

1. Create a Patient Account
2. Complete Your Profile
3. Search for Doctors
4. Try AI Doctor Recommendation
5. Book a Consultation
6. Complete the Triage Form
7. Review Appointments
8. View Medical Records
9. Explore Health Monitoring

## Doctor Flow

1. Register as a Doctor
2. Complete Doctor Profile
3. Configure Availability
4. Review Patient Appointments
5. Create Notes & Prescriptions
6. Generate Medical Certificates
7. View Payout Information

---

# Developer

## Jorell Andrei Finez

**Sole Developer**

Responsible for:

* Frontend Development
* Backend Development
* Database Architecture
* Authentication
* API Integrations
* Payment Integration
* Google Meet Integration
* AI Recommendation System
* Health Monitoring
* Multi-Language Support

---

# Closing

Click Klinik demonstrates a complete telehealth workflow that supports the entire healthcare journey—from doctor discovery and consultations to prescriptions, records, payments, and long-term health monitoring.

**One Click Closer to Healthcare.**
