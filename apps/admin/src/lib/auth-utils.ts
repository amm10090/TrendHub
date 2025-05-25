import { cookies } from "next/headers";

/**
 * 在服务器端获取 CSRF token
 * 基于 GitHub 讨论中的解决方案：https://github.com/nextauthjs/next-auth/discussions/7256
 */
export const getCsrfTokenServerSide = async (): Promise<string | undefined> => {
  try {
    const NextAuthBaseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL;

    if (!NextAuthBaseUrl) {
      return undefined;
    }

    const allCookies = await cookies();
    const cookieHeader = allCookies
      .getAll()
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");

    const csrfResponse = await fetch(`${NextAuthBaseUrl}/api/auth/csrf`, {
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!csrfResponse.ok) {
      return undefined;
    }

    const csrfData = await csrfResponse.json();

    return csrfData.csrfToken;
  } catch {
    return undefined;
  }
};

/**
 * 从 cookies 中直接提取 CSRF token
 * 这是一个备用方法，当主方法失败时使用
 */
export const getCsrfTokenFromCookies = async (): Promise<
  string | undefined
> => {
  try {
    const allCookies = await cookies();
    const csrfCookie =
      allCookies.get("next-auth.csrf-token") ||
      allCookies.get("authjs.csrf-token");

    if (csrfCookie?.value) {
      // CSRF token 通常以 "token|hash" 的格式存储，我们只需要第一部分
      const tokenParts = csrfCookie.value.split("|");

      return tokenParts[0];
    }

    return undefined;
  } catch {
    return undefined;
  }
};
