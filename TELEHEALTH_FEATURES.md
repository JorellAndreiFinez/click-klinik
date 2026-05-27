# Click Klinik Telehealth Hackathon Scope

## 0. Recommended Technical Stack

Based on WhiteCoat's technical expectations, this MVP should only use technologies within the allowed frontend, backend, and database categories.

### Platform

- `Web only`
- `Desktop-oriented but responsive`

### Frontend

- Allowed options:
  - `Next.js`
  - `Flutter`
  - `React`
- Chosen implementation:
  - `Next.js` with `TypeScript`
  - `shadcn/ui` or `Radix UI` for fast, polished UI building

Why:

- strongly typed frontend is preferred
- Next.js is fast to ship for web MVPs
- React ecosystem makes pair programming and iteration easier
- responsive desktop-first layout matches the builder-round expectation

### Backend

- Allowed options:
  - `NestJS`
  - `Node.js`
  - `Spring Boot`
- Chosen implementation:
  - `NestJS` with `TypeScript`
  - custom REST API for core business logic

Why:

- WhiteCoat prefers custom backend logic over relying mainly on BaaS
- NestJS is structured, modular, and easy to explain in evaluation
- TypeScript across frontend and backend reduces context switching

### Database

- `MongoDB`
- use a structured ODM such as `Mongoose`

Why:

- MongoDB is acceptable as a primary database as long as core logic still goes through custom backend APIs
- it is flexible and fast for a hackathon team that wants to move quickly
- patient profiles, doctor profiles, consultation notes, symptom inputs, and monitoring logs fit well as document-style records
- Mongoose helps keep schemas, validation, and data access organized

### Authentication

- `Firebase Authentication`
- one clear shared login entry where a user selects `Patient` or `Doctor`
- patient sign up using email/password or Google, with a strong email/password credential linked after Google signup for alternate login
- patient login using email/password or Google
- collect a Philippine mobile number after patient sign up and prevent duplicate patient registration
- approved doctors log in through the same authentication entry but enter the doctor workspace only after role authorization
- backend verifies Firebase tokens before allowing access to protected APIs

Important:

- Firebase is used selectively for `authentication only`
- core telehealth workflows, business logic, and database access still remain in the custom backend
- doctor applications use a separate onboarding and credential-verification process, not the patient sign-up screen
- selecting `Doctor` in the UI does not grant doctor permissions; the backend must enforce an approved doctor role before protected doctor access
- superadmin access is separate from doctor applications; a verified Firebase email must be allowlisted on the API server before it can approve or reject doctors

### Implemented Patient Authentication and Profile Flow

The working patient-first flow is:

1. Patient creates a Firebase-authenticated account using email/password or Google.
2. If Google signup is selected, patient creates and confirms a strong password; Firebase links the password credential to the same Google-authenticated account.
3. Patient adds a mobile contact number; the API checks MongoDB to prevent the same number from being registered to another patient profile.
4. Patient completes a telehealth profile with care-relevant information:
   - full name
   - birthday and sex
   - height and weight
   - emergency contact
   - allergies, existing conditions, and current medicines
   - short basic medical history
5. Patient must accept the privacy notice and health-data processing consent before a profile is stored.
6. Frontend sends the Firebase ID token to the NestJS API.
7. API verifies the Firebase ID token before storing or retrieving a patient profile in MongoDB.
8. Returning patients log in through email/password or Google and load only their own patient portal profile through the protected API.

Implementation boundary:

- Firebase stores authentication identity through email/password or Google sign-in.
- Password policy for new patient credentials: at least 12 characters with uppercase, lowercase, number, and special character, with confirmation matching.
- MongoDB stores the patient telehealth profile.
- The API uses the Firebase-authenticated `uid` as the patient identity anchor.
- The frontend cannot choose another patient's `uid` or directly access the database.

### Five-Day MVP Mobile Contact Decision

Phone OTP verification is intentionally excluded from the five-day MVP to reduce setup risk and keep the core patient-to-doctor flow polished.

Implemented approach:

- Patient creates an account using Firebase email/password or Google sign-in.
- Patient enters a Philippine mobile contact number.
- The protected NestJS API checks MongoDB whether another patient already registered the same mobile number.
- MongoDB enforces a unique index on the stored mobile number, so duplicate registration is blocked even if requests occur at nearly the same time.
- The mobile number is used as contact information only, not as proof of identity or phone ownership.

Important limitation:

- Checking whether a number already exists does not prove the user owns that phone number.
- If the project moves beyond hackathon MVP, add OTP verification or another ownership-confirmation method before relying on the number for security-sensitive messages.

Safety and privacy:

- clearly label the field as a care contact number, not a verified identity
- do not show whether a phone is in use before the user is signed into their own account
- store contact data only through the protected backend API
- explain that contact details are collected for telehealth care coordination

Official Firebase references:

- [Authenticate Using Google with JavaScript](https://firebase.google.com/docs/auth/web/google-signin)

### Notifications

- in-app notifications first
- email notifications for booking confirmations and schedule updates
- optional push notifications if time allows

### AI

- `Gemini API` for:
  - symptom-to-specialization recommendation
  - symptom structuring
  - monitoring summary generation

Important:

- AI should stay in a guidance-only role
- all AI outputs must include safety language and clear labeling

### Video Consultation

- `Google Meet`
- generated or attached through the booking flow instead of building custom video conferencing

### Scheduling

- `Google Calendar API`
- use calendar events to manage booked consultation schedules

### Payment

- `Xendit` or `PayMongo`
- `sandbox / test mode only`

### Deployment

- `Docker` for containerized deployment
- `Vercel` for the Next.js frontend
- deploy the NestJS backend to a public URL using an allowed or acceptable cloud platform
- use `MongoDB Atlas` as the hosted persistent MongoDB database

Allowed deployment options from the technical expectations:

- `Terraform`
- `Docker`
- `Vercel`
- `Fly.io`
- `Heroku`
- `AWS`
- `Cloudflare`

Implementation note:

- containerized deployment is preferred, so keep a working `Dockerfile` for the backend
- other hosting platforms are acceptable only if the application is accessible through a public URL
- the database remains `MongoDB`, not Firebase; Firebase is only for authentication

### Version Control

- `GitHub`

### Code Quality Expectations

- modular architecture
- well-documented key flows and setup instructions
- error handling for API validation, authentication, integrations, and empty/error UI states
- clear separation of patient, doctor, admin, AI, and scheduling logic
- reusable DTOs, schemas, services, and UI components where appropriate
- environment variables for third-party service credentials

### Third-Party Services and Development Tools

- third-party libraries and services are allowed
- AI coding assistants may be used during development
- generated code must still be understood, reviewed, and explainable during evaluation
- UI-generation tools may help with initial screens, but architecture and behavior must be owned by the team

Services used by this MVP:

- `Firebase Auth` for authentication only
- `MongoDB Atlas` for persistent database hosting
- `Gemini API` for guidance-only recommendation and summary features
- `Google Calendar API` and `Google Meet` for consultation scheduling/session links
- `Xendit` or `PayMongo` in sandbox mode for optional payment demo

### Recommended stack summary

If you need one final stack decision, use:

- `Next.js + TypeScript`
- `NestJS + TypeScript`
- `MongoDB + Mongoose`
- `Firebase Auth`
- `Google Calendar + Google Meet`
- `Gemini API`
- `Xendit or PayMongo sandbox`
- `Docker + Vercel/public backend hosting + GitHub`

### Compliance note for stack choice

- frontend should stay within `Next.js`, `Flutter`, or `React`
- backend should stay within `NestJS`, `Node.js`, or `Spring Boot`
- database can be any persistent DB, with `MongoDB` chosen for this project
- Firebase is used selectively for `authentication only`, not as the primary backend or database

## 1. Product Summary

`Click Klinik` is a Filipino-focused telehealth platform that acts as both:

- an `everyday health companion`
- a `teleconsultation and care navigation system`

Instead of only letting users book doctors, it helps them:

- check symptoms
- log home health readings
- know whether to monitor, teleconsult, or seek in-person care
- book online consultations through `Google Calendar` and `Google Meet`

### Core idea

`Your family's first digital health checkpoint before spending time, money, or travel on care.`

### Why it fits telehealth

This is still clearly `telehealth` because it includes:

- remote symptom intake
- remote health monitoring
- doctor matching
- online consultation scheduling
- digital follow-up
- care navigation

### Core compliance-safe statement

Use this across the product, especially in AI, monitoring, and triage-related screens:

`This tool provides guidance only and does not replace professional medical advice.`

---

## 2. What Makes It Different

Most telehealth apps are only used when someone is already ready to book a doctor.

`Click Klinik` is different because it helps in the moments `before` and `between` consultations.

### Main differentiators

- `Daily health check-in`
- `AI-assisted symptom and monitoring summaries`
- `Status-based care coordination`
- `Emergency routing to nearest hospital`
- `Family care mode`
- `Taglish-friendly symptom input`
- `Actionable next-step guidance after every check-in`
- `Household health tracking for repeat care needs`
- `Doctor-ready summaries that save time during consults`

### Filipino angle

The app should feel:

- modern
- medically credible
- mobile-first
- family-centered
- easy to use in English, Filipino, or Taglish

The goal is not to overdo culture. The goal is:

`modern telehealth grounded in how Filipinos actually ask for help and manage care`

---

## 2A. What Makes It Interesting

To feel memorable, the app should not stop at collecting data. It should help users take action right away.

### Core product feeling

The app should feel like:

- `a health companion that helps me decide`
- `a family care organizer`
- `a faster way to get doctor-ready`

### Features that make it more interesting

- `Next Best Action`
  - after every intake or check-in, the app gives one clear next step:
    - monitor at home
    - book teleconsult
    - recheck readings
    - go to nearest hospital
- `Health Snapshot`
  - a simple summary card showing today's symptoms, readings, meds taken, and risk flags
- `Before You Meet the Doctor`
  - a short prep screen that tells the patient what to prepare before the consult:
    - recent readings
    - current symptoms
    - medicines being taken
    - questions to ask
- `After-Care Plan`
  - after the consult, the app turns doctor advice into a simple follow-up checklist
- `Family Health Timeline`
  - lets a household see recent check-ins, consults, and follow-ups for each dependent

These make the product feel useful in daily life, not only during booking.

---

## 3. Best 5-Day Hackathon Scope

Keep only `3 roles`, but make `Admin` very limited:

- `Patient`
- `Doctor`
- `Admin`

### Core build focus

- `patient intake`
- `daily health check-in`
- `home health monitoring`
- `AI-assisted summaries with Gemini`
- `doctor search and matching`
- `booking and scheduling`
- `test payment flow`
- `consultation status tracking`
- `doctor notes and prescription summary`
- `patient and doctor care coordination`
- `minimal admin support for safety and operations`

### Use existing platforms

- `Google Calendar` for scheduling
- `Google Meet` for online consultation
- `Xendit` or `PayMongo` in `sandbox / test mode` for payments

### Internal portal note

Based on the WhiteCoat builder-round document, `Doctor` and `Admin` may share the same internal portal or back-office style interface.

That does **not** mean they are the same user role.

The better interpretation is:

- `Doctor` uses the internal portal for consultation, schedule, records, and prescriptions
- `Admin` uses a limited internal support view for verification, stuck cases, and safety checks

So the platform can have:

- a `Patient-facing app or portal`
- a shared `Internal Portal` for doctor and admin users with different permissions

---

## 4. Main User Flow

### Standard flow

1. patient signs up
2. patient completes symptom intake or daily check-in
3. patient logs readings if needed
4. system gives next-step guidance
5. patient selects doctor and schedule
6. patient completes test payment
7. system confirms booking and updates status
8. patient completes triage if needed
9. admin or system checks if case is complete and ready
10. doctor reviews intake and monitoring logs
11. consultation happens through Google Meet
12. doctor adds notes, advice, and prescription summary
13. patient sees follow-up instructions and future monitoring guidance

### Emergency flow

1. patient reports red-flag symptoms
2. system stops normal teleconsult flow
3. system shows `seek emergency in-person care now`
4. system suggests nearest hospital based on location

---

## 5. Consultation Status Workflow

Each consultation should move through a clear lifecycle visible to patient, doctor, and limited admin support.

### Recommended statuses

1. `Draft`
2. `Booked`
3. `Pending Payment`
4. `Paid`
5. `Confirmed`
6. `For Triage`
7. `Triaged`
8. `Ready for Review`
9. `Queued`
10. `In Consultation`
11. `For Follow-Up`
12. `Completed`
13. `Cancelled`
14. `No Show`

### Sample happy-path flow

`Draft` -> `Booked` -> `Pending Payment` -> `Paid` -> `Confirmed` -> `For Triage` -> `Triaged` -> `Ready for Review` -> `Queued` -> `In Consultation` -> `Completed`

### Alternative outcomes

- `Pending Payment` -> `Cancelled`
- `Confirmed` -> `No Show`
- `In Consultation` -> `For Follow-Up`

### Why this matters

- patients know what happens next
- doctors know which cases are ready
- admin can step in for missing triage, failed payments, or doctor coordination only when needed

---

## 6. MVP Features by Role

## Patient

### Patient Account Creation

- register using email and password or Google
- collect a mobile contact number after sign-up
- reject a mobile contact number already registered to another patient profile
- create telehealth account securely
- add personal information such as:
  - name
  - birthday
  - weight
  - height
  - profile picture
  - contact details
  - basic medical history
- simple privacy controls for doctor-visible data

### Doctor Discovery

- browse available doctors
- view doctor availability before booking
- explore doctors based on medical needs or symptoms
- filter and search doctors by specialization

### AI Recommendation

- describe symptoms or healthcare concerns in English, Filipino, or Taglish
- receive doctor recommendations based on specialization or expertise
- show clear AI safety language that recommendations are guidance only and do not replace professional medical advice

### Appointment Booking

- book consultations online based on available schedules
- reschedule consultation schedules
- cancel consultation schedules
- create schedule via Google Calendar
- receive Google Meet consultation link
- receive real-time push notifications for:
  - booked appointments
  - upcoming appointments
  - schedule updates

### Consultation Session

- join consultation session through Google Meet
- attend scheduled virtual consultation without requiring custom video conferencing

### Medical Records

- view appointment history
- view basic medical records
- view prescriptions provided by doctors after each session
- track consultation status
- review an `After-Care Plan` checklist after each consult

### Bonus Patient Experience Layer

These features help differentiate the app beyond the required MVP:

- `Daily Check-In`
  - answer `kumusta ka today` prompts and receive next-step guidance
- `Home Health Monitoring`
  - log BP, blood glucose, temperature, pulse oximeter, weight, and symptom context
- `Health Snapshot`
  - simple summary of symptoms, readings, meds, and flags
- `Medication and monitoring reminders`
- `Before consultation` prep checklist

---

## Doctor

### Doctor Account and Profile Management

- register using email and password
- create and manage doctor account securely
- add profile details, short bio, and specialization
- show visible consultation focus and availability

### Medical Records Access

- view patient appointment history
- view previous consultation notes
- view previously issued prescriptions
- review patient symptom intake, monitoring logs, and uploaded readings
- view AI-generated summaries with clear labels showing what is patient-reported, AI-generated, or doctor-reviewed

### Consultation Schedule Management

- manage consultation schedules
- set available consultation slots
- restrict unavailable time slots
- receive real-time push notifications for:
  - newly booked appointments
  - upcoming appointments
  - schedule updates or changes

**MVP implementation note**

- Implement now: approved doctors can create available slots, add blocked/unavailable periods, switch open/blocked status, and remove unbooked periods from the doctor dashboard.
- Implement now: MongoDB stores the doctor schedule and in-app schedule-change notifications; the dashboard refreshes notification updates regularly for the demo.
- Implement now: patients can discover approved public doctors, review real availability, open a booking calendar, choose a time slot, and save a consultation in both patient and doctor dashboards.
- Implement now: appointment booking stores consultation records in MongoDB and uses Google Calendar / Google Meet integration hooks so the meeting link and calendar event details are saved with the appointment.
- Safety rule: only an approved doctor account may manage its own availability; booked time periods must not be overwritten as unavailable.

### Consultation Notes and Prescriptions

- add prescriptions
- add medical consultation notes
- add care plan and follow-up advice
- generate simple consultation summary
- recommend follow-up monitoring when needed
- save lightweight patient history for future consults
- generate a patient-friendly follow-up checklist from the consultation outcome

### Consultation Session

- join consultation session through Google Meet
- conduct the virtual consultation without building custom video conferencing
- update consultation status after major consultation steps

---

## Admin

### Minimal Admin Role

Admin exists only to support the patient-doctor workflow, not to run a full operations platform.

### Essential admin responsibilities

- verify doctor credentials before activation
- activate or deactivate doctor profiles
- review incomplete or stuck consultations
- confirm that triage and payment requirements are complete when needed
- reassign or reschedule cases if a doctor becomes unavailable
- monitor compliance and safety flags

### Minimal admin tools

- simple doctor management
- simple consultation queue view
- simple status override for valid operational cases
- safety and compliance review panel

### Relationship with doctor module

Doctor and admin may use the same internal portal, but their permissions should stay different:

- `Doctor` focuses on patient care, schedules, records, notes, and prescriptions
- `Admin` focuses on verification, workflow support, and safety/compliance handling

Keep this lightweight. Admin should help the workflow move, not become the center of the MVP.

---

## System and Safety

### Platform Coordination

- automatically update consultation status after booking, payment, and triage completion
- show current consultation step clearly to both patient and doctor
- flag failed payments, incomplete triage, and abnormal readings
- keep a consultation audit trail for major status and medical updates
- allow limited admin intervention for stuck or exceptional cases

### Privacy and Safety

- role-based access for admin, doctor, and patient
- secure storage for consultation summaries and uploads
- consent notice for AI-assisted summaries and remote monitoring
- visible disclaimers for guidance-only features

---

## 6A. PH Compliance and Safety Layer

The product should include a clear `Philippine compliance and safety` approach even in hackathon form.

### Safety statement to repeat across relevant screens

`This tool provides guidance only and does not replace professional medical advice.`

### Where this should appear

- symptom intake
- daily check-in
- health monitoring logs
- AI-generated summaries
- next-step guidance cards
- emergency routing screens
- prescription summary or follow-up reminders when appropriate

### Minimum safety rules

- clearly label `patient-reported data`
- clearly label `AI-generated summary`
- clearly label `doctor-reviewed advice`
- show emergency warnings for red-flag symptoms
- prevent AI from presenting output as diagnosis or treatment orders
- require doctor review before any prescription or formal clinical advice is finalized

### Minimum privacy and consent rules

- ask consent before collecting health data
- ask consent before using AI-assisted summaries
- explain what data is stored and who can access it
- allow only role-based access to sensitive health information
- keep an audit trail of major medical, admin, and system actions

### Implemented Privacy and Security Measures for the MVP

Implemented now:

- visible `Patient Privacy Notice` before completing patient onboarding
- required consent for patient profile storage and health-data processing
- separate optional consent for AI-assisted summaries
- Firebase ID-token verification on protected patient API endpoints
- patient records retrieved by verified Firebase identity, not user-submitted IDs
- Firebase Admin credentials loaded from environment variables, not committed credential JSON
- MongoDB URI required through environment variables only

Production hardening still required:

- formal privacy impact assessment and legal/compliance review
- encrypted deployment secrets and managed key rotation
- audit event storage and access-review processes
- validated doctor role authorization and credential approval
- breach-response procedure, retention/deletion policy, and production security testing

Compliance wording:

- This MVP is designed to support safeguards expected for sensitive health information.
- Do not claim the prototype is automatically `HIPAA compliant` or fully compliant with Philippine privacy requirements without formal organizational, legal, and security review.
- For Philippine users, health information is sensitive personal information under the `Data Privacy Act of 2012 (Republic Act No. 10173)`.
- If the service is subject to US HIPAA, required administrative, physical, and technical safeguards must also be implemented and assessed.

Primary references:

- [National Privacy Commission - Data Privacy Act of 2012](https://privacy.gov.ph/data-privacy-act/)
- [HHS - HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [Firebase - Verify ID Tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens)

### Best wording style

Use words like:

- `guidance`
- `support`
- `summary`
- `review`
- `recommendation for clinician review`

Avoid words like:

- `diagnosis confirmed`
- `AI prescription`
- `medical certainty`
- `doctor replacement`

---

## 7. Accurate Remote Monitoring

The app should not claim that AI alone measures health.

The safer model is:

`accurate monitoring = real device readings + guided capture + rule checks + AI summary + doctor review`

### How to improve accuracy

- use `manual entry from real home devices`
- give clear measurement instructions
- ask for repeated blood pressure readings
- collect context:
  - time taken
  - before/after meal
  - meds taken or missed
- combine readings with symptom questions
- ask patients to confirm suspicious values
- let doctors review trends over several days

### Best monitoring tracks

- `hypertension monitoring`
- `diabetes follow-up`
- `respiratory / fever follow-up`

### Safety position

The app should clearly say:

- it `supports home monitoring`
- it `helps doctors review trends`
- it does `not replace emergency care`
- it does `not diagnose on its own`
- it provides `guidance only and does not replace professional medical advice`

---

## 8. AI Use With Gemini

AI should be used only in a `supporting role`.

### Good uses of Gemini

- convert free-text symptoms into structured fields
- summarize several days of readings into doctor-friendly notes
- translate Taglish or Filipino symptom descriptions into clearer summaries
- detect missing information in logs
- generate patient-friendly reminders
- suggest a draft triage category for review

### Do not use Gemini for

- autonomous diagnosis
- automatic prescriptions
- replacing emergency rules
- replacing doctor review
- making final clinical decisions

### Required AI safety language

Every AI-related feature should clearly state:

`This tool provides guidance only and does not replace professional medical advice.`

AI output should always be presented as:

- draft summary
- support for review
- non-final recommendation

### Best framing

- `AI-assisted intake`
- `AI-generated monitoring summary`
- `AI-supported care navigation`

Not:

- `AI doctor`
- `AI diagnosis`

---

## 9. Filipino-Relatable Product Layer

These features help the app feel local without losing medical credibility.

### Recommended Filipino-relatable features

- `Taglish-first guidance`
- `Pamilya Mode` for managing parent, child, spouse, or grandparent care
- `Bantay Kalusugan` as the daily check-in feature name
- `Barangay-aware location flow`
- `Alagang follow-up` for maintenance care reminders and repeat bookings
- `Kumusta Today` as a friendly daily prompt

### Rule for culture

`Use culture to improve trust, clarity, and family-centered care, not to distract from healthcare delivery.`

---

## 10. Emergency Routing

If a patient reports emergency warning signs, the platform should act as a `care navigation` layer.

### Red-flag examples

- chest pain
- severe shortness of breath
- seizure
- loss of consciousness
- heavy bleeding
- sudden weakness or trouble speaking

### What the system should do

- stop normal teleconsult flow
- show `seek emergency in-person care now`
- suggest nearest hospital based on patient location
- remind the patient not to wait for an online consultation
- show that the emergency screen provides guidance and does not replace emergency responders or professional medical advice

---

## 11. Test Payment Gateway

For the hackathon, payment should be a `working demo flow`, not a full billing platform.

### Recommended scope

- integrate `Xendit` or `PayMongo`
- use only `test / sandbox environment`
- simulate successful and failed transactions
- store payment reference, amount, status, and timestamp

### Keep it simple

- one consultation fee
- one checkout flow
- payment status page
- basic receipt or confirmation view

### Avoid

- refunds
- split payments
- subscriptions
- insurance claims
- complex invoicing

---

## 12. Bonus Features Strategy

WhiteCoat's bonus criteria are not about adding the most features.

They are about showing:

- clear product differentiation
- a more seamless patient and doctor journey
- thoughtful UX and retention design
- realistic features that can still be demonstrated well

### Best bonus direction for this project

If time allows, bonus features should answer these two questions:

1. `How is this different from a normal telehealth booking app?`
2. `How does this create a smoother and more engaging patient and doctor experience?`

### Best bonus features for differentiation

- `Daily Check-In`
  - makes the app useful even when the user is not booking a consult
- `Home Health Monitoring`
  - gives doctors more context before the consultation
- `Health Snapshot`
  - turns patient input into a doctor-ready summary
- `Next Best Action`
  - helps users know whether to monitor, teleconsult, recheck, or seek urgent care
- `After-Care Plan`
  - turns post-consult advice into a simple checklist
- `Pamilya Mode`
  - supports family-centered care, which is highly relatable for Filipinos

### Best bonus features for retention

- medication reminders
- monitoring reminders
- better patient-facing trend charts
- family member switching inside one account
- secure follow-up messaging
- lightweight consultation history and follow-up flow

### Bonus feature priority rule

Choose bonus features that:

- strengthen the core telehealth flow
- improve clarity and confidence
- save time for doctors
- encourage repeat use by patients

Avoid bonus features that:

- look impressive but are hard to finish
- add heavy integrations without clear demo value
- distract from the required patient and doctor modules

---

## 12A. Answers to WhiteCoat Bonus Questions

### How does this telehealth application differentiate itself from other similar platforms?

Most telehealth platforms begin when a patient already knows they want an appointment.

`Click Klinik` supports the patient earlier, when they are still asking:

`Ano ang dapat kong gawin?`

Its differentiator is `guided care navigation for Filipino families`.

Beyond the required doctor discovery and booking flow, Click Klinik adds:

- `Kumusta Today`
  - a Taglish-friendly check-in where patients can describe concerns naturally
- `AI-Assisted Doctor Recommendation`
  - helps match patient concerns to the appropriate doctor specialization without diagnosing
- `Health Snapshot`
  - prepares a short summary of patient-reported concerns and optional home readings before consultation
- `Next Best Action`
  - gives clear guidance to browse a suitable doctor, monitor symptoms, or seek urgent in-person care for red flags
- `Pamilya Mode`
  - a future-ready family care concept for users helping parents, children, or older relatives

This positions Click Klinik as more than an online appointment tool:

`a practical first digital health checkpoint built around Filipino language, family behavior, and access challenges`

Safety remains central:

`This tool provides guidance only and does not replace professional medical advice.`

AI supports doctor discovery and consultation preparation. It does not diagnose, prescribe, or replace a licensed doctor.

### How does this application elevate the patient and doctor journey?

#### For patients

Before the consultation:

- patients describe their concern in English, Filipino, or Taglish
- AI guides them toward a relevant specialization
- patients browse matching doctors, see schedules, and book with less guesswork
- a Health Snapshot helps them prepare relevant symptoms and medical context

During the consultation:

- patients join through Google Meet without needing a custom video tool
- relevant patient information and the pre-consult summary are ready for doctor review

After the consultation:

- patients review records and prescriptions
- an `After-Care Plan` can make instructions easier to follow
- appointment updates and reminders support continuity of care

#### For doctors

- doctors receive better-organized patient context before the session
- AI can summarize patient-reported concerns, clearly labelled as an AI-generated draft
- doctors retain full clinical control over notes, prescriptions, and advice
- schedule management, blocked slots, and notifications make the consultation workflow smoother

### Focused bonus feature to implement

For a 5-day build, the strongest bonus feature is:

`AI-Assisted Doctor Recommendation with a Patient Health Snapshot`

This is the best fit because it:

- builds directly on WhiteCoat's required AI recommendation feature
- differentiates the app without expanding scope too far
- improves both patient confidence and doctor preparedness
- can be polished and demonstrated convincingly
- has clear safety boundaries appropriate for telehealth

### Presentation-ready answer

`Click Klinik differentiates itself by helping Filipino patients understand where to begin, not only where to book. Through Taglish-friendly symptom input, AI-assisted doctor matching, and a concise Health Snapshot shared before consultation, patients experience less uncertainty while doctors receive better-prepared cases. The solution stays safe by treating AI as guidance only, leaving diagnosis and treatment fully with the doctor. Rather than adding many disconnected features, we focus on one complete, intuitive care journey that users can trust and return to.`

---

## 13. Future Scope

- full EMR / EHR integration
- pharmacy delivery integration
- insurance verification and claims
- wearable or IoT device integration
- home lab booking
- home visit scheduling
- advanced analytics and reporting
- full production-grade payment operations

---

## 14. Features to Avoid During Hackathon

- custom video call system
- full production payment system
- deep analytics and enterprise reports
- lab integrations
- ambulance dispatch
- full e-prescription compliance workflows
- complex admin role systems beyond the minimal support role
- insurance flows

---

## 14A. Build Prioritization Guidance

To stay aligned with the WhiteCoat evaluation style:

- prioritize completeness over breadth
- finish the required patient and doctor modules first
- keep the architecture clean and easy to explain
- make the patient and doctor flows polished and easy to demo
- add bonus features only after the core workflow is stable

The strongest version of this project is:

`small, complete, safe, and memorable`

Not:

`feature-heavy but unfinished`

---

## 14B. Pair Programming Note

WhiteCoat's pair programming evaluates how well the team:

- thinks through problems
- communicates technical decisions
- adapts to feedback
- collaborates in real time
- explains tradeoffs while implementing

Because of that, the best feature to present during pair programming is one that is:

- easy to understand quickly
- meaningful to the product
- small enough to finish or improve live
- rich enough to discuss UX, backend logic, validations, and tradeoffs

### Best feature to present

`AI Doctor Recommendation + Doctor Discovery`

Why this is strong:

- it is part of the required patient module
- it is also one of the clearest differentiators of the product
- it lets you discuss both product thinking and technical implementation
- it connects symptom input, AI guidance, specialization matching, and booking flow
- it is easier to demo live than a full consultation or payment flow

### Good pair programming scope

During the session, a strong implementation target would be:

1. patient enters symptoms or concern
2. system structures the input
3. Gemini suggests the most relevant doctor specialization
4. doctor list is filtered based on the recommendation
5. patient sees a clear explanation and can still manually choose

### Why this works well in evaluation

It gives you a chance to explain:

- why AI is used only for guidance
- how safety disclaimers are applied
- how fallback behavior works if AI fails
- how doctor matching logic is designed
- how UX supports trust and clarity

### Other good backup options

If the facilitator redirects the task, these are also good pair programming features:

- `Appointment Booking + Reschedule/Cancel`
- `Consultation Status Workflow`
- `Medical Records and Prescription View`
- `Daily Check-In with Next Best Action`

### Avoid for pair programming unless specifically asked

- full payment integration
- large admin workflows
- too many screens in one task
- features that depend on many third-party services working live

### Pair programming mindset

Prefer a feature that shows:

- clean architecture
- good naming and component structure
- thoughtful edge-case handling
- safe AI usage
- polished UX decisions

This is better than trying to show the biggest feature.

---

## 15. Final MVP Checklist

Build these first:

1. `Patient account creation and profile`
2. `Doctor discovery with specialization search`
3. `AI doctor recommendation based on symptoms`
4. `Appointment booking, reschedule, and cancel`
5. `Google Calendar event creation`
6. `Google Meet link generation`
7. `Real-time appointment notifications`
8. `Consultation session join flow`
9. `Medical records and prescription viewing`
10. `Doctor account, schedule, and consultation notes module`
11. `Consultation status workflow`
12. `System-managed safety and compliance flow`
13. `Minimal admin support for doctor verification and stuck cases`

### Best bonus differentiators if time allows

1. `Daily check-in`
2. `Home health monitoring logs`
3. `Health Snapshot and Next Best Action`
4. `After-Care Plan checklist`
5. `AI-assisted monitoring summaries with Gemini`
6. `Test payment checkout with Xendit or PayMongo`

---

## 16. Sample Pitch

`Click Klinik` is a smart telehealth platform for Filipinos that works as a daily health companion, not just an online doctor booking app. Patients can check symptoms, log home readings like blood pressure, glucose, temperature, or oxygen level, and receive a clear next best action on whether to monitor, recheck, teleconsult, or go to the nearest hospital. The app creates a simple Health Snapshot before the consult and an After-Care Plan after it, making every visit more actionable. Gemini helps summarize symptom logs and monitoring trends, while Google Calendar, Google Meet, and a sandbox payment flow make consultations easy to schedule and complete. The platform then moves each case through a clear workflow from booked to triaged, ready for review, consulted, and completed, with a minimal admin role only for doctor verification, safety checks, and exceptional cases.`

---

## 17. One-Line Positioning

`A Filipino-focused telehealth app that combines daily health check-ins, AI-assisted home monitoring, care navigation, and actionable teleconsult follow-through in one system.`
