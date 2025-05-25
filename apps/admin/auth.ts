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
        console.log("Credentials authorize called with:", {
          email: credentials?.email,
          hasPassword: !!credentials?.password,
        });

        if (!credentials?.email || !credentials?.password) {
          console.log("Missing email or password");
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
          console.log("Preset admin login successful");
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
            console.log("User not found or no password hash");
            return null;
          }

          const isValidPassword = await bcrypt.compare(
            password,
            user.passwordHash,
          );

          if (!isValidPassword) {
            console.log("Invalid password");
            return null;
          }

          console.log("Database user login successful");
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

      console.log("Redirect callback:", {
        url,
        baseUrl,
        authUrl,
        finalBaseUrl,
      });

      try {
        // 如果是相对路径
        if (url.startsWith("/")) {
          // 根路径重定向到默认语言页面
          if (url === "/" || url === "") {
            const redirectUrl = `${finalBaseUrl}/en`;
            console.log("Root path redirect to:", redirectUrl);
            return redirectUrl;
          }

          // 确保路径以语言代码开头
          if (!url.startsWith("/en") && !url.startsWith("/cn")) {
            const redirectUrl = `${finalBaseUrl}/en${url}`;
            console.log("Adding locale prefix:", redirectUrl);
            return redirectUrl;
          }

          const redirectUrl = `${finalBaseUrl}${url}`;
          console.log("Relative path redirect:", redirectUrl);
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
            console.log("Empty path redirect to:", redirectUrl);
            return redirectUrl;
          }

          if (!pathSegments[0].match(/^(en|cn)$/)) {
            // 没有语言前缀，添加默认语言
            const newPath = `/en${urlObj.pathname}`;
            const redirectUrl = `${finalBaseUrl}${newPath}${urlObj.search}${urlObj.hash}`;
            console.log("Adding locale to full URL:", redirectUrl);
            return redirectUrl;
          }

          console.log("Same domain redirect:", url);
          return url;
        }

        // 不同域名或其他情况，重定向到默认页面
        const redirectUrl = `${finalBaseUrl}/en`;
        console.log("Cross-domain or other case, redirect to:", redirectUrl);
        return redirectUrl;
      } catch (error) {
        console.error("Redirect error:", error);
        const fallbackUrl = `${finalBaseUrl}/en`;
        console.log("Error fallback redirect to:", fallbackUrl);
        return fallbackUrl;
      }
    },
  },
  events: {
    async signIn(message) {
      console.log("用户登录事件:", message.user.email);
    },
    async signOut() {
      console.log("用户已登出事件");
    },
  },

  // 根据最新文档的关键配置
  trustHost: true, // Docker环境必需

  // 调试配置
  debug: true,

  // 额外的安全配置
  logger: {
    error(error) {
      console.error(`[AUTH ERROR]:`, error);
    },
    warn(code) {
      console.warn(`[AUTH WARN] ${code}`);
    },
    debug(code, metadata) {
      console.debug(`[AUTH DEBUG] ${code}:`, metadata);
    },
  },
});
