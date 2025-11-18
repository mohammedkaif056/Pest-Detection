"""
Comprehensive Plant Disease Database
=====================================
Detailed information about plant diseases, pathogens, and treatments.
"""

DISEASE_DATABASE = {
    "Pepper__bell___Bacterial_spot": {
        "common_name": "Bacterial Spot on Bell Pepper",
        "plant": "Bell Pepper",
        "pathogen_type": "Bacteria",
        "pathogen_name": "Xanthomonas campestris pv. vesicatoria",
        "severity": "High",
        "symptoms": [
            "Small, dark brown to black spots on leaves (1-3mm diameter)",
            "Water-soaked lesions that become necrotic",
            "Yellow halos around spots on older lesions",
            "Fruit spots are raised, brown, and scab-like",
            "Premature leaf drop in severe cases"
        ],
        "favorable_conditions": [
            "Warm temperatures (75-86°F / 24-30°C)",
            "High humidity and leaf wetness",
            "Overhead irrigation or rain splash",
            "Wounds from insects or mechanical damage"
        ],
        "treatment": {
            "immediate_actions": [
                "Remove and destroy infected plant material",
                "Avoid working with plants when wet",
                "Increase air circulation around plants"
            ],
            "chemical_control": [
                "Copper-based bactericides (Copper hydroxide, Copper sulfate)",
                "Apply every 7-10 days during wet weather",
                "Alternate with Mancozeb fungicide to prevent resistance",
                "Products: Kocide 3000, Badge X2, Champion WP"
            ],
            "organic_control": [
                "Neem oil spray (0.5-1% concentration)",
                "Bacillus subtilis biological control",
                "Copper soap (Bonide Copper Fungicide)",
                "Hydrogen peroxide solution (3% diluted 1:10)"
            ],
            "cultural_practices": [
                "Use drip irrigation instead of overhead watering",
                "Space plants properly for air circulation",
                "Mulch to prevent soil splash",
                "Rotate crops - avoid peppers for 2-3 years"
            ]
        },
        "prevention": [
            "Plant resistant varieties (e.g., 'Charleston Belle', 'Aristotle')",
            "Use certified disease-free seeds",
            "Sanitize tools between plants",
            "Avoid nitrogen over-fertilization",
            "Remove plant debris after harvest"
        ],
        "prognosis": "Moderate - Can be managed with consistent treatment. Early detection is crucial.",
        "spread_risk": "High - Spreads rapidly through water splash and contaminated tools"
    },
    
    "Pepper__bell___healthy": {
        "common_name": "Healthy Bell Pepper",
        "plant": "Bell Pepper",
        "pathogen_type": None,
        "pathogen_name": None,
        "severity": "None",
        "symptoms": [
            "Vibrant green, uniform leaves",
            "No spots, lesions, or discoloration",
            "Strong, upright growth",
            "Healthy fruit development"
        ],
        "treatment": {
            "immediate_actions": [
                "Continue regular monitoring",
                "Maintain current care routine"
            ],
            "maintenance": [
                "Water consistently - 1-2 inches per week",
                "Fertilize every 2-3 weeks with balanced fertilizer (5-5-5 or 10-10-10)",
                "Mulch to maintain soil moisture",
                "Monitor for early signs of pests or disease"
            ]
        },
        "prevention": [
            "Continue good cultural practices",
            "Inspect plants weekly",
            "Maintain proper spacing",
            "Practice crop rotation"
        ],
        "prognosis": "Excellent - Plant is healthy and thriving"
    },
    
    "Potato___Early_blight": {
        "common_name": "Early Blight on Potato",
        "plant": "Potato",
        "pathogen_type": "Fungus",
        "pathogen_name": "Alternaria solani",
        "severity": "Medium to High",
        "symptoms": [
            "Dark brown to black circular lesions with concentric rings (target pattern)",
            "Lesions start on lower, older leaves",
            "Yellow halo around lesions",
            "Progressive upward spread to younger leaves",
            "Stem lesions are dark and slightly sunken",
            "Tuber lesions are dark, sunken, and corky"
        ],
        "favorable_conditions": [
            "Warm temperatures (75-85°F / 24-29°C)",
            "High humidity (90%+)",
            "Alternating wet and dry periods",
            "Stressed or weakened plants"
        ],
        "treatment": {
            "immediate_actions": [
                "Remove severely infected leaves",
                "Improve air circulation",
                "Reduce leaf wetness duration"
            ],
            "chemical_control": [
                "Chlorothalonil (Daconil, Bravo) - Apply every 7-14 days",
                "Mancozeb - Preventive fungicide",
                "Azoxystrobin (Quadris) - Systemic protection",
                "Copper fungicides - Organic option",
                "Start spraying when plants are 6 inches tall"
            ],
            "organic_control": [
                "Copper-based fungicides (Bonide Copper Fungicide)",
                "Bacillus subtilis (Serenade)",
                "Neem oil (spray weekly)",
                "Baking soda spray (1 tbsp per gallon water + 1 tsp dish soap)",
                "Compost tea foliar spray"
            ],
            "cultural_practices": [
                "Water at soil level, avoid wetting foliage",
                "Mulch heavily to prevent soil splash",
                "Stake or cage plants for better air flow",
                "Remove lower leaves touching soil"
            ]
        },
        "prevention": [
            "Plant resistant varieties (e.g., 'Jacqueline Lee', 'Elba')",
            "3-4 year crop rotation",
            "Destroy infected plant debris",
            "Avoid overhead irrigation",
            "Maintain plant vigor with proper fertilization",
            "Use certified disease-free seed potatoes"
        ],
        "prognosis": "Good with treatment - Can reduce yield by 30-50% if untreated",
        "spread_risk": "Moderate - Spreads through spores via wind and water splash"
    },
    
    "Potato___healthy": {
        "common_name": "Healthy Potato",
        "plant": "Potato",
        "pathogen_type": None,
        "pathogen_name": None,
        "severity": "None",
        "symptoms": [
            "Dark green, healthy foliage",
            "No lesions or discoloration",
            "Vigorous growth",
            "Proper tuber development"
        ],
        "treatment": {
            "immediate_actions": [
                "Maintain current care practices",
                "Continue regular monitoring"
            ],
            "maintenance": [
                "Water deeply 1-2 times per week (1-2 inches)",
                "Hill soil around stems as plants grow",
                "Fertilize at planting and when plants are 6 inches tall",
                "Use balanced fertilizer (10-10-10)"
            ]
        },
        "prevention": [
            "Continue crop rotation",
            "Monitor for Colorado potato beetles",
            "Inspect for disease signs weekly",
            "Maintain soil health"
        ],
        "prognosis": "Excellent - Continue good practices for healthy harvest"
    },
    
    "Potato___Late_blight": {
        "common_name": "Late Blight on Potato",
        "plant": "Potato",
        "pathogen_type": "Oomycete (Water Mold)",
        "pathogen_name": "Phytophthora infestans",
        "severity": "Critical - HIGHLY DESTRUCTIVE",
        "symptoms": [
            "Water-soaked, gray-green lesions on leaves",
            "White, fuzzy fungal growth on leaf undersides (humid conditions)",
            "Rapid progression - entire plant can die in days",
            "Dark brown to black lesions on stems",
            "Foul-smelling tuber rot",
            "Purple-brown discoloration in tuber flesh"
        ],
        "favorable_conditions": [
            "Cool, wet weather (60-70°F / 15-21°C)",
            "High humidity (>90%)",
            "Extended leaf wetness (12+ hours)",
            "Cloudy, rainy periods"
        ],
        "treatment": {
            "immediate_actions": [
                "URGENT: Remove and destroy all infected plants immediately",
                "Do NOT compost infected material - burn or bag and dispose",
                "Alert nearby potato growers",
                "Apply fungicides to uninfected plants immediately"
            ],
            "chemical_control": [
                "Chlorothalonil + Mancozeb (combination) - Apply immediately",
                "Cymoxanil (Curzate) - Systemic, stops existing infections",
                "Metalaxyl (Ridomil) - Preventive and curative",
                "Fluazinam (Omega) - Highly effective",
                "Apply every 5-7 days during outbreak",
                "DO NOT DELAY - this disease is extremely aggressive"
            ],
            "organic_control": [
                "Copper fungicides (highest concentration allowed)",
                "Apply every 5 days in wet weather",
                "Limited effectiveness - chemical control recommended",
                "Immediate removal is more important than spraying"
            ],
            "cultural_practices": [
                "Destroy infected plants immediately",
                "Increase air circulation drastically",
                "Stop overhead irrigation completely",
                "Hill soil over tubers to prevent infection"
            ]
        },
        "prevention": [
            "Plant resistant varieties (e.g., 'Defender', 'Sarpo Mira')",
            "Use certified disease-free seed potatoes",
            "Wide plant spacing (3 feet apart)",
            "Monitor daily during cool, wet weather",
            "Destroy volunteer potatoes",
            "Prophylactic fungicide sprays in high-risk periods",
            "Remove and destroy all plant debris after harvest"
        ],
        "prognosis": "POOR if untreated - Can destroy entire crop in 7-14 days. CRITICAL - requires immediate aggressive action",
        "spread_risk": "EXTREME - Spreads rapidly through airborne spores over long distances. Can affect entire region."
    },
    
    "Tomato__Target_Spot": {
        "common_name": "Target Spot on Tomato",
        "plant": "Tomato",
        "pathogen_type": "Fungus",
        "pathogen_name": "Corynespora cassiicola",
        "severity": "Medium to High",
        "symptoms": [
            "Small brown spots with concentric rings (target-like)",
            "Spots enlarge to 10mm with gray-white centers",
            "Yellow halos around lesions",
            "Affects leaves, stems, and fruit",
            "Rapid defoliation in severe cases",
            "Fruit spots are sunken with dark centers"
        ],
        "favorable_conditions": [
            "Warm, humid conditions (70-85°F / 21-29°C)",
            "High humidity (>80%)",
            "Dense plant canopies",
            "Poor air circulation"
        ],
        "treatment": {
            "immediate_actions": [
                "Prune infected lower leaves",
                "Improve air circulation",
                "Reduce watering frequency"
            ],
            "chemical_control": [
                "Chlorothalonil (Bravo, Daconil)",
                "Mancozeb fungicide",
                "Azoxystrobin (Quadris)",
                "Rotate fungicides to prevent resistance",
                "Apply every 7-10 days"
            ],
            "organic_control": [
                "Copper fungicides",
                "Bacillus subtilis sprays",
                "Neem oil (weekly applications)",
                "Sulfur-based fungicides"
            ],
            "cultural_practices": [
                "Stake and prune plants for airflow",
                "Remove lower leaves up to first fruit cluster",
                "Mulch to prevent soil splash",
                "Water at base only"
            ]
        },
        "prevention": [
            "Plant resistant varieties",
            "Proper spacing (24-36 inches)",
            "Crop rotation (3 years minimum)",
            "Remove plant debris",
            "Avoid overhead irrigation",
            "Regular pruning and training"
        ],
        "prognosis": "Good with management - Can cause 30-40% yield loss if untreated",
        "spread_risk": "Moderate to High - Spreads through spores and water splash"
    },
    
    "Tomato__Tomato_mosaic_virus": {
        "common_name": "Tomato Mosaic Virus",
        "plant": "Tomato",
        "pathogen_type": "Virus",
        "pathogen_name": "Tomato mosaic virus (ToMV)",
        "severity": "High",
        "symptoms": [
            "Mottled light and dark green pattern on leaves (mosaic pattern)",
            "Leaf distortion and curling",
            "Stunted plant growth",
            "Reduced fruit size and number",
            "Yellow streaking on fruit",
            "Internal browning of fruit (brown wall)"
        ],
        "favorable_conditions": [
            "Mechanical transmission through handling",
            "Contaminated tools and equipment",
            "Infected seeds or transplants",
            "Can survive in soil debris for years"
        ],
        "treatment": {
            "immediate_actions": [
                "REMOVE AND DESTROY infected plants immediately",
                "Do NOT compost - bag and dispose",
                "Sanitize all tools with 10% bleach solution",
                "Wash hands thoroughly before handling healthy plants"
            ],
            "chemical_control": [
                "NO CURE AVAILABLE - virus cannot be treated with fungicides or pesticides",
                "Focus on prevention and removal"
            ],
            "organic_control": [
                "Neem oil may help reduce symptom severity but won't cure",
                "Milk spray (1:9 ratio milk:water) may slow spread",
                "Remove infected plants is the only effective control"
            ],
            "cultural_practices": [
                "Strict sanitation protocols",
                "Disinfect tools between plants",
                "Control aphids and other sap-sucking insects",
                "Remove infected plants immediately"
            ]
        },
        "prevention": [
            "Use certified virus-free seeds and transplants",
            "Plant resistant varieties (look for TMV or ToMV resistance)",
            "Sanitize hands and tools frequently",
            "Avoid smoking near plants (tobacco can carry virus)",
            "Remove weeds that may harbor virus",
            "Use new or sterilized stakes and cages",
            "Don't save seeds from infected plants"
        ],
        "prognosis": "POOR - No cure available. Infected plants should be removed. Can reduce yield by 20-30%",
        "spread_risk": "High - Extremely contagious through mechanical contact, very stable virus"
    },
    
    "Tomato__Tomato_YellowLeaf__Curl_Virus": {
        "common_name": "Tomato Yellow Leaf Curl Virus",
        "plant": "Tomato",
        "pathogen_type": "Virus",
        "pathogen_name": "Tomato yellow leaf curl virus (TYLCV)",
        "severity": "Critical",
        "symptoms": [
            "Severe upward curling of leaf margins",
            "Yellowing of leaf edges",
            "Severe stunting of plants",
            "Interveinal chlorosis (yellowing between veins)",
            "Reduced fruit set or no fruit",
            "Small, distorted leaves"
        ],
        "favorable_conditions": [
            "Transmitted by whiteflies (Bemisia tabaci)",
            "Warm temperatures (75-85°F / 24-29°C)",
            "High whitefly populations",
            "Infected weeds nearby"
        ],
        "treatment": {
            "immediate_actions": [
                "Control whiteflies immediately with insecticides",
                "Remove heavily infected plants",
                "Install yellow sticky traps",
                "Screen greenhouse vents with fine mesh"
            ],
            "chemical_control": [
                "NO CURE for virus - focus on whitefly control",
                "Imidacloprid (systemic insecticide for whiteflies)",
                "Spiromesifen (Oberon) for whitefly nymphs",
                "Pymetrozine (Fulfill) for whitefly adults",
                "Insecticidal soap for organic control",
                "Rotate insecticide modes of action"
            ],
            "organic_control": [
                "Neem oil spray (targets whiteflies)",
                "Insecticidal soap",
                "Horticultural oil",
                "Yellow sticky traps",
                "Reflective mulches (aluminum or silver)",
                "Encourage beneficial insects (lady beetles, lacewings)"
            ],
            "cultural_practices": [
                "Remove and destroy infected plants",
                "Control weeds that harbor whiteflies",
                "Use reflective mulches to repel whiteflies",
                "Install fine mesh screens in greenhouses",
                "Remove lower leaves to reduce whitefly habitat"
            ]
        },
        "prevention": [
            "Plant resistant varieties (e.g., 'TYLCV-resistant' hybrids)",
            "Start with virus-free transplants",
            "Use row covers or mesh to exclude whiteflies",
            "Apply systemic insecticides at transplanting",
            "Monitor whitefly populations weekly",
            "Remove infected plants immediately",
            "Practice good weed control",
            "Avoid planting near infected areas"
        ],
        "prognosis": "VERY POOR if infected early - Can cause 100% crop loss. Good if prevented",
        "spread_risk": "EXTREME - Whiteflies spread virus rapidly, can devastate entire fields"
    },
    
    "Tomato_Bacterial_spot": {
        "common_name": "Bacterial Spot on Tomato",
        "plant": "Tomato",
        "pathogen_type": "Bacteria",
        "pathogen_name": "Xanthomonas spp. (X. euvesicatoria, X. vesicatoria, X. perforans, X. gardneri)",
        "severity": "High",
        "symptoms": [
            "Small, dark brown to black spots on leaves (2-3mm)",
            "Water-soaked lesions that turn necrotic",
            "Yellow halos around older spots",
            "Spots on fruit are raised, dark brown, scab-like",
            "Premature leaf drop",
            "Reduced fruit quality and yield"
        ],
        "favorable_conditions": [
            "Warm, humid weather (75-86°F / 24-30°C)",
            "Overhead irrigation or rain",
            "Wounds from storms, insects, or equipment",
            "High humidity and leaf wetness"
        ],
        "treatment": {
            "immediate_actions": [
                "Remove severely diseased leaves",
                "Avoid handling wet plants",
                "Switch to drip irrigation",
                "Increase plant spacing for air flow"
            ],
            "chemical_control": [
                "Copper-based bactericides (Copper hydroxide, Kocide 3000)",
                "Apply every 7-10 days, especially before rain",
                "Tank-mix with Mancozeb for better control",
                "Acibenzolar-S-methyl (Actigard) activates plant defenses",
                "Streptomycin (limited use, resistance concerns)"
            ],
            "organic_control": [
                "Copper fungicides (organic formulations)",
                "Bacillus subtilis sprays",
                "Hydrogen peroxide solutions",
                "Neem oil (0.5-1%)",
                "Copper soap sprays"
            ],
            "cultural_practices": [
                "Use drip irrigation only",
                "Mulch to prevent soil splash",
                "Stake and prune for air circulation",
                "Sanitize tools with bleach solution",
                "Remove and destroy infected plant debris"
            ]
        },
        "prevention": [
            "Use resistant varieties (look for bacterial spot resistance)",
            "Plant certified disease-free seeds or transplants",
            "Crop rotation (3-4 years)",
            "Avoid working with wet plants",
            "Preventive copper sprays before disease appears",
            "Remove volunteer tomatoes",
            "Control weeds that may harbor bacteria"
        ],
        "prognosis": "Moderate - Difficult to control but manageable with consistent efforts. Can reduce yield 30-50%",
        "spread_risk": "High - Spreads rapidly through water, contaminated tools, and workers"
    },
    
    "Tomato_Early_blight": {
        "common_name": "Early Blight on Tomato",
        "plant": "Tomato",
        "pathogen_type": "Fungus",
        "pathogen_name": "Alternaria solani",
        "severity": "Medium to High",
        "symptoms": [
            "Dark brown spots with concentric rings (bull's-eye pattern)",
            "Lesions start on lower, older leaves",
            "Yellow halo around lesions",
            "Stem lesions are dark and girdling",
            "Fruit lesions at stem end with concentric rings",
            "Progressive defoliation from bottom up"
        ],
        "favorable_conditions": [
            "Warm temperatures (75-85°F / 24-29°C)",
            "High humidity",
            "Wet-dry cycles",
            "Stressed plants (drought, nutrient deficiency)"
        ],
        "treatment": {
            "immediate_actions": [
                "Remove infected lower leaves",
                "Improve air circulation",
                "Mulch heavily to prevent soil splash"
            ],
            "chemical_control": [
                "Chlorothalonil (Daconil, Bravo) - Apply every 7-14 days",
                "Mancozeb - Broad spectrum protection",
                "Azoxystrobin (Quadris) - Systemic",
                "Boscalid (Endura) - Effective against Alternaria",
                "Start preventive sprays early in season"
            ],
            "organic_control": [
                "Copper fungicides (Bonide, Monterey)",
                "Bacillus subtilis (Serenade)",
                "Neem oil sprays",
                "Baking soda spray (1 tbsp/gallon + soap)",
                "Compost tea foliar applications"
            ],
            "cultural_practices": [
                "Prune lower leaves (6-12 inches from soil)",
                "Stake or cage plants for airflow",
                "Mulch with organic material",
                "Water at base only",
                "Maintain plant health with proper fertilization"
            ]
        },
        "prevention": [
            "Plant resistant varieties (e.g., 'Mountain Magic', 'Legend')",
            "3-year crop rotation",
            "Destroy plant debris after harvest",
            "Use drip irrigation",
            "Preventive fungicide program",
            "Avoid overhead watering",
            "Maintain plant vigor"
        ],
        "prognosis": "Good with treatment - Can reduce yield 25-50% if untreated",
        "spread_risk": "Moderate - Spreads through spores via wind and water"
    },
    
    "Tomato_healthy": {
        "common_name": "Healthy Tomato",
        "plant": "Tomato",
        "pathogen_type": None,
        "pathogen_name": None,
        "severity": "None",
        "symptoms": [
            "Deep green, uniform foliage",
            "No spots, lesions, or discoloration",
            "Vigorous growth",
            "Abundant fruit set",
            "Normal leaf shape and size"
        ],
        "treatment": {
            "immediate_actions": [
                "Continue monitoring weekly",
                "Maintain good cultural practices"
            ],
            "maintenance": [
                "Water consistently (1-2 inches per week)",
                "Fertilize every 2-3 weeks with tomato fertilizer",
                "Prune suckers for indeterminate varieties",
                "Provide adequate support (cages or stakes)",
                "Mulch to conserve moisture"
            ]
        },
        "prevention": [
            "Continue current care routine",
            "Monitor for early signs of problems",
            "Maintain proper spacing",
            "Practice crop rotation annually"
        ],
        "prognosis": "Excellent - Plant is thriving"
    },
    
    "Tomato_Late_blight": {
        "common_name": "Late Blight on Tomato",
        "plant": "Tomato",
        "pathogen_type": "Oomycete (Water Mold)",
        "pathogen_name": "Phytophthora infestans",
        "severity": "Critical - HIGHLY DESTRUCTIVE",
        "symptoms": [
            "Irregular, water-soaked, gray-green lesions on leaves",
            "White, fuzzy growth on leaf undersides (in humid conditions)",
            "Rapid spread - entire plant can collapse in days",
            "Brown-black lesions on stems and petioles",
            "Firm, greasy-looking brown spots on fruit",
            "Foul smell from infected tissues"
        ],
        "favorable_conditions": [
            "Cool, wet weather (60-70°F / 15-21°C)",
            "High humidity (>90%)",
            "Extended leaf wetness (12+ hours)",
            "Rain or heavy dew"
        ],
        "treatment": {
            "immediate_actions": [
                "URGENT: Remove and destroy infected plants IMMEDIATELY",
                "Do NOT compost - burn or double-bag and dispose",
                "Alert neighboring gardeners and authorities",
                "Apply fungicides to healthy plants immediately",
                "Harvest any green fruit and ripen indoors"
            ],
            "chemical_control": [
                "Chlorothalonil (Daconil) - Protective, apply immediately",
                "Cymoxanil (Curzate) - Stops active infections",
                "Metalaxyl (Ridomil) - Preventive and curative",
                "Mancozeb - Broad protection",
                "Apply every 5-7 days during outbreak",
                "DO NOT WAIT - this disease is extremely aggressive"
            ],
            "organic_control": [
                "Copper fungicides at maximum allowed rates",
                "Apply every 5 days in wet weather",
                "Limited effectiveness - removal is critical",
                "Focus on immediate plant removal"
            ],
            "cultural_practices": [
                "Remove infected plants immediately (including roots)",
                "Stop all overhead watering",
                "Increase air circulation",
                "Remove weeds and plant debris",
                "Do not touch healthy plants after infected ones"
            ]
        },
        "prevention": [
            "Plant resistant varieties (e.g., 'Mountain Magic', 'Defiant')",
            "Purchase from reputable sources only",
            "Monitor daily during cool, wet periods",
            "Prophylactic fungicide sprays in high-risk weather",
            "Wide plant spacing (36+ inches)",
            "Remove volunteer tomatoes and potatoes",
            "Destroy all plant debris after season",
            "Avoid planting near potatoes"
        ],
        "prognosis": "VERY POOR if untreated - Can destroy entire crop in 7-10 days. CRITICAL - requires immediate aggressive action",
        "spread_risk": "EXTREME - Airborne spores spread rapidly over miles. Can affect entire communities."
    },
    
    "Tomato_Leaf_Mold": {
        "common_name": "Leaf Mold on Tomato",
        "plant": "Tomato",
        "pathogen_type": "Fungus",
        "pathogen_name": "Passalora fulva (formerly Cladosporium fulvum)",
        "severity": "Medium",
        "symptoms": [
            "Yellow spots on upper leaf surface",
            "Olive-green to brown fuzzy growth on leaf undersides",
            "Older leaves affected first",
            "Leaf curling and wilting",
            "Premature leaf drop",
            "Reduced photosynthesis and yield"
        ],
        "favorable_conditions": [
            "High humidity (>85%)",
            "Poor air circulation",
            "Temperatures 70-80°F (21-27°C)",
            "Greenhouse or tunnel production",
            "Dense canopies"
        ],
        "treatment": {
            "immediate_actions": [
                "Remove infected leaves immediately",
                "Increase ventilation dramatically",
                "Reduce humidity levels",
                "Improve air circulation"
            ],
            "chemical_control": [
                "Chlorothalonil (Daconil)",
                "Mancozeb",
                "Copper fungicides",
                "Myclobutanil (Rally)",
                "Apply every 7-14 days"
            ],
            "organic_control": [
                "Copper fungicides",
                "Sulfur fungicides",
                "Bacillus subtilis",
                "Neem oil",
                "Baking soda spray"
            ],
            "cultural_practices": [
                "Prune heavily for air circulation",
                "Space plants widely",
                "Use fans in greenhouses",
                "Reduce humidity (ventilation, heating)",
                "Water early in day only",
                "Remove lower leaves"
            ]
        },
        "prevention": [
            "Plant resistant varieties (many modern hybrids have resistance)",
            "Ensure excellent air circulation",
            "Avoid overhead watering completely",
            "Greenhouse: use fans and vents",
            "Prune for open canopy",
            "Monitor humidity levels",
            "Sanitize greenhouse structures"
        ],
        "prognosis": "Good - Very manageable with environmental control. Rarely severe outdoors",
        "spread_risk": "Low to Moderate - Mostly greenhouse/tunnel issue. Spreads via spores in humid conditions"
    },
    
    "Tomato_Septoria_leaf_spot": {
        "common_name": "Septoria Leaf Spot",
        "plant": "Tomato",
        "pathogen_type": "Fungus",
        "pathogen_name": "Septoria lycopersici",
        "severity": "Medium to High",
        "symptoms": [
            "Small, circular spots with gray-white centers (1-3mm)",
            "Dark brown margins around spots",
            "Tiny black dots in center (fungal fruiting bodies)",
            "Starts on lower leaves",
            "Rapid defoliation from bottom up",
            "Yellow halos may appear",
            "Rarely affects fruit"
        ],
        "favorable_conditions": [
            "Moderate temperatures (68-77°F / 20-25°C)",
            "High humidity and rain",
            "Extended wet periods",
            "Dense plant growth"
        ],
        "treatment": {
            "immediate_actions": [
                "Remove infected lower leaves",
                "Improve air circulation",
                "Apply fungicide immediately"
            ],
            "chemical_control": [
                "Chlorothalonil (Daconil, Bravo) - Very effective",
                "Mancozeb - Good preventive",
                "Copper fungicides",
                "Azoxystrobin (Quadris)",
                "Apply every 7-10 days during wet weather"
            ],
            "organic_control": [
                "Copper fungicides (effective)",
                "Bacillus subtilis",
                "Neem oil",
                "Baking soda + oil spray",
                "Compost tea"
            ],
            "cultural_practices": [
                "Prune lower 12 inches of foliage",
                "Stake and cage for air flow",
                "Mulch heavily (4-6 inches)",
                "Water at base only",
                "Remove debris regularly"
            ]
        },
        "prevention": [
            "Crop rotation (3 years minimum)",
            "Remove all plant debris after harvest",
            "Start preventive fungicide sprays early",
            "Avoid overhead irrigation",
            "Proper plant spacing (24-36 inches)",
            "Use disease-free transplants",
            "Mulch to prevent soil splash"
        ],
        "prognosis": "Good with management - Can cause significant defoliation but rarely kills plants",
        "spread_risk": "Moderate - Spreads through rain splash and contaminated equipment"
    },
    
    "Tomato_Spider_mites_Two_spotted_spider_mite": {
        "common_name": "Two-Spotted Spider Mite on Tomato",
        "plant": "Tomato",
        "pathogen_type": "Pest (Arachnid)",
        "pathogen_name": "Tetranychus urticae",
        "severity": "Medium to High",
        "symptoms": [
            "Fine stippling or speckling on leaves (yellow/white dots)",
            "Fine webbing on leaf undersides and between stems",
            "Leaves turn yellow, then brown, then drop",
            "Bronzing of foliage",
            "Stunted plant growth",
            "Tiny spider-like creatures visible with magnification"
        ],
        "favorable_conditions": [
            "Hot, dry weather (80-90°F / 27-32°C)",
            "Low humidity",
            "Dusty conditions",
            "Drought-stressed plants",
            "High nitrogen fertilization"
        ],
        "treatment": {
            "immediate_actions": [
                "Spray plants with strong water jet (underside of leaves)",
                "Remove heavily infested leaves",
                "Increase humidity around plants",
                "Apply miticide or insecticidal soap"
            ],
            "chemical_control": [
                "Abamectin (Agri-Mek) - Miticide",
                "Bifenazate (Floramite) - Specific for mites",
                "Spiromesifen (Oberon) - Targets eggs and immatures",
                "Horticultural oil - Smothers mites",
                "Rotate products - mites develop resistance quickly",
                "Spray every 3-5 days for 2-3 weeks"
            ],
            "organic_control": [
                "Insecticidal soap (very effective)",
                "Neem oil (weekly applications)",
                "Horticultural oil",
                "Pyrethrin sprays",
                "Predatory mites (Phytoseiulus persimilis) - biological control",
                "Strong water spray daily"
            ],
            "cultural_practices": [
                "Increase watering frequency",
                "Mist plants to raise humidity",
                "Remove dusty conditions",
                "Avoid over-fertilizing with nitrogen",
                "Remove weeds that harbor mites"
            ]
        },
        "prevention": [
            "Monitor plants weekly with hand lens",
            "Maintain adequate soil moisture",
            "Avoid water stress",
            "Reduce dust around plants",
            "Use reflective mulches",
            "Release predatory mites preventively",
            "Avoid broad-spectrum insecticides (kill beneficial predators)",
            "Keep plants healthy and vigorous"
        ],
        "prognosis": "Good if caught early - Can cause severe damage if left unchecked",
        "spread_risk": "High - Mites spread easily by wind, animals, and contaminated tools. Reproduce rapidly in hot weather"
    }
}


def get_disease_info(disease_class: str) -> dict:
    """
    Get detailed disease information from the database.
    
    Args:
        disease_class: Disease class name from model prediction
        
    Returns:
        Dictionary with detailed disease information
    """
    # Clean up the disease class name
    disease_key = disease_class.replace(" ", "_").replace("-", "_")
    
    # Try direct match first
    if disease_key in DISEASE_DATABASE:
        return DISEASE_DATABASE[disease_key]
    
    # Try variations
    for key in DISEASE_DATABASE.keys():
        if key.lower() == disease_key.lower():
            return DISEASE_DATABASE[key]
        if disease_key.lower() in key.lower() or key.lower() in disease_key.lower():
            return DISEASE_DATABASE[key]
    
    # Return generic response if not found
    return {
        "common_name": disease_class,
        "plant": "Unknown",
        "pathogen_type": "Unknown",
        "pathogen_name": "Unknown",
        "severity": "Unknown",
        "symptoms": ["Information not available for this disease"],
        "treatment": {
            "immediate_actions": ["Consult local agricultural extension service"],
            "chemical_control": ["Seek professional advice"],
            "organic_control": ["Seek professional advice"],
            "cultural_practices": ["Monitor plant closely"]
        },
        "prevention": ["Use disease-resistant varieties", "Practice good sanitation"],
        "prognosis": "Unknown - consult expert",
        "spread_risk": "Unknown"
    }
