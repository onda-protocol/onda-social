import { web3 } from "@project-serum/anchor";
import base58 from "bs58";
import { Instruction } from "helius-sdk";

import { IDL as BloomIDL } from "../anchor/idl/onda_bloom";
import prisma from "../prisma";
import { genIxIdentifier } from "./helpers";

const bloomIxIds = BloomIDL.instructions.map((ix) => {
  return {
    name: ix.name,
    id: genIxIdentifier(ix.name),
  };
});

export async function bloomParser(ix: Instruction) {
  const ixData = base58.decode(ix.data);
  const ixId = base58.encode(ixData.slice(0, 8));
  const ixName = bloomIxIds.find((i) => i.id === ixId)?.name;
  const ixAccounts = BloomIDL.instructions.find(
    (i) => i.name === ixName
  )?.accounts;
  console.log("Handling ix: ", ixName);

  if (ixName === undefined || ixAccounts === undefined) {
    return;
  }

  switch (ixName) {
    case "feedPlankton": {
      const buffer = Buffer.from(ixData.slice(8, 40));
      const entryId = new web3.PublicKey(buffer);
      // expect one of these to fail
      try {
        await prisma.post.update({
          where: {
            id: entryId.toBase58(),
          },
          data: {
            likes: {
              increment: 1,
            },
          },
        });
      } catch (err) {
        try {
          await prisma.comment.update({
            where: {
              id: entryId.toBase58(),
            },
            data: {
              likes: {
                increment: 1,
              },
            },
          });
        } catch {
          // Fail silently - entry not found
          console.log("Entry not found");
        }
      }

      break;
    }

    default: {
      break;
    }
  }
}
