export type ConsultationOption = {
  code: string;
  label: string;
  description: string;
  feePhp: number;
};

export type ConsultationAddOn = {
  code: string;
  label: string;
  description: string;
  feePhp: number;
};

export function getConsultationOptions(
  specializationName: string,
): ConsultationOption[] {
  const cleanSpecialization = specializationName.trim() || 'General Physician';

  return [
    {
      code: 'initial_consultation',
      label: `${cleanSpecialization} Consultation`,
      description: 'First-time online consultation with case review and care guidance.',
      feePhp: 650,
    },
    {
      code: 'follow_up_consultation',
      label: `${cleanSpecialization} Follow-up Consultation`,
      description: 'Short follow-up for ongoing treatment, recovery check, or medication review.',
      feePhp: 450,
    },
  ];
}

export function getConsultationAddOns(
  specializationName: string,
): ConsultationAddOn[] {
  const baseAddOns: ConsultationAddOn[] = [
    {
      code: 'gp_medical_certificate',
      label: 'GP Medical Certificate',
      description: 'Issued after assessment when clinically appropriate.',
      feePhp: 150,
    },
  ];

  if (/psych/i.test(specializationName)) {
    baseAddOns.push({
      code: 'psych_medical_certificate',
      label: 'Psych Medical Certificate',
      description: 'Psychology or psychiatry certificate add-on after evaluation.',
      feePhp: 300,
    });
  }

  return baseAddOns;
}

export function resolveConsultationOption(
  specializationName: string,
  code: string,
): ConsultationOption {
  const option = getConsultationOptions(specializationName).find(
    (item) => item.code === code,
  );

  if (!option) {
    throw new Error('Please choose a valid consultation type.');
  }

  return option;
}

export function resolveConsultationAddOns(
  specializationName: string,
  codes: string[],
): ConsultationAddOn[] {
  const availableAddOns = getConsultationAddOns(specializationName);

  return codes.map((code) => {
    const addOn = availableAddOns.find((item) => item.code === code);

    if (!addOn) {
      throw new Error('One of the selected add-ons is not available for this doctor.');
    }

    return addOn;
  });
}
