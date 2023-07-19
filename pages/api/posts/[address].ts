import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";

import { parseBigInt } from "utils/format";
import { queryPosts } from "./index";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { address } = req.query;

  const results = await queryPosts(Prisma.sql`WHERE "Forum"."id" = ${address}`);

  res.json(parseBigInt(results));
}
