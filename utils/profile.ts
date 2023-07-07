import { shortenAddress } from "./format";

interface Profile {
  name: string;
  image: string;
  description: string;
  links: {
    twitter?: string;
    discord?: string;
    website?: string;
    magicEden?: string;
  };
}

const profiles = new Map<string, Profile>();

// forumConfig:  GpnZFjvSh1QkyTfjoW2iwEMcmmjn3rxim22ejGMKFLYy
// merkleTree:  3yCwjHgyftQJ4HfVPXkpwEVN3N9xFWGS2VBFXZG8KFi9
profiles.set("3yCwjHgyftQJ4HfVPXkpwEVN3N9xFWGS2VBFXZG8KFi9", {
  name: "ChickenTribe",
  description:
    "ChickenTribe is a collection of 3000 unique chickens. Home of the Combinator and SugarUI, we are a community of artists, devs and builders.",
  image: "https://chickentribe.s3.us-west-2.amazonaws.com/collection.png",
  links: {
    twitter: "https://twitter.com/ChickenTribe",
    discord: "https://discord.gg/H3DbQRSjUa",
    website: "https://www.chickentribe.com/",
    magicEden: "https://magiceden.io/marketplace/chicken_tribe",
  },
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

export function getDescriptionFromAddress(address: string): string | null {
  return profiles.get(address)?.description ?? null;
}

export function getLinksFromAddress(address: string): Profile["links"] | null {
  return profiles.get(address)?.links ?? null;
}
