// Pardon Run — every tuning number for the game lives here: the field, the turkey, the farmer,
// the three stages of the escape (farmyard, barnyard, kitchen) and how fast the run gets.

export const VIEW = { width: 1280, height: 800 };
export const GROUND_Y = 648;
export const STEP = 1 / 60;
export const METER_PX = 40; // screen pixels that make one metre of distance

export const ESCAPE_METERS = 1150; // reach the Freedom Fence at this distance and the turkey is pardoned

export const TURKEY = {
  x: 392, // the turkey's fixed screen position; the world scrolls past it
  width: 96,
  height: 80,
  duckHeight: 50,
  gravity: 2500,
  jumpVelocity: 990,
  flapVelocity: 850, // the second, mid-air jump is a wing flap and a little weaker
  maxJumps: 2,
};

export const FARMER = {
  startGap: 300, // pixels behind the turkey when the run starts
  maxGap: 460,
  grabGap: 44, // at this gap his hand lands on the turkey: caught
  recoverPerSecond: 9, // a clean run slowly opens the gap again
  stumbleLoss: 118, // gap lost when the turkey trips on an obstacle
  knifeLoss: 78, // gap lost when a carving knife connects
  width: 86,
  height: 140,
};

export const RUN = {
  baseSpeed: 305, // px/s at the first fence post
  topSpeed: 585, // px/s in the kitchen, with the ovens lit
  rampMeters: 1050, // distance over which the speed climbs from base to top
  startLives: 3,
  invincibleSeconds: 1.25,
};

// The escape in three acts. `until` is the distance in metres where the stage ends.
export const STAGES = [
  { until: 350, name: 'THE FARMYARD', knifeEvery: 3.4, ovenChance: 0 },
  { until: 750, name: 'THE BARNYARD', knifeEvery: 2.8, ovenChance: 0.16 },
  { until: ESCAPE_METERS, name: 'THE KITCHEN', knifeEvery: 2.2, ovenChance: 0.46 },
];

export const SCORE = { perMeter: 1, corn: 50, pumpkin: 150, goldCorn: 300 };

export const KIND = {
  HAY: 'hay',
  CRATE: 'crate',
  FENCE: 'fence',
  BARREL: 'barrel',
  OVEN: 'oven',
  KNIFE_HIGH: 'knifeHigh', // flies at head height: duck
  KNIFE_LOW: 'knifeLow', // skims the ground: jump
  CORN: 'corn',
  PUMPKIN: 'pumpkin',
  GOLD_CORN: 'goldCorn',
};

export const EVENT = { JUMP: 1, FLAP: 2, HIT: 4, PICKUP: 8, KNIFE_THROW: 16, OVER: 32, ESCAPED: 64, STAGE: 128 };
