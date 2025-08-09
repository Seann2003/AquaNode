import { NextResponse } from 'next/server';
import { getMongoService } from '../../../services/mongoService';

export async function GET(request, { params }) {
  try {
    const mongoService = getMongoService();
    const workflowId = params.id;

    const workflow = await mongoService.getWorkflow(workflowId);
    
    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error('Failed to fetch workflow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const mongoService = getMongoService();
    const workflowId = params.id;
    const updateData = await request.json();

    const updatedWorkflow = await mongoService.saveWorkflow({
      ...updateData,
      id: workflowId
    });
    
    return NextResponse.json({
      success: true,
      workflow: updatedWorkflow
    });
  } catch (error) {
    console.error('Failed to update workflow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const mongoService = getMongoService();
    const workflowId = params.id;

    const deleted = await mongoService.deleteWorkflow(workflowId);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete workflow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
