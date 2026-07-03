// API 封装模块
const API = (() => {
  const BASE = (window.API_BASE || '') + '/api';
  // Render 免费实例闲置后会休眠，下次请求需要 30~50 秒冷启动。
  // 之前固定 6 秒超时，几乎每次"睡醒"都会先报一次假的"请求超时"。
  // 这里改成：先按一个较短超时试一次，如果是超时（很可能是冷启动），
  // 再自动用更长的超时重试一次，减少不必要的报错打扰。
  const TIMEOUT_MS = 20000;
  const RETRY_TIMEOUT_MS = 45000;

  async function requestOnce(method, path, body, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const opts = { method, signal: controller.signal, headers: {} };
    if (window.APP_TOKEN) opts.headers['X-App-Token'] = window.APP_TOKEN;
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

  async function request(method, path, body) {
    try {
      return await requestOnce(method, path, body, TIMEOUT_MS);
    } catch (err) {
      // 第一次超时很可能是后端从休眠中被唤醒，此时它已经在启动了，
      // 用更长的超时再给一次机会，成功率会明显提高
      if (err.message === '请求超时') {
        return await requestOnce(method, path, body, RETRY_TIMEOUT_MS);
      }
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
    getMastery: () => request('GET', '/sync/mastery'),
    saveMastery: (data) => request('POST', '/sync/mastery', data),
    getSyllabusProgress: () => request('GET', '/sync/syllabus'),
    saveSyllabusProgress: (data) => request('POST', '/sync/syllabus', data),
  };
})();
