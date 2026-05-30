# Click Klinik 15-Minute Demo Script and Flow

## Goal

Present Click Klinik as a complete telehealth MVP, not just a booking page.

Main message:

> Click Klinik supports the full patient and doctor journey: onboarding, doctor discovery, AI-guided routing, triage, booking, payment, consultation, records, prescriptions, and follow-up.

Safety message:

> This is doctor-led telehealth. AI provides guidance only and does not replace professional medical advice.

## 0:00-0:45 - Opening

Screen: Landing page

Script:

Hi, this is Click Klinik, a telehealth platform designed for Filipino patients and doctors. The goal is to make online healthcare easier to use in everyday life, especially for patients who need a simple way to find care, book a consultation, pay, meet the doctor, and receive medical records afterward.

In this demo, I will walk through the patient flow, the doctor flow, the required Whitecloak features, the bonus features we added, then I will show the code structure, technical decisions, and limitations.

## 0:45-2:00 - Application Overview

Screen: Landing page and auth page

Script:

Click Klinik has three main roles:

- Patient: creates a profile, finds doctors, books consultations, pays, joins sessions, and views records.
- Doctor: applies, manages availability, reviews patients, joins sessions, and writes notes or prescriptions.
- Admin or superadmin: reviews doctor applications before doctors become public.

Required features covered:

- Patient account creation with email/password and profile details.
- Doctor profile management with credentials, bio, and specialization.
- Doctor discovery with search, symptom exploration, and specialization filters.
- AI recommendation for matching symptoms to doctor specialization.
- Appointment booking with reschedule/cancel-ready status handling.
- Consultation session access using Google Meet, phone, or physical visit.
- Doctor schedule management with recurring availability and unavailable slot restrictions.
- Doctor medical records access.
- Doctor consultation notes and prescriptions.
- Patient medical records with appointment history, notes, prescriptions, and certificates.
- Real-time style in-app notifications for booking, cancellation, notes, prescriptions, and updates.

## 2:00-3:15 - Patient Profile

Screen: Patient profile or signup

Script:

Patient authentication uses Firebase Auth for email/password and Google login. The telehealth profile itself is saved in MongoDB through our NestJS backend.

For patient data, we collect only information useful for safe consultation: first name, last name, birthday, sex, weight, height, mobile number, emergency contact, allergies, existing conditions, current medications, and medical history.

We also added Philippine location fields and map pin coordinates. The patient can select region, province, city or municipality, barangay, and exact pin location. This supports location-based matching and physical visit directions.

## 3:15-4:45 - Doctor Discovery and AI Recommendation

Screen: Patient Find Care page

Demo:

- Search by name or specialization.
- Type a symptom like `diabetes`, `cough`, or `chest pain`.
- Click AI matching.
- Show recommended specialization and doctor results.

Script:

Patients can browse approved public doctors only. They can search by name, specialization, location, or medical need.

AI recommendation is used only for routing. For example, if the patient types diabetes, the system can suggest Internal Medicine, General Physician, or related doctor types. The AI is not diagnosing. It helps the patient choose a better starting point.

Bonus features shown here:

- AI symptom-to-specialization routing with fallback rules.
- Location-aware doctor matching.
- Doctor approval workflow before public listing.

## 4:45-7:00 - Booking, Availability, and Triage

Screen: Patient doctor calendar booking page

Demo:

- Open a doctor.
- View availability.
- Select a date and 30-minute slot.
- Show disabled past or unavailable slots.
- Complete the 3-step triage form.
- Choose consult method.

Script:

Doctor availability is based on recurring weekly templates. If the doctor is available every Monday from 7 AM to 8 PM, the booking page generates 30-minute slots for Mondays.

The system prevents double booking at the slot level. If a patient books 7:30 to 8:00, only that 30-minute slot is blocked. The rest of the day remains available.

Before confirming the booking, the patient must complete a 3-step triage form:

- Health information: consult method, chief complaint, detailed symptoms, onset date, medications, allergies, and health problems.
- Health history: smoking and alcohol use.
- Consent: data sharing, insurance, laboratory, pharmacy, and emergency safety terms.

This gives the doctor useful context before the consultation starts.

Bonus features shown here:

- Required triage before payment and booking completion.
- Google Meet, cellular, and physical visit consultation methods.
- Philippine address and exact map pin support for physical visits.

## 7:00-8:30 - Payment and Appointment Confirmation

Screen: Patient appointment page

Demo:

- Show consultation fee.
- Show Xendit test payment.
- Show pending/paid payment status.
- Show cancel/refund option.
- Show appointment card/calendar.

Script:

Payments use Xendit test mode. Patients can choose pay now or pay later after consultation. For pay-now consultations, the app can block paid consultation actions until the payment is confirmed.

The backend stores payment reference IDs, checkout URLs, payment status, receipts, refund status, and payout records.

Bonus features shown here:

- Xendit sandbox payment flow.
- Payment refresh using reference ID.
- Refund request flow.
- Six-hour refund window.
- Receipt download.
- Doctor payout tracking and Click Klinik commission.

## 8:30-10:00 - Consultation Session

Screen: Patient appointments, doctor calendar/session

Demo:

- Show patient appointment.
- Show same appointment on doctor side.
- Open Google Meet if Google Meet method.
- Show phone details if cellular method.
- Show route page if physical visit method.

Script:

After booking, both patient and doctor see the consultation in their dashboards.

For Google Meet consultations, the backend creates a Google Calendar event and Meet link through the Google Calendar API. The patient and doctor are added as attendees.

For cellular consultation, the app shows relevant phone contact details.

For physical visits, the app uses saved patient and doctor coordinates to show an in-app route estimate and map links.

## 10:00-11:30 - Doctor Workspace

Screen: Doctor dashboard, availability, calendar

Demo:

- Show doctor dashboard.
- Show availability page.
- Show calendar page.
- Show appointment queue.

Script:

The doctor dashboard is focused on daily work: upcoming consultations, patient records, availability, calendar, notes and prescriptions, session access, profile, and payout.

Doctors manage recurring weekly availability. This avoids manually adding every single future date.

The doctor calendar displays consultations in 30-minute rows, similar to a clinic queue, so doctors can quickly see their schedule.

Required features shown:

- Schedule management.
- Restrict unavailable or booked slots.
- Consultation session access.
- Medical records access.

Bonus features shown:

- Clinic wallet.
- Gross payment, platform commission, pending payout, and test payout.
- In-app notification history.

## 11:30-12:45 - Notes, Prescriptions, Certificates, and Records

Screen: Doctor Notes & Rx, then Patient Records

Demo:

- Select a consultation.
- Show triage summary.
- Add public note and private note.
- Add/edit/remove prescriptions.
- Issue medical certificate if add-on exists.
- Show patient records page and PDF downloads.

Script:

Doctors can write consultation notes and prescriptions after reviewing the patient triage.

Public notes are visible to the patient. Private notes are for doctors only, so future consultations can still have clinical context without exposing internal notes.

Doctors can add, edit, and remove prescriptions. If the patient ordered a medical certificate add-on, the doctor can issue a certificate with doctor information, verification text, watermark, and signature.

Patients can view records in their dashboard and download prescription or certificate PDFs.

Required features shown:

- Doctor consultation notes and prescriptions.
- Doctor access to patient consultation history.
- Patient medical record history.
- Patient view of prescriptions and doctor-provided records.

Bonus features shown:

- Public/private notes.
- Editable prescriptions.
- Medical certificate add-on.
- Digital signature and watermark.
- Patient-friendly records page.
- Doctor rating after completed consultation.

## 12:45-14:15 - Code and Technical Overview

Screen: Code editor

Script:

The frontend is Next.js with TypeScript. We used the App Router and organized the UI by user journey.

Frontend paths to show:

- `apps/web/src/app/page.tsx`: landing page.
- `apps/web/src/app/auth`: patient and doctor authentication flow.
- `apps/web/src/app/patient/doctors/page.tsx`: doctor discovery and AI recommendation UI.
- `apps/web/src/app/patient/doctors/[doctorId]/calendar/page.tsx`: availability, triage, booking, and payment setup.
- `apps/web/src/app/patient/appointments/page.tsx`: patient consultation calendar, payment status, cancellation, refund, receipt, and join actions.
- `apps/web/src/app/patient/records/page.tsx`: patient records, prescriptions, certificates, and PDF generation.
- `apps/web/src/app/doctor/schedule`: doctor recurring availability.
- `apps/web/src/app/doctor/schedule/calendar`: doctor calendar queue.
- `apps/web/src/app/doctor/notes/page.tsx`: doctor notes, prescriptions, certificates, and signatures.
- `apps/web/src/components/workspace-notifications.tsx`: shared notification UI.
- `apps/web/src/lib`: frontend API clients.

The backend is NestJS with TypeScript. We used custom APIs for business logic and MongoDB for persistent data. Firebase is used only for authentication.

Backend paths to show:

- `apps/api/src/app.module.ts`: module architecture.
- `apps/api/src/auth/firebase-auth.guard.ts`: Firebase token verification.
- `apps/api/src/patients`: patient profile and records access.
- `apps/api/src/doctors`: doctor application, approval, discovery, and AI recommendation.
- `apps/api/src/schedules`: weekly templates and public availability.
- `apps/api/src/appointments`: appointment booking, slot checks, payment status, cancellation, refund, calendar/Meet, and payouts.
- `apps/api/src/medical-records`: notes, prescriptions, certificates, and patient/doctor record retrieval.
- `apps/api/src/health-monitoring`: patient health logs and AI-style guidance summaries.
- `apps/api/src/integrations/calendar`: Google Calendar and Meet integration.
- `apps/api/src/integrations/payments`: Xendit test payments, refunds, and payouts.
- `apps/api/src/integrations/notifications`: patient and doctor notifications.

Development strategy:

- Keep frontend pages focused on workflow and UI.
- Keep API calls centralized in `apps/web/src/lib`.
- Keep backend modules separated by domain: patients, doctors, schedules, appointments, records, payments, calendar, notifications.
- Use strong typing with TypeScript across frontend and backend.
- Keep Firebase limited to auth because the requirement discourages using BaaS as the main database.
- Put core telehealth data and business rules in NestJS and MongoDB.
- Treat appointment booking as the critical transaction because it coordinates schedule safety, payment, calendar, notifications, and records.

## 14:15-15:00 - Technical Limitations and Future Plan

Screen: Code or final app screen

Script:

This is a five-day MVP, so there are intentional limitations.

Payments and payouts are in Xendit test mode. In production, we would strengthen webhook verification, reconciliation, audit logs, refund approval rules, and payout compliance.

Google Meet is created through Google Calendar. In production, we would improve calendar permission handling, retries, and failed invite recovery.

AI is guidance-only. In production, we would add stricter clinical guardrails, emergency escalation, prompt monitoring, and doctor-reviewed recommendation rules.

Notifications are currently in-app and polling-style. In production, we would use WebSockets or push notifications for true real-time delivery.

The physical visit route uses saved coordinates and open-map routing. In production, we would use a more reliable routing provider and clearer travel instructions.

Security and compliance are started but not complete for production. The MVP includes privacy consent, role-based access, Firebase token checks, and doctor approval. Future work should add deeper audit trails, encryption policy, access logs, retention rules, and formal Philippine data privacy compliance review.

Closing:

Click Klinik demonstrates the complete required telehealth workflow and adds practical bonus features around Filipino location support, triage, payments, records, doctor trust, and follow-up care.

## If Time Is Short

Prioritize this order:

1. Patient discovery and AI recommendation.
2. Booking with availability and triage.
3. Xendit test payment and appointment page.
4. Doctor calendar and notes/prescriptions.
5. Patient records and PDF documents.
6. Code overview.
7. Limitations.
