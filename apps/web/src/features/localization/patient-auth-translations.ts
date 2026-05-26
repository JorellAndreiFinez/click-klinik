import type { Locale } from "./translations";

export type PatientLoginCopy = {
  brandTagline: string;
  back: string;
  eyebrow: string;
  title: string;
  description: string;
  chooseRole: string;
  patientRole: string;
  patientRoleDescription: string;
  doctorRole: string;
  doctorRoleDescription: string;
  roleSafety: string;
  mobileBanner: string;
  sideEyebrow: string;
  sideTitle: string;
  sideDescription: string;
  sideJourney: string;
  trustItems: [string, string, string];
  safety: string;
  email: string;
  password: string;
  passwordPlaceholder: string;
  showPassword: string;
  hidePassword: string;
  remember: string;
  forgot: string;
  submit: string;
  doctorSubmit: string;
  submitting: string;
  welcome: string;
  sessionReady: string;
  returnHome: string;
  noAccount: string;
  createPrompt: string;
  createAccount: string;
  doctorQuestion: string;
  doctorPrompt: string;
  professionalApplication: string;
  success: string;
  doctorSuccess: string;
  invalidCredentials: string;
  tooManyRequests: string;
  authError: string;
};

export type PatientSignupCopy = {
  login: string;
  eyebrow: string;
  title: string;
  description: string;
  sideEyebrow: string;
  sideTitle: string;
  sideDescription: string;
  safety: string;
  guideItems: [string, string, string];
  steps: [string, string, string];
  google: string;
  emailDivider: string;
  fullName: string;
  email: string;
  password: string;
  passwordPlaceholder: string;
  passwordHint: string;
  showPassword: string;
  hidePassword: string;
  continueMobile: string;
  creating: string;
  existingAccount: string;
  mobileDemo: string;
  mobileLabel: string;
  mobilePlaceholder: string;
  sendCode: string;
  requesting: string;
  accountReady: string;
  greeting: string;
  readyDescription: string;
  continueLogin: string;
  createdNotice: string;
  expiredError: string;
  invalidPhone: string;
  profileTitle: string;
  profileDescription: string;
  birthday: string;
  sex: string;
  female: string;
  male: string;
  preferNotToSay: string;
  weight: string;
  height: string;
  emergencyName: string;
  emergencyNumber: string;
  allergies: string;
  conditions: string;
  medications: string;
  medicalHistory: string;
  listHint: string;
  privacyConsent: string;
  healthConsent: string;
  aiConsent: string;
  privacyLink: string;
  saveProfile: string;
  savingProfile: string;
  profileRequired: string;
  emailUsed: string;
  popupClosed: string;
  tooManyRequests: string;
  onboardingError: string;
};

type PatientAuthCopy = {
  login: PatientLoginCopy;
  signup: PatientSignupCopy;
};

export const patientAuthTranslations: Record<Locale, PatientAuthCopy> = {
  en: {
    login: {
      brandTagline: "Telehealth for the family",
      back: "Back",
      eyebrow: "Secure login",
      title: "Welcome back",
      description: "Choose your account type before signing in.",
      chooseRole: "I am signing in as",
      patientRole: "Patient",
      patientRoleDescription: "Appointments and care records",
      doctorRole: "Doctor",
      doctorRoleDescription: "Schedules and consultations",
      roleSafety: "Doctor access is available only for approved professional accounts.",
      mobileBanner: "Teleconsult care for you and your family.",
      sideEyebrow: "For patients and families",
      sideTitle: "Filipino care, even online.",
      sideDescription: "From your first concern to a licensed doctor consultation, your family health journey stays organized and close to home.",
      sideJourney: "Part of your care journey",
      trustItems: ["Registered patient contact", "Private prescription records", "Online care for family members"],
      safety: "This tool provides guidance only and does not replace professional medical advice.",
      email: "Email address",
      password: "Password",
      passwordPlaceholder: "Enter password",
      showPassword: "Show password",
      hidePassword: "Hide password",
      remember: "Remember me",
      forgot: "Forgot password?",
      submit: "Log in to patient portal",
      doctorSubmit: "Log in to doctor workspace",
      submitting: "Signing in...",
      welcome: "Welcome",
      sessionReady: "Your patient portal session is ready.",
      returnHome: "Return to home",
      noAccount: "No patient account yet?",
      createPrompt: "Create an account and add your mobile number to begin.",
      createAccount: "Create patient account",
      doctorQuestion: "Are you a doctor?",
      doctorPrompt: "New professional? Complete verification before receiving patient consultations.",
      professionalApplication: "Professional application",
      success: "Welcome back. Your patient account is signed in.",
      doctorSuccess: "Signed in. Doctor workspace access requires an approved professional account.",
      invalidCredentials: "Email or password is incorrect.",
      tooManyRequests: "Too many attempts. Please try again later.",
      authError: "Authentication could not be completed. Please try again.",
    },
    signup: {
      login: "Log in",
      eyebrow: "Patient onboarding",
      title: "Create your care account",
      description: "For you or a family member: create an account, then add a contact number.",
      sideEyebrow: "New patient",
      sideTitle: "Start safely.",
      sideDescription: "A secure account helps protect appointment and prescription access.",
      safety: "Contact numbers are collected for care coordination and are not identity verification.",
      guideItems: ["Create account", "Add mobile", "Start care journey"],
      steps: ["Account", "Mobile", "Ready"],
      google: "Sign up with Google",
      emailDivider: "or use email",
      fullName: "Full name",
      email: "Email address",
      password: "Create password",
      passwordPlaceholder: "Create password",
      passwordHint: "Use at least 8 characters to help protect health records.",
      showPassword: "Show password",
      hidePassword: "Hide password",
      continueMobile: "Continue to contact number",
      creating: "Creating account...",
      existingAccount: "Already have an account?",
      mobileDemo: "For this MVP, your number is saved as a care contact and checked for duplicates. No SMS verification is sent.",
      mobileLabel: "Philippine mobile number",
      mobilePlaceholder: "917 123 4567",
      sendCode: "Continue to health profile",
      requesting: "Checking number...",
      accountReady: "Account ready",
      greeting: "Welcome",
      readyDescription: "Your patient account is ready for consultation booking.",
      continueLogin: "Open patient portal",
      createdNotice: "Account created. Add a mobile number to finish patient onboarding.",
      expiredError: "Your onboarding session expired. Please create your account again.",
      invalidPhone: "Enter a valid Philippine mobile number, for example 917 123 4567.",
      profileTitle: "Complete your health profile",
      profileDescription: "Only collect details needed to prepare safe teleconsultations.",
      birthday: "Birthday",
      sex: "Sex",
      female: "Female",
      male: "Male",
      preferNotToSay: "Prefer not to say",
      weight: "Weight (kg)",
      height: "Height (cm)",
      emergencyName: "Emergency contact name",
      emergencyNumber: "Emergency contact number",
      allergies: "Allergies",
      conditions: "Existing conditions",
      medications: "Current medications",
      medicalHistory: "Basic medical history",
      listHint: "Separate multiple items with commas.",
      privacyConsent: "I have read the Privacy Notice and consent to storing my profile for telehealth care.",
      healthConsent: "I consent to processing my health information for consultation and care coordination.",
      aiConsent: "I consent to AI-assisted summaries for doctor review only (optional).",
      privacyLink: "Read Privacy Notice",
      saveProfile: "Complete patient onboarding",
      savingProfile: "Saving securely...",
      profileRequired: "Please accept the required privacy and health-data consents.",
      emailUsed: "This email already has an account. Please log in instead.",
      popupClosed: "Google sign-up was closed before it finished.",
      tooManyRequests: "Too many attempts. Please try again later.",
      onboardingError: "Onboarding could not be completed. Please try again.",
    },
  },
  fil: {
    login: {
      brandTagline: "Telekonsulta para sa pamilya",
      back: "Bumalik",
      eyebrow: "Ligtas na login",
      title: "Maligayang pagbabalik",
      description: "Piliin muna ang uri ng iyong account bago mag-login.",
      chooseRole: "Ako ay magla-login bilang",
      patientRole: "Pasyente",
      patientRoleDescription: "Appointment at care records",
      doctorRole: "Doktor",
      doctorRoleDescription: "Iskedyul at konsultasyon",
      roleSafety: "Para lamang sa aprubadong professional accounts ang doctor access.",
      mobileBanner: "Telekonsulta para sa iyo at sa iyong pamilya.",
      sideEyebrow: "Para sa pasyente at pamilya",
      sideTitle: "Alagang Pilipino, kahit online.",
      sideDescription: "Mula unang concern hanggang konsultasyon sa lisensyadong doktor, maayos at malapit sa bahay ang alaga ng pamilya.",
      sideJourney: "Kasama sa care journey",
      trustItems: ["Nakarehistrong contact ng pasyente", "Pribadong records ng reseta", "Online alaga para sa pamilya"],
      safety: "Ang tool na ito ay nagbibigay lamang ng gabay at hindi kapalit ng propesyonal na payong medikal.",
      email: "Email address",
      password: "Password",
      passwordPlaceholder: "Ilagay ang password",
      showPassword: "Ipakita ang password",
      hidePassword: "Itago ang password",
      remember: "Tandaan ako",
      forgot: "Nakalimutan ang password?",
      submit: "Mag-login sa patient portal",
      doctorSubmit: "Mag-login sa workspace ng doktor",
      submitting: "Nagla-login...",
      welcome: "Mabuhay",
      sessionReady: "Handa na ang iyong patient portal session.",
      returnHome: "Bumalik sa home",
      noAccount: "Wala ka pang patient account?",
      createPrompt: "Gumawa ng account at idagdag ang mobile number para magsimula.",
      createAccount: "Gumawa ng patient account",
      doctorQuestion: "Doktor ka ba?",
      doctorPrompt: "Bagong propesyonal? Kumpletuhin muna ang verification bago tumanggap ng konsultasyon.",
      professionalApplication: "Application ng propesyonal",
      success: "Maligayang pagbabalik. Naka-login na ang iyong patient account.",
      doctorSuccess: "Naka-login na. Kailangan ng aprubadong professional account para sa doctor workspace.",
      invalidCredentials: "Mali ang email o password.",
      tooManyRequests: "Masyadong maraming pagtatangka. Subukan muli mamaya.",
      authError: "Hindi natapos ang login. Subukan muli.",
    },
    signup: {
      login: "Mag-login",
      eyebrow: "Patient onboarding",
      title: "Gumawa ng care account",
      description: "Para sa iyo o kapamilya: gumawa ng account, pagkatapos ay idagdag ang contact number.",
      sideEyebrow: "Bagong pasyente",
      sideTitle: "Magsimula nang ligtas.",
      sideDescription: "Tumutulong ang secure account na protektahan ang appointments at access sa reseta.",
      safety: "Ang contact number ay para sa care coordination at hindi pagpapatunay ng pagkakakilanlan.",
      guideItems: ["Gumawa ng account", "Idagdag ang mobile", "Simulan ang alaga"],
      steps: ["Account", "Mobile", "Handa"],
      google: "Mag-sign up gamit ang Google",
      emailDivider: "o gumamit ng email",
      fullName: "Buong pangalan",
      email: "Email address",
      password: "Gumawa ng password",
      passwordPlaceholder: "Gumawa ng password",
      passwordHint: "Gumamit ng hindi bababa sa 8 character para protektahan ang health records.",
      showPassword: "Ipakita ang password",
      hidePassword: "Itago ang password",
      continueMobile: "Magpatuloy sa contact number",
      creating: "Ginagawa ang account...",
      existingAccount: "May account ka na?",
      mobileDemo: "Para sa MVP, ise-save ang numero bilang care contact at iche-check kung gamit na. Walang SMS verification.",
      mobileLabel: "Philippine mobile number",
      mobilePlaceholder: "917 123 4567",
      sendCode: "Magpatuloy sa health profile",
      requesting: "Tinitingnan ang numero...",
      accountReady: "Handa na ang account",
      greeting: "Maligayang pagdating",
      readyDescription: "Handa na ang iyong patient account para sa consultation booking.",
      continueLogin: "Buksan ang patient portal",
      createdNotice: "Nagawa na ang account. Idagdag ang mobile number para matapos ang patient onboarding.",
      expiredError: "Nag-expire ang onboarding session. Gumawa muli ng account.",
      invalidPhone: "Maglagay ng wastong Philippine mobile number, halimbawa 917 123 4567.",
      profileTitle: "Kumpletuhin ang health profile",
      profileDescription: "Kinokolekta lamang ang detalye na kailangan para sa ligtas na telekonsulta.",
      birthday: "Birthday",
      sex: "Kasarian",
      female: "Babae",
      male: "Lalaki",
      preferNotToSay: "Mas gustong hindi sabihin",
      weight: "Timbang (kg)",
      height: "Taas (cm)",
      emergencyName: "Pangalan ng emergency contact",
      emergencyNumber: "Numero ng emergency contact",
      allergies: "Allergies",
      conditions: "Kasalukuyang kondisyon",
      medications: "Kasalukuyang gamot",
      medicalHistory: "Pangunahing medical history",
      listHint: "Paghiwalayin gamit ang kuwit kung higit sa isa.",
      privacyConsent: "Nabasa ko ang Privacy Notice at pumapayag akong itago ang aking profile para sa telehealth care.",
      healthConsent: "Pumapayag ako sa pagproseso ng health information para sa konsultasyon at care coordination.",
      aiConsent: "Pumapayag ako sa AI-assisted summary para lamang sa pag-review ng doktor (opsyonal).",
      privacyLink: "Basahin ang Privacy Notice",
      saveProfile: "Tapusin ang patient onboarding",
      savingProfile: "Ligtas na sine-save...",
      profileRequired: "Pumayag sa kinakailangang privacy at health-data consents.",
      emailUsed: "May account na ang email na ito. Mag-login na lamang.",
      popupClosed: "Isinara ang Google sign-up bago ito natapos.",
      tooManyRequests: "Masyadong maraming pagtatangka. Subukan muli mamaya.",
      onboardingError: "Hindi natapos ang onboarding. Subukan muli.",
    },
  },
  ceb: {
    login: {
      brandTagline: "Telekonsulta para sa pamilya",
      back: "Balik",
      eyebrow: "Luwas nga login",
      title: "Maayong pagbalik",
      description: "Pilia una ang tipo sa imong account sa dili pa mag-login.",
      chooseRole: "Mo-login ko isip",
      patientRole: "Pasyente",
      patientRoleDescription: "Appointment ug care records",
      doctorRole: "Doktor",
      doctorRoleDescription: "Eskedyul ug konsultasyon",
      roleSafety: "Para lamang sa aprobahan nga professional accounts ang doctor access.",
      mobileBanner: "Telekonsulta para nimo ug sa imong pamilya.",
      sideEyebrow: "Para sa pasyente ug pamilya",
      sideTitle: "Pag-atiman nga Pilipino, bisan online.",
      sideDescription: "Gikan sa unang kabalaka hangtod sa konsultasyon sa lisensyadong doktor, organisado ug duol sa balay ang pag-atiman.",
      sideJourney: "Apil sa care journey",
      trustItems: ["Narehistrong contact sa pasyente", "Pribadong rekord sa reseta", "Online nga pag-atiman sa pamilya"],
      safety: "Kini nga tool naghatag lamang og giya ug dili mopuli sa propesyonal nga medikal nga tambag.",
      email: "Email address",
      password: "Password",
      passwordPlaceholder: "Isulod ang password",
      showPassword: "Ipakita ang password",
      hidePassword: "Tagoa ang password",
      remember: "Hinumdomi ko",
      forgot: "Nakalimot sa password?",
      submit: "Log in sa patient portal",
      doctorSubmit: "Log in sa workspace sa doktor",
      submitting: "Nag-login...",
      welcome: "Maayong pag-abot",
      sessionReady: "Andam na ang imong patient portal session.",
      returnHome: "Balik sa home",
      noAccount: "Wala pa kay patient account?",
      createPrompt: "Paghimo og account ug idugang ang mobile number aron makasugod.",
      createAccount: "Paghimo og patient account",
      doctorQuestion: "Doktor ka ba?",
      doctorPrompt: "Bag-ong professional? Kompletoha una ang verification sa dili pa modawat og konsultasyon.",
      professionalApplication: "Professional application",
      success: "Maayong pagbalik. Naka-login na ang imong patient account.",
      doctorSuccess: "Naka-login na. Kinahanglan og aprobahan nga professional account para sa doctor workspace.",
      invalidCredentials: "Sayop ang email o password.",
      tooManyRequests: "Daghan kaayong pagsulay. Sulayi pag-usab unya.",
      authError: "Wala makompleto ang login. Sulayi pag-usab.",
    },
    signup: {
      login: "Log in",
      eyebrow: "Patient onboarding",
      title: "Paghimo sa imong care account",
      description: "Para nimo o kapamilya: paghimo og account, dayon idugang ang contact number.",
      sideEyebrow: "Bag-ong pasyente",
      sideTitle: "Sugdi nga luwas.",
      sideDescription: "Ang secure account motabang pagpanalipod sa appointment ug reseta.",
      safety: "Ang contact number para sa care coordination ug dili pagpamatuod sa pagkaila.",
      guideItems: ["Paghimo og account", "Idugang ang mobile", "Sugdi ang pag-atiman"],
      steps: ["Account", "Mobile", "Andam"],
      google: "Sign up gamit ang Google",
      emailDivider: "o gamita ang email",
      fullName: "Kompletong ngalan",
      email: "Email address",
      password: "Paghimo og password",
      passwordPlaceholder: "Paghimo og password",
      passwordHint: "Gamita ang labing menos 8 ka karakter aron mapanalipdan ang health records.",
      showPassword: "Ipakita ang password",
      hidePassword: "Tagoa ang password",
      continueMobile: "Padayon sa contact number",
      creating: "Nagahimo og account...",
      existingAccount: "Aduna na kay account?",
      mobileDemo: "Para sa MVP, tipigan ang numero isip care contact ug susihon kon gigamit na. Walay SMS verification.",
      mobileLabel: "Philippine mobile number",
      mobilePlaceholder: "917 123 4567",
      sendCode: "Padayon sa health profile",
      requesting: "Gisusi ang numero...",
      accountReady: "Andam na ang account",
      greeting: "Maayong pag-abot",
      readyDescription: "Andam na ang imong patient account sa consultation booking.",
      continueLogin: "Ablihi ang patient portal",
      createdNotice: "Nahimo na ang account. Idugang ang mobile number aron mahuman ang onboarding.",
      expiredError: "Nahuman na ang onboarding session. Paghimo pag-usab og account.",
      invalidPhone: "Isulod ang hustong Philippine mobile number, pananglitan 917 123 4567.",
      profileTitle: "Kompletoha ang health profile",
      profileDescription: "Ang gikinahanglan ra nga detalye para sa luwas nga telekonsulta ang kolektahon.",
      birthday: "Birthday",
      sex: "Sekso",
      female: "Babaye",
      male: "Lalaki",
      preferNotToSay: "Dili isulti",
      weight: "Timbang (kg)",
      height: "Gitas-on (cm)",
      emergencyName: "Ngalan sa emergency contact",
      emergencyNumber: "Numero sa emergency contact",
      allergies: "Allergies",
      conditions: "Mga kondisyon",
      medications: "Mga tambal karon",
      medicalHistory: "Basic medical history",
      listHint: "Bulaga gamit ang comma kung daghan.",
      privacyConsent: "Nabasa nako ang Privacy Notice ug mouyon ko sa pagtago sa profile para sa telehealth care.",
      healthConsent: "Mouyon ko sa pagproseso sa health information para sa konsultasyon ug care coordination.",
      aiConsent: "Mouyon ko sa AI-assisted summary para sa review sa doktor lamang (opsyonal).",
      privacyLink: "Basaha ang Privacy Notice",
      saveProfile: "Humanon ang patient onboarding",
      savingProfile: "Luwas nga gitipigan...",
      profileRequired: "Mouyon sa gikinahanglan nga privacy ug health-data consents.",
      emailUsed: "Aduna nay account niini nga email. Palihog pag-login.",
      popupClosed: "Nasira ang Google sign-up sa wala pa mahuman.",
      tooManyRequests: "Daghan kaayong pagsulay. Sulayi pag-usab unya.",
      onboardingError: "Wala mahuman ang onboarding. Sulayi pag-usab.",
    },
  },
  ilo: {
    login: {
      brandTagline: "Telekonsulta para iti pamilya",
      back: "Agsubli",
      eyebrow: "Natalged a login",
      title: "Naimbag a panagsubli",
      description: "Agpili pay iti kita ti account sakbay nga ag-login.",
      chooseRole: "Ag-loginak a kas",
      patientRole: "Pasyente",
      patientRoleDescription: "Appointment ken care records",
      doctorRole: "Doktor",
      doctorRoleDescription: "Oras ken konsultasion",
      roleSafety: "Para laeng kadagiti naaprobaran a professional accounts ti doctor access.",
      mobileBanner: "Telekonsulta para kenka ken iti pamilyam.",
      sideEyebrow: "Para iti pasyente ken pamilya",
      sideTitle: "Pannakaaywan a Pilipino, uray online.",
      sideDescription: "Manipud umuna a pakaseknan agingga konsultasion iti lisensiado a doktor, naurnos ken asideg iti balay ti pannakaaywan.",
      sideJourney: "Paset ti care journey",
      trustItems: ["Nailista a contact ti pasyente", "Pribado a record ti reseta", "Online a pannakaaywan ti pamilya"],
      safety: "Daytoy a tool ket mangted laeng iti giya ken saan a mangsukat iti propesyonal a medikal a balakad.",
      email: "Email address",
      password: "Password",
      passwordPlaceholder: "Ikabil ti password",
      showPassword: "Ipakita ti password",
      hidePassword: "Ilemmeng ti password",
      remember: "Laglagipennak",
      forgot: "Nalipatmo ti password?",
      submit: "Ag-login iti patient portal",
      doctorSubmit: "Ag-login iti workspace ti doktor",
      submitting: "Ag-login...",
      welcome: "Naimbag nga isasangbay",
      sessionReady: "Nakasagana ti patient portal session mo.",
      returnHome: "Agsubli iti home",
      noAccount: "Awan pay patient account mo?",
      createPrompt: "Mangaramid iti account ken ikabil ti mobile number tapno mangrugi.",
      createAccount: "Mangaramid iti patient account",
      doctorQuestion: "Doktor ka kadi?",
      doctorPrompt: "Baro a propesional? Leppasen pay ti verification sakbay nga umawat iti konsultasion.",
      professionalApplication: "Professional application",
      success: "Naimbag a panagsubli. Naka-loginen ti patient account mo.",
      doctorSuccess: "Naka-loginen. Kasapulan ti naaprobaran a professional account para iti doctor workspace.",
      invalidCredentials: "Biddut ti email wenno password.",
      tooManyRequests: "Adu unay ti panangpadas. Padasen manen inton madamdama.",
      authError: "Saan a nalpas ti login. Padasen manen.",
    },
    signup: {
      login: "Ag-login",
      eyebrow: "Patient onboarding",
      title: "Mangaramid iti care account",
      description: "Para kenka wenno iti kapamilyam: mangaramid iti account, kalpasanna ikabil ti contact number.",
      sideEyebrow: "Baro a pasyente",
      sideTitle: "Mangrugi a natalged.",
      sideDescription: "Ti natalged nga account ket tumulong a mangsalaknib iti appointment ken access iti reseta.",
      safety: "Ti contact number ket para iti care coordination ken saan nga identity verification.",
      guideItems: ["Mangaramid iti account", "Ikabil ti mobile", "Mangrugi iti pannakaaywan"],
      steps: ["Account", "Mobile", "Nakasagana"],
      google: "Ag-sign up babaen iti Google",
      emailDivider: "wenno usaren ti email",
      fullName: "Nagan a kompleto",
      email: "Email address",
      password: "Mangaramid iti password",
      passwordPlaceholder: "Mangaramid iti password",
      passwordHint: "Usaren ti di nakurang a 8 a karakter tapno masalakniban dagiti health records.",
      showPassword: "Ipakita ti password",
      hidePassword: "Ilemmeng ti password",
      continueMobile: "Ituloy iti contact number",
      creating: "Mangaramid iti account...",
      existingAccount: "Adda account mo?",
      mobileDemo: "Para iti MVP, maidulin ti numero a care contact ken makita no addan nga us-usaren. Awan ti SMS verification.",
      mobileLabel: "Philippine mobile number",
      mobilePlaceholder: "917 123 4567",
      sendCode: "Ituloy iti health profile",
      requesting: "Makitkita ti numero...",
      accountReady: "Nakasagana ti account",
      greeting: "Naimbag nga isasangbay",
      readyDescription: "Nakasagana ti patient account mo iti consultation booking.",
      continueLogin: "Luktan ti patient portal",
      createdNotice: "Naaramiden ti account. Ikabil ti mobile number tapno malpas ti onboarding.",
      expiredError: "Nagpaso ti onboarding session. Mangaramid manen iti account.",
      invalidPhone: "Ikabil ti umiso a Philippine mobile number, kas iti 917 123 4567.",
      profileTitle: "Kompletoen ti health profile",
      profileDescription: "Dagiti laeng detalye a kasapulan para iti natalged a telekonsulta ti maala.",
      birthday: "Birthday",
      sex: "Sekso",
      female: "Babai",
      male: "Lalaki",
      preferNotToSay: "Saan nga ibaga",
      weight: "Timbang (kg)",
      height: "Tayag (cm)",
      emergencyName: "Nagan ti emergency contact",
      emergencyNumber: "Numero ti emergency contact",
      allergies: "Allergies",
      conditions: "Dagiti kondisyon",
      medications: "Agdama nga agas",
      medicalHistory: "Basic medical history",
      listHint: "Pagsisinaen babaen iti comma no adu.",
      privacyConsent: "Nabasak ti Privacy Notice ken umannugotak a maidulin ti profile para iti telehealth care.",
      healthConsent: "Umannugotak iti pannakaproseso ti health information para iti konsultasion ken care coordination.",
      aiConsent: "Umannugotak iti AI-assisted summary para laeng iti review ti doktor (opsional).",
      privacyLink: "Basaen ti Privacy Notice",
      saveProfile: "Leppasen ti patient onboarding",
      savingProfile: "Natalged a maiduldulin...",
      profileRequired: "Umannugot kadagiti kasapulan a privacy ken health-data consent.",
      emailUsed: "Adda accounten daytoy nga email. Ag-login ka laengen.",
      popupClosed: "Na-close ti Google sign-up sakbay a nalpas.",
      tooManyRequests: "Adu unay ti panangpadas. Padasen manen inton madamdama.",
      onboardingError: "Saan a nalpas ti onboarding. Padasen manen.",
    },
  },
};
