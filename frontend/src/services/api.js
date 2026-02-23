import axios from "axios";
import { show, hide } from "../utils/loadingManager";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

API.interceptors.request.use(
    (req) => {
        // increment loading counter for each outgoing request
        const url = req.url || '';
        let type = 'default';
        if (url.includes('/match/request')) {
            type = 'connecting';
        }
        show({ type });
        const token = localStorage.getItem("token");
        if (token) {
            req.headers.Authorization = `Bearer ${token}`;
        }
        return req;
    },
    (error) => {
        // ensure loading is decremented on request error
        hide();
        return Promise.reject(error);
    }
);

API.interceptors.response.use(
    (res) => {
        hide();
        return res;
    },
    (error) => {
        hide();
        return Promise.reject(error);
    }
);

export default API;
