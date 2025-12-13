package org.flow.flowbackend.repository;

import org.flow.flowbackend.model.Organization;
import org.flow.flowbackend.model.OrganizationMember;
import org.flow.flowbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, Long> {
    List<OrganizationMember> findByOrganization(Organization organization);
    
    List<OrganizationMember> findByUser(User user);
    
    Optional<OrganizationMember> findByOrganizationAndUser(Organization organization, User user);
    
    boolean existsByOrganizationAndUser(Organization organization, User user);
    
    @Query("SELECT om.user FROM OrganizationMember om WHERE om.organization.id = :organizationId")
    List<User> findUsersByOrganizationId(@Param("organizationId") Long organizationId);
    
    @Query("SELECT om.user FROM OrganizationMember om WHERE om.organization.id = :organizationId AND om.role = :role")
    List<User> findUsersByOrganizationIdAndRole(@Param("organizationId") Long organizationId, @Param("role") String role);
    
    List<OrganizationMember> findByOrganizationAndRole(Organization organization, String role);
    
    void deleteByOrganizationAndUser(Organization organization, User user);
    
    long countByOrganization(Organization organization);

    long countByOrganizationId(Long organizationId);
}
