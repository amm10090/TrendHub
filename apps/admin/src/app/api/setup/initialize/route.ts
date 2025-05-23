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
        { error: "管理员邮箱、密码和站点名称是必填项。" },
        { status: 400 },
      );
    }

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
        e.code === "P2021" // Table does not exist
      ) {
        isAlreadyInitialized = false;
      } else {
        throw e; // Re-throw other errors
      }
    }

    if (isAlreadyInitialized) {
      return NextResponse.json(
        { message: "系统已初始化，无需重复操作。" },
        { status: 400 },
      );
    }

    await runPrismaDbPush();

    // Pass admin credentials and site name to the seeding function
    await seedDatabase({ adminEmail, adminPassword, siteName });

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
    // Prisma client disconnection is typically handled by Prisma itself in serverless environments like Next.js API routes.
    // Explicit $disconnect might be needed if running as a long-lived process or script.
  }
}
