const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Storybook(canvas) 전용 — 그리드 패키지 소스/스토리의 Tailwind 클래스를 스캔해 유틸 CSS 생성.
  // 절대경로(=__dirname 기준)로 CWD 무관하게 해소. apps/docs → ../../packages = monorepo root/packages.
  content: [
    path.join(__dirname, '../../packages/*/src/**/*.{ts,tsx}'),
    path.join(__dirname, '../../packages/*/stories/**/*.{ts,tsx}'),
    path.join(__dirname, '../../packages/*/src/__stories__/**/*.{ts,tsx}'),
    path.join(__dirname, '.storybook/**/*.{ts,tsx}'),
  ],
  theme: { extend: {} },
  plugins: [],
};
