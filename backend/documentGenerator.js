const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class DocumentGenerator {
    generatePDF(formData) {
        return new Promise((resolve, reject) => {
            try {
                console.log('=== DOCUMENT GENERATOR START ===');
                console.log('Form data received:', formData);
                const doc = new PDFDocument({
                    margin: 50,
                    size: 'A4'
                });
                
                const filename = `work_summary_${Date.now()}_${formData.internName.replace(/\s+/g, '_')}.pdf`;
                const filePath = path.join(__dirname, '..', 'generated_docs', filename);
                
                // Create write stream
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);
                
                // Add logo (optional - check if file exists)
                try {
                    const logoPath = path.join(__dirname, 'assets', 'default-logo.png');
                    if (fs.existsSync(logoPath)) {
                        doc.image(logoPath, 50, 45, { width: 50 })
                           .fillColor('#444444');
                    } else {
                        // Skip logo if file doesn't exist
                        doc.fillColor('#444444');
                    }
                } catch (error) {
                    // Skip logo if there's an error
                    doc.fillColor('#444444');
                }
                
                // Company name centered
                doc.fontSize(20)
                   .text(formData.companyName, 0, 50, { align: 'center' });
                
                doc.moveDown();
                
                // Document title
                doc.fontSize(16)
                   .fillColor('#2c3e50')
                   .text('DAILY WORK SUMMARY REPORT', { align: 'center', underline: true });
                
                doc.moveDown(2);
                
                // Intern Information
                doc.fontSize(14)
                   .fillColor('#3498db')
                   .text('1. INTERN INFORMATION', { underline: true });
                
                doc.fontSize(11)
                   .fillColor('#333333')
                   .text(`Name: ${formData.internName}`);
                doc.text(`Date: ${new Date(formData.date).toLocaleDateString()}`);
                doc.text(`Task Title: ${formData.taskTitle}`);
                
                doc.moveDown();
                
                // Introduction
                doc.fontSize(14)
                   .fillColor('#3498db')
                   .text('2. INTRODUCTION', { underline: true });
                
                doc.fontSize(11)
                   .fillColor('#333333')
                   .text(formData.introduction, {
                       align: 'justify',
                       lineGap: 5
                   });
                
                doc.moveDown();
                
                // Topics Covered
                doc.fontSize(14)
                   .fillColor('#3498db')
                   .text('3. TOPICS COVERED', { underline: true });
                
                const topics = Array.isArray(formData.topicsCovered) 
                    ? formData.topicsCovered 
                    : formData.topicsCovered.split('\n').filter(t => t.trim());
                
                topics.forEach(topic => {
                    doc.fontSize(11)
                       .fillColor('#333333')
                       .text(`• ${topic.trim()}`, {
                           indent: 20,
                           lineGap: 3
                       });
                });
                
                doc.moveDown();
                
                // Practice Examples
                doc.fontSize(14)
                   .fillColor('#3498db')
                   .text('4. PRACTICE & EXAMPLES', { underline: true });
                
                doc.fontSize(11)
                   .fillColor('#333333')
                   .text(formData.practiceExamples, {
                       align: 'justify',
                       lineGap: 5
                   });
                
                doc.moveDown();
                
                // Summary
                doc.fontSize(14)
                   .fillColor('#3498db')
                   .text('5. SUMMARY', { underline: true });
                
                doc.fontSize(11)
                   .fillColor('#333333')
                   .text('This daily summary report was generated using the Document Generator System. The intern demonstrated progress in the mentioned areas and actively participated in the learning process.', {
                       align: 'justify',
                       lineGap: 5
                   });
                
                doc.moveDown();
                
                // Footer
                doc.fontSize(10)
                   .fillColor('#666666')
                   .text(`Generated on: ${new Date().toLocaleString()}`, 50, doc.page.height - 100);
                
                doc.text('Document Generator System © 2024', { align: 'center' });
                
                // Finalize PDF
                doc.end();
                
                stream.on('finish', () => {
                    resolve(filePath);
                });
                
                stream.on('error', (error) => {
                    reject(error);
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    generateDOCX(formData) {
        // For DOCX generation, you would use the 'docx' library
        // This is a placeholder for the DOCX implementation
        return new Promise((resolve, reject) => {
            try {
                // DOCX generation logic here
                const filename = `work_summary_${Date.now()}_${formData.internName.replace(/\s+/g, '_')}.docx`;
                const filePath = path.join(__dirname, '..', 'generated_docs', filename);
                
                // In a real implementation, create DOCX using the docx library
                // For now, we'll create a simple text file as placeholder
                const content = `
                    DAILY WORK SUMMARY REPORT
                    ==========================
                    
                    Company: ${formData.companyName}
                    
                    1. INTERN INFORMATION
                    ---------------------
                    Name: ${formData.internName}
                    Date: ${formData.date}
                    Task Title: ${formData.taskTitle}
                    
                    2. INTRODUCTION
                    ---------------
                    ${formData.introduction}
                    
                    3. TOPICS COVERED
                    -----------------
                    ${Array.isArray(formData.topicsCovered) ? formData.topicsCovered.map(t => `• ${t}`).join('\n') : formData.topicsCovered}
                    
                    4. PRACTICE & EXAMPLES
                    ----------------------
                    ${formData.practiceExamples}
                    
                    5. SUMMARY
                    ----------
                    This daily summary report was generated using the Document Generator System.
                    
                    Generated on: ${new Date().toLocaleString()}
                `;
                
                fs.writeFileSync(filePath, content);
                resolve(filePath);
                
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = new DocumentGenerator();