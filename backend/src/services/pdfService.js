const fs = require("fs");
const path = require("path");

async function generateReportPdf(reportData = {}, filename = "report.pdf") {
  const outPath = path.join(__dirname, "../../tmp", filename);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, "PDF placeholder for " + JSON.stringify(reportData));
  return outPath;
}

module.exports = { generateReportPdf };
