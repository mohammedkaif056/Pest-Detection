import { motion } from "framer-motion";
import { useState } from "react";
import { Search, Filter, Sparkles } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { apiRequest } from "@/lib/queryClient";
import type { Species } from "@shared/schema";

import aphidImage from "@assets/generated_images/Green_aphid_pest_closeup_bb59d407.png";
import beetleImage from "@assets/generated_images/Brown_beetle_pest_specimen_e3493384.png";
import caterpillarImage from "@assets/generated_images/Striped_caterpillar_pest_c3e4d3ea.png";
import whiteflyImage from "@assets/generated_images/Whitefly_pest_specimen_f9f577d9.png";
import spiderMiteImage from "@assets/generated_images/Spider_mite_pest_closeup_aac6a335.png";
import grasshopperImage from "@assets/generated_images/Grasshopper_pest_specimen_02e1b724.png";
import leafMinerImage from "@assets/generated_images/Leaf_miner_pest_damage_bc8d2e8c.png";
import thripsImage from "@assets/generated_images/Thrips_pest_microscopic_view_1aa55a68.png";
import cutwormImage from "@assets/generated_images/Cutworm_pest_specimen_6c0f4cea.png";

const sampleImages = [
  aphidImage, beetleImage, caterpillarImage, whiteflyImage,
  spiderMiteImage, grasshopperImage, leafMinerImage, thripsImage, cutwormImage
];

// Additional sample species data to display
const additionalSpecies = [
  {
    id: "sample-1",
    name: "Tomato Hornworm",
    scientificName: "Manduca quinquemaculata",
    category: "larvae",
    description: "Large green caterpillar that feeds on tomato, pepper, and eggplant foliage. Can quickly defoliate plants.",
    riskLevel: "high",
    commonCrops: ["Tomato", "Pepper", "Eggplant"],
    imageUrl: caterpillarImage
  },
  {
    id: "sample-2",
    name: "Colorado Potato Beetle",
    scientificName: "Leptinotarsa decemlineata",
    category: "insect",
    description: "Yellow-orange beetle with black stripes. Major pest of potatoes, can cause complete defoliation.",
    riskLevel: "critical",
    commonCrops: ["Potato", "Tomato", "Eggplant"],
    imageUrl: beetleImage
  },
  {
    id: "sample-3",
    name: "Aphids",
    scientificName: "Aphidoidea",
    category: "insect",
    description: "Small soft-bodied insects that suck plant sap. Transmit viruses and cause leaf distortion.",
    riskLevel: "high",
    commonCrops: ["Various vegetables", "Fruits", "Ornamentals"],
    imageUrl: aphidImage
  },
  {
    id: "sample-4",
    name: "Whiteflies",
    scientificName: "Aleyrodidae",
    category: "insect",
    description: "Tiny white flying insects that feed on plant sap. Cause yellowing and honeydew secretion.",
    riskLevel: "high",
    commonCrops: ["Tomato", "Pepper", "Cucumber"],
    imageUrl: whiteflyImage
  },
  {
    id: "sample-5",
    name: "Spider Mites",
    scientificName: "Tetranychidae",
    category: "mite",
    description: "Microscopic arachnids causing stippling and webbing on leaves. Thrive in hot, dry conditions.",
    riskLevel: "medium",
    commonCrops: ["Tomato", "Pepper", "Beans"],
    imageUrl: spiderMiteImage
  },
  {
    id: "sample-6",
    name: "Thrips",
    scientificName: "Thysanoptera",
    category: "insect",
    description: "Tiny slender insects causing silvery scarring on leaves and fruit. Virus vectors.",
    riskLevel: "medium",
    commonCrops: ["Tomato", "Pepper", "Onion"],
    imageUrl: thripsImage
  },
  {
    id: "sample-7",
    name: "Cutworms",
    scientificName: "Agrotis spp.",
    category: "larvae",
    description: "Nocturnal caterpillars that cut seedlings at soil level. Major pest of young transplants.",
    riskLevel: "high",
    commonCrops: ["All vegetables", "Transplants"],
    imageUrl: cutwormImage
  },
  {
    id: "sample-8",
    name: "Leaf Miners",
    scientificName: "Liriomyza spp.",
    category: "larvae",
    description: "Larvae tunnel between leaf surfaces creating winding trails. Reduces photosynthesis.",
    riskLevel: "medium",
    commonCrops: ["Tomato", "Pepper", "Leafy greens"],
    imageUrl: leafMinerImage
  },
  {
    id: "sample-9",
    name: "Grasshoppers",
    scientificName: "Acrididae",
    category: "insect",
    description: "Large chewing insects that can cause extensive defoliation during outbreak years.",
    riskLevel: "medium",
    commonCrops: ["All crops", "Grains", "Vegetables"],
    imageUrl: grasshopperImage
  },
];

export default function SpeciesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchSource, setSearchSource] = useState<"database" | "ai" | null>(null);

  // Fetch species from database
  const { data: dbSpecies = [], isLoading: isLoadingDb } = useQuery<Species[]>({
    queryKey: ["/api/species"],
  });

  // AI search mutation
  const aiSearchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/species/search", { query });
      const data = await response.json();
      return data as { source: "database" | "ai"; results: Species[] };
    },
  });

  // Combine database species with additional sample species
  const allSpecies = [...dbSpecies, ...additionalSpecies];

  // Handle search
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const result = await aiSearchMutation.mutateAsync(searchQuery);
      setSearchSource(result.source);
    } else {
      setSearchSource(null);
      aiSearchMutation.reset();
    }
  };

  // Determine which species to display
  let displaySpecies: Species[];
  
  if (aiSearchMutation.data?.results && aiSearchMutation.data.results.length > 0) {
    // Use AI search results directly (already filtered by search query)
    displaySpecies = aiSearchMutation.data.results;
  } else if (searchQuery && aiSearchMutation.isSuccess && aiSearchMutation.data?.results.length === 0) {
    // AI search returned no results
    displaySpecies = [];
  } else {
    // Use all species (database + samples) and filter locally
    displaySpecies = allSpecies.filter((s) => {
      const matchesSearch = searchQuery === "" || 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.scientificName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }

  // Apply category filter
  const filteredSpecies = displaySpecies.filter((s) => {
    const matchesCategory = !selectedCategory || s.category === selectedCategory;
    return matchesCategory;
  });

  const categories = Array.from(new Set(allSpecies.map((s) => s.category)));

  const isLoading = isLoadingDb || aiSearchMutation.isPending;

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
            Pest Species Database
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our comprehensive database of agricultural pests with taxonomy-aware classifications.
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name or scientific name... (AI-powered)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 rounded-xl"
                data-testid="input-search-species"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={!searchQuery.trim() || isLoading}
              className="rounded-xl"
              data-testid="button-ai-search"
            >
              {isLoading ? (
                <>Searching...</>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Search
                </>
              )}
            </Button>
          </div>

          {searchSource && (
            <div className="flex items-center gap-2">
              <Badge variant={searchSource === "ai" ? "default" : "secondary"}>
                {searchSource === "ai" ? (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Results
                  </>
                ) : (
                  "Database Results"
                )}
              </Badge>
              {searchSource === "ai" && (
                <p className="text-sm text-muted-foreground">
                  Generated using AI knowledge - not found in database
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="rounded-full"
              data-testid="filter-all"
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="rounded-full capitalize"
                data-testid={`filter-${category}`}
              >
                {category}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Species Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg" />
                <CardContent className="p-6 space-y-3">
                  <div className="h-6 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSpecies.map((s, index) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card className="group overflow-hidden hover-elevate transition-all duration-300" data-testid={`species-card-${index}`}>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={s.imageUrl || sampleImages[index % sampleImages.length]}
                      alt={s.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge variant={s.riskLevel === "high" || s.riskLevel === "critical" ? "destructive" : "secondary"}>
                        {s.riskLevel}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-3">
                    <div>
                      <h3 className="font-semibold text-xl mb-1">{s.name}</h3>
                      <p className="text-sm text-muted-foreground italic">{s.scientificName}</p>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {s.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {s.category}
                      </Badge>
                      {s.taxonomy?.family && (
                        <Badge variant="outline" className="text-xs">
                          {s.taxonomy.family}
                        </Badge>
                      )}
                    </div>
                    {s.commonCrops && s.commonCrops.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Affects:</p>
                        <div className="flex flex-wrap gap-1">
                          {s.commonCrops.slice(0, 3).map((crop, i) => (
                            <span key={i} className="text-xs bg-muted px-2 py-1 rounded">
                              {crop}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {filteredSpecies.length === 0 && !isLoading && (
          <div className="text-center py-20">
            {searchQuery ? (
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  No species found for "{searchQuery}".
                </p>
                {!aiSearchMutation.data && (
                  <Button onClick={handleSearch} variant="outline">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Search with AI
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No species found matching your criteria.</p>
            )}
          </div>
        )}

        {aiSearchMutation.isError && (
          <div className="text-center py-12">
            <p className="text-destructive">
              AI search failed. Please try again or check your connection.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
