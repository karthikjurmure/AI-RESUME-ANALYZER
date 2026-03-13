const fs = require("fs");
const pdfParse = require("pdf-parse");

exports.extractText = async (filePath) => {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
};