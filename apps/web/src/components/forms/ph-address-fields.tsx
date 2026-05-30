"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";

import {
  getBarangays,
  getProvinceCitiesMunicipalities,
  getRegionCitiesMunicipalities,
  getRegionProvinces,
  getRegions,
  isNcrRegion,
  type PsgcItem,
} from "@/lib/psgc";

type PhAddressFieldsProps = {
  prefix?: string;
  defaultValue?: {
    regionCode?: string;
    provinceCode?: string;
    cityMunicipalityCode?: string;
    barangayCode?: string;
  };
};

type EstimatedPinAddressEvent = CustomEvent<{
  region?: string;
  province?: string;
  cityMunicipality?: string;
  barangay?: string;
}>;

export function PhAddressFields({ prefix = "", defaultValue }: PhAddressFieldsProps) {
  const [regions, setRegions] = useState<PsgcItem[]>([]);
  const [provinces, setProvinces] = useState<PsgcItem[]>([]);
  const [citiesMunicipalities, setCitiesMunicipalities] = useState<PsgcItem[]>([]);
  const [barangays, setBarangays] = useState<PsgcItem[]>([]);

  const [regionCode, setRegionCode] = useState(defaultValue?.regionCode ?? "");
  const [provinceCode, setProvinceCode] = useState(defaultValue?.provinceCode ?? "");
  const [cityMunicipalityCode, setCityMunicipalityCode] = useState(
    defaultValue?.cityMunicipalityCode ?? "",
  );
  const [barangayCode, setBarangayCode] = useState(defaultValue?.barangayCode ?? "");
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    setRegionCode(defaultValue?.regionCode ?? "");
    setProvinceCode(defaultValue?.provinceCode ?? "");
    setCityMunicipalityCode(defaultValue?.cityMunicipalityCode ?? "");
    setBarangayCode(defaultValue?.barangayCode ?? "");
  }, [
    defaultValue?.barangayCode,
    defaultValue?.cityMunicipalityCode,
    defaultValue?.provinceCode,
    defaultValue?.regionCode,
  ]);

  const regionName = useMemo(
    () => regions.find((item) => item.code === regionCode)?.name ?? "",
    [regionCode, regions],
  );
  const provinceName = useMemo(
    () => provinces.find((item) => item.code === provinceCode)?.name ?? "",
    [provinceCode, provinces],
  );
  const cityMunicipalityName = useMemo(
    () =>
      citiesMunicipalities.find((item) => item.code === cityMunicipalityCode)?.name ?? "",
    [citiesMunicipalities, cityMunicipalityCode],
  );
  const barangayName = useMemo(
    () => barangays.find((item) => item.code === barangayCode)?.name ?? "",
    [barangays, barangayCode],
  );

  useEffect(() => {
    let active = true;

    void getRegions()
      .then((nextRegions) => {
        if (active) {
          setRegions(nextRegions);
          setRegionCode((current) => current || defaultValue?.regionCode || "");
        }
      })
      .catch(() => {
        if (active) {
          setLoadingError("Unable to load Philippine locations right now.");
        }
      });

    return () => {
      active = false;
    };
  }, [defaultValue?.regionCode]);

  useEffect(() => {
    if (!regionCode) {
      return;
    }

    if (isNcrRegion(regionCode)) {
      void getRegionCitiesMunicipalities(regionCode)
        .then((items) => {
          setProvinces([]);
          setProvinceCode("");
          setCitiesMunicipalities(items);
          setCityMunicipalityCode(
            (current) => current || defaultValue?.cityMunicipalityCode || "",
          );
        })
        .catch(() =>
          setLoadingError("Unable to load NCR cities and municipalities."),
        );
      return;
    }

    void getRegionProvinces(regionCode)
      .then((items) => {
        setProvinces(items);
        setCitiesMunicipalities([]);
        setProvinceCode((current) => current || defaultValue?.provinceCode || "");
      })
      .catch(() => setLoadingError("Unable to load provinces for this region."));
  }, [defaultValue?.cityMunicipalityCode, defaultValue?.provinceCode, regionCode]);

  useEffect(() => {
    if (!provinceCode || isNcrRegion(regionCode)) {
      return;
    }

    void getProvinceCitiesMunicipalities(provinceCode)
      .then((items) => {
        setCitiesMunicipalities(items);
        setCityMunicipalityCode(
          (current) => current || defaultValue?.cityMunicipalityCode || "",
        );
      })
      .catch(() =>
        setLoadingError("Unable to load cities and municipalities for this province."),
      );
  }, [defaultValue?.cityMunicipalityCode, provinceCode, regionCode]);

  useEffect(() => {
    if (!cityMunicipalityCode) {
      return;
    }

    void getBarangays(cityMunicipalityCode)
      .then((items) => {
        setBarangays(items);
        setBarangayCode((current) => current || defaultValue?.barangayCode || "");
      })
      .catch(() => setLoadingError("Unable to load barangays for this area."));
  }, [cityMunicipalityCode, defaultValue?.barangayCode]);

  useEffect(() => {
    const detail = {
      regionName,
      provinceName,
      cityMunicipalityName,
      barangayName,
    };

    window.dispatchEvent(
      new CustomEvent("click-klinik-address-changed", { detail }),
    );
  }, [barangayName, cityMunicipalityName, provinceName, regionName]);

  useEffect(() => {
    function handlePinEstimate(event: Event) {
      const { region, province, cityMunicipality, barangay } =
        (event as EstimatedPinAddressEvent).detail ?? {};

      const matchedRegion = findPsgcMatch(regions, region);
      if (matchedRegion && matchedRegion.code !== regionCode) {
        setRegionCode(matchedRegion.code);
        setProvinceCode("");
        setCityMunicipalityCode("");
        setBarangayCode("");
        setProvinces([]);
        setCitiesMunicipalities([]);
        setBarangays([]);
        return;
      }

      const matchedProvince = findPsgcMatch(provinces, province);
      if (matchedProvince && matchedProvince.code !== provinceCode) {
        setProvinceCode(matchedProvince.code);
        setCityMunicipalityCode("");
        setBarangayCode("");
        setCitiesMunicipalities([]);
        setBarangays([]);
        return;
      }

      const matchedCity = findPsgcMatch(citiesMunicipalities, cityMunicipality);
      if (matchedCity && matchedCity.code !== cityMunicipalityCode) {
        setCityMunicipalityCode(matchedCity.code);
        setBarangayCode("");
        setBarangays([]);
        return;
      }

      const matchedBarangay = findPsgcMatch(barangays, barangay);
      if (matchedBarangay && matchedBarangay.code !== barangayCode) {
        setBarangayCode(matchedBarangay.code);
      }
    }

    window.addEventListener("click-klinik-pin-address-estimated", handlePinEstimate);
    return () =>
      window.removeEventListener(
        "click-klinik-pin-address-estimated",
        handlePinEstimate,
      );
  }, [
    barangayCode,
    barangays,
    citiesMunicipalities,
    cityMunicipalityCode,
    provinceCode,
    provinces,
    regionCode,
    regions,
  ]);

  const fieldName = (name: string) => `${prefix}${name}`;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <AddressField required label="Region">
        <select
          required
          value={regionCode}
          onChange={(event) => {
            const nextRegionCode = event.target.value;
            setLoadingError(null);
            setRegionCode(nextRegionCode);
            setProvinceCode("");
            setCityMunicipalityCode("");
            setBarangayCode("");
            setProvinces([]);
            setCitiesMunicipalities([]);
            setBarangays([]);
          }}
          className="h-12 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Select region</option>
          {regions.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </AddressField>

      {!isNcrRegion(regionCode) ? (
        <AddressField required label="Province">
          <select
            required
            value={provinceCode}
            onChange={(event) => {
              setLoadingError(null);
              setProvinceCode(event.target.value);
              setCityMunicipalityCode("");
              setBarangayCode("");
              setCitiesMunicipalities([]);
              setBarangays([]);
            }}
            disabled={!regionCode}
            className="h-12 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none disabled:opacity-60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Select province</option>
            {provinces.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </AddressField>
      ) : (
        <div className="rounded-xl border border-dashed border-primary/15 bg-primary/5 px-4 py-3 text-xs leading-5 text-muted-foreground">
          NCR does not require province selection.
        </div>
      )}

      <AddressField required label="City / Municipality">
        <select
          required
          value={cityMunicipalityCode}
          onChange={(event) => {
            setLoadingError(null);
            setCityMunicipalityCode(event.target.value);
            setBarangayCode("");
            setBarangays([]);
          }}
          disabled={
            !regionCode || (!isNcrRegion(regionCode) && !provinceCode)
          }
          className="h-12 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none disabled:opacity-60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Select city / municipality</option>
          {citiesMunicipalities.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </AddressField>

      <AddressField required label="Barangay">
        <select
          required
          value={barangayCode}
          onChange={(event) => setBarangayCode(event.target.value)}
          disabled={!cityMunicipalityCode}
          className="h-12 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none disabled:opacity-60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Select barangay</option>
          {barangays.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </AddressField>

      {loadingError ? (
        <div className="sm:col-span-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          {loadingError}
        </div>
      ) : null}

      <input type="hidden" name={fieldName("regionCode")} value={regionCode} />
      <input type="hidden" name={fieldName("regionName")} value={regionName} />
      <input type="hidden" name={fieldName("provinceCode")} value={provinceCode} />
      <input type="hidden" name={fieldName("provinceName")} value={provinceName} />
      <input
        type="hidden"
        name={fieldName("cityMunicipalityCode")}
        value={cityMunicipalityCode}
      />
      <input
        type="hidden"
        name={fieldName("cityMunicipalityName")}
        value={cityMunicipalityName}
      />
      <input type="hidden" name={fieldName("barangayCode")} value={barangayCode} />
      <input type="hidden" name={fieldName("barangayName")} value={barangayName} />
      <input type="hidden" name={fieldName("location")} value={cityMunicipalityName} />
    </div>
  );
}

function findPsgcMatch(items: PsgcItem[], rawValue?: string) {
  const value = normalizeLocationName(rawValue);
  if (!value) {
    return undefined;
  }

  return items.find((item) => {
    const itemName = normalizeLocationName(item.name);
    return itemName === value || itemName.includes(value) || value.includes(itemName);
  });
}

function normalizeLocationName(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .replace(/\bcity of\b/g, "")
    .replace(/\bbarangay\b/g, "")
    .replace(/\bbrgy\b/g, "")
    .replace(/\bprovince of\b/g, "")
    .replace(/\bnational capital region\b/g, "ncr")
    .replace(/\bmetro manila\b/g, "ncr")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function AddressField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </span>
      {children}
    </label>
  );
}
