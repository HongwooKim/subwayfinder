import type { Station } from "../stations";
import type { CityId } from "../cities";
import { stations as seoulStations, LINE_COLORS as seoulLineColors } from "./seoul";
import { stations as tokyoStations, LINE_COLORS as tokyoLineColors } from "./tokyo";
import { stations as newyorkStations, LINE_COLORS as newyorkLineColors } from "./newyork";
import { stations as londonStations, LINE_COLORS as londonLineColors } from "./london";
import { stations as parisStations, LINE_COLORS as parisLineColors } from "./paris";
import { stations as beijingStations, LINE_COLORS as beijingLineColors } from "./beijing";

export const cityStations: Record<CityId, Station[]> = {
  seoul: seoulStations,
  tokyo: tokyoStations,
  newyork: newyorkStations,
  london: londonStations,
  paris: parisStations,
  beijing: beijingStations,
};

export const cityLineColors: Record<CityId, Record<string, string>> = {
  seoul: seoulLineColors,
  tokyo: tokyoLineColors,
  newyork: newyorkLineColors,
  london: londonLineColors,
  paris: parisLineColors,
  beijing: beijingLineColors,
};
