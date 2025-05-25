// 环境变量配置
export const env = {
  // NextAuth URLs
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3001",
  NEXTAUTH_URL_INTERNAL:
    process.env.NEXTAUTH_URL_INTERNAL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3001",
  NEXTAUTH_PUBLIC_URL:
    process.env.NEXTAUTH_PUBLIC_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3001",

  // 判断是否在 Docker 容器内
  isDocker: process.env.NEXTAUTH_URL_INTERNAL !== undefined,

  // 获取正确的 URL（根据上下文）
  getAuthUrl: (isInternal = false) => {
    if (isInternal && process.env.NEXTAUTH_URL_INTERNAL) {
      return process.env.NEXTAUTH_URL_INTERNAL;
    }

    return process.env.NEXTAUTH_URL || "http://localhost:3001";
  },

  // 获取公共 URL（用于客户端重定向）
  getPublicUrl: () => {
    return (
      process.env.NEXTAUTH_PUBLIC_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3001"
    );
  },
};
