import type { NextApiRequest, NextApiResponse } from "next";
import type { Post, Comment } from "@prisma/client";
import { web3 } from "@project-serum/anchor";
import {
  ConcurrentMerkleTreeAccount,
  hash,
} from "@solana/spl-account-compression";
import prisma from "lib/prisma";
import { findEntryId } from "utils/pda";

const connection = new web3.Connection(
  process.env.NEXT_PUBLIC_RPC_ENDPOINT as string,
  "confirmed"
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { address } = req.query;

  const { forum, hash, nonce } = await getEntry(address as string);
  const merkleTree = new web3.PublicKey(forum);
  const merkleTreeAccount =
    await ConcurrentMerkleTreeAccount.fromAccountAddress(
      connection,
      merkleTree
    );
  const maxDepth = merkleTreeAccount.getMaxDepth();
  const canopyDepth = merkleTreeAccount.getCanopyDepth();
  const nodeIndex = getNodeIndexFromLeafIndex(Number(nonce), maxDepth);
  const nodes: Node[] = generatePathNodesFromIndex(
    nodeIndex,
    maxDepth,
    canopyDepth
  );
  const leafIndexPath = nodes.map((node) => node.getLeafIndexesFromPath());
  const leafIndexes = flattenPath(leafIndexPath);
  const entryIds = leafIndexes.map((index) =>
    findEntryId(merkleTree, index as number).toBase58()
  );
  const leafHashes = await fetchLeafHashes(entryIds);

  const proof = leafIndexPath.map((path) => {
    if (typeof path === "number") {
      const leafHash = leafHashes.find((leaf) => leaf.nonce === path);
      return new web3.PublicKey(
        leafHash ? leafHash.hash : Buffer.alloc(32)
      ).toBase58();
    } else {
      return new web3.PublicKey(recursiveHash(leafHashes, path)).toBase58();
    }
  });

  res.json({
    hash,
    proof,
  });
}

function flattenPath(items: NestedPath) {
  const flat: number[] = [];

  items.forEach((item) => {
    if (Array.isArray(item)) {
      flat.push(...flattenPath(item));
    } else {
      flat.push(item);
    }
  });

  return flat;
}

function recursiveHash(
  leafHashes: Awaited<ReturnType<typeof fetchLeafHashes>>,
  path: NestedPath
): Buffer {
  const [left, right] = path;

  if (left instanceof Array && right instanceof Array) {
    return hash(
      recursiveHash(leafHashes, left),
      recursiveHash(leafHashes, right)
    );
  }

  if (typeof left === "number" && typeof right === "number") {
    const leftBuffer =
      leafHashes.find((leaf) => leaf.nonce === left)?.hash ?? Buffer.alloc(32);
    const rightBuffer =
      leafHashes.find((leaf) => leaf.nonce === right)?.hash ?? Buffer.alloc(32);
    return hash(leftBuffer, rightBuffer);
  }

  throw new Error("Invalid path");
}

async function getEntry(address: string) {
  let entry: Post | (Comment & { Post: Post }) | null =
    await prisma.post.findUnique({
      where: {
        id: address as string,
      },
      include: {
        Forum: true,
      },
    });

  if (entry) {
    return {
      forum: entry.forum,
      hash: entry.hash,
      nonce: entry.nonce,
    };
  } else {
    entry = await prisma.comment.findUnique({
      where: {
        id: address as string,
      },
      include: {
        Post: true,
      },
    });

    if (!entry) {
      throw new Error("Entry not found");
    }

    return {
      forum: entry.Post.forum,
      hash: entry.hash,
      nonce: Number(entry.nonce),
    };
  }
}

async function fetchLeafHashes(entryIds: string[]) {
  const [posts, comments] = await Promise.all([
    prisma.post.findMany({
      where: {
        OR: entryIds.map((id) => ({
          id,
        })),
      },
    }),
    prisma.comment.findMany({
      where: {
        OR: entryIds.map((id) => ({
          id,
        })),
      },
    }),
  ]);

  return [...posts, ...comments].map((entry) => ({
    hash: new web3.PublicKey(entry.hash).toBuffer(),
    nonce: Number(entry.nonce),
  }));
}

type NestedPath = Array<number | NestedPath>;

class Node {
  private _path: NestedPath = [];

  constructor(
    public readonly index: number,
    public readonly maxDepth: number,
    public readonly depth: number
  ) {}

  private _generatePath(nodeIndex: number, depth: number): number | NestedPath {
    let path = nodeIndex;

    if (depth === 0) return path;

    let leftChildIndex = 2 * nodeIndex + 2;
    let rightChildIndex = 2 * nodeIndex + 3;

    return [
      this._generatePath(leftChildIndex, depth - 1),
      this._generatePath(rightChildIndex, depth - 1),
    ];
  }

  public generatePath() {
    this._path = this._generatePath(this.index, this.depth) as NestedPath;
  }

  private _getLeafIndexesFromPath(
    path: number | NestedPath
  ): number | NestedPath {
    if (typeof path === "number") {
      return getLeafIndexFromNodeIndex(path, this.maxDepth);
    }

    return [
      this._getLeafIndexesFromPath(path[0]),
      this._getLeafIndexesFromPath(path[1]),
    ];
  }

  public getLeafIndexesFromPath(): number | NestedPath {
    return this._getLeafIndexesFromPath(this._path);
  }

  get path() {
    return this._path;
  }
}

function getLeafIndexFromNodeIndex(
  nodeIndex: number,
  maxDepth: number
): number {
  return nodeIndex - (Math.pow(2, maxDepth) - 2);
}

function getNodeIndexFromLeafIndex(leafIndex: number, maxDepth: number) {
  return leafIndex + (Math.pow(2, maxDepth) - 2);
}

function getSiblingIndex(index: number) {
  return index % 2 === 0 ? index + 1 : index - 1;
}

function getParentIndex(index: number) {
  return Math.floor((index - 2) / 2);
}

function generatePathNodesFromIndex(
  index: number,
  maxDepth: number,
  canopyDepth: number,
  depth: number = 0
) {
  const nodes: Node[] = [];
  const siblingIndex = getSiblingIndex(index);
  const node = new Node(siblingIndex, maxDepth, depth);
  node.generatePath();

  nodes.push(node);

  if (depth + 1 < maxDepth - canopyDepth) {
    const parentIndex = getParentIndex(index);
    nodes.push(
      ...generatePathNodesFromIndex(
        parentIndex,
        maxDepth,
        canopyDepth,
        depth + 1
      )
    );
  }

  return nodes;
}
