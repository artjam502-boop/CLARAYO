import axios from 'axios';
const api=axios.create({baseURL:import.meta.env.VITE_API_URL||(import.meta.env.DEV?'http://localhost:5000/api':'/api')});
api.interceptors.request.use(c=>{if(c.url==='/products?limit=8')c.url='/products?featured=true&limit=8';const t=localStorage.getItem('clarayo_token');if(t)c.headers.Authorization=`Bearer ${t}`;return c});
api.interceptors.response.use(r=>r,e=>Promise.reject(new Error(e.response?.data?.message||'Something went wrong')));
export default api;
