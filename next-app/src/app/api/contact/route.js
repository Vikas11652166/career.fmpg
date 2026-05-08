import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import mongoose from 'mongoose';

// Simple Contact schema if it doesn't exist elsewhere
const ContactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  company: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    
    const contact = new Contact(data);
    await contact.save();
    
    return NextResponse.json({ message: 'Message received successfully' }, { status: 201 });
  } catch (error) {
    console.error('Contact API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
