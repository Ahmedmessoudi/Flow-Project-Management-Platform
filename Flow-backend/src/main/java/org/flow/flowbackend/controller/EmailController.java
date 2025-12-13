package org.flow.flowbackend.controller;

import org.flow.flowbackend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/email")
public class EmailController {

    private final EmailService emailService;

    @Autowired
    public EmailController(EmailService emailService) {
        this.emailService = emailService;
    }

    /**
     * Get current SMTP configuration (password masked).
     */
    @GetMapping("/config")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<Map<String, String>> getEmailConfig() {
        Map<String, String> config = emailService.getSmtpConfig();
        return ResponseEntity.ok(config);
    }

    /**
     * Save SMTP configuration.
     */
    @PostMapping("/config")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> saveEmailConfig(@RequestBody Map<String, String> config) {
        emailService.saveSmtpConfig(config);
        return ResponseEntity.ok(Map.of("success", true, "message", "SMTP configuration saved successfully"));
    }

    /**
     * Send a test email to verify SMTP configuration.
     */
    @PostMapping("/test")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> sendTestEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email address is required"));
        }

        boolean success = emailService.sendTestEmail(email);
        if (success) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Test email sent successfully to " + email));
        } else {
            return ResponseEntity.ok(Map.of("success", false, "message", "Failed to send test email. Check SMTP configuration."));
        }
    }
}
