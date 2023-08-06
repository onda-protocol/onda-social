import { web3 } from "@project-serum/anchor";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import axios from "axios";
import base58 from "bs58";
import { Instruction } from "helius-sdk";

import { IDL as ProfileIDL } from "../anchor/idl/onda_profile";
import prisma from "../prisma";
import { genIxIdentifier } from "./helpers";

const connection = new web3.Connection(
  process.env.NEXT_PUBLIC_RPC_ENDPOINT as string
);

const profileIxIds = ProfileIDL.instructions.map((ix) => {
  return {
    name: ix.name,
    id: genIxIdentifier(ix.name),
  };
});

export async function profileParser(ix: Instruction) {
  const ixData = base58.decode(ix.data);
  const ixId = base58.encode(ixData.slice(0, 8));
  const ixName = profileIxIds.find((i) => i.id === ixId)?.name;
  console.log("Handling ix: ", ixName);
  const ixAccounts = ProfileIDL.instructions.find(
    (i) => i.name === ixName
  )?.accounts;

  if (ixName === undefined || ixAccounts === undefined) {
    console.log("Unknown instruction: ", ix);
    return;
  }

  switch (ixName) {
    case "updateProfile": {
      const buffer = Buffer.from(ixData.slice(8 + 4));
      const name = new TextDecoder().decode(buffer);
      console.log("name: ", name);
      const mintIndex = ixAccounts.findIndex(
        (account) => account.name === "mint"
      );
      const mintAddress = new web3.PublicKey(ix.accounts[mintIndex]);
      const metadataIndex = ixAccounts.findIndex(
        (account) => account.name === "metadata"
      );
      const metadataAddress = new web3.PublicKey(ix.accounts[metadataIndex]);
      const userIndex = ixAccounts.findIndex(
        (account) => account.name === "author"
      );
      const userAddress = new web3.PublicKey(ix.accounts[userIndex]);

      const metadata = await Metadata.fromAccountAddress(
        connection,
        metadataAddress
      );
      const avatar: string = await axios
        .get(metadata.data.uri)
        .then((res) => res.data.image);

      console.log("avatar: ", avatar);

      console.log({
        where: {
          id: userAddress.toBase58(),
        },
        update: {
          avatar,
          name,
          mint: mintAddress.toBase58(),
        },
        create: {
          avatar,
          name,
          id: userAddress.toBase58(),
          mint: mintAddress.toBase58(),
        },
      });

      await prisma.user.upsert({
        where: {
          id: userAddress.toBase58(),
        },
        update: {
          avatar,
          name,
          mint: mintAddress.toBase58(),
        },
        create: {
          avatar,
          name,
          id: userAddress.toBase58(),
          mint: mintAddress.toBase58(),
        },
      });
    }

    default: {
      break;
    }
  }
}
