package org.flow.flowbackend.repository;

import org.flow.flowbackend.model.Project;
import org.flow.flowbackend.model.Task;
import org.flow.flowbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProject(Project project);
    List<Task> findByAssignedTo(User user);
    List<Task> findByAssignedToOrCreatedBy(User assignedTo, User createdBy);
    List<Task> findByStatus(String status);
    List<Task> findByProject_ProjectManager(User projectManager);
    long countByStatus(String status);
    long countByProject(Project project);
}