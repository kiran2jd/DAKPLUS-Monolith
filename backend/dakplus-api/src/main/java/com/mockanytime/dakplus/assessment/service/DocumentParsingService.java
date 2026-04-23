package com.mockanytime.dakplus.assessment.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

@Service
public class DocumentParsingService {

    public String extractText(MultipartFile file) throws IOException {
        return extractTextFromBytes(file.getBytes(), file.getOriginalFilename());
    }

    public String extractTextFromBytes(byte[] bytes, String filename) throws IOException {
        long size = bytes.length;
        System.out.println("=== Extraction Request ===");
        System.out.println("Filename: " + filename);
        System.out.println("Size: " + size + " bytes");
        
        if (filename == null || filename.isBlank()) {
            System.err.println("Error: Filename is null or blank.");
            return "";
        }

        String result = "";
        String lowerName = filename.toLowerCase();
        
        if (lowerName.endsWith(".pdf")) {
            result = extractFromPdf(bytes);
        } else if (lowerName.endsWith(".docx")) {
            result = extractFromWord(bytes);
        } else if (lowerName.endsWith(".doc")) {
            result = extractFromOldWord(bytes);
        } else if (lowerName.endsWith(".txt")) {
            result = new String(bytes);
        } else if (isImageFile(filename)) {
            result = performOcr(bytes);
        } else {
            try {
                System.out.println("No clear type detected. Trying PDF fallback parser...");
                result = extractFromPdf(bytes);
            } catch (Exception e) {
                System.err.println("Error: Unsupported file type and PDF fallback failed: " + filename);
                throw new IllegalArgumentException("Unsupported file type: " + filename + ". Please ensure your file has a .pdf, .docx, or .txt extension.");
            }
        }
        
        System.out.println("Extraction Result: " + (result != null ? result.length() : 0) + " characters.");
        return result;
    }

    private boolean isImageFile(String filename) {
        String lower = filename.toLowerCase();
        return lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".bmp");
    }

    private String extractFromPdf(byte[] bytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String extractFromWord(byte[] bytes) throws IOException {
        try (InputStream inputStream = new ByteArrayInputStream(bytes);
                XWPFDocument doc = new XWPFDocument(inputStream);
                XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {

            String mainText = extractor.getText();
            StringBuilder fullText = new StringBuilder(mainText != null ? mainText : "");

            // SUPPLEMENTAL SCAN: Specifically look for Tables/Images that standard extractor might miss.
            // We search for unique elements to avoid doubling "mainText".
            if (fullText.length() < 500) { // If truly empty, do a full manual scan
                System.out.println("Word Extraction: Standard extractor returned very little text. Full manual scan...");
                for (org.apache.poi.xwpf.usermodel.XWPFParagraph p : doc.getParagraphs()) {
                    String pText = p.getText();
                    if (pText != null && !pText.isBlank()) {
                        fullText.append(pText).append("\n");
                    }
                }
            }
            
            // 2. Always check tables but only append if text isn't already there
            for (org.apache.poi.xwpf.usermodel.XWPFTable table : doc.getTables()) {
                StringBuilder tableText = new StringBuilder();
                for (org.apache.poi.xwpf.usermodel.XWPFTableRow row : table.getRows()) {
                    for (org.apache.poi.xwpf.usermodel.XWPFTableCell cell : row.getTableCells()) {
                        String cellText = cell.getText();
                        if (cellText != null && !cellText.isBlank()) {
                            tableText.append(cellText).append(" ");
                        }
                    }
                    tableText.append("\n");
                }
                
                // Only append table text if it's not already wellrepresented in "mainText"
                String tStr = tableText.toString();
                if (tStr.length() > 10 && !mainText.contains(tStr.substring(0, Math.min(20, tStr.length())))) {
                    System.out.println("Word Extraction: Supplementing missing table content...");
                    fullText.append("\n[Table Content]:\n").append(tStr);
                }
            }

            // Extract images and perform OCR
            try {
                for (org.apache.poi.xwpf.usermodel.XWPFPictureData picture : doc.getAllPictures()) {
                    try {
                        String ocrResult = performOcr(picture.getData());
                        if (ocrResult != null && !ocrResult.isBlank()) {
                            System.out.println("OCR Success: Extracted " + ocrResult.length() + " chars from image.");
                            fullText.append("\n[Image Text Content]:\n").append(ocrResult).append("\n");
                        }
                    } catch (Exception e) {
                        System.err.println("Non-critical: OCR failed for an image chunk. " + e.getMessage());
                    }
                }
            } catch (Exception e) {
                System.err.println("Warning: Could not extract pictures from DOCX: " + e.getMessage());
            }

            return fullText.toString();
        }
    }

    private String extractFromOldWord(byte[] bytes) throws IOException {
        try (InputStream inputStream = new ByteArrayInputStream(bytes);
                WordExtractor extractor = new WordExtractor(inputStream)) {
            return extractor.getText();
        }
    }

    private String performOcr(byte[] imageData) {
        java.io.File tempFile = null;
        try {
            net.sourceforge.tess4j.ITesseract instance = new net.sourceforge.tess4j.Tesseract();

            // Check common Linux tessdata locations (Ubuntu/Debian vs Alpine)
            String[] commonPaths = {
                    "/usr/share/tesseract-ocr/4.00/tessdata",
                    "/usr/share/tesseract-ocr/5/tessdata",
                    "/usr/share/tessdata"
            };

            for (String path : commonPaths) {
                java.io.File folder = new java.io.File(path);
                if (folder.exists()) {
                    System.out.println("Tessdata found at: " + folder.getAbsolutePath());
                    instance.setDatapath(folder.getAbsolutePath());
                    break;
                }
            }

            // Create a temp file for the image
            tempFile = java.io.File.createTempFile("ocr_chunk_", ".png");

            // PREPROCESSING: Scale and Grayscale for better OCR
            try (InputStream is = new ByteArrayInputStream(imageData)) {
                BufferedImage originalImage = ImageIO.read(is);
                if (originalImage != null) {
                    int newWidth = originalImage.getWidth() * 2;
                    int newHeight = originalImage.getHeight() * 2;
                    BufferedImage resizedImage = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_BYTE_GRAY);
                    Graphics2D g = resizedImage.createGraphics();
                    g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                    g.drawImage(originalImage, 0, 0, newWidth, newHeight, null);
                    g.dispose();
                    ImageIO.write(resizedImage, "png", tempFile);
                } else {
                    java.nio.file.Files.write(tempFile.toPath(), imageData);
                }
            }

            System.out.println("Executing Tesseract OCR on " + tempFile.getName() + " (" + tempFile.length()
                    + " bytes after processing)");
            instance.setTessVariable("user_defined_dpi", "300");
            String result = instance.doOCR(tempFile);

            if (result == null || result.isBlank()) {
                System.out.println("Warning: OCR returned empty result for image.");
                return "";
            }
            return result;
        } catch (Throwable e) {
            // JVM level errors like SIGSEGV or UnsatisfiedLinkError should be caught to
            // prevent service death
            System.err.println("OCR Error (Critical): " + e.getMessage());
            e.printStackTrace();
            return "";
        } finally {
            if (tempFile != null && tempFile.exists()) {
                boolean deleted = tempFile.delete();
                if (!deleted)
                    tempFile.deleteOnExit();
            }
        }
    }
}
