import { NextResponse } from 'next/server';
import { getMongoService } from '../../services/mongoService';
import { getStaticTemplates } from '../../services/staticTemplates';

export async function GET(request) {
  try {
    // Always return static templates for now to ensure they work
    const templates = getStaticTemplates();
    
    return NextResponse.json({
      success: true,
      templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    
    // Fallback to static templates
    const templates = getStaticTemplates();
    return NextResponse.json({
      success: true,
      templates,
      count: templates.length
    });
  }
}
