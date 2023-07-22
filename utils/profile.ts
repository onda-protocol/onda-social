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

// profiles.set("BC8yMiHMQ6kiHFqxxNunQrdKb6jgV92fj89amU8qT9B6", {
//   name: "self",
//   description:
//     "The self-referential onda profile. The place for announcements, news, and updates... and some fun.",
//   image: "/profile.png",
//   links: {
//     twitter: "https://twitter.com/OndaProtocol",
//   },
// });

// DEVNET
profiles.set("6XWURNHAmajFCocQXEP4ytFb5xFAyDsB976D3nLRG97A", {
  name: "self",
  description:
    "The self-referential onda profile. The place for announcements, news, and updates... and some fun.",
  image: "/profile.png",
  links: {
    twitter: "https://twitter.com/OndaProtocol",
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
