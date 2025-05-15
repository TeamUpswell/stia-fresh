import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Handler for GET requests to fetch all checklists
export async function GET() {
    const { data, error } = await supabase
        .from('checklists')
        .select('*');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// Handler for POST requests to create a new checklist
export async function POST(request: Request) {
    const { title, items } = await request.json();

    const { data, error } = await supabase
        .from('checklists')
        .insert([{ title, items }]);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
}

// Handler for PUT requests to update an existing checklist
export async function PUT(request: Request) {
    const { id, title, items } = await request.json();

    const { data, error } = await supabase
        .from('checklists')
        .update({ title, items })
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
}

// Handler for DELETE requests to remove a checklist
export async function DELETE(request: Request) {
    const { id } = await request.json();

    const { error } = await supabase
        .from('checklists')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Checklist deleted successfully' });
}