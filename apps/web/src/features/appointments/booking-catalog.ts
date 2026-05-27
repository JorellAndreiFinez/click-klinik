export type BookingConsultationOption = {
  code: string;
  label: string;
  description: string;
  feePhp: number;
};

export type BookingAddOnOption = {
  code: string;
  label: string;
  description: string;
  feePhp: number;
};

export function getBookingConsultationOptions(
  specializationName: string,
): BookingConsultationOption[] {
  const cleanSpecialization = specializationName.trim() || "General Physician";

  return [
    {
      code: "initial_consultation",
      label: `${cleanSpecialization} Consultation`,
      description: "First-time online consultation with assessment and telehealth guidance.",
      feePhp: 650,
    },
    {
      code: "follow_up_consultation",
      label: `${cleanSpecialization} Follow-up Consultation`,
      description: "Short follow-up for treatment monitoring, recovery check, or medication review.",
      feePhp: 450,
    },
  ];
}

export function getBookingAddOnOptions(
  specializationName: string,
): BookingAddOnOption[] {
  const addOns: BookingAddOnOption[] = [
    {
      code: "gp_medical_certificate",
      label: "GP Medical Certificate",
      description: "Certificate issuance after consultation when clinically appropriate.",
      feePhp: 150,
    },
  ];

  if (/psych/i.test(specializationName)) {
    addOns.push({
      code: "psych_medical_certificate",
      label: "Psych Medical Certificate",
      description: "Psych certificate add-on after doctor evaluation.",
      feePhp: 300,
    });
  }

  return addOns;
}

export function formatPhp(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}
