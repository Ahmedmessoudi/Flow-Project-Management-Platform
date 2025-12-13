package org.flow.flowbackend.service;

import org.flow.flowbackend.model.User;
import org.flow.flowbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Transactional
    public User createUser(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        String rawPassword = user.getPasswordHash();
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setCreatedAt(OffsetDateTime.now());
        User savedUser = userRepository.save(user);

        // Send welcome email to new user with raw password
        emailService.sendWelcomeEmail(savedUser, rawPassword);


        
        return savedUser;
    }

    @Transactional
    public User updateUser(Long id, User updates) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // Update only provided fields
        if (updates.getUsername() != null && !updates.getUsername().equals(existingUser.getUsername())) {
            if (userRepository.existsByUsername(updates.getUsername())) {
                throw new RuntimeException("Username already exists");
            }
            existingUser.setUsername(updates.getUsername());
        }

        if (updates.getEmail() != null && !updates.getEmail().equals(existingUser.getEmail())) {
            if (userRepository.existsByEmail(updates.getEmail())) {
                throw new RuntimeException("Email already exists");
            }
            existingUser.setEmail(updates.getEmail());
        }

        if (updates.getPasswordHash() != null && !updates.getPasswordHash().isEmpty()) {
            existingUser.setPasswordHash(passwordEncoder.encode(updates.getPasswordHash()));
        }

        if (updates.getFirstName() != null) {
            existingUser.setFirstName(updates.getFirstName());
        }

        if (updates.getLastName() != null) {
            existingUser.setLastName(updates.getLastName());
        }

        if (updates.getPhone() != null) {
            existingUser.setPhone(updates.getPhone());
        }

        // Update active status if provided
        existingUser.setActive(updates.isActive());

        existingUser.setUpdatedAt(OffsetDateTime.now());
        return userRepository.save(existingUser);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        // Prevent deactivation of protected accounts
        List<String> protectedRoles = List.of("SUPER_ADMIN", "ADMIN", "ORG_ADMIN");
        if (user.getRoles() != null) {
            for (String r : user.getRoles()) {
                if (protectedRoles.contains(r)) {
                    throw new RuntimeException("Cannot delete or deactivate a protected account with role: " + r);
                }
            }
        }

        // Soft delete - mark as inactive instead of removing from database
        user.setActive(false);
        user.setUpdatedAt(OffsetDateTime.now());
        userRepository.save(user);
    }

    @Transactional
    public User assignRoles(Long userId, List<String> roleNames) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        if (roleNames == null || roleNames.isEmpty()) {
            throw new RuntimeException("No role provided");
        }

        user.setRoles(roleNames);
        user.setUpdatedAt(OffsetDateTime.now());
        return userRepository.save(user);
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getUsersByRole(String roleName) {
        return userRepository.findByRole(roleName);
    }

    @Transactional
    public User resetPassword(String usernameOrEmail, String rawPassword) {
        Optional<User> optional = userRepository.findByUsername(usernameOrEmail);
        if (optional.isEmpty()) {
            optional = userRepository.findByEmail(usernameOrEmail);
        }
        User user = optional.orElseThrow(() -> new RuntimeException("User not found: " + usernameOrEmail));
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setUpdatedAt(OffsetDateTime.now());
        User savedUser = userRepository.save(user);
        
        // Send reset email
        emailService.sendPasswordResetEmail(savedUser);
        
        return savedUser;
    }

    @Transactional
    public User changePassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(OffsetDateTime.now());
        User savedUser = userRepository.save(user);

        // Send reset email
        emailService.sendPasswordResetEmail(savedUser);
        
        return savedUser;
    }

    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
}