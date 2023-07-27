import type { NextApiRequest, NextApiResponse } from "next";
import * as cheerio from "cheerio";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const url = req.query.url as string;

  if (typeof url !== "string") {
    return res.status(400).send("Bad Request");
  }

  const html = await fetch(url).then((res) => res.text());
  const $ = cheerio.load(html);
  const ogData: Record<string, string> = {};

  $('meta[property^="og"]').each((_, element) => {
    const property = $(element).attr("property");
    const content = $(element).attr("content");
    if (property && content) {
      const key = property.replace("og:", "");
      ogData[key] = content;
    }
  });

  res.json(ogData);
}
