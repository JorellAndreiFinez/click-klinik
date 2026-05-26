# Pair Programming Guide

## Recommended Feature To Show

`AI Doctor Recommendation + Doctor Discovery`

This is the best feature to present because it is:

- part of the required `Patient Module`
- clearly differentiated from a normal telehealth booking app
- small enough to build or improve live
- strong for discussing UX, safety, fallback logic, and architecture

---

## Main Demo Flow

Show this simple flow:

1. patient enters symptoms or concern in English, Filipino, or Taglish
2. system structures the concern
3. AI recommends a doctor specialization
4. doctor list is filtered using that recommendation
5. patient still has manual control to choose another doctor
6. safety disclaimer is shown clearly

Use this disclaimer:

`This tool provides guidance only and does not replace professional medical advice.`

---

## What To Say

### Short intro

`We chose this feature because it is both part of the required patient module and one of our strongest differentiators. Instead of making patients figure out the right doctor by themselves, we help guide them based on their symptoms while still keeping the final choice in the patient's hands.`

### Why this matters

`A lot of users do not know which specialization to choose. This flow reduces uncertainty, improves doctor matching, and makes the booking experience feel smarter and more helpful.`

### Why AI is safe here

`We use AI only for recommendation and structuring patient concerns. It does not diagnose, prescribe, or replace doctor judgment.`

### Why this is good product design

`It improves the patient journey before booking, saves time, and gives doctors better context before the consultation.`

---

## What You Can Build Live

If they ask you to code or improve the feature, focus on these parts:

### Frontend

- symptom input form
- specialization recommendation card
- doctor list with filter state
- loading, empty, and error states
- disclaimer placement

### Backend or logic

- function to send symptom input to AI
- safe response parser
- mapping AI output to known specializations
- fallback behavior if AI output is unclear

### UX details

- keep manual doctor selection available
- explain why the doctor was recommended
- let users revise symptoms easily

---

## Good Technical Talking Points

Be ready to explain:

- why AI output is mapped to a controlled list of specializations
- why AI is guidance-only and not diagnosis
- how you handle invalid or uncertain AI responses
- why manual override is important
- how this keeps the system safer and easier to trust

---

## Suggested Fallback Logic

If AI fails, do this:

1. show a neutral message like `We couldn't confidently recommend a specialization right now.`
2. let the patient browse doctors manually
3. optionally show common specializations as shortcuts

This is important because it shows good product judgment.

---

## Suggested Pair Programming Flow

### First 5 minutes

- restate the feature clearly
- confirm assumptions
- explain what you will implement first

Example:

`I’ll start with the symptom input to recommendation flow, then connect that to doctor filtering, and finally make sure the fallback and safety messaging are clear.`

### Next 20 to 40 minutes

- implement or improve the core interaction
- narrate decisions while coding
- keep naming and structure clean

### Last part

- show the final flow
- explain tradeoffs
- mention next improvements if more time existed

---

## Good Tradeoffs To Mention

- `We chose specialization recommendation instead of full diagnosis because it is safer and more appropriate for telehealth.`
- `We use a constrained specialization list to make the AI output more reliable.`
- `We keep manual selection so the patient is not blocked by AI uncertainty.`
- `We prioritize clarity and safety over trying to make the AI look more powerful than it should be.`

---

## Backup Features

If they redirect you away from this feature, use one of these:

1. `Appointment Booking + Reschedule/Cancel`
2. `Medical Records / Prescription View`
3. `Consultation Status Workflow`
4. `Daily Check-In with Next Best Action`

---

## What To Avoid

Avoid choosing features that are too risky for live collaboration:

- full payment integration
- large admin workflows
- anything requiring too many external services to work perfectly
- overly broad multi-screen tasks

---

## What Evaluators Are Likely Looking For

- how you think through the problem
- how clearly you explain technical decisions
- how you respond to feedback
- how you collaborate in real time
- whether your solution is clean, safe, and well-prioritized

The goal is not to show the biggest feature.

The goal is to show:

`clear thinking, safe product decisions, and clean implementation.`
