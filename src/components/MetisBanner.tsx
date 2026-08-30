import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Layers, Users, Trophy } from "lucide-react";
import preview from "@/assets/metis-preview.png.asset.json";
import { getAssetUrl } from "@/lib/assets";

const METIS_URL = "https://metisapp.fr";

const stats = [
  { value: "70 000+", label: "Livres référencés" },
  { value: "1 000+", label: "Citations sourcées" },
  { value: "50", label: "Courants philosophiques" },
  { value: "0 €", label: "Pour commencer" },
];

const features = [
  { icon: BookOpen, label: "Bibliothèque" },
  { icon: Layers, label: "Cartes mémoire" },
  { icon: Users, label: "Agora" },
  { icon: Trophy, label: "Concours philosophique" },
];

const MetisBanner = () => {
  return (
    <section className="px-4 md:px-6 py-16 md:py-24 bg-[#efeae0]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-lg border border-[#c9a44c]/40 bg-[#f5f0e6] shadow-2xl"
        >
          <div className="grid lg:grid-cols-2">
            {/* Texte */}
            <div className="p-8 md:p-12 lg:p-14 flex flex-col justify-center">
              <p className="font-body text-[10px] md:text-xs tracking-[0.4em] uppercase text-[#a8853a] mb-4">
                Application · Philosophie &amp; Psychologie
              </p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light tracking-wider text-[#2e2a22] mb-3">
                MÈTIS
              </h2>
              <p className="font-display text-sm md:text-base italic text-[#8a7a5c] mb-6">
                Penser avec sagesse. Agir avec ruse.
              </p>
              <div className="w-16 h-px bg-[#c9a44c] mb-6" />

              <p className="font-display text-base md:text-lg text-[#3c362c] leading-relaxed mb-4">
                Mètis est né d'une conviction simple : la sagesse ne devrait pas rester
                enfermée dans les amphithéâtres.
              </p>
              <p className="font-display text-sm md:text-base text-[#4a4438] leading-relaxed mb-8">
                Une plateforme pour apprendre la philosophie et la psychologie de manière
                ludique : bibliothèque, cartes mémoire, arbre interactif, quiz &amp; dilemmes,
                discussions dans l'Agora. Des textes sourcés, des définitions vérifiées, une
                pédagogie pensée avec des enseignants et des psychologues.
              </p>

              <div className="flex flex-col gap-4">
                <a
                  href={METIS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 font-body text-xs md:text-sm tracking-[0.25em] uppercase px-8 py-4 bg-[#a8853a] text-[#f9f5ec] hover:bg-[#c9a44c] transition-colors w-fit shadow-lg"
                >
                  Apprendre sur Mètis
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>

                <a
                  href={METIS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 font-body text-xs md:text-sm tracking-[0.25em] uppercase px-8 py-3.5 border border-[#a8853a] text-[#8a6c2c] hover:bg-[#a8853a]/10 transition-colors w-fit"
                >
                  Découvrir metisapp.fr
                  <ArrowRight className="w-4 h-4" />
                </a>

                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#c9a44c]/15 border border-[#c9a44c]/40 rounded-sm w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#a8853a] animate-pulse" />
                  <p className="font-body text-sm text-[#6f5722] tracking-wide">
                    Gratuit pour commencer à explorer
                  </p>
                </div>
              </div>
            </div>

            {/* Aperçu */}
            <div className="relative border-t lg:border-t-0 lg:border-l border-[#c9a44c]/30">
              <img
                src={getAssetUrl(preview)}
                alt="Aperçu de l'application Mètis"
                loading="lazy"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>

          {/* Chiffres */}
          <div className="bg-[#332e26] px-6 md:px-12 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="font-display text-3xl md:text-4xl text-[#f2e8cf]">{s.value}</p>
                  <p className="font-body text-[10px] md:text-xs tracking-[0.25em] uppercase text-[#a89b7d] mt-2">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Fonctionnalités */}
          <div className="px-6 md:px-12 py-8 bg-[#f5f0e6]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {features.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 px-4 py-3 border border-[#c9a44c]/30 bg-[#faf6ee]"
                >
                  <Icon className="w-4 h-4 text-[#a8853a] shrink-0" />
                  <span className="font-body text-[11px] md:text-xs tracking-[0.15em] uppercase text-[#4a4438]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MetisBanner;
