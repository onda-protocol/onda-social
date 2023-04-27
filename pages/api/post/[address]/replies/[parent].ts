import type { NextApiRequest, NextApiResponse } from "next";

import { parseBigInt } from "utils/format";
import prisma from "lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { address, parent, skip = "0" } = req.query;
  console.log("SKIP: ", skip);
  const result = await prisma.comment.findMany({
    skip: parseInt(skip as string),
    where: {
      post: address as string,
      parent: parent as string,
    },
    orderBy: {
      likes: "desc",
    },
    include: {
      Author: true,
      Children: {
        take: 10,
        orderBy: {
          likes: "desc",
        },
        include: {
          Author: true,
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
