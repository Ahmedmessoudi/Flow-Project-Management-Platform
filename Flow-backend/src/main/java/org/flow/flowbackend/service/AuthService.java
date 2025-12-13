package org.flow.flowbackend.service;

import org.flow.flowbackend.model.User;
import org.flow.flowbackend.payload.request.LoginRequest;
import org.flow.flowbackend.payload.request.SignupRequest;
import org.flow.flowbackend.payload.response.JwtResponse;
import org.flow.flowbackend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final OrganizationService organizationService;

    @Autowired
    public AuthService(AuthenticationManager authenticationManager,
                       JwtUtil jwtUtil,
                       UserService userService,
                       OrganizationService organizationService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userService = userService;
        this.organizationService = organizationService;
    }

    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            User userDetails = (User) authentication.getPrincipal();

            // Strict Access Control: Check if user has access to any active organization
            if (!organizationService.hasActiveOrganizations(userDetails)) {
                throw new RuntimeException("Access Denied: All your organizations are deactivated. Please contact support.");
            }

            java.util.List<String> roleNames = userDetails.getRoles() == null ? java.util.List.of() : userDetails.getRoles();
            String jwt = jwtUtil.generateTokenWithRoles(userDetails.getUsername(), roleNames);

            return new JwtResponse(
                    jwt,
                    userDetails.getId(),
                    userDetails.getUsername(),
                    userDetails.getEmail(),
                    roleNames
            );
        } catch (org.springframework.security.authentication.DisabledException e) {
            throw new RuntimeException("Your account has been deactivated. Please contact an administrator.");
        } catch (org.springframework.security.authentication.LockedException e) {
            throw new RuntimeException("Your account has been deactivated. Please contact an administrator.");
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            throw new RuntimeException("Invalid username or password");
        }
    }

    public User registerUser(SignupRequest signupRequest) {
        if (userService.existsByUsername(signupRequest.getUsername())) {
            throw new RuntimeException("Username is already taken");
        }

        if (userService.existsByEmail(signupRequest.getEmail())) {
            throw new RuntimeException("Email is already in use");
        }

        User user = new User();
        user.setUsername(signupRequest.getUsername());
        user.setEmail(signupRequest.getEmail());
        user.setPasswordHash(signupRequest.getPassword());
        user.setFirstName(signupRequest.getFirstName());
        user.setLastName(signupRequest.getLastName());
        user.setActive(true);

        return userService.createUser(user);
    }
}