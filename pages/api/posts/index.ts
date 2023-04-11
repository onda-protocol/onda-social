import type { NextApiRequest, NextApiResponse } from "next";

import { parseBigInt } from "utils/format";
import prisma from "lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const result = await prisma.post.findMany({
    include: {
      _count: {
        select: {
          Comments: true,
        },
      },
    },
  });

  res.json(parseBigInt(result));
}
