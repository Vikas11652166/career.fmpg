import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { formatCurrencyValue } from "@/lib/currencyFormatter";

const C = {
  black: '#0d0d0d',
  dark2: '#1c1c1c',
  dark3: '#252525',
  lime: '#059669', /* Replaced old neon lime with FMPG Emerald Green for stunning next-gen brand match! */
  limeDim: '#047857',
  white: '#ffffff',
  offWhite: '#e8e8e8',
  gray1: '#aaaaaa',
  gray2: '#666666',
};

const W = 841.89; // Landscape A4 Width
const H = 595.28; // Landscape A4 Height

function roundRect(doc: any, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  doc.moveTo(x + rr, y)
    .lineTo(x + w - rr, y)
    .quadraticCurveTo(x + w, y, x + w, y + rr)
    .lineTo(x + w, y + h - rr)
    .quadraticCurveTo(x + w, y + h, x + w - rr, y + h)
    .lineTo(x + rr, y + h)
    .quadraticCurveTo(x, y + h, x, y + h - rr)
    .lineTo(x, y + rr)
    .quadraticCurveTo(x, y, x + rr, y)
    .closePath();
}

function textCenter(doc: any, str: string, y: number, opts = {}) {
  const tw = doc.widthOfString(str);
  doc.text(str, (W - tw) / 2, y, { lineBreak: false, ...opts });
}

function hex2rgb(h: string): [number, number, number] {
  const v = parseInt(h.replace('#', ''), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function lerpColor(a: string, b: string, t: number): [number, number, number] {
  const ca = hex2rgb(a), cb = hex2rgb(b);
  return [
    Math.round(ca[0] + (cb[0] - ca[0]) * t),
    Math.round(ca[1] + (cb[1] - ca[1]) * t),
    Math.round(ca[2] + (cb[2] - ca[2]) * t),
  ];
}

function drawBackground(doc: any) {
  doc.rect(0, 0, W, H).fill(C.black);

  // Soft abstract circles
  for (let i = 18; i >= 0; i--) {
    const r = 320 * (i / 18);
    const lv = Math.round(8 * (i / 18));
    const col = `#${[lv + 4, lv + 14, lv + 8].map(x => Math.min(x, 255).toString(16).padStart(2, '0')).join('')}`;
    doc.circle(W * 0.82, H * 0.18, r).fill(col);
  }

  for (let i = 14; i >= 0; i--) {
    const r = 240 * (i / 14);
    const lv = Math.round(6 * (i / 14));
    const col = `#${[lv + 2, lv + 12, lv + 6].map(x => Math.min(x, 255).toString(16).padStart(2, '0')).join('')}`;
    doc.circle(W * 0.12, H * 0.85, r).fill(col);
  }

  // Border lines
  doc.rect(0, 0, W, 6).fill(C.lime);
  doc.rect(0, H - 6, W, 6).fill(C.lime);
  doc.rect(0, 6, 5, H - 12).fill(C.limeDim);
  doc.rect(W - 5, 6, 5, H - 12).fill(C.limeDim);

  doc.save();
  doc.rect(22, 22, W - 44, H - 44).lineWidth(0.8).strokeColor(C.limeDim).stroke();
  doc.restore();

  [[22, 22], [W - 38, 22], [22, H - 38], [W - 38, H - 38]].forEach(([cx, cy]) => {
    doc.rect(cx, cy, 16, 16).fill(C.lime);
  });

  // Corner grid details
  doc.save();
  doc.lineWidth(0.4).strokeColor(C.lime).opacity(0.12);
  for (let i = 0; i < 8; i++) {
    const offset = 30 + i * 14;
    doc.moveTo(5, offset).lineTo(offset, 5).stroke();
  }
  doc.restore();

  doc.save();
  doc.lineWidth(0.4).strokeColor(C.lime).opacity(0.12);
  for (let i = 0; i < 8; i++) {
    const offset = 30 + i * 14;
    doc.moveTo(W - 5, H - offset).lineTo(W - offset, H - 5).stroke();
  }
  doc.restore();

  // Separator lines
  doc.save();
  doc.lineWidth(0.6).strokeColor(C.lime).opacity(0.5);
  doc.moveTo(50, 118).lineTo(W - 50, 118).stroke();
  doc.restore();

  doc.save();
  doc.lineWidth(0.6).strokeColor(C.lime).opacity(0.5);
  doc.moveTo(50, H - 125).lineTo(W - 50, H - 125).stroke();
  doc.restore();

  [[50, 118], [W - 50, 118], [50, H - 125], [W - 50, H - 125]].forEach(([dx, dy]) => {
    doc.circle(dx, dy, 3).fill(C.lime);
  });

  // Header Logo Box
  const logoX = W / 2 - 95, logoY = 34, logoW = 190, logoH = 40;
  doc.save();
  roundRect(doc, logoX, logoY, logoW, logoH, 10);
  doc.fill(C.dark2);
  doc.restore();

  doc.rect(logoX, logoY, 5, logoH).fill(C.lime);

  // Logo drawing text fallback
  doc.font('Helvetica-Bold').fontSize(16).fillColor(C.lime);
  doc.text('FMPG', logoX + 18, logoY + 12, { lineBreak: false });
  doc.font('Helvetica-Bold').fontSize(16).fillColor(C.white);
  doc.text('Careers', logoX + 70, logoY + 12, { lineBreak: false });

  doc.circle(W / 2, logoY - 10, 2.5).fill(C.lime);
}

function drawQR(doc: any, url: string, qrX: number, qrY: number, qrSize: number) {
  const qrData = QRCode.create(url, { errorCorrectionLevel: 'H' });
  const modules = qrData.modules.size;
  const pad = qrSize * 0.028;
  const effective = qrSize - pad * 2;
  const modSize = effective / modules;

  roundRect(doc, qrX, qrY, qrSize, qrSize, 6);
  doc.fill(C.black);

  doc.save();
  roundRect(doc, qrX, qrY, qrSize, qrSize, 6);
  doc.lineWidth(1).strokeColor(C.limeDim).stroke();
  doc.restore();

  const getCol = (row: number) => lerpColor(C.lime, C.white, row / (modules - 1));

  const drawEye = (row: number, col: number) => {
    const cx = qrX + pad + (col + 3.5) * modSize;
    const cy = qrY + pad + (row + 3.5) * modSize;
    const ec = getCol(row + 3.5);
    doc.circle(cx, cy, 3.5 * modSize).fill(ec);
    doc.circle(cx, cy, 2.5 * modSize).fill(C.black);
    doc.circle(cx, cy, 1.5 * modSize).fill(ec);
  };

  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (!qrData.modules.get(r, c)) continue;
      const tl = r < 7 && c < 7;
      const tr = r < 7 && c >= modules - 7;
      const bl = r >= modules - 7 && c < 7;
      if (tl || tr || bl) {
        if (r === 0 && c === 0) drawEye(0, 0);
        if (r === 0 && c === modules - 7) drawEye(0, modules - 7);
        if (r === modules - 7 && c === 0) drawEye(modules - 7, 0);
        continue;
      }
      const cx = qrX + pad + c * modSize + modSize / 2;
      const cy = qrY + pad + r * modSize + modSize / 2;
      doc.circle(cx, cy, (modSize / 2) * 0.92).fill(getCol(r));
    }
  }

  // Scanning corner focus tabs
  const bLen = 10, bW = 1.5, bp = -5;
  [
    [qrX + bp, qrY + bp, 1, 1],
    [qrX + qrSize - bp, qrY + bp, -1, 1],
    [qrX + bp, qrY + qrSize - bp, 1, -1],
    [qrX + qrSize - bp, qrY + qrSize - bp, -1, -1],
  ].forEach(([cx, cy, dx, dy]) => {
    doc.save();
    doc.lineWidth(bW).strokeColor(C.lime);
    doc.moveTo(cx, cy).lineTo(cx + dx * bLen, cy).stroke();
    doc.moveTo(cx, cy).lineTo(cx, cy + dy * bLen).stroke();
    doc.restore();
  });
}

function drawSignatureBlock(doc: any, x: number, y: number, label: string, name: string) {
  doc.font('Helvetica-Bold').fontSize(10).fillColor(C.white);
  doc.text(name, x, y - 12, { lineBreak: false, width: 130 });

  doc.save();
  doc.lineWidth(0.8).strokeColor(C.limeDim);
  doc.moveTo(x, y).lineTo(x + 130, y).stroke();
  doc.restore();

  doc.circle(x, y, 2.5).fill(C.lime);

  doc.font('Helvetica').fontSize(8).fillColor(C.gray1);
  doc.text(label, x, y + 6, { lineBreak: false, width: 130 });
}

export class PDFService {
  /**
   * Generates a beautifully designed landscape A4 internship certificate.
   */
  static async generateCertificatePDFBuffer(certificate: any): Promise<Buffer> {
    console.log(`Generating stylized certificate in PDFService for: ${certificate.name}`);

    const {
      _id,
      name,
      jobrole,
      domain,
      fromDate,
      toDate,
    } = certificate;

    let verifyBase = (process.env.FRONTEND_URL || 'https://fmpg.vercel.app').replace(/\/+$/, '');
    if (verifyBase.includes('localhost')) {
      verifyBase = verifyBase.replace('https://', 'http://');
    }
    const verifyUrl = `${verifyBase}/verify/${_id}`;

    const fmt = (d: any) => d
      ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : '—';

    const doc = new PDFDocument({
      size: [W, H],
      layout: 'landscape',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      autoFirstPage: false,
      info: {
        Title: `Internship Completion Certificate - ${name}`,
        Author: 'FMPG',
        Subject: 'Internship Completion Certificate',
      },
    });

    doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });

    const buffers: Buffer[] = [];
    doc.on('data', (b) => buffers.push(b));

    drawBackground(doc);

    // Title Header
    doc.font('Helvetica-Bold').fontSize(24).fillColor(C.white);
    textCenter(doc, 'INTERNSHIP COMPLETION CERTIFICATE', 132);

    const titleStr = 'INTERNSHIP COMPLETION CERTIFICATE';
    const titleW = doc.widthOfString(titleStr);
    doc.save();
    doc.lineWidth(1.5).strokeColor(C.lime);
    doc.moveTo((W - titleW) / 2, 162).lineTo((W + titleW) / 2, 162).stroke();
    doc.restore();

    doc.font('Helvetica').fontSize(10).fillColor(C.gray1);
    textCenter(doc, 'Presented by FMPG · fmpg.in', 170);

    // Body Certified
    doc.font('Helvetica').fontSize(12).fillColor(C.gray1);
    textCenter(doc, 'This is to certify that', 196);

    doc.font('Helvetica-Bold').fontSize(40).fillColor(C.lime);
    textCenter(doc, name, 212);

    const nameW = doc.widthOfString(name);
    doc.save();
    doc.lineWidth(1).strokeColor(C.limeDim).opacity(0.6);
    doc.moveTo((W - nameW) / 2, 260).lineTo((W + nameW) / 2, 260).stroke();
    doc.restore();

    doc.font('Helvetica').fontSize(11).fillColor(C.gray1);
    textCenter(doc, 'has successfully completed the internship program in', 268);

    const roleLabel = `${jobrole}  ·  ${domain}`;
    doc.font('Helvetica-Bold').fontSize(12).fillColor(C.lime);
    const roleW = doc.widthOfString(roleLabel);
    const pillX = (W - roleW - 40) / 2;
    const pillY = 284;

    roundRect(doc, pillX, pillY, roleW + 40, 24, 12);
    doc.fill(C.dark3);
    doc.save();
    roundRect(doc, pillX, pillY, roleW + 40, 24, 12);
    doc.lineWidth(0.8).strokeColor(C.limeDim).stroke();
    doc.restore();

    doc.font('Helvetica-Bold').fontSize(12).fillColor(C.lime);
    doc.text(roleLabel, pillX + 20, pillY + 6, { lineBreak: false });

    doc.font('Helvetica').fontSize(10).fillColor(C.gray1);
    const durLine = `Duration :  ${fmt(fromDate)}  -  ${fmt(toDate)}`;
    textCenter(doc, durLine, 320);

    doc.font('Helvetica').fontSize(9).fillColor(C.gray2);
    textCenter(doc, 'in recognition of outstanding commitment, professionalism, and dedication to learning.', 336);

    // Footer QR and Metadata
    const qrSize = 68;
    const qrX = 50;
    const qrY = H - 110;
    drawQR(doc, verifyUrl, qrX, qrY, qrSize);

    doc.font('Helvetica').fontSize(7).fillColor(C.gray2);
    doc.text('Scan to verify', qrX, qrY + qrSize + 8, { lineBreak: false, width: qrSize, align: 'center' });

    const metaX = 175;
    const metaStartY = H - 104;

    const metaRows = [
      ['Certificate ID', `FMPG-${_id}`],
      ['Issued On', fmt(new Date())],
      ['Verify At', verifyUrl],
    ];

    metaRows.forEach(([label, value], i) => {
      const rowY = metaStartY + i * 18;
      doc.font('Helvetica').fontSize(8).fillColor(C.gray2);
      doc.text(label + ' :', metaX, rowY, { lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(8).fillColor(C.offWhite);
      doc.text(value, metaX + 80, rowY, { lineBreak: false, width: 250, ellipsis: true });
    });

    doc.rect(metaX - 12, metaStartY, 2, 50).fill(C.limeDim);

    // Dynamic signature blocks
    drawSignatureBlock(doc, W - 310, metaStartY + 4, 'Founder & Director', 'Vivek Kumar');
    drawSignatureBlock(doc, W - 160, metaStartY + 4, 'HR Manager', 'FMPG Team');

    doc.font('Helvetica').fontSize(7).fillColor(C.gray2);
    doc.text(
      'This is a digitally issued certificate and is valid without a physical signature. Verify at fmpg.in/verify',
      50,
      H - 32,
      { lineBreak: false, width: W - 100, align: 'center' }
    );

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
    });
  }

  /**
   * Generates a beautifully designed portrait A4 employment offer letter.
   */
  static async generateOfferLetter(candidateData: any, jobData: any): Promise<Buffer> {
    console.log(`Generating detailed offer letter in PDFService for: ${candidateData.fullName}`);

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `Offer Letter - ${candidateData.fullName}`,
        Author: 'FMPG',
        Subject: 'Employment Offer'
      }
    });

    const buffers: Buffer[] = [];
    doc.on('data', (b) => buffers.push(b));

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Elegant borders
    doc.rect(20, 20, pageWidth - 40, pageHeight - 40)
      .lineWidth(2)
      .fillOpacity(0.04)
      .fillAndStroke('#f8fafc', '#059669');

    doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
      .lineWidth(0.8)
      .stroke('#047857');

    doc.moveDown(2);

    // Branding Title
    doc.font('Helvetica-Bold')
      .fontSize(26)
      .fillColor('#0f172a')
      .text('FMPG', { align: 'center' });

    doc.font('Helvetica-Oblique')
      .fontSize(11)
      .fillColor('#64748b')
      .text('Your Property Management Partner', { align: 'center' });

    // Decorative divider line
    const lineY = doc.y + 12;
    doc.moveTo(100, lineY)
      .lineTo(pageWidth - 100, lineY)
      .lineWidth(1)
      .stroke('#059669');

    doc.moveDown(3);

    // Reference and Date info box
    doc.font('Helvetica')
      .fontSize(10)
      .fillColor('#334155');

    const dateBoxY = doc.y;
    doc.rect(pageWidth - 210, dateBoxY, 160, 50)
      .fillOpacity(0.06)
      .fill('#f0fdf4');

    doc.text(`Ref: FMPG/HR/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      pageWidth - 200, dateBoxY + 10);
    doc.text(`Date: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`, pageWidth - 200, dateBoxY + 30);

    doc.moveDown(6);

    // Sub-header title
    doc.font('Helvetica-Bold')
      .fontSize(18)
      .fillColor('#0f172a')
      .text('OFFER OF EMPLOYMENT', { align: 'center' });

    const headerLineY = doc.y + 5;
    doc.moveTo(150, headerLineY)
      .lineTo(pageWidth - 150, headerLineY)
      .lineWidth(1)
      .stroke('#059669');

    doc.moveDown(3);

    // Candidate details
    doc.font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#0f172a')
      .text(`Dear ${candidateData.fullName || candidateData.name},`, { continued: false });
    doc.moveDown();

    doc.font('Helvetica')
      .fontSize(11)
      .fillColor('#334155')
      .text(`We are pleased to offer you the position of `, { continued: true })
      .font('Helvetica-Bold').text(`${jobData.title}`, { continued: true })
      .font('Helvetica').text(` at FMPG. This letter confirms our offer of employment under the following terms:`, { continued: false });
    doc.moveDown(1.5);

    // Job specs table box
    const jobDetailsY = doc.y;
    doc.rect(70, jobDetailsY, pageWidth - 140, 100)
      .fillOpacity(0.06)
      .fill('#f0fdf4');

    doc.font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#0f172a')
      .text('Position:', 100, jobDetailsY + 15, { continued: true, width: 80 })
      .font('Helvetica')
      .fillColor('#334155')
      .text(`  ${jobData.title}`, { align: 'left' });

    doc.font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text('Type:', 100, jobDetailsY + 35, { continued: true, width: 80 })
      .font('Helvetica')
      .fillColor('#334155')
      .text(`  ${jobData.type}`, { align: 'left' });

    doc.font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text('Location:', 100, jobDetailsY + 55, { continued: true, width: 80 })
      .font('Helvetica')
      .fillColor('#334155')
      .text(`  ${jobData.location || 'Hoshiarpur, India'}`, { align: 'left' });

    if (jobData.salary) {
      doc.font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text('Salary:', 100, jobDetailsY + 75, { continued: true, width: 80 })
        .font('Helvetica')
        .fillColor('#334155')
        .text(`  ${formatCurrencyValue(jobData.salary)}`, { align: 'left' });
    }

    doc.moveDown(7);

    // Acceptance text
    doc.font('Helvetica')
      .fontSize(11)
      .fillColor('#334155')
      .text('We would like you to start work on ', { continued: true })
      .font('Helvetica-Bold')
      .text(candidateData.startDate ? new Date(candidateData.startDate).toLocaleDateString('en-GB') : '[Start Date]', { continued: true })
      .font('Helvetica')
      .text('. Please confirm your acceptance of this offer by signing and returning this letter.', { continued: false });

    doc.moveDown();
    doc.text('We are excited to welcome you to our team and look forward to your contributions to our company.');
    doc.moveDown(2);

    // Signature boxes
    doc.font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#0f172a')
      .text('Sincerely,', { continued: false });

    doc.font('Helvetica')
      .fontSize(11)
      .fillColor('#334155');

    const signatureHrY = doc.y + 30;
    doc.moveTo(70, signatureHrY)
      .lineTo(200, signatureHrY)
      .lineWidth(0.5)
      .stroke('#64748b');

    doc.text('HR Manager', 70, signatureHrY + 5);
    doc.text('FMPG Team', 70, signatureHrY + 20);

    doc.moveDown(4);

    // Drawing the acceptance block
    const acceptanceY = doc.y;
    doc.rect(50, acceptanceY, pageWidth - 100, 70)
      .fillOpacity(0.06)
      .fill('#f0fdf4')
      .strokeOpacity(0.5)
      .strokeColor('#059669')
      .stroke();

    doc.font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#0f172a')
      .text('I accept this offer of employment:', 70, acceptanceY + 15);

    const signatureCandidateY = acceptanceY + 40;
    doc.moveTo(70, signatureCandidateY)
      .lineTo(200, signatureCandidateY)
      .lineWidth(0.5)
      .stroke('#64748b');

    doc.moveTo(pageWidth - 200, signatureCandidateY)
      .lineTo(pageWidth - 70, signatureCandidateY)
      .lineWidth(0.5)
      .stroke('#64748b');

    doc.font('Helvetica')
      .fontSize(10)
      .fillColor('#334155')
      .text(candidateData.fullName || candidateData.name, 70, signatureCandidateY + 5);

    doc.text('Date', pageWidth - 200, signatureCandidateY + 5);

    // Page count footer
    const footerY = pageHeight - 40;
    doc.font('Helvetica')
      .fontSize(8)
      .fillColor('#94a3b8')
      .text('FMPG - Confidential', 70, footerY);

    doc.text('Page 1 of 1', pageWidth - 100, footerY);

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
    });
  }
}

export default PDFService;
