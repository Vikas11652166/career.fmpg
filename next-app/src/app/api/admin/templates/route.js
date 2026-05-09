import connectDB from '@/lib/db/connect';
import CertificateTemplate from '@/lib/models/certificateTemplate';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const isAdmin = user.role === 'admin' || user.role === 'super-admin';
    if (!isAdmin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get('documentType');
    
    const filter = {};
    if (documentType) filter.documentType = documentType;

    const templates = await CertificateTemplate.find(filter).sort({ createdAt: -1 });
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('GET Templates Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const isAdmin = user.role === 'admin' || user.role === 'super-admin';
    if (!isAdmin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const templateData = await request.json();

    // If setting as default, unset others for this documentType
    if (templateData.isDefault) {
      await CertificateTemplate.updateMany(
        { documentType: templateData.documentType },
        { isDefault: false }
      );
    }

    const template = new CertificateTemplate(templateData);
    await template.save();

    return NextResponse.json({ message: 'Template created successfully', template }, { status: 201 });
  } catch (error) {
    console.error('POST Template Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
