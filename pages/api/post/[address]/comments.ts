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
      post: address as string,
      parent: null,
    },
    include: {
      Children: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: {
              Children: true,
            },
          },
        },
      },
      _count: {
        select: {
          Children: true,
        },
      },
    },
  });

  res.json(parseBigInt(result));
}
