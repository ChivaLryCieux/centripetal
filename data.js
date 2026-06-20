// data.js — SSE Composite Index (上证指数) live data layer for Centripetal.
//
// The sketch pulls a live quote from a public market endpoint and maps it to
// the centripetal visuals. When the live call fails (offline / network blocked
// / market closed without recent data), it falls back to the bundled
// `sse_index_daily.csv` cached sample, advancing through it as a continuous
// live-style stream so the installation never goes dark.
//
// Live endpoint: Tencent finance quote, returns GBK text shaped as
//   v_sh000001="1~上证指数~000001~4090.48~4108.08~...~20260618161419~-17.60~-0.43~..."
// Field index: 3 = current price, 4 = previous close, 30 = yyyymmddhhmmss,
//              31 = change (points), 32 = change (percent).
// The endpoint sends `Access-Control-Allow-Origin: *`, so a browser fetch works
// cross-origin. Numeric fields are ASCII and parse cleanly despite GBK encoding.

const SSE = (() => {
  const LIVE_URL = 'https://qt.gtimg.cn/q=sh000001';
  const LIVE_POLL_MS = 30000;   // poll a fresh live quote every 30s
  const CACHE_STEP_MS = 3000;   // advance the cached stream one tick every 3s
  const LIVE_STALE_MS = 90000;  // a live reading older than 90s is treated as stale

  let table = null;             // p5.Table loaded from the cached CSV sample
  let cursor = 0;               // current row index in the cached stream
  let observedMin = Infinity;
  let observedMax = -Infinity;

  let lastLiveAttempt = -Infinity;
  let lastCacheStep = 0;
  let lastLiveOk = -Infinity;

  // Exposed, read by the sketch each frame.
  const state = {
    value: 3900,        // latest index value (live or cached)
    change: 0,          // points vs previous reading
    changePct: 0,       // percent vs previous reading
    timestamp: '',      // human-readable reading time
    source: 'cache',    // 'live' | 'cache'
    liveOk: false       // did the most recent live attempt succeed?
  };

  // Called from the sketch's preload(); loadTable is synchronous there.
  function preload() {
    table = loadTable('sse_index_daily.csv', 'csv', 'header');
  }

  // Called once from setup(), after the table is available.
  function init() {
    for (const r of table.getRows()) {
      const c = parseFloat(r.get('close'));
      if (!isNaN(c)) {
        if (c < observedMin) observedMin = c;
        if (c > observedMax) observedMax = c;
      }
    }
    // Seed from the most recent cached row so the screen is never empty.
    cursor = table.getRowCount() - 1;
    const s = rowAt(cursor);
    applyRow(s);
  }

  function rowCount() {
    return table ? table.getRowCount() : 0;
  }

  function rowAt(i) {
    const n = table.getRowCount();
    const r = table.getRow(((i % n) + n) % n);
    const prev = table.getRow((((i - 1) % n) + n) % n);
    const close = parseFloat(r.get('close'));
    const prevClose = parseFloat(prev.get('close'));
    return {
      value: close,
      change: close - prevClose,
      changePct: ((close - prevClose) / prevClose) * 100,
      timestamp: r.get('date'),
      source: 'cache'
    };
  }

  function applyRow(s) {
    state.value = s.value;
    state.change = s.change;
    state.changePct = s.changePct;
    state.timestamp = s.timestamp;
    state.source = s.source;
  }

  // Advance the cached stream by one trading day.
  function stepCursor() {
    cursor = (cursor + 1) % table.getRowCount();
    applyRow(rowAt(cursor));
  }

  // Attempt a live quote. Resolves true on success, false on any failure.
  async function fetchLive() {
    try {
      const res = await fetch(LIVE_URL, { cache: 'no-store' });
      if (!res.ok) return false;
      const txt = await res.text();
      const m = txt.match(/v_sh000001="([^"]*)"/);
      if (!m) return false;
      const f = m[1].split('~');
      const price = parseFloat(f[3]);
      const prevClose = parseFloat(f[4]);
      if (isNaN(price)) return false;

      const dt = f[30] || '';
      let ts = dt;
      if (dt.length === 14) {
        ts = `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)} ` +
             `${dt.slice(8, 10)}:${dt.slice(10, 12)}`;
      }

      const chg = parseFloat(f[31]);
      const chgPct = parseFloat(f[32]);
      state.value = price;
      state.change = isNaN(chg) ? price - prevClose : chg;
      state.changePct = isNaN(chgPct)
        ? ((price - prevClose) / prevClose) * 100
        : chgPct;
      state.timestamp = ts;
      state.source = 'live';
      state.liveOk = true;
      lastLiveOk = millis();
      return true;
    } catch (e) {
      state.liveOk = false;
      return false;
    }
  }

  // Drive the data layer from the sketch's draw() loop.
  function update(now) {
    // A live reading goes stale after LIVE_STALE_MS → drop back to the cache.
    if (state.source === 'live' && now - lastLiveOk > LIVE_STALE_MS) {
      state.source = 'cache';
    }

    // Poll the live endpoint on its cadence.
    if (now - lastLiveAttempt > LIVE_POLL_MS) {
      lastLiveAttempt = now;
      fetchLive().then((ok) => { if (!ok) stepCursor(); });
    }

    // When not freshly live, advance the cached stream so motion continues.
    if (state.source !== 'live' && now - lastCacheStep > CACHE_STEP_MS) {
      lastCacheStep = now;
      stepCursor();
    }

    return state;
  }

  // Normalize a raw index value against the observed cached range → [0, 1].
  function norm(v) {
    if (observedMax <= observedMin) return 0.5;
    return Math.max(0, Math.min(1, (v - observedMin) / (observedMax - observedMin)));
  }

  return {
    preload,
    init,
    update,
    stepCursor,
    fetchLive,
    norm,
    get state() { return state; },
    get observedMin() { return observedMin; },
    get observedMax() { return observedMax; },
    get rowCount() { return rowCount(); },
    LIVE_URL
  };
})();
