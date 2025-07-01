import { NextRequest, NextResponse } from "next/server";

import { discountNotificationService } from "@/lib/services/discount-notification.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit") || "10");

    switch (action) {
      case "recent": {
        const alerts = await discountNotificationService.getRecentAlerts(limit);

        return NextResponse.json({
          success: true,
          data: alerts,
        });
      }

      case "config": {
        const config = discountNotificationService.getConfig();

        return NextResponse.json({
          success: true,
          data: config,
        });
      }

      case "check": {
        const newAlerts = await discountNotificationService.checkThresholds();

        return NextResponse.json({
          success: true,
          data: newAlerts,
          message: `Found ${newAlerts.length} alerts`,
        });
      }

      default: {
        const recentAlerts =
          await discountNotificationService.getRecentAlerts(limit);

        return NextResponse.json({
          success: true,
          data: recentAlerts,
        });
      }
    }
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process notification request",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    switch (action) {
      case "test": {
        const testAlert = await discountNotificationService.testAlert();

        return NextResponse.json({
          success: true,
          data: testAlert,
          message: "Test notification sent successfully",
        });
      }

      case "check-now": {
        const alerts = await discountNotificationService.checkThresholds();

        return NextResponse.json({
          success: true,
          data: alerts,
          message: `Threshold check completed. Found ${alerts.length} alerts.`,
        });
      }

      case "update-config": {
        await discountNotificationService.updateConfig(config);

        return NextResponse.json({
          success: true,
          data: discountNotificationService.getConfig(),
          message: "Notification configuration updated successfully",
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action specified",
          },
          { status: 400 },
        );
    }
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process notification request",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;

    await discountNotificationService.updateConfig(config);

    return NextResponse.json({
      success: true,
      data: discountNotificationService.getConfig(),
      message: "Notification configuration updated successfully",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update notification configuration",
      },
      { status: 500 },
    );
  }
}
