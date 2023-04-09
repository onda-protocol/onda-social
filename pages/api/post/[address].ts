import type { NextApiRequest, NextApiResponse } from "next";

import prisma from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { address } = req.query;

  const result = await prisma.entry.findMany({
    where: {
      id: address as string,
    },
    include: {
      Children: {
        include: {
          Children: true,
        },
      },
    },
  });

  res.json(result);
}
