import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

import { db } from "@/lib/db"; // 确保您的 Prisma 实例路径正确

// 确保环境变量存在
if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  throw new Error("AUTH_SECRET or NEXTAUTH_SECRET must be set");
}

if (!process.env.AUTH_URL && !process.env.NEXTAUTH_URL) {
  throw new Error("AUTH_URL or NEXTAUTH_URL must be set");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" }, // 使用 JWT 会话策略
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // 检查预设管理员
        const presetAdminEmail = process.env.PRESET_ADMIN_EMAIL;
        const presetAdminPassword = process.env.PRESET_ADMIN_PASSWORD;

        if (
          presetAdminEmail &&
          presetAdminPassword &&
          email === presetAdminEmail &&
          password === presetAdminPassword
        ) {
          return {
            id: "preset-admin-id",
            name: "预设管理员",
            email: presetAdminEmail,
            image: null,
          };
        }

        // 数据库用户认证
        try {
          const user = await db.user.findUnique({
            where: { email },
          });

          if (!user?.passwordHash) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(
            password,
            user.passwordHash,
          );

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch {
          return null;
        }
      },
    }),
    // 添加Google认证提供商
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // 添加GitHub认证提供商
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),

    // 添加Resend邮件提供商
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY!,
      from: process.env.EMAIL_FROM!,
    }),
  ],
  pages: {
    signIn: "/login", // 指定自定义登录页面的路径
    verifyRequest: "/verify-email", // 用于邮件验证的页面
  },
  callbacks: {
    // 使用 JWT 回调来将会话信息编码到 JWT 中
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id; // 将用户ID添加到 token
      }

      return token;
    },
    // 使用 session 回调来使会话对象包含 JWT 中的信息
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      // 获取正确的基础URL，优先使用环境变量
      const authUrl =
        process.env.AUTH_URL || process.env.NEXTAUTH_URL || baseUrl;
      const finalBaseUrl = authUrl.endsWith("/")
        ? authUrl.slice(0, -1)
        : authUrl;

      try {
        // 如果是相对路径
        if (url.startsWith("/")) {
          // 根路径重定向到默认语言页面
          if (url === "/" || url === "") {
            const redirectUrl = `${finalBaseUrl}/en`;

            return redirectUrl;
          }

          // 确保路径以语言代码开头
          if (!url.startsWith("/en") && !url.startsWith("/cn")) {
            const redirectUrl = `${finalBaseUrl}/en${url}`;

            return redirectUrl;
          }

          const redirectUrl = `${finalBaseUrl}${url}`;

          return redirectUrl;
        }

        // 如果是完整URL
        const urlObj = new URL(url);
        const baseUrlObj = new URL(finalBaseUrl);

        // 如果主机名和端口匹配，说明是同域重定向
        if (
          urlObj.hostname === baseUrlObj.hostname &&
          urlObj.port === baseUrlObj.port
        ) {
          // 检查路径是否有语言前缀
          const pathSegments = urlObj.pathname.split("/").filter(Boolean);

          if (pathSegments.length === 0) {
            // 空路径，重定向到默认语言
            const redirectUrl = `${finalBaseUrl}/en`;

            return redirectUrl;
          }

          if (!pathSegments[0].match(/^(en|cn)$/)) {
            // 没有语言前缀，添加默认语言
            const newPath = `/en${urlObj.pathname}`;
            const redirectUrl = `${finalBaseUrl}${newPath}${urlObj.search}${urlObj.hash}`;

            return redirectUrl;
          }

          return url;
        }

        // 不同域名或其他情况，重定向到默认页面
        const redirectUrl = `${finalBaseUrl}/en`;

        return redirectUrl;
      } catch {
        const fallbackUrl = `${finalBaseUrl}/en`;

        return fallbackUrl;
      }
    },
  },
  events: {
    async signIn() {
      // 用户登录事件处理
    },
    async signOut() {
      // 用户登出事件处理
    },
  },

  // 根据最新文档的关键配置
  trustHost: true, // Docker环境必需

  // 调试配置
  debug: true,

  // 额外的安全配置
  logger: {
    error() {
      // 错误日志处理
    },
    warn() {
      // 警告日志处理
    },
    debug() {
      // 调试日志处理
    },
  },
});
