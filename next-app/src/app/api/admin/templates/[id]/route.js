import connectDB from '@/lib/db/connect';
import CertificateTemplate from '@/lib/models/certificateTemplate';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(request, { params }) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();
    
    const template = await CertificateTemplate.findById(id);
    if (!template) {
      return NextResponse.json({ message: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('GET Template ID Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const isAdmin = user.role === 'admin' || user.role === 'super-admin';
    if (!isAdmin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();
    const updateData = await request.json();

    if (updateData.isDefault) {
      await CertificateTemplate.updateMany(
        { documentType: updateData.documentType, _id: { $ne: id } },
        { isDefault: false }
      );
    }

    const template = await CertificateTemplate.findByIdAndUpdate(id, updateData, { new: true });
    if (!template) {
      return NextResponse.json({ message: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Template updated successfully', template });
  } catch (error) {
    console.error('PUT Template Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const isAdmin = user.role === 'admin' || user.role === 'super-admin';
    if (!isAdmin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();
    
    const template = await CertificateTemplate.findByIdAndDelete(id);
    if (!template) {
      return NextResponse.json({ message: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('DELETE Template Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
