import connectDB from '@/lib/db/connect';
import User from '@/lib/models/user';
import OfferLetter from '@/lib/models/offerLetter';
import OfferContract from '@/lib/models/offerContract';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'super-admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) {
      return NextResponse.json({ message: 'CSV file is empty' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const results = { success: 0, failed: 0, errors: [] };

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header] = values[index];
      });

      try {
        if (!rowData.email || !rowData.name) {
          results.failed++;
          results.errors.push(`Line ${i + 1}: Name and Email are required`);
          continue;
        }

        const existingUser = await User.findOne({ email: rowData.email });
        if (existingUser) {
          results.failed++;
          results.errors.push(`Line ${i + 1}: User ${rowData.email} already exists`);
          continue;
        }

        const tempPassword = crypto.randomBytes(4).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        let role = rowData.role || 'employee';
        if (!['admin', 'employee', 'super-admin'].includes(role)) {
          role = 'employee';
        }

        const newUser = new User({
          name: rowData.name,
          email: rowData.email,
          phoneNumber: rowData.phonenumber || rowData.phone || '',
          password: hashedPassword,
          role: role,
          status: 'active',
          department: rowData.department || '',
          position: rowData.position || '',
          reportingManager: rowData.reportingmanager || ''
        });

        await newUser.save();

        // Handle Offer Letter
        if (rowData.offersalary || rowData.offerstartdate) {
          const offerData = {
            userId: newUser._id,
            candidateName: rowData.name,
            email: rowData.email,
            position: rowData.position || 'Employee',
            department: rowData.department || 'Staff',
            salary: rowData.offersalary || '0',
            startDate: rowData.offerstartdate ? new Date(rowData.offerstartdate) : new Date(),
            workType: rowData.offerworktype || 'Full-time',
            status: 'Accepted',
            acceptedAt: new Date(),
            validUntil: new Date()
          };
          const offerLetter = new OfferLetter(offerData);
          await offerLetter.save();
          
          newUser.offerLetter = offerLetter._id;
          
          // Employee ID generation
          const employeeCount = await User.countDocuments({ role: { $in: ['employee', 'admin', 'super-admin'] }, employeeId: { $exists: true } });
          newUser.employeeId = `EMP${String(employeeCount + 1).padStart(3, '0')}`;
          
          await newUser.save();
        }

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Line ${i + 1}: ${err.message}`);
      }
    }

    return NextResponse.json({
      message: `Bulk upload completed. Success: ${results.success}, Failed: ${results.failed}`,
      results
    });

  } catch (error) {
    console.error('Bulk Upload API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
