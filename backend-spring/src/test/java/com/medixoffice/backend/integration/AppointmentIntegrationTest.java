package com.medixoffice.backend.integration;

import com.medixoffice.backend.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


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

    @Test
    void createAppointment_asPatient_succeedsWithPendingStatus() throws Exception {
        String token = jwtService.generateToken(PATIENT_USER_ID, "patient");

        String body = """
                {"doctorId":%d,"patientId":%d,"date":"2026-08-27","time":"09:00 to 09:30",
                 "visitDescription":"Smoke test consultation","amount":50.00}
                """.formatted(CARDIOLOGY_DOCTOR_ID, PATIENT_ID);

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
