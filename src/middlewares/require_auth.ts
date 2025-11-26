import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app_error";
import firebase from "./firebase";

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        throw new AppError('Missing or incorrectly formatted authentication token.', 401);
    }

    const idToken = header.split('Bearer ')[1];

    if (!idToken || idToken.trim().length === 0) {
        throw new AppError('Authentication token value is missing.', 401);
    }

    const decodedToken = await firebase.auth().verifyIdToken(idToken);

    req.user = decodedToken;

    await firebase.auth().setCustomUserClaims(decodedToken.uid, {role: 'admin'});

    next();
};
