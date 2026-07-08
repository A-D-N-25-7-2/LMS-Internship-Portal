import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAssignmentById } from "@/features/assignments/assignmentApi";
import {
  submitAssignment,
  resubmitAssignment,
  getMySubmission,
  getSubmissionsByAssignment,
  gradeSubmission,
  deleteSubmission
} from "@/features/submissions/submissionApi";
import { usePermission } from "@/hooks/usePermission";
import FileViewer from "../resources/FileViewer";
import Linkify from "linkify-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Loader2,
  ArrowLeft,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  Award,
  User,
  Layers,
  Send,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";

const formatDate = (dateStr) => {
  if (!dateStr) return "No due date";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "No due date";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AssignmentDetailPage = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Intern submission state
  const [mySubmission, setMySubmission] = useState(null);
  const [submitText, setSubmitText] = useState("");
  const [filePaths, setFilePaths] = useState([]);
  const [newFilePath, setNewFilePath] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Mentor/Admin submissions list state
  const [submissionsList, setSubmissionsList] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [activeSubId, setActiveSubId] = useState(null);

  // Grading state
  const [gradeMarks, setGradeMarks] = useState("");
  const [gradingLoading, setGradingLoading] = useState(false);
  const [gradeError, setGradeError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // File viewer state
  const [activeFileViewer, setActiveFileViewer] = useState(null);


  const fetchMySubmission = useCallback(async () => {
    try {
      const { data } = await getMySubmission(assignmentId);
      // Backend returns array for getSubmissionByAssignment
      const submission = data.data && data.data.length > 0 ? data.data[0] : null;
      setMySubmission(submission);
      if (submission) {
        setSubmitText(submission.text || "");
        setFilePaths(submission.links || []);
        setExistingFiles(submission.files || []);
      }
      setSelectedFiles([]); // Reset selected files
    } catch (err) {
      console.error("Failed to fetch submission:", err);
    }
  }, [assignmentId]);

  const fetchSubmissions = useCallback(async () => {
    setSubmissionsLoading(true);
    try {
      const { data } = await getSubmissionsByAssignment(assignmentId);
      setSubmissionsList(data.data || []);
    } catch (err) {
      console.error("Failed to fetch submissions list:", err);
    } finally {
      setSubmissionsLoading(false);
    }
  }, [assignmentId]);

  const canGrade = hasPermission("submission:grade");
  const canRead = hasPermission("submission:read");

  const handleDeleteSubmission = async (submissionId) => {
    setDeleteLoading(true);
    try {
      await deleteSubmission(submissionId);
      if (canGrade || canRead) {
        await fetchSubmissions();
        setActiveSubId((prev) => (prev === submissionId ? null : prev));
      } else {
        await fetchMySubmission();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to delete submission.";
      if (canGrade || canRead) {
        setGradeError(errMsg);
      } else {
        setError(errMsg);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const { data } = await getAssignmentById(assignmentId);
        setAssignment(data.data);

        if (canGrade || canRead) {
          fetchSubmissions();
        } else {
          fetchMySubmission();
        }
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load assignment detail.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [assignmentId, canGrade, canRead, fetchSubmissions, fetchMySubmission]);

  const addFilePath = () => {
    if (newFilePath.trim()) {
      setFilePaths((prev) => [...prev, newFilePath.trim()]);
      setNewFilePath("");
    }
  };

  const removeFilePath = (idx) => {
    setFilePaths((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeSelectedFile = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingFile = (idx) => {
    setExistingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmissionSubmit = async (e) => {
    e.preventDefault();

    let currentLinks = [...filePaths];
    if (newFilePath.trim()) {
      currentLinks.push(newFilePath.trim());
      setFilePaths(currentLinks);
      setNewFilePath("");
    }

    if (!submitText.trim() && currentLinks.length === 0 && selectedFiles.length === 0 && existingFiles.length === 0) {
      setError("Submission cannot be empty. Enter notes, a link, or upload files.");
      return;
    }

    setSubmitLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("text", submitText.trim());
      formData.append("links", JSON.stringify(currentLinks));

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const remainingIds = existingFiles.map((file) => file._id);
      formData.append("remainingFiles", JSON.stringify(remainingIds));

      if (mySubmission) {
        // Resubmission
        await resubmitAssignment(mySubmission._id, formData);
      } else {
        // First time submission
        await submitAssignment(assignmentId, formData);
      }

      await fetchMySubmission();
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit assignment.");
    } finally {
      setSubmitLoading(false);
    }
  };



  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    const activeSub = submissionsList.find((s) => s._id === activeSubId);
    if (!activeSub) return;

    const marksNum = Number(gradeMarks);

    if (gradeMarks === "" || isNaN(marksNum)) {
      setGradeError("Please enter valid marks.");
      return;
    }
    if (marksNum < 0 || marksNum > assignment.totalMarks) {
      setGradeError(`Marks must be between 0 and ${assignment.totalMarks}.`);
      return;
    }

    setGradingLoading(true);
    setGradeError("");

    try {
      await gradeSubmission(activeSub._id, marksNum);

      // Refresh the submissions list to update statuses/marks
      const { data } = await getSubmissionsByAssignment(assignmentId);
      const list = data.data || [];
      setSubmissionsList(list);
      setGradeError("");
    } catch (err) {
      setGradeError(err.response?.data?.message || "Failed to submit grade.");
    } finally {
      setGradingLoading(false);
    }
  };

  // Set default active tab
  useEffect(() => {
    if (submissionsList.length > 0) {
      const exists = submissionsList.some((s) => s._id === activeSubId);
      if (!activeSubId || !exists) {
        setActiveSubId(submissionsList[0]._id);
      }
    } else {
      setActiveSubId(null);
    }
  }, [submissionsList, activeSubId]);

  // Set score input value when switching submission tabs
  useEffect(() => {
    const activeSub = submissionsList.find((s) => s._id === activeSubId);
    if (activeSub) {
      setGradeMarks(activeSub.marks?.toString() || "");
      setGradeError("");
    }
  }, [activeSubId, submissionsList]);


  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} className="mr-1" /> Back
        </Button>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  const isDueDatePassed = assignment.dueDate ? new Date() > new Date(assignment.dueDate) : false;

  return (
    <div className="mx-auto space-y-6 max-w-6xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="-ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} className="mr-1.5" /> Back to Module
      </Button>

      {/* Assignment Header details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{assignment.title}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User size={14} /> Created by: <span className="font-semibold text-foreground">{assignment.createdBy?.username || "Unknown"}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Layers size={14} /> Batch: <span className="font-semibold text-foreground">{assignment.batch?.name || "None"}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="border rounded-xl bg-card p-3 px-5 text-center shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Marks</p>
            <p className="text-xl font-bold text-foreground mt-0.5">{assignment.totalMarks}</p>
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Instructions / Description */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border rounded-xl bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <FileText size={18} className="text-primary" /> Instructions
            </h2>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-all">
              <Linkify options={{ target: "_blank", className: "text-blue-500 hover:underline font-semibold break-all" }}>
                {assignment.description || "No specific instructions provided."}
              </Linkify>
            </p>
          </div>
        </div>

        {/* Right 1 col: Submission Section */}
        <div className="space-y-6">
          {/* Due date card */}
          {assignment.batch && (
            <div className="border rounded-xl bg-card p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Calendar size={14} /> Due Date
              </h3>
              <div>
                <p className={`text-sm font-semibold ${isDueDatePassed ? "text-destructive" : "text-foreground"}`}>
                  {formatDate(assignment.dueDate)}
                </p>
                {isDueDatePassed ? (
                  <Badge variant="destructive" className="mt-2 gap-1 py-0.5 px-2 text-[10px]">
                    <AlertCircle size={10} /> Overdue
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="mt-2 gap-1 py-0.5 px-2 text-[10px] bg-green-500/10 text-green-600 border-green-500/20">
                    <CheckCircle2 size={10} /> Open
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Intern Submission Form */}
          {!hasPermission("submission:grade") && (
            <div className="border rounded-xl bg-card p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Award size={16} className="text-primary" /> Your Submission
              </h3>

              {mySubmission && !isEditing ? (
                <div className="space-y-4">
                  {/* Status Box */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-accent/20">
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="text-sm font-semibold text-foreground uppercase mt-0.5">
                        {mySubmission.status}
                      </p>
                    </div>
                    {mySubmission.status === "graded" ? (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Score</p>
                        <p className="text-sm font-bold text-green-600">
                          {mySubmission.marks} / {assignment.totalMarks}
                        </p>
                      </div>
                    ) : (
                      <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/10 border-orange-500/20">
                        Pending Grade
                      </Badge>
                    )}
                  </div>

                  {mySubmission.isLate && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                      <AlertCircle size={14} /> Submitted late
                    </div>
                  )}

                  {/* Submission content preview */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Submitted Text/Notes:</p>
                    <p className="text-xs text-foreground bg-accent/10 p-3 rounded-lg border whitespace-pre-wrap">
                      {mySubmission.text || "(No notes entered)"}
                    </p>
                  </div>

                  {mySubmission.links?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Submitted File Links:</p>
                      <div className="space-y-1">
                        {mySubmission.links.map((path, idx) => (
                          <a
                            key={idx}
                            href={path.startsWith("http") ? path : `https://${path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-2 p-2 rounded-lg border text-xs text-primary hover:bg-accent/50 transition-colors group"
                          >
                            <span className="truncate flex-1">{path}</span>
                            <ExternalLink size={12} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {mySubmission.files?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Submitted Uploaded Files:</p>
                      <div className="space-y-1">
                        {mySubmission.files.map((file, idx) => (
                          <button
                            key={file._id}
                            type="button"
                            onClick={() => setActiveFileViewer({ submissionId: mySubmission._id, file, index: idx })}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg border text-xs text-primary hover:bg-accent/50 transition-colors group w-full text-left cursor-pointer bg-transparent"
                          >
                            <span className="truncate flex-1 font-medium">{file.name}</span>
                            <ExternalLink size={12} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}


                  {mySubmission.status !== "graded" ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 text-xs cursor-pointer"
                        onClick={() => {
                          setIsEditing(true);
                          setExistingFiles(mySubmission.files || []);
                          setSelectedFiles([]);
                        }}
                      >
                        Edit Submission
                      </Button>
                      {hasPermission("submission:delete") && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                              disabled={deleteLoading}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Submission?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete your submission? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSubmission(mySubmission._id)}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  ) : (
                    hasPermission("submission:delete") && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full text-xs text-muted-foreground hover:text-destructive cursor-pointer gap-1.5"
                            disabled={deleteLoading}
                          >
                            <Trash2 size={14} /> Delete Submission
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Submission?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete your submission? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSubmission(mySubmission._id)}
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmissionSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 text-xs border border-destructive/30 bg-destructive/10 rounded-lg text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="submit-text" className="text-xs">Submission Notes / Comments</Label>
                    <textarea
                      id="submit-text"
                      placeholder="Enter links, comments, or paste text code here..."
                      value={submitText}
                      onChange={(e) => setSubmitText(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                      disabled={submitLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Links</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. github.com/username/project"
                        value={newFilePath}
                        onChange={(e) => setNewFilePath(e.target.value)}
                        className="text-xs"
                        disabled={submitLoading}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={addFilePath}
                        className="cursor-pointer shrink-0"
                        disabled={submitLoading}
                      >
                        <Plus size={14} /> Add Link
                      </Button>
                    </div>

                    {filePaths.length > 0 && (
                      <div className="space-y-1.5 mt-2">
                        {filePaths.map((path, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg border text-xs bg-card">
                            <span className="truncate flex-1">{path}</span>
                            <button
                              type="button"
                              onClick={() => removeFilePath(idx)}
                              className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                              disabled={submitLoading}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="submit-files" className="text-xs">Upload Files</Label>
                    <Input
                      id="submit-files"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="text-xs cursor-pointer"
                      disabled={submitLoading}
                    />

                    {selectedFiles.length > 0 && (
                      <div className="space-y-1 mt-2">
                        <p className="text-[10px] font-semibold text-muted-foreground">New Files to Upload:</p>
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg border text-xs bg-card">
                            <span className="truncate flex-1 font-medium">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeSelectedFile(idx)}
                              className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                              disabled={submitLoading}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {existingFiles.length > 0 && (
                      <div className="space-y-1 mt-2">
                        <p className="text-[10px] font-semibold text-muted-foreground">Already Uploaded Files:</p>
                        {existingFiles.map((file, idx) => (
                          <div key={file._id} className="flex items-center justify-between gap-2 p-2 rounded-lg border text-xs bg-card/50">
                            <span className="truncate flex-1 text-muted-foreground">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeExistingFile(idx)}
                              className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                              disabled={submitLoading}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    {isEditing && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="flex-1 text-xs cursor-pointer"
                        onClick={() => {
                          setIsEditing(false);
                          if (mySubmission) {
                            setSubmitText(mySubmission.text || "");
                            setFilePaths(mySubmission.links || []);
                            setExistingFiles(mySubmission.files || []);
                          }
                          setSelectedFiles([]);
                        }}
                        disabled={submitLoading}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="submit"
                      className="flex-1 text-xs cursor-pointer gap-1.5"
                      disabled={submitLoading}
                    >
                      {submitLoading ? (
                        <>
                          <Loader2 size={12} className="animate-spin" /> Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={12} /> {mySubmission ? "Resubmit" : "Submit"}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Admin/Mentor View: Show List of Submissions in Tabs */}
      {(hasPermission("submission:grade") || hasPermission("submission:read")) && (
        <div className="border rounded-xl bg-card p-6 shadow-sm space-y-4 mt-6">
          <div className="flex items-center justify-between pb-2 border-b">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Award size={18} className="text-primary" /> Submitted Intern Assignments
            </h2>
            <span className="text-xs text-muted-foreground font-medium bg-accent/20 px-2.5 py-1 rounded-md">
              Total submissions: {submissionsList.length}
            </span>
          </div>

          {submissionsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : submissionsList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm border border-dashed rounded-lg bg-accent/5">
              No submissions found for this assignment yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
              {/* Left Column: Vertical Intern Tab List */}
              <div className="md:col-span-1 border-r pr-4 space-y-1.5 max-h-[300px] overflow-y-auto">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Interns</p>
                {submissionsList.map((sub) => {
                  const isActive = sub._id === activeSubId;
                  const isGraded = sub.status === "graded";
                  return (
                    <button
                      key={sub._id}
                      onClick={() => setActiveSubId(sub._id)}
                      className={`w-full flex items-center justify-between p-2.5 px-3 rounded-lg border text-left transition-all cursor-pointer ${isActive
                        ? "bg-primary/10 border-primary shadow-sm"
                        : "hover:bg-accent/50 border-transparent bg-transparent"
                        }`}
                    >
                      <span className={`text-sm font-medium truncate ${isActive ? "text-primary font-semibold" : "text-foreground"}`}>
                        {sub.intern?.username || "Unknown Intern"}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {sub.isLate && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 font-bold uppercase">
                            Late
                          </span>
                        )}
                        <span
                          className={`size-2.5 rounded-full shrink-0 ${isGraded ? "bg-green-500" : "bg-orange-500 animate-pulse"}`}
                          title={isGraded ? `Graded: ${sub.marks}/${assignment.totalMarks}` : "Pending Grade"}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Active Submission Content & Inline Grading Form */}
              <div className="md:col-span-3 space-y-6">
                {(() => {
                  const activeSub = submissionsList.find((s) => s._id === activeSubId);
                  if (!activeSub) return null;

                  return (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      {/* Active Submitter Header */}
                      <div className="flex items-center justify-between pb-3 border-b">
                        <div>
                          <h3 className="text-base font-bold text-foreground">
                            {activeSub.intern?.username}'s Submission
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Submitted on {formatDate(activeSub.submittedAt)}
                            {activeSub.isLate && (
                              <span className="ml-1 text-destructive font-semibold uppercase">(Late)</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              activeSub.status === "graded"
                                ? "bg-green-500/10 text-green-600 hover:bg-green-500/10 border-green-500/20"
                                : "bg-orange-500/10 text-orange-500 hover:bg-orange-500/10 border-orange-500/20"
                            }
                          >
                            {activeSub.status === "graded" ? "Graded" : "Pending Grade"}
                          </Badge>
                          {hasPermission("submission:delete") && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={deleteLoading}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Submission?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {activeSub.intern?.username}'s submission? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteSubmission(activeSub._id)}
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>

                      {/* Two Column Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Notes, Links, and Files */}
                        <div className="lg:col-span-2 space-y-4">
                          {/* Notes Section */}
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                              Notes / Comments
                            </h4>
                            <div className="text-sm text-foreground bg-muted/30 p-3.5 rounded-xl border whitespace-pre-wrap leading-relaxed">
                              {activeSub.text || <span className="text-muted-foreground italic">No submission notes provided.</span>}
                            </div>
                          </div>

                          {/* Links Section */}
                          {activeSub.links?.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Submitted Links
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {activeSub.links.map((path, idx) => (
                                  <a
                                    key={idx}
                                    href={path.startsWith("http") ? path : `https://${path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 text-xs border rounded-xl hover:bg-accent/50 text-primary group bg-card transition-all"
                                  >
                                    <span className="truncate flex-1 pr-2 font-medium">{path}</span>
                                    <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Files Section */}
                          {activeSub.files?.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Uploaded Files
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {activeSub.files.map((file, idx) => (
                                  <button
                                    key={file._id}
                                    type="button"
                                    onClick={() => setActiveFileViewer({ submissionId: activeSub._id, file, index: idx })}
                                    className="flex items-center justify-between p-3 text-xs border rounded-xl hover:bg-accent/50 text-primary group bg-card text-left cursor-pointer w-full transition-all"
                                  >
                                    <span className="truncate flex-1 pr-2 font-medium">{file.name}</span>
                                    <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right Column: Grading Assessment */}
                        <div className="lg:col-span-1">
                          {hasPermission("submission:grade") && (
                            <div className="border rounded-xl bg-card p-4 space-y-4">
                              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Grading Assessment
                              </h4>

                              <form onSubmit={handleGradeSubmit} className="space-y-3">
                                <div className="space-y-1.5">
                                  <Label htmlFor="grade-marks" className="text-xs font-medium text-muted-foreground">
                                    Marks Awarded
                                  </Label>
                                  <div className="relative">
                                    <Input
                                      id="grade-marks"
                                      type="number"
                                      min={0}
                                      max={assignment.totalMarks}
                                      placeholder={`Max: ${assignment.totalMarks}`}
                                      value={gradeMarks}
                                      onChange={(e) => setGradeMarks(e.target.value)}
                                      disabled={gradingLoading}
                                      className="bg-background pr-16"
                                    />
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-xs text-muted-foreground font-mono">
                                      /{assignment.totalMarks}
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  type="submit"
                                  disabled={gradingLoading}
                                  className="w-full cursor-pointer justify-center"
                                >
                                  {gradingLoading ? (
                                    <>
                                      <Loader2 size={14} className="animate-spin mr-1.5" /> Saving...
                                    </>
                                  ) : activeSub.status === "graded" ? (
                                    "Update Grade"
                                  ) : (
                                    "Submit Grade"
                                  )}
                                </Button>
                              </form>

                              {gradeError && (
                                <p className="text-xs text-destructive border border-destructive/20 bg-destructive/10 p-3 rounded-lg">
                                  {gradeError}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {activeFileViewer !== null && (
        <FileViewer
          fileUrl={`/submissions/file/${activeFileViewer.submissionId}/${activeFileViewer.index}`}
          file={activeFileViewer.file}
          onClose={() => setActiveFileViewer(null)}
        />
      )}
    </div>
  );
};

export default AssignmentDetailPage;

