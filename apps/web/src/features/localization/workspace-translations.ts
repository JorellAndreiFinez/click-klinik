import type { Locale } from "./translations";

export type WorkspaceCopy = {
  shared: {
    patientAccount: string;
    doctorAccount: string;
    collapse: string;
    logout: string;
    patientNav: {
      home: string;
      findCare: string;
      appointments: string;
      records: string;
      monitoring: string;
      profile: string;
    };
    doctorNav: {
      home: string;
      records: string;
      availability: string;
      calendar: string;
      notes: string;
      session: string;
      profile: string;
    };
  };
  patientHome: {
    eyebrow: string;
    title: string;
    description: string;
    glance: string;
    active: string;
    records: string;
    logs: string;
    findDoctor: string;
    findDoctorCopy: string;
    appointments: string;
    appointmentsCopy: (count: number) => string;
    myRecords: string;
    myRecordsCopy: (count: number) => string;
    concernTitle: string;
    concernCopy: string;
    concernPlaceholder: string;
    concernButton: string;
    latestRecord: string;
    latestRecordButton: string;
    noRecord: string;
    nextConsult: string;
    nextConsultEmpty: string;
    openConsult: string;
    openAppointments: string;
    monitoringTitle: string;
    monitoringCopy: string;
    monitoringButton: string;
    guidanceOnly: string;
    latestBp: string;
    temperature: string;
    oxygen: string;
    notLogged: string;
    careSummary: string;
    mobile: string;
    allergies: string;
    conditions: string;
    emergencyContact: string;
    noneReported: string;
    notAdded: string;
    doctorPacket: string;
    doctorNote: string;
    prescription: string;
    certificate: string;
    quickLinks: string;
    viewAppointments: string;
    viewRecords: string;
    privacyNotice: string;
    recordReady: string;
  };
  doctorHome: {
    eyebrow: string;
    title: (name: string) => string;
    activeConsults: string;
    openSlots: string;
    patients: string;
    doctorEarnings: string;
    nextStep: string;
    upcomingConsultation: string;
    prepareSchedule: string;
    noActiveSession: string;
    patient: string;
    date: string;
    time: string;
    addAvailability: string;
    openClinicRoute: string;
    openSession: string;
    availability: string;
    calendar: string;
    clinicWallet: string;
    walletCopy: string;
    grossPaid: string;
    clinicFee: string;
    pendingPayout: string;
    paidOut: string;
    claiming: string;
    sendViaXendit: (amount: string) => string;
    noPayout: string;
    payoutSent: string;
    quickActions: string;
    medicalRecords: string;
    notesPrescriptions: string;
    consultRoom: string;
    recentBookings: string;
    nextPatients: string;
    noRecentBookings: string;
    payouts: string;
    consultationEarnings: string;
    totalRows: (count: number) => string;
    viewAll: string;
    payoutEmpty: string;
    patientHeader: string;
    grossHeader: string;
    feeHeader: string;
    payoutHeader: string;
    statusHeader: string;
    noReference: string;
  };
};

export const workspaceTranslations: Record<Locale, WorkspaceCopy> = {
  en: {
    shared: {
      patientAccount: "Patient account",
      doctorAccount: "Doctor account",
      collapse: "Collapse",
      logout: "Log out",
      patientNav: {
        home: "Home",
        findCare: "Find care",
        appointments: "Appointments",
        records: "Records",
        monitoring: "Monitoring",
        profile: "Profile",
      },
      doctorNav: {
        home: "Home",
        records: "Records",
        availability: "Availability",
        calendar: "Calendar",
        notes: "Notes & Rx",
        session: "Session",
        profile: "Profile",
      },
    },
    patientHome: {
      eyebrow: "Patient care center",
      title: "Your care journey is ready.",
      description:
        "Find the right doctor, prepare your health details, attend your consult, and keep prescriptions in one calm dashboard.",
      glance: "Today at a glance",
      active: "Active",
      records: "Records",
      logs: "Logs",
      findDoctor: "Find a doctor",
      findDoctorCopy: "Search by symptoms or specialization",
      appointments: "My appointments",
      appointmentsCopy: (count) =>
        `${count} active consultation${count === 1 ? "" : "s"}`,
      myRecords: "My records",
      myRecordsCopy: (count) =>
        count
          ? `${count} doctor record${count === 1 ? "" : "s"} received`
          : "Notes and prescriptions",
      concernTitle: "Tell us your concern",
      concernCopy: "We will help match you with a relevant doctor type.",
      concernPlaceholder: "Example: cough, dizziness, skin rash, hypertension",
      concernButton: "Find matched doctors",
      latestRecord: "Latest doctor record",
      latestRecordButton: "Open records",
      noRecord: "No doctor record yet.",
      nextConsult: "Next consultation",
      nextConsultEmpty: "No active appointment yet.",
      openConsult: "Open consult",
      openAppointments: "Open appointments",
      monitoringTitle: "Health monitoring",
      monitoringCopy: "Track your latest logs and let AI summarize patterns safely.",
      monitoringButton: "Open monitoring",
      guidanceOnly: "Guidance only. For emergencies, go to the nearest hospital.",
      latestBp: "Latest BP",
      temperature: "Temperature",
      oxygen: "Oxygen",
      notLogged: "Not logged",
      careSummary: "Care summary",
      mobile: "Mobile",
      allergies: "Allergies",
      conditions: "Conditions",
      emergencyContact: "Emergency contact",
      noneReported: "None reported",
      notAdded: "Not added",
      doctorPacket: "Doctor packet",
      doctorNote: "Doctor note",
      prescription: "Prescription",
      certificate: "Certificate",
      quickLinks: "Quick links",
      viewAppointments: "View appointments",
      viewRecords: "View records",
      privacyNotice: "Privacy notice",
      recordReady: "A doctor record is ready for review.",
    },
    doctorHome: {
      eyebrow: "Doctor workspace",
      title: (name) => `Good day, ${name}`,
      activeConsults: "Active consults",
      openSlots: "Open slots",
      patients: "Patients",
      doctorEarnings: "Doctor earnings",
      nextStep: "Next step",
      upcomingConsultation: "Upcoming consultation",
      prepareSchedule: "Prepare your schedule",
      noActiveSession: "No active session",
      patient: "Patient",
      date: "Date",
      time: "Time",
      addAvailability: "Add your weekly availability so patients can book consultations.",
      openClinicRoute: "Open clinic route",
      openSession: "Open session",
      availability: "Availability",
      calendar: "Calendar",
      clinicWallet: "Clinic wallet",
      walletCopy: "available to claim from paid online consults",
      grossPaid: "Gross paid",
      clinicFee: "Click Klinik fee",
      pendingPayout: "Pending payout",
      paidOut: "Already paid out",
      claiming: "Claiming...",
      sendViaXendit: (amount) => `Send ${amount} via Xendit test`,
      noPayout: "No payout available",
      payoutSent: "Xendit test payout sent to the clinic wallet.",
      quickActions: "Quick actions",
      medicalRecords: "Medical records",
      notesPrescriptions: "Notes & prescriptions",
      consultRoom: "Consult room",
      recentBookings: "Recent bookings",
      nextPatients: "Next patients in queue",
      noRecentBookings: "No active patient bookings yet.",
      payouts: "Payouts",
      consultationEarnings: "Consultation earnings",
      totalRows: (count) => `${count} total row${count === 1 ? "" : "s"}`,
      viewAll: "View all",
      payoutEmpty: "No payout records yet. Paid Xendit consultations will appear here.",
      patientHeader: "Patient",
      grossHeader: "Gross",
      feeHeader: "Click Klinik fee",
      payoutHeader: "Doctor payout",
      statusHeader: "Status",
      noReference: "No reference",
    },
  },
  fil: {
    shared: {
      patientAccount: "Patient account",
      doctorAccount: "Doctor account",
      collapse: "Itupi",
      logout: "Mag-log out",
      patientNav: {
        home: "Home",
        findCare: "Humanap ng alaga",
        appointments: "Appointments",
        records: "Records",
        monitoring: "Monitoring",
        profile: "Profile",
      },
      doctorNav: {
        home: "Home",
        records: "Records",
        availability: "Availability",
        calendar: "Calendar",
        notes: "Notes at Rx",
        session: "Session",
        profile: "Profile",
      },
    },
    patientHome: {
      eyebrow: "Sentro ng pangangalaga",
      title: "Handa na ang care journey mo.",
      description:
        "Hanapin ang tamang doktor, ihanda ang health details, dumalo sa konsultasyon, at itago ang mga reseta sa isang mahinahong dashboard.",
      glance: "Mabilis na tingin ngayong araw",
      active: "Aktibo",
      records: "Records",
      logs: "Logs",
      findDoctor: "Humanap ng doktor",
      findDoctorCopy: "Maghanap ayon sa sintomas o specialization",
      appointments: "Aking appointments",
      appointmentsCopy: (count) =>
        `${count} aktibong konsultasyon${count === 1 ? "" : "s"}`,
      myRecords: "Aking records",
      myRecordsCopy: (count) =>
        count
          ? `${count} record mula sa doktor`
          : "Notes at mga reseta",
      concernTitle: "Ikwento ang concern mo",
      concernCopy: "Tutulungan ka naming maitugma sa tamang uri ng doktor.",
      concernPlaceholder: "Halimbawa: ubo, hilo, pantal sa balat, altapresyon",
      concernButton: "Hanapin ang tamang doktor",
      latestRecord: "Pinakabagong record ng doktor",
      latestRecordButton: "Buksan ang records",
      noRecord: "Wala pang doctor record.",
      nextConsult: "Susunod na konsultasyon",
      nextConsultEmpty: "Wala pang aktibong appointment.",
      openConsult: "Buksan ang consult",
      openAppointments: "Buksan ang appointments",
      monitoringTitle: "Health monitoring",
      monitoringCopy: "Tingnan ang latest logs at ligtas na AI summary ng patterns.",
      monitoringButton: "Buksan ang monitoring",
      guidanceOnly: "Gabay lamang ito. Kapag emergency, pumunta agad sa pinakamalapit na ospital.",
      latestBp: "Pinakabagong BP",
      temperature: "Temperatura",
      oxygen: "Oxygen",
      notLogged: "Wala pang log",
      careSummary: "Buod ng pangangalaga",
      mobile: "Mobile",
      allergies: "Allergies",
      conditions: "Mga kondisyon",
      emergencyContact: "Emergency contact",
      noneReported: "Walang naiulat",
      notAdded: "Hindi pa nalalagay",
      doctorPacket: "Doctor packet",
      doctorNote: "Doctor note",
      prescription: "Prescription",
      certificate: "Certificate",
      quickLinks: "Quick links",
      viewAppointments: "Buksan ang appointments",
      viewRecords: "Buksan ang records",
      privacyNotice: "Paunawa sa privacy",
      recordReady: "May handa nang doctor record para sa iyo.",
    },
    doctorHome: {
      eyebrow: "Doctor workspace",
      title: (name) => `Magandang araw, ${name}`,
      activeConsults: "Aktibong consults",
      openSlots: "Bukas na slots",
      patients: "Mga pasyente",
      doctorEarnings: "Kita ng doktor",
      nextStep: "Susunod na hakbang",
      upcomingConsultation: "Susunod na konsultasyon",
      prepareSchedule: "Ihanda ang schedule mo",
      noActiveSession: "Walang aktibong session",
      patient: "Pasyente",
      date: "Petsa",
      time: "Oras",
      addAvailability: "Idagdag ang lingguhang availability para makapag-book ang mga pasyente.",
      openClinicRoute: "Buksan ang ruta sa klinika",
      openSession: "Buksan ang session",
      availability: "Availability",
      calendar: "Calendar",
      clinicWallet: "Clinic wallet",
      walletCopy: "maaaring i-claim mula sa bayad na online consults",
      grossPaid: "Kabuuang bayad",
      clinicFee: "Click Klinik fee",
      pendingPayout: "Pending payout",
      paidOut: "Naipadala na",
      claiming: "Kina-claim...",
      sendViaXendit: (amount) => `Ipadala ang ${amount} sa Xendit test`,
      noPayout: "Walang available na payout",
      payoutSent: "Naipadala na ang Xendit test payout sa clinic wallet.",
      quickActions: "Quick actions",
      medicalRecords: "Medical records",
      notesPrescriptions: "Notes at prescriptions",
      consultRoom: "Consult room",
      recentBookings: "Mga bagong booking",
      nextPatients: "Susunod na mga pasyente",
      noRecentBookings: "Wala pang aktibong patient booking.",
      payouts: "Payouts",
      consultationEarnings: "Kita kada konsultasyon",
      totalRows: (count) => `${count} kabuuang row`,
      viewAll: "Tingnan lahat",
      payoutEmpty: "Wala pang payout records. Lalabas dito ang mga bayad na konsultasyon sa Xendit.",
      patientHeader: "Pasyente",
      grossHeader: "Kabuuan",
      feeHeader: "Click Klinik fee",
      payoutHeader: "Payout ng doktor",
      statusHeader: "Status",
      noReference: "Walang reference",
    },
  },
  ceb: {
    shared: {
      patientAccount: "Patient account",
      doctorAccount: "Doctor account",
      collapse: "Pihit",
      logout: "Log out",
      patientNav: {
        home: "Home",
        findCare: "Pangita ug care",
        appointments: "Appointments",
        records: "Records",
        monitoring: "Monitoring",
        profile: "Profile",
      },
      doctorNav: {
        home: "Home",
        records: "Records",
        availability: "Availability",
        calendar: "Calendar",
        notes: "Notes ug Rx",
        session: "Session",
        profile: "Profile",
      },
    },
    patientHome: {
      eyebrow: "Patient care center",
      title: "Andam na ang imong care journey.",
      description:
        "Pangitaa ang hustong doktor, andama ang health details, apil sa konsultasyon, ug tipigi ang reseta sa usa ka malinawon nga dashboard.",
      glance: "Tan-aw dayon karon",
      active: "Aktibo",
      records: "Records",
      logs: "Logs",
      findDoctor: "Pangita doktor",
      findDoctorCopy: "Pangitaa pinaagi sa sintomas o specialization",
      appointments: "Akong appointments",
      appointmentsCopy: (count) =>
        `${count} ka aktibong konsultasyon`,
      myRecords: "Akong records",
      myRecordsCopy: (count) =>
        count ? `${count} ka doctor record` : "Notes ug reseta",
      concernTitle: "Isulti ang imong concern",
      concernCopy: "Tabangan ka namo sa pagpares sa husto nga doktor.",
      concernPlaceholder: "Pananglitan: ubo, hilo, hubag sa panit, hypertension",
      concernButton: "Pangitaa ang bagay nga doktor",
      latestRecord: "Pinakabag-o nga doctor record",
      latestRecordButton: "Ablihi ang records",
      noRecord: "Wala pay doctor record.",
      nextConsult: "Sunod nga konsultasyon",
      nextConsultEmpty: "Wala pay aktibong appointment.",
      openConsult: "Ablihi ang consult",
      openAppointments: "Ablihi ang appointments",
      monitoringTitle: "Health monitoring",
      monitoringCopy: "Tan-awa ang latest logs ug luwas nga AI summary sa patterns.",
      monitoringButton: "Ablihi ang monitoring",
      guidanceOnly: "Giya lang kini. Kung emergency, adto dayon sa pinakaduol nga ospital.",
      latestBp: "Latest BP",
      temperature: "Temperatura",
      oxygen: "Oxygen",
      notLogged: "Wala pay log",
      careSummary: "Care summary",
      mobile: "Mobile",
      allergies: "Allergies",
      conditions: "Mga kondisyon",
      emergencyContact: "Emergency contact",
      noneReported: "Walay na-report",
      notAdded: "Wala pa na-add",
      doctorPacket: "Doctor packet",
      doctorNote: "Doctor note",
      prescription: "Prescription",
      certificate: "Certificate",
      quickLinks: "Quick links",
      viewAppointments: "Ablihi ang appointments",
      viewRecords: "Ablihi ang records",
      privacyNotice: "Privacy notice",
      recordReady: "Aduna nay doctor record nga andam tan-awon.",
    },
    doctorHome: {
      eyebrow: "Doctor workspace",
      title: (name) => `Maayong adlaw, ${name}`,
      activeConsults: "Aktibong consults",
      openSlots: "Abli nga slots",
      patients: "Patients",
      doctorEarnings: "Kinitaan sa doktor",
      nextStep: "Sunod nga lakang",
      upcomingConsultation: "Sunod nga konsultasyon",
      prepareSchedule: "Andama ang imong schedule",
      noActiveSession: "Walay aktibong session",
      patient: "Pasyente",
      date: "Petsa",
      time: "Oras",
      addAvailability: "Ibutang ang imong weekly availability aron makabook ang mga pasyente.",
      openClinicRoute: "Ablihi ang ruta sa klinika",
      openSession: "Ablihi ang session",
      availability: "Availability",
      calendar: "Calendar",
      clinicWallet: "Clinic wallet",
      walletCopy: "pwede na ma-claim gikan sa bayad nga online consults",
      grossPaid: "Total nga bayad",
      clinicFee: "Click Klinik fee",
      pendingPayout: "Pending payout",
      paidOut: "Nabayran na",
      claiming: "Gina-claim...",
      sendViaXendit: (amount) => `Ipadala ang ${amount} sa Xendit test`,
      noPayout: "Walay payout karon",
      payoutSent: "Naipadala na ang Xendit test payout sa clinic wallet.",
      quickActions: "Quick actions",
      medicalRecords: "Medical records",
      notesPrescriptions: "Notes ug prescriptions",
      consultRoom: "Consult room",
      recentBookings: "Bag-ong bookings",
      nextPatients: "Sunod nga mga pasyente",
      noRecentBookings: "Wala pay aktibong booking sa pasyente.",
      payouts: "Payouts",
      consultationEarnings: "Kinitaan kada konsultasyon",
      totalRows: (count) => `${count} ka total row`,
      viewAll: "Tan-awa tanan",
      payoutEmpty: "Wala pay payout records. Ang mga nabayrang Xendit consults makita dinhi.",
      patientHeader: "Pasyente",
      grossHeader: "Gross",
      feeHeader: "Click Klinik fee",
      payoutHeader: "Doctor payout",
      statusHeader: "Status",
      noReference: "Walay reference",
    },
  },
  ilo: {
    shared: {
      patientAccount: "Patient account",
      doctorAccount: "Doctor account",
      collapse: "Ipis",
      logout: "Ag-log out",
      patientNav: {
        home: "Home",
        findCare: "Agsapul iti care",
        appointments: "Appointments",
        records: "Records",
        monitoring: "Monitoring",
        profile: "Profile",
      },
      doctorNav: {
        home: "Home",
        records: "Records",
        availability: "Availability",
        calendar: "Calendar",
        notes: "Notes ken Rx",
        session: "Session",
        profile: "Profile",
      },
    },
    patientHome: {
      eyebrow: "Patient care center",
      title: "Nakaisagana ti care journey mo.",
      description:
        "Sapulen ti umno a doktor, isagana dagiti health details, uminnayon iti konsultasyon, ken idulin dagiti reseta iti maysa a natalna a dashboard.",
      glance: "Napardas a panangkit ita aldaw",
      active: "Aktibo",
      records: "Records",
      logs: "Logs",
      findDoctor: "Agsapul iti doktor",
      findDoctorCopy: "Agsapul babaen kadagiti sintomas wenno specialization",
      appointments: "Appointments ko",
      appointmentsCopy: (count) =>
        `${count} aktibo a konsultasyon`,
      myRecords: "Records ko",
      myRecordsCopy: (count) =>
        count ? `${count} a doctor record` : "Notes ken reseta",
      concernTitle: "Ibaga ti concern mo",
      concernCopy: "Tulungan ka a maipares iti umno a kita ti doktor.",
      concernPlaceholder: "Kas pagarigan: ubo, pannakailiw, rashes, hypertension",
      concernButton: "Agsapul iti maitutop a doktor",
      latestRecord: "Kaudian a doctor record",
      latestRecordButton: "Lukatan ti records",
      noRecord: "Awan pay doctor record.",
      nextConsult: "Sumaruno a konsultasyon",
      nextConsultEmpty: "Awan pay aktibo a appointment.",
      openConsult: "Lukatan ti consult",
      openAppointments: "Lukatan ti appointments",
      monitoringTitle: "Health monitoring",
      monitoringCopy: "Kitaen dagiti latest logs ken natalged nga AI summary dagiti patterns.",
      monitoringButton: "Lukatan ti monitoring",
      guidanceOnly: "Gabay laeng daytoy. No emergency, mapan dagus iti kaasidegan nga ospital.",
      latestBp: "Kaudian a BP",
      temperature: "Temperatura",
      oxygen: "Oxygen",
      notLogged: "Awan pay log",
      careSummary: "Buod ti care",
      mobile: "Mobile",
      allergies: "Allergies",
      conditions: "Kondisyon",
      emergencyContact: "Emergency contact",
      noneReported: "Awan naireport",
      notAdded: "Awan pay naidugang",
      doctorPacket: "Doctor packet",
      doctorNote: "Doctor note",
      prescription: "Prescription",
      certificate: "Certificate",
      quickLinks: "Quick links",
      viewAppointments: "Lukatan ti appointments",
      viewRecords: "Lukatan ti records",
      privacyNotice: "Pakaammo iti privacy",
      recordReady: "Adda nakasagana a doctor record para kenka.",
    },
    doctorHome: {
      eyebrow: "Doctor workspace",
      title: (name) => `Naimbag nga aldaw, ${name}`,
      activeConsults: "Aktibo a consults",
      openSlots: "Nalukatan a slots",
      patients: "Patients",
      doctorEarnings: "Ganansia ti doktor",
      nextStep: "Sumaruno a tawid",
      upcomingConsultation: "Sumaruno a konsultasyon",
      prepareSchedule: "Isagana ti schedule mo",
      noActiveSession: "Awan aktibo a session",
      patient: "Pasyente",
      date: "Petsa",
      time: "Oras",
      addAvailability: "Iyanam ti weekly availability tapno makapag-book dagiti pasyente.",
      openClinicRoute: "Lukatan ti ruta iti klinika",
      openSession: "Lukatan ti session",
      availability: "Availability",
      calendar: "Calendar",
      clinicWallet: "Clinic wallet",
      walletCopy: "mabalin a ma-claim manipud kadagiti nabayadan nga online consults",
      grossPaid: "Amin a bayad",
      clinicFee: "Click Klinik fee",
      pendingPayout: "Pending payout",
      paidOut: "Nabayadan",
      claiming: "I-claim...",
      sendViaXendit: (amount) => `Ipaawit ti ${amount} iti Xendit test`,
      noPayout: "Awan payout ita",
      payoutSent: "Naipatulod ti Xendit test payout iti clinic wallet.",
      quickActions: "Quick actions",
      medicalRecords: "Medical records",
      notesPrescriptions: "Notes ken prescriptions",
      consultRoom: "Consult room",
      recentBookings: "Baro a bookings",
      nextPatients: "Sumaruno a pasyente",
      noRecentBookings: "Awan pay aktibo a booking ti pasyente.",
      payouts: "Payouts",
      consultationEarnings: "Ganansia kada konsultasyon",
      totalRows: (count) => `${count} total a row`,
      viewAll: "Kitaen amin",
      payoutEmpty: "Awan pay payout records. Makita ditoy dagiti nabayadan nga Xendit consults.",
      patientHeader: "Pasyente",
      grossHeader: "Gross",
      feeHeader: "Click Klinik fee",
      payoutHeader: "Payout ti doktor",
      statusHeader: "Status",
      noReference: "Awan reference",
    },
  },
};
