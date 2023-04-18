import type { NextApiRequest, NextApiResponse } from "next";

import { parseBigInt } from "utils/format";
import prisma from "lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { address } = req.query;

  const result = await prisma.user.findUnique({
    where: {
      id: address as string,
    },
  });

  res.json(parseBigInt(result));
}
