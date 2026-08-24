package com.medixoffice.backend.service;

import com.medixoffice.backend.dto.appointment.AppointmentCreateRequest;
import com.medixoffice.backend.dto.appointment.AppointmentResponse;
import com.medixoffice.backend.dto.appointment.AppointmentUpdateRequest;
import com.medixoffice.backend.dto.doctor.DoctorResponse;
import com.medixoffice.backend.dto.patient.PatientResponse;
import com.medixoffice.backend.entity.Appointment;
import com.medixoffice.backend.entity.AppointmentStatus;
import com.medixoffice.backend.entity.Doctor;
import com.medixoffice.backend.entity.Notification;
import com.medixoffice.backend.entity.NotificationType;
import com.medixoffice.backend.entity.Patient;
import com.medixoffice.backend.entity.Role;
import com.medixoffice.backend.entity.User;
import com.medixoffice.backend.entity.WorkDay;
import com.medixoffice.backend.exception.ResourceNotFoundException;
import com.medixoffice.backend.exception.SlotUnavailableException;
import com.medixoffice.backend.repository.AppointmentRepository;
import com.medixoffice.backend.repository.DoctorRepository;
import com.medixoffice.backend.repository.NotificationRepository;
import com.medixoffice.backend.repository.PatientRepository;
import com.medixoffice.backend.repository.SecretarySpecialtyRepository;
import com.medixoffice.backend.repository.UserRepository;
import com.medixoffice.backend.repository.WorkScheduleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;


@Service
public class AppointmentService {

    private static final Logger log = LoggerFactory.getLogger(AppointmentService.class);

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final WorkScheduleRepository workScheduleRepository;
    private final SecretarySpecialtyRepository secretarySpecialtyRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    public AppointmentService(AppointmentRepository appointmentRepository, DoctorRepository doctorRepository,
                               PatientRepository patientRepository, UserRepository userRepository,
                               WorkScheduleRepository workScheduleRepository,
                               SecretarySpecialtyRepository secretarySpecialtyRepository,
                               NotificationRepository notificationRepository, EmailService emailService) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.workScheduleRepository = workScheduleRepository;
        this.secretarySpecialtyRepository = secretarySpecialtyRepository;
        this.notificationRepository = notificationRepository;
        this.emailService = emailService;
    }

    @Transactional
    public AppointmentResponse createAppointment(AppointmentCreateRequest request, Integer requestingUserId) {
        User requestingUser = userRepository.findById(requestingUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Doctor doctor = doctorRepository.findById(request.doctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Docteur non trouvé"));
        Patient patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient non trouvé"));

        checkScheduleAvailability(request.doctorId(), request.date(), request.time());
        checkNoConflict(request.doctorId(), request.date(), request.time());

        AppointmentStatus status = AppointmentStatus.pending;
        if (requestingUser.getRole() == Role.secretary && request.status() != null) {
            status = request.status();
        }

        Appointment appointment = new Appointment(patient, doctor, request.date(), request.time(), request.visitDescription(),
                request.amount() != null ? request.amount() : BigDecimal.ZERO);
        appointment.setStatus(status);
        appointment = appointmentRepository.save(appointment);

        if (requestingUser.getRole() == Role.patient) {
            notifySecretaries(appointment, doctor, patient);
        }

        if (status == AppointmentStatus.confirmed) {
            sendConfirmation(patient, appointment);
        }

        return toResponse(appointment);
    }

    public long getAppointmentCountByDate(LocalDate date) {
        return appointmentRepository.countByDateAndStatusNot(date, AppointmentStatus.cancelled);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointments() {
        return appointmentRepository.findAll().stream()
                .sorted(Comparator.comparing(Appointment::getDate).thenComparing(Appointment::getTime))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AppointmentResponse updateAppointment(Integer id, AppointmentUpdateRequest request) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rendez-vous non trouvé"));

        LocalDate newDate = request.date() != null ? request.date() : appointment.getDate();
        String newTime = request.time() != null ? request.time() : appointment.getTime();
        Integer newDoctorId = request.doctorId() != null ? request.doctorId() : appointment.getDoctor().getId();

        boolean dateOrTimeChanged = !newDate.equals(appointment.getDate()) || !newTime.equals(appointment.getTime());
        if (dateOrTimeChanged) {
           
            checkScheduleAvailability(newDoctorId, newDate, newTime);
            checkNoConflict(newDoctorId, newDate, newTime);
        }

        AppointmentStatus oldStatus = appointment.getStatus();

        if (request.doctorId() != null) {
            Doctor doctor = doctorRepository.findById(request.doctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Docteur non trouvé"));
            appointment.setDoctor(doctor);
        }
        if (request.patientId() != null) {
            Patient patient = patientRepository.findById(request.patientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Patient non trouvé"));
            appointment.setPatient(patient);
        }
        if (request.date() != null) appointment.setDate(request.date());
        if (request.time() != null) appointment.setTime(request.time());
        if (request.visitDescription() != null) appointment.setVisitDescription(request.visitDescription());
        if (request.amount() != null) appointment.setAmount(request.amount());
        if (request.status() != null) appointment.setStatus(request.status());

        if (appointment.getStatus() == AppointmentStatus.confirmed && oldStatus != AppointmentStatus.confirmed) {
            sendConfirmation(appointment.getPatient(), appointment);
        }

        return toResponse(appointment);
    }

    @Transactional
    public void cancelAppointment(Integer id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rendez-vous non trouvé"));
        appointmentRepository.delete(appointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getDoctorAppointments(Integer doctorId, LocalDate startDate, LocalDate endDate) {
        return appointmentRepository.findByDoctorIdAndDateBetween(doctorId, startDate, endDate).stream()
                .sorted(Comparator.comparing(Appointment::getDate).thenComparing(Appointment::getTime))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getPatientAppointmentsToday(Integer patientId) {
        LocalDate today = LocalDate.now();
        return appointmentRepository.findByPatientId(patientId).stream()
                .filter(a -> a.getDate().equals(today) && a.getStatus() != AppointmentStatus.cancelled)
                .sorted(Comparator.comparing(Appointment::getTime))
                .map(this::toResponse)
                .toList();
    }

    private void checkScheduleAvailability(Integer doctorId, LocalDate date, String time) {
        WorkDay dayOfWeek = toWorkDay(date);
        
        String startTime = time.split(" to ")[0];
        LocalTime parsedTime;
        try {
            parsedTime = LocalTime.parse(startTime);
        } catch (Exception e) {
            throw new SlotUnavailableException("Heure de rendez-vous invalide");
        }

        LocalDate today = LocalDate.now();
        if (date.isBefore(today) || (date.isEqual(today) && parsedTime.isBefore(LocalTime.now()))) {
            throw new SlotUnavailableException("Impossible de réserver un rendez-vous à une date ou une heure déjà passée");
        }

        if (!workScheduleRepository.hasAvailableSlot(doctorId, dayOfWeek, parsedTime)) {
            throw new SlotUnavailableException("Le médecin n'est pas disponible à ce créneau horaire");
        }
    }

    private void checkNoConflict(Integer doctorId, LocalDate date, String time) {
        boolean conflict = appointmentRepository.existsByDoctorIdAndDateAndTimeAndStatusNot(doctorId, date, time, AppointmentStatus.cancelled);
        if (conflict) {
            throw new SlotUnavailableException("Ce créneau horaire est déjà réservé");
        }
    }

    private WorkDay toWorkDay(LocalDate date) {
        return switch (date.getDayOfWeek()) {
            case MONDAY -> WorkDay.Lundi;
            case TUESDAY -> WorkDay.Mardi;
            case WEDNESDAY -> WorkDay.Mercredi;
            case THURSDAY -> WorkDay.Jeudi;
            case FRIDAY -> WorkDay.Vendredi;
            default -> throw new SlotUnavailableException("Le médecin n'est pas disponible à ce créneau horaire");
        };
    }

    private void notifySecretaries(Appointment appointment, Doctor doctor, Patient patient) {
        Set<Integer> secretaryUserIds = new LinkedHashSet<>();
        for (String specialty : doctor.getSpecialization().split(",")) {
            secretarySpecialtyRepository.findBySpecialty(specialty.trim())
                    .forEach(ss -> secretaryUserIds.add(ss.getUser().getId()));
        }

        String message = "Nouveau rendez-vous en attente: " + patient.getUser().getFirstName() + " "
                + patient.getUser().getLastName() + " avec Dr. " + doctor.getUser().getFirstName() + " "
                + doctor.getUser().getLastName() + " le " + appointment.getDate() + " à " + appointment.getTime();

        for (Integer secretaryUserId : secretaryUserIds) {
            userRepository.findById(secretaryUserId)
                    .ifPresent(secretaryUser -> notificationRepository.save(
                            new Notification(secretaryUser, message, NotificationType.appointment)));
        }
    }

    private void sendConfirmation(Patient patient, Appointment appointment) {
        try {
            emailService.sendAppointmentConfirmation(patient.getUser().getEmail(), patient.getUser().getId(),
                    appointment.getDate(), appointment.getTime());
        } catch (Exception e) {
            log.warn("Failed to send appointment confirmation email", e);
        }
    }

    private AppointmentResponse toResponse(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getPatient().getId(),
                appointment.getDoctor().getId(),
                appointment.getDate(),
                appointment.getTime(),
                appointment.getVisitDescription(),
                appointment.getAmount(),
                appointment.getStatus(),
                appointment.getCreatedAt(),
                appointment.getUpdatedAt(),
                doctorResponseOf(appointment.getDoctor()),
                patientResponseOf(appointment.getPatient())
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
