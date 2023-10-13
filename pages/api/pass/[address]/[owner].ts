import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "lib/prisma";
import { findPass } from "lib/api/pass";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const params = req.query;
  const forumId = params.address as string;
  const owner = params.owner as string;

  const result = await prisma.forum.findUnique({
    where: {
      id: forumId,
    },
    include: {
      Gates: true,
    },
  });

  if (!result) {
    return res.status(401).json({ error: "Forum not found" });
  }

  const pass = await findPass(result.Gates, owner);

  if (result.Gates.length && pass === undefined) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.status(200).json(pass);
}
