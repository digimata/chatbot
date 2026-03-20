type Entitlements = {
  maxMessagesPerHour: number;
};

export const entitlementsByIsAnonymous: Record<string, Entitlements> = {
  true: {
    maxMessagesPerHour: 10,
  },
  false: {
    maxMessagesPerHour: 10,
  },
};
