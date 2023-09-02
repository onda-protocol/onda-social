import type { NextApiRequest, NextApiResponse } from "next";
import { web3 } from "@project-serum/anchor";
import base58 from "bs58";

import prisma from "lib/prisma";
import { DataV1, addEntryIx } from "lib/anchor";
import { findPass } from "lib/api/pass";
import {
  EntryDataArgs,
  TransactionArgs,
  TransactionResponse,
} from "lib/api/types";
import { nodeUpload } from "lib/bundlr";

const connection = new web3.Connection(process.env.HELIUS_RPC_URL!);
const signer = web3.Keypair.fromSecretKey(
  base58.decode(process.env.SIGNER_SECRET_KEY as string)
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TransactionResponse>
) {
  const { data, method } = req.body as TransactionArgs;

  switch (method) {
    case "addEntry": {
      const result = await prisma.forum.findUnique({
        where: {
          id: data.forum,
        },
        include: {
          Gates: true,
        },
      });

      if (!result) {
        return res.status(401).json({ error: "Forum not found" });
      }

      const pass = await findPass(result.Gates, data.author);

      if (result.Gates.length && pass === undefined) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const [dataV1Args, uri] = await parseData(req.body.data);
      const instruction = await addEntryIx(connection, {
        data: dataV1Args,
        author: new web3.PublicKey(data.author),
        forum: new web3.PublicKey(data.forum),
        mint: pass?.mint ? new web3.PublicKey(pass.mint) : null,
        metadata: pass?.metadata ? new web3.PublicKey(pass.metadata) : null,
        tokenAccount: pass?.tokenAccount
          ? new web3.PublicKey(pass.tokenAccount)
          : null,
      });

      const latestBlockhash = await connection.getLatestBlockhash();
      const transaction = new web3.Transaction({
        feePayer: signer.publicKey,
        ...latestBlockhash,
      }).add(instruction);

      transaction.partialSign(signer);

      const serializedTransaction = base58.encode(
        transaction.serialize({
          requireAllSignatures: false,
        })
      );
      res.status(200).json({
        uri,
        transaction: serializedTransaction,
      });
    }

    default: {
      res.status(400).json({ error: "Invalid method" });
    }
  }
}

async function parseData(data: EntryDataArgs): Promise<[DataV1, string]> {
  switch (data.type) {
    case "comment": {
      const uri = await nodeUpload(signer, data.body, "application/json");

      return [
        {
          comment: {
            uri,
            post: new web3.PublicKey(data.post),
            parent: data.parent ? new web3.PublicKey(data.parent) : null,
          },
        },
        uri,
      ];
    }

    case "textPost": {
      const uri = await nodeUpload(signer, data.body, "application/json");
      return [{ textPost: { title: data.title, uri, nsfw: false } }, uri];
    }

    case "linkPost": {
      return [
        {
          linkPost: {
            uri: data.url,
            title: data.title,
            nsfw: false,
          },
        },
        data.url,
      ];
    }

    // case "imagePost": {
    //   if (data.image === null) {
    //     throw new Error("Image required");
    //   }
    //   const buffer = Buffer.from(await data.image.arrayBuffer());
    //   uri = await upload(wallet, buffer, data.image.type as ContentType);
    //   dataArgs = { imagePost: { title: data.title, uri } };
    //   break;
    // }

    default: {
      throw new Error("Invalid post type");
    }
  }
}
