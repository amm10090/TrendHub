import { spawn } from "child_process";

import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
// import fs from 'fs'; // 移除了未使用的 fs
// import path from 'path'; // 移除了未使用的 path

import { main as seedDatabase } from "@/../prisma/seed";
import { db } from "@/lib/db";

async function runPrismaDbPush(): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const adminAppDir = process.cwd();
    const command = "pnpm";
    const args = ["exec", "prisma", "db", "push", "--skip-generate"];
    const options = {
      cwd: adminAppDir,
      env: { ...process.env },
      shell: true,
    };

    const child = spawn(command, args, options);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        if (
          stderr &&
          !stderr.includes("Prisma schema loaded from") &&
          !stderr.includes("generated Prisma Client") &&
          !stderr.includes(
            "Your database is already in sync with your schema.",
          ) &&
          !stderr.includes("command not found")
        ) {
          return;
        }
        resolve({ stdout, stderr });
      } else {
        reject(
          new Error(
            `Prisma db push failed with code ${code}.\nStderr: ${stderr.trim()}\nStdout: ${stdout.trim()}`,
          ),
        );
      }
    });

    child.on("error", (err) => {
      if (err.message.includes("ENOENT")) {
        reject(
          new Error(
            `Failed to start command: ${command}. Ensure 'pnpm' is installed and in your PATH. Original error: ${err.message}`,
          ),
        );
      } else {
        reject(new Error(`Failed to start Prisma db push: ${err.message}`));
      }
    });
  });
}

export async function POST() {
  try {
    let isAlreadyInitialized = false;

    try {
      const initializedSetting = await db.siteSetting.findUnique({
        where: { key: "systemInitialized" },
      });

      if (initializedSetting?.value === "true") {
        isAlreadyInitialized = true;
      }
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2021"
      ) {
        isAlreadyInitialized = false;
      } else {
        throw e;
      }
    }

    if (isAlreadyInitialized) {
      return NextResponse.json(
        { message: "系统已初始化，无需重复操作。" },
        { status: 400 },
      );
    }

    await runPrismaDbPush();

    await seedDatabase();

    await db.siteSetting.upsert({
      where: { key: "systemInitialized" },
      update: { value: "true", category: "system" },
      create: { key: "systemInitialized", value: "true", category: "system" },
    });

    return NextResponse.json({ message: "系统初始化成功！" }, { status: 200 });
  } catch (error: unknown) {
    const err = error as Error;

    return NextResponse.json(
      {
        error: "系统初始化失败。",
        details: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      { status: 500 },
    );
  } finally {
    // 确保 Prisma Client 连接在开发/测试环境或独立脚本中正确断开
    // 在 Next.js API 路由中，通常不需要手动断开，因为连接是按需的。
    // 如果 seedDatabase 或 db 实例在外部管理连接，则可能需要外部处理 $disconnect
  }
}
