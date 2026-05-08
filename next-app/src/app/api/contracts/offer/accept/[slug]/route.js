import connectDB from '@/lib/db/connect';
import OfferLetter from '@/lib/models/offerLetter';
import Application from '@/lib/models/application';
import EmploymentContract from '@/lib/models/offerContract';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    await connectDB();

    // Find the offer letter associated with this application slug/id
    const offerLetter = await OfferLetter.findOne({ applicationId: slug }).populate('applicationId');
    if (!offerLetter) {
      return NextResponse.json({ message: 'Offer not found or expired' }, { status: 404 });
    }

    if (offerLetter.status !== 'Issued' && offerLetter.status !== 'Sent') {
       return NextResponse.json({ message: 'Offer is no longer active' }, { status: 400 });
    }

    return NextResponse.json({ offerLetter });
  } catch (error) {
    console.error('Contract GET API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { slug } = await params;
    const data = await request.json();
    await connectDB();

    const offerLetter = await OfferLetter.findOne({ applicationId: slug });
    if (!offerLetter) {
      return NextResponse.json({ message: 'Offer not found' }, { status: 404 });
    }

    // Create the contract record
    const contract = new EmploymentContract({
      offerLetterId: offerLetter._id,
      applicationId: offerLetter.applicationId,
      candidateName: offerLetter.candidateName,
      email: offerLetter.candidateEmail,
      phone: data.phone,
      personalInfo: data.personalInfo,
      bankingInfo: data.bankingInfo,
      employmentDetails: {
        position: offerLetter.position,
        department: offerLetter.department,
        salary: offerLetter.salary,
        startDate: offerLetter.startDate,
        joiningLocation: offerLetter.joiningLocation,
        workType: offerLetter.workType,
        reportingManager: offerLetter.reportingManager
      },
      agreementTerms: data.agreementTerms,
      status: 'Under_Review'
    });

    await contract.save();

    // Update Offer Letter status
    offerLetter.status = 'Accepted';
    offerLetter.acceptedAt = new Date();
    await offerLetter.save();

    // Update Application status
    await Application.findByIdAndUpdate(offerLetter.applicationId, {
      $set: { status: 'Offer Accepted', updatedAt: new Date() }
    });

    return NextResponse.json({ 
      message: 'Offer accepted successfully', 
      contractId: contract._id 
    }, { status: 201 });

  } catch (error) {
    console.error('Contract POST API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
