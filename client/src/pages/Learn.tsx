import { useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, Plus, X, CheckCircle2, Brain, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertPrototypeSchema } from "@shared/schema";

// Form schema extending the shared insertPrototypeSchema
// Pick only the user-editable fields and add client-side validation
const learnFormSchema = insertPrototypeSchema
  .pick({
    pestName: true,
    supportImages: true,
  })
  .extend({
    pestName: z.string().min(1, "Pest name is required").max(100, "Pest name is too long"),
    supportImages: z.array(z.string()).min(5, "At least 5 images required").max(10, "Maximum 10 images allowed"),
  });

type LearnFormValues = z.infer<typeof learnFormSchema>;

export default function Learn() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LearnFormValues>({
    resolver: zodResolver(learnFormSchema),
    defaultValues: {
      pestName: "",
      supportImages: [],
    },
  });

  const learnMutation = useMutation({
    mutationFn: async (data: LearnFormValues) => {
      // Map supportImages to images for API endpoint
      return await apiRequest("POST", "/api/learn", {
        pestName: data.pestName,
        images: data.supportImages,
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Success!",
        description: `Successfully learned new pest species: ${variables.pestName}`,
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/prototypes"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to learn new species. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const currentImages = form.getValues("supportImages");
    
    if (currentImages.length + acceptedFiles.length > 10) {
      toast({
        title: "Too many images",
        description: "Maximum 10 images allowed",
        variant: "destructive",
      });
      return;
    }

    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newImages = [...form.getValues("supportImages"), reader.result as string];
        form.setValue("supportImages", newImages, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    });
  }, [form, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: true,
  });

  const removeImage = (index: number) => {
    const currentImages = form.getValues("supportImages");
    form.setValue(
      "supportImages",
      currentImages.filter((_, i) => i !== index),
      { shouldValidate: true }
    );
  };

  const onSubmit = (data: LearnFormValues) => {
    learnMutation.mutate(data);
  };

  const images = form.watch("supportImages");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-4">
            Visual Prompt Learning
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Teach the AI to recognize new pest species with just 5-10 sample images using few-shot learning.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Add New Pest Species</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="pestName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pest Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Colorado Potato Beetle"
                            {...field}
                            className="rounded-xl"
                            data-testid="input-pest-name"
                          />
                        </FormControl>
                        <FormMessage data-testid="error-pest-name" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="supportImages"
                    render={() => (
                      <FormItem>
                        <FormLabel>Sample Images ({images.length}/10)</FormLabel>
                        <FormControl>
                          <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all hover-elevate ${
                              isDragActive ? "border-primary bg-primary/5" : "border-border"
                            }`}
                            data-testid="dropzone-learn"
                          >
                            <input {...getInputProps()} data-testid="input-file-learn" />
                            <div className="flex flex-col items-center gap-3">
                              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Upload className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium mb-1">
                                  {isDragActive ? "Drop images here" : "Upload sample images"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Minimum 5 images, maximum 10 images
                                </p>
                              </div>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage data-testid="error-images" />
                      </FormItem>
                    )}
                  />

                  {images.length > 0 && (
                    <div>
                      <FormLabel className="mb-3 block">Uploaded Images</FormLabel>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {images.map((image, index) => (
                          <div key={index} className="relative group" data-testid={`preview-image-${index}`}>
                            <img
                              src={image}
                              alt={`Sample ${index + 1}`}
                              className="w-full aspect-square object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              data-testid={`button-remove-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <div className="absolute bottom-2 left-2">
                              <Badge variant="secondary" className="text-xs">
                                {index + 1}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {images.length < 10 && (
                          <div
                            {...getRootProps()}
                            className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover-elevate transition-all"
                            data-testid="button-add-more"
                          >
                            <Plus className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground" data-testid="text-status">
                      {images.length >= 5 ? (
                        <span className="flex items-center gap-2 text-primary">
                          <CheckCircle2 className="h-4 w-4" />
                          Ready to learn
                        </span>
                      ) : (
                        <span>Upload at least {5 - images.length} more image(s)</span>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={learnMutation.isPending}
                      className="rounded-full"
                      data-testid="button-learn"
                    >
                      {learnMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Learning...
                        </>
                      ) : (
                        "Learn Species"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12"
        >
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Collect Sample Images</h4>
                  <p className="text-sm text-muted-foreground">
                    Gather 5-10 clear photos of the pest from different angles and lighting conditions.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">AI Embedding Generation</h4>
                  <p className="text-sm text-muted-foreground">
                    The system extracts visual features using a pre-trained neural network backbone.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Prototype Creation</h4>
                  <p className="text-sm text-muted-foreground">
                    A class prototype is computed by averaging the embeddings of all sample images.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                  4
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Instant Recognition</h4>
                  <p className="text-sm text-muted-foreground">
                    The new species is immediately available for detection without retraining the model.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
