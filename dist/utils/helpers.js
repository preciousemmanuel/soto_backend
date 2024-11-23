"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isObjectEmpty = exports.processAxiosErrorFromCatch = exports.uniqueCode = void 0;
const uniqueCode = () => {
    const code = Math.floor(1000 + Math.random() * 9000);
    return code;
};
exports.uniqueCode = uniqueCode;
const processAxiosErrorFromCatch = (error) => {
    if (error.response) {
        // The request was made and the server responded with a status code
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        return;
    }
    else if (error.request) {
        // The request was made but no response was received
        console.error('Request:', error.request);
    }
    else {
        // Something happened in setting up the request that triggered an error
        console.error('Error:', error.message);
    }
};
exports.processAxiosErrorFromCatch = processAxiosErrorFromCatch;
const isObjectEmpty = (obj) => {
    return Object.entries(obj).length === 0;
};
exports.isObjectEmpty = isObjectEmpty;
