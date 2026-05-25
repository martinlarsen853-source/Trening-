// Ordered from most-specific to least-specific so longer patterns win
const PATTERNS: [string, string][] = [
  ['idrettshall',      'idrettshall'],
  ['idrettsbane',      'idrettshall'],
  ['aktivitetsrom',    'idrettshall'],
  ['skyterom',         'idrettshall'],
  ['svømmehall',       'svommehall'],
  ['basseng',          'svommehall'],
  ['svømming',         'svommehall'],
  ['gymsal',           'gymsal'],
  ['ridehall',         'ridehall'],
  ['riddercamp',       'ridehall'],
  ['ridning',          'ridehall'],
  ['sykling',          'ridehall'],
  ['sykkelstall',      'stall'],
  ['sykkel',           'stall'],
  ['stall',            'stall'],
  ['matsalen',         'spisesal'],
  ['matsal',           'spisesal'],
  ['spisesal',         'spisesal'],
  ['personalkantina',  'spisesal'],
  ['formingsrom',      'familiehus'],
  ['lekerom',          'familiehus'],
  ['familiehus',       'familiehus'],
  ['kongens',          'paviljongen'],
  ['paviljongen',      'paviljongen'],
  ['paviljong',        'paviljongen'],
  ['skole',            'skole'],
  ['lege',             'lege'],
  ['hjelpemiddelbygg', 'hjelpemiddelbygg'],
  ['hovedbygg',        'hovedbygg'],
];

export function getBuilding(location: string | null | undefined, fallbackName?: string | null): string | undefined {
  for (const str of [location, fallbackName]) {
    if (!str) continue;
    const lower = str.toLowerCase();
    for (const [key, id] of PATTERNS) {
      if (lower.includes(key)) return id;
    }
  }
  return undefined;
}

// Kept for any legacy direct lookups
export const LOCATION_TO_BUILDING: Record<string, string> = Object.fromEntries(PATTERNS);
