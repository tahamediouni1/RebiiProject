import type { NextConfig } from 'next';
import './env.js';
import path from 'node:path';

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
  turbopack: {
    // eslint-disable-next-line unicorn/prefer-module
    root: path.join(__dirname, '..'),
  },
};

export default nextConfig;
