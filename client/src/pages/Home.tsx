import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Zap, Shield, Brain, Smartphone, Leaf, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BounceCards from "@/components/BounceCards";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

import aphidImage from "@assets/generated_images/Green_aphid_pest_closeup_bb59d407.png";
import beetleImage from "@assets/generated_images/Brown_beetle_pest_specimen_e3493384.png";
import caterpillarImage from "@assets/generated_images/Striped_caterpillar_pest_c3e4d3ea.png";
import whiteflyImage from "@assets/generated_images/Whitefly_pest_specimen_f9f577d9.png";
import spiderMiteImage from "@assets/generated_images/Spider_mite_pest_closeup_aac6a335.png";
import farmlandImage from "@assets/generated_images/Agricultural_farmland_aerial_view_3a926076.png";

const transformStyles = [
  "rotate(5deg) translate(-150px)",
  "rotate(0deg) translate(-70px)",
  "rotate(-5deg)",
  "rotate(5deg) translate(70px)",
  "rotate(-5deg) translate(150px)"
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 dark:opacity-10"
          style={{
            backgroundImage: `url(${farmlandImage})`,
            filter: "blur(8px)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/50 to-background" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h1 className="font-display font-bold text-5xl md:text-6xl lg:text-7xl leading-tight">
                AI-Powered <span className="text-primary">Pest Detection</span> for Agriculture
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Identify crop pests instantly with 98.5% accuracy using hybrid few-shot learning. Works offline. Learn new species with just 5-10 images.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/detect">
                <Button size="lg" className="rounded-full text-base px-8" data-testid="button-hero-start">
                  <span>Start Detecting</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/species">
                <Button variant="outline" size="lg" className="rounded-full text-base px-8" data-testid="button-hero-learn">
                  Explore Species
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="font-mono font-semibold text-2xl">98.5%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="font-mono font-semibold text-2xl">&lt;500ms</div>
                <div className="text-sm text-muted-foreground">Detection</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="font-mono font-semibold text-2xl">100%</div>
                <div className="text-sm text-muted-foreground">Offline</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center"
          >
            <BounceCards
              images={[aphidImage, beetleImage, caterpillarImage, whiteflyImage, spiderMiteImage]}
              containerWidth={500}
              containerHeight={300}
              animationDelay={0.5}
              animationStagger={0.1}
              transformStyles={transformStyles}
              enableHover={true}
            />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display font-bold text-4xl md:text-5xl mb-4">
              Revolutionary Technology
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built on cutting-edge few-shot learning research, optimized for real-world agricultural use.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Detect pests in under 500ms with our optimized MobileNetV3 student model.",
              },
              {
                icon: Brain,
                title: "Few-Shot Learning",
                description: "Train the AI on new pest species with just 5-10 sample images instantly.",
              },
              {
                icon: Shield,
                title: "Privacy First",
                description: "All data stays on your device. No cloud dependency, no data collection.",
              },
              {
                icon: Smartphone,
                title: "Works Anywhere",
                description: "Fully offline operation. Perfect for rural areas with limited connectivity.",
              },
              {
                icon: Leaf,
                title: "Eco-Friendly",
                description: "Get targeted treatment recommendations to minimize chemical usage.",
              },
              {
                icon: Database,
                title: "10,000+ Species",
                description: "Access comprehensive pest database with taxonomy-aware embeddings.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover-elevate transition-all duration-300">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display font-bold text-4xl md:text-5xl mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps from detection to actionable insights.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: "01",
                title: "Upload or Capture",
                description: "Take a photo of the pest or upload an existing image from your device.",
              },
              {
                step: "02",
                title: "AI Analysis",
                description: "Our neural network analyzes the image using prototype-based classification.",
              },
              {
                step: "03",
                title: "Get Results",
                description: "Receive instant identification with confidence scores and treatment recommendations.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-px border-t-2 border-dashed border-border -z-10" />
                )}
                <div className="text-center space-y-4">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary font-display font-bold text-3xl">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-xl">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="font-display font-bold text-4xl md:text-5xl">
              Ready to Revolutionize Your Pest Management?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of farmers already using PestEdge-FSL to protect their crops with AI-powered precision.
            </p>
            <Link href="/detect">
              <Button size="lg" className="rounded-full text-base px-8" data-testid="button-cta-start">
                <span>Start Free Detection</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
