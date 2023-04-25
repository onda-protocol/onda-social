import type { NextApiRequest, NextApiResponse } from "next";

import { parseBigInt } from "utils/format";
import prisma from "lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { address } = req.query;

  const result = await prisma.post.findUnique({
    where: {
      id: address as string,
    },
    include: {
      Forum: true,
      Author: true,
      _count: {
        select: {
          Comments: true,
        },
      },
    },
  });

  res.json(parseBigInt(result));
}