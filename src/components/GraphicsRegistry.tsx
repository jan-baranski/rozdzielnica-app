"use client";

import dynamic from "next/dynamic";

const Blank1P = dynamic(() => import("./graphics/blank-1p"));
const Blank2P = dynamic(() => import("./graphics/blank-2p"));
const Blank3P = dynamic(() => import("./graphics/blank-3p"));
const IndicatorGreen = dynamic(() => import("./graphics/indicator-green"));
const IndicatorRed = dynamic(() => import("./graphics/indicator-red"));
const IndicatorYellow = dynamic(() => import("./graphics/indicator-yellow"));
const Mcb1pB10 = dynamic(() => import("./graphics/mcb-1p-b10"));
const Mcb1pB16 = dynamic(() => import("./graphics/mcb-1p-b16"));
const Mcb1pB20 = dynamic(() => import("./graphics/mcb-1p-b20"));
const Mcb1pB25 = dynamic(() => import("./graphics/mcb-1p-b25"));
const Mcb1pC16 = dynamic(() => import("./graphics/mcb-1p-c16"));
const Mcb1pC20 = dynamic(() => import("./graphics/mcb-1p-c20"));
const Mcb3pB16 = dynamic(() => import("./graphics/mcb-3p-b16"));
const Mcb3pB20 = dynamic(() => import("./graphics/mcb-3p-b20"));
const Mcb3pB25 = dynamic(() => import("./graphics/mcb-3p-b25"));
const Mcb3pC16 = dynamic(() => import("./graphics/mcb-3p-c16"));
const Mcb3pC20 = dynamic(() => import("./graphics/mcb-3p-c20"));
const Rcd2p40a30ma = dynamic(() => import("./graphics/rcd-2p-40a-30ma"));
const Rcd4p40a30ma = dynamic(() => import("./graphics/rcd-4p-40a-30ma"));
const Rcbo1pB16_30ma = dynamic(() => import("./graphics/rcbo-1p-b16-30ma"));
const Rcbo1pC16_30ma = dynamic(() => import("./graphics/rcbo-1p-c16-30ma"));
const Isolator4p63a = dynamic(() => import("./graphics/isolator-4p-63a"));
const Spd3p = dynamic(() => import("./graphics/spd-3p"));
const BusN = dynamic(() => import("./graphics/bus-n"));
const BusPe = dynamic(() => import("./graphics/bus-pe"));
const ExternalBulb = dynamic(() => import("./graphics/external-bulb"));
const ExternalOutlet = dynamic(() => import("./graphics/external-outlet"));

export const graphicsRegistry: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  "blank-module": Blank1P,
  "mcb-1p-b10": Mcb1pB10,
  "mcb-1p-b16": Mcb1pB16,
  "mcb-1p-b20": Mcb1pB20,
  "mcb-1p-b25": Mcb1pB25,
  "mcb-1p-c16": Mcb1pC16,
  "mcb-1p-c20": Mcb1pC20,
  "mcb-3p": Mcb3pB16,
  "rcd-2p-40a-30ma": Rcd2p40a30ma,
  "rcd-4p": Rcd4p40a30ma,
  "rcbo-1pn": Rcbo1pB16_30ma,
  "spd-type2-4p": Spd3p, 
  "main-switch-4p": Isolator4p63a, 
  "generic-n-bus-8": BusN,
  "generic-pe-bus-8": BusPe,
  "external-bulb": ExternalBulb,
  "external-outlet": ExternalOutlet,
};
