package com.medixoffice.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.medixoffice.backend.dto.consultation.ConsultationCreateRequest;
import com.medixoffice.backend.dto.consultation.ConsultationResponse;
import com.medixoffice.backend.dto.consultation.ConsultationUpdateRequest;
import com.medixoffice.backend.dto.doctor.DoctorResponse;
import com.medixoffice.backend.dto.patient.PatientResponse;
import com.medixoffice.backend.entity.Appointment;
import com.medixoffice.backend.entity.Consultation;
import com.medixoffice.backend.entity.Doctor;
import com.medixoffice.backend.entity.Invoice;
import com.medixoffice.backend.entity.Patient;
import com.medixoffice.backend.entity.User;
import com.medixoffice.backend.exception.ResourceNotFoundException;
import com.medixoffice.backend.repository.AppointmentRepository;
import com.medixoffice.backend.repository.ConsultationRepository;
import com.medixoffice.backend.repository.DoctorRepository;
import com.medixoffice.backend.repository.InvoiceRepository;
import com.medixoffice.backend.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final InvoiceRepository invoiceRepository;

    public ConsultationService(ConsultationRepository consultationRepository, PatientRepository patientRepository,
                                DoctorRepository doctorRepository, AppointmentRepository appointmentRepository,
                                InvoiceRepository invoiceRepository) {
        this.consultationRepository = consultationRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.invoiceRepository = invoiceRepository;
    }

    /** Auto-creates a Pending invoice if there's a matching same-day appointment - mirrors Node's behavior exactly, including not checking that appointment's status. */
    @Transactional
    public ConsultationResponse createConsultation(ConsultationCreateRequest request) {
        Patient patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient non trouvé"));
        Doctor doctor = doctorRepository.findById(request.doctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Docteur non trouvé"));

        Consultation consultation = new Consultation(patient, doctor, request.date(), request.time(), request.type());
        consultation.setNotes(request.notes());
        consultation.setVitals(vitalsToJson(request.vitals()));
        consultation = consultationRepository.save(consultation);

        LocalDate today = LocalDate.now();
        appointmentRepository.findByPatientId(request.patientId()).stream()
                .filter(a -> a.getDoctor().getId().equals(request.doctorId()) && a.getDate().equals(today))
                .findFirst()
                .ifPresent(appointment -> createInvoiceForAppointment(patient, appointment));

        return toResponse(consultation);
    }

    @Transactional(readOnly = true)
    public List<ConsultationResponse> getConsultations() {
        return consultationRepository.findAll().stream()
                .sorted(Comparator.comparing(Consultation::getDate).reversed()
                        .thenComparing(Comparator.comparing(Consultation::getTime).reversed()))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ConsultationResponse> getPatientConsultations(Integer patientId) {
        return consultationRepository.findByPatientId(patientId).stream()
                .sorted(Comparator.comparing(Consultation::getDate).reversed()
                        .thenComparing(Comparator.comparing(Consultation::getTime).reversed()))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ConsultationResponse getConsultationById(Integer id) {
        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found"));
        return toResponse(consultation);
    }

    public long getConsultationCountByDate(LocalDate date) {
        return consultationRepository.countByDate(date);
    }

    @Transactional
    public ConsultationResponse updateConsultation(Integer id, ConsultationUpdateRequest request) {
        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found"));

        if (request.date() != null) consultation.setDate(request.date());
        if (request.time() != null) consultation.setTime(request.time());
        if (request.type() != null) consultation.setType(request.type());
        if (request.status() != null) consultation.setStatus(request.status());
        if (request.notes() != null) consultation.setNotes(request.notes());
        if (request.vitals() != null) consultation.setVitals(vitalsToJson(request.vitals()));

        return toResponse(consultation);
    }

    @Transactional
    public void deleteConsultation(Integer id) {
        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found"));
        consultationRepository.delete(consultation);
    }

    private String vitalsToJson(JsonNode vitals) {
        if (vitals == null || vitals.isNull()) {
            return null;
        }
        return vitals.toString();
    }

    private void createInvoiceForAppointment(Patient patient, Appointment appointment) {
        Invoice invoice = new Invoice(patient, LocalDate.now(), appointment.getAmount(), appointment.getVisitDescription(),
                "INV-" + System.currentTimeMillis());
        invoiceRepository.save(invoice);
    }

    private ConsultationResponse toResponse(Consultation consultation) {
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
