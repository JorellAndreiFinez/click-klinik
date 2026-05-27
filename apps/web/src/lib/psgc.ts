export type PsgcItem = {
  code: string;
  name: string;
};

const PSGC_BASE_URL = "https://psgc.gitlab.io/api";
const NCR_REGION_CODE = "130000000";

export function isNcrRegion(regionCode: string): boolean {
  return regionCode === NCR_REGION_CODE;
}

export async function getRegions(): Promise<PsgcItem[]> {
  return psgcFetch<PsgcItem[]>("/regions.json");
}

export async function getRegionProvinces(regionCode: string): Promise<PsgcItem[]> {
  return psgcFetch<PsgcItem[]>(`/regions/${regionCode}/provinces.json`);
}

export async function getRegionCitiesMunicipalities(
  regionCode: string,
): Promise<PsgcItem[]> {
  return psgcFetch<PsgcItem[]>(
    `/regions/${regionCode}/cities-municipalities.json`,
  );
}

export async function getProvinceCitiesMunicipalities(
  provinceCode: string,
): Promise<PsgcItem[]> {
  return psgcFetch<PsgcItem[]>(
    `/provinces/${provinceCode}/cities-municipalities.json`,
  );
}

export async function getBarangays(
  cityMunicipalityCode: string,
): Promise<PsgcItem[]> {
  return psgcFetch<PsgcItem[]>(
    `/cities-municipalities/${cityMunicipalityCode}/barangays.json`,
  );
}

async function psgcFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${PSGC_BASE_URL}${path}`, {
    cache: "force-cache",
  });

  if (!response.ok) {
    throw new Error("Unable to load Philippine location data.");
  }

  return (await response.json()) as T;
}
