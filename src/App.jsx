import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getStatus,
  startBot,
  stopBot,
  getSignals,
  getSignalLogs,
  getTrades,
  getOpenTrades,
  getClosedTrades,
  getSettings,
  updateSettings,
  getAccount,
} from './api';
import './App.css';
import Logo from './Logo';

const PAGE_SIZE = 10;

const MENUS = [
  { id: 'logs', label: 'Signal Log' },
  { id: 'signals', label: 'Signals' },
  { id: 'running', label: 'Running Trades' },
  { id: 'closed', label: 'Closing Trades' },
  { id: 'growth', label: 'Fund Growth' },
];

function formatTime(t) {
  if (!t) return '—';
  return new Date(t).toLocaleString();
}

function BoolCell({ value }) {
  if (value === true) return <span className="buy">Yes</span>;
  if (value === false) return <span className="sell">No</span>;
  return '—';
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);
  return (
    <div className="pagination">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ‹
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={p === page ? 'active' : ''}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        ›
      </button>
    </div>
  );
}

function LogsTable({ rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Signal</th>
            <th>RVOL</th>
            <th>Vol Exp</th>
            <th>Range</th>
            <th>ATR</th>
            <th>Candle</th>
            <th>Price</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={9}>কোনো লগ নেই</td>
            </tr>
          )}
          {rows.map((l) => (
            <tr key={l._id || l.id}>
              <td>{formatTime(l.time || l.createdAt)}</td>
              <td className={l.hasSignal ? 'buy' : 'sell'}>
                {l.hasSignal ? 'YES' : 'NO'}
              </td>
              <td>{l.rvol ?? '—'}</td>
              <td>{l.volExpansion ?? '—'}</td>
              <td>
                <BoolCell value={l.rangeBreakout} />
              </td>
              <td>
                <BoolCell value={l.atrExpanding} />
              </td>
              <td
                className={
                  l.candleDir === 'BUY'
                    ? 'buy'
                    : l.candleDir === 'SELL'
                    ? 'sell'
                    : ''
                }
              >
                {l.candleDir ?? '—'}
              </td>
              <td>{l.price ?? '—'}</td>
              <td className="reason">{l.reason ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SignalsTable({ rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Direction</th>
            <th>Price</th>
            <th>RVOL</th>
            <th>SL</th>
            <th>TP</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={6}>কোনো সিগন্যাল নেই</td>
            </tr>
          )}
          {rows.map((s) => {
            const dir = s.direction || s.action;
            return (
              <tr key={s._id || s.id}>
                <td>{formatTime(s.time || s.createdAt)}</td>
                <td className={dir === 'BUY' ? 'buy' : 'sell'}>{dir}</td>
                <td>{s.price ?? '—'}</td>
                <td>{s.rvol ?? '—'}</td>
                <td>{s.sl ?? '—'}</td>
                <td>{s.tp ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TradesTable({ rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Symbol</th>
            <th>Type</th>
            <th>Lot</th>
            <th>Open</th>
            <th>Close</th>
            <th>Profit</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={8}>কোনো ট্রেড নেই</td>
            </tr>
          )}
          {rows.map((t) => (
            <tr key={t._id || t.id || t.ticket}>
              <td>{formatTime(t.closeTime || t.openTime || t.createdAt)}</td>
              <td>{t.symbol ?? '—'}</td>
              <td className={t.type === 'BUY' ? 'buy' : 'sell'}>{t.type}</td>
              <td>{t.lot ?? '—'}</td>
              <td>{t.openPrice ?? '—'}</td>
              <td>{t.closePrice ?? '—'}</td>
              <td className={Number(t.profit) >= 0 ? 'buy' : 'sell'}>
                {t.profit ?? '—'}
              </td>
              <td>{t.status ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FundGrowthChart({ trades }) {
  const points = useMemo(() => {
    const closed = [...trades]
      .filter((t) => t.status !== 'open')
      .sort(
        (a, b) =>
          new Date(a.closeTime || a.createdAt || 0) -
          new Date(b.closeTime || b.createdAt || 0)
      );
    let cum = 0;
    const series = closed.map((t, i) => {
      cum += Number(t.profit) || 0;
      return { i, cum: +cum.toFixed(2) };
    });
    if (series.length === 0) return [{ i: 0, cum: 0 }];
    return series;
  }, [trades]);

  const width = 640;
  const height = 200;
  const pad = 24;
  const vals = points.map((p) => p.cum);
  const min = Math.min(0, ...vals);
  const max = Math.max(0, ...vals);
  const range = max - min || 1;

  const coords = points.map((p, idx) => {
    const x =
      pad +
      (points.length === 1
        ? (width - pad * 2) / 2
        : (idx / (points.length - 1)) * (width - pad * 2));
    const y = height - pad - ((p.cum - min) / range) * (height - pad * 2);
    return { x, y, ...p };
  });

  const line = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const area =
    coords.length > 0
      ? `${pad},${height - pad} ${line} ${coords[coords.length - 1].x},${height - pad}`
      : '';
  const last = points[points.length - 1]?.cum ?? 0;
  const closedCount = trades.filter((t) => t.status !== 'open').length;

  return (
    <div className="chart-card">
      <div className="chart-head">
        <h3>Fund Growth</h3>
        <span className={last >= 0 ? 'buy' : 'sell'}>
          {last >= 0 ? '+' : ''}
          {last} USD
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="growth-svg">
        <defs>
          <linearGradient id="fundFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,200,83,0.35)" />
            <stop offset="100%" stopColor="rgba(0,200,83,0)" />
          </linearGradient>
        </defs>
        <line
          x1={pad}
          x2={width - pad}
          y1={height - pad - ((0 - min) / range) * (height - pad * 2)}
          y2={height - pad - ((0 - min) / range) * (height - pad * 2)}
          stroke="#2f3b4c"
          strokeDasharray="4 4"
        />
        {area && <polygon points={area} fill="url(#fundFill)" />}
        <polyline
          points={line}
          fill="none"
          stroke="#00c853"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coords.map((c) => (
          <circle key={c.i} cx={c.x} cy={c.y} r="3.5" fill="#00c853" />
        ))}
      </svg>
      <p className="chart-hint">
        {closedCount === 0
          ? 'ক্লোজড ট্রেড এলে গ্রোথ দেখাবে'
          : `Closed trades: ${closedCount}`}
      </p>
    </div>
  );
}

function RobotHero({ running }) {
  return (
    <div className={`robot-hero ${running ? 'is-running' : ''}`}>
      <div className="robot">
        <div className="robot-antenna">
          <span className="robot-antenna-dot" />
        </div>
        <div className="robot-head">
          <div className="robot-face">
            <span className="robot-eye left" />
            <span className="robot-eye right" />
          </div>
          <div className="robot-mouth" />
        </div>
        <div className="robot-body">
          <div className="robot-chest-light" />
        </div>
        <div className="robot-arms">
          <span className="robot-arm left" />
          <span className="robot-arm right" />
        </div>
      </div>
      <p className="robot-caption">
        {running ? 'Bot is scanning markets…' : 'Bot is idle'}
      </p>
    </div>
  );
}

function Modal({ title, open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function usePagination(items) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [items.length, totalPages, page]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  return { page, setPage, totalPages, pageItems };
}

export default function App() {
  const [status, setStatus] = useState(null);
  const [signals, setSignals] = useState([]);
  const [logs, setLogs] = useState([]);
  const [trades, setTrades] = useState([]);
  const [openTradesList, setOpenTradesList] = useState([]);
  const [closedTradesList, setClosedTradesList] = useState([]);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);

  const [lotSize, setLotSize] = useState(0.01);
  const [lotInput, setLotInput] = useState('0.01');
  const [lotMsg, setLotMsg] = useState('');
  const [lotLoaded, setLotLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setError('');
      const [s, sig, logList, tr, openTr, closedTr, settings, acc] =
        await Promise.all([
          getStatus(),
          getSignals(),
          getSignalLogs(),
          getTrades().catch(() => []),
          getOpenTrades().catch(() => []),
          getClosedTrades().catch(() => []),
          getSettings().catch(() => null),
          getAccount().catch(() => null),
        ]);

      setStatus(s);
      setSignals(Array.isArray(sig) ? sig : []);
      setLogs(Array.isArray(logList) ? logList : []);

      const allTrades = Array.isArray(tr) ? tr : [];
      setTrades(allTrades);

      setOpenTradesList(
        Array.isArray(openTr)
          ? openTr
          : allTrades.filter((t) => t.status === 'open')
      );
      setClosedTradesList(
        Array.isArray(closedTr)
          ? closedTr
          : allTrades.filter((t) => t.status !== 'open')
      );

      if (acc) setAccount(acc);

      if (settings?.lotSize != null) {
        setLotSize(settings.lotSize);
        setLotLoaded((prev) => {
          if (!prev) setLotInput(String(settings.lotSize));
          return true;
        });
      }
    } catch {
      setError('API কানেক্ট হয়নি। server চালু আছে কিনা দেখো (port 4000)।');
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [refresh]);

  async function onStart() {
    setLoading(true);
    setMsg('');
    try {
      const r = await startBot();
      setMsg(r.message || 'Started');
      await refresh();
    } catch (e) {
      setMsg(e.message);
    }
    setLoading(false);
  }

  async function onStop() {
    setLoading(true);
    setMsg('');
    try {
      const r = await stopBot();
      setMsg(r.message || 'Stopped');
      await refresh();
    } catch (e) {
      setMsg(e.message);
    }
    setLoading(false);
  }

  async function onSaveLot(e) {
    e.preventDefault();
    setLotMsg('');
    try {
      const r = await updateSettings({ lotSize: parseFloat(lotInput) });
      setLotSize(r.lotSize);
      setLotInput(String(r.lotSize));
      setLotMsg(`Saved: ${r.lotSize}`);
    } catch (err) {
      setLotMsg(err.response?.data?.error || err.message);
    }
  }

  const running = !!status?.running;

  const homeLogs = usePagination(logs);
  const modalLogs = usePagination(logs);
  const modalSignals = usePagination(signals);
  const modalRunning = usePagination(openTradesList);
  const modalClosed = usePagination(closedTradesList);

  useEffect(() => {
    if (modal === 'logs') modalLogs.setPage(1);
    if (modal === 'signals') modalSignals.setPage(1);
    if (modal === 'running') modalRunning.setPage(1);
    if (modal === 'closed') modalClosed.setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal]);

  return (
    <div className="app">
      <div className="bg-animated" aria-hidden="true">
        <div className="bg-grid" />
        <div className="bg-glow bg-glow-1" />
        <div className="bg-glow bg-glow-2" />
        <div className="bg-glow bg-glow-3" />
        <div className="bg-particles">
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} className="particle" style={{ '--i': i }} />
          ))}
        </div>
      </div>

      <div className="app-content">
        <header className="app-header">
          <div className="brand">
            <Logo size={42} />
            <div>
              <h1>Voltrix</h1>
              <span className="tagline">Volume intelligence bot</span>
            </div>
          </div>
          <div className={`badge ${running ? 'on' : 'off'}`}>
            {running ? '● RUNNING' : '○ STOPPED'}
          </div>
        </header>

        <RobotHero running={running} />

        {error && <div className="banner error">{error}</div>}

        <section className="controls">
          <button
            className="btn start"
            onClick={onStart}
            disabled={loading || running}
          >
            Start
          </button>
          <button
            className="btn stop"
            onClick={onStop}
            disabled={loading || !running}
          >
            Stop
          </button>
          {msg && <span className="msg">{msg}</span>}
        </section>

        <section className="settings-card">
          <h3>Lot Size</h3>
          <form className="lot-form" onSubmit={onSaveLot}>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={lotInput}
              onChange={(e) => setLotInput(e.target.value)}
            />
            <button type="submit" className="btn start">
              Save
            </button>
            <span className="msg">Current: {lotSize}</span>
            {lotMsg && <span className="msg">{lotMsg}</span>}
          </form>
        </section>

        <nav className="menu">
          {MENUS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`menu-btn ${modal === m.id ? 'active' : ''}`}
              onClick={() => setModal(m.id)}
            >
              {m.label}
              {m.id === 'running' && openTradesList.length > 0
                ? ` (${openTradesList.length})`
                : ''}
              {m.id === 'closed' && closedTradesList.length > 0
                ? ` (${closedTradesList.length})`
                : ''}
            </button>
          ))}
        </nav>

        {/* Balance, Equity, P/L, Open Trades */}
        <section className="cards">
          <div className="card">
            <h3>Balance</h3>
            <p className="big">
              {account?.balance != null
                ? `${Number(account.balance).toFixed(2)} ${account.currency || ''}`
                : '—'}
            </p>
          </div>
          <div className="card">
            <h3>Equity</h3>
            <p className="big">
              {account?.equity != null
                ? Number(account.equity).toFixed(2)
                : '—'}
            </p>
          </div>
          <div className="card">
            <h3>Floating P/L</h3>
            <p
              className={`big ${
                Number(account?.profit) >= 0 ? 'buy' : 'sell'
              }`}
            >
              {account?.profit != null
                ? `${Number(account.profit) >= 0 ? '+' : ''}${Number(
                    account.profit
                  ).toFixed(2)}`
                : '—'}
            </p>
          </div>
          <div className="card">
            <h3>Open Trades</h3>
            <p className="big">{openTradesList.length}</p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Signal Log</h2>
            <button
              type="button"
              className="btn-link"
              onClick={() => setModal('logs')}
            >
              Full view
            </button>
          </div>
          <LogsTable rows={homeLogs.pageItems} />
          <Pagination
            page={homeLogs.page}
            totalPages={homeLogs.totalPages}
            onChange={homeLogs.setPage}
          />
        </section>

        <Modal
          title="Signal Log"
          open={modal === 'logs'}
          onClose={() => setModal(null)}
        >
          <LogsTable rows={modalLogs.pageItems} />
          <Pagination
            page={modalLogs.page}
            totalPages={modalLogs.totalPages}
            onChange={modalLogs.setPage}
          />
        </Modal>

        <Modal
          title="Signals"
          open={modal === 'signals'}
          onClose={() => setModal(null)}
        >
          <SignalsTable rows={modalSignals.pageItems} />
          <Pagination
            page={modalSignals.page}
            totalPages={modalSignals.totalPages}
            onChange={modalSignals.setPage}
          />
        </Modal>

        <Modal
          title={`Running Trades (${openTradesList.length})`}
          open={modal === 'running'}
          onClose={() => setModal(null)}
        >
          <TradesTable rows={modalRunning.pageItems} />
          <Pagination
            page={modalRunning.page}
            totalPages={modalRunning.totalPages}
            onChange={modalRunning.setPage}
          />
        </Modal>

        <Modal
          title={`Closing Trades (${closedTradesList.length})`}
          open={modal === 'closed'}
          onClose={() => setModal(null)}
        >
          <TradesTable rows={modalClosed.pageItems} />
          <Pagination
            page={modalClosed.page}
            totalPages={modalClosed.totalPages}
            onChange={modalClosed.setPage}
          />
        </Modal>

        <Modal
          title="Fund Growth"
          open={modal === 'growth'}
          onClose={() => setModal(null)}
        >
          <FundGrowthChart
            trades={trades.length ? trades : closedTradesList}
          />
        </Modal>
      </div>
    </div>
  );
}