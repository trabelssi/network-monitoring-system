import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Set withCredentials to ensure cookies are sent with every request
window.axios.defaults.withCredentials = true;

// Configure base URL
window.axios.defaults.baseURL = window.location.origin;

// Add CSRF token to all requests
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
} else {
    console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}

// Request interceptor to add CSRF token from meta tag
window.axios.interceptors.request.use(function (config) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]');
    if (csrfToken) {
        config.headers['X-CSRF-TOKEN'] = csrfToken.getAttribute('content');
    }
    return config;
}, function (error) {
    return Promise.reject(error);
});

// Add X-XSRF-TOKEN header from cookie for Laravel's CSRF protection
let xsrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];

if (xsrfToken) {
    window.axios.defaults.headers.common['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
}
