import GITHUB from "./github";
import GOOGLE from "./google";

const PASSPORT_STRATEGIES = { GITHUB, GOOGLE };

export type Strategies = keyof typeof PASSPORT_STRATEGIES;

export default PASSPORT_STRATEGIES;
