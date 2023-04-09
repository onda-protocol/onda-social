import type { NextApiRequest, NextApiResponse } from "next";

import * as utils from "../../../../common/utils";
import prisma from "../../../../common/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { address } = req.query;

  const result = await prisma.entry.findMany({
    where: {
      forum: address as string,
      parent: null,
    },
    include: {
      Children: false,
    },
  });

  res.json(utils.parseBigInts(result));
}
