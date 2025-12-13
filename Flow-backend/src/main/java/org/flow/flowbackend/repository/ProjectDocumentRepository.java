package org.flow.flowbackend.repository;

import org.flow.flowbackend.model.ProjectDocument;
import org.flow.flowbackend.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectDocumentRepository extends JpaRepository<ProjectDocument, Long> {
    List<ProjectDocument> findByProject(Project project);
}
