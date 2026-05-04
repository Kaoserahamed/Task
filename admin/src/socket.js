import opensocket from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://backend-eight-tan-16.vercel.app';
const socket = opensocket(BACKEND_URL);
export default socket;
