import "./styles.css";
import { PageWrapper } from "../../components/wrapper";
import Icon, { TypeIcon } from "../../components/icon";
import Logo from "../../components/logo";

export interface ISocialNetworks {
  title: string; // Título de la red social
  icon: TypeIcon; // Icono de la red social
  link: string; // Enlace a la red social
}

const SOCIAL_NETWORKS: ISocialNetworks[] = [
  {
    title: "Twitter", // Título de la red social Twitter
    icon: "twitter", // Icono de Twitter
    link: "https://twitter.com", // Enlace a Twitter
  },
  {
    title: "Github", // Título de la red social Github
    icon: "github", // Icono de Github
    link: "https://github.com", // Enlace a Github
  },
  {
    title: "Linkedin", // Título de la red social Linkedin
    icon: "linkedin", // Icono de Linkedin
    link: "https://www.linkedin.com", // Enlace a Linkedin
  },
  {
    title: "Dev.to", // Título de la red social Dev.to
    icon: "devto", // Icono de Dev.to
    link: "https://dev.to", // Enlace a Dev.to
  },
  {
    title: "bio.link", // Título del enlace bio.link
    icon: "games", // Icono para bio.link
    link: "https://bio.link", // Enlace a bio.link
  },
];

const AboutPage = () => (
  <PageWrapper>
    <div className="about-game-body">
      <Logo />
      <p>
        Los orígenes de{" "}
        <a
          title="Ludo"
          href="https://en.wikipedia.org/wiki/Ludo"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ludo
        </a>{" "}
        se remontan a la antigua India, donde era conocido como "Pachisi."
        Inicialmente jugado por la realeza, pronto se hizo popular entre personas de todos los ámbitos. A medida que se extendió a otras regiones, incluyendo Inglaterra y los Estados Unidos, experimentó varias transformaciones y adaptaciones, evolucionando eventualmente en el querido juego que conocemos hoy como Ludo.
      </p>
      <p>
        Ludo React es un juego desarrollado por{" "}
        <a
          title=""
          href="https://twitter.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Grupo de Programacion web sabados
        </a>{" "}
        utilizando{" "}
        <a
          title="ReactJS"
          href="https://reactjs.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          ReactJS
        </a>{" "}
        y{" "}
        <a
          title="TypeScript"
          href="https://www.typescriptlang.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          TypeScript
        </a>
        , esta adaptación digital se mantiene fiel a la esencia del juego original mientras ofrece una experiencia fresca y atractiva para los jugadores modernos.
      </p>
    </div>
    <div className="about-game-social">
      {SOCIAL_NETWORKS.map(({ title, icon, link }, key) => (
        <a
          className="button yellow about-game-social-link"
          key={key}
          title={`Jorge Rubiano en ${title}`}
          href={link}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon type={icon} fill="#8b5f00" />
        </a>
      ))}
    </div>
  </PageWrapper>
);

export default AboutPage;