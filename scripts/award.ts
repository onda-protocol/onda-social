import path from "path";
import { web3 } from "@project-serum/anchor";

interface Award {
  amount: number;
  feeBasisPoints: number;
  name: string;
  description: string;
  symbol: string;
  image: string;
  public: boolean;
  matchingAward?: string;
}

const chewedGlass: Award = {
  amount: 0,
  feeBasisPoints: 0,
  name: "Chewed Glass",
  description: "Glass: thoroughly chewed.",
  symbol: "GLASS",
  image: path.join(__dirname, "../public/glass.png"),
  public: false,
};

const gigbrain: Award = {
  amount: Math.floor(web3.LAMPORTS_PER_SOL * 0.069),
  feeBasisPoints: 2000,
  name: "Gigabrain Glasseater",
  description: "Nobody knowns why these mysterious creatures eat glass..",
  symbol: "GIGABRAIN",
  image: path.join(__dirname, "../public/glasseater-dark.png"),
  public: true,
  matchingAward: "HmXcrU6FFTVgjPP15c1iy9JhCWyRrMKzPdNZ69TEXdt5",
};

export default gigbrain;
