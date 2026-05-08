import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import User from '@/lib/models/user';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    await connectDB();
    const { name, email, password, phoneNumber, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      role: role || 'user',
      status: 'active'
    });

    await user.save();
    return NextResponse.json({ message: 'User registered' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
