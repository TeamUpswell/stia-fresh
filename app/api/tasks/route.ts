import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Handler for GET requests to retrieve tasks
export async function GET() {
  try {
    const { data, error } = await supabase.from("tasks").select("*");

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Tasks API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handler for POST requests to create a new task
export async function POST(request: Request) {
  try {
    const { title, description } = await request.json();

    const { data, error } = await supabase
      .from("tasks")
      .insert([{ title, description }]);

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: "Task created but no data returned" },
        { status: 201 }
      );
    }
    return NextResponse.json(data[0], { status: 201 });
  } catch (err) {
    console.error("Tasks API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handler for PUT requests to update an existing task
export async function PUT(request: Request) {
  try {
    const { id, title, description } = await request.json();

    const { data, error } = await supabase
      .from("tasks")
      .update({ title, description })
      .eq("id", id);

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch (err) {
    console.error("Tasks API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handler for DELETE requests to remove a task
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Tasks API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
