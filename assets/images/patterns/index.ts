/** Bundled header pattern SVG xml strings (Hero Patterns CC BY 4.0 / pattern.monster MIT) */

import circuitBoardXml from './circuit-board';
import topographyXml from './topography';
import wavesXml from './waves';
import hexagonMonsterXml from './hexagon-monster';
import graphPaperXml from './graph-paper';
import architectXml from './architect';
import hexagonsXml from './hexagons';
import hideoutXml from './hideout';
import connectionsXml from './connections';
import diagonalLinesXml from './diagonal-lines';
import overlappingCirclesXml from './overlapping-circles';
import signalXml from './signal';
import floatingCogsXml from './floating-cogs';
import iLikeFoodXml from './i-like-food';
import lipsXml from './lips';
import deathStarXml from './death-star';
import eyesXml from './eyes';
import anchorsAwayXml from './anchors-away';
import pianoManXml from './piano-man';
import kiwiXml from './kiwi';
import stampCollectionXml from './stamp-collection';
import leafXml from './leaf';
import volcanoLampXml from './volcano-lamp';
import charlieBrownXml from './charlie-brown';
import jigsawXml from './jigsaw';

export type HeroPattern = { name: string; license: string; xml: string };

export const HERO_PATTERNS: HeroPattern[] = [
  { name: "Circuit Board", license: "heropatterns", xml: circuitBoardXml },
  { name: "Topography", license: "heropatterns", xml: topographyXml },
  { name: "Waves", license: "pattern.monster", xml: wavesXml },
  { name: "Hexagon Monster", license: "pattern.monster", xml: hexagonMonsterXml },
  { name: "Graph Paper", license: "heropatterns", xml: graphPaperXml },
  { name: "Architect", license: "heropatterns", xml: architectXml },
  { name: "Hexagons", license: "heropatterns", xml: hexagonsXml },
  { name: "Hideout", license: "heropatterns", xml: hideoutXml },
  { name: "Connections", license: "heropatterns", xml: connectionsXml },
  { name: "Diagonal Lines", license: "heropatterns", xml: diagonalLinesXml },
  { name: "Overlapping Circles", license: "heropatterns", xml: overlappingCirclesXml },
  { name: "Signal", license: "heropatterns", xml: signalXml },
  { name: "Floating Cogs", license: "heropatterns", xml: floatingCogsXml },
  { name: "I Like Food", license: "heropatterns", xml: iLikeFoodXml },
  { name: "Lips", license: "heropatterns", xml: lipsXml },
  { name: "Death Star", license: "heropatterns", xml: deathStarXml },
  { name: "Eyes", license: "heropatterns", xml: eyesXml },
  { name: "Anchors Away", license: "heropatterns", xml: anchorsAwayXml },
  { name: "Piano Man", license: "heropatterns", xml: pianoManXml },
  { name: "Kiwi", license: "heropatterns", xml: kiwiXml },
  { name: "Stamp Collection", license: "heropatterns", xml: stampCollectionXml },
  { name: "Leaf", license: "heropatterns", xml: leafXml },
  { name: "Volcano Lamp", license: "heropatterns", xml: volcanoLampXml },
  { name: "Charlie Brown", license: "heropatterns", xml: charlieBrownXml },
  { name: "Jigsaw", license: "heropatterns", xml: jigsawXml },
];

export default HERO_PATTERNS;
