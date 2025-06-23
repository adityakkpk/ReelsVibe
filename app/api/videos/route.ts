import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/dbConfig";
import Video, { IVideo } from "@/models/Video";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDatabase();

    const videos = await Video.find({}).sort({ createdAt: -1 }).lean();

    if (!videos || videos.length === 0) {
      return NextResponse.json(
        { message: "No videos found", videos: [] },
        { status: 404 }
      );
    }

    return NextResponse.json(videos);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized User" }, { status: 401 });
    }

    await connectToDatabase();

    const body: IVideo = await request.json();

    if (
      !body.title ||
      !body.description ||
      !body.videoUrl
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const videoData = {
      ...body,
      controls: body.controls ?? true,
      transformation: {
        height: 1920,
        width: 1080,
        quality: body.transformation?.quality ?? 100,
      },
    };

    const video = await Video.create(videoData);
    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/videos:", error);
    return NextResponse.json(
      { error: "Fail to create video" },
      { status: 500 }
    );
  }
}
