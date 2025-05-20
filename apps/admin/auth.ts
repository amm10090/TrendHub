import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { db } from "@/lib/db"; // 确保您的 Prisma 实例路径正确

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" }, // 使用 JWT 会话策略
  providers: [
    Credentials({
      // 您可以自定义登录表单的字段，如果需要的话
      // name: "Credentials",
      // credentials: {
      //   email: { label: "邮箱", type: "email", placeholder: "jsmith@example.com" },
      //   password: { label: "密码", type: "password" }
      // },
      async authorize(credentials) {
        // 确保 credentials 是一个对象并且有 email 和 password 字段
        if (
          typeof credentials !== "object" ||
          credentials === null ||
          !("email" in credentials) ||
          !("password" in credentials)
        ) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        if (!email || !password) {
          return null; // 或者抛出错误
        }

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user) {
          // 用户不存在
          return null;
        }

        // 确保用户有密码字段 (如果您的 User 模型允许密码为空，可能需要调整)
        // 在 Prisma schema 中，User 模型需要有一个 passwordHash 字段
        if (!user.passwordHash) {
          // console.error("User does not have a password hash set.");
          return null;
        }

        // 验证密码
        const isValidPassword = await bcrypt.compare(
          password,
          user.passwordHash,
        );

        if (!isValidPassword) {
          // 密码不匹配
          return null;
        }

        // 认证成功，返回用户信息（不应包含密码）
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          // 您可以根据需要添加更多用户字段到会话中
        };
      },
    }),
    // 您可以在此处添加其他 Providers，例如 Google, GitHub 等
    // import Google from "next-auth/providers/google"
    // Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }),
  ],
  pages: {
    signIn: "/login", // 指定自定义登录页面的路径
    // signOut: '/auth/signout', // 默认登出页面
    // error: '/auth/error', // 错误页面 (例如，认证失败)
    // verifyRequest: '/auth/verify-request', // 用于邮件验证等流程
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
      // 如果 URL 是相对路径，将其转换为绝对路径
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // 如果 URL 已经是绝对路径且与 baseUrl 同源，则直接使用
      else if (url.startsWith(baseUrl)) {
        return url;
      }

      // 默认返回基础 URL (防止重定向到不安全的域)
      return baseUrl;
    },
  },
  // debug: process.env.NODE_ENV === "development", // 开发模式下启用调试信息
  secret: process.env.AUTH_SECRET, // 从环境变量获取 AUTH_SECRET
  trustHost: true, // 强制信任主机头
  basePath: "/api/auth", // 确保基础路径正确
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
});
