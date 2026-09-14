import { createBoardPost, getAllBoardPosts } from "@/lib/store-board";
import type { CreateBoardPostRequest } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const posts = await getAllBoardPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: CreateBoardPostRequest = await req.json();
    const { authorId, authorNickname, content, images } = body;

    if (!authorId || !authorNickname || !content?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const post = await createBoardPost({ authorId, authorNickname, content, images });
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
