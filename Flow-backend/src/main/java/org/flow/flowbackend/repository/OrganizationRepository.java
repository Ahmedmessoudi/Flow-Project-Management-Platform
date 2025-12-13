package org.flow.flowbackend.repository;

import org.flow.flowbackend.model.Organization;
import org.flow.flowbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long> {
    List<Organization> findByCreatedBy(User user);
    Optional<Organization> findByName(String name);
    List<Organization> findByOrgAdmin(User orgAdmin);
    List<Organization> findByIsActiveTrue();
    
    @Query("SELECT COUNT(p) FROM Project p WHERE p.organization.id = :orgId")
    int countProjectsByOrganizationId(@Param("orgId") Long orgId);
}