package org.flow.flowbackend.config;

import org.flow.flowbackend.model.Organization;
import org.flow.flowbackend.model.OrganizationMember;
import org.flow.flowbackend.model.User;
import org.flow.flowbackend.repository.OrganizationMemberRepository;
import org.flow.flowbackend.repository.OrganizationRepository;
import org.flow.flowbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public DataInitializer(UserRepository userRepository, 
                          OrganizationRepository organizationRepository,
                          OrganizationMemberRepository organizationMemberRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.organizationMemberRepository = organizationMemberRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        System.out.println("=== Initializing Default Data ===");
        
        // Create super_admin if not exists
        User superAdmin = userRepository.findByEmail("super_admin@flow.local").orElse(null);
        if (superAdmin == null) {
            superAdmin = new User();
            superAdmin.setUsername("super_admin");
            superAdmin.setEmail("super_admin@flow.local");
            superAdmin.setPasswordHash(passwordEncoder.encode("super_admin123"));
            superAdmin.setFirstName("Super");
            superAdmin.setLastName("Admin");
            superAdmin.setRoles(java.util.List.of("SUPER_ADMIN"));
            superAdmin.setActive(true);
            superAdmin.setCreatedAt(OffsetDateTime.now());
            superAdmin = userRepository.save(superAdmin);
            System.out.println("Created super_admin user");
        }
        
        // Create org_admin first (needed to set as org admin of organization)
        User orgAdmin = userRepository.findByEmail("org_admin@flow.local").orElse(null);
        if (orgAdmin == null) {
            orgAdmin = new User();
            orgAdmin.setUsername("org_admin");
            orgAdmin.setEmail("org_admin@flow.local");
            orgAdmin.setPasswordHash(passwordEncoder.encode("org_admin123"));
            orgAdmin.setFirstName("Org");
            orgAdmin.setLastName("Admin");
            orgAdmin.setRoles(java.util.List.of("ORG_ADMIN"));
            orgAdmin.setActive(true);
            orgAdmin.setCreatedAt(OffsetDateTime.now());
            orgAdmin = userRepository.save(orgAdmin);
            System.out.println("Created org_admin user");
        }
        
        // Create Flow organization if not exists
        Organization flowOrg = organizationRepository.findByName("Flow").orElse(null);
        if (flowOrg == null && superAdmin != null) {
            flowOrg = new Organization();
            flowOrg.setName("Flow");
            flowOrg.setDescription("Default organization for ProjectFlow platform");
            flowOrg.setWebsite("https://flow.local");
            flowOrg.setActive(true);
            flowOrg.setCreatedBy(superAdmin);
            flowOrg.setOrgAdmin(orgAdmin);
            flowOrg.setCreatedAt(OffsetDateTime.now());
            flowOrg = organizationRepository.save(flowOrg);
            System.out.println("Created Flow organization");
        }

        // Create project_manager
        User pm = userRepository.findByEmail("project_manager@flow.local").orElse(null);
        if (pm == null) {
            pm = new User();
            pm.setUsername("project_manager");
            pm.setEmail("project_manager@flow.local");
            pm.setPasswordHash(passwordEncoder.encode("project_manager123"));
            pm.setFirstName("Project");
            pm.setLastName("Manager");
            pm.setRoles(java.util.List.of("PROJECT_MANAGER"));
            pm.setActive(true);
            pm.setCreatedAt(OffsetDateTime.now());
            pm = userRepository.save(pm);
            System.out.println("Created project_manager user");
        }

        // Create team_member
        User member = userRepository.findByEmail("team_member@flow.local").orElse(null);
        if (member == null) {
            member = new User();
            member.setUsername("team_member");
            member.setEmail("team_member@flow.local");
            member.setPasswordHash(passwordEncoder.encode("team_member123"));
            member.setFirstName("Team");
            member.setLastName("Member");
            member.setRoles(java.util.List.of("TEAM_MEMBER"));
            member.setActive(true);
            member.setCreatedAt(OffsetDateTime.now());
            member = userRepository.save(member);
            System.out.println("Created team_member user");
        }

        // Create client
        User client = userRepository.findByEmail("client@flow.local").orElse(null);
        if (client == null) {
            client = new User();
            client.setUsername("client");
            client.setEmail("client@flow.local");
            client.setPasswordHash(passwordEncoder.encode("client123"));
            client.setFirstName("Client");
            client.setLastName("User");
            client.setRoles(java.util.List.of("CLIENT"));
            client.setActive(true);
            client.setCreatedAt(OffsetDateTime.now());
            client = userRepository.save(client);
            System.out.println("Created client user");
        }

        // Add users to Flow organization via organization_members table
        if (flowOrg != null) {
            addMemberIfNotExists(flowOrg, orgAdmin, "ORG_ADMIN");
            addMemberIfNotExists(flowOrg, pm, "PROJECT_MANAGER");
            addMemberIfNotExists(flowOrg, member, "TEAM_MEMBER");
            addMemberIfNotExists(flowOrg, client, "CLIENT");
            System.out.println("Added users to Flow organization");
        }

        System.out.println("=== Data Initialization Complete ===");
    }

    private void addMemberIfNotExists(Organization org, User user, String role) {
        if (user != null && !organizationMemberRepository.existsByOrganizationAndUser(org, user)) {
            OrganizationMember member = OrganizationMember.builder()
                    .organization(org)
                    .user(user)
                    .role(role)
                    .joinedAt(OffsetDateTime.now())
                    .build();
            organizationMemberRepository.save(member);
        }
    }
}
