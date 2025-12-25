import { useState, useEffect } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { projectService, Project, ProjectDocument } from "@/services/projectService";
import { FolderKanban, FileText, ThumbsUp, ThumbsDown, MessageSquare, ExternalLink, Calendar, CheckCircle2, Download, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProjectWithDocs extends Project {
  documents: ProjectDocument[];
}

const ClientProjects = () => {
  const [projects, setProjects] = useState<ProjectWithDocs[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Feedback Dialog State
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [feedbackType, setFeedbackType] = useState<'APPROVE' | 'DISAPPROVE' | 'REQUEST_CHANGES'>('APPROVE');
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState<number | null>(null);
  const [viewingDocId, setViewingDocId] = useState<number | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAllProjects();

      // Fetch documents for each project
      const projectsWithDocs = await Promise.all(
        data.map(async (p) => {
          try {
            const documents = await projectService.getProjectDocuments(p.id);
            return { ...p, documents };
          } catch (e) {
            console.error(`Failed to load docs for project ${p.id}`, e);
            return { ...p, documents: [] };
          }
        })
      );

      setProjects(projectsWithDocs);
    } catch (error: any) {
      toast({
        title: "Error loading projects",
        description: error.message || "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openFeedbackDialog = (project: Project, type: 'APPROVE' | 'DISAPPROVE' | 'REQUEST_CHANGES') => {
    setSelectedProject(project);
    setFeedbackType(type);
    setFeedbackMessage("");
    setIsFeedbackOpen(true);
  };

  const handleSendFeedback = async () => {
    if (!selectedProject) return;

    try {
      setSubmitting(true);
      await projectService.sendFeedback(selectedProject.id, feedbackType, feedbackMessage);

      toast({
        title: "Feedback Sent",
        description: `Feedback for ${selectedProject.name} has been sent to the Project Manager.`,
      });

      setIsFeedbackOpen(false);
    } catch (error: any) {
      toast({
        title: "Error sending feedback",
        description: error.message || "Failed to send feedback",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getFeedbackTitle = () => {
    switch (feedbackType) {
      case 'APPROVE': return "Approve Project Phase";
      case 'DISAPPROVE': return "Disapprove Project Phase";
      case 'REQUEST_CHANGES': return "Request Changes";
      default: return "Send Feedback";
    }
  };

  const handleViewDocument = async (doc: ProjectDocument) => {
    try {
      setViewingDocId(doc.id);
      const blob = await projectService.downloadDocument(doc.id);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      // Clean up the URL after a short delay to allow the tab to load
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error: any) {
      toast({
        title: "Error viewing document",
        description: error.message || "Failed to view document",
        variant: "destructive",
      });
    } finally {
      setViewingDocId(null);
    }
  };

  const handleDownloadDocument = async (doc: ProjectDocument) => {
    try {
      setDownloadingDocId(doc.id);
      const blob = await projectService.downloadDocument(doc.id);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.fileName || doc.title || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      toast({
        title: "Error downloading document",
        description: error.message || "Failed to download document",
        variant: "destructive",
      });
    } finally {
      setDownloadingDocId(null);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading your projects...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
          <p className="text-muted-foreground mt-2">
            View project progress, documents, and provide feedback.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No projects assigned</h3>
              <p className="text-muted-foreground mt-1">
                You haven't been assigned to any projects yet.
              </p>
            </div>
          ) : (
            projects.map((project) => (
              <Card key={project.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{project.name}</CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </div>
                    <Badge variant={project.isActive ? "default" : "secondary"}>
                      {project.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                  {/* Dates */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <span>-</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>

                  {/* Documents Section */}
                  <div>
                    <h4 className="flex items-center gap-2 font-semibold mb-3">
                      <FileText className="w-4 h-4 text-blue-500" />
                      Project Documents
                    </h4>
                    {project.documents.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No documents uploaded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {project.documents.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                            <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                              <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="truncate" title={doc.title}>{doc.title}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                                onClick={() => handleViewDocument(doc)}
                                disabled={viewingDocId === doc.id}
                                title="View in new tab"
                              >
                                {viewingDocId === doc.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Eye className="w-3 h-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-green-600 hover:text-green-800 hover:bg-green-100"
                                onClick={() => handleDownloadDocument(doc)}
                                disabled={downloadingDocId === doc.id}
                                title="Download"
                              >
                                {downloadingDocId === doc.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Download className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-6 border-t bg-muted/20">
                  <p className="text-xs text-muted-foreground font-medium w-full text-center mb-1">
                    Provide Feedback to Project Manager
                  </p>
                  <div className="grid grid-cols-3 gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                      onClick={() => openFeedbackDialog(project, 'APPROVE')}
                    >
                      <ThumbsUp className="w-3 h-3 mr-1" /> Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                      onClick={() => openFeedbackDialog(project, 'REQUEST_CHANGES')}
                    >
                      <MessageSquare className="w-3 h-3 mr-1" /> Changes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => openFeedbackDialog(project, 'DISAPPROVE')}
                    >
                      <ThumbsDown className="w-3 h-3 mr-1" /> Reject
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {/* Feedback Dialog */}
        <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{getFeedbackTitle()}</DialogTitle>
              <DialogDescription>
                This will send a notification to the Project Manager.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Message / Comments</Label>
                <Textarea
                  placeholder="Enter your feedback or reason..."
                  rows={4}
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFeedbackOpen(false)}>Cancel</Button>
              <Button onClick={handleSendFeedback} disabled={submitting}>
                {submitting ? "Sending..." : "Send Feedback"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default ClientProjects;
