package com.mockanytime.dakplus.assessment.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
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
        String filename = file.getOriginalFilename();
        if (filename == null)
            return "";

        if (filename.toLowerCase().endsWith(".pdf")) {
            return extractFromPdf(file);
        } else if (filename.toLowerCase().endsWith(".docx")) {
            return extractFromWord(file);
        } else if (filename.toLowerCase().endsWith(".txt")) {
            return new String(file.getBytes());
        } else if (isImageFile(filename)) {
            return performOcr(file.getBytes());
        } else {
            throw new IllegalArgumentException("Unsupported file type: " + filename);
        }
    }

    private boolean isImageFile(String filename) {
        String lower = filename.toLowerCase();
        return lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".bmp");
    }

    private String extractFromPdf(MultipartFile file) throws IOException {
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String extractFromWord(MultipartFile file) throws IOException {
        try (InputStream inputStream = file.getInputStream();
                XWPFDocument doc = new XWPFDocument(inputStream);
                XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {

            StringBuilder fullText = new StringBuilder(extractor.getText());

            // Extract images and perform OCR
            for (org.apache.poi.xwpf.usermodel.XWPFPictureData picture : doc.getAllPictures()) {
                try {
                    String ocrResult = performOcr(picture.getData());
                    if (ocrResult != null && !ocrResult.isBlank()) {
                        System.out.println("OCR Success: Extracted " + ocrResult.length() + " chars from image.");
                        fullText.append("\n[Image Text Content]:\n").append(ocrResult).append("\n");
                    }
                } catch (Exception e) {
                    // Log error but don't break the whole extraction
                    System.err.println("Non-critical: OCR failed for an image chunk. Skipping this image. Error: "
                            + e.getMessage());
                } catch (NoClassDefFoundError | UnsatisfiedLinkError e) {
                    // Special handling for missing system dependencies (common in Railway/Docker)
                    System.err.println("CRITICAL: Tesseract native library or class not found.");
                    System.err.println("Error details: " + e.toString());
                    System.err.println("java.library.path: " + System.getProperty("java.library.path"));
                    break; // stop trying OCR for this doc if library is missing
                }
            }

            return fullText.toString();
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
