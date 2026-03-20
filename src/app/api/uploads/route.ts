import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { withUserDb } from "@/lib/db";
import { uploads, transactions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uploadsList = await withUserDb(userId, async (db) =>
      db
        .select()
        .from(uploads)
        .where(eq(uploads.clerkUserId, userId))
        .orderBy(desc(uploads.createdAt))
    );

    return NextResponse.json({ uploads: uploadsList });
  } catch (error) {
    console.error("Get uploads error:", error);
    return NextResponse.json({ error: "取得上傳記錄失敗" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uploadId } = await request.json();

    if (!uploadId) {
      return NextResponse.json({ error: "缺少上傳 ID" }, { status: 400 });
    }

    await withUserDb(userId, async (db) => {
      await db
        .delete(transactions)
        .where(eq(transactions.uploadId, uploadId));

      await db
        .delete(uploads)
        .where(eq(uploads.id, uploadId));
    });

    return NextResponse.json({ success: true, message: "已刪除上傳記錄及關聯交易" });
  } catch (error) {
    console.error("Delete upload error:", error);
    return NextResponse.json({ error: "刪除失敗" }, { status: 500 });
  }
}
