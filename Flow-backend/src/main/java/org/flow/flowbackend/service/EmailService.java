package org.flow.flowbackend.service;

import org.flow.flowbackend.model.Project;
import org.flow.flowbackend.model.ProjectDocument;
import org.flow.flowbackend.model.SystemConfig;
import org.flow.flowbackend.model.User;
import org.flow.flowbackend.repository.SystemConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

@Service
public class EmailService {

    private final SystemConfigRepository systemConfigRepository;
    private JavaMailSender mailSender;

    @Value("${app.email.from:noreply@projectflow.com}")
    private String defaultFromEmail;

    @Value("${spring.mail.host:}")
    private String defaultHost;

    @Value("${spring.mail.port:587}")
    private int defaultPort;

    @Value("${spring.mail.username:}")
    private String defaultUsername;

    @Value("${spring.mail.password:}")
    private String defaultPassword;

    @Autowired
    public EmailService(SystemConfigRepository systemConfigRepository,
                        @Autowired(required = false) JavaMailSender mailSender) {
        this.systemConfigRepository = systemConfigRepository;
        this.mailSender = mailSender;
    }

    // ===================== Email Sending Methods =====================

    @Async
    public void sendWelcomeEmail(User user, String rawPassword) {
        String subject = "Welcome to ProjectFlow - Account Details";
        String body = getWelcomeTemplate()
            .replace("{{name}}", user.getFirstName() != null ? user.getFirstName() : "User")
            .replace("{{email}}", user.getEmail())
            .replace("{{password}}", rawPassword);
        
        sendEmail(user.getEmail(), subject, body);
    }

    @Async
    public void sendProjectAssignmentEmail(User user, Project project, String role) {
        String subject = "You've been added to a project: " + project.getName();
        String body = getProjectAssignmentTemplate()
            .replace("{{name}}", user.getFirstName() != null ? user.getFirstName() : "User")
            .replace("{{projectName}}", project.getName())
            .replace("{{role}}", role != null ? role : "Team Member");
        
        sendEmail(user.getEmail(), subject, body);
    }

    @Async
    public void sendNotificationEmail(User user, String subject, String message) {
        String body = getNotificationTemplate()
            .replace("{{name}}", user.getFirstName() != null ? user.getFirstName() : "User")
            .replace("{{message}}", message);
        
        sendEmail(user.getEmail(), subject, body);
    }

    @Async
    public void sendPasswordResetEmail(User user) {
        String subject = "Security Notification: Password Changed";
        String body = getPasswordResetTemplate()
            .replace("{{name}}", user.getFirstName() != null ? user.getFirstName() : "User");
        
        sendEmail(user.getEmail(), subject, body);
    }

    public boolean sendTestEmail(String toEmail) {
        try {
            String subject = "ProjectFlow Test Email";
            String body = "This is a test email from ProjectFlow. If you received this, your SMTP configuration is working correctly!";
            sendEmail(toEmail, subject, body);
            return true;
        } catch (Exception e) {
            System.err.println("Test email failed: " + e.getMessage());
            return false;
        }
    }

    private void sendEmail(String to, String subject, String body) {
        try {
            JavaMailSender sender = getConfiguredMailSender();
            if (sender == null) {
                System.out.println("Email not sent (SMTP not configured): " + subject + " to " + to);
                return;
            }

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(getFromEmail());
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            sender.send(message);
            System.out.println("Email sent successfully to: " + to);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
        }
    }

    // ===================== Configuration Methods =====================

    private JavaMailSender getConfiguredMailSender() {
        // Try to get config from database first, fall back to application.properties
        String host = getConfigValue("smtp_host", defaultHost);
        String username = getConfigValue("smtp_username", defaultUsername);
        String password = getConfigValue("smtp_password", defaultPassword);
        int port = Integer.parseInt(getConfigValue("smtp_port", String.valueOf(defaultPort)));

        if (host == null || host.isEmpty() || username == null || username.isEmpty()) {
            return null; // SMTP not configured
        }

        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(host);
        sender.setPort(port);
        sender.setUsername(username);
        sender.setPassword(password);

        Properties props = sender.getJavaMailProperties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.connectiontimeout", "30000");
        props.put("mail.smtp.timeout", "30000");
        props.put("mail.smtp.writetimeout", "30000");

        return sender;
    }

    private String getFromEmail() {
        return getConfigValue("smtp_from", defaultFromEmail);
    }

    private String getConfigValue(String key, String defaultValue) {
        return systemConfigRepository.findByKey(key)
            .map(SystemConfig::getValue)
            .orElse(defaultValue);
    }

    // ===================== SMTP Config Management =====================

    @Transactional(readOnly = true)
    public Map<String, String> getSmtpConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("host", getConfigValue("smtp_host", defaultHost));
        config.put("port", getConfigValue("smtp_port", String.valueOf(defaultPort)));
        config.put("username", getConfigValue("smtp_username", defaultUsername));
        config.put("from", getConfigValue("smtp_from", defaultFromEmail));
        // Don't return password for security
        config.put("password", getConfigValue("smtp_password", "").isEmpty() ? "" : "********");
        config.put("welcomeTemplate", getWelcomeTemplate());
        config.put("notificationTemplate", getNotificationTemplate());
        config.put("passwordResetTemplate", getPasswordResetTemplate());
        return config;
    }

    @Transactional
    public void saveSmtpConfig(Map<String, String> config) {
        saveConfig("smtp_host", config.get("host"), "email");
        saveConfig("smtp_port", config.get("port"), "email");
        saveConfig("smtp_username", config.get("username"), "email");
        saveConfig("smtp_from", config.get("from"), "email");
        
        // Only update password if it's not the masked value
        String password = config.get("password");
        if (password != null && !password.equals("********") && !password.isEmpty()) {
            saveConfig("smtp_password", password, "email");
        }
        
        if (config.containsKey("welcomeTemplate")) {
            saveConfig("email_welcome_template", config.get("welcomeTemplate"), "email");
        }
        if (config.containsKey("notificationTemplate")) {
            saveConfig("email_notification_template", config.get("notificationTemplate"), "email");
        }
        if (config.containsKey("passwordResetTemplate")) {
            saveConfig("email_password_reset_template", config.get("passwordResetTemplate"), "email");
        }
    }

    private void saveConfig(String key, String value, String category) {
        SystemConfig config = systemConfigRepository.findByKey(key)
            .orElse(SystemConfig.builder().key(key).category(category).build());
        config.setValue(value);
        config.setUpdatedAt(OffsetDateTime.now());
        systemConfigRepository.save(config);
    }

    // ===================== Email Templates =====================

    private String getWelcomeTemplate() {
        return getConfigValue("email_welcome_template", 
            "Hello {{name}},\n\n" +
            "Welcome to ProjectFlow! Your account has been created successfully.\n\n" +
            "Here are your login credentials:\n" +
            "Email: {{email}}\n" +
            "Temporary Password: {{password}}\n\n" +
            "IMPORTANT: Please log in and change your password immediately for security reasons.\n\n" +
            "Best regards,\nThe ProjectFlow Team");
    }

    private String getProjectAssignmentTemplate() {
        return "Hello {{name}},\n\n" +
            "You have been added to the project '{{projectName}}' as a {{role}}.\n\n" +
            "Log in to ProjectFlow to view your project and tasks.\n\n" +
            "Best regards,\nThe ProjectFlow Team";
    }

    private String getNotificationTemplate() {
        return getConfigValue("email_notification_template",
            "Hello {{name}},\n\n" +
            "{{message}}\n\n" +
            "Best regards,\nThe ProjectFlow Team");
    }

    private String getPasswordResetTemplate() {
        return getConfigValue("email_password_reset_template",
            "Hello {{name}},\n\n" +
            "Your password has been successfully changed.\n\n" +
            "If you did not authorize this change, please contact your administrator immediately.\n\n" +
            "Best regards,\nThe ProjectFlow Team");
    }
    @Async
    public void sendProjectStatusChangeEmail(String userEmail, String userName, String projectName, boolean isActive) {
        String subject = "Project Status Changed: " + projectName;
        String status = isActive ? "Active" : "Inactive";
        String body = "Hello " + (userName != null ? userName : "User") + ",\n\n" +
                "The project '" + projectName + "' is now " + status + ".\n\n" +
                "Best regards,\nThe ProjectFlow Team";
        
        sendEmail(userEmail, subject, body);
    }

    @Async
    public void sendProjectDeletionEmail(String userEmail, String userName, String projectName) {
        String subject = "Project Deleted: " + projectName;
        String body = "Hello " + (userName != null ? userName : "User") + ",\n\n" +
                "The project '" + projectName + "' has been deleted.\n\n" +
                "Best regards,\nThe ProjectFlow Team";
        
        sendEmail(userEmail, subject, body);
    }

    /**
     * Send document notification email to a client with optional attachment.
     * Files larger than 25MB will not be attached (only notification sent).
     */
    @Async
    public void sendDocumentNotificationEmail(String userEmail, String userName, String projectName, String documentTitle,
                                               byte[] documentData, String fileName, String contentType) {
        String subject = "New Document Available: " + documentTitle;
        String name = userName != null ? userName : "User";
        
        // Base email body
        String body = "Hello " + name + ",\n\n" +
                "A new document has been uploaded to the project '" + projectName + "'.\n\n" +
                "Document: " + documentTitle + "\n";
        
        // Check if we should attach the file (25MB limit)
        boolean shouldAttach = documentData != null && documentData.length > 0 
                && documentData.length <= 25 * 1024 * 1024; // 25MB limit
        
        if (shouldAttach) {
            body += "\nThe document is attached to this email for your convenience.\n";
        } else if (documentData != null && documentData.length > 25 * 1024 * 1024) {
            body += "\nThe file is too large to attach. Please log in to ProjectFlow to download it.\n";
        } else {
            body += "\nPlease log in to ProjectFlow to view and download this document.\n";
        }
        
        body += "\nBest regards,\nThe ProjectFlow Team";
        
        if (shouldAttach) {
            // Create a temporary object for the single attachment logic
            // Ideally we'd pass ProjectDocument but here we just construct the call
            // We'll trust the new helper handles lists
            
            // Actually, let's just make a list
            List<ProjectDocument> docs = new ArrayList<>();
            ProjectDocument doc = ProjectDocument.builder()
                .title(documentTitle) // Title used? filename used?
                // The singular helper used fileName, contentType, data.
                // We'll refactor shortly. Use singular call for now but update singular logic.
                .build();
                // Wait, ProjectDocument builder requires other fields? No.
                // But creating a dummy object is messy.
                // Let's keep the singular logic separate but use the same ROBUST implementation style.
             
             sendEmailWithAttachment(userEmail, subject, body, documentData, fileName, contentType);
        } else {
            sendEmail(userEmail, subject, body);
        }
    }

    @Async
    public void sendBatchDocumentNotificationEmail(String userEmail, String userName, String projectName, List<ProjectDocument> documents) {
        String subject = "New Documents Available: " + projectName;
        String name = userName != null ? userName : "User";
        
        StringBuilder body = new StringBuilder();
        body.append("Hello ").append(name).append(",\n\n");
        body.append(documents.size()).append(" new documents have been uploaded to the project '").append(projectName).append("'.\n\n");
        body.append("Documents:\n");
        
        long totalSize = 0;
        List<ProjectDocument> attachments = new ArrayList<>();
        
        for (ProjectDocument doc : documents) {
            body.append("- ").append(doc.getTitle()).append("\n");
            
            if (doc.getData() != null) {
                long docSize = doc.getData().length;
                // 25MB limit (approx)
                if (totalSize + docSize <= 25 * 1024 * 1024) { 
                     attachments.add(doc);
                     totalSize += docSize;
                } else {
                     body.append("  (File too large to attach, please download from portal)\n");
                }
            }
        }
        
        body.append("\nLog in to ProjectFlow to view and download these documents.\n");
        body.append("\nBest regards,\nThe ProjectFlow Team");

        sendEmailWithAttachments(userEmail, subject, body.toString(), attachments);
    }
    
    // Updated Singular Helper (Robust)
    private void sendEmailWithAttachment(String to, String subject, String body, 
                                          byte[] attachmentData, String fileName, String contentType) {
        try {
            JavaMailSender sender = getConfiguredMailSender();
            if (sender == null) {
                System.out.println("Email not sent (SMTP not configured): " + subject + " to " + to);
                return;
            }

            jakarta.mail.internet.MimeMessage mimeMessage = sender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = 
                new org.springframework.mail.javamail.MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(getFromEmail());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body);

            // Add attachment with robust ByteArrayResource
            if (attachmentData != null && fileName != null) {
                String attachmentContentType = contentType != null ? contentType : "application/octet-stream";
                System.out.println("Attaching file: " + fileName + ", Type: " + attachmentContentType + ", Size: " + attachmentData.length);
                
                helper.addAttachment(fileName, 
                    new org.springframework.core.io.ByteArrayResource(attachmentData) {
                        @Override
                        public String getFilename() {
                            return fileName;
                        }
                    }, 
                    attachmentContentType);
            }

            sender.send(mimeMessage);
            System.out.println("Email with attachment sent successfully to: " + to);
        } catch (Throwable e) {
            System.err.println("Failed to send email with attachment to " + to + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    // New Plural Helper
    private void sendEmailWithAttachments(String to, String subject, String body, List<ProjectDocument> attachments) {
        try {
            JavaMailSender sender = getConfiguredMailSender();
            if (sender == null) {
                System.out.println("Email not sent (SMTP not configured): " + subject + " to " + to);
                return;
            }

            jakarta.mail.internet.MimeMessage mimeMessage = sender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = 
                new org.springframework.mail.javamail.MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(getFromEmail());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body);

            for (ProjectDocument doc : attachments) {
                if (doc.getData() != null) {
                    String fileName = doc.getFileName() != null ? doc.getFileName() : doc.getTitle();
                    String contentType = doc.getContentType() != null ? doc.getContentType() : "application/octet-stream";
                    
                    System.out.println("Attaching batch file: " + fileName + ", Size: " + doc.getData().length);
                    
                    helper.addAttachment(fileName, 
                        new org.springframework.core.io.ByteArrayResource(doc.getData()) {
                            @Override
                            public String getFilename() {
                                return fileName;
                            }
                        }, 
                        contentType);
                }
            }

            sender.send(mimeMessage);
            System.out.println("Batch email with " + attachments.size() + " attachments sent successfully to: " + to);
        } catch (Throwable e) {
            System.err.println("Failed to send batch email to " + to + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
}
