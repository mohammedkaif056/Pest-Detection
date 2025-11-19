import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, Loader2, CheckCircle2, AlertCircle, TrendingUp, Bug, Scan, X, AlertTriangle, Droplets, Leaf, Shield, Beaker, Sprout, Clock, Info, Download } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { apiRequest } from "@/lib/queryClient";
import type { Detection } from "@shared/schema";
import jsPDF from "jspdf";

export default function Detect() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<Detection | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const detectMutation = useMutation({
    mutationFn: async (imageData: string) => {
      const response = await apiRequest("POST", "/api/detect", {
        image: imageData,
      });
      
      // Parse JSON from response
      const data = await response.json();
      
      console.log("=== DETECTION API RESPONSE ===");
      console.log("Full data:", data);
      console.log("confidence:", data.confidence, "type:", typeof data.confidence);
      console.log("pestName:", data.pestName);
      console.log("plant:", data.plant);
      console.log("symptoms:", data.symptoms);
      console.log("==============================");
      return data as Detection;
    },
    onSuccess: (data) => {
      console.log("=== SETTING DETECTION RESULT ===");
      console.log("Data:", data);
      console.log("================================");
      setDetectionResult(data);
      
      // Force a re-render check
      setTimeout(() => {
        console.log("=== CURRENT STATE AFTER UPDATE ===");
        console.log("detectionResult state:", detectionResult);
        console.log("===================================");
      }, 100);
    },
    onError: (error) => {
      console.error("=== DETECTION ERROR ===");
      console.error("Error:", error);
      console.error("=======================");
    },
  });

  const handleDetect = async () => {
    if (!selectedImage) return;
    detectMutation.mutate(selectedImage);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          // Compress image to max 800x800 for faster upload
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSize = 800;
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with 0.85 quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          setSelectedImage(compressedBase64);
          setDetectionResult(null);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: false,
  });

  // Cleanup camera stream on unmount or when closing camera
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Stop all camera tracks
  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        track.stop();
      });
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Open camera with proper error handling
  const handleOpenCamera = async () => {
    setCameraError(null);
    setIsCameraOpen(true);

    try {
      // Request camera access with optimal settings
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: "environment", // Use rear camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            console.error("Error playing video:", err);
            setCameraError("Failed to start camera preview");
          });
        };
      }
    } catch (error) {
      console.error("Camera access error:", error);
      
      // Provide user-friendly error messages
      if (error instanceof DOMException) {
        switch (error.name) {
          case "NotAllowedError":
          case "PermissionDeniedError":
            setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
            break;
          case "NotFoundError":
          case "DevicesNotFoundError":
            setCameraError("No camera found on this device.");
            break;
          case "NotReadableError":
          case "TrackStartError":
            setCameraError("Camera is already in use by another application.");
            break;
          case "OverconstrainedError":
            setCameraError("Camera doesn't support the requested settings.");
            break;
          case "SecurityError":
            setCameraError("Camera access blocked due to security restrictions.");
            break;
          default:
            setCameraError("Failed to access camera. Please try again.");
        }
      } else {
        setCameraError("An unexpected error occurred while accessing the camera.");
      }
      
      setIsCameraOpen(false);
    }
  };

  // Close camera and cleanup
  const handleCloseCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setCameraError(null);
  };

  // Capture photo from video stream
  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error("Video or canvas ref not available");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to max 800x800 for faster processing
    const maxSize = 800;
    let width = video.videoWidth;
    let height = video.videoHeight;
    
    if (width > height && width > maxSize) {
      height = (height * maxSize) / width;
      width = maxSize;
    } else if (height > maxSize) {
      width = (width * maxSize) / height;
      height = maxSize;
    }

    canvas.width = width;
    canvas.height = height;

    // Draw current video frame to canvas
    const context = canvas.getContext("2d");
    if (!context) {
      console.error("Could not get canvas context");
      return;
    }

    context.drawImage(video, 0, 0, width, height);

    // Convert canvas to blob and then to file
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error("Failed to create image blob");
        return;
      }

      // Create a file from blob
      const timestamp = new Date().getTime();
      const file = new File([blob], `camera-capture-${timestamp}.jpg`, {
        type: "image/jpeg",
        lastModified: timestamp,
      });

      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSelectedImage(base64String);
        setSelectedFile(file);
        setDetectionResult(null);
        
        // Close camera after successful capture
        handleCloseCamera();
      };
      reader.readAsDataURL(blob);
    }, "image/jpeg", 0.85); // High quality JPEG with 0.85 compression
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setDetectionResult(null);
    setSelectedFile(null);
  };

  const getRiskColor = (level: string | undefined) => {
    if (!level) return "secondary" as const;
    
    switch (level.toLowerCase()) {
      case "critical":
        return "destructive" as const;
      case "high":
        return "destructive" as const;
      case "medium":
        return "secondary" as const;
      case "low":
        return "default" as const;
      default:
        return "secondary" as const;
    }
  };

  const downloadPDF = () => {
    if (!detectionResult) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Title
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("Plant Disease Detection Report", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Date
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Report Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Add image if available
    if (selectedImage) {
      try {
        const imgWidth = 80;
        const imgHeight = 80;
        pdf.addImage(selectedImage, "JPEG", (pageWidth - imgWidth) / 2, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 15;
      } catch (e) {
        console.error("Error adding image to PDF:", e);
      }
    }

    // Disease Information
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Detection Results", margin, yPos);
    yPos += 10;

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Disease: ${detectionResult.pestName}`, margin, yPos);
    yPos += 8;
    pdf.text(`Confidence: ${(detectionResult.confidence * 100).toFixed(1)}%`, margin, yPos);
    yPos += 8;
    pdf.text(`Risk Level: ${detectionResult.riskLevel}`, margin, yPos);
    yPos += 8;
    
    if (detectionResult.plant) {
      pdf.text(`Plant: ${detectionResult.plant}`, margin, yPos);
      yPos += 8;
    }
    
    if (detectionResult.pathogenType) {
      pdf.text(`Pathogen Type: ${detectionResult.pathogenType}`, margin, yPos);
      yPos += 8;
    }
    
    if (detectionResult.pathogenName) {
      pdf.text(`Pathogen: ${detectionResult.pathogenName}`, margin, yPos);
      yPos += 8;
    }

    yPos += 5;

    // Symptoms
    if (detectionResult.symptoms && detectionResult.symptoms.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Symptoms:", margin, yPos);
      yPos += 8;
      
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      detectionResult.symptoms.forEach((symptom) => {
        const lines = pdf.splitTextToSize(`• ${symptom}`, pageWidth - margin * 2);
        lines.forEach((line: string) => {
          if (yPos > 270) {
            pdf.addPage();
            yPos = 20;
          }
          pdf.text(line, margin + 5, yPos);
          yPos += 6;
        });
      });
      yPos += 5;
    }

    // Treatment
    if (detectionResult.treatmentDetails) {
      const td = detectionResult.treatmentDetails;
      
      if (td.immediate_actions && td.immediate_actions.length > 0) {
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("Immediate Actions:", margin, yPos);
        yPos += 8;
        
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        td.immediate_actions.forEach((action) => {
          const lines = pdf.splitTextToSize(`• ${action}`, pageWidth - margin * 2);
          lines.forEach((line: string) => {
            if (yPos > 270) {
              pdf.addPage();
              yPos = 20;
            }
            pdf.text(line, margin + 5, yPos);
            yPos += 6;
          });
        });
        yPos += 5;
      }

      if (td.chemical_control && td.chemical_control.length > 0) {
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("Chemical Control:", margin, yPos);
        yPos += 8;
        
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        td.chemical_control.forEach((control) => {
          const lines = pdf.splitTextToSize(`• ${control}`, pageWidth - margin * 2);
          lines.forEach((line: string) => {
            if (yPos > 270) {
              pdf.addPage();
              yPos = 20;
            }
            pdf.text(line, margin + 5, yPos);
            yPos += 6;
          });
        });
        yPos += 5;
      }

      if (td.organic_control && td.organic_control.length > 0) {
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("Organic Control:", margin, yPos);
        yPos += 8;
        
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        td.organic_control.forEach((control) => {
          const lines = pdf.splitTextToSize(`• ${control}`, pageWidth - margin * 2);
          lines.forEach((line: string) => {
            if (yPos > 270) {
              pdf.addPage();
              yPos = 20;
            }
            pdf.text(line, margin + 5, yPos);
            yPos += 6;
          });
        });
        yPos += 5;
      }
    }

    // Prevention
    if (detectionResult.prevention && detectionResult.prevention.length > 0) {
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Prevention:", margin, yPos);
      yPos += 8;
      
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      detectionResult.prevention.forEach((prev) => {
        const lines = pdf.splitTextToSize(`• ${prev}`, pageWidth - margin * 2);
        lines.forEach((line: string) => {
          if (yPos > 270) {
            pdf.addPage();
            yPos = 20;
          }
          pdf.text(line, margin + 5, yPos);
          yPos += 6;
        });
      });
      yPos += 5;
    }

    // Prognosis and Spread Risk
    if (detectionResult.prognosis || detectionResult.spreadRisk) {
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Additional Information:", margin, yPos);
      yPos += 8;
      
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      
      if (detectionResult.prognosis) {
        const lines = pdf.splitTextToSize(`Prognosis: ${detectionResult.prognosis}`, pageWidth - margin * 2);
        lines.forEach((line: string) => {
          if (yPos > 270) {
            pdf.addPage();
            yPos = 20;
          }
          pdf.text(line, margin, yPos);
          yPos += 6;
        });
        yPos += 3;
      }
      
      if (detectionResult.spreadRisk) {
        const lines = pdf.splitTextToSize(`Spread Risk: ${detectionResult.spreadRisk}`, pageWidth - margin * 2);
        lines.forEach((line: string) => {
          if (yPos > 270) {
            pdf.addPage();
            yPos = 20;
          }
          pdf.text(line, margin, yPos);
          yPos += 6;
        });
      }
    }

    // Footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "italic");
      pdf.text(
        `Page ${i} of ${pageCount} | PestEdge-FSL Detection System`,
        pageWidth / 2,
        pdf.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    // Save PDF
    const fileName = `Detection_Report_${detectionResult.pestName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-4">
            Pest Detection
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload or capture an image to identify pests with AI-powered precision.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Upload Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all hover-elevate ${
                    isDragActive ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  data-testid="dropzone-upload"
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-4">
                    {selectedImage ? (
                      <div className="w-full max-w-sm">
                        <img
                          src={selectedImage}
                          alt="Selected pest"
                          className="w-full h-64 object-cover rounded-2xl"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <Upload className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-lg mb-1">
                            {isDragActive ? "Drop image here" : "Drag & drop image here"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            or click to browse files
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-full"
                      onClick={handleOpenCamera}
                      data-testid="button-camera"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Take Photo
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-full"
                      onClick={handleClearImage}
                      disabled={!selectedImage}
                      data-testid="button-clear"
                    >
                      Clear
                    </Button>
                  </div>
                  
                  <Button
                    onClick={handleDetect}
                    disabled={!selectedImage || detectMutation.isPending}
                    size="lg"
                    className="w-full rounded-full"
                    data-testid="button-detect"
                  >
                    {detectMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Scan className="mr-2 h-5 w-5" />
                        Detect Pest
                      </>
                    )}
                  </Button>
                </div>

                {detectMutation.isPending && (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Analyzing image with AI...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Camera Modal */}
          <Dialog open={isCameraOpen} onOpenChange={(open) => !open && handleCloseCamera()}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>Capture Photo</DialogTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCloseCamera}
                    className="rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>
              
              <div className="space-y-4">
                {cameraError ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                      <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Camera Access Error</h3>
                    <p className="text-sm text-muted-foreground max-w-md mb-4">
                      {cameraError}
                    </p>
                    <Button onClick={handleOpenCamera} variant="outline">
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {!cameraStream && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-center gap-3">
                      <Button
                        onClick={handleCapturePhoto}
                        disabled={!cameraStream}
                        size="lg"
                        className="rounded-full px-8"
                      >
                        <Camera className="mr-2 h-5 w-5" />
                        Capture Photo
                      </Button>
                      <Button
                        onClick={handleCloseCamera}
                        variant="outline"
                        size="lg"
                        className="rounded-full"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Hidden canvas for image capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <AnimatePresence mode="wait">
              {detectionResult ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Detection Results</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={downloadPDF}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download PDF
                          </Button>
                          <CheckCircle2 className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Main Disease Info */}
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-2xl mb-2" data-testid="text-pest-name">
                              {detectionResult.pestName}
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge variant={getRiskColor(detectionResult.riskLevel)} data-testid="badge-risk-level">
                                {detectionResult.riskLevel} Risk
                              </Badge>
                              {detectionResult.plant && (
                                <Badge variant="outline">
                                  <Leaf className="h-3 w-3 mr-1" />
                                  {detectionResult.plant}
                                </Badge>
                              )}
                              {detectionResult.pathogenType && (
                                <Badge variant="outline">
                                  <Bug className="h-3 w-3 mr-1" />
                                  {detectionResult.pathogenType}
                                </Badge>
                              )}
                            </div>
                            {detectionResult.pathogenName && (
                              <p className="text-sm text-muted-foreground italic">
                                <strong>Pathogen:</strong> {detectionResult.pathogenName}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Confidence</span>
                            <span className="font-mono font-semibold" data-testid="text-confidence">
                              {detectionResult.confidence != null ? (detectionResult.confidence * 100).toFixed(1) : "N/A"}%
                            </span>
                          </div>
                          <Progress value={detectionResult.confidence != null ? detectionResult.confidence * 100 : 0} className="h-2" />
                        </div>

                        {/* Prognosis & Spread Risk Alerts */}
                        {(detectionResult.prognosis || detectionResult.spreadRisk) && (
                          <div className="space-y-2">
                            {detectionResult.prognosis && (
                              <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>Prognosis</AlertTitle>
                                <AlertDescription>{detectionResult.prognosis}</AlertDescription>
                              </Alert>
                            )}
                            {detectionResult.spreadRisk && detectionResult.spreadRisk.toLowerCase().includes('extreme') && (
                              <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>High Spread Risk</AlertTitle>
                                <AlertDescription>{detectionResult.spreadRisk}</AlertDescription>
                              </Alert>
                            )}
                            {detectionResult.spreadRisk && !detectionResult.spreadRisk.toLowerCase().includes('extreme') && (
                              <Alert>
                                <Droplets className="h-4 w-4" />
                                <AlertTitle>Spread Risk</AlertTitle>
                                <AlertDescription>{detectionResult.spreadRisk}</AlertDescription>
                              </Alert>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Detailed Information Tabs */}
                      <Tabs defaultValue="symptoms" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
                          <TabsTrigger value="treatment">Treatment</TabsTrigger>
                          <TabsTrigger value="prevention">Prevention</TabsTrigger>
                        </TabsList>

                        {/* Symptoms Tab */}
                        <TabsContent value="symptoms" className="space-y-3 mt-4">
                          {detectionResult.symptoms && detectionResult.symptoms.length > 0 ? (
                            <div className="space-y-2">
                              <h4 className="font-semibold flex items-center gap-2">
                                <Scan className="h-4 w-4" />
                                Visible Symptoms
                              </h4>
                              <ul className="space-y-2 pl-5">
                                {detectionResult.symptoms.map((symptom, idx) => (
                                  <li key={idx} className="text-sm list-disc">{symptom}</li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No symptoms listed</p>
                          )}
                        </TabsContent>

                        {/* Treatment Tab */}
                        <TabsContent value="treatment" className="space-y-4 mt-4">
                          {detectionResult.treatmentDetails ? (
                            <Accordion type="single" collapsible className="w-full">
                              {detectionResult.treatmentDetails.immediate_actions && detectionResult.treatmentDetails.immediate_actions.length > 0 && (
                                <AccordionItem value="immediate">
                                  <AccordionTrigger className="text-left">
                                    <div className="flex items-center gap-2">
                                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                                      <span>Immediate Actions (Do Now!)</span>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <ul className="space-y-2 pl-5">
                                      {detectionResult.treatmentDetails.immediate_actions.map((action, idx) => (
                                        <li key={idx} className="text-sm list-disc">{action}</li>
                                      ))}
                                    </ul>
                                  </AccordionContent>
                                </AccordionItem>
                              )}

                              {detectionResult.treatmentDetails.organic_control && detectionResult.treatmentDetails.organic_control.length > 0 && (
                                <AccordionItem value="organic">
                                  <AccordionTrigger className="text-left">
                                    <div className="flex items-center gap-2">
                                      <Sprout className="h-4 w-4 text-green-500" />
                                      <span>Organic Control Methods</span>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <ul className="space-y-2 pl-5">
                                      {detectionResult.treatmentDetails.organic_control.map((method, idx) => (
                                        <li key={idx} className="text-sm list-disc">{method}</li>
                                      ))}
                                    </ul>
                                  </AccordionContent>
                                </AccordionItem>
                              )}

                              {detectionResult.treatmentDetails.chemical_control && detectionResult.treatmentDetails.chemical_control.length > 0 && (
                                <AccordionItem value="chemical">
                                  <AccordionTrigger className="text-left">
                                    <div className="flex items-center gap-2">
                                      <Beaker className="h-4 w-4 text-blue-500" />
                                      <span>Chemical Control Methods</span>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <Alert className="mb-3">
                                      <Info className="h-4 w-4" />
                                      <AlertDescription className="text-xs">
                                        Always follow label instructions. Wear protective equipment.
                                      </AlertDescription>
                                    </Alert>
                                    <ul className="space-y-2 pl-5">
                                      {detectionResult.treatmentDetails.chemical_control.map((method, idx) => (
                                        <li key={idx} className="text-sm list-disc">{method}</li>
                                      ))}
                                    </ul>
                                  </AccordionContent>
                                </AccordionItem>
                              )}

                              {detectionResult.treatmentDetails.cultural_practices && detectionResult.treatmentDetails.cultural_practices.length > 0 && (
                                <AccordionItem value="cultural">
                                  <AccordionTrigger className="text-left">
                                    <div className="flex items-center gap-2">
                                      <Shield className="h-4 w-4 text-purple-500" />
                                      <span>Cultural Practices</span>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <ul className="space-y-2 pl-5">
                                      {detectionResult.treatmentDetails.cultural_practices.map((practice, idx) => (
                                        <li key={idx} className="text-sm list-disc">{practice}</li>
                                      ))}
                                    </ul>
                                  </AccordionContent>
                                </AccordionItem>
                              )}

                              {detectionResult.treatmentDetails.maintenance && detectionResult.treatmentDetails.maintenance.length > 0 && (
                                <AccordionItem value="maintenance">
                                  <AccordionTrigger className="text-left">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-teal-500" />
                                      <span>Ongoing Maintenance</span>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <ul className="space-y-2 pl-5">
                                      {detectionResult.treatmentDetails.maintenance.map((task, idx) => (
                                        <li key={idx} className="text-sm list-disc">{task}</li>
                                      ))}
                                    </ul>
                                  </AccordionContent>
                                </AccordionItem>
                              )}
                            </Accordion>
                          ) : (
                            <p className="text-sm text-muted-foreground">No treatment information available</p>
                          )}
                        </TabsContent>

                        {/* Prevention Tab */}
                        <TabsContent value="prevention" className="space-y-3 mt-4">
                          {detectionResult.prevention && detectionResult.prevention.length > 0 ? (
                            <div className="space-y-2">
                              <h4 className="font-semibold flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Prevention Strategies
                              </h4>
                              <ul className="space-y-2 pl-5">
                                {detectionResult.prevention.map((tip, idx) => (
                                  <li key={idx} className="text-sm list-disc">{tip}</li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No prevention tips available</p>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="h-full">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
                        <AlertCircle className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-xl mb-2">No Detection Yet</h3>
                      <p className="text-muted-foreground max-w-sm">
                        Upload an image to get started with AI-powered pest identification.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
