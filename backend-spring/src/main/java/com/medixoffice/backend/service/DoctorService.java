package com.medixoffice.backend.service;

import com.medixoffice.backend.dto.doctor.CreateDoctorResponse;
import com.medixoffice.backend.dto.doctor.DoctorCompleteProfileRequest;
import com.medixoffice.backend.dto.doctor.DoctorCreateRequest;
import com.medixoffice.backend.dto.doctor.DoctorResponse;
import com.medixoffice.backend.dto.doctor.DoctorUpdateRequest;
import com.medixoffice.backend.entity.Doctor;
import com.medixoffice.backend.entity.Role;
import com.medixoffice.backend.entity.User;
import com.medixoffice.backend.exception.ResourceNotFoundException;
import com.medixoffice.backend.repository.DoctorRepository;
import com.medixoffice.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class DoctorService {

    private static final Logger log = LoggerFactory.getLogger(DoctorService.class);

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public DoctorService(DoctorRepository doctorRepository, UserRepository userRepository,
                          PasswordEncoder passwordEncoder, EmailService emailService) {
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Transactional
    public CreateDoctorResponse createDoctor(DoctorCreateRequest request) {
        String temporaryPassword = generateTemporaryPassword();

        User user = new User(request.firstName(), request.lastName(), request.email(),
                passwordEncoder.encode(temporaryPassword), Role.doctor);
        user = userRepository.save(user);

        Doctor doctor = new Doctor(user, request.specialization(), request.licenseNumber(), request.phone(), request.email());
        doctor = doctorRepository.save(doctor);

        try {
            emailService.sendWelcomeEmail(request.email(), temporaryPassword, user.getId());
        } catch (Exception e) {
            log.warn("Failed to send welcome email to {}", request.email(), e);
        }

        return new CreateDoctorResponse("Doctor créé avec succès", toResponse(doctor), temporaryPassword);
    }

    @Transactional(readOnly = true)
    public List<DoctorResponse> getDoctors(String specialtiesParam) {
        List<Doctor> doctors;

        if (specialtiesParam != null && !specialtiesParam.isBlank()) {
            Set<Doctor> matched = new LinkedHashSet<>();
            for (String specialty : specialtiesParam.split(",")) {
                matched.addAll(doctorRepository.findBySpecializationContainingIgnoreCase(specialty.trim()));
            }
            doctors = new ArrayList<>(matched);
        } else {
            doctors = doctorRepository.findAll();
        }

        return doctors.stream().map(this::toResponse).toList();
    }

    public long getDoctorCount() {
        return doctorRepository.count();
    }

    @Transactional(readOnly = true)
    public DoctorResponse getDoctorByUserId(Integer userId) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Docteur non trouvé pour cet utilisateur"));
        return toResponse(doctor);
    }

    @Transactional
    public DoctorResponse updateDoctor(Integer id, DoctorUpdateRequest request) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Médecin non trouvé"));

        if (request.specialization() != null) doctor.setSpecialization(request.specialization());
        if (request.licenseNumber() != null) doctor.setLicenseNumber(request.licenseNumber());
        if (request.phone() != null) doctor.setPhone(request.phone());
        if (request.email() != null) doctor.setEmail(request.email());

        User user = doctor.getUser();
        if (request.firstName() != null) user.setFirstName(request.firstName());
        if (request.lastName() != null) user.setLastName(request.lastName());

        return toResponse(doctor);
    }

    @Transactional
    public DoctorResponse completeProfile(DoctorCompleteProfileRequest request) {
        Doctor doctor = doctorRepository.findByUserId(request.userId()).orElse(null);

        if (doctor != null) {
            if (request.specialization() != null) doctor.setSpecialization(request.specialization());
            if (request.licenseNumber() != null) doctor.setLicenseNumber(request.licenseNumber());
            if (request.phone() != null) doctor.setPhone(request.phone());
            if (request.email() != null) doctor.setEmail(request.email());
            return toResponse(doctor);
        }

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Doctor newDoctor = new Doctor(user, request.specialization(), request.licenseNumber(), request.phone(), request.email());
        newDoctor = doctorRepository.save(newDoctor);

        return toResponse(newDoctor);
    }

    @Transactional
    public void deleteDoctor(Integer id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("doctor not found"));

        Integer userId = doctor.getUser().getId();
        doctorRepository.delete(doctor);
        userRepository.deleteById(userId);
    }

    private String generateTemporaryPassword() {
        int randomNumber = (int) (1000 + Math.random() * 10_000_000);
        return "Doctor" + randomNumber;
    }

    private DoctorResponse toResponse(Doctor doctor) {
        User user = doctor.getUser();
        var userSummary = new DoctorResponse.UserSummary(user.getFirstName(), user.getLastName(), user.getEmail());

        return new DoctorResponse(
                doctor.getId(),
                user.getId(),
                doctor.getSpecialization(),
                doctor.getLicenseNumber(),
                doctor.getPhone(),
                doctor.getEmail(),
                userSummary
        );
    }
}
