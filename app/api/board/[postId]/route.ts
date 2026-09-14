import { deleteBoardPost, getBoardPost } from "@/lib/store-board";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { postId: string } }) {
  try {
    const post = await getBoardPost(params.postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { postId: string } }) {
  try {
    const { authorId } = await req.json();
    const post = await getBoardPost(params.postId);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== authorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await deleteBoardPost(params.postId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
