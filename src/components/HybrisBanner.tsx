import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import banner from "@/assets/hybris-banner.png.asset.json";

const HybrisBanner = () => {
  return (
    <section className="px-4 md:px-6 py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/livres/hybris"
          className="group block relative overflow-hidden rounded-lg shadow-2xl border border-bordeaux/20"
        >
          {/* Background image */}
          <div className="absolute inset-0">
            <img
              src={banner.url}
              alt=""
              className="w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-105"
            />
            {/* Dark overlay for text legibility on the left */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20 md:from-black/90 md:via-black/50 md:to-transparent" />
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

              <p className="font-display italic text-lg md:text-xl text-white/90 leading-relaxed mb-6">
                10&nbsp;000 heures d'écriture. 10 ans d'une vie. 10 manuscrits brûlés.
                <br />
                <span className="text-white/70 text-base">
                  Un seul livre, taillé dans le silence des voyages et l'épreuve des rencontres.
                </span>
              </p>

              <ul className="font-body text-sm text-white/75 space-y-1.5 mb-8">
                <li>— Une décennie d'écriture obsessionnelle</li>
                <li>— Des centaines de voyages, des milliers de visages</li>
                <li>— Dix versions antérieures, jetées au feu</li>
              </ul>

              <div>
                <span className="inline-flex items-center gap-3 font-body text-xs md:text-sm tracking-[0.25em] uppercase px-7 py-3.5 bg-[#c9a84c] text-black hover:bg-[#f0d78c] transition-colors">
                  Découvrir Hybris
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </motion.div>

            {/* Right column kept empty so the hexagon background shines through */}
            <div className="hidden md:block" />
          </div>
        </Link>
      </div>
    </section>
  );
};

export default HybrisBanner;
