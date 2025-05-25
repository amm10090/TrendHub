import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

import { db } from "@/lib/db"; // 确保您的 Prisma 实例路径正确

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
        } catch (error) {
          console.error("认证错误:", error);
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
    // signOut: '/auth/signout', // 默认登出页面
    // error: '/auth/error', // 错误页面 (例如，认证失败)
    verifyRequest: "/verify-email", // 用于邮件验证的页面
    // newUser: null // 如果为 null, 新用户将重定向到 signIn URL
  },
  callbacks: {
    // 使用 JWT 回调来将会话信息编码到 JWT 中
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id; // 将用户ID添加到 token
        // 根据需要添加更多信息到 token，这些信息将可用于 session 回调
        // token.role = user.role; // 例如，如果您的 User 模型有 role 字段
      }

      return token;
    },
    // 使用 session 回调来使会话对象包含 JWT 中的信息
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        // 如果在 jwt 回调中添加了其他信息（如 role），也在这里添加到 session.user
        // session.user.role = token.role;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      // 获取环境变量
      const publicUrl = process.env.NEXTAUTH_PUBLIC_URL;

      // 如果URL是相对路径，转换为绝对路径
      if (url.startsWith("/")) {
        return `${publicUrl || baseUrl}${url}`;
      }

      // 如果URL已经是正确的公网URL，直接返回
      if (publicUrl && url.startsWith(publicUrl)) {
        return url;
      }

      // 处理localhost和容器名称的URL
      if (url.includes("localhost") || url.includes("admin:3001")) {
        const correctedUrl = url
          .replace(/http:\/\/localhost:[0-9]+/g, publicUrl || baseUrl)
          .replace(/http:\/\/admin:3001/g, publicUrl || baseUrl);
        return correctedUrl;
      }

      // 如果URL与当前baseUrl同源，直接返回
      if (url.startsWith(baseUrl)) {
        if (publicUrl) {
          return url.replace(baseUrl, publicUrl);
        }
        return url;
      }

      // 默认返回有效的基础URL
      return publicUrl || baseUrl;
    },
  },
  events: {
    async signIn(message) {
      console.log("用户登录:", message.user.email);
    },
    async signOut() {
      console.log("用户已登出");
    },
  },
  // 关键配置：解决 CSRF 错误
  secret: process.env.AUTH_SECRET, // 从环境变量获取 AUTH_SECRET
  trustHost: true, // 强制信任主机头
  basePath: "/api/auth", // 确保基础路径正确

  // 在生产环境中使用安全 Cookie
  useSecureCookies: process.env.NODE_ENV === "production",

  // Cookie 配置 - 关键修复
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // 在 Docker 环境中不设置 domain，让浏览器自动处理
        domain: undefined,
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: undefined,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: undefined,
      },
    },
  },

  // 调试配置
  debug: process.env.NODE_ENV === "development",

  // 额外的安全配置
  logger: {
    error(error) {
      console.error(`[AUTH ERROR]:`, error);
    },
    warn(code) {
      console.warn(`[AUTH WARN] ${code}`);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === "development") {
        console.debug(`[AUTH DEBUG] ${code}:`, metadata);
      }
    },
  },
});
