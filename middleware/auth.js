"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError("Unauthorized", 401);
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Require admin user.
 * 
 * If not, raise 401.
 */

function ensureAdmin(req, res, next) {
  try {
    if (!res.locals.user || !res.locals.user.isAdmin) throw new UnauthorizedError("Unauthorized", 401);
		return next();
  } catch (err) {
		return next(err);
	}
}

/** Require curr user = target user, or admin user.
 * 
 * If not, raise 401.
 */
function ensureMatchingUserOrAdmin(req, res, next) {
  let reqUser = req.params.username
  let currUser = res.locals.user
  try {
    if (!(currUser && (currUser.isAdmin || reqUser == currUser.username))) {
      throw new UnauthorizedError("Unauthorized", 401)
    } 
    return next();
  } catch (err) {
		return next(err);
  }
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureMatchingUserOrAdmin
};
