package org.flow.flowbackend.repository;

import org.flow.flowbackend.model.Project;
import org.flow.flowbackend.model.ProjectMember;
import org.flow.flowbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    List<ProjectMember> findByProject(Project project);
    
    List<ProjectMember> findByUser(User user);
    
    Optional<ProjectMember> findByProjectAndUser(Project project, User user);
    
    boolean existsByProjectAndUser(Project project, User user);
    
    @Query("SELECT pm.user FROM ProjectMember pm WHERE pm.project.id = :projectId")
    List<User> findUsersByProjectId(@Param("projectId") Long projectId);
    
    void deleteByProjectAndUser(Project project, User user);
    
    @Query("SELECT pm FROM ProjectMember pm WHERE pm.project.id = :projectId AND pm.role = 'CLIENT'")
    List<ProjectMember> findClientsByProjectId(@Param("projectId") Long projectId);
    
    long countByProject(Project project);
}
