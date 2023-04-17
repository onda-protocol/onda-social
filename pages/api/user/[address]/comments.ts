import type { NextApiRequest, NextApiResponse } from "next";

import { parseBigInt } from "utils/format";
import prisma from "lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { address } = req.query;

  const result = await prisma.comment.findMany({
    where: {
      author: address as string,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      Author: true,
      Post: true,
      _count: {
        select: {
          Children: true,
        },
      },
    },
  });

  res.json(parseBigInt(result));
}
