import path from "path";

const SYMBOL = "GLASS";
const NAME = "The Gigabrain Glass Eater";
const DESCRIPTION = "Nobody knowns why these mysterious creatures eat glass.";
const IMAGE = path.join(__dirname, "../public/glasseater-dark.png");
const MATCHING_AWARD = "GJ5eFxBGsf2wmKcQRGRNhbj93sdynSwy1DQwaqYxcxu3";

interface Award {
  name: string;
  description: string;
  symbol: string;
  image: string;
  public: boolean;
  matchingAward?: string;
}

const award: Award = {
  name: "Chewed Glass",
  description: "Glass: thoroughly chewed.",
  symbol: "GLASS",
  image: path.join(__dirname, "../public/glass.png"),
  public: false,
};

export default award;
