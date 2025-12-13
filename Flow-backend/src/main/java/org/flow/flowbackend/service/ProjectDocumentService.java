package org.flow.flowbackend.service;

import org.flow.flowbackend.model.Project;
import org.flow.flowbackend.model.ProjectDocument;
import org.flow.flowbackend.model.ProjectMember;
import org.flow.flowbackend.model.User;
import org.flow.flowbackend.repository.ProjectDocumentRepository;
import org.flow.flowbackend.repository.ProjectMemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class ProjectDocumentService {

    private final ProjectDocumentRepository projectDocumentRepository;
    private final ProjectService projectService;
    private final ProjectMemberRepository projectMemberRepository;
    private final EmailService emailService;

    @Autowired
    public ProjectDocumentService(ProjectDocumentRepository projectDocumentRepository, 
                                   ProjectService projectService,
                                   ProjectMemberRepository projectMemberRepository,
                                   EmailService emailService) {
        this.projectDocumentRepository = projectDocumentRepository;
        this.projectService = projectService;
        this.projectMemberRepository = projectMemberRepository;
        this.emailService = emailService;
    }

    public List<ProjectDocument> getDocumentsByProject(Long projectId) {
        Project project = projectService.getProjectById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        return projectDocumentRepository.findByProject(project);
    }

    @Transactional(readOnly = true)
    public ProjectDocument getDocumentById(Long id) {
        return projectDocumentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));
    }

    @Transactional
    public ProjectDocument addDocument(Long projectId,
                                       String title,
                                       String type,
                                       String fileName,
                                       String contentType,
                                       Long size,
                                       byte[] data) {
        Project project = projectService.getProjectById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        ProjectDocument document = ProjectDocument.builder()
                .title(title)
                .type(type)
                .url("") // keep DB happy if column still non-null
                .fileName(fileName)
                .contentType(contentType)
                .size(size)
                .data(data)
                .project(project)
                .uploadedAt(OffsetDateTime.now())
                .build();

        ProjectDocument savedDocument = projectDocumentRepository.save(document);

        // Send email notification to all CLIENT members of this project
        notifyClientsAboutNewDocument(projectId, project.getName(), savedDocument);

        return savedDocument;
    }

    /**
     * Notify all CLIENT members of a project about a new document.
     */
    private void notifyClientsAboutNewDocument(Long projectId, String projectName, ProjectDocument document) {
        try {
            List<ProjectMember> clients = projectMemberRepository.findClientsByProjectId(projectId);
            
            for (ProjectMember pm : clients) {
                User user = pm.getUser();
                emailService.sendDocumentNotificationEmail(
                    user.getEmail(),
                    user.getFirstName(),
                    projectName,
                    document.getTitle(),
                    document.getData(),
                    document.getFileName(),
                    document.getContentType()
                );
            }
            
            if (!clients.isEmpty()) {
                System.out.println("Document notification emails queued for " + clients.size() + " client(s)");
            }
        } catch (Exception e) {
            // Log but don't fail the document upload if email fails
            System.err.println("Failed to send document notification emails: " + e.getMessage());
        }
    }

    @Transactional
    public void deleteDocument(Long id) {
        projectDocumentRepository.deleteById(id);
    }
}
