import type { NextApiRequest, NextApiResponse } from "next";

import prisma from "../../../lib/prisma";

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

  res.json(
    JSON.parse(
      JSON.stringify(result, (_, v) =>
        typeof v === "bigint" ? v.toString() : v
      )
    )
  );
}
