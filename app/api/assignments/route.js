import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'public', 'assignments.json');

// Helper function to read assignments from file
async function readAssignments() {
  try {
    const data = await fs.readFile(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

// Helper function to write assignments to file
async function writeAssignments(assignments) {
  await fs.writeFile(dataFilePath, JSON.stringify(assignments, null, 2), 'utf8');
}

// GET /api/assignments - Get all assignments
export async function GET(request) {
  const assignments = await readAssignments();
  return Response.json(assignments);
}

// POST /api/assignments - Create new assignment
export async function POST(request) {
  try {
    const newAssignment = await request.json();
    const assignments = await readAssignments();
    assignments.push(newAssignment);
    await writeAssignments(assignments);
    return Response.json(newAssignment, { status: 201 });
  } catch (error) {
    return Response.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}

// PUT /api/assignments - Update assignment
export async function PUT(request) {
  try {
    const updatedAssignment = await request.json();
    const assignments = await readAssignments();
    const index = assignments.findIndex(a => a.id === updatedAssignment.id);
    if (index !== -1) {
      assignments[index] = updatedAssignment;
      await writeAssignments(assignments);
      return Response.json(updatedAssignment);
    }
    return Response.json({ error: 'Assignment not found' }, { status: 404 });
  } catch (error) {
    return Response.json({ error: 'Failed to update assignment' }, { status: 500 });
  }
}

// DELETE /api/assignments - Delete assignment
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return Response.json({ error: 'Assignment ID is required' }, { status: 400 });
    }
    const assignments = await readAssignments();
    const filteredAssignments = assignments.filter(a => a.id !== id);
    await writeAssignments(filteredAssignments);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
}
