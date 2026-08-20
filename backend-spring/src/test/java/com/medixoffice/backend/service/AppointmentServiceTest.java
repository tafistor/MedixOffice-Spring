package com.medixoffice.backend.service;

import com.medixoffice.backend.dto.appointment.AppointmentCreateRequest;
import com.medixoffice.backend.entity.Doctor;
import com.medixoffice.backend.entity.Patient;
import com.medixoffice.backend.entity.Role;
import com.medixoffice.backend.entity.User;
import com.medixoffice.backend.exception.SlotUnavailableException;
import com.medixoffice.backend.repository.AppointmentRepository;
import com.medixoffice.backend.repository.DoctorRepository;
import com.medixoffice.backend.repository.NotificationRepository;
import com.medixoffice.backend.repository.PatientRepository;
import com.medixoffice.backend.repository.SecretarySpecialtyRepository;
import com.medixoffice.backend.repository.UserRepository;
import com.medixoffice.backend.repository.WorkScheduleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private DoctorRepository doctorRepository;
    @Mock
    private PatientRepository patientRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private WorkScheduleRepository workScheduleRepository;
    @Mock
    private SecretarySpecialtyRepository secretarySpecialtyRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private EmailService emailService;

    @InjectMocks
    private AppointmentService appointmentService;

    private User requestingUser;
    private Doctor doctor;
    private Patient patient;
    private final LocalDate date = LocalDate.of(2026, 8, 26); // a Wednesday

    @BeforeEach
    void setUp() {
        requestingUser = new User("Jean", "Dupont", "jean@example.com", "hashed", Role.patient);
        User doctorUser = new User("Marc", "Cardio", "doctor@example.com", "hashed", Role.doctor);
        doctor = new Doctor(doctorUser, "Cardiology", "DOC-001", "+32470000001", doctorUser.getEmail());
        User patientUser = new User("Jean", "Dupont", "jean@example.com", "hashed", Role.patient);
        patient = new Patient(patientUser, "+32470000011", patientUser.getEmail(), "1 rue de la Paix");

        when(userRepository.findById(1)).thenReturn(Optional.of(requestingUser));
        when(doctorRepository.findById(6)).thenReturn(Optional.of(doctor));
        when(patientRepository.findById(9)).thenReturn(Optional.of(patient));
    }

    @Test
    void createAppointment_malformedTimeString_throwsSlotUnavailable() {
        var request = new AppointmentCreateRequest(6, 9, date, "not-a-time", "Checkup", BigDecimal.TEN, null);

        assertThatThrownBy(() -> appointmentService.createAppointment(request, 1))
                .isInstanceOf(SlotUnavailableException.class)
                .hasMessageContaining("invalide");
    }

    @Test
    void createAppointment_noMatchingWorkSchedule_throwsSlotUnavailable() {
        when(workScheduleRepository.hasAvailableSlot(eq(6), any(), eq(LocalTime.of(9, 0)))).thenReturn(false);

        var request = new AppointmentCreateRequest(6, 9, date, "09:00 to 09:30", "Checkup", BigDecimal.TEN, null);

        assertThatThrownBy(() -> appointmentService.createAppointment(request, 1))
                .isInstanceOf(SlotUnavailableException.class)
                .hasMessageContaining("disponible");
    }

    @Test
    void createAppointment_slotAlreadyBooked_throwsSlotUnavailable() {
        when(workScheduleRepository.hasAvailableSlot(eq(6), any(), eq(LocalTime.of(9, 0)))).thenReturn(true);
        when(appointmentRepository.existsByDoctorIdAndDateAndTimeAndStatusNot(eq(6), eq(date), eq("09:00 to 09:30"), any()))
                .thenReturn(true);

        var request = new AppointmentCreateRequest(6, 9, date, "09:00 to 09:30", "Checkup", BigDecimal.TEN, null);

        assertThatThrownBy(() -> appointmentService.createAppointment(request, 1))
                .isInstanceOf(SlotUnavailableException.class)
                .hasMessageContaining("réservé");
    }
}
