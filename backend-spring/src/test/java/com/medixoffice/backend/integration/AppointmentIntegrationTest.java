package com.medixoffice.backend.integration;

import com.medixoffice.backend.entity.Doctor;
import com.medixoffice.backend.entity.WorkDay;
import com.medixoffice.backend.entity.WorkSchedule;
import com.medixoffice.backend.repository.DoctorRepository;
import com.medixoffice.backend.repository.WorkScheduleRepository;
import com.medixoffice.backend.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Creates its own WorkSchedule fixture for a computed future date rather than
 * depending on a fixed seeded date - a hardcoded "future" date silently starts
 * failing once real time catches up to it (this happened: 2026-08-27 was fine
 * in August, and by November was in the past, tripping the service's own
 * no-booking-in-the-past check instead of exercising creation at all).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AppointmentIntegrationTest {

    private static final Integer PATIENT_USER_ID = 38; // patient1@medixoffice.demo
    private static final Integer PATIENT_ID = 9;
    private static final Integer CARDIOLOGY_DOCTOR_ID = 6;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private WorkScheduleRepository workScheduleRepository;

    @Test
    void createAppointment_asPatient_succeedsWithPendingStatus() throws Exception {
        LocalDate date = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.WEDNESDAY));
        Doctor doctor = doctorRepository.findById(CARDIOLOGY_DOCTOR_ID).orElseThrow();
        workScheduleRepository.save(new WorkSchedule(doctor, date, WorkDay.Mercredi, LocalTime.of(9, 0), LocalTime.of(9, 30)));

        String token = jwtService.generateToken(PATIENT_USER_ID, "patient");

        String body = """
                {"doctorId":%d,"patientId":%d,"date":"%s","time":"09:00 to 09:30",
                 "visitDescription":"Smoke test consultation","amount":50.00}
                """.formatted(CARDIOLOGY_DOCTOR_ID, PATIENT_ID, date);

        mockMvc.perform(post("/appointments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("pending"))
                .andExpect(jsonPath("$.doctorId").value(CARDIOLOGY_DOCTOR_ID))
                .andExpect(jsonPath("$.patientId").value(PATIENT_ID));
    }
}
