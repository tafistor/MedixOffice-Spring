package com.medixoffice.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * prescription/labResults/attachments are stored as raw JSON text (LONGTEXT
 * columns) - structured access happens at the DTO/service layer. doctor is
 * the treating physician; lastModifiedBy is a second, independent FK to
 * doctors (Sequelize's aliased "modifier" association).
 */
@Entity
@Table(name = "medicalrecords")
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patientId", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctorId", nullable = false)
    private Doctor doctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultationId", nullable = false)
    private Consultation consultation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lastModifiedBy", nullable = false)
    private Doctor lastModifiedBy;

    @Convert(converter = RecordTypeConverter.class)
    @Column(nullable = false)
    private RecordType recordType;

    @Column(columnDefinition = "TEXT")
    private String diagnosis;

    @Column(columnDefinition = "TEXT")
    private String treatment;

    @Column(columnDefinition = "LONGTEXT")
    private String prescription;

    @Column(columnDefinition = "LONGTEXT")
    private String labResults;

    @Column(columnDefinition = "LONGTEXT")
    private String attachments;

    @Enumerated(EnumType.STRING)
    private MedicalRecordStatus status = MedicalRecordStatus.Draft;

    @Column(nullable = false)
    private boolean isConfidential = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected MedicalRecord() {
    }

    public MedicalRecord(Patient patient, Doctor doctor, Consultation consultation, Doctor lastModifiedBy, RecordType recordType) {
        this.patient = patient;
        this.doctor = doctor;
        this.consultation = consultation;
        this.lastModifiedBy = lastModifiedBy;
        this.recordType = recordType;
    }

    public Integer getId() {
        return id;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }

    public Doctor getDoctor() {
        return doctor;
    }

    public void setDoctor(Doctor doctor) {
        this.doctor = doctor;
    }

    public Consultation getConsultation() {
        return consultation;
    }

    public void setConsultation(Consultation consultation) {
        this.consultation = consultation;
    }

    public Doctor getLastModifiedBy() {
        return lastModifiedBy;
    }

    public void setLastModifiedBy(Doctor lastModifiedBy) {
        this.lastModifiedBy = lastModifiedBy;
    }

    public RecordType getRecordType() {
        return recordType;
    }

    public void setRecordType(RecordType recordType) {
        this.recordType = recordType;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getTreatment() {
        return treatment;
    }

    public void setTreatment(String treatment) {
        this.treatment = treatment;
    }

    public String getPrescription() {
        return prescription;
    }

    public void setPrescription(String prescription) {
        this.prescription = prescription;
    }

    public String getLabResults() {
        return labResults;
    }

    public void setLabResults(String labResults) {
        this.labResults = labResults;
    }

    public String getAttachments() {
        return attachments;
    }

    public void setAttachments(String attachments) {
        this.attachments = attachments;
    }

    public MedicalRecordStatus getStatus() {
        return status;
    }

    public void setStatus(MedicalRecordStatus status) {
        this.status = status;
    }

    public boolean isConfidential() {
        return isConfidential;
    }

    public void setConfidential(boolean confidential) {
        isConfidential = confidential;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
