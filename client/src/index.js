
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// window.process = {
//   nextTick: (cb) => Promise.resolve().then(cb),
//   env: {
//     NODE_ENV: 'development',
//   }
// };

import { Buffer } from 'buffer';
window.Buffer = Buffer;
window.process = require('process/browser');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
