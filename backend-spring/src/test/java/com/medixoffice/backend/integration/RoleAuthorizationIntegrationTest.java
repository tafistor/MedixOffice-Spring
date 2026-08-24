package com.medixoffice.backend.integration;

import com.medixoffice.backend.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class RoleAuthorizationIntegrationTest {

    private static final Integer PATIENT_USER_ID = 38; // patient1@medixoffice.demo

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Test
    void nonAdminRole_hittingAdminOnlyEndpoint_isForbidden() throws Exception {
        String token = jwtService.generateToken(PATIENT_USER_ID, "patient");

        mockMvc.perform(get("/activity-logs").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }
}
