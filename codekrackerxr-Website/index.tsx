import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Add keyframe animations for Tailwind
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  @keyframes dot-blink {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 1; }
  }
  .animate-blink {
    animation: blink 4s infinite;
  }
  .animate-dot-1 { animation: dot-blink 1.4s infinite 0s; }
  .animate-dot-2 { animation: dot-blink 1.4s infinite 0.2s; }
  .animate-dot-3 { animation: dot-blink 1.4s infinite 0.4s; }
  
  .clip-path-slant {
    clip-path: polygon(0 0, 100% 0, 100% 85%, 95% 100%, 0 100%);
  }
  .clip-path-slant-reverse {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 5% 100%, 0 85%);
  }

  /* Print Protocols */
  @media print {
    body {
      background: white !important;
      color: black !important;
    }
    .no-print {
      display: none !important;
    }
    .print-only {
      display: block !important;
    }
    .print-container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      font-family: sans-serif;
    }
    .print-header {
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
      text-align: center;
    }
    .print-section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    .print-label {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 12px;
      color: #666;
      display: block;
      margin-bottom: 5px;
    }
    .print-value {
      font-size: 16px;
      color: #000;
      line-height: 1.5;
      white-space: pre-wrap;
    }
  }
  .print-only {
    display: none;
  }
`;
document.head.appendChild(styleSheet);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);