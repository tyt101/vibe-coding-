import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false, // 禁用 React 严格模式
  typescript: {
    // 在构建时忽略 TypeScript 类型错误
    ignoreBuildErrors: true,
  },
  // Next.js 16+ 不再支持 eslint 配置，需使用 CLI 选项
  experimental: {
    // 使用系统 TLS 证书以解决网络问题
    turbopackUseSystemTlsCerts: true,
  },
};

export default nextConfig;
