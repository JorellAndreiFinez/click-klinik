import type { Locale } from "./translations";

export type DashboardPageTranslations = {
  patientDoctors: {
    eyebrow: string;
    title: string;
    description: string;
    filters: string;
    yourLocation: string;
    searchDoctor: string;
    symptom: string;
    askAi: string;
    matchingDoctors: string;
    specialization: string;
    reset: string;
    results: string;
    availableDoctors: string;
    aiRecommendation: string;
    relatedTypes: string;
    loadingDoctors: string;
    noMatches: string;
    nextSlots: string;
    viewAvailability: string;
    hideAvailability: string;
    bookConsult: string;
    availability: string;
    noUpcomingSlots: string;
  };
  patientAppointments: {
    eyebrow: string;
    title: string;
    description: string;
    quickStatus: string;
    upcoming: string;
    paid: string;
    needsPay: string;
    calendarFilter: string;
    thisDay: string;
    allDates: string;
    search: string;
    searchPlaceholder: string;
    consultationStatus: string;
    payment: string;
    sortBy: string;
    allStatuses: string;
    upcomingOnly: string;
    allPayments: string;
    calendar: string;
    summary: string;
    noConsultation: string;
    emptySlot: string;
    join: string;
    cancel: string;
    calendarInvite: string;
    completeTestPayment: string;
    alreadyPaid: string;
    receipt: string;
  };
  patientMonitoring: {
    eyebrow: string;
    title: string;
    description: string;
    currentSnapshot: string;
    noLogsYet: string;
    start: string;
    firstReading: string;
    addReading: string;
    notes: string;
    save: string;
    saving: string;
    timeline: string;
    recentLogs: string;
    noLogs: string;
  };
  patientProfile: {
    eyebrow: string;
    title: string;
    description: string;
    personal: string;
    health: string;
    location: string;
    email: string;
    firstName: string;
    lastName: string;
    suffix: string;
    mobile: string;
    birthday: string;
    sex: string;
    weight: string;
    height: string;
    emergencyContact: string;
    emergencyNumber: string;
    allergies: string;
    conditions: string;
    medications: string;
    basicHistory: string;
    noSavedLocation: string;
    currentSavedLocation: string;
    save: string;
    saving: string;
    female: string;
    male: string;
    preferNot: string;
  };
  patientRecords: {
    eyebrow: string;
    title: string;
    description: string;
    privacyProtected: string;
    privacyCopy: string;
    doctorNotes: string;
    prescriptions: string;
    certificates: string;
    findDocument: string;
    filterCopy: string;
    searchPlaceholder: string;
    all: string;
    notes: string;
    rx: string;
    latestVisit: string;
    loadingRecords: string;
    noMatch: string;
    patientPacket: string;
    prescriptionPdf: string;
    certificatePdf: string;
    reminderTitle: string;
    reminderCopy: string;
    medicalCertificate: string;
  };
  patientBooking: {
    eyebrow: string;
    triageTitle: string;
    bookWith: (lastName: string) => string;
    chooseSlotTitle: string;
    triageDescription: string;
    bookingDescription: string;
    availableDates: string;
    previousMonth: string;
    nextMonth: string;
    available: string;
    doctorOff: string;
    requiredIntake: string;
    appointmentDetails: string;
    triageBeforePayment: string;
    reviewFee: string;
    paymentPlan: string;
    payNow: string;
    payNowCopy: string;
    payLater: string;
    payLaterCopy: string;
    bookingSummary: string;
    backToDoctors: string;
    continueCheckout: string;
    confirmBooking: string;
    preparing: string;
    completeTriageFirst: string;
  };
  doctorRecords: {
    eyebrow: string;
    title: string;
    description: string;
    linkedPatients: string;
    linkedPatientsCopy: string;
    searchPlaceholder: string;
    noPatients: string;
    loading: string;
    opening: string;
    appointmentHistory: string;
    consultationNotes: string;
    prescriptionHistory: string;
    accessReminder: string;
    accessReminderCopy: string;
  };
  doctorSchedule: {
    eyebrow: string;
    title: string;
    description: string;
    howItWorks: string;
    weeklyPattern: string;
    weeklyAvailability: string;
    save: string;
    saving: string;
    currentSetup: string;
    openDays: string;
    available: string;
    off: string;
    noOpenDays: string;
    scheduleRule: string;
    scheduleRuleCopy: string;
    start: string;
    end: string;
    morning: string;
    afternoon: string;
    wholeDay: string;
  };
  doctorSession: {
    eyebrow: string;
    titleWaiting: string;
    titleOpen: (patientName: string) => string;
    description: string;
    queue: string;
    queueCopy: string;
    active: string;
    noActive: string;
    openSession: string;
    markCompleted: string;
    currentSession: string;
    patientDetails: string;
    checklist: string;
    schedule: string;
    safetyFallback: string;
  };
  doctorProfile: {
    eyebrow: string;
    title: string;
    description: string;
    professional: string;
    publicProfile: string;
    location: string;
    professionalEmail: string;
    firstName: string;
    lastName: string;
    suffix: string;
    mobile: string;
    prc: string;
    years: string;
    specializationCode: string;
    specializationName: string;
    clinic: string;
    bio: string;
    showPublic: string;
    locationCopy: string;
    noSavedLocation: string;
    currentSavedLocation: string;
    clinicMapPin: string;
    clinicMapPinCopy: string;
    save: string;
    saving: string;
  };
  doctorCalendar: {
    eyebrow: string;
    title: string;
    description: string;
    quickStatus: string;
    upcoming: string;
    paid: string;
    needsNote: string;
    calendarDate: string;
    searchPlaceholder: string;
    patientEmailStatus: string;
    noConsultation: string;
    emptySlot: string;
    join: string;
    complete: string;
    notes: string;
    viewAll: string;
  };
};

export const dashboardPageTranslations: Record<Locale, DashboardPageTranslations> = {
  en: {
    patientDoctors: {
      eyebrow: "Find care",
      title: "Search for a doctor",
      description: "Choose a specialization or describe your concern. We will show approved doctors you can book online.",
      filters: "Filters",
      yourLocation: "Your location",
      searchDoctor: "Search doctor",
      symptom: "Medical need / symptom",
      askAi: "Ask AI to match doctors",
      matchingDoctors: "Matching doctors...",
      specialization: "Specialization",
      reset: "Reset filters",
      results: "Results",
      availableDoctors: "Available doctors",
      aiRecommendation: "AI recommendation",
      relatedTypes: "Related doctor types",
      loadingDoctors: "Loading available doctors...",
      noMatches: "No matching doctors found. Try another symptom, keyword, or specialization.",
      nextSlots: "Next available slots",
      viewAvailability: "View availability",
      hideAvailability: "Hide availability",
      bookConsult: "Book consult",
      availability: "Availability",
      noUpcomingSlots: "No upcoming available slots yet for this doctor.",
    },
    patientAppointments: {
      eyebrow: "Appointments",
      title: "Your consultations",
      description: "Search, filter, pay, cancel, and join your online consultations from one calendar-style view.",
      quickStatus: "Quick status",
      upcoming: "Upcoming",
      paid: "Paid",
      needsPay: "Needs pay",
      calendarFilter: "Calendar filter",
      thisDay: "This day",
      allDates: "All dates",
      search: "Search",
      searchPlaceholder: "Doctor, location, status",
      consultationStatus: "Consultation status",
      payment: "Payment",
      sortBy: "Sort by",
      allStatuses: "All statuses",
      upcomingOnly: "Upcoming only",
      allPayments: "All payments",
      calendar: "Calendar",
      summary: "Summary",
      noConsultation: "No consultation",
      emptySlot: "Empty 30-minute slot",
      join: "Join",
      cancel: "Cancel",
      calendarInvite: "Calendar invite",
      completeTestPayment: "Complete test payment",
      alreadyPaid: "I already paid",
      receipt: "Receipt",
    },
    patientMonitoring: {
      eyebrow: "Home monitoring",
      title: "Track readings doctors can review.",
      description: "Log BP, glucose, temperature, oxygen, pulse, and weight. The system summarizes whether readings look stable, changed, or need attention.",
      currentSnapshot: "Current snapshot",
      noLogsYet: "No logs yet",
      start: "Start",
      firstReading: "Save your first home reading to generate a monitoring summary.",
      addReading: "Add reading",
      notes: "Notes",
      save: "Save monitoring log",
      saving: "Saving...",
      timeline: "Timeline",
      recentLogs: "Recent home logs",
      noLogs: "No monitoring logs yet. Add your first reading above.",
    },
    patientProfile: {
      eyebrow: "Profile",
      title: "Your patient information",
      description: "Update the details doctors use to prepare safer teleconsultations. Email is read-only.",
      personal: "Personal details",
      health: "Health details",
      location: "Location",
      email: "Email",
      firstName: "First name",
      lastName: "Last name",
      suffix: "Suffix",
      mobile: "Mobile number",
      birthday: "Birthday",
      sex: "Sex",
      weight: "Weight (kg)",
      height: "Height (cm)",
      emergencyContact: "Emergency contact",
      emergencyNumber: "Emergency number",
      allergies: "Allergies",
      conditions: "Existing conditions",
      medications: "Current medications",
      basicHistory: "Basic medical history",
      noSavedLocation: "No saved location found yet. Please choose your Philippine address, then save your profile so doctors can match care near your area.",
      currentSavedLocation: "Current saved location:",
      save: "Save profile",
      saving: "Saving...",
      female: "Female",
      male: "Male",
      preferNot: "Prefer not to say",
    },
    patientRecords: {
      eyebrow: "Records library",
      title: "Your doctor-issued health documents.",
      description: "Open consultation notes, prescriptions, certificates, and visit history in a format that feels like a real patient folder.",
      privacyProtected: "Privacy protected",
      privacyCopy: "Only notes shared for patients are shown here.",
      doctorNotes: "Doctor notes",
      prescriptions: "Prescriptions",
      certificates: "Certificates",
      findDocument: "Find a document",
      filterCopy: "Search or filter by the kind of document you need today.",
      searchPlaceholder: "Search doctor, medicine, note",
      all: "All",
      notes: "Notes",
      rx: "Rx",
      latestVisit: "Latest visit",
      loadingRecords: "Loading your records...",
      noMatch: "No matching record found. Try another keyword or filter.",
      patientPacket: "Patient document packet",
      prescriptionPdf: "Prescription PDF",
      certificatePdf: "Certificate PDF",
      reminderTitle: "Easy reminder",
      reminderCopy: "Follow your doctor's instructions. If symptoms become severe or urgent, contact emergency services or go to the nearest hospital.",
      medicalCertificate: "Medical certificate",
    },
    patientBooking: {
      eyebrow: "Book appointment",
      triageTitle: "Complete triage first",
      bookWith: (lastName) => `Book with Dr. ${lastName}`,
      chooseSlotTitle: "Choose a time slot",
      triageDescription: "Answer a short intake form so the doctor can prepare before your teleconsultation.",
      bookingDescription: "Pick one available 30-minute slot, review the fee, then confirm your teleconsultation.",
      availableDates: "Available dates",
      previousMonth: "Previous month",
      nextMonth: "Next month",
      available: "Available",
      doctorOff: "Doctor off",
      requiredIntake: "Required intake",
      appointmentDetails: "Appointment details",
      triageBeforePayment: "Complete your 3-step triage before choosing payment",
      reviewFee: "Review the consultation fee before creating the calendar invite",
      paymentPlan: "Payment plan",
      payNow: "Pay now with Xendit",
      payNowCopy: "You have 6 hours to complete payment or the booking is released.",
      payLater: "Pay later with Xendit",
      payLaterCopy: "Reserve the schedule now and settle the Xendit checkout after consultation.",
      bookingSummary: "Booking summary",
      backToDoctors: "Back to doctors",
      continueCheckout: "Continue to test checkout",
      confirmBooking: "Confirm booking",
      preparing: "Preparing consultation...",
      completeTriageFirst: "Complete triage first",
    },
    doctorRecords: {
      eyebrow: "Medical records",
      title: "Review patient charts.",
      description: "Open triage, visit history, shared notes, prescriptions, and certificates from one place.",
      linkedPatients: "Linked patients",
      linkedPatientsCopy: "patient profiles connected to your consultations",
      searchPlaceholder: "Search patient, concern, or email",
      noPatients: "No matching patients found.",
      loading: "Loading patient records...",
      opening: "Opening patient chart...",
      appointmentHistory: "Appointment history",
      consultationNotes: "Consultation notes",
      prescriptionHistory: "Prescription history",
      accessReminder: "Access reminder",
      accessReminderCopy: "Public consultation history and prescriptions can help with continuity of care. Private notes remain visible only to the doctor who authored them.",
    },
    doctorSchedule: {
      eyebrow: "Availability",
      title: "Set recurring clinic hours.",
      description: "Choose open days and consultation hours. This weekly pattern repeats automatically for future bookings.",
      howItWorks: "How it works",
      weeklyPattern: "Weekly pattern",
      weeklyAvailability: "Weekly availability",
      save: "Save weekly pattern",
      saving: "Saving...",
      currentSetup: "Current setup",
      openDays: "Open consultation days",
      available: "Available",
      off: "Off",
      noOpenDays: "No consultation days are open yet. Turn on availability for at least one weekday.",
      scheduleRule: "Schedule rule",
      scheduleRuleCopy: "Day-specific preview editing was removed here to avoid duplicate and inconsistent periods. Booking calendars will use this weekly pattern automatically.",
      start: "Start",
      end: "End",
      morning: "Morning",
      afternoon: "Afternoon",
      wholeDay: "Whole day",
    },
    doctorSession: {
      eyebrow: "Consult room",
      titleWaiting: "Waiting for a booked consultation",
      titleOpen: (patientName) => `Open session for ${patientName}`,
      description: "Join the consultation, keep patient context visible, then finish with notes and prescriptions.",
      queue: "Patient queue",
      queueCopy: "Pick the consultation you want to open or complete.",
      active: "active",
      noActive: "No active patient sessions yet.",
      openSession: "Open session",
      markCompleted: "Mark completed",
      currentSession: "Current session",
      patientDetails: "Patient details",
      checklist: "Pre-consult checklist",
      schedule: "Schedule",
      safetyFallback: "Safety fallback",
    },
    doctorProfile: {
      eyebrow: "Profile",
      title: "Your doctor information",
      description: "Update your public doctor details and clinic information. Email is read-only.",
      professional: "Professional details",
      publicProfile: "Public profile",
      location: "Location",
      professionalEmail: "Professional email",
      firstName: "First name",
      lastName: "Last name",
      suffix: "Suffix",
      mobile: "Mobile number",
      prc: "PRC license number",
      years: "Years of practice",
      specializationCode: "Specialization code",
      specializationName: "Specialization name",
      clinic: "Clinic or hospital",
      bio: "Bio",
      showPublic: "Show my profile on public doctor search",
      locationCopy: "Select your clinic location using the official Philippine PSGC address list. NCR will automatically skip province selection.",
      noSavedLocation: "No saved clinic location found yet. Please choose your Philippine clinic address, then save your profile.",
      currentSavedLocation: "Current saved clinic location:",
      clinicMapPin: "Clinic map pin",
      clinicMapPinCopy: "Pin the exact clinic or hospital entrance so physical-visit patients can open directions.",
      save: "Save profile",
      saving: "Saving...",
    },
    doctorCalendar: {
      eyebrow: "Doctor calendar",
      title: "Consultation queue",
      description: "Review the day in 30-minute rows, join sessions, and complete consultations from one focused board.",
      quickStatus: "Quick status",
      upcoming: "Upcoming",
      paid: "Paid",
      needsNote: "Needs note",
      calendarDate: "Calendar date",
      searchPlaceholder: "Patient, email, status",
      patientEmailStatus: "Patient, email, status",
      noConsultation: "No consultation",
      emptySlot: "Empty 30-minute slot",
      join: "Join",
      complete: "Complete",
      notes: "Notes",
      viewAll: "View all",
    },
  },
  fil: {} as DashboardPageTranslations,
  ceb: {} as DashboardPageTranslations,
  ilo: {} as DashboardPageTranslations,
};

dashboardPageTranslations.fil = {
  ...dashboardPageTranslations.en,
  patientDoctors: {
    ...dashboardPageTranslations.en.patientDoctors,
    title: "Maghanap ng doktor",
    description: "Pumili ng specialization o ilarawan ang concern. Ipapakita namin ang mga aprubadong doktor na puwedeng i-book online.",
    filters: "Mga filter",
    yourLocation: "Lokasyon mo",
    searchDoctor: "Hanapin ang doktor",
    symptom: "Pangangailangan / sintomas",
    askAi: "Ipatugma sa AI ang doktor",
    matchingDoctors: "Nagtutugma ng doktor...",
    reset: "I-reset ang filter",
    results: "Mga resulta",
    availableDoctors: "Available na mga doktor",
    viewAvailability: "Tingnan ang availability",
    hideAvailability: "Itago ang availability",
    bookConsult: "Mag-book ng consult",
    noUpcomingSlots: "Wala pang susunod na available slot para sa doktor na ito.",
  },
  patientAppointments: {
    ...dashboardPageTranslations.en.patientAppointments,
    title: "Iyong mga konsultasyon",
    description: "Maghanap, mag-filter, magbayad, mag-cancel, at sumali sa online consultations mo mula sa isang calendar-style view.",
    quickStatus: "Mabilis na status",
    upcoming: "Paparating",
    needsPay: "May bayarin",
    calendarFilter: "Calendar filter",
    thisDay: "Araw na ito",
    allDates: "Lahat ng petsa",
    search: "Hanapin",
    consultationStatus: "Status ng konsultasyon",
    sortBy: "Ayusin ayon sa",
    summary: "Buod",
    join: "Sumali",
    cancel: "Kanselahin",
    calendarInvite: "Calendar invite",
    completeTestPayment: "Tapusin ang test payment",
    alreadyPaid: "Bayad na ako",
    receipt: "Resibo",
  },
  patientMonitoring: {
    ...dashboardPageTranslations.en.patientMonitoring,
    title: "I-track ang readings na makikita ng doktor.",
    description: "Mag-log ng BP, glucose, temperatura, oxygen, pulso, at timbang. Binubuod ng system kung mukhang stable, nagbago, o kailangan ng pansin ang readings.",
    currentSnapshot: "Kasalukuyang buod",
    addReading: "Magdagdag ng reading",
    notes: "Mga tala",
    save: "I-save ang monitoring log",
    timeline: "Timeline",
    recentLogs: "Mga bagong home log",
  },
  patientProfile: {
    ...dashboardPageTranslations.en.patientProfile,
    title: "Iyong impormasyon bilang pasyente",
    description: "I-update ang mga detalye na ginagamit ng mga doktor para sa mas ligtas na teleconsultation. Read-only ang email.",
    personal: "Personal na detalye",
    health: "Health details",
    location: "Lokasyon",
    save: "I-save ang profile",
    saving: "Sine-save...",
    noSavedLocation: "Wala pang naka-save na lokasyon. Piliin ang Philippine address mo at i-save ang profile para mas maitugma ka sa mga doktor na malapit sa iyo.",
    currentSavedLocation: "Kasalukuyang naka-save na lokasyon:",
  },
  patientRecords: {
    ...dashboardPageTranslations.en.patientRecords,
    title: "Mga health document mula sa doktor.",
    description: "Buksan ang consultation notes, prescriptions, certificates, at visit history sa isang ayos na parang totoong patient folder.",
    privacyProtected: "Protektado ang privacy",
    findDocument: "Maghanap ng dokumento",
    filterCopy: "Maghanap o mag-filter ayon sa dokumentong kailangan mo ngayon.",
    latestVisit: "Pinakabagong consult",
    patientPacket: "Patient document packet",
    prescriptionPdf: "Prescription PDF",
    certificatePdf: "Certificate PDF",
  },
  patientBooking: {
    ...dashboardPageTranslations.en.patientBooking,
    eyebrow: "Mag-book ng appointment",
    triageTitle: "Tapusin muna ang triage",
    bookWith: (lastName) => `Mag-book kay Dr. ${lastName}`,
    chooseSlotTitle: "Pumili ng oras",
    triageDescription: "Sagutan ang maikling intake form para makapaghanda ang doktor bago ang teleconsultation.",
    bookingDescription: "Pumili ng available na 30-minute slot, i-review ang bayad, at i-confirm ang teleconsultation.",
    availableDates: "Mga available na petsa",
    requiredIntake: "Kailangang intake",
    appointmentDetails: "Detalye ng appointment",
    paymentPlan: "Paraan ng bayad",
    bookingSummary: "Buod ng booking",
    backToDoctors: "Bumalik sa mga doktor",
    continueCheckout: "Magpatuloy sa test checkout",
    confirmBooking: "I-confirm ang booking",
    preparing: "Inihahanda ang konsultasyon...",
  },
  doctorRecords: {
    ...dashboardPageTranslations.en.doctorRecords,
    title: "Suriin ang patient charts.",
    description: "Buksan ang triage, visit history, shared notes, prescriptions, at certificates sa iisang lugar.",
    linkedPatients: "Naka-link na pasyente",
    searchPlaceholder: "Hanapin ang pasyente, concern, o email",
    noPatients: "Walang katugmang pasyente.",
  },
  doctorSchedule: {
    ...dashboardPageTranslations.en.doctorSchedule,
    title: "Itakda ang umuulit na clinic hours.",
    description: "Pumili ng open days at consultation hours. Uulit ang weekly pattern na ito sa mga susunod na booking.",
    howItWorks: "Paano ito gumagana",
    weeklyAvailability: "Lingguhang availability",
    save: "I-save ang weekly pattern",
    saving: "Sine-save...",
    openDays: "Mga bukas na araw ng consult",
  },
  doctorSession: {
    ...dashboardPageTranslations.en.doctorSession,
    eyebrow: "Consult room",
    titleWaiting: "Naghihintay ng naka-book na konsultasyon",
    titleOpen: (patientName) => `Buksan ang session para kay ${patientName}`,
    description: "Sumali sa konsultasyon, panatilihing kita ang patient context, at tapusin gamit ang notes at prescriptions.",
    queue: "Patient queue",
    queueCopy: "Piliin ang konsultasyong bubuksan o tatapusin mo.",
    noActive: "Wala pang aktibong patient session.",
    markCompleted: "Markahan bilang completed",
    currentSession: "Kasalukuyang session",
    patientDetails: "Detalye ng pasyente",
    checklist: "Checklist bago ang consult",
    safetyFallback: "Safety fallback",
  },
  doctorProfile: {
    ...dashboardPageTranslations.en.doctorProfile,
    title: "Iyong impormasyon bilang doktor",
    description: "I-update ang public doctor details at clinic information mo. Read-only ang email.",
    professional: "Professional na detalye",
    publicProfile: "Public profile",
    save: "I-save ang profile",
    saving: "Sine-save...",
  },
  doctorCalendar: {
    ...dashboardPageTranslations.en.doctorCalendar,
    title: "Consultation queue",
    description: "Suriin ang araw sa 30-minute rows, sumali sa sessions, at tapusin ang consultations mula sa iisang board.",
    quickStatus: "Mabilis na status",
    needsNote: "Kulang sa note",
    calendarDate: "Petsa sa kalendaryo",
    join: "Sumali",
    complete: "Tapusin",
    notes: "Mga tala",
  },
};

dashboardPageTranslations.ceb = {
  ...dashboardPageTranslations.en,
};

dashboardPageTranslations.ilo = {
  ...dashboardPageTranslations.en,
};
