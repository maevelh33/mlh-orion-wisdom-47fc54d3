import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import banner from "@/assets/hybris-banner.webp";
import bannerTall from "@/assets/hybris-banner-tall.webp";

const HybrisBanner = () => {
  return (
    <section className="px-4 md:px-6 py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto">
        <div
          className="group block relative overflow-hidden rounded-lg shadow-2xl border border-bordeaux/20 bg-black"
        >
          {/* Background image */}
          {/* Téléphone : image en fond ; tablette : dans la moitié droite, à côté du texte ; grand écran : bannière large */}
          <div className="absolute inset-0 md:left-1/2 lg:left-0">
            <picture>
              <source media="(min-width: 1024px)" srcSet={banner} />
              <img
                src={bannerTall}
                alt=""
                className="w-full h-full object-contain object-bottom md:object-cover md:object-center lg:object-[78%_50%] transition-transform duration-[1500ms] group-hover:scale-105"
              />
            </picture>
            {/* Dark overlay for text legibility on the left */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/75 to-black/20 md:bg-gradient-to-r md:from-black/90 md:via-black/50 md:to-transparent" />
          </div>

          {/* Content */}
          <div className="relative z-10 grid md:grid-cols-2 gap-6 p-8 md:p-14 lg:p-20 min-h-[420px] md:min-h-[480px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex flex-col justify-center"
            >
              <p className="font-body text-[10px] md:text-xs tracking-[0.4em] uppercase text-[#e8b84a] mb-4">
                Nouveauté · Roman
              </p>
              <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-light text-[#f0d78c] mb-6 tracking-wider drop-shadow-[0_0_25px_rgba(232,184,74,0.35)]">
                HYBRIS
              </h2>
              <div className="w-16 h-px bg-[#c9a84c] mb-6" />

              <p className="font-display text-sm md:text-base text-[#f5f0e0] leading-relaxed mb-6">
                Le résultat de 10 000 heures d'écritures, 10 ans de vie, et 10 manuscrits brûlés (versions antérieures jetées au feu). Ce livre est l'œuvre vers laquelle j'ai dirigé tous les efforts de ma vie de manière obsessionnelle. Chaque expérience que j'ai faite, rencontres et voyages, était dans le but d'avoir le vécu nécessaire à son écriture.
              </p>

              <ul className="font-display text-xs md:text-sm text-[#f5f0e0]/80 space-y-1.5 mb-8 italic">
                <li>— Découvrez les 7 Familles qui contrôlent ce monde</li>
                <li>— Rencontrez des personnages uniques et extravagants</li>
                <li>— Voyagez dans des lieux fastueux et inaccessibles</li>
              </ul>

              <div className="flex flex-col gap-4">
                <Link
                  to="/livres/hybris"
                  className="inline-flex items-center gap-3 font-body text-xs md:text-sm tracking-[0.25em] uppercase px-7 py-3.5 bg-[#c9a84c] text-black hover:bg-[#f0d78c] transition-colors w-fit"
                >
                  Découvrir Hybris
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/livres/hybris/precommander"
                  className="inline-flex items-center gap-3 font-body text-xs md:text-sm tracking-[0.25em] uppercase px-7 py-3.5 border border-[#c9a84c] text-[#f0d78c] hover:bg-[#c9a84c]/10 transition-colors w-fit"
                >
                  Précommander
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#c9a84c]/15 border border-[#c9a84c]/30 rounded-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e8b84a] animate-pulse" />
                  <p className="font-body text-sm text-[#f0d78c] font-medium tracking-wide">
                    Dédicace personnalisée offerte — limitée aux 100 premiers acheteurs
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right column kept empty so the hexagon background shines through */}
            <div className="hidden md:block" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HybrisBanner;
