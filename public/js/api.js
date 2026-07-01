// API 封装模块
const API = (() => {
  const BASE = (window.API_BASE || '') + '/api';
  const TIMEOUT_MS = 6000; // 6秒超时，防止无限挂起白屏

  async function request(method, path, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const opts = { method, signal: controller.signal, headers: {} };
    if (body && !(body instanceof FormData)) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
      opts.body = body;
    }
    try {
      const res = await fetch(BASE + path, opts);
      clearTimeout(timer);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      return data;
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') throw new Error('请求超时');
      if (err.message === 'Failed to fetch') throw new Error('连接服务器失败');
      throw err;
    }
  }

  return {
    getCheckin: (date) => request('GET', `/checkin/${date}`),
    saveCheckin: (date, data) => request('POST', `/checkin/${date}`, data),
    getCheckinHistory: (date) => request('GET', `/checkin/${date}/history`),
    getTodayWords: (date) => request('GET', `/words/today?date=${date}`),
    getReviewWords: (date) => request('GET', `/words/review?date=${date}`),
    getWordBank: () => request('GET', '/words/bank'),
    getTodayQuote: (date) => request('GET', `/quotes/today?date=${date}`),
    uploadFile: (formData) => request('POST', '/upload', formData),
    getUploads: (date) => request('GET', `/upload/list/${date}`),
    deleteUpload: (id) => request('DELETE', `/upload/${id}`),
    getPhases: () => request('GET', '/plan/phases'),
    getApps: () => request('GET', '/plan/apps'),
    getCurrent: () => request('GET', '/plan/current'),
    getSyllabus: () => request('GET', '/plan/syllabus'),
  };
})();
