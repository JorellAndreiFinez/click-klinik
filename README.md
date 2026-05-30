# 🏥 Click Klinik

### One Click Closer to Healthcare

Click Klinik is a telehealth platform designed to make healthcare more accessible, organized, and inclusive for Filipino patients and healthcare professionals.

The platform provides a complete healthcare workflow—from patient onboarding and doctor discovery to consultation, prescriptions, medical records, health monitoring, and follow-up care.

---

# Problem Statement

Many healthcare experiences remain fragmented.

Patients often need to use multiple platforms to:

* Find healthcare providers
* Schedule appointments
* Communicate with doctors
* Manage prescriptions
* Access medical records
* Track health progress

This creates unnecessary complexity and friction.

Click Klinik addresses this by providing a single platform that centralizes the entire healthcare journey.

---

# Solution

Click Klinik delivers an end-to-end telehealth ecosystem that supports:

✅ Patient Registration

✅ Doctor Discovery

✅ AI-Guided Doctor Recommendations

✅ Appointment Scheduling

✅ Online Consultations

✅ Phone Consultations

✅ Physical Visit Consultations

✅ Payment Processing

✅ Prescriptions

✅ Medical Certificates

✅ Medical Records

✅ Health Monitoring

✅ Notifications

✅ Multi-Language Accessibility

---

# Key Features

## 👤 Patient Features

### Account Registration

Patients can create accounts using:

* Email and Password
* Google Sign-In

### Patient Profile

Patients can maintain healthcare information including:

* Personal Information
* Emergency Contacts
* Allergies
* Current Medications
* Existing Conditions
* Medical History

### Doctor Discovery

Patients can search doctors by:

* Name
* Specialization
* Location
* Healthcare Need

### Appointment Booking

Patients can:

* View Doctor Availability
* Select Consultation Slots
* Complete Health Triage Forms
* Choose Consultation Methods

### Consultation Methods

Supported consultation types:

* Google Meet
* Phone Consultation
* Physical Visit

### Medical Records

Patients can access:

* Consultation History
* Prescriptions
* Consultation Notes
* Medical Certificates

### Health Monitoring

Patients can log:

* Blood Pressure
* Weight
* Pulse Rate
* Symptoms
* Progress Notes

---

## 👨‍⚕️ Doctor Features

### Doctor Profile

Doctors can manage:

* Professional Information
* Credentials
* Specializations
* Clinic Details

### Availability Management

Doctors can:

* Create Recurring Weekly Schedules
* Manage Consultation Slots
* Block Unavailable Dates

### Consultation Management

Doctors can:

* Review Patient Triage Information
* Conduct Consultations
* Access Medical Records

### Notes & Prescriptions

Doctors can:

* Create Consultation Notes
* Issue Prescriptions
* Add Follow-Up Recommendations

### Medical Certificates

Doctors can generate:

* Medical Certificates
* Digital Signatures
* Verification Details

### Financial Management

Doctors can view:

* Consultation Earnings
* Pending Payouts
* Payment History

---

## 🛡️ Administrative Features

Administrators can:

* Review Doctor Applications
* Manage Platform Access
* Monitor Platform Activity
* Maintain Quality Control

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

# Judge Evaluation Guide

To experience the complete workflow:

### Patient Flow

1. Create a Patient Account
2. Complete Your Profile
3. Search for Doctors
4. Try AI Doctor Recommendation
5. Book a Consultation
6. Complete the Triage Form
7. Review Appointments
8. View Medical Records
9. Explore Health Monitoring

### Doctor Flow

1. Register as a Doctor
2. Complete Doctor Profile
3. Configure Availability
4. Review Patient Appointments
5. Create Notes & Prescriptions
6. Generate Medical Certificates
7. View Payout Information

---

# Technical Challenges

During development, several challenges were addressed:

### Multi-System Integration

The platform coordinates:

* Authentication
* Scheduling
* Payments
* Notifications
* Medical Records
* Calendar Integrations

while maintaining a seamless user experience.

### Healthcare Workflow Design

Balancing simplicity for patients while providing sufficient functionality for healthcare professionals required careful UX design decisions.

---

# Future Improvements

Planned enhancements include:

* Real-Time Notifications via WebSockets
* Enhanced AI Recommendation Validation
* Production-Ready Payment Workflows
* Expanded Language Support
* Advanced Analytics
* Enhanced Compliance & Audit Logging
* Mobile Application Support

---

# Developer

## Jorell Andrei Finez

**Sole Developer**

Designed, developed, and implemented the entire Click Klinik platform including:

* Frontend Development
* Backend Development
* Database Architecture
* Authentication
* API Integrations
* Payment Integration
* Google Meet Integration
* Health Monitoring
* Multi-Language Support
* AI Recommendation Features

---

# Closing Statement

Click Klinik is more than an appointment booking platform.

It is a complete telehealth ecosystem designed to support the entire healthcare journey—from finding the right doctor to managing long-term health and follow-up care.

**One Click Closer to Healthcare.**
