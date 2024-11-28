import { ROUTES } from "../utils/constants";
import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from "express";
import passport from "passport";
import PASSPORT_STRATEGIES, {
  Strategies,
} from "../controllers/passport/strategies";

const router = Router();

/**
 * Middleware que valida si el usuario ya está autenticado
 * @param req
 * @param res
 * @param next
 * @returns
 */
const isLoggedIn = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }

  next();
};

const urlRedirect = {
  successRedirect: ROUTES.SUCCESS_LOGIN,
  failureRedirect: ROUTES.SUCCESS_LOGIN,
};

/**
 * Router que se ejecuta cuando se ha realizado al autenticación del usuario...
 */
router.get<RequestHandler>(ROUTES.SUCCESS_LOGIN, (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/online");
  } else {
    res.redirect("/");
  }
});

/**
 * Router que trae la información del usuario que este auénticado...
 */
router.get<RequestHandler>(ROUTES.ME, (req, res) => {
  /**
   * Se establece si el usuario está auténticado...
   */
  const isAuth = req.isAuthenticated();

  /**
   * Se obtienen los datos de las estrategías de auteticación configuradas
   * y que estén habilitadas...
   */
  const authOptions = Object.keys(PASSPORT_STRATEGIES)
    .filter((v) => PASSPORT_STRATEGIES[v as Strategies].isEnabled)
    .map((v) => {
      const { socialName, routerURL } = PASSPORT_STRATEGIES[v as Strategies];
      return { socialName, routerURL };
    });

  const data = { isAuth, authOptions, user: {} };

  /**
   * Si está autenticado se obtiene la data del usuario y se agrega a la data
   * que se envía al cliente..
   */
  if (isAuth) {
    const { name, _id, photo } = req.user || {};
    data.user = { name, id: _id, photo };
  }

  /**
   * Se envía el JSON de la data al cliente..
   */
  res.json(data);
});

/**
 * Para hacer el logout del usuario...
 */
router.get<RequestHandler>(ROUTES.LOGOUT, (req, res) => {
  if (req.isAuthenticated()) {
    req.logOut();
  }

  res.redirect("/");
});

/**
 * Crear los routes de forma dinámica para las estrategías que estén configuradas
 * Por ejemplo si está configurado github sería:
 * router.get("/api/auth/github", passport.authenticate("github", scope));
 * router.get("/api/auth/github/callback", passport.authenticate("github", urlRedirect))
 */
Object.keys(PASSPORT_STRATEGIES).forEach((strategy) => {
  const { callbackURL, routerURL, socialName, scope, isEnabled } =
    PASSPORT_STRATEGIES[strategy as Strategies];

  /**
   * Se valida que la estrategía este habilitada...
   */
  if (isEnabled) {
    // Para la url que inicia el proceso de aitenticación con el servicio...
    router.get(routerURL, isLoggedIn, passport.authenticate(socialName, scope));

    // Ruta a la cual responde el servicio una vez se ha realizado la autenticación...
    router.get(callbackURL, passport.authenticate(socialName, urlRedirect));
  }
});

export default router;
