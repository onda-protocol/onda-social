import type { NextApiRequest, NextApiResponse } from "next";
import { findPass } from "lib/api/pass";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const params = req.query;
  const forumId = params.address as string;
  const owner = params.owner as string;

  try {
    const result = await findPass(forumId, owner);
    if (result) {
      return res.status(200).json(result);
    }
    return res.status(404).json({ error: "Access denied" });
  } catch (err) {
    return res.status(400).json({
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
