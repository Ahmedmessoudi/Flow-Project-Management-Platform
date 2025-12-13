package org.flow.flowbackend.controller;

import org.flow.flowbackend.payload.request.LoginRequest;
import org.flow.flowbackend.payload.request.SignupRequest;
import org.flow.flowbackend.payload.response.JwtResponse;
import org.flow.flowbackend.payload.response.MessageResponse;
import org.flow.flowbackend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            return ResponseEntity.ok(authService.authenticateUser(loginRequest));
        } catch (Exception ex) {
            // Log exception details for debugging (class + message)
            logger.warn("Authentication failed: {} - {}", ex.getClass().getSimpleName(), ex.getMessage());
            // Return a clear 401 with message for frontend to display
            String msg = ex.getMessage() == null ? "Invalid username or password" : ex.getMessage();
            return ResponseEntity.status(401).body(new org.flow.flowbackend.payload.response.MessageResponse(msg));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<MessageResponse> registerUser(@Valid @RequestBody SignupRequest signupRequest) {
        authService.registerUser(signupRequest);
        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }
}