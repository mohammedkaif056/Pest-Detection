import { motion } from "framer-motion";
import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
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

export default function SpeciesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: species = [], isLoading } = useQuery<Species[]>({
    queryKey: ["/api/species"],
  });

  const filteredSpecies = species.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.scientificName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(species.map((s) => s.category)));

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
                placeholder="Search by name or scientific name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
                data-testid="input-search-species"
              />
            </div>
            <Button variant="outline" className="rounded-xl" data-testid="button-filter">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>

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
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {s.category}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {filteredSpecies.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No species found matching your criteria.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
