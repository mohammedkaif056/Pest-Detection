import {
  type Detection,
  type InsertDetection,
  type Species,
  type InsertSpecies,
  type Prototype,
  type InsertPrototype,
  type Treatment,
  type InsertTreatment,
  type User,
  type InsertUser,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Detection operations
  getDetection(id: string): Promise<Detection | undefined>;
  getAllDetections(): Promise<Detection[]>;
  createDetection(detection: InsertDetection): Promise<Detection>;

  // Species operations
  getSpecies(id: string): Promise<Species | undefined>;
  getAllSpecies(): Promise<Species[]>;
  getSpeciesByName(name: string): Promise<Species | undefined>;
  searchSpecies(query: string): Promise<Species[]>;
  createSpecies(species: InsertSpecies): Promise<Species>;

  // Prototype operations
  getPrototype(id: string): Promise<Prototype | undefined>;
  getAllPrototypes(): Promise<Prototype[]>;
  getPrototypeByPestName(pestName: string): Promise<Prototype | undefined>;
  createPrototype(prototype: InsertPrototype): Promise<Prototype>;

  // Treatment operations
  getTreatment(id: string): Promise<Treatment | undefined>;
  getTreatmentsByPestId(pestId: string): Promise<Treatment[]>;
  createTreatment(treatment: InsertTreatment): Promise<Treatment>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private detections: Map<string, Detection>;
  private species: Map<string, Species>;
  private prototypes: Map<string, Prototype>;
  private treatments: Map<string, Treatment>;

  constructor() {
    this.users = new Map();
    this.detections = new Map();
    this.species = new Map();
    this.prototypes = new Map();
    this.treatments = new Map();
    this.seedData();
  }

  private seedData() {
    // Seed some initial species data
    const sampleSpecies: Species[] = [
      {
        id: randomUUID(),
        name: "Aphids (Green Peach Aphid)",
        scientificName: "Myzus persicae",
        category: "insect",
        description: "Small, soft-bodied insects that feed on plant sap. They reproduce rapidly and can transmit plant viruses.",
        riskLevel: "high",
        commonCrops: ["peach", "potato", "tobacco", "pepper"],
        imageUrl: null,
        taxonomy: {
          kingdom: "Animalia",
          phylum: "Arthropoda",
          class: "Insecta",
          order: "Hemiptera",
          family: "Aphididae",
        },
      },
      {
        id: randomUUID(),
        name: "Colorado Potato Beetle",
        scientificName: "Leptinotarsa decemlineata",
        category: "beetle",
        description: "Striped beetle that feeds on potato plants and related crops. Both adults and larvae cause significant damage.",
        riskLevel: "critical",
        commonCrops: ["potato", "tomato", "eggplant"],
        imageUrl: null,
        taxonomy: {
          kingdom: "Animalia",
          phylum: "Arthropoda",
          class: "Insecta",
          order: "Coleoptera",
          family: "Chrysomelidae",
        },
      },
      {
        id: randomUUID(),
        name: "Whitefly",
        scientificName: "Bemisia tabaci",
        category: "insect",
        description: "Tiny white flying insects that suck plant sap and excrete honeydew, leading to sooty mold growth.",
        riskLevel: "high",
        commonCrops: ["tomato", "cotton", "cucumber", "beans"],
        imageUrl: null,
        taxonomy: {
          kingdom: "Animalia",
          phylum: "Arthropoda",
          class: "Insecta",
          order: "Hemiptera",
          family: "Aleyrodidae",
        },
      },
      {
        id: randomUUID(),
        name: "Spider Mites",
        scientificName: "Tetranychus urticae",
        category: "mite",
        description: "Microscopic arachnids that pierce plant cells and suck contents, causing stippling and webbing.",
        riskLevel: "medium",
        commonCrops: ["corn", "soybeans", "cotton", "strawberry"],
        imageUrl: null,
        taxonomy: {
          kingdom: "Animalia",
          phylum: "Arthropoda",
          class: "Arachnida",
          order: "Trombidiformes",
          family: "Tetranychidae",
        },
      },
      {
        id: randomUUID(),
        name: "Armyworm",
        scientificName: "Spodoptera frugiperda",
        category: "larvae",
        description: "Caterpillar pest that feeds on grasses and can migrate in large groups, devastating crops.",
        riskLevel: "critical",
        commonCrops: ["corn", "rice", "sorghum", "wheat"],
        imageUrl: null,
        taxonomy: {
          kingdom: "Animalia",
          phylum: "Arthropoda",
          class: "Insecta",
          order: "Lepidoptera",
          family: "Noctuidae",
        },
      },
      {
        id: randomUUID(),
        name: "Grasshopper",
        scientificName: "Melanoplus differentialis",
        category: "insect",
        description: "Large jumping insects that feed on leaves, stems, and developing seeds. Can cause severe defoliation.",
        riskLevel: "medium",
        commonCrops: ["corn", "alfalfa", "wheat", "cotton"],
        imageUrl: null,
        taxonomy: {
          kingdom: "Animalia",
          phylum: "Arthropoda",
          class: "Insecta",
          order: "Orthoptera",
          family: "Acrididae",
        },
      },
      {
        id: randomUUID(),
        name: "Leaf Miner",
        scientificName: "Liriomyza spp.",
        category: "larvae",
        description: "Larvae that tunnel between upper and lower leaf surfaces, creating distinctive serpentine mines.",
        riskLevel: "low",
        commonCrops: ["spinach", "lettuce", "tomato", "bean"],
        imageUrl: null,
        taxonomy: {
          kingdom: "Animalia",
          phylum: "Arthropoda",
          class: "Insecta",
          order: "Diptera",
          family: "Agromyzidae",
        },
      },
      {
        id: randomUUID(),
        name: "Thrips",
        scientificName: "Frankliniella occidentalis",
        category: "insect",
        description: "Tiny slender insects that rasp plant tissue and suck cell contents, transmitting viruses.",
        riskLevel: "high",
        commonCrops: ["onion", "pepper", "cucumber", "tomato"],
        imageUrl: null,
        taxonomy: {
          kingdom: "Animalia",
          phylum: "Arthropoda",
          class: "Insecta",
          order: "Thysanoptera",
          family: "Thripidae",
        },
      },
      {
        id: randomUUID(),
        name: "Cutworm",
        scientificName: "Agrotis ipsilon",
        category: "larvae",
        description: "Nocturnal caterpillars that cut seedlings at soil level, causing significant crop establishment losses.",
        riskLevel: "medium",
        commonCrops: ["corn", "soybean", "cotton", "vegetables"],
        imageUrl: null,
        taxonomy: {
          kingdom: "Animalia",
          phylum: "Arthropoda",
          class: "Insecta",
          order: "Lepidoptera",
          family: "Noctuidae",
        },
      },
    ];

    sampleSpecies.forEach((s) => this.species.set(s.id, s));
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Detection operations
  async getDetection(id: string): Promise<Detection | undefined> {
    return this.detections.get(id);
  }

  async getAllDetections(): Promise<Detection[]> {
    return Array.from(this.detections.values()).sort(
      (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
    );
  }

  async createDetection(insertDetection: InsertDetection): Promise<Detection> {
    const id = randomUUID();
    const detection: Detection = {
      ...insertDetection,
      id,
      detectedAt: new Date(),
    };
    this.detections.set(id, detection);
    return detection;
  }

  // Species operations
  async getSpecies(id: string): Promise<Species | undefined> {
    return this.species.get(id);
  }

  async getAllSpecies(): Promise<Species[]> {
    return Array.from(this.species.values());
  }

  async getSpeciesByName(name: string): Promise<Species | undefined> {
    return Array.from(this.species.values()).find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );
  }

  async searchSpecies(query: string): Promise<Species[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.species.values()).filter(
      (s) =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.scientificName.toLowerCase().includes(lowerQuery) ||
        s.category.toLowerCase().includes(lowerQuery) ||
        s.commonCrops?.some((crop) => crop.toLowerCase().includes(lowerQuery))
    );
  }

  async createSpecies(insertSpecies: InsertSpecies): Promise<Species> {
    const id = randomUUID();
    const species: Species = { ...insertSpecies, id };
    this.species.set(id, species);
    return species;
  }

  // Prototype operations
  async getPrototype(id: string): Promise<Prototype | undefined> {
    return this.prototypes.get(id);
  }

  async getAllPrototypes(): Promise<Prototype[]> {
    return Array.from(this.prototypes.values());
  }

  async getPrototypeByPestName(pestName: string): Promise<Prototype | undefined> {
    return Array.from(this.prototypes.values()).find(
      (p) => p.pestName.toLowerCase() === pestName.toLowerCase()
    );
  }

  async createPrototype(insertPrototype: InsertPrototype): Promise<Prototype> {
    const id = randomUUID();
    const prototype: Prototype = {
      ...insertPrototype,
      id,
      learnedAt: new Date(),
    };
    this.prototypes.set(id, prototype);
    return prototype;
  }

  // Treatment operations
  async getTreatment(id: string): Promise<Treatment | undefined> {
    return this.treatments.get(id);
  }

  async getTreatmentsByPestId(pestId: string): Promise<Treatment[]> {
    return Array.from(this.treatments.values()).filter((t) => t.pestId === pestId);
  }

  async createTreatment(insertTreatment: InsertTreatment): Promise<Treatment> {
    const id = randomUUID();
    const treatment: Treatment = { ...insertTreatment, id };
    this.treatments.set(id, treatment);
    return treatment;
  }
}

export const storage = new MemStorage();
