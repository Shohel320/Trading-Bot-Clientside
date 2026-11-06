import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

export async function getStatus() {
  const { data } = await api.get('/status');
  return data;
}

export async function getAccount() {
  const { data } = await api.get('/account');
  return data;
}

export async function startBot() {
  const { data } = await api.post('/start');
  return data;
}

export async function stopBot() {
  const { data } = await api.post('/stop');
  return data;
}

export async function getSignals() {
  const { data } = await api.get('/signals');
  return data;
}

export async function getSignalLogs() {
  const { data } = await api.get('/signal-logs');
  return data;
}

/** সব ট্রেড */
export async function getTrades() {
  const { data } = await api.get('/trades');
  return data;
}

/** শুধু ওপেন (Running) */
export async function getOpenTrades() {
  const { data } = await api.get('/trades', { params: { status: 'open' } });
  return data;
}

/** শুধু ক্লোজড */
export async function getClosedTrades() {
  const { data } = await api.get('/trades', { params: { status: 'closed' } });
  return data;
}

export async function getSettings() {
  const { data } = await api.get('/settings');
  return data;
}

export async function updateSettings(body) {
  const { data } = await api.put('/settings', body);
  return data;
}

export default api;