import { toggleLike } from "@/lib/store-board";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { postId: string } }) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const liked = await toggleLike(params.postId, userId);
    return NextResponse.json({ liked });
  } catch (error) {
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
