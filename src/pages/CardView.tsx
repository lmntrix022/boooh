import React, { useState } from "react";
import { ArrowLeft, Sparkles, QrCode, Download, Eye, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import BusinessCard from "@/components/BusinessCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FooterDark from "@/components/FooterDark";

const CardView: React.FC = () => {
  const [activeTab, setActiveTab] = useState("card1");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Sample business card data
  const cardData1 = {
    name: "Ava MINKO",
    title: "La Vie en Rose",
    company: "Creative Strategist at Bonbon",
    location: "Port-Gentil, Gabon",
    email: "avakim@lushcreative.com",
    phone: "+1 (555) 123-4567",
    backgroundImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1490&auto=format&fit=crop&ixlib=rb-4.0.3",
    backgroundColor: "#E5DEFF",
    backgroundType: "gradient",
    skills: ["Adobe Creative", "Visual design", "3D design", "Aesthetics"],
    socials: {
      instagram: "https://instagram.com/avakim",
      twitter: "https://twitter.com/avakim",
      portfolio: "https://avakim.design",
    },
    avatar: "https://images.unsplash.com/photo-1634155323530-385a795dd103?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.0.3",
    primaryColor: "#8B5CF6",
    textColor: "#333333",
  };

  // Second card example
  const cardData2 = {
    name: "KOUMBA Marcus ",
    title: "Creating Stories to Inspire",
    company: "Creative Director at Final Shot Productions",
    location: "Libreville, Gabon",
    email: "marcus@finalshot.com",
    phone: "+1 (555) 987-6543",
    backgroundImage: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3",
    backgroundColor: "#FDE1D3",
    backgroundType: "image",
    skills: ["Photography", "Videography", "Adobe CC", "Marketing"],
    socials: {
      instagram: "https://instagram.com/marcusrubin",
      portfolio: "https://MarcussPortfolio.com",
    },
    avatar: "https://images.unsplash.com/photo-1681331587508-fcd092906a15?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.0.3",
    primaryColor: "#F97316",
    textColor: "#222222",
    products: [
      {
        id: "1",
        name: "Portrait Session",
        price: "$250",
        image: "https://images.unsplash.com/photo-1581591524425-c7e0978865fc?q=80&w=3270&auto=format&fit=crop",
      },
      {
        id: "2",
        name: "Wedding Package",
        price: "$1,500",
        image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=3270&auto=format&fit=crop",
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white relative overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/30 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src="/booh.svg" alt="Booh Logo" className="h-16 logo-white" />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8 items-center text-white">
            <Link to="/#features" className="hover:text-purple-400 transition-colors">Fonctionnalités</Link>
            <Link to="/#showcase" className="hover:text-purple-400 transition-colors">Découvrir</Link>
            <Link to="/pricing" className="hover:text-purple-400 transition-colors">Tarifs</Link>
            <Link to="/map" className="hover:text-purple-400 transition-colors">Carte</Link>
            <Link to="/blog" className="hover:text-purple-400 transition-colors">Blog</Link>
            <Link to="/contact" className="hover:text-purple-400 transition-colors">Contact</Link>
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all font-semibold"
            >
              Commencer
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-black/95 border-t border-white/5"
            >
              <div className="flex flex-col gap-4 p-6 text-white">
                <Link to="/#features" className="hover:text-purple-400 transition-colors py-2">Fonctionnalités</Link>
                <Link to="/#showcase" className="hover:text-purple-400 transition-colors py-2">Découvrir</Link>
                <Link to="/pricing" className="hover:text-purple-400 transition-colors py-2">Tarifs</Link>
                <Link to="/map" className="hover:text-purple-400 transition-colors py-2">Carte</Link>
                <Link to="/blog" className="hover:text-purple-400 transition-colors py-2">Blog</Link>
                <Link to="/contact" className="hover:text-purple-400 transition-colors py-2">Contact</Link>
                <button
                  onClick={() => navigate('/auth')}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all font-semibold mt-2"
                >
                  Commencer
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-2">
        {/* Orbes décoratifs animés */}
        <span className="absolute -top-32 -left-32 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl animate-pulse -z-10" />
        <span className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl animate-pulse -z-10" />
        <span className="absolute top-1/2 right-1/4 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl animate-pulse -z-10" />
        
        <div className="w-full max-w-4xl mx-auto relative z-10 mt-10">
          {/* Header minimal premium */}
          <div className="flex items-center justify-center mb-8">
            <img src="/booh.svg" alt="Booh Logo" className="h-12 w-12 drop-shadow-xl mr-3 animate-fade-in" />
            <h1 className="text-3xl font-bold text-blue-600 animate-gradient-x">Démo des cartes de visite</h1>
          </div>

          {/* Tabs pour switcher entre les cartes */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-1 shadow-lg">
              <TabsTrigger 
                value="card1" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-400 data-[state=active]:to-indigo-400 data-[state=active]:text-white rounded-xl transition-all duration-300 font-semibold"
              >
                Ava MINKO
              </TabsTrigger>
              <TabsTrigger 
                value="card2" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-red-400 data-[state=active]:text-white rounded-xl transition-all duration-300 font-semibold"
              >
                KOUMBA Marcus
              </TabsTrigger>
            </TabsList>

            <TabsContent value="card1" className="mt-6">
              <Card className="border-0 shadow-2xl overflow-hidden mb-8 bg-white/80 backdrop-blur-xl rounded-3xl animate-fade-in-up">
                <CardContent className="p-0">
                  <div className="p-6 flex flex-col items-center">
                    <BusinessCard {...cardData1} />
                  </div>
                </CardContent>
              </Card>
              {/* Actions glassy premium pour Ava */}
              <div className="flex flex-wrap gap-4 justify-center mb-8 animate-fade-in-up">
                <Button className="bg-gradient-to-r from-blue-400 to-indigo-400 text-white font-bold rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all flex items-center gap-2">
                  <QrCode className="h-5 w-5" /> QR Code
                </Button>
                <Button className="bg-gradient-to-r from-blue-400 to-indigo-400 text-white font-bold rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all flex items-center gap-2">
                  <Download className="h-5 w-5" /> Télécharger
                </Button>
                <Button className="bg-gradient-to-r from-blue-400 to-indigo-400 text-white font-bold rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all flex items-center gap-2">
                  <Eye className="h-5 w-5" /> Voir publique
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="card2" className="mt-6">
              <Card className="border-0 shadow-2xl overflow-hidden mb-8 bg-white/80 backdrop-blur-xl rounded-3xl animate-fade-in-up">
                <CardContent className="p-0">
                  <div className="p-6 flex flex-col items-center">
                    <BusinessCard {...cardData2} />
                  </div>
                </CardContent>
              </Card>
              {/* Actions glassy premium pour Marcus */}
              <div className="flex flex-wrap gap-4 justify-center mb-8 animate-fade-in-up">
                <Button className="bg-gradient-to-r from-orange-400 to-red-400 text-white font-bold rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all flex items-center gap-2">
                  <QrCode className="h-5 w-5" /> QR Code
                </Button>
                <Button className="bg-gradient-to-r from-orange-400 to-red-400 text-white font-bold rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all flex items-center gap-2">
                  <Download className="h-5 w-5" /> Télécharger
                </Button>
                <Button className="bg-gradient-to-r from-orange-400 to-red-400 text-white font-bold rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all flex items-center gap-2">
                  <Eye className="h-5 w-5" /> Voir publique
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Call to action */}
          <div className="text-center animate-fade-in-up">
            <p className="text-black/80 mb-6 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-blue-100">
              Créez votre propre carte de visite numérique personnalisée à l'aide de notre éditeur intuitif. Choisissez parmi différents thèmes, arrière-plans et mises en page.
            </p>
            <div className="flex space-x-3 justify-center">
              <Link to="/create-card">
                <Button className="bg-gradient-to-r from-indigo-600 to-blue-400 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md rounded-xl">
                  Créer une carte
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" className="border-blue-200 shadow-sm hover:bg-blue-50 rounded-xl text-blue-700 font-semibold">
                  Voir le dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <FooterDark />
    </div>
  );
};

export default CardView;
