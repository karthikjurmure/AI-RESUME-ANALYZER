const puppeteer=require('puppeteer');
exports.generatePDFReport=async(data={})=>{
    const {
        atsScore = 0,
        matchedSkills = [],
        missingSkills = [],
        suggestions = []
    } = data;

    const html = `
  <html>
    <head>
      <style>
        body { font-family: Arial; padding: 20px; }
        h1 { color: #2c3e50; }
        .score { font-size: 24px; color: green; }
        .section { margin-top: 20px; }
        .good { color: green; }
        .bad { color: red; }
      </style>
    </head>
    <body>

      <h1>📄 ATS Resume Report</h1>

      <div class="section">
        <p class="score">ATS Score: ${atsScore}%</p>
      </div>

      <div class="section">
        <h3>✅ Matched Skills</h3>
        <ul>
          ${matchedSkills.map(s => `<li class="good">${s}</li>`).join("")}
        </ul>
      </div>

      <div class="section">
        <h3>❌ Missing Skills</h3>
        <ul>
          ${missingSkills.map(s => `<li class="bad">${s}</li>`).join("")}
        </ul>
      </div>

      <div class="section">
        <h3>💡 Suggestions</h3>
        <ul>
          ${suggestions.map(s => `<li>${s}</li>`).join("")}
        </ul>
      </div>

    </body>
  </html>
  `;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });
    await browser.close();
    return pdfBuffer;
}
