import axios from "axios";
import { show, hide } from "../utils/loadingManager";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const finalApiUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl.replace(/\/$/, '')}/api`;

const API = axios.create({
    baseURL: finalApiUrl,
});

API.interceptors.request.use(
    (req) => {
        // increment loading counter for each outgoing request
        const url = req.url || '';
        if (!url.includes('/auth/me') && !url.includes('/auth/check')) {
            let type = 'default';
            if (url.includes('/match/request')) {
                type = 'connecting';
            }
            show({ type });
        }
        const token = localStorage.getItem("token");
        if (token) {
            req.headers.Authorization = `Bearer ${token}`;
        }
        return req;
    },
    (error) => {
        const url = error.config?.url || '';
        if (!url.includes('/auth/me') && !url.includes('/auth/check')) {
            hide();
        }
        return Promise.reject(error);
    }
);

API.interceptors.response.use(
    (res) => {
        const url = res.config?.url || '';
        if (!url.includes('/auth/me') && !url.includes('/auth/check')) {
            hide();
        }
        return res;
    },
    (error) => {
        const url = error.config?.url || '';
        if (!url.includes('/auth/me') && !url.includes('/auth/check')) {
            hide();
        }
        return Promise.reject(error);
    }
);

export default API;
