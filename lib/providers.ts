export type ProviderId = "strava" | "oura" | "garmin" | "apple";

export type Provider = {
  id: ProviderId;
  name: string;
  disabled?: boolean;
};

export const PROVIDERS: Provider[] = [
  { id: "strava", name: "Strava" },
  { id: "oura", name: "Oura Ring" },
  { id: "garmin", name: "Garmin Watch", disabled: true },
  { id: "apple", name: "Apple Fitness Watch", disabled: true },
];

export function providerById(id: string): Provider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}
