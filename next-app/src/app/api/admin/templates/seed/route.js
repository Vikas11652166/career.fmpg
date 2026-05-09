import connectDB from '@/lib/db/connect';
import CertificateTemplate from '@/lib/models/certificateTemplate';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const isAdmin = user.role === 'admin' || user.role === 'super-admin';
    if (!isAdmin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const standardCertificateTemplate = {
      name: 'FMPG Premium Standard Certificate',
      documentType: 'certificate',
      isDefault: true,
      canvas: {
        width: 1123,
        height: 794,
        backgroundColor: '#0d0d0d',
        backgroundImage: ''
      },
      elements: [
        {
          id: 'border_1',
          type: 'rectangle',
          x: 30, y: 30, width: 1063, height: 734,
          backgroundColor: 'transparent',
          borderColor: '#d6f300',
          borderWidth: 3,
          zIndex: 1
        },
        {
          id: 'brand_1',
          type: 'text',
          x: 0, y: 62, width: 1123, height: 50,
          text: 'FMPG',
          fontSize: 36, fontFamily: 'Arial', fontWeight: '700',
          color: '#d6f300', align: 'center', zIndex: 2
        },
        {
          id: 'title_1',
          type: 'text',
          x: 0, y: 160, width: 1123, height: 40,
          text: 'INTERNSHIP COMPLETION CERTIFICATE',
          fontSize: 30, fontFamily: 'Arial', fontWeight: '700',
          color: '#ffffff', align: 'center', zIndex: 2
        },
        {
          id: 'intro_1',
          type: 'text',
          x: 0, y: 250, width: 1123, height: 30,
          text: 'This is to certify that',
          fontSize: 18, fontFamily: 'Arial', fontWeight: '400',
          color: '#cbd5e1', align: 'center', zIndex: 2
        },
        {
          id: 'name_1',
          type: 'text',
          x: 0, y: 292, width: 1123, height: 60,
          text: '{{candidateName}}',
          fontSize: 48, fontFamily: 'Arial', fontWeight: '700',
          color: '#d6f300', align: 'center', zIndex: 2
        },
        {
          id: 'detail_1',
          type: 'text',
          x: 150, y: 382, width: 823, height: 60,
          text: 'has successfully completed the internship program as {{jobrole}} in {{domain}}.',
          fontSize: 22, fontFamily: 'Arial', fontWeight: '400',
          color: '#e5e7eb', align: 'center', zIndex: 2
        },
        {
          id: 'duration_1',
          type: 'text',
          x: 0, y: 462, width: 1123, height: 30,
          text: 'Duration: {{fromDate}} - {{toDate}}',
          fontSize: 17, fontFamily: 'Arial', fontWeight: '400',
          color: '#a3a3a3', align: 'center', zIndex: 2
        },
        {
          id: 'id_1',
          type: 'text',
          x: 206, y: 625, width: 480, height: 30,
          text: 'Certificate ID: {{certificateId}}',
          fontSize: 15, fontFamily: 'Arial', fontWeight: '400',
          color: '#e5e7eb', align: 'left', zIndex: 2
        },
        {
          id: 'issued_1',
          type: 'text',
          x: 206, y: 660, width: 300, height: 30,
          text: 'Issued On: {{issuedOn}}',
          fontSize: 15, fontFamily: 'Arial', fontWeight: '400',
          color: '#a3a3a3', align: 'left', zIndex: 2
        },
        {
          id: 'line_1',
          type: 'line',
          x: 790, y: 655, width: 190, height: 2,
          borderColor: '#d6f300', borderWidth: 2, zIndex: 2
        },
        {
          id: 'sig_1',
          type: 'text',
          x: 760, y: 670, width: 250, height: 30,
          text: '{{issuedBy}}',
          fontSize: 16, fontFamily: 'Arial', fontWeight: '400',
          color: '#ffffff', align: 'center', zIndex: 2
        }
      ]
    };

    // Unset existing defaults
    await CertificateTemplate.updateMany(
      { documentType: 'certificate' },
      { isDefault: false }
    );

    const template = new CertificateTemplate(standardCertificateTemplate);
    await template.save();

    return NextResponse.json({ message: 'Standard Template seeded successfully', template }, { status: 201 });
  } catch (error) {
    console.error('Seed Template Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
