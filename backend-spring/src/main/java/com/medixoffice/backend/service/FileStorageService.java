package com.medixoffice.backend.service;

import com.medixoffice.backend.dto.medicalrecord.StoredFile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/** Mirrors Node's uploadMiddleware.js: one subfolder per patient, a unique suffix per stored filename. */
@Service
public class FileStorageService {

    private final Path baseDir;

    public FileStorageService(@Value("${app.uploads.medical-files-dir}") String baseDir) {
        this.baseDir = Path.of(baseDir);
    }

    public List<StoredFile> store(Integer patientId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }

        Path patientDir = baseDir.resolve("patient_" + patientId);
        try {
            Files.createDirectories(patientDir);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not create upload directory", e);
        }

        List<StoredFile> stored = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                continue;
            }

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            int dot = originalName.lastIndexOf('.');
            String extension = dot >= 0 ? originalName.substring(dot) : "";
            String base = dot >= 0 ? originalName.substring(0, dot) : originalName;
            String uniqueSuffix = System.currentTimeMillis() + "-" + (int) (Math.random() * 1_000_000_000);
            String storedFilename = base + "-" + uniqueSuffix + extension;

            Path target = patientDir.resolve(storedFilename);
            try {
                file.transferTo(target);
            } catch (IOException e) {
                throw new UncheckedIOException("Failed to store file " + originalName, e);
            }

            stored.add(new StoredFile(originalName, storedFilename, target.toString(), file.getContentType(), file.getSize()));
        }
        return stored;
    }

    public void delete(List<StoredFile> files) {
        if (files == null) {
            return;
        }
        for (StoredFile file : files) {
            try {
                Files.deleteIfExists(Path.of(file.path()));
            } catch (IOException ignored) {
                // best effort - a missing/locked file shouldn't block the rest of the operation
            }
        }
    }
}
