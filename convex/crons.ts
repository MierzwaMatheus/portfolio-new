import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Clean up expired proposal sessions daily
crons.daily(
  'cleanupExpiredSessions',
  { hourUTC: 3, minuteUTC: 0 },
  internal.proposals.cleanupExpiredSessions,
);

// Clean up expired rate limit entries daily
crons.daily(
  'cleanupExpiredRateLimits',
  { hourUTC: 3, minuteUTC: 15 },
  internal.rateLimit.cleanupExpired,
);

// Clean up expired audit logs weekly
crons.weekly(
  'cleanupExpiredAuditLogs',
  { dayOfWeek: 'sunday', hourUTC: 4, minuteUTC: 0 },
  internal.audit.cleanupExpired,
);

// Expire pending checkouts hourly
crons.hourly(
  'expirePendingCheckouts',
  { minuteUTC: 30 },
  internal.checkouts.expireOldCheckouts,
);

// Anonymize old IPs in audit log (90+ days) daily
crons.daily(
  'anonymizeOldIps',
  { hourUTC: 2, minuteUTC: 0 },
  internal.audit.anonymizeOldIps,
);

export default crons;
