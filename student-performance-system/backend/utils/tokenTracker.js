/**
 * tokenTracker.js
 * -------------------------------------------------
 * In-memory Gemini token usage tracker.
 *
 * Limits (conservative for free Gemini 1.5-flash key):
 *   PER_SESSION_LIMIT  – max tokens a single user can burn in one browser session
 *   DAILY_USER_LIMIT   – max tokens per user per calendar day (UTC reset)
 *   DAILY_APP_LIMIT    – app-wide ceiling across all users per day
 *
 * All three are configurable via env vars so you can raise them if you upgrade
 * to a paid key without touching code.
 * -------------------------------------------------
 */

const PER_SESSION_LIMIT = parseInt(process.env.TOKEN_SESSION_LIMIT  || '8000',  10);
const DAILY_USER_LIMIT  = parseInt(process.env.TOKEN_DAILY_USER     || '20000', 10);
const DAILY_APP_LIMIT   = parseInt(process.env.TOKEN_DAILY_APP      || '80000', 10);

/** { userId → { sessionTokens, dailyTokens, lastResetDate } } */
const store = new Map();

/** Running app-wide daily total */
let appDailyTotal = 0;
let appLastResetDate = _todayKey();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _todayKey() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function _getOrCreate(userId) {
  if (!store.has(userId)) {
    store.set(userId, {
      sessionTokens: 0,
      dailyTokens:   0,
      lastResetDate: _todayKey()
    });
  }
  return store.get(userId);
}

function _resetIfNewDay(entry) {
  const today = _todayKey();
  if (entry.lastResetDate !== today) {
    entry.dailyTokens   = 0;
    entry.lastResetDate = today;
  }
  // Also reset app-wide counter on new day
  if (appLastResetDate !== today) {
    appDailyTotal   = 0;
    appLastResetDate = today;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check whether a user is allowed to make a Gemini call.
 * Returns { allowed: bool, reason: string|null }
 */
function canUseTokens(userId) {
  const entry = _getOrCreate(userId);
  _resetIfNewDay(entry);

  if (appDailyTotal >= DAILY_APP_LIMIT) {
    return { allowed: false, reason: 'app_daily_limit', message: 'Daily AI limit reached for this application. Resets at midnight UTC.' };
  }
  if (entry.dailyTokens >= DAILY_USER_LIMIT) {
    return { allowed: false, reason: 'user_daily_limit', message: 'You have reached your daily AI token limit. Resets at midnight UTC.' };
  }
  if (entry.sessionTokens >= PER_SESSION_LIMIT) {
    return { allowed: false, reason: 'session_limit', message: 'Session token limit reached. Start a new session or wait until midnight.' };
  }

  return { allowed: true };
}

/**
 * Record token usage after a successful Gemini call.
 * @param {string} userId
 * @param {number} tokensUsed  – value from Gemini usageMetadata.totalTokenCount
 */
function recordUsage(userId, tokensUsed) {
  if (!tokensUsed || tokensUsed <= 0) return;

  const entry = _getOrCreate(userId);
  _resetIfNewDay(entry);

  entry.sessionTokens += tokensUsed;
  entry.dailyTokens   += tokensUsed;
  appDailyTotal       += tokensUsed;
}

/**
 * Reset the session counter for a user (call when user logs out or starts fresh).
 */
function resetSession(userId) {
  const entry = _getOrCreate(userId);
  entry.sessionTokens = 0;
}

/**
 * Get current usage stats for a user.
 * Returns an object suitable for the frontend widget.
 */
function getUsage(userId) {
  const entry = _getOrCreate(userId);
  _resetIfNewDay(entry);

  return {
    session: {
      used:  entry.sessionTokens,
      limit: PER_SESSION_LIMIT,
      pct:   Math.min(Math.round((entry.sessionTokens / PER_SESSION_LIMIT) * 100), 100)
    },
    daily: {
      used:  entry.dailyTokens,
      limit: DAILY_USER_LIMIT,
      pct:   Math.min(Math.round((entry.dailyTokens / DAILY_USER_LIMIT) * 100), 100)
    },
    app: {
      used:  appDailyTotal,
      limit: DAILY_APP_LIMIT,
      pct:   Math.min(Math.round((appDailyTotal / DAILY_APP_LIMIT) * 100), 100)
    },
    resetDate: entry.lastResetDate
  };
}

module.exports = { canUseTokens, recordUsage, resetSession, getUsage };
