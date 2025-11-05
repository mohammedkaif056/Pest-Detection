import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, Loader2, CheckCircle2, AlertCircle, TrendingUp, Bug } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { apiRequest } from "@/lib/queryClient";
import type { Detection } from "@shared/schema";

export default function Detect() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<Detection | null>(null);

  const detectMutation = useMutation({
    mutationFn: async (file: File) => {
      const reader = new FileReader();
      return new Promise<Detection>((resolve, reject) => {
        reader.onload = async () => {
          const base64 = reader.result as string;
          try {
            const response = await apiRequest("POST", "/api/detect", {
              image: base64,
            });
            resolve(response as Detection);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
    onSuccess: (data) => {
      setDetectionResult(data);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setDetectionResult(null);
      };
      reader.readAsDataURL(file);
      detectMutation.mutate(file);
    }
  }, [detectMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: false,
  });

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "primary";
      default:
        return "secondary";
    }
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

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full"
                    data-testid="button-camera"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Take Photo
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full"
                    onClick={() => {
                      setSelectedImage(null);
                      setDetectionResult(null);
                    }}
                    data-testid="button-clear"
                  >
                    Clear
                  </Button>
                </div>

                {detectMutation.isPending && (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Analyzing image...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

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
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-2xl mb-1" data-testid="text-pest-name">
                              {detectionResult.pestName}
                            </h3>
                            <Badge variant={getRiskColor(detectionResult.riskLevel)} data-testid="badge-risk-level">
                              {detectionResult.riskLevel} Risk
                            </Badge>
                          </div>
                          <Bug className="h-8 w-8 text-muted-foreground" />
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Confidence</span>
                            <span className="font-mono font-semibold" data-testid="text-confidence">
                              {(detectionResult.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={detectionResult.confidence * 100} className="h-2" />
                        </div>
                      </div>

                      {detectionResult.similarSpecies && detectionResult.similarSpecies.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Similar Species
                          </h4>
                          <div className="space-y-2">
                            {detectionResult.similarSpecies.map((species, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 rounded-lg bg-card border hover-elevate"
                                data-testid={`similar-species-${idx}`}
                              >
                                <span className="text-sm">{species.name}</span>
                                <span className="text-sm font-mono text-muted-foreground">
                                  {(species.confidence * 100).toFixed(1)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {detectionResult.treatments && detectionResult.treatments.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3">Treatment Recommendations</h4>
                          <div className="space-y-3">
                            {detectionResult.treatments.map((treatment, idx) => (
                              <Card key={idx} className="hover-elevate" data-testid={`treatment-${idx}`}>
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <h5 className="font-medium">{treatment.name}</h5>
                                    <Badge variant="outline">{treatment.type}</Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>Effectiveness: {treatment.effectiveness}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
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
