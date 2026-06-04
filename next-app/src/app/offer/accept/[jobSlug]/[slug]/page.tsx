import { notFound, redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import Application from "@/models/application";
import OfferLetter from "@/models/offerLetter";
import mongoose from "mongoose";

interface PageProps {
  params: Promise<{ jobSlug: string; slug: string }> | { jobSlug: string; slug: string };
}

export default async function LegacyOfferRedirectPage({ params }: PageProps) {
  await connectDB();

  // Resolve route parameters
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  let offerLetterId: string | null = null;

  // 1. Try to find the application by ID or slug
  let application: any = null;
  if (mongoose.Types.ObjectId.isValid(slug)) {
    application = await Application.findById(slug).lean();
  } else {
    application = await Application.findOne({ slug }).lean();
  }

  // 2. If application exists, find its pending or active offer letter
  if (application) {
    const offer = await OfferLetter.findOne({ applicationId: application._id }).lean();
    if (offer) {
      offerLetterId = offer._id.toString();
    }
  } else {
    // 3. Fallback: Check if the slug itself is an OfferLetter ID or short ID
    let offerLetter: any = null;
    const cleanSlug = slug.trim().replace(/^(FMPG-OFF-|FMPG-)/i, "");

    if (mongoose.Types.ObjectId.isValid(cleanSlug)) {
      offerLetter = await OfferLetter.findById(cleanSlug).lean();
    } else {
      // Query by shortId or ends-with match
      offerLetter = await OfferLetter.findOne({
        shortId: cleanSlug.toUpperCase()
      }).lean();

      if (!offerLetter && cleanSlug.length >= 4) {
        offerLetter = await OfferLetter.findOne({
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: cleanSlug + "$",
              options: "i"
            }
          }
        }).lean();
      }
    }

    if (offerLetter) {
      offerLetterId = offerLetter._id.toString();
    }
  }

  // 4. If an offer letter ID was resolved, redirect candidate to the new Next.js signing wizard
  if (offerLetterId) {
    redirect(`/contract/${offerLetterId}`);
  }

  // If completely unresolvable, return standard 404
  notFound();
}
