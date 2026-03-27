const fs = require("fs");
const pdfParse = require("pdf-parse");

exports.extractText = async (filePath) => {
    try {
        const buffer = fs.readFileSync(filePath);

        // Try pdf-parse with error handling
        const data = await pdfParse(buffer);
        return data.text;

    } catch (error) {
        console.error("PDF extraction error:", error.message);

        // Provide helpful error message
        if (error.message.includes('bad XRef entry')) {
            throw new Error("PDF file appears to be corrupted or has an invalid structure. Please try with a different PDF file.");
        } else if (error.message.includes('Invalid PDF')) {
            throw new Error("Invalid PDF file. Please ensure the uploaded file is a valid PDF.");
        } else {
            throw new Error(`Failed to extract text from PDF: ${error.message}`);
        }
    }
};