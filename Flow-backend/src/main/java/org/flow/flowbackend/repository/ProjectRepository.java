package org.flow.flowbackend.repository;

import org.flow.flowbackend.model.Organization;
import org.flow.flowbackend.model.Project;
import org.flow.flowbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOrganization(Organization organization);
    List<Project> findByCreatedBy(User user);
    List<Project> findByProjectManager(User projectManager);
    long countByOrganization(Organization organization);
    long countByIsActiveTrue();
}