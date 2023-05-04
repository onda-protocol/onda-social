import type { NextApiRequest, NextApiResponse } from "next";

import { parseBigInt } from "utils/format";
import prisma from "lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const address = req.query.address as string;
  const parent = typeof req.query.parent === "string" ? req.query.parent : null;
  const limit = Number(req.query.limit) || 100;
  const offset = Number(req.query.offset) || 0;

  const result = await prisma.comment.findMany({
    where: {
      parent,
      post: address as string,
    },
    orderBy: {
      likes: "desc",
    },
    take: limit,
    skip: offset,
    include: {
      Author: true,
      Children: {
        take: 3,
        orderBy: {
          likes: "desc",
        },
        include: {
          Author: true,
          Children: {
            take: 3,
            orderBy: {
              likes: "desc",
            },
            include: {
              Author: true,
              Children: {
                take: 3,
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
          },
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
  console.log("result: ", result);
  res.json(parseBigInt(result));
}
