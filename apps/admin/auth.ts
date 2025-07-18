import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

import { db } from "@/lib/db"; // 确保您的 Prisma 实例路径正确

// 决定 useSecureCookies 的值
// 在生产环境中，如果 AUTH_URL 明确以 http:// 开头，则不使用安全 cookies
// 否则，在生产环境中使用安全 cookies (即 AUTH_URL 是 https:// 或未指定但期望是 https)
const productionAuthUrlIsHttp =
  process.env.NODE_ENV === "production" &&
  process.env.AUTH_URL?.startsWith("http://");

const shouldUseSecureCookies =
  process.env.NODE_ENV === "production" && !productionAuthUrlIsHttp;

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
    // 条件性添加Google认证提供商
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    // 条件性添加GitHub认证提供商
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHub({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),

    // 条件性添加Resend邮件提供商
    ...(process.env.AUTH_RESEND_KEY && process.env.EMAIL_FROM
      ? [
          Resend({
            apiKey: process.env.AUTH_RESEND_KEY,
            from: process.env.EMAIL_FROM,
          }),
        ]
      : []),
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
    // 重定向回调逻辑
    async redirect({ url, baseUrl }) {
      // 如果是绝对URL且属于外部域，直接允许
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);

        if (urlObj.hostname !== baseUrlObj.hostname) {
          // 外部URL，允许重定向
          return url;
        }
      } catch {
        // 如果URL解析失败，继续处理相对路径
      }

      // 检查是否是相对路径
      if (url.startsWith("/")) {
        // 防止重定向到当前相同的路径
        const currentPath = url;

        // 如果当前已经在登录页面，不要再重定向到登录页面
        if (currentPath.includes("/login")) {
          // 登录成功后，重定向到仪表板
          return `${baseUrl}/en`;
        }

        // 如果是根路径，重定向到 /en
        if (currentPath === "/" || currentPath === "") {
          return `${baseUrl}/en`;
        }

        // 其他相对路径，组合完整URL
        return `${baseUrl}${currentPath}`;
      }

      // 如果URL完全匹配baseUrl，重定向到默认页面
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/en`;
      }

      // 如果URL已经是完整的同域URL，直接返回
      if (url.startsWith(baseUrl)) {
        return url;
      }

      // 默认情况：重定向到主页
      return `${baseUrl}/en`;
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

  // 调试配置 - 生产环境建议关闭
  debug: process.env.NODE_ENV === "development",

  // 生产环境安全配置
  useSecureCookies: shouldUseSecureCookies, // 使用计算出的值

  // HTTP环境特殊配置
  ...(productionAuthUrlIsHttp && {
    cookies: {
      sessionToken: {
        name: `${shouldUseSecureCookies ? "__Secure-" : ""}next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: false, // HTTP环境下设置为false
        },
      },
      callbackUrl: {
        name: `${shouldUseSecureCookies ? "__Secure-" : ""}next-auth.callback-url`,
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: false, // HTTP环境下设置为false
        },
      },
      csrfToken: {
        name: `${shouldUseSecureCookies ? "__Host-" : ""}next-auth.csrf-token`,
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: false, // HTTP环境下设置为false
        },
      },
    },
  }),
});
