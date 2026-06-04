import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import resumeParserService from "@/services/resumeParserService";

// Configure Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file found in upload request" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamic folder assignment based on filename
    const isResume = file.name.toLowerCase().includes("resume") || file.name.toLowerCase().includes("cv");
    const folder = isResume ? "fmpg/resumes" : "fmpg/documents";

    // Upload to Cloudinary via upload stream
    let uploadResult: any;
    try {
      uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "auto",
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(buffer);
      });
      console.log(`Cloudinary upload successful: ${uploadResult.secure_url}`);
    } catch (uploadError: any) {
      console.error("Cloudinary upload failed (possibly offline or invalid config):", uploadError);

      // Graceful offline/local-testing fallback during development
      if (process.env.NODE_ENV === "development" || !process.env.CLOUDINARY_API_KEY) {
        console.log("Local development/offline mode detected. Falling back to mock Cloudinary storage URL...");
        uploadResult = {
          secure_url: `https://res.cloudinary.com/di0cwploq/image/upload/mock-fallback-${Date.now()}.pdf`,
          public_id: `fmpg/resumes/mock-fallback-${Date.now()}`
        };
      } else {
        // Reraise in production
        throw uploadError;
      }
    }

    // Parse resume in-memory if it is a resume file
    let parsedData = null;
    if (isResume) {
      try {
        console.log(`Directly parsing resume buffer for ${file.name} in upload API route...`);
        const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
        const mimeType = ['.doc', '.docx'].includes(fileExtension)
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "application/pdf";
          
        const parseResult = await resumeParserService.parseResume(buffer, mimeType, file.name);
        if (parseResult.success) {
          parsedData = parseResult.data;
          console.log(`Direct resume parsing completed successfully for ${file.name}`);
        } else {
          console.warn(`Direct resume parsing failed: ${parseResult.error}`);
        }
      } catch (parseErr: any) {
        console.error("Direct resume parsing exception in upload API route:", parseErr);
      }
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      fileName: file.name,
      sizeBytes: file.size,
      parsedData,
    });
  } catch (error: any) {
    console.error("Cloudinary upload route error:", error);
    return NextResponse.json(
      { message: "File upload failed", error: error.message },
      { status: 500 }
    );
  }
}

