const nodemailer = require("nodemailer");
require("dotenv").config();

const user = process.env.EMAIL_USER;
const rawPass = process.env.EMAIL_PASS;
const cleanPass = rawPass ? rawPass.replace(/\s+/g, "").trim() : "";

console.log("Testing with:");
console.log("User:", user);
console.log("Raw Password:", rawPass);
console.log("Clean Password:", cleanPass);

async function testEmail(passToUse) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: user,
      pass: passToUse,
    },
  });

  try {
    await transporter.verify();
    console.log(`Success verifying transporter with password: "${passToUse}"`);
    return true;
  } catch (error) {
    console.error(`Failed with password "${passToUse}":`, error.message);
    return false;
  }
}

async function run() {
  console.log("\n--- Testing with RAW password ---");
  const rawOk = await testEmail(rawPass);
  
  console.log("\n--- Testing with CLEAN password ---");
  const cleanOk = await testEmail(cleanPass);
  
  if (cleanOk && !rawOk) {
    console.log("\nCONCLUSION: Spaces in EMAIL_PASS was indeed the issue! Removing spaces fixes it.");
  } else if (cleanOk && rawOk) {
    console.log("\nCONCLUSION: Both passwords worked. The issue might be something else.");
  } else {
    console.log("\nCONCLUSION: Both passwords failed. The credentials themselves are invalid or revoked.");
  }
}

run();
