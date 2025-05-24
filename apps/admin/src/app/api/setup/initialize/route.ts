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
          // Consider specific stderr messages that are benign
          // If a truly unexpected stderr occurs, it might be better to reject
          // For now, if there is stderr but not matching known benign messages, it will resolve.
          // This might need refinement based on typical `prisma db push` outputs.
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminEmail, adminPassword, siteName } = body;

    if (!adminEmail || !adminPassword || !siteName) {
      return NextResponse.json(
        {
          error: "setupPage.initialization.validation.adminCredentialsRequired",
          isTranslationKey: true,
        },
        { status: 400 },
      );
    }

    let isAlreadyInitialized = false;

    try {
      // 首先测试数据库连接
      await db.$connect();

      // 检查是否已初始化
      const initializedSetting = await db.siteSetting.findUnique({
        where: { key: "systemInitialized" },
      });

      if (initializedSetting?.value === "true") {
        isAlreadyInitialized = true;
      }
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        (e.code === "P2021" || e.code === "P1001") // Table does not exist or database connection failed
      ) {
        isAlreadyInitialized = false;
      } else {
        throw new Error(
          `Database connection or query failed: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    if (isAlreadyInitialized) {
      return NextResponse.json(
        {
          message: "setupPage.initialization.messages.alreadyInitialized",
          isTranslationKey: true,
        },
        { status: 400 },
      );
    }

    // 执行数据库推送
    await runPrismaDbPush();

    // 重新连接数据库以确保表已创建
    await db.$disconnect();
    await db.$connect();

    // 执行数据库种子数据初始化
    await seedDatabase({ adminEmail, adminPassword, siteName });

    // 设置系统初始化标志
    await db.siteSetting.upsert({
      where: { key: "systemInitialized" },
      update: { value: "true", category: "system" },
      create: { key: "systemInitialized", value: "true", category: "system" },
    });

    return NextResponse.json(
      {
        message: "setupPage.initialization.messages.initializationSuccess",
        isTranslationKey: true,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const err = error as Error;

    return NextResponse.json(
      {
        error: "setupPage.initialization.messages.systemInitializationFailed",
        isTranslationKey: true,
        details: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      { status: 500 },
    );
  } finally {
    try {
      await db.$disconnect();
    } catch {
      // Silently ignore disconnect errors
    }
  }
}
