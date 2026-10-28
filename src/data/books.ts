// Contenu des pages livres : synopsis, personnages, pages à feuilleter.
import alineBoard from "@/assets/aline-board.jpg";
import hybrisInsidePage from "@/assets/hybris-inside-page.webp";
import hybrisPreface1 from "@/assets/hybris-preface-1.webp";
import hybrisPreface2 from "@/assets/hybris-preface-2.webp";
import sergueiBoard from "@/assets/serguei-board.jpg";
import mehranBoard from "@/assets/mehran-board.jpg";
import chatonCover from "@/assets/chaton-cover.webp";
import hybrisCoverAsset from "@/assets/hybris-cover.webp";
import hybrisEsmeWarrold from "@/assets/hybris-esme-warrold.webp";
import hybrisWolfgangWarrold from "@/assets/hybris-wolfgang-warrold.webp";
import hybrisJerichoCaelim from "@/assets/hybris-jericho-caelim.webp";
import hybrisHenryHills from "@/assets/hybris-henry-hills.webp";
import hybrisJohnHills from "@/assets/hybris-john-hills.webp";
import hybrisChristopheRetinguer from "@/assets/hybris-christophe-retinguer.webp";
import hybrisNoeRetinguer from "@/assets/hybris-noe-retinguer.webp";
import hybrisAdrielVarek from "@/assets/hybris-adriel-varek.webp";
import hybrisRaphaelVarek from "@/assets/hybris-raphael-varek.webp";
import hybrisGeorgeGassner from "@/assets/hybris-george-gassner.webp";
import hybrisLolaGassner from "@/assets/hybris-lola-gassner.webp";
import hybrisAvnerOrim from "@/assets/hybris-avner-orim.webp";
import hybrisZoharOrim from "@/assets/hybris-zohar-orim.webp";

export interface Character {
  name: string;
  description?: string;
  image?: string;
  playlists?: { youtube?: string; spotify?: string };
}

export interface BookData {
  title: string;
  slug: string;
  cover?: string;
  insidePage?: string;
  insidePages?: string[];
  synopsis: string[];
  characters: Character[];
  aesthetic: { image?: string; caption: string }[];
  links: { label: string; url: string }[];
  titleNote?: { heading: string; paragraphs: string[] };
  /** Mention affichée à la place des liens d'achat (ex. « Réédition en cours »). */
  notice?: string;
}

export const booksData: Record<string, BookData> = {
  chaton: {
    title: "Chaton",
    slug: "chaton",
    cover: chatonCover,
    synopsis: [
      "Aline, une adolescente de dix-sept ans, refuse le sort que sa misère veut lui imposer. Orpheline, elle a été placée dans une famille d'accueil où elle est maltraitée. Plutôt que de subir ce traitement, elle prend la fuite, quitte à se retrouver seule dans les rues. Par hasard, elle croise Sergueï, un homme lié à la mafia russe ; la Bratva. Pour survivre, elle tente de gagner sa confiance… Mais peut-elle vraiment compter sur lui ? Est-il digne de confiance, ou va-t-il, comme tant d'autres, la décevoir ?",
      "Cependant, le destin se montre cruel : l'ami le plus proche de Sergueï n'est autre que Mehran. Aline, qui croyait l'avoir relégué à son passé, n'est pas heureuse de le revoir. Leur confrontation ravive d'anciennes blessures et met à nu tous les enjeux psychologiques qui sous-tendent leurs relations.",
      "Vous suivrez leur aventure à tous les trois, et verrez comment leurs destins s'entrelacent. Leur histoire commune révélera ce qu'il y a de plus beau… mais aussi de plus vil, dans l'âme humaine, à travers un triangle où se mêlent victime, bourreau et sauveur. C'est également l'histoire du passé d'Aline, qui sera la protagoniste de mon prochain Roman : HYBRIS",
    ],
    characters: [
      {
        name: "Aline",
        description: "Dix-sept ans, orpheline et survivante. Derrière sa fragilité apparente se cache une détermination farouche. Elle refuse de se laisser briser par un système qui l'a abandonnée.",
        image: alineBoard,
        playlists: {
          spotify: "https://open.spotify.com/playlist/2HzMHOqamfWnn09oICbuGb?si=c05c211d48b740fe",
          youtube: "https://youtu.be/haSMlCQq-Ns?si=Ra0pR2HIBU8URwCP",
        },
      },
      {
        name: "Sergueï",
        description: "Lié à la Bratva, Sergueï est un homme aux multiples facettes. Protecteur ou manipulateur ? La frontière est mince, et Aline devra apprendre à la discerner.",
        image: sergueiBoard,
        playlists: {
          spotify: "https://open.spotify.com/playlist/5HbgWkhWwq43JBtq00dUIn?si=f9515048a74f4b37",
          youtube: "https://youtu.be/dlWi9a5i4-0?si=RPm_jx9VJFjHCOVG",
        },
      },
      {
        name: "Mehran",
        description: "L'ami le plus proche de Sergueï, et un fantôme du passé d'Aline. Son retour vient interrompre le déroulement des évènements en la faveur d'Aline.",
        image: mehranBoard,
        playlists: {
          spotify: "https://open.spotify.com/playlist/6KVhTXNzVZlYMIRI4NdzPK?si=59b63e65c1004c8e",
          youtube: "https://youtu.be/zZzXXM_9uW4?si=UMx0uaNwAuoxomS1",
        },
      },
    ],
    aesthetic: [],
    links: [],
    notice: "Réédition en cours",
  },
  hybris: {
    title: "Hybris",
    slug: "hybris",
    cover: hybrisCoverAsset,
    insidePage: hybrisInsidePage,
    insidePages: [hybrisInsidePage, hybrisPreface1, hybrisPreface2],
    synopsis: [
      "Wolfgang est un multi-milliardaire dans l'industrie de l'armement, appartenant à un ordre secret : les Sybarites. En son sein, des familles extrêmement puissantes complotent pour l'instauration d'un Nouvel Ordre Mondial. La dernière étape de leur plan millénaire est la Troisième Guerre Mondiale. À la suite de cet événement, tous les peuples devraient aspirer à la prétendue Paix Universelle qu'ils s'apprêteront, alors, à leur proposer.",
      "Cependant, la table hexagonale de ce nouvel ordre ne compte que six places, et les familles sont au nombre de sept. Wolfgang aurait dû se retirer du jeu après son grand final, et marier sa fille à John Hills, pour faire perdurer son sang, mais pas son nom, en son sein. Seulement, espérer qu'un être semblable à Mars s'efface sans demander son reste était illusoire. Il ne tirera pas sa révérence si aisément ; aussi décide-t-il d'anéantir les familles supérieures de l'Ordre Sybarite.",
      "Pour les éliminer, il engage une jeune espionne et tireuse d'élite : Aline. Il la fera passer pour sa fille, et elle deviendra ainsi Esmé. Elle devra s'infiltrer dans les demeures de chacune des familles, en découvrir les secrets, et y déposer des explosifs sans être démasquée.",
    ],
    characters: [
      { name: "Wolfgang Warrold", image: hybrisWolfgangWarrold, playlists: { spotify: "https://open.spotify.com/playlist/1vHaaXlyaKsYnYyDKtLLgs?si=7d4d6f1fddaa4ebf" } },
      { name: "Esmé Warrold (Aline)", image: hybrisEsmeWarrold, playlists: { spotify: "https://open.spotify.com/playlist/1eUrFx0cKhpv8BieyJF19H?si=fb96249123984ab6" } },
      { name: "John Hills", image: hybrisJohnHills, playlists: { spotify: "https://open.spotify.com/playlist/79SMJodbk9eKPzbYcqTh5B?si=e9c8a48bb5974657" } },
      { name: "Henry Hills", image: hybrisHenryHills, playlists: { spotify: "https://open.spotify.com/playlist/4LJ3HXiLuVQbDMe4QP8dlF?si=1333a04771924921" } },
      { name: "Adriel Varek", image: hybrisAdrielVarek, playlists: { spotify: "https://open.spotify.com/playlist/339TbdVchG6cP7ijwipuGT?si=ba585f2249c24c93" } },
      { name: "Raphaël Varek", image: hybrisRaphaelVarek, playlists: { spotify: "https://open.spotify.com/playlist/6hiVj0ETszTpjdDMw0FpNV?si=0a6387bca1e64c3a" } },
      { name: "George Gassner", image: hybrisGeorgeGassner, playlists: { spotify: "https://open.spotify.com/playlist/5jp6NvuyFLiPYYDSbKD2eh?si=82679474a2494fbc" } },
      { name: "Lola Gassner", image: hybrisLolaGassner, playlists: { spotify: "https://open.spotify.com/playlist/3iH4XyL36FLR5f5fFq1t5W?si=b1a8572a3f7d4eed" } },
      { name: "Avner Orim", image: hybrisAvnerOrim, playlists: { spotify: "https://open.spotify.com/playlist/3YAQQGXKz1RVB56YB0GZgm?si=0a02ff6d966d46d9" } },
      { name: "Zohar Orim", image: hybrisZoharOrim, playlists: { spotify: "https://open.spotify.com/playlist/4YOO7flD6virAR187TAqWR?si=c86ba4f9833445cb" } },
      { name: "Christophe Retinguer", image: hybrisChristopheRetinguer, playlists: { spotify: "https://open.spotify.com/playlist/6A5ZYPEpBKOXqN2xRGYeuh?si=4366d1e14190496a" } },
      { name: "Noé Retinguer", image: hybrisNoeRetinguer, playlists: { spotify: "https://open.spotify.com/playlist/65UgZ20HKjTcaa15ICFTp8?si=b463c92e0f9e4996" } },
      { name: "Jéricho Caëlim", image: hybrisJerichoCaelim, playlists: { spotify: "https://open.spotify.com/playlist/3RTJrrB98tWyLluf1zuTio?si=5fefc8d3454843ac" } },
    ],
    aesthetic: [],
    links: [],
    titleNote: {
      heading: "Pourquoi le titre Hybris ?",
      paragraphs: [
        "ὕβρις : démesure, outrage, péché d'orgueil.",
        "Ce livre est à l'image de la démesure de certains grands de ce monde, et il est né lui-même d'une ambition démesurée : la mienne.",
        "La protagoniste, bien qu'orpheline, s'élèvera également au rang le plus haut de la société ; si haut qu'elle pensera un instant faire partie des Dieux. Ainsi ce livre est nommé : Hybris, en honneur à ce péché.",
        "L'hybris est le mouvement fautif de dépassement de la limite. Du point de vue philosophique et moral, c'est la tentation de démesure ou de folie imprudente des humains, tentés de rivaliser avec les dieux.",
        "La démesure désigne le fait de désirer plus que ce que la juste mesure du destin nous a attribué. Ceci vaut en général, dans la mythologie grecque, de terribles punitions de leur part. Le châtiment de l'hybris, par les dieux, est la némésis, qui fait se rétracter l'individu à l'intérieur des limites qu'il a franchies. La mythologie regorge de récits mettant en scène un personnage puni pour son hybris envers les dieux.",
      ],
    },
  },
};
