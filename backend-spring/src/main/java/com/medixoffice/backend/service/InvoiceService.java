package com.medixoffice.backend.service;

import com.medixoffice.backend.dto.consultation.ConsultationResponse;
import com.medixoffice.backend.dto.doctor.DoctorResponse;
import com.medixoffice.backend.dto.invoice.InvoiceCreateRequest;
import com.medixoffice.backend.dto.invoice.InvoiceResponse;
import com.medixoffice.backend.dto.invoice.InvoiceUpdateRequest;
import com.medixoffice.backend.dto.patient.PatientResponse;
import com.medixoffice.backend.entity.Consultation;
import com.medixoffice.backend.entity.Doctor;
import com.medixoffice.backend.entity.Invoice;
import com.medixoffice.backend.entity.Patient;
import com.medixoffice.backend.entity.User;
import com.medixoffice.backend.exception.ResourceNotFoundException;
import com.medixoffice.backend.repository.ConsultationRepository;
import com.medixoffice.backend.repository.InvoiceRepository;
import com.medixoffice.backend.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final PatientRepository patientRepository;
    private final ConsultationRepository consultationRepository;

    public InvoiceService(InvoiceRepository invoiceRepository, PatientRepository patientRepository,
                           ConsultationRepository consultationRepository) {
        this.invoiceRepository = invoiceRepository;
        this.patientRepository = patientRepository;
        this.consultationRepository = consultationRepository;
    }

    @Transactional
    public InvoiceResponse createInvoice(InvoiceCreateRequest request) {
        Patient patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient non trouvé"));

        Invoice invoice = new Invoice(patient, request.date(), request.amount(), request.service(),
                "INV-" + System.currentTimeMillis());
        if (request.consultationId() != null) {
            invoice.setConsultation(consultationRepository.findById(request.consultationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Consultation non trouvée")));
        }
        if (request.status() != null) invoice.setStatus(request.status());

        invoice = invoiceRepository.save(invoice);
        return toResponse(invoice);
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoices() {
        return invoiceRepository.findAll().stream()
                .sorted(Comparator.comparing(Invoice::getDate).reversed())
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Integer id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
        return toResponse(invoice);
    }

    @Transactional
    public InvoiceResponse updateInvoice(Integer id, InvoiceUpdateRequest request) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));

        if (request.patientId() != null) {
            invoice.setPatient(patientRepository.findById(request.patientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Patient non trouvé")));
        }
        if (request.consultationId() != null) {
            invoice.setConsultation(consultationRepository.findById(request.consultationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Consultation non trouvée")));
        }
        if (request.date() != null) invoice.setDate(request.date());
        if (request.amount() != null) invoice.setAmount(request.amount());
        if (request.service() != null) invoice.setService(request.service());
        if (request.status() != null) invoice.setStatus(request.status());

        return toResponse(invoice);
    }

    @Transactional
    public void deleteInvoice(Integer id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
        invoiceRepository.delete(invoice);
    }

    private InvoiceResponse toResponse(Invoice invoice) {
        ConsultationResponse consultationResponse = invoice.getConsultation() != null
                ? consultationResponseOf(invoice.getConsultation())
                : null;

        return new InvoiceResponse(
                invoice.getId(),
                invoice.getPatient().getId(),
                invoice.getConsultation() != null ? invoice.getConsultation().getId() : null,
                invoice.getDate(),
                invoice.getAmount(),
                invoice.getService(),
                invoice.getStatus(),
                invoice.getInvoiceNumber(),
                patientResponseOf(invoice.getPatient()),
                consultationResponse
        );
    }

    private ConsultationResponse consultationResponseOf(Consultation consultation) {
        return new ConsultationResponse(
                consultation.getId(),
                consultation.getPatient().getId(),
                consultation.getDoctor().getId(),
                consultation.getDate(),
                consultation.getTime(),
                consultation.getType(),
                consultation.getStatus(),
                consultation.getNotes(),
                consultation.getVitals(),
                consultation.getCreatedAt(),
                consultation.getUpdatedAt(),
                doctorResponseOf(consultation.getDoctor()),
                patientResponseOf(consultation.getPatient())
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
