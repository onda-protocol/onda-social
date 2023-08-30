import type { NextApiRequest, NextApiResponse } from "next";
import { web3 } from "@project-serum/anchor";
import base58 from "bs58";
import { DataV1, addEntryIx } from "lib/anchor";
import { findPass } from "lib/api/pass";

type Method = "addEntry";

const connection = new web3.Connection(process.env.HELIUS_RPC_URL!);
const signer = web3.Keypair.fromSecretKey(
  base58.decode(process.env.SIGNER_SECRET_KEY as string)
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("=========> ", req.body);
  const method = req.body.method as Method;
  const author = req.body.author as string;
  const forum = req.body.forum as string;
  const data = parseData(req.body.data);

  switch (method) {
    case "addEntry": {
      const pass = await findPass(forum, author);
      console.log("pass: ", pass);
      const instruction = await addEntryIx(connection, {
        data,
        author: new web3.PublicKey(author),
        forum: new web3.PublicKey(forum),
        mint: pass.mint ? new web3.PublicKey(pass.mint) : null,
        metadata: pass.metadata ? new web3.PublicKey(pass.metadata) : null,
        tokenAccount: pass.tokenAccount
          ? new web3.PublicKey(pass.tokenAccount)
          : null,
      });

      const latestBlockhash = await connection.getLatestBlockhash();
      const transaction = new web3.Transaction({
        feePayer: signer.publicKey,
        ...latestBlockhash,
      }).add(instruction);
      transaction.partialSign(signer);

      res.status(200).json({
        transaction: base58.encode(
          transaction.serialize({
            requireAllSignatures: false,
          })
        ),
      });
    }

    default: {
      res.status(400).json({ error: "Invalid method" });
    }
  }
}

function parseData(data: any): DataV1 {
  if (data.comment) {
    return {
      comment: {
        uri: data.comment.uri as string,
        post: new web3.PublicKey(data.comment.post),
        parent: data.comment.parent
          ? new web3.PublicKey(data.comment.parent)
          : null,
      },
    };
  }

  return data as DataV1;
}
