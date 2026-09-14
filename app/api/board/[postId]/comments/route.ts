import { addComment, getComments } from "@/lib/store-board";
import type { CreateCommentRequest } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { postId: string } }) {
  try {
    const comments = await getComments(params.postId);
    return NextResponse.json({ comments });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { postId: string } }) {
  try {
    const body: CreateCommentRequest = await req.json();
    const { authorId, authorNickname, content } = body;

    if (!authorId || !authorNickname || !content?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const comment = await addComment(params.postId, { authorId, authorNickname, content });
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
