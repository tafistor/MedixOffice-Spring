package com.medixoffice.backend.seed;

import com.medixoffice.backend.entity.Appointment;
import com.medixoffice.backend.entity.AppointmentStatus;
import com.medixoffice.backend.entity.Consultation;
import com.medixoffice.backend.entity.ConsultationType;
import com.medixoffice.backend.entity.Doctor;
import com.medixoffice.backend.entity.Invoice;
import com.medixoffice.backend.entity.InvoiceStatus;
import com.medixoffice.backend.entity.MedicalRecord;
import com.medixoffice.backend.entity.Notification;
import com.medixoffice.backend.entity.NotificationType;
import com.medixoffice.backend.entity.Patient;
import com.medixoffice.backend.entity.RecordType;
import com.medixoffice.backend.entity.Role;
import com.medixoffice.backend.entity.SecretarySpecialty;
import com.medixoffice.backend.entity.User;
import com.medixoffice.backend.entity.WorkDay;
import com.medixoffice.backend.entity.WorkSchedule;
import com.medixoffice.backend.repository.AppointmentRepository;
import com.medixoffice.backend.repository.ConsultationRepository;
import com.medixoffice.backend.repository.DoctorRepository;
import com.medixoffice.backend.repository.InvoiceRepository;
import com.medixoffice.backend.repository.MedicalRecordRepository;
import com.medixoffice.backend.repository.NotificationRepository;
import com.medixoffice.backend.repository.PatientRepository;
import com.medixoffice.backend.repository.SecretarySpecialtyRepository;
import com.medixoffice.backend.repository.UserRepository;
import com.medixoffice.backend.repository.WorkScheduleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Seeds a small, realistic demo dataset - gated behind app.seed-data.enabled
 * (default false) so it only ever runs when explicitly requested. Idempotent:
 * skips entirely if the demo admin account already exists, so re-running the
 * app doesn't create duplicates.
 *
 * Deliberately includes one patient (Paul Ancien) who is given an invoice
 * *before* being soft-deleted, so the "unsubscribe a member who already has
 * transactions" defense scenario is visible immediately without needing to
 * trigger it live - the row and its history are already there to inspect.
 */
@Component
@Profile("!test")
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String DEMO_PASSWORD = "Demo1234!";

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final SecretarySpecialtyRepository secretarySpecialtyRepository;
    private final WorkScheduleRepository workScheduleRepository;
    private final AppointmentRepository appointmentRepository;
    private final ConsultationRepository consultationRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final InvoiceRepository invoiceRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean enabled;

    public DataSeeder(UserRepository userRepository, PatientRepository patientRepository, DoctorRepository doctorRepository,
                       SecretarySpecialtyRepository secretarySpecialtyRepository, WorkScheduleRepository workScheduleRepository,
                       AppointmentRepository appointmentRepository, ConsultationRepository consultationRepository,
                       MedicalRecordRepository medicalRecordRepository, InvoiceRepository invoiceRepository,
                       NotificationRepository notificationRepository, PasswordEncoder passwordEncoder,
                       org.springframework.core.env.Environment environment) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.secretarySpecialtyRepository = secretarySpecialtyRepository;
        this.workScheduleRepository = workScheduleRepository;
        this.appointmentRepository = appointmentRepository;
        this.consultationRepository = consultationRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.invoiceRepository = invoiceRepository;
        this.notificationRepository = notificationRepository;
        this.passwordEncoder = passwordEncoder;
        this.enabled = environment.getProperty("app.seed-data.enabled", Boolean.class, false);
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled) {
            return;
        }
        if (userRepository.findByEmail("admin@medixoffice.demo").isPresent()) {
            log.info("Seed data already present, skipping.");
            return;
        }

        log.info("Seeding demo data (all accounts use password: {})", DEMO_PASSWORD);

        User admin = saveUser("Ada", "Min", "admin@medixoffice.demo", Role.admin);

        User secretaryUser = saveUser("Sophie", "Secretaire", "secretary@medixoffice.demo", Role.secretary);
        // Must match frontend/src/data/specializationsList.js exactly - it's the
        // canonical list AddEditDoctor.jsx uses, and visitTypesWithAmounts.js keys
        // off these same English names to look up predefined visit types per
        // specialty. French labels here silently produced zero predefined visit
        // types for every seeded doctor (dropdown fell back to "Other" only).
        secretarySpecialtyRepository.save(new SecretarySpecialty(secretaryUser, "Cardiology"));
        secretarySpecialtyRepository.save(new SecretarySpecialty(secretaryUser, "General Medicine"));

        User doctor1User = saveUser("Marc", "Cardio", "doctor1@medixoffice.demo", Role.doctor);
        Doctor doctor1 = doctorRepository.save(new Doctor(doctor1User, "Cardiology", "DOC-001", "+32470000001", doctor1User.getEmail()));

        User doctor2User = saveUser("Julie", "Pediatre", "doctor2@medixoffice.demo", Role.doctor);
        Doctor doctor2 = doctorRepository.save(new Doctor(doctor2User, "Pediatrics", "DOC-002", "+32470000002", doctor2User.getEmail()));

        User patient1User = saveUser("Jean", "Dupont", "patient1@medixoffice.demo", Role.patient);
        Patient patient1 = new Patient(patient1User, "+32470000011", patient1User.getEmail(), "1 rue de la Paix, Bruxelles");
        patient1.setDateOfBirth(LocalDate.of(1985, 4, 12));
        patient1.setChronicDiseases("Hypertension");
        patient1.setAllergies("Pénicilline");
        patient1 = patientRepository.save(patient1);

        User patient2User = saveUser("Marie", "Martin", "patient2@medixoffice.demo", Role.patient);
        Patient patient2 = new Patient(patient2User, "+32470000012", patient2User.getEmail(), "5 avenue Louise, Bruxelles");
        patient2.setDateOfBirth(LocalDate.of(1992, 9, 3));
        patient2 = patientRepository.save(patient2);

        User patient3User = saveUser("Paul", "Ancien", "patient3@medixoffice.demo", Role.patient);
        Patient patient3 = new Patient(patient3User, "+32470000013", patient3User.getEmail(), "10 rue Neuve, Bruxelles");
        patient3.setDateOfBirth(LocalDate.of(1970, 1, 20));
        patient3 = patientRepository.save(patient3);

        LocalDate monday = nextOrCurrentMonday();
        for (int i = 0; i < 5; i++) {
            LocalDate day = monday.plusDays(i);
            WorkDay dayOfWeek = frenchDayOfWeek(day);
            workScheduleRepository.save(schedule(doctor1, day, dayOfWeek, LocalTime.of(9, 0), LocalTime.of(9, 30), 1));
            workScheduleRepository.save(schedule(doctor1, day, dayOfWeek, LocalTime.of(9, 30), LocalTime.of(10, 0), 2));
            workScheduleRepository.save(schedule(doctor2, day, dayOfWeek, LocalTime.of(14, 0), LocalTime.of(14, 30), 1));
        }

        Appointment appointment1 = new Appointment(patient1, doctor1, monday, "09:00", "Contrôle tension artérielle", new BigDecimal("45.00"));
        appointment1.setStatus(AppointmentStatus.confirmed);
        appointmentRepository.save(appointment1);

        Appointment appointment2 = new Appointment(patient2, doctor2, monday, "14:00", "Consultation de routine", new BigDecimal("40.00"));
        appointment2.setStatus(AppointmentStatus.pending);
        appointmentRepository.save(appointment2);

        Consultation consultation = new Consultation(patient1, doctor1, monday.minusDays(7), LocalTime.of(9, 0), ConsultationType.REGULAR_CHECKUP);
        consultation.setNotes("Tension stable, traitement poursuivi.");
        consultation.setStatus(com.medixoffice.backend.entity.ConsultationStatus.COMPLETED);
        consultation = consultationRepository.save(consultation);

        MedicalRecord record = new MedicalRecord(patient1, doctor1, consultation, doctor1, RecordType.CONSULTATION);
        record.setDiagnosis("Hypertension légère, sous contrôle.");
        record.setTreatment("Poursuite du traitement actuel, contrôle dans 3 mois.");
        record.setStatus(com.medixoffice.backend.entity.MedicalRecordStatus.Complete);
        medicalRecordRepository.save(record);

        Invoice invoice1 = new Invoice(patient1, monday.minusDays(7), new BigDecimal("45.00"), "Consultation de contrôle", "INV-SEED-0001");
        invoice1.setStatus(InvoiceStatus.Paid);
        invoiceRepository.save(invoice1);

        // patient3's transaction history, created before deactivation - this is the
        // defense scenario: the invoice stays intact and valid after soft delete.
        Invoice invoice2 = new Invoice(patient3, monday.minusDays(14), new BigDecimal("60.00"), "Consultation initiale", "INV-SEED-0002");
        invoice2.setStatus(InvoiceStatus.Paid);
        invoiceRepository.save(invoice2);

        notificationRepository.save(new Notification(secretaryUser,
                "Nouveau rendez-vous en attente: Marie Martin avec Dr. Julie Pediatre le " + monday + " à 14:00",
                NotificationType.appointment));
        notificationRepository.save(new Notification(admin, "Bienvenue sur MedixOffice.", NotificationType.general));

        // Demonstrates soft delete on a patient who already has a transaction (invoice2 above).
        patient3.softDelete();
        patient3User.softDelete();
        patientRepository.save(patient3);
        userRepository.save(patient3User);

        log.info("Seed data created: admin@medixoffice.demo, secretary@medixoffice.demo, doctor1@medixoffice.demo, "
                + "doctor2@medixoffice.demo, patient1@medixoffice.demo, patient2@medixoffice.demo (active), "
                + "patient3@medixoffice.demo (soft-deleted, has an invoice) - all passwords: {}", DEMO_PASSWORD);
    }

    private User saveUser(String firstName, String lastName, String email, Role role) {
        return userRepository.save(new User(firstName, lastName, email, passwordEncoder.encode(DEMO_PASSWORD), role));
    }

    private WorkSchedule schedule(Doctor doctor, LocalDate date, WorkDay dayOfWeek, LocalTime start, LocalTime end, int slotOrder) {
        WorkSchedule ws = new WorkSchedule(doctor, date, dayOfWeek, start, end);
        ws.setSlotOrder(slotOrder);
        return ws;
    }

    private LocalDate nextOrCurrentMonday() {
        LocalDate today = LocalDate.now();
        int daysUntilMonday = (8 - today.getDayOfWeek().getValue()) % 7;
        return today.plusDays(daysUntilMonday);
    }

    private WorkDay frenchDayOfWeek(LocalDate date) {
        return switch (date.getDayOfWeek()) {
            case MONDAY -> WorkDay.Lundi;
            case TUESDAY -> WorkDay.Mardi;
            case WEDNESDAY -> WorkDay.Mercredi;
            case THURSDAY -> WorkDay.Jeudi;
            case FRIDAY -> WorkDay.Vendredi;
            default -> WorkDay.Lundi;
        };
    }
}
