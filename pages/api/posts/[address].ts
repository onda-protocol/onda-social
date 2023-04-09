import type { NextApiRequest, NextApiResponse } from "next";

import prisma from "../../../lib/prisma";

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

  res.json(
    JSON.parse(
      JSON.stringify(result, (_, v) =>
        typeof v === "bigint" ? v.toString() : v
      )
    )
  );
}
