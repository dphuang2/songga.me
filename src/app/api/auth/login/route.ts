import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  // Example: Validate credentials (replace with your logic)
  if (username === "user" && password === "pass") {
    return NextResponse.json({ message: "Login successful" }, { status: 200 });
  } else {
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  }
}
