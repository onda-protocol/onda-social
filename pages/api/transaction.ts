import type { NextApiRequest, NextApiResponse } from "next";
import { web3 } from "@project-serum/anchor";
import base58 from "bs58";

import prisma from "lib/prisma";
import {
  addEntryIx,
  claimAwardIx,
  deleteEntryIx,
  giveAwardIx,
} from "lib/anchor/instructions";
import { DataV1 } from "lib/anchor/types";
import { findPass } from "lib/api/pass";
import {
  EntryDataArgs,
  TransactionArgs,
  TransactionResponse,
} from "lib/api/types";
import { nodeUpload } from "lib/bundlr";
import { getProof } from "./proof/[address]";
import { findClaimPda } from "utils/pda";

const connection = new web3.Connection(process.env.HELIUS_RPC_URL!);
const signer = web3.Keypair.fromSecretKey(
  base58.decode(process.env.SIGNER_SECRET_KEY as string)
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TransactionResponse>
) {
  const { data, method, funded } = req.body as TransactionArgs & {
    funded?: boolean;
  };

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
      const author = new web3.PublicKey(data.author);
      const instruction = await addEntryIx(connection, {
        data: dataV1Args,
        author,
        forum: new web3.PublicKey(data.forum),
        mint: pass?.mint ? new web3.PublicKey(pass.mint) : null,
        metadata: pass?.metadata ? new web3.PublicKey(pass.metadata) : null,
        tokenAccount: pass?.tokenAccount
          ? new web3.PublicKey(pass.tokenAccount)
          : null,
      });

      const serializedTransaction = await prepareTransaction(
        instruction,
        funded ? signer.publicKey : author,
        funded
      );

      return res.status(200).json({
        uri,
        transaction: serializedTransaction,
      });
    }

    case "deleteEntry": {
      let createdAt: number;
      let editedAt: number | null;
      let nonce: number;
      let dataHash: number[];

      if (data.entryType === "comment") {
        const comment = await prisma.comment.findUnique({
          where: {
            id: data.entryId,
          },
        });

        if (!comment) {
          return res.status(401).json({ error: "Comment not found" });
        }

        if (comment.author !== data.author) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        if (!comment.hash) {
          return res.status(401).json({ error: "Comment hash not found" });
        }

        createdAt = Number(comment.createdAt);
        editedAt = comment.editedAt ? Number(comment.editedAt) : null;
        nonce = Number(comment.nonce);
        dataHash = Array.from(base58.decode(comment.dataHash!));
      } else {
        const post = await prisma.post.findUnique({
          where: {
            id: data.entryId,
          },
        });

        if (!post) {
          return res.status(401).json({ error: "Post not found" });
        }

        if (post.author !== data.author) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        if (!post.hash) {
          return res.status(401).json({ error: "Post hash not found" });
        }

        createdAt = Number(post.createdAt);
        editedAt = post.editedAt ? Number(post.editedAt) : null;
        nonce = Number(post.nonce);
        dataHash = Array.from(base58.decode(post.dataHash!));
      }

      const proof = await getProof(data.forum, nonce);
      const author = new web3.PublicKey(data.author);
      const instruction = await deleteEntryIx(connection, {
        author,
        forum: new web3.PublicKey(data.forum),
        createdAt,
        editedAt,
        nonce,
        dataHash,
        proof: proof.proof,
      });

      const serializedTransaction = await prepareTransaction(
        instruction,
        funded ? signer.publicKey : author,
        funded
      );
      return res.status(200).json({
        transaction: serializedTransaction,
      });
    }

    case "giveAward": {
      const award = await prisma.award.findUnique({
        where: {
          id: data.award,
        },
        include: {
          Matching: true,
        },
      });

      if (!award) {
        return res.status(401).json({ error: "Award not found" });
      }

      const claimPda = award.Matching
        ? findClaimPda(
            new web3.PublicKey(award.Matching.id),
            new web3.PublicKey(data.author)
          )
        : null;

      const proof = await getProof(data.forum, data.nonce);
      const payer = new web3.PublicKey(data.payer);
      const instruction = await giveAwardIx(connection, {
        payer,
        entry: new web3.PublicKey(data.entryId),
        recipient: new web3.PublicKey(data.author),
        award: new web3.PublicKey(data.award),
        claim: claimPda,
        treasury: new web3.PublicKey(award.treasury),
        merkleTree: new web3.PublicKey(award.merkleTree),
        collectionMint: new web3.PublicKey(award.collectionMint),
        forumMerkleTree: new web3.PublicKey(data.forum),
        createdAt: data.createdAt,
        editedAt: data.editedAt,
        dataHash: Array.from(base58.decode(data.dataHash)),
        nonce: data.nonce,
        root: Array.from(proof.root),
        proof: proof.proof,
      });

      const serializedTransaction = await prepareTransaction(
        instruction,
        funded ? signer.publicKey : payer,
        funded
      );
      return res.status(200).json({
        transaction: serializedTransaction,
      });
    }

    case "claimAward": {
      const award = await prisma.award.findUnique({
        where: {
          id: data.award,
        },
        include: {
          Matching: true,
        },
      });

      if (!award) {
        return res.status(401).json({ error: "Award not found" });
      }

      const recipient = new web3.PublicKey(data.recipient);
      const instruction = await claimAwardIx(connection, {
        recipient,
        award: new web3.PublicKey(award.id),
        treasury: new web3.PublicKey(award.treasury),
        claim: new web3.PublicKey(data.claim),
        merkleTree: new web3.PublicKey(award.merkleTree),
        collectionMint: new web3.PublicKey(award.collectionMint),
      });

      const serializedTransaction = await prepareTransaction(
        instruction,
        funded ? signer.publicKey : recipient,
        funded
      );

      return res.status(200).json({
        transaction: serializedTransaction,
      });
    }

    default: {
      res.status(400).json({ error: "Invalid method" });
    }
  }
}

async function prepareTransaction(
  instruction: web3.TransactionInstruction,
  feePayer: web3.PublicKey,
  funded?: boolean
) {
  const latestBlockhash = await connection.getLatestBlockhash();

  const transaction = new web3.Transaction({
    feePayer,
    ...latestBlockhash,
  }).add(instruction);

  if (funded) {
    transaction.partialSign(signer);
  }

  return base58.encode(
    transaction.serialize({
      requireAllSignatures: false,
    })
  );
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
      return [
        {
          textPost: {
            title: data.title,
            uri,
            flair: null,
            nsfw: false,
            spoiler: false,
          },
        },
        uri,
      ];
    }

    case "linkPost": {
      return [
        {
          linkPost: {
            uri: data.url,
            title: data.title,
            flair: null,
            nsfw: false,
            spoiler: false,
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
