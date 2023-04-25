import type { NextApiRequest, NextApiResponse } from "next";

import { parseBigInt } from "utils/format";
import prisma from "lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { address } = req.query;

  const result = await prisma.post.findMany({
    where: {
      author: address as string | undefined,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      Author: true,
      Forum: true,
      _count: {
        select: {
          Comments: true,
        },
      },
    },
  });

  res.json(parseBigInt(result));
}