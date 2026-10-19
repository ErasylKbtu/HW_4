export const DATA_KEY = 'studyflow-assignments-v1';

export const NETWORK_PROFILES = {
  normal: { minDelay: 400, maxDelay: 1400, errorChance: 0.06 },
  slow: { minDelay: 1800, maxDelay: 4200, errorChance: 0 },
  reliable: { minDelay: 150, maxDelay: 450, errorChance: 0 },
  offline: { minDelay: 400, maxDelay: 800, errorChance: 1 },
};

export const API_CONFIG = { ...NETWORK_PROFILES.normal };

export function setNetworkProfile(profile) {
  if (!NETWORK_PROFILES[profile]) throw new Error('Unknown network profile.');
  Object.assign(API_CONFIG, NETWORK_PROFILES[profile]);
}
