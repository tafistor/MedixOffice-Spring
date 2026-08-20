package com.medixoffice.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.openpdf.text.Document;
import org.openpdf.text.DocumentException;
import org.openpdf.text.Font;
import org.openpdf.text.PageSize;
import org.openpdf.text.Paragraph;
import org.openpdf.text.pdf.PdfWriter;
import com.medixoffice.backend.dto.doctor.DoctorResponse;
import com.medixoffice.backend.dto.medicalrecord.MedicalRecordCreateRequest;
import com.medixoffice.backend.dto.medicalrecord.MedicalRecordResponse;
import com.medixoffice.backend.dto.medicalrecord.MedicalRecordUpdateRequest;
import com.medixoffice.backend.dto.medicalrecord.StoredFile;
import com.medixoffice.backend.dto.patient.PatientResponse;
import com.medixoffice.backend.entity.Consultation;
import com.medixoffice.backend.entity.Doctor;
import com.medixoffice.backend.entity.MedicalRecord;
import com.medixoffice.backend.entity.Patient;
import com.medixoffice.backend.entity.User;
import com.medixoffice.backend.exception.ResourceNotFoundException;
import com.medixoffice.backend.repository.ConsultationRepository;
import com.medixoffice.backend.repository.DoctorRepository;
import com.medixoffice.backend.repository.MedicalRecordRepository;
import com.medixoffice.backend.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/** PDF/ZIP export are kept functional but plain - no attempt to match the original's colored section headers. */
@Service
public class MedicalRecordService {

    private static final Font TITLE_FONT = new Font(Font.HELVETICA, 20, Font.BOLD);
    private static final Font HEADER_FONT = new Font(Font.HELVETICA, 13, Font.BOLD);
    private static final Font BODY_FONT = new Font(Font.HELVETICA, 11, Font.NORMAL);

    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final ConsultationRepository consultationRepository;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

    public MedicalRecordService(MedicalRecordRepository medicalRecordRepository, PatientRepository patientRepository,
                                 DoctorRepository doctorRepository, ConsultationRepository consultationRepository,
                                 FileStorageService fileStorageService, ObjectMapper objectMapper) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.consultationRepository = consultationRepository;
        this.fileStorageService = fileStorageService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public MedicalRecordResponse createMedicalRecord(MedicalRecordCreateRequest request) {
        Patient patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient non trouvé"));
        Doctor doctor = doctorRepository.findById(request.doctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Docteur non trouvé"));
        Consultation consultation = consultationRepository.findById(request.consultationId())
                .orElseThrow(() -> new ResourceNotFoundException("Consultation non trouvée"));

        MedicalRecord record = new MedicalRecord(patient, doctor, consultation, doctor, request.recordType());
        record.setDiagnosis(request.diagnosis());
        record.setTreatment(request.treatment());
        record.setPrescription(request.prescription());
        record.setLabResults(toJson(fileStorageService.store(patient.getId(), request.labResults())));
        record.setAttachments(toJson(fileStorageService.store(patient.getId(), request.attachments())));
        if (request.status() != null) record.setStatus(request.status());
        record.setConfidential(request.isConfidential());

        record = medicalRecordRepository.save(record);
        return toResponse(record);
    }

    @Transactional(readOnly = true)
    public List<MedicalRecordResponse> getMedicalRecords() {
        return medicalRecordRepository.findAll().stream()
                .sorted(Comparator.comparing(MedicalRecord::getCreatedAt).reversed())
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MedicalRecordResponse updateMedicalRecord(Integer id, MedicalRecordUpdateRequest request) {
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found"));

        if (request.recordType() != null) record.setRecordType(request.recordType());
        if (request.diagnosis() != null) record.setDiagnosis(request.diagnosis());
        if (request.treatment() != null) record.setTreatment(request.treatment());
        if (request.prescription() != null) record.setPrescription(request.prescription());
        if (request.status() != null) record.setStatus(request.status());
        if (request.isConfidential() != null) record.setConfidential(request.isConfidential());
        if (request.doctorId() != null) {
            Doctor modifier = doctorRepository.findById(request.doctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Docteur non trouvé"));
            record.setLastModifiedBy(modifier);
        }

        if (request.labResults() != null && !request.labResults().isEmpty()) {
            fileStorageService.delete(fromJson(record.getLabResults()));
            record.setLabResults(toJson(fileStorageService.store(record.getPatient().getId(), request.labResults())));
        }
        if (request.attachments() != null && !request.attachments().isEmpty()) {
            fileStorageService.delete(fromJson(record.getAttachments()));
            record.setAttachments(toJson(fileStorageService.store(record.getPatient().getId(), request.attachments())));
        }

        return toResponse(record);
    }

    @Transactional
    public void deleteMedicalRecord(Integer id) {
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found"));

        fileStorageService.delete(fromJson(record.getLabResults()));
        fileStorageService.delete(fromJson(record.getAttachments()));
        medicalRecordRepository.delete(record);
    }

    @Transactional(readOnly = true)
    public byte[] generatePdf(Integer id) {
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dossier médical non trouvé"));
        return buildPdf(record);
    }

    @Transactional(readOnly = true)
    public byte[] generateCompleteZip(Integer id) {
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dossier médical non trouvé"));

        byte[] pdfBytes = buildPdf(record);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            zos.putNextEntry(new ZipEntry("dossier_medical.pdf"));
            zos.write(pdfBytes);
            zos.closeEntry();

            for (StoredFile file : fromJson(record.getLabResults())) {
                addFileToZip(zos, file, "lab_results/");
            }
            for (StoredFile file : fromJson(record.getAttachments())) {
                addFileToZip(zos, file, "attachments/");
            }
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la création du dossier complet", e);
        }

        return baos.toByteArray();
    }

    private void addFileToZip(ZipOutputStream zos, StoredFile file, String prefix) throws IOException {
        Path path = Path.of(file.path());
        if (!Files.exists(path)) {
            return;
        }
        zos.putNextEntry(new ZipEntry(prefix + file.name()));
        Files.copy(path, zos);
        zos.closeEntry();
    }

    private byte[] buildPdf(MedicalRecord record) {
        Patient patient = record.getPatient();
        Doctor doctor = record.getDoctor();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 50, 50, 50, 50);
        try {
            PdfWriter.getInstance(document, baos);
            document.open();

            document.add(new Paragraph("DOSSIER MEDICAL", TITLE_FONT));
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Informations patient", HEADER_FONT));
            document.add(new Paragraph("Nom: " + patient.getUser().getFirstName() + " " + patient.getUser().getLastName(), BODY_FONT));
            document.add(new Paragraph("Email: " + patient.getUser().getEmail(), BODY_FONT));
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Medecin traitant", HEADER_FONT));
            document.add(new Paragraph("Dr. " + doctor.getUser().getFirstName() + " " + doctor.getUser().getLastName(), BODY_FONT));
            document.add(new Paragraph(" "));

            if (record.getConsultation() != null) {
                Consultation consultation = record.getConsultation();
                document.add(new Paragraph("Consultation", HEADER_FONT));
                document.add(new Paragraph("Date: " + consultation.getDate(), BODY_FONT));
                document.add(new Paragraph("Heure: " + consultation.getTime(), BODY_FONT));
                document.add(new Paragraph("Type: " + consultation.getType(), BODY_FONT));
                document.add(new Paragraph(" "));
            }

            document.add(new Paragraph("Details du dossier", HEADER_FONT));
            document.add(new Paragraph("Type: " + record.getRecordType(), BODY_FONT));
            document.add(new Paragraph("Statut: " + record.getStatus(), BODY_FONT));
            document.add(new Paragraph("Cree le: " + record.getCreatedAt(), BODY_FONT));
            document.add(new Paragraph(" "));

            if (record.getDiagnosis() != null) {
                document.add(new Paragraph("Diagnostic", HEADER_FONT));
                document.add(new Paragraph(record.getDiagnosis(), BODY_FONT));
                document.add(new Paragraph(" "));
            }
            if (record.getTreatment() != null) {
                document.add(new Paragraph("Traitement", HEADER_FONT));
                document.add(new Paragraph(record.getTreatment(), BODY_FONT));
                document.add(new Paragraph(" "));
            }

            List<StoredFile> labResults = fromJson(record.getLabResults());
            if (!labResults.isEmpty()) {
                document.add(new Paragraph("Resultats de laboratoire", HEADER_FONT));
                for (StoredFile file : labResults) {
                    document.add(new Paragraph("- " + file.name(), BODY_FONT));
                }
                document.add(new Paragraph(" "));
            }

            List<StoredFile> attachments = fromJson(record.getAttachments());
            if (!attachments.isEmpty()) {
                document.add(new Paragraph("Pieces jointes", HEADER_FONT));
                for (StoredFile file : attachments) {
                    document.add(new Paragraph("- " + file.name(), BODY_FONT));
                }
            }

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Erreur lors de la génération du PDF", e);
        }

        return baos.toByteArray();
    }

    private String toJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize value to JSON", e);
        }
    }

    private List<StoredFile> fromJson(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<StoredFile>>() {
            });
        } catch (Exception e) {
            return List.of();
        }
    }

    private Object prescriptionFromJson(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (Exception e) {
            return json;
        }
    }

    private MedicalRecordResponse toResponse(MedicalRecord record) {
        Consultation consultation = record.getConsultation();
        var consultationSummary = consultation != null
                ? new MedicalRecordResponse.ConsultationSummary(consultation.getDate(), consultation.getTime(), consultation.getType().name())
                : null;

        return new MedicalRecordResponse(
                record.getId(),
                record.getRecordType(),
                record.getDiagnosis(),
                record.getTreatment(),
                prescriptionFromJson(record.getPrescription()),
                fromJson(record.getLabResults()),
                fromJson(record.getAttachments()),
                record.getStatus(),
                record.isConfidential(),
                record.getCreatedAt(),
                record.getUpdatedAt(),
                doctorResponseOf(record.getDoctor()),
                patientResponseOf(record.getPatient()),
                doctorResponseOf(record.getLastModifiedBy()),
                consultationSummary
        );
    }

    private DoctorResponse doctorResponseOf(Doctor doctor) {
        User user = doctor.getUser();
        var userSummary = new DoctorResponse.UserSummary(user.getFirstName(), user.getLastName(), user.getEmail());
        return new DoctorResponse(doctor.getId(), user.getId(), doctor.getSpecialization(), doctor.getLicenseNumber(),
                doctor.getPhone(), doctor.getEmail(), userSummary);
    }

    private PatientResponse patientResponseOf(Patient patient) {
        User user = patient.getUser();
        var userSummary = new PatientResponse.UserSummary(user.getFirstName(), user.getLastName(), user.getEmail());
        return new PatientResponse(patient.getId(), user.getId(), patient.getDateOfBirth(), patient.getChronicDiseases(),
                patient.getCurrentTreatments(), patient.getAllergies(), patient.getPhone(), patient.getEmail(),
                patient.getAddress(), patient.getAge(), patient.isActive(), patient.getDeletedAt(), userSummary);
    }
}
