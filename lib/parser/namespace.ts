import * as borsh from "@coral-xyz/borsh";
import { web3 } from "@project-serum/anchor";
import { Prisma } from "@prisma/client/edge";
import axios from "axios";
import base58 from "bs58";
import { Instruction } from "helius-sdk";

import { genIxIdentifier } from "../../utils/web3";
import { getNamespaceProgram } from "../anchor/provider";
import prisma from "../prisma";

const connection = new web3.Connection(
  process.env.NEXT_PUBLIC_RPC_ENDPOINT as string
);

const namespaceProgram = getNamespaceProgram(connection);

const namespaceIxIds = namespaceProgram.idl.instructions.map((ix) => {
  return {
    name: ix.name,
    id: genIxIdentifier(ix.name),
  };
});

export async function namespaceParser(ix: Instruction) {
  const ixData = base58.decode(ix.data);
  const ixId = base58.encode(ixData.slice(0, 8));
  const ixName = namespaceIxIds.find((i) => i.id === ixId)?.name;
  const ixAccounts = namespaceProgram.idl.instructions.find(
    (i) => i.name === ixName
  )?.accounts;

  console.log("Handling ix: ", ixName);

  if (ixName === undefined || ixAccounts === undefined) {
    return;
  }

  const merkleTreeIndex = ixAccounts.findIndex((a) => a.name === "merkleTree");
  const merkleTreeAddress = ix.accounts[merkleTreeIndex];
  const layout = borsh.struct([borsh.str("namespace"), borsh.str("uri")]);
  const decoded = layout.decode(Buffer.from(ixData.slice(8)));
  const metadata = await axios.get(decoded.uri).then((res) => res.data);
  const links = (
    metadata?.links instanceof Array ? metadata?.links : []
  ) as Prisma.JsonArray;

  await prisma.forum.update({
    where: {
      id: merkleTreeAddress,
    },
    data: {
      links,
      namespace: decoded.namespace,
      displayName: metadata?.displayName,
      description: metadata?.description,
      icon: metadata?.icon,
      banner: metadata?.banner,
    },
  });
}
