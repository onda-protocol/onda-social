import { shortenAddress } from "./format";

interface Profile {
  name: string;
  image: string;
}

const profiles = new Map<string, Profile>();
profiles.set("GNrgyGzetWJje63FX5cnBnnqThPqXBJnWopYEbQSo7cv", {
  name: "ChickenTribe",
  image: "https://chickentribe.s3.us-west-2.amazonaws.com/collection.png",
});

export function getProfiles(): (Profile & { id: string })[] {
  return Array.from(profiles, ([key, value]) => ({
    id: key,
    ...value,
  }));
}

export function getImageFromAddress(address: string): string | null {
  return profiles.get(address)?.image ?? null;
}

export function getNameFromAddress(address: string): string {
  return profiles.get(address)?.name ?? shortenAddress(address);
}
