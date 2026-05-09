const compileText = (text, data) => {
  if (!text) return '';
  return text.replace(/\{\{(.*?)\}\}/g, (match, key) => data[key.trim()] || '');
};

const renderDynamicTemplate = (template, data) => {
  const { canvas, elements } = template;
  const width = canvas.width || 1123;
  const height = canvas.height || 794;
  const bgColor = canvas.backgroundColor || '#0d0d0d';
  
  let backgroundStyle = '';
  if (canvas.backgroundImage) {
    backgroundStyle = `background-image: url('${canvas.backgroundImage}'); background-size: cover; background-position: center;`;
  } else if (canvas.backgroundGradient) {
    backgroundStyle = `background-image: ${canvas.backgroundGradient};`;
  }

  let htmlElements = elements.map(el => {
    const baseStyle = `position: absolute; left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.type === 'line' ? 'auto' : el.height + 'px'}; z-index: ${el.zIndex || 1};`;
    
    if (el.type === 'text') {
      const textContent = compileText(el.text, data);
      const textStyle = `${baseStyle} font-family: ${el.fontFamily}; font-size: ${el.fontSize}px; font-weight: ${el.fontWeight}; color: ${el.color}; text-align: ${el.align}; background-color: ${el.backgroundColor}; border: ${el.borderWidth}px solid ${el.borderColor}; box-sizing: border-box;`;
      return `<div style="${textStyle}">${textContent}</div>`;
    }
    if (el.type === 'rectangle') {
      const rectStyle = `${baseStyle} background-color: ${el.backgroundColor}; border: ${el.borderWidth}px solid ${el.borderColor}; box-sizing: border-box;`;
      return `<div style="${rectStyle}"></div>`;
    }
    if (el.type === 'line') {
      const lineStyle = `${baseStyle} border-top: ${el.borderWidth}px solid ${el.borderColor};`;
      return `<div style="${lineStyle}"></div>`;
    }
    if (el.type === 'image' && el.src) {
      return `<div style="${baseStyle}"><img src="${el.src}" style="width: 100%; height: 100%; object-fit: contain;" /></div>`;
    }
    if (el.type === 'qr') {
      // In a real app, generate base64 QR code. Here we just add a placeholder box
      const qrStyle = `${baseStyle} background-color: white; border: 1px solid black; display: flex; align-items: center; justify-content: center; font-size: 10px; color: black;`;
      return `<div style="${qrStyle}">[ QR CODE ]</div>`;
    }
    return '';
  }).join('\\n');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Document</title>
      <style>
        @page { size: landscape; margin: 0; }
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: ${bgColor}; -webkit-print-color-adjust: exact; print-color-adjust: exact; overflow: hidden; }
        .cert-container { width: ${width}px; height: ${height}px; position: relative; box-sizing: border-box; ${bgImg} }
      </style>
    </head>
    <body>
      <div class="cert-container">
        ${htmlElements}
      </div>
      <script>
        window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };
      </script>
    </body>
    </html>
  `;
};

export const generateCertificatePDF = async (certificate, template = null) => {
  return new Promise((resolve) => {
    let htmlContent = '';
    
    if (template && template.elements && template.elements.length > 0) {
      // Use Dynamic Template
      const data = {
        ...certificate,
        issuedOn: new Date(certificate.issuedOn || certificate.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        fromDate: new Date(certificate.fromDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        toDate: new Date(certificate.toDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        candidateName: certificate.name || certificate.candidateName
      };
      htmlContent = renderDynamicTemplate(template, data);
    } else {
      // Use Hardcoded Legacy Template
      const width = 1123;
      const height = 794;
      const issuedOn = new Date(certificate.issuedOn || certificate.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      const fromDate = new Date(certificate.fromDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const toDate = new Date(certificate.toDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>FMPG Certificate - ${certificate.certificateId || 'PENDING'}</title>
          <style>
            @page { size: landscape; margin: 0; }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0d0d0d; color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; overflow: hidden; }
            .cert-container { width: ${width}px; height: ${height}px; position: relative; box-sizing: border-box; }
            .border { position: absolute; left: 30px; top: 30px; width: 1063px; height: 734px; border: 3px solid #d6f300; box-sizing: border-box; }
            .brand { position: absolute; left: 0; top: 62px; width: ${width}px; text-align: center; font-size: 36px; font-weight: 700; color: #d6f300; }
            .title { position: absolute; left: 0; top: 160px; width: ${width}px; text-align: center; font-size: 30px; font-weight: 700; }
            .intro { position: absolute; left: 0; top: 250px; width: ${width}px; text-align: center; font-size: 18px; color: #cbd5e1; }
            .name { position: absolute; left: 0; top: 292px; width: ${width}px; text-align: center; font-size: 48px; font-weight: 700; color: #d6f300; }
            .detail { position: absolute; left: 150px; top: 382px; width: 823px; text-align: center; font-size: 22px; color: #e5e7eb; line-height: 1.5; }
            .duration { position: absolute; left: 0; top: 462px; width: ${width}px; text-align: center; font-size: 17px; color: #a3a3a3; }
            .id { position: absolute; left: 206px; top: 625px; width: 480px; font-size: 15px; color: #e5e7eb; }
            .issued { position: absolute; left: 206px; top: 660px; width: 300px; font-size: 15px; color: #a3a3a3; }
            .signature-line { position: absolute; left: 790px; top: 655px; width: 190px; border-top: 2px solid #d6f300; }
            .signature { position: absolute; left: 760px; top: 670px; width: 250px; text-align: center; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="cert-container">
            <div class="border"></div>
            <div class="brand">FMPG</div>
            <div class="title">INTERNSHIP COMPLETION CERTIFICATE</div>
            <div class="intro">This is to certify that</div>
            <div class="name">${certificate.name || certificate.candidateName}</div>
            <div class="detail">has successfully completed the internship program as <strong>${certificate.jobrole}</strong> in <strong>${certificate.domain}</strong>.</div>
            <div class="duration">Duration: ${fromDate} - ${toDate}</div>
            <div class="id">Certificate ID: ${certificate.certificateId || 'PENDING'}</div>
            <div class="issued">Issued On: ${issuedOn}</div>
            <div class="signature-line"></div>
            <div class="signature">${certificate.issuedBy?.name || certificate.issuedBy || 'FMPG HR'}</div>
          </div>
          <script>
            window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };
          </script>
        </body>
        </html>
      `;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    resolve(true);
  });
};

export const generateOfferLetterPDF = async (offer, template = null) => {
  return new Promise((resolve) => {
    let htmlContent = '';
    
    if (template && template.elements && template.elements.length > 0) {
      const data = {
        ...offer,
        startDate: new Date(offer.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        validUntil: offer.validUntil ? new Date(offer.validUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A',
      };
      htmlContent = renderDynamicTemplate(template, data);
    } else {
      const width = 1123;
      const height = 794;
      const startDate = new Date(offer.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const validUntil = offer.validUntil ? new Date(offer.validUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A';
      
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>FMPG Offer Letter - ${offer.candidateName}</title>
          <style>
            @page { size: landscape; margin: 0; }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0d0d0d; color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; overflow: hidden; }
            .cert-container { width: ${width}px; height: ${height}px; position: relative; box-sizing: border-box; }
            .border { position: absolute; left: 30px; top: 30px; width: 1063px; height: 734px; border: 3px solid #d6f300; box-sizing: border-box; }
            .brand { position: absolute; left: 60px; top: 54px; width: 220px; font-size: 34px; font-weight: 700; color: #d6f300; }
            .title { position: absolute; left: 0; top: 130px; width: ${width}px; text-align: center; font-size: 34px; font-weight: 700; }
            .dear { position: absolute; left: 90px; top: 215px; width: 700px; font-size: 22px; font-weight: 700; }
            .body { position: absolute; left: 90px; top: 270px; width: 850px; font-size: 24px; color: #e5e7eb; line-height: 1.5; }
            .details { position: absolute; left: 120px; top: 385px; width: 520px; font-size: 20px; color: #d1d5db; line-height: 1.8; }
            .valid { position: absolute; left: 120px; top: 560px; width: 460px; font-size: 20px; color: #d6f300; }
            .sign { position: absolute; left: 690px; top: 610px; width: 180px; text-align: center; font-size: 18px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="cert-container">
            <div class="border"></div>
            <div class="brand">FMPG</div>
            <div class="title">OFFER LETTER</div>
            <div class="dear">Dear ${offer.candidateName},</div>
            <div class="body">We are pleased to offer you the position of <strong>${offer.position}</strong> in <strong>${offer.department}</strong> at FMPG.</div>
            <div class="details">
              Start Date: ${startDate}<br/>
              Location: ${offer.joiningLocation || 'Indore'}<br/>
              Work Type: ${offer.workType || 'On-site'}<br/>
              Compensation: ${offer.salary || 'As discussed'}
            </div>
            <div class="valid">Valid Until: ${validUntil}</div>
            <div class="sign">${offer.issuedBy?.name || offer.issuedBy || 'HR Team'}<br/>Human Resources</div>
          </div>
          <script>
            window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };
          </script>
        </body>
        </html>
      `;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    resolve(true);
  });
};
