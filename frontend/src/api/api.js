import axios from "axios";

const BASE = "http://localhost:5000";

export const uploadFile = (file) => {
  const data = new FormData();
  data.append("file", file);
  return axios.post(`${BASE}/upload`, data, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
};

export const analyzeText = (text) =>
  axios.post(
    `${BASE}/analyze`,
    { text },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 120000,
    }
  );

export const getHealth = () =>
  axios.get(`${BASE}/health`, {
    timeout: 15000,
  });

export const translateText = (text, targetLang) =>
  axios.post(
    `${BASE}/translate`,
    { text, target_lang: targetLang },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 120000,
    }
  );
