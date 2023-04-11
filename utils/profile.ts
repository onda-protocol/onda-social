import { shortenAddress } from "./format";

const profiles = new Map();
profiles.set("FghMS8HrXVt9RsXwfLCVydQQKhz5Ce3StjQcvscSyWcy", {
  name: "ChickenTribe",
  image: "https://chickentribe.s3.us-west-2.amazonaws.com/collection.png",
});

export function getImageFromAddress(address: string): string | null {
  return profiles.get(address)?.image ?? null;
}

export function getNameFromAddress(address: string): string {
  return profiles.get(address)?.name ?? shortenAddress(address);
}
