package com.medixoffice.backend.service;

import com.medixoffice.backend.dto.patient.CompleteProfileRequest;
import com.medixoffice.backend.dto.patient.CreatePatientResponse;
import com.medixoffice.backend.dto.patient.PatientCreateRequest;
import com.medixoffice.backend.dto.patient.PatientResponse;
import com.medixoffice.backend.dto.patient.PatientUpdateRequest;
import com.medixoffice.backend.entity.Patient;
import com.medixoffice.backend.entity.Role;
import com.medixoffice.backend.entity.User;
import com.medixoffice.backend.exception.ResourceNotFoundException;
import com.medixoffice.backend.repository.PatientRepository;
import com.medixoffice.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PatientService {

    private static final Logger log = LoggerFactory.getLogger(PatientService.class);

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public PatientService(PatientRepository patientRepository, UserRepository userRepository,
                           PasswordEncoder passwordEncoder, EmailService emailService) {
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Transactional
    public CreatePatientResponse createPatient(PatientCreateRequest request) {
        String temporaryPassword = generateTemporaryPassword();

        User user = new User(request.firstName(), request.lastName(), request.email(),
                passwordEncoder.encode(temporaryPassword), Role.patient);
        user = userRepository.save(user);

        Patient patient = new Patient(user, request.phone(), request.email(), request.address());
        patient.setDateOfBirth(request.dateOfBirth());
        patient.setCurrentTreatments(request.currentTreatments());
        patient.setChronicDiseases(request.chronicDiseases());
        patient.setAllergies(request.allergies());
        patient = patientRepository.save(patient);

        try {
            emailService.sendWelcomeEmail(request.email(), temporaryPassword, user.getId());
        } catch (Exception e) {
            log.warn("Failed to send welcome email to {}", request.email(), e);
        }

        return new CreatePatientResponse("Patient créé avec succès", toResponse(patient), temporaryPassword);
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> getPatients() {
        return patientRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public long getPatientCount() {
        return patientRepository.count();
    }

    @Transactional(readOnly = true)
    public PatientResponse getPatient(Integer id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        return toResponse(patient);
    }

    @Transactional(readOnly = true)
    public PatientResponse getPatientByUserId(Integer userId) {
        Patient patient = patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient non trouvé pour cet utilisateur"));
        return toResponse(patient);
    }

    @Transactional
    public PatientResponse updatePatient(Integer id, PatientUpdateRequest request) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        if (request.dateOfBirth() != null) patient.setDateOfBirth(request.dateOfBirth());
        if (request.chronicDiseases() != null) patient.setChronicDiseases(request.chronicDiseases());
        if (request.currentTreatments() != null) patient.setCurrentTreatments(request.currentTreatments());
        if (request.allergies() != null) patient.setAllergies(request.allergies());
        if (request.phone() != null) patient.setPhone(request.phone());
        if (request.email() != null) patient.setEmail(request.email());
        if (request.address() != null) patient.setAddress(request.address());

        User user = patient.getUser();
        if (request.firstName() != null) user.setFirstName(request.firstName());
        if (request.lastName() != null) user.setLastName(request.lastName());

        return toResponse(patient);
    }

    @Transactional
    public PatientResponse completeProfile(CompleteProfileRequest request) {
        Patient patient = patientRepository.findByUserId(request.userId()).orElse(null);

        if (patient != null) {
            if (request.dateOfBirth() != null) patient.setDateOfBirth(request.dateOfBirth());
            if (request.currentTreatments() != null) patient.setCurrentTreatments(request.currentTreatments());
            if (request.chronicDiseases() != null) patient.setChronicDiseases(request.chronicDiseases());
            if (request.allergies() != null) patient.setAllergies(request.allergies());
            if (request.phone() != null) patient.setPhone(request.phone());
            if (request.email() != null) patient.setEmail(request.email());
            if (request.address() != null) patient.setAddress(request.address());
            return toResponse(patient);
        }

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Patient newPatient = new Patient(user, request.phone(), request.email(), request.address());
        newPatient.setDateOfBirth(request.dateOfBirth());
        newPatient.setCurrentTreatments(request.currentTreatments());
        newPatient.setChronicDiseases(request.chronicDiseases());
        newPatient.setAllergies(request.allergies());
        newPatient = patientRepository.save(newPatient);

        return toResponse(newPatient);
    }

    /** Soft delete: marks the patient and its linked user inactive instead of removing rows, so existing appointments/invoices/consultations keep working. */
    @Transactional
    public void deletePatient(Integer id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        patient.softDelete();
        patient.getUser().softDelete();
    }

    private String generateTemporaryPassword() {
        int randomNumber = (int) (1000 + Math.random() * 10_000_000);
        return "Patient" + randomNumber;
    }

    private PatientResponse toResponse(Patient patient) {
        User user = patient.getUser();
        var userSummary = new PatientResponse.UserSummary(user.getFirstName(), user.getLastName(), user.getEmail());

        return new PatientResponse(
                patient.getId(),
                user.getId(),
                patient.getDateOfBirth(),
                patient.getChronicDiseases(),
                patient.getCurrentTreatments(),
                patient.getAllergies(),
                patient.getPhone(),
                patient.getEmail(),
                patient.getAddress(),
                patient.getAge(),
                patient.isActive(),
                patient.getDeletedAt(),
                userSummary
        );
    }
}
