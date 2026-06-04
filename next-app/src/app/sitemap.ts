import { MetadataRoute } from "next";
import connectDB from "@/lib/mongodb";
import Job from "@/models/job";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://careers.fmpg.in";

  // Static site paths
  const staticPaths = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/verify`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/verify-offer`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
  ];

  // Dynamic job career paths
  let jobPaths: any[] = [];
  try {
    await connectDB();
    const activeJobs = await Job.find({ isActive: true })
      .select("slug updatedAt")
      .lean();

    jobPaths = activeJobs.map((job: any) => ({
      url: `${baseUrl}/jobs/${job.slug}`,
      lastModified: job.updatedAt ? new Date(job.updatedAt) : new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Sitemap generation error, falling back to static routes:", error);
  }

  return [...staticPaths, ...jobPaths];
}
