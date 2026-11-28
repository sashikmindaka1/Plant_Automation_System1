export type PlantCategory = 'Succulents' | 'Herbs' | 'Indoor' | 'Tropical';

export interface PlantSpecies {
  id: number;
  code: string;
  name: string;
  scientificName: string;
  category: PlantCategory;
  description: string;
  minMoisture: number;
  maxMoisture: number;
  minLightLux: number;
  maxLightLux: number;
  minTempC: number;
  maxTempC: number;
}

export interface SpeciesPage {
  data: PlantSpecies[];
  total: number;
  page: number;
  pageSize: number;
}

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_SPECIES_API_URL ?? 'http://localhost:3001/api'
).replace(/\/+$/, '');

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const body: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof body.error === 'string'
        ? body.error
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return body as T;
}

export function getSpecies(options: {
  search: string;
  category: PlantCategory | 'All';
  page: number;
  pageSize: number;
}): Promise<SpeciesPage> {
  const params = new URLSearchParams({
    page: String(options.page),
    pageSize: String(options.pageSize),
  });

  if (options.search) params.set('q', options.search);
  if (options.category !== 'All') params.set('category', options.category);

  return request<SpeciesPage>(`/species?${params.toString()}`);
}

export function getSpeciesById(id: string): Promise<PlantSpecies> {
  return request<PlantSpecies>(`/species/${encodeURIComponent(id)}`);
}

export function getSpeciesByCode(code: string): Promise<PlantSpecies> {
  return request<PlantSpecies>(`/species/lookup/${encodeURIComponent(code.trim())}`);
}
