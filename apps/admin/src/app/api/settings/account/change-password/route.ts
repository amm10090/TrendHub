import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/../auth"; // 确保路径正确
import { db } from "@/lib/db";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "当前密码不能为空"),
    newPassword: z.string().min(6, "新密码至少需要6个字符"),
    confirmPassword: z.string().min(1, "确认密码不能为空"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "两次输入的新密码不一致",
    path: ["confirmPassword"], // 在哪个字段上显示错误
  });

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await req.json();
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "无效的输入。", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { currentPassword, newPassword } = validation.data;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "用户未找到" }, { status: 404 });
    }

    // 如果是预设管理员账户，不允许通过此API修改密码
    const presetAdminEmail = process.env.PRESET_ADMIN_EMAIL;

    if (user.email === presetAdminEmail) {
      return NextResponse.json(
        { error: "预设管理员账户不允许通过此方式修改密码" },
        { status: 403 },
      );
    }

    if (!user.passwordHash) {
      // 用户可能通过OAuth注册，没有设置密码
      return NextResponse.json(
        { error: "您尚未使用密码登录过，请通过其他方式验证身份或联系管理员。" },
        { status: 400 },
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "当前密码不正确" }, { status: 400 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: session.user.id },
      data: { passwordHash: hashedNewPassword },
    });

    return NextResponse.json({ message: "密码更新成功" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
