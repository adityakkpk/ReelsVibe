import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConfig";
import User from "@/models/User";

export async function POST(request: NextRequest, response: NextResponse) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and Password are Requires" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const user = await User.create({
      email,
      password,
    });

    return NextResponse.json(
      { message: "User Created Successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.log("Failed to Register User:", error);
    return NextResponse.json(
      { error: "Fail To Register User" },
      { status: 500 }
    )
  }
}
