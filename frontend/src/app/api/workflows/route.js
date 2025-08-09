import { NextResponse } from 'next/server';
import { getMongoService } from '../../services/mongoService';

export async function GET(request) {
  try {
    const mongoService = getMongoService();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const workflows = await mongoService.getAllWorkflows(userId);
    
    return NextResponse.json({
      success: true,
      workflows,
      count: workflows.length
    });
  } catch (error) {
    console.error('Failed to fetch workflows:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const mongoService = getMongoService();
    const workflowData = await request.json();

    const savedWorkflow = await mongoService.saveWorkflow(workflowData);
    
    return NextResponse.json({
      success: true,
      workflow: savedWorkflow
    });
  } catch (error) {
    console.error('Failed to save workflow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save workflow' },
      { status: 500 }
    );
  }
}
