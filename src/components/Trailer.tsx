import { useState } from "react";
import { Play } from "lucide-react";
import { youtubeEmbedUrl } from "@/lib/course";

/**
 * Vidéo YouTube chargée seulement au clic : la page reste légère, et rien n'est
 * envoyé à YouTube tant que le visiteur n'a pas choisi de regarder.
 */
const Trailer = ({ youtubeId, title }: { youtubeId: string; title: string }) => {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="relative aspect-video bg-foreground/5 border border-border rounded-sm overflow-hidden shadow-lg">
      {playing ? (
        <iframe
          src={youtubeEmbedUrl(youtubeId, true)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      ) : (
        <button onClick={() => setPlaying(true)} className="group absolute inset-0 w-full h-full" aria-label={`Regarder : ${title}`}>
          <img
            src={`https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-bordeaux/90 text-primary-foreground shadow-xl transition-transform group-hover:scale-105">
            <Play className="w-7 h-7 md:w-8 md:h-8 ml-1" fill="currentColor" />
          </span>
          <span className="absolute left-4 bottom-3 md:left-6 md:bottom-5 font-body text-[11px] md:text-xs tracking-[0.25em] uppercase text-white/90">
            Bande-annonce · 2 min 25
          </span>
        </button>
      )}
    </div>
  );
};

export default Trailer;
