import { EnrichedTransaction } from "helius-sdk";
import {
  COMPRESSION_PROGRAM_ID,
  MODERATION_PROGRAM_ID,
  NAMESPACE_PROGRAM_ID,
  AWARDS_PROGRAM_ID,
} from "../anchor/constants";
import { compressionParser } from "./compression";
import { awardsParser } from "./awards";
import { namespaceParser } from "./namespace";

export default async function enhancedTransactionParser(
  transactions: EnrichedTransaction[]
) {
  for (const tx of transactions) {
    for (const ix of tx.instructions) {
      switch (ix.programId) {
        case AWARDS_PROGRAM_ID.toBase58(): {
          await awardsParser(ix);
          break;
        }

        case COMPRESSION_PROGRAM_ID.toBase58(): {
          await compressionParser(ix);
          break;
        }

        case MODERATION_PROGRAM_ID.toBase58(): {
          // Do nothing
          break;
        }

        case NAMESPACE_PROGRAM_ID.toBase58(): {
          await namespaceParser(ix);
          // Do nothing
          break;
        }

        default: {
          // Do nothing
          break;
        }
      }
    }
  }
}
