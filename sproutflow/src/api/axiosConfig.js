import axios from 'axios';

const api = axios.create({
    baseURL: 'http://192.168.1.100:3000/api', // Change this to your laptop's IPv4 later
});

export default api;