export type Locale = "en" | "fil" | "ceb" | "ilo";

export const localeOptions: Array<{ label: string; value: Locale }> = [
  { label: "English", value: "en" },
  { label: "Filipino", value: "fil" },
  { label: "Cebuano", value: "ceb" },
  { label: "Ilocano", value: "ilo" },
];

type RouteStep = {
  code: string;
  copy: string;
  title: string;
};

export type LandingCopy = {
  brandTagline: string;
  nav: {
    consult: string;
    portals: string;
    professionals: string;
    safety: string;
    patientAuth: string;
  };
  hero: {
    kicker: string;
    title: string;
    highlight: string;
    description: string;
    book: string;
    doctorPortal: string;
  };
  appointment: {
    label: string;
    confirmed: string;
    specialty: string;
    available: string;
    scheduleLabel: string;
    scheduleValue: string;
    whereLabel: string;
    whereValue: string;
    concernLabel: string;
    concernValue: string;
    bookedState: string;
    joinState: string;
    readyState: string;
    recordsLabel: string;
    recordsValue: string;
    callLabel: string;
    callValue: string;
    join: string;
  };
  bookingPreview: {
    label: string;
    title: string;
    availableNow: string;
    searchPlaceholder: string;
    specialties: [string, string, string];
    physicianStatus: string;
  };
  featuredDoctors: {
    eyebrow: string;
    title: string;
    description: string;
    available: string;
    reviews: string;
    book: string;
    doctor: { name: string; role: string; nextSlot: string };
  };
  ribbon: string[];
  process: {
    eyebrow: string;
    title: string;
    description: string;
    steps: RouteStep[];
    tags: [string, string, string];
  };
  handoff: {
    eyebrow: string;
    title: string;
  };
  family: {
    eyebrow: string;
    title: string;
    cues: Array<{ text: string; title: string }>;
  };
  patientPortal: {
    eyebrow: string;
    title: string;
    tools: string[];
  };
  doctorPortal: {
    eyebrow: string;
    title: string;
    tools: string[];
  };
  professionals: {
    eyebrow: string;
    title: string;
    description: string;
    steps: [string, string, string];
    cta: string;
    note: string;
  };
  safety: {
    eyebrow: string;
    title: string;
    description: string;
    items: string[];
  };
  footer: {
    label: string;
    emergency: string;
  };
};

export const landingTranslations: Record<Locale, LandingCopy> = {
  en: {
    brandTagline: "Telehealth for the family",
    nav: { consult: "Consult online", portals: "Portals", professionals: "For doctors", safety: "Safety", patientAuth: "Log in" },
    hero: {
      kicker: "Online doctors for Filipino families",
      title: "Care is close.",
      highlight: "Even from home.",
      description:
        "For yourself, your parent, or your child: find the right doctor, book an online consultation, and keep prescriptions and follow-ups in one place.",
      book: "Book a teleconsult",
      doctorPortal: "Apply as a doctor",
    },
    appointment: {
      label: "Mama's teleconsultation",
      confirmed: "Confirmed",
      specialty: "General Medicine",
      available: "Licensed physician / online today",
      scheduleLabel: "Schedule",
      scheduleValue: "Today, 10:30 AM",
      whereLabel: "Where",
      whereValue: "Google Meet session",
      concernLabel: "Concern",
      concernValue: "Fever + BP reading",
      bookedState: "Booked",
      joinState: "Join",
      readyState: "Ready",
      recordsLabel: "Prescription and notes",
      recordsValue: "Saved after consult",
      callLabel: "Online call",
      callValue: "Link ready",
      join: "Join consultation",
    },
    bookingPreview: {
      label: "Online Appointment",
      title: "Find a doctor today",
      availableNow: "Available now",
      searchPlaceholder: "Fever, high blood pressure, pediatric care...",
      specialties: ["General Medicine", "Pediatrics", "Dermatology"],
      physicianStatus: "Online today",
    },
    featuredDoctors: {
      eyebrow: "Featured doctors",
      title: "Meet doctors trusted by families.",
      description:
        "Browse licensed professionals ready for online consultation and follow-up care.",
      available: "Available online",
      reviews: "patient reviews",
      book: "View schedule",
      doctor: { name: "Dr. Maria Santos", role: "Family Medicine", nextSlot: "Today / 10:30 AM" },
    },
    ribbon: ["Licensed doctors", "For your family", "Online consultation", "Prescription and follow-up"],
    process: {
      eyebrow: "How it works",
      title: "Care in three steps.",
      description: "No guessing which doctor your family should consult.",
      steps: [
        { code: "01", title: "Tell us what you feel", copy: "Describe symptoms in English, Filipino, Cebuano, or Ilocano before booking." },
        { code: "02", title: "Choose a doctor", copy: "Get specialty guidance, browse licensed doctors, and see available schedules." },
        { code: "03", title: "Consult online", copy: "Book, join through Google Meet, and return to your prescription and care plan." },
      ],
      tags: ["Intake", "Match", "Meet"],
    },
    handoff: {
      eyebrow: "Patient to doctor handoff",
      title: "One teleconsult, both sides prepared.",
    },
    family: {
      eyebrow: "Family mode",
      title: "You care for them. We help connect them to a doctor.",
      cues: [
        { title: "For Mama", text: "Assist a parent with booking." },
        { title: "From your barangay", text: "See nearby urgent care guidance." },
        { title: "One record", text: "Keep prescriptions and follow-ups." },
      ],
    },
    patientPortal: {
      eyebrow: "Patient / Family Portal",
      title: "Care begins at home.",
      tools: ["Symptom input for you or family", "Doctor match by concern", "Appointments and prescription history", "Follow-up checklist"],
    },
    doctorPortal: {
      eyebrow: "Doctor Workspace",
      title: "More prepared consultations.",
      tools: ["Schedule and unavailable slots", "Prepared patient and family context", "Consult notes and digital prescriptions", "Google Meet teleconsult access"],
    },
    professionals: {
      eyebrow: "For telehealth professionals",
      title: "Bring your practice closer to Filipino families.",
      description:
        "Licensed doctors follow a separate onboarding and verification process before accepting online consultations on Click Klinik.",
      steps: ["Create a professional profile", "Submit credentials and specialization", "Set online availability"],
      cta: "Apply as a doctor",
      note: "Applications are reviewed before doctor profiles go live.",
    },
    safety: {
      eyebrow: "Safe telehealth",
      title: "Guidance first. A doctor provides the medical advice.",
      description:
        "This tool provides guidance only and does not replace professional medical advice. Diagnosis and prescriptions come from licensed doctors after consultation.",
      items: ["Confirmed schedules", "Google Meet session", "Doctor-reviewed care"],
    },
    footer: { label: "Click Klinik / Telehealth for the family", emergency: "For emergencies, go to a hospital immediately." },
  },
  fil: {
    brandTagline: "Telekonsulta para sa pamilya",
    nav: { consult: "Magpakonsulta", portals: "Mga portal", professionals: "Para sa doktor", safety: "Kaligtasan", patientAuth: "Mag-login" },
    hero: {
      kicker: "Doktor online, para sa buong pamilya",
      title: "May alaga.",
      highlight: "Kahit nasa bahay.",
      description:
        "Para sa sarili, kay Mama, o sa anak mo: hanapin ang tamang doktor, mag-book ng online consultation, at itago ang reseta at follow-up sa isang lugar.",
      book: "Mag-book ng telekonsulta",
      doctorPortal: "Mag-apply bilang doktor",
    },
    appointment: {
      label: "Telekonsulta ni Mama",
      confirmed: "Kumpirmado",
      specialty: "Pangkalahatang Medisina",
      available: "Lisensyadong doktor / online ngayon",
      scheduleLabel: "Iskedyul",
      scheduleValue: "Ngayon, 10:30 AM",
      whereLabel: "Saan",
      whereValue: "Google Meet session",
      concernLabel: "Concern",
      concernValue: "Lagnat + BP reading",
      bookedState: "Naka-book",
      joinState: "Sumali",
      readyState: "Handa",
      recordsLabel: "Reseta at notes",
      recordsValue: "Naka-save pagkatapos",
      callLabel: "Online call",
      callValue: "Handa na ang link",
      join: "Sumali sa konsultasyon",
    },
    bookingPreview: {
      label: "Online Appointment",
      title: "Humanap ng doktor ngayon",
      availableNow: "Available ngayon",
      searchPlaceholder: "Lagnat, mataas na BP, pangangalaga sa bata...",
      specialties: ["Pangkalahatang Medisina", "Pediatrics", "Dermatology"],
      physicianStatus: "Online ngayon",
    },
    featuredDoctors: {
      eyebrow: "Mga tampok na doktor",
      title: "Kilalanin ang mga doktor na pinagkakatiwalaan ng pamilya.",
      description:
        "Pumili ng lisensyadong doktor na handa para sa online konsultasyon at follow-up.",
      available: "Online ngayon",
      reviews: "reviews ng pasyente",
      book: "Tingnan ang iskedyul",
      doctor: { name: "Dr. Maria Santos", role: "Family Medicine", nextSlot: "Ngayon / 10:30 AM" },
    },
    ribbon: ["Lisensyadong doktor", "Para sa kapamilya", "Online konsultasyon", "Reseta at follow-up"],
    process: {
      eyebrow: "Paano ito gumagana",
      title: "Alaga sa tatlong hakbang.",
      description: "Hindi kailangang manghula kung anong doktor ang kailangan ng pamilya.",
      steps: [
        { code: "01", title: "Kumusta muna", copy: "Ikuwento ang nararamdaman sa Filipino, English, Cebuano, o Ilocano bago mag-book." },
        { code: "02", title: "Pili ng doktor", copy: "Makakuha ng gabay sa specialty, tumingin ng doktor, at pumili ng iskedyul." },
        { code: "03", title: "Telekonsulta", copy: "Mag-book, sumali sa Google Meet, at balikan ang reseta at care plan." },
      ],
      tags: ["Intake", "Tugma", "Konsulta"],
    },
    handoff: {
      eyebrow: "Mula pasyente tungo sa doktor",
      title: "Isang telekonsulta, parehong handa.",
    },
    family: {
      eyebrow: "Pamilya Mode",
      title: "Ikaw ang bantay. Kami ang daan sa doktor.",
      cues: [
        { title: "Para kay Mama", text: "Tumulong sa booking ng magulang." },
        { title: "Mula barangay", text: "Makakita ng gabay sa malapit na urgent care." },
        { title: "Isang record", text: "Itago ang reseta at follow-up." },
      ],
    },
    patientPortal: {
      eyebrow: "Patient / Pamilya Portal",
      title: "Alaga nagsisimula sa bahay.",
      tools: ["Sintomas para sa sarili o kapamilya", "Doctor match ayon sa concern", "Appointments at kasaysayan ng reseta", "Checklist ng follow-up"],
    },
    doctorPortal: {
      eyebrow: "Workspace ng Doktor",
      title: "Mas handa ang bawat konsultasyon.",
      tools: ["Iskedyul at unavailable slots", "Patient at family context", "Notes at digital na reseta", "Google Meet teleconsult access"],
    },
    professionals: {
      eyebrow: "Para sa mga propesyonal sa kalusugan",
      title: "Ilapit ang inyong serbisyo sa mga pamilyang Pilipino.",
      description:
        "May hiwalay na onboarding at verification ang mga lisensyadong doktor bago makatanggap ng online consultation sa Click Klinik.",
      steps: ["Gumawa ng professional profile", "Isumite ang lisensya at specialization", "Itakda ang online availability"],
      cta: "Mag-apply bilang doktor",
      note: "Sinusuri muna ang aplikasyon bago maging visible ang profile.",
    },
    safety: {
      eyebrow: "Ligtas na telekonsulta",
      title: "Gabay muna. Doktor pa rin ang nagbibigay ng payong medikal.",
      description:
        "Ang tool na ito ay nagbibigay lamang ng gabay at hindi kapalit ng propesyonal na payong medikal. Ang diagnosis at reseta ay mula sa lisensyadong doktor pagkatapos ng konsultasyon.",
      items: ["Kumpirmadong iskedyul", "Google Meet session", "Sinuri ng doktor"],
    },
    footer: { label: "Click Klinik / Telekonsulta para sa pamilya", emergency: "Sa emergency, pumunta agad sa ospital." },
  },
  ceb: {
    brandTagline: "Telekonsulta para sa pamilya",
    nav: { consult: "Konsulta online", portals: "Mga portal", professionals: "Para sa doktor", safety: "Kaluwasan", patientAuth: "Log in" },
    hero: {
      kicker: "Online nga doktor para sa pamilyang Pilipino",
      title: "Duol ang pag-atiman.",
      highlight: "Bisan naa sa balay.",
      description:
        "Para nimo, kang Mama, o sa imong anak: pangitaa ang hustong doktor, pag-book og online consultation, ug tipigi ang reseta ug follow-up sa usa ka lugar.",
      book: "Mag-book og telekonsulta",
      doctorPortal: "Mag-apply isip doktor",
    },
    appointment: {
      label: "Telekonsulta ni Mama",
      confirmed: "Kumpirmado",
      specialty: "General Medicine",
      available: "Lisensyadong doktor / online karon",
      scheduleLabel: "Eskedyul",
      scheduleValue: "Karon, 10:30 AM",
      whereLabel: "Asa",
      whereValue: "Google Meet session",
      concernLabel: "Gibati",
      concernValue: "Hilanat + BP reading",
      bookedState: "Na-book",
      joinState: "Apil",
      readyState: "Andam",
      recordsLabel: "Reseta ug notes",
      recordsValue: "Matipigan human sa consult",
      callLabel: "Online call",
      callValue: "Andam na ang link",
      join: "Apil sa konsultasyon",
    },
    bookingPreview: {
      label: "Online Appointment",
      title: "Pangita og doktor karon",
      availableNow: "Available karon",
      searchPlaceholder: "Hilanat, taas nga BP, pediatric care...",
      specialties: ["General Medicine", "Pediatrics", "Dermatology"],
      physicianStatus: "Online karon",
    },
    featuredDoctors: {
      eyebrow: "Piniling mga doktor",
      title: "Ilaila ang mga doktor nga gisaligan sa pamilya.",
      description:
        "Pili og lisensyadong doktor nga andam para sa online consultation ug follow-up.",
      available: "Online karon",
      reviews: "reviews sa pasyente",
      book: "Tan-awa ang eskedyul",
      doctor: { name: "Dr. Maria Santos", role: "Family Medicine", nextSlot: "Karon / 10:30 AM" },
    },
    ribbon: ["Lisensyadong doktor", "Para sa pamilya", "Online konsultasyon", "Reseta ug follow-up"],
    process: {
      eyebrow: "Giunsa paggamit",
      title: "Pag-atiman sa tulo ka lakang.",
      description: "Dili na kinahanglan magtag-an unsang doktor ang angay konsultahon.",
      steps: [
        { code: "01", title: "Isulti ang gibati", copy: "Isaysay ang sintomas sa Cebuano, Filipino, English, o Ilocano una mag-book." },
        { code: "02", title: "Pili og doktor", copy: "Dawata ang giya sa specialty, tan-awa ang mga doktor, ug pili og eskedyul." },
        { code: "03", title: "Telekonsulta", copy: "Pag-book, apil sa Google Meet, ug tan-awa balik ang reseta ug care plan." },
      ],
      tags: ["Intake", "Tugma", "Konsulta"],
    },
    handoff: {
      eyebrow: "Gikan sa pasyente ngadto sa doktor",
      title: "Usa ka telekonsulta, parehong andam.",
    },
    family: {
      eyebrow: "Pamilya Mode",
      title: "Ikaw ang nag-atiman. Kami ang motabang makakonekta sa doktor.",
      cues: [
        { title: "Para kang Mama", text: "Tabangi ang ginikanan sa pag-book." },
        { title: "Gikan sa barangay", text: "Makakita og giya para sa duol nga urgent care." },
        { title: "Usa ka record", text: "Tipigi ang reseta ug follow-up." },
      ],
    },
    patientPortal: {
      eyebrow: "Patient / Pamilya Portal",
      title: "Ang pag-atiman magsugod sa balay.",
      tools: ["Sintomas para nimo o pamilya", "Doctor match sumala sa gibati", "Appointments ug kasaysayan sa reseta", "Checklist sa follow-up"],
    },
    doctorPortal: {
      eyebrow: "Workspace sa Doktor",
      title: "Mas andam ang konsultasyon.",
      tools: ["Eskedyul ug unavailable slots", "Patient ug family context", "Notes ug digital nga reseta", "Google Meet teleconsult access"],
    },
    professionals: {
      eyebrow: "Para sa mga propesyonal sa panglawas",
      title: "Iduol ang imong serbisyo sa mga pamilyang Pilipino.",
      description:
        "Lahi ang onboarding ug verification sa mga lisensyadong doktor una sila makadawat og online consultation sa Click Klinik.",
      steps: ["Paghimo og professional profile", "Isumite ang lisensya ug specialization", "Itakda ang online availability"],
      cta: "Mag-apply isip doktor",
      note: "Susihon ang aplikasyon una mahimong makita ang profile.",
    },
    safety: {
      eyebrow: "Luwas nga telekonsulta",
      title: "Giya una. Doktor gihapon ang mohatag og medikal nga tambag.",
      description:
        "Kini nga tool naghatag lamang og giya ug dili mopuli sa propesyonal nga medikal nga tambag. Ang diagnosis ug reseta gikan sa lisensyadong doktor human sa konsultasyon.",
      items: ["Kumpirmadong eskedyul", "Google Meet session", "Girepaso sa doktor"],
    },
    footer: { label: "Click Klinik / Telekonsulta para sa pamilya", emergency: "Sa emerhensiya, adto dayon sa ospital." },
  },
  ilo: {
    brandTagline: "Telekonsulta para iti pamilya",
    nav: { consult: "Agpakonsulta online", portals: "Dagiti portal", professionals: "Para iti doktor", safety: "Talged", patientAuth: "Ag-login" },
    hero: {
      kicker: "Online a doktor para kadagiti pamilyang Pilipino",
      title: "Asideg ti pannakaaywan.",
      highlight: "Uray adda iti balay.",
      description:
        "Para kenka, ken Mama, wenno iti anakmo: sapulen ti umiso a doktor, ag-book iti online consultation, ken idulin dagiti reseta ken follow-up iti maymaysa a lugar.",
      book: "Ag-book iti telekonsulta",
      doctorPortal: "Ag-apply a kas doktor",
    },
    appointment: {
      label: "Telekonsulta ni Mama",
      confirmed: "Nakumpirma",
      specialty: "General Medicine",
      available: "Lisensiado a doktor / online ita",
      scheduleLabel: "Oras",
      scheduleValue: "Ita, 10:30 AM",
      whereLabel: "Sadino",
      whereValue: "Google Meet session",
      concernLabel: "Marikna",
      concernValue: "Gurigor + BP reading",
      bookedState: "Na-book",
      joinState: "Sumrek",
      readyState: "Nakasagana",
      recordsLabel: "Reseta ken notes",
      recordsValue: "Maidulin kalpasan ti consult",
      callLabel: "Online call",
      callValue: "Nakasagana ti link",
      join: "Sumrek iti konsultasion",
    },
    bookingPreview: {
      label: "Online Appointment",
      title: "Agsapul iti doktor ita",
      availableNow: "Available ita",
      searchPlaceholder: "Gurigor, nangato a BP, pediatric care...",
      specialties: ["General Medicine", "Pediatrics", "Dermatology"],
      physicianStatus: "Online ita",
    },
    featuredDoctors: {
      eyebrow: "Napili a doktor",
      title: "Am-ammoen dagiti doktor a pagtalekan ti pamilya.",
      description:
        "Agpili iti lisensiado a doktor a nakasagana iti online consultation ken follow-up.",
      available: "Online ita",
      reviews: "reviews dagiti pasyente",
      book: "Kitaen ti oras",
      doctor: { name: "Dr. Maria Santos", role: "Family Medicine", nextSlot: "Ita / 10:30 AM" },
    },
    ribbon: ["Lisensiado a doktor", "Para iti pamilya", "Online konsultasion", "Reseta ken follow-up"],
    process: {
      eyebrow: "Kasano nga agusar",
      title: "Pannakaaywan iti tallo a tukad.",
      description: "Saanen a masapul a pattapattaen no ania a doktor ti kasapulan.",
      steps: [
        { code: "01", title: "Ibaga ti mariknam", copy: "Ibaga dagiti sintomas iti Ilocano, Filipino, English, wenno Cebuano sakbay nga ag-book." },
        { code: "02", title: "Agpili iti doktor", copy: "Umawat iti giya ti specialty, kitaen dagiti doktor, ken agpili iti oras." },
        { code: "03", title: "Telekonsulta", copy: "Ag-book, sumrek iti Google Meet, ken kitaen manen ti reseta ken care plan." },
      ],
      tags: ["Intake", "Tugma", "Konsulta"],
    },
    handoff: {
      eyebrow: "Manipud pasyente agingga iti doktor",
      title: "Maymaysa a telekonsulta, agpada a nakasagana.",
    },
    family: {
      eyebrow: "Pamilya Mode",
      title: "Sika ti mangaywan. Tulongandaka a makadanon iti doktor.",
      cues: [
        { title: "Para ken Mama", text: "Tulongan ti nagannak nga ag-book." },
        { title: "Manipud barangay", text: "Kitaen ti giya para iti asideg nga urgent care." },
        { title: "Maymaysa a record", text: "Idulin ti reseta ken follow-up." },
      ],
    },
    patientPortal: {
      eyebrow: "Patient / Pamilya Portal",
      title: "Ti pannakaaywan ket mangrugi iti balay.",
      tools: ["Sintomas para kenka wenno pamilya", "Doctor match sigun iti marikna", "Appointments ken pakasaritaan ti reseta", "Checklist ti follow-up"],
    },
    doctorPortal: {
      eyebrow: "Workspace ti Doktor",
      title: "Nakasagana ti tunggal konsultasion.",
      tools: ["Oras ken unavailable slots", "Patient ken family context", "Notes ken digital a reseta", "Google Meet teleconsult access"],
    },
    professionals: {
      eyebrow: "Para kadagiti propesional iti salun-at",
      title: "Iyasideg ti serbisiom kadagiti pamilyang Pilipino.",
      description:
        "Adda bukod nga onboarding ken verification dagiti lisensiado a doktor sakbay nga umawat iti online consultation iti Click Klinik.",
      steps: ["Mangaramid iti professional profile", "Isumite ti lisensia ken specialization", "Ikeddeng ti online availability"],
      cta: "Ag-apply a kas doktor",
      note: "Masukimat ti aplikasyon sakbay a makita ti profile.",
    },
    safety: {
      eyebrow: "Natalged a telekonsulta",
      title: "Giya pay laeng. Ti doktor ti mangted iti medikal a balakad.",
      description:
        "Daytoy a tool ket mangted laeng iti giya ken saan a mangsukat iti propesyonal a medikal a balakad. Ti diagnosis ken reseta ket aggapu iti lisensiado a doktor kalpasan ti konsultasion.",
      items: ["Nakumpirma nga oras", "Google Meet session", "Sinukimat ti doktor"],
    },
    footer: { label: "Click Klinik / Telekonsulta para iti pamilya", emergency: "No emerhensia, mapan a dagus iti ospital." },
  },
};
