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

    @org.springframework.beans.factory.annotation.Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private java.nio.file.Path getUploadPath() {
        return java.nio.file.Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public com.mockanytime.dakplus.assessment.dto.DocumentExtractionResult extractText(MultipartFile file) throws IOException {
        return extractTextFromBytes(file.getBytes(), file.getOriginalFilename());
    }

    public com.mockanytime.dakplus.assessment.dto.DocumentExtractionResult extractTextFromBytes(byte[] bytes, String filename) throws IOException {
        long size = bytes.length;
        System.out.println("=== Extraction Request ===");
        System.out.println("Filename: " + filename);
        System.out.println("Size: " + size + " bytes");
        
        if (filename == null || filename.isBlank()) {
            System.err.println("Error: Filename is null or blank.");
            return new com.mockanytime.dakplus.assessment.dto.DocumentExtractionResult("");
        }

        com.mockanytime.dakplus.assessment.dto.DocumentExtractionResult result = new com.mockanytime.dakplus.assessment.dto.DocumentExtractionResult();
        String lowerName = filename.toLowerCase();
        
        if (lowerName.endsWith(".pdf")) {
            result.setText(extractFromPdf(bytes));
        } else if (lowerName.endsWith(".docx")) {
            result = extractFromWord(bytes);
        } else if (lowerName.endsWith(".doc")) {
            result.setText(extractFromOldWord(bytes));
        } else if (lowerName.endsWith(".txt")) {
            result.setText(new String(bytes));
        } else if (isImageFile(filename)) {
            // New Image Support: Save image and return placeholder
            String imageId = java.util.UUID.randomUUID().toString();
            String ext = lowerName.substring(lowerName.lastIndexOf(".") + 1);
            String fileName = imageId + "." + ext;
            java.nio.file.Path target = getUploadPath().resolve(fileName);
            java.nio.file.Files.createDirectories(target.getParent());
            java.nio.file.Files.write(target, bytes);
            
            String imageUrl = "/files/download/" + fileName;
            String placeholder = "[IMAGE_ID: " + imageId + "]";
            result.getImageMap().put(placeholder, imageUrl);
            
            // Return placeholder as the main text so QuestionExtractionService knows there's an image
            result.setText("IMAGE_EXTRACTION_REQUEST: " + placeholder + "\n(Extract question and options from this figure)");
        } else {
            try {
                System.out.println("No clear type detected. Trying PDF fallback parser...");
                result.setText(extractFromPdf(bytes));
            } catch (Exception e) {
                System.err.println("Error: Unsupported file type and PDF fallback failed: " + filename);
                throw new IllegalArgumentException("Unsupported file type: " + filename + ". Please ensure your file has a .pdf, .docx, or .txt extension.");
            }
        }
        
        System.out.println("Extraction Result: " + (result.getText() != null ? result.getText().length() : 0) + " characters.");
        return result;
    }

    private boolean isImageFile(String filename) {
        if (filename == null) return false;
        String lower = filename.toLowerCase();
        return lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp");
    }

    private String extractFromPdf(byte[] bytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private com.mockanytime.dakplus.assessment.dto.DocumentExtractionResult extractFromWord(byte[] bytes) throws IOException {
        try (InputStream inputStream = new ByteArrayInputStream(bytes);
                XWPFDocument doc = new XWPFDocument(inputStream)) {

            StringBuilder fullText = new StringBuilder();
            java.util.Map<String, String> imageMap = new java.util.HashMap<>();

            for (org.apache.poi.xwpf.usermodel.IBodyElement element : doc.getBodyElements()) {
                if (element instanceof org.apache.poi.xwpf.usermodel.XWPFParagraph) {
                    org.apache.poi.xwpf.usermodel.XWPFParagraph p = (org.apache.poi.xwpf.usermodel.XWPFParagraph) element;
                    for (org.apache.poi.xwpf.usermodel.XWPFRun run : p.getRuns()) {
                        String runText = run.text();
                        if (runText != null) {
                            fullText.append(runText);
                        }
                        
                        // Extract inline images
                        for (org.apache.poi.xwpf.usermodel.XWPFPicture pic : run.getEmbeddedPictures()) {
                            org.apache.poi.xwpf.usermodel.XWPFPictureData picData = pic.getPictureData();
                            if (picData != null) {
                                String ext = picData.suggestFileExtension();
                                String mimeType = "image/" + (ext.equals("jpg") ? "jpeg" : ext);
                                String imageId = java.util.UUID.randomUUID().toString();
                                String fileName = imageId + "." + ext;
                                java.nio.file.Path filePath = getUploadPath().resolve(fileName);
                                
                                // Ensure upload directory exists
                                if (!java.nio.file.Files.exists(getUploadPath())) {
                                    java.nio.file.Files.createDirectories(getUploadPath());
                                }
                                
                                // Save file to disk
                                java.nio.file.Files.write(filePath, picData.getData());
                                
                                String imageUrl = "/files/download/" + fileName;
                                String placeholder = "[IMAGE_ID: " + imageId + "]";
                                imageMap.put(placeholder, imageUrl);
                                
                                fullText.append("\n").append(placeholder).append("\n");
                                System.out.println("Saved extracted image: " + fileName);
                            }
                        }
                    }
                    fullText.append("\n");
                } else if (element instanceof org.apache.poi.xwpf.usermodel.XWPFTable) {
                    org.apache.poi.xwpf.usermodel.XWPFTable table = (org.apache.poi.xwpf.usermodel.XWPFTable) element;
                    for (org.apache.poi.xwpf.usermodel.XWPFTableRow row : table.getRows()) {
                        for (org.apache.poi.xwpf.usermodel.XWPFTableCell cell : row.getTableCells()) {
                            String cellText = cell.getText();
                            if (cellText != null && !cellText.isBlank()) {
                                fullText.append(cellText).append(" ");
                            }
                        }
                        fullText.append("\n");
                    }
                    fullText.append("\n");
                }
            }

            return new com.mockanytime.dakplus.assessment.dto.DocumentExtractionResult(fullText.toString(), imageMap);
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
