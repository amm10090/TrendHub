import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

import { db } from "@/lib/db"; // 确保您的 Prisma 实例路径正确

// console.log("Auth.ts - AUTH_URL:", process.env.AUTH_URL);
// console.log("Auth.ts - NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
// console.log("Auth.ts - AUTH_SECRET exists:", !!process.env.AUTH_SECRET);

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
    async redirect({ url, baseUrl }) {
      const effectiveBaseUrl =
        process.env.AUTH_URL || process.env.NEXTAUTH_URL || baseUrl;
      const finalBaseUrl = effectiveBaseUrl.endsWith("/")
        ? effectiveBaseUrl.slice(0, -1)
        : effectiveBaseUrl;

      console.log(
        `[AUTH_REDIRECT] Original URL: "${url}", BaseURL: "${baseUrl}", FinalBaseURL: "${finalBaseUrl}"`,
      );

      try {
        let targetUrl;

        if (url.startsWith("/")) {
          // Handle relative URLs
          let prefixedPath = url;
          if (url === "/" || url === "") {
            prefixedPath = "/en";
            console.log(
              `[AUTH_REDIRECT] Case 1: Root relative URL. Path becomes: "${prefixedPath}"`,
            );
          } else if (!url.match(/^\/(en|cn)(\/.*)?$/)) {
            // Add language prefix if not present and not a root path
            prefixedPath = `/en${url}`;
            console.log(
              `[AUTH_REDIRECT] Case 2: Other relative URL "${url}". Path becomes: "${prefixedPath}"`,
            );
          } else {
            console.log(
              `[AUTH_REDIRECT] Case 3: Relative URL "${url}" already has language prefix or is a language root. Path remains: "${prefixedPath}"`,
            );
          }
          targetUrl = `${finalBaseUrl}${prefixedPath}`;
        } else {
          // Handle absolute URLs
          const urlObj = new URL(url);
          const finalBaseUrlObj = new URL(finalBaseUrl);

          if (
            urlObj.hostname === finalBaseUrlObj.hostname &&
            urlObj.port === finalBaseUrlObj.port
          ) {
            // URL is on the same origin
            let path = urlObj.pathname;
            if (path === "/" || path === "") {
              path = "/en";
              console.log(
                `[AUTH_REDIRECT] Case 4: Absolute URL, same origin, root path. Path becomes: "${path}"`,
              );
            } else if (!path.match(/^\/(en|cn)(\/.*)?$/)) {
              path = `/en${path}`;
              console.log(
                `[AUTH_REDIRECT] Case 5: Absolute URL, same origin, needs lang prefix. Original path: "${urlObj.pathname}". Path becomes: "${path}"`,
              );
            } else {
              console.log(
                `[AUTH_REDIRECT] Case 6: Absolute URL, same origin, path "${path}" is fine.`,
              );
            }
            targetUrl = `${finalBaseUrl}${path}${urlObj.search}${urlObj.hash}`;
          } else {
            // URL is on a different origin, redirect to default page on our domain
            targetUrl = `${finalBaseUrl}/en`;
            console.log(
              `[AUTH_REDIRECT] Case 7: Absolute URL, different origin. Redirecting to default: "${targetUrl}"`,
            );
          }
        }
        console.log(`[AUTH_REDIRECT] Final redirect decision: "${targetUrl}"`);
        return targetUrl;
      } catch (error) {
        console.error("[AUTH_REDIRECT] Error during redirect:", error);
        const fallbackUrl = `${finalBaseUrl}/en`;
        console.log(
          `[AUTH_REDIRECT] Fallback redirect due to error: "${fallbackUrl}"`,
        );
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

  // 调试配置 - 生产环境建议关闭
  debug: process.env.NODE_ENV === "development",

  // 额外的安全配置
  logger: {
    error(error: Error) {
      console.error("Auth.js Error:", error);
    },
    warn(code: string) {
      console.warn(`Auth.js Warning [${code}]`);
    },
    debug(code: string, metadata?: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.debug(`Auth.js Debug [${code}]:`, metadata);
      }
    },
  },

  // 生产环境安全配置
  useSecureCookies: shouldUseSecureCookies, // 使用计算出的值

  // 确保正确的 URL 配置
  // ...(process.env.AUTH_URL && { // 这个条件性展开可能不是必须的，因为NextAuth会直接读取AUTH_URL环境变量
  //   url: process.env.AUTH_URL,
  // }),
});
